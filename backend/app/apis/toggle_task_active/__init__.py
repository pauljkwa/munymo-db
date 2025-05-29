# src/app/apis/toggle_task_active/__init__.py
# This module is imported directly by the scheduler module
# The endpoint is mounted via the scheduler router, not directly

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import databutton as db
from datetime import datetime
from app.apis.auth_utils import require_permission
from app.apis.admin_permissions import Permissions
from app.apis.predictions_api import get_supabase_admin_client

# Create router - not directly mounted
router = APIRouter()

# Constants for Supabase tables (must match scheduler constants)
SCHEDULER_CONFIG_TABLE = "scheduler_config"
MASTER_SCHEDULE_KEY = "scheduler_master_config"

# Models
class ToggleTaskRequest(BaseModel):
    task_id: str
    is_active: bool

class ToggleTaskResponse(BaseModel):
    success: bool
    message: str
    task_id: str
    is_active: bool

# Helper functions to avoid circular imports
def get_scheduler_config_local():
    """Get scheduler config from Supabase - local version to avoid circular imports"""
    try:
        # First try to get from Supabase
        try:
            supabase = get_supabase_admin_client()
            response = supabase.table(SCHEDULER_CONFIG_TABLE) \
                .select("value") \
                .eq("key", MASTER_SCHEDULE_KEY) \
                .limit(1) \
                .execute()
                
            if response.data and len(response.data) > 0:
                config_data = response.data[0].get("value")
                if config_data:
                    from app.apis.scheduler import SchedulerConfig
                    return SchedulerConfig(**config_data)
        except Exception as e:
            print(f"[ERROR] Failed to get scheduler config from Supabase: {e}")
            print(f"[INFO] Falling back to Databutton storage")
        
        # Try Databutton as fallback
        config_data = db.storage.json.get(MASTER_SCHEDULE_KEY, default=None)
        if config_data:
            from app.apis.scheduler import SchedulerConfig
            return SchedulerConfig(**config_data)
        
        # If no config anywhere, create default
        from app.apis.scheduler import SchedulerConfig
        return SchedulerConfig()
    except Exception as e:
        print(f"[ERROR] Failed to get scheduler config: {e}")
        from app.apis.scheduler import SchedulerConfig
        return SchedulerConfig()

def save_scheduler_config_local(config):
    """Save scheduler config to Supabase - local version to avoid circular imports"""
    try:
        config_data = config.model_dump()
        now = datetime.utcnow().isoformat()
        
        # Save to Supabase
        try:
            supabase = get_supabase_admin_client()
            
            # Check if record exists
            response = supabase.table(SCHEDULER_CONFIG_TABLE) \
                .select("id") \
                .eq("key", MASTER_SCHEDULE_KEY) \
                .execute()
                
            if response.data and len(response.data) > 0:
                # Update existing record
                supabase.table(SCHEDULER_CONFIG_TABLE) \
                    .update({"value": config_data, "last_updated": now}) \
                    .eq("key", MASTER_SCHEDULE_KEY) \
                    .execute()
            else:
                # Insert new record
                supabase.table(SCHEDULER_CONFIG_TABLE) \
                    .insert({
                        "key": MASTER_SCHEDULE_KEY, 
                        "value": config_data,
                        "created_at": now,
                        "last_updated": now
                    }) \
                    .execute()
        except Exception as supabase_error:
            print(f"[ERROR] Failed to save scheduler config to Supabase: {supabase_error}")
            # Fall back to Databutton storage if Supabase fails
            db.storage.json.put(MASTER_SCHEDULE_KEY, config_data)
            return
            
        # Also save to Databutton for backward compatibility during migration
        try:
            db.storage.json.put(MASTER_SCHEDULE_KEY, config_data)
        except Exception as db_error:
            print(f"[WARNING] Failed to save to Databutton fallback: {db_error}")
    except Exception as e:
        print(f"[ERROR] Failed to save scheduler config: {e}")
        raise

@router.post("/toggle-task-active2", response_model=ToggleTaskResponse)
async def toggle_task_active2(
    request: ToggleTaskRequest,
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """Toggle a task's active status"""
    try:
        from datetime import datetime  # Import here to avoid circular imports
        config = get_scheduler_config_local()
        
        # Find the task
        found = False
        for task in config.tasks:
            if task.task_id == request.task_id:
                task.is_active = request.is_active
                found = True
                break
                
        if not found:
            raise HTTPException(status_code=404, detail=f"Task with ID {request.task_id} not found")
            
        # Save updated config
        save_scheduler_config_local(config)
        
        return ToggleTaskResponse(
            success=True,
            message=f"Task {request.task_id} set to {'active' if request.is_active else 'inactive'}",
            task_id=request.task_id,
            is_active=request.is_active
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle task active state: {str(e)}")