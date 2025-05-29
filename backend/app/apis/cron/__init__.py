# src/app/apis/cron/__init__.py

from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import databutton as db
from typing import Dict, Any, List, Optional
import traceback
import sys

# Import scheduler functions
from app.apis.scheduler import check_and_run_scheduled_tasks
from app.apis.auth_utils import require_permission
from app.apis.admin_permissions import Permissions
from app.apis.predictions_api import get_supabase_admin_client

# Create router
router = APIRouter(prefix="/cron", tags=["cron"])

# Constants for Supabase
SCHEDULER_CONFIG_TABLE = "scheduler_config"  # Same table as scheduler config
CRON_CONFIG_KEY = "cron_config"  # Key within the table
LAST_CRON_RUN_KEY = "last_cron_run"  # Legacy key

# Models
class CronConfig(BaseModel):
    interval_minutes: int = 5  # How often the cron should run
    is_enabled: bool = True    # Whether the cron is enabled
    last_run: Optional[str] = None  # ISO format datetime

class CronStatusResponse(BaseModel):
    is_enabled: bool
    interval_minutes: int
    last_run: Optional[str] = None
    next_run: Optional[str] = None
    current_time: str

# Helper functions
def get_cron_config() -> CronConfig:
    """Get the current cron configuration from Supabase"""
    try:
        # First try to get from Supabase
        try:
            supabase = get_supabase_admin_client()
            response = supabase.table(SCHEDULER_CONFIG_TABLE) \
                .select("value") \
                .eq("key", CRON_CONFIG_KEY) \
                .limit(1) \
                .execute()
                
            if response.data and len(response.data) > 0:
                config_data = response.data[0].get("value")
                if config_data:
                    return CronConfig(**config_data)
        except Exception as e:
            print(f"[ERROR] Failed to get cron config from Supabase: {e}")
            print(f"[INFO] Falling back to Databutton storage")
            # Fall back to Databutton storage if Supabase fails
        
        # Try Databutton as fallback
        config_data = db.storage.json.get(CRON_CONFIG_KEY, default=None)
        if config_data:
            return CronConfig(**config_data)
        
        # If no config anywhere, create a default one
        config = CronConfig()
        save_cron_config(config)
        return config
    except Exception as e:
        print(f"[ERROR] Failed to get cron config: {e}")
        return CronConfig()

def save_cron_config(config: CronConfig):
    """Save the cron configuration to Supabase"""
    try:
        config_data = config.model_dump()
        now = datetime.utcnow().isoformat()
        
        # Save to Supabase
        try:
            supabase = get_supabase_admin_client()
            
            # Check if record exists
            response = supabase.table(SCHEDULER_CONFIG_TABLE) \
                .select("id") \
                .eq("key", CRON_CONFIG_KEY) \
                .execute()
                
            if response.data and len(response.data) > 0:
                # Update existing record
                supabase.table(SCHEDULER_CONFIG_TABLE) \
                    .update({"value": config_data, "last_updated": now}) \
                    .eq("key", CRON_CONFIG_KEY) \
                    .execute()
            else:
                # Insert new record
                supabase.table(SCHEDULER_CONFIG_TABLE) \
                    .insert({
                        "key": CRON_CONFIG_KEY, 
                        "value": config_data,
                        "created_at": now,
                        "last_updated": now
                    }) \
                    .execute()
        except Exception as supabase_error:
            print(f"[ERROR] Failed to save cron config to Supabase: {supabase_error}")
            # Fall back to Databutton storage if Supabase fails
            db.storage.json.put(CRON_CONFIG_KEY, config_data)
            print("[INFO] Saved cron config to Databutton fallback storage")
            return
            
        # Also save to Databutton for backward compatibility during migration
        try:
            db.storage.json.put(CRON_CONFIG_KEY, config_data)
        except Exception as db_error:
            print(f"[WARNING] Failed to save to Databutton fallback: {db_error}")
            # Already saved to Supabase, so this isn't critical
    except Exception as e:
        print(f"[ERROR] Failed to save cron config: {e}")
        raise

def update_last_run(current_time: datetime = None):
    """Update the last run time"""
    if current_time is None:
        current_time = datetime.utcnow()
        
    try:
        config = get_cron_config()
        config.last_run = current_time.isoformat()
        save_cron_config(config)
    except Exception as e:
        print(f"[ERROR] Failed to update last run time: {e}")

def should_run_cron() -> bool:
    """Check if it's time to run the cron based on the configuration"""
    try:
        config = get_cron_config()
        
        # Skip if cron is disabled
        if not config.is_enabled:
            return False
            
        now = datetime.utcnow()
        
        # If no last run, run now
        if not config.last_run:
            return True
            
        last_run = datetime.fromisoformat(config.last_run)
        interval = timedelta(minutes=config.interval_minutes)
        
        # Run if the interval has passed
        return now - last_run >= interval
    except Exception as e:
        print(f"[ERROR] Error checking if cron should run: {e}")
        return False

# API Endpoints
@router.get("/status", response_model=CronStatusResponse)
async def get_cron_status(current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Get the current status of the cron job"""
    try:
        config = get_cron_config()
        now = datetime.utcnow()
        
        # Calculate next run time
        next_run = None
        if config.last_run:
            last_run = datetime.fromisoformat(config.last_run)
            interval = timedelta(minutes=config.interval_minutes)
            next_run = (last_run + interval).isoformat()
        
        return CronStatusResponse(
            is_enabled=config.is_enabled,
            interval_minutes=config.interval_minutes,
            last_run=config.last_run,
            next_run=next_run,
            current_time=now.isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cron status: {str(e)}")

@router.post("/enable")
async def enable_cron(current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Enable the cron job"""
    try:
        config = get_cron_config()
        config.is_enabled = True
        save_cron_config(config)
        return {"success": True, "message": "Cron job enabled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enable cron job: {str(e)}")

@router.post("/disable")
async def disable_cron(current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Disable the cron job"""
    try:
        config = get_cron_config()
        config.is_enabled = False
        save_cron_config(config)
        return {"success": True, "message": "Cron job disabled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to disable cron job: {str(e)}")

@router.post("/set-interval")
async def set_cron_interval(
    interval_minutes: int,
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """Set the interval for the cron job"""
    if interval_minutes < 1:
        raise HTTPException(status_code=400, detail="Interval must be at least 1 minute")
        
    try:
        config = get_cron_config()
        config.interval_minutes = interval_minutes
        save_cron_config(config)
        return {"success": True, "message": f"Cron interval set to {interval_minutes} minutes"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set cron interval: {str(e)}")

# Primary cron trigger endpoint
@router.post("/trigger")
async def trigger_cron(background_tasks: BackgroundTasks, run_now: bool = False):
    """Trigger the cron job to run all scheduled tasks"""
    try:
        # Check if it's time to run the cron
        if not run_now and not should_run_cron():
            return {"success": True, "message": "Skipped cron run (not due yet)", "timestamp": datetime.utcnow().isoformat()}
        
        # Update last run time
        now = datetime.utcnow()
        update_last_run(now)
        
        # Run scheduled tasks check
        await check_and_run_scheduled_tasks(background_tasks)
        
        return {"success": True, "message": "Cron job triggered", "timestamp": now.isoformat()}
    except Exception as e:
        error_msg = f"Failed to trigger cron job: {str(e)}"
        print(f"[ERROR] {error_msg}")
        traceback.print_exc(file=sys.stdout)
        raise HTTPException(status_code=500, detail=error_msg)

# Manual trigger (used by admins)
@router.post("/run-now")
async def run_cron_now(background_tasks: BackgroundTasks, current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Manually trigger the cron job to run immediately"""
    return await trigger_cron(background_tasks, run_now=True)

# Migration endpoint
@router.post("/migrate-to-supabase")
async def migrate_cron_to_supabase(current_user_id: str = Depends(require_permission(Permissions.MANAGE_SYSTEM))):
    """Migrate cron configuration from Databutton to Supabase"""
    try:
        # Get cron config from Databutton
        try:
            config_data = db.storage.json.get(CRON_CONFIG_KEY, default=None)
            if not config_data:
                return {"status": "success", "message": "No cron config to migrate"}
                
            config = CronConfig(**config_data)
            print(f"[INFO] Retrieved cron config from Databutton")
        except Exception as e:
            return {"status": "error", "message": f"Failed to get cron config from Databutton: {str(e)}"}
        
        # Save cron config to Supabase
        try:
            supabase = get_supabase_admin_client()
            now = datetime.utcnow().isoformat()
            
            # Check if the config already exists in Supabase
            response = supabase.table(SCHEDULER_CONFIG_TABLE) \
                .select("id") \
                .eq("key", CRON_CONFIG_KEY) \
                .limit(1) \
                .execute()
                
            if response.data and len(response.data) > 0:
                # Update existing record
                print(f"[INFO] Updating existing cron config in Supabase")
                supabase.table(SCHEDULER_CONFIG_TABLE) \
                    .update({"value": config.model_dump(), "last_updated": now}) \
                    .eq("key", CRON_CONFIG_KEY) \
                    .execute()
            else:
                # Insert new record
                print(f"[INFO] Creating new cron config in Supabase")
                supabase.table(SCHEDULER_CONFIG_TABLE) \
                    .insert({
                        "key": CRON_CONFIG_KEY,
                        "value": config.model_dump(),
                        "created_at": now,
                        "last_updated": now
                    }) \
                    .execute()
        except Exception as e:
            return {"status": "error", "message": f"Failed to save cron config to Supabase: {str(e)}"}
        
        return {
            "status": "success", 
            "message": "Successfully migrated cron configuration to Supabase"
        }
    except Exception as e:
        return {"status": "error", "message": f"Migration failed: {str(e)}"}

