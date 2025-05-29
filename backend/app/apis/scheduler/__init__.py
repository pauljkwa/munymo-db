# src/app/apis/scheduler/__init__.py

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
import databutton as db
from datetime import datetime, date, timedelta, time
import pytz
import traceback
import sys
from typing import List, Dict, Any, Optional, Callable
import re

# Import relevant APIs
from app.apis.sandbox_control import is_sandbox_mode
from app.apis.company_discovery import get_next_trading_day, is_trading_day
from app.apis.game_generation import generate_game, generate_upcoming_games_task
from app.apis.results_api import finalize_game_results
from app.apis.auth_utils import require_permission
from app.apis.admin_permissions import Permissions
from app.apis.predictions_api import get_supabase_admin_client, get_supabase_client
from app.apis.fcm_api import send_admin_notification  # For admin notifications
from app.apis.documentation import get_scheduler_documentation  # Import from main documentation module

# Create router
router = APIRouter(prefix="/scheduler", tags=["scheduler"])

# Constants for Supabase tables
SCHEDULER_CONFIG_TABLE = "scheduler_config"
SCHEDULER_ERRORS_TABLE = "scheduler_errors"

# Constants for keys within Supabase tables
MASTER_SCHEDULE_KEY = "scheduler_master_config"
ERROR_LOG_KEY = "scheduler_error_log"
MAX_ERROR_LOG_ENTRIES = 100  # Maximum number of error log entries to keep

# Model definitions
class SchedulerTask(BaseModel):
    """Defines a scheduled task that should run at specific times"""
    task_id: str
    task_type: str  # 'process_results', 'generate_games', 'update_clue', 'custom'
    exchange: str   # 'ASX', 'NYSE', etc.
    hour_utc: int
    minute_utc: int
    is_active: bool = True
    last_run: Optional[str] = None  # ISO format UTC datetime
    next_run: Optional[str] = None  # ISO format UTC datetime
    custom_params: Optional[Dict[str, Any]] = None

class SchedulerConfig(BaseModel):
    """Overall scheduler configuration"""
    tasks: List[SchedulerTask] = []
    is_enabled: bool = True
    is_initialized: bool = False
    sandbox_mode_enabled: bool = False  # Whether scheduling should run in sandbox mode

class TaskResponse(BaseModel):
    """Response for task-related operations"""
    success: bool
    message: str
    task_id: Optional[str] = None

class SchedulerStatusResponse(BaseModel):
    """Status response for the scheduler"""
    is_enabled: bool
    is_initialized: bool
    sandbox_mode_enabled: bool
    sandbox_mode_active: bool
    tasks: List[SchedulerTask]
    current_time_utc: str
    recent_errors: Optional[List[Dict[str, Any]]] = None

# Initialization function
def initialize_scheduler() -> SchedulerConfig:
    """Initialize the scheduler with default tasks if not already configured"""
    try:
        # Try to get existing config
        config = get_scheduler_config()
        if config and config.is_initialized:
            print(f"[INFO] Scheduler already initialized with {len(config.tasks)} tasks")
            return config
            
        # Setup default schedule for ASX
        asx_process_results = SchedulerTask(
            task_id="asx_process_results",
            task_type="process_results",
            exchange="ASX",
            hour_utc=8,  # Around 6:00 PM AEST (UTC+10)
            minute_utc=0,
            is_active=True
        )
        
        asx_generate_games = SchedulerTask(
            task_id="asx_generate_games",
            task_type="generate_games",
            exchange="ASX",
            hour_utc=9,  # Around 7:00 PM AEST (UTC+10)
            minute_utc=0,
            is_active=True
        )
        
        # Add clue update task for ASX weekend/holidays
        asx_update_clue = SchedulerTask(
            task_id="asx_update_clue",
            task_type="update_clue",
            exchange="ASX",
            hour_utc=10,  # Around 8:00 PM AEST (UTC+10)
            minute_utc=0,
            is_active=True
        )
        
        # Setup default schedule for NYSE
        nyse_process_results = SchedulerTask(
            task_id="nyse_process_results",
            task_type="process_results",
            exchange="NYSE",
            hour_utc=21,  # Around 4:00 PM EST (UTC-5 or UTC-4 DST)
            minute_utc=0,
            is_active=True
        )
        
        nyse_generate_games = SchedulerTask(
            task_id="nyse_generate_games",
            task_type="generate_games",
            exchange="NYSE",
            hour_utc=22,  # Around 5:00 PM EST (UTC-5 or UTC-4 DST)
            minute_utc=0,
            is_active=True
        )
        
        # Add clue update task for NYSE weekend/holidays
        nyse_update_clue = SchedulerTask(
            task_id="nyse_update_clue",
            task_type="update_clue",
            exchange="NYSE", 
            hour_utc=23,  # Around 6:00 PM EST (UTC-5 or UTC-4 DST)
            minute_utc=0,
            is_active=True
        )
        
        # Create new config with default tasks
        config = SchedulerConfig(
            tasks=[
                asx_process_results, 
                asx_generate_games, 
                asx_update_clue,
                nyse_process_results, 
                nyse_generate_games,
                nyse_update_clue
            ],
            is_enabled=True,
            is_initialized=True,
            sandbox_mode_enabled=is_sandbox_mode()  # Default to current app mode
        )
        
        # Save config
        save_scheduler_config(config)
        print(f"[INFO] Scheduler initialized with {len(config.tasks)} default tasks")
        return config
        
    except Exception as e:
        print(f"[ERROR] Failed to initialize scheduler: {e}")
        traceback.print_exc(file=sys.stdout)
        # Return a basic config if initialization fails
        return SchedulerConfig(is_initialized=False)

# Scheduler state management
def get_scheduler_config() -> SchedulerConfig:
    """Get the current scheduler configuration from Supabase"""
    try:
        # Try to get from Supabase first
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
                    return SchedulerConfig(**config_data)
        except Exception as e:
            print(f"[ERROR] Failed to get scheduler config from Supabase: {e}")
            print(f"[INFO] Falling back to Databutton storage")
            # Fall back to Databutton storage for backward compatibility
        
        # Try Databutton as fallback
        config_data = db.storage.json.get(MASTER_SCHEDULE_KEY, default=None)
        if config_data:
            return SchedulerConfig(**config_data)
            
        # If no configuration anywhere, return default
        return SchedulerConfig()
    except Exception as e:
        print(f"[ERROR] Failed to get scheduler config: {e}")
        return SchedulerConfig()

def save_scheduler_config(config: SchedulerConfig):
    """Save the scheduler configuration to Supabase"""
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
            print("[INFO] Saved scheduler config to Databutton fallback storage")
            return
            
        # Also save to Databutton for backward compatibility during migration
        try:
            db.storage.json.put(MASTER_SCHEDULE_KEY, config_data)
        except Exception as db_error:
            print(f"[WARNING] Failed to save to Databutton fallback: {db_error}")
            # Already saved to Supabase, so this isn't critical
    except Exception as e:
        print(f"[ERROR] Failed to save scheduler config: {e}")
        raise

def update_task_timing(task_id: str, last_run: datetime = None, next_run: datetime = None):
    """Update the last run and next run times for a specific task"""
    try:
        config = get_scheduler_config()
        
        # Find the task
        for task in config.tasks:
            if task.task_id == task_id:
                if last_run:
                    task.last_run = last_run.isoformat()
                if next_run:
                    task.next_run = next_run.isoformat()
                break
        
        # Save updated config
        save_scheduler_config(config)
    except Exception as e:
        print(f"[ERROR] Failed to update task timing for {task_id}: {e}")

# Task execution logic
async def execute_task(task: SchedulerTask, background_tasks: BackgroundTasks = None):
    """Execute a scheduled task based on its type"""
    now = datetime.utcnow()
    print(f"[INFO] Executing {task.task_type} task for {task.exchange} at {now.isoformat()}")
    
    try:
        if task.task_type == "process_results":
            # Process results for yesterday's game
            yesterday = date.today() - timedelta(days=1)
            
            # Only process if yesterday was a trading day
            if is_trading_day(task.exchange, yesterday):
                await process_game_results_for_date(task.exchange, yesterday)
            else:
                print(f"[INFO] {yesterday.isoformat()} was not a trading day for {task.exchange}, skipping results processing")
                
        elif task.task_type == "generate_games":
            # Generate games for the next trading day
            # This is already handled by generate_upcoming_games_task which checks for trading days
            if background_tasks:
                background_tasks.add_task(generate_upcoming_games_task, 1)
                print(f"[INFO] Added game generation task for {task.exchange} to background tasks")
            else:
                generate_upcoming_games_task(1)
                print(f"[INFO] Generated games for {task.exchange}")
                
        elif task.task_type == "update_clue":
            # Handle generating/updating clues for non-trading days
            today = date.today()
            tomorrow = today + timedelta(days=1)
            
            # Check if tomorrow is a trading day
            if not is_trading_day(task.exchange, tomorrow):
                # Tomorrow is not a trading day (weekend or holiday)
                # Ensure we have a clue for non-trading day
                await ensure_next_day_clue_available(task.exchange, tomorrow)
            else:
                print(f"[INFO] {tomorrow.isoformat()} is a trading day for {task.exchange}, no need for special clue update")
                
        elif task.task_type == "custom" and task.custom_params:
            # Handle custom task types
            print(f"[INFO] Executing custom task with params: {task.custom_params}")
            # Implement custom task handling here
            pass
            
        # Update the last run time
        update_task_timing(task.task_id, last_run=now)
        
        # Calculate next run time
        next_run_date = calculate_next_run_time(task)
        update_task_timing(task.task_id, next_run=next_run_date)
        
        return TaskResponse(success=True, message=f"Successfully executed {task.task_type} task for {task.exchange}", task_id=task.task_id)
        
    except Exception as e:
        error_message = f"Failed to execute {task.task_id} task: {str(e)}"
        print(f"[ERROR] {error_message}")
        traceback.print_exc(file=sys.stdout)
        
        # Log the error and notify admins
        log_scheduler_error(task.task_id, task.task_type, task.exchange, str(e), traceback.format_exc())
        
        # Still update the last run time to prevent continuous retries on failure
        update_task_timing(task.task_id, last_run=now)
        return TaskResponse(success=False, message=error_message, task_id=task.task_id)

def calculate_next_run_time(task: SchedulerTask) -> datetime:
    """Calculate the next run time for a task based on its schedule"""
    now = datetime.utcnow()
    
    # Create a datetime for the scheduled time today
    scheduled_time = datetime(now.year, now.month, now.day, task.hour_utc, task.minute_utc)
    
    # If the scheduled time is in the past, set it for tomorrow
    if scheduled_time <= now:
        scheduled_time += timedelta(days=1)
        
    return scheduled_time

async def ensure_next_day_clue_available(exchange: str, target_date: date):
    """Ensure a next_day_clue is available for non-trading days"""
    try:
        table_name = "asx_games" if exchange.upper() == "ASX" else "nyse_games"
        supabase = get_supabase_admin_client()
        target_date_str = target_date.isoformat()
        
        # First check if we already have a game entry for the target date
        response = supabase.table(table_name) \
            .select("game_id, next_day_clue") \
            .eq("game_date", target_date_str) \
            .limit(1) \
            .execute()
            
        if response.data and len(response.data) > 0:
            print(f"[INFO] Game entry already exists for {exchange} on {target_date_str}, checking if clue exists")
            # Check if next_day_clue exists
            game = response.data[0]
            if game.get("next_day_clue"):
                print(f"[INFO] Next day clue already exists for {exchange} on {target_date_str}")
                return
                
            # Clue doesn't exist, generate one
            game_id = game.get("game_id")
            if not game_id:
                print(f"[WARNING] Game found but game_id is missing for {exchange} on {target_date_str}")
                return
                
            # Generate a clue for the existing game
            print(f"[INFO] Generating clue for existing game {game_id} on {target_date_str}")
            clue = generate_next_day_clue(exchange)
            
            # Update the game with the clue
            supabase.table(table_name) \
                .update({"next_day_clue": clue}) \
                .eq("game_id", game_id) \
                .execute()
                
            print(f"[INFO] Successfully updated clue for {exchange} game {game_id} on {target_date_str}")
            return
            
        # No game entry exists for this date, create a placeholder entry
        print(f"[INFO] No game entry exists for {exchange} on {target_date_str}, creating placeholder")
        
        # Generate a clue
        clue = generate_next_day_clue(exchange)
        
        # Get the next trading day after the target date
        next_trading_day = get_next_trading_day(exchange, target_date)
        next_trading_day_str = next_trading_day.isoformat()
        
        # Create placeholder game entry
        new_game = {
            "game_date": target_date_str,
            "exchange": exchange,
            "status": "placeholder",  # Special status for placeholders
            "next_day_clue": clue,
            "notes": f"Placeholder for non-trading day. Next trading day: {next_trading_day_str}"
        }
        
        result = supabase.table(table_name).insert(new_game).execute()
        
        if result.data and len(result.data) > 0:
            print(f"[INFO] Successfully created placeholder game with clue for {exchange} on {target_date_str}")
        else:
            print(f"[WARNING] Failed to create placeholder game for {exchange} on {target_date_str}")
            
    except Exception as e:
        print(f"[ERROR] Failed to ensure next day clue for {exchange} on {target_date}: {e}")
        traceback.print_exc(file=sys.stdout)
        raise
        
def generate_next_day_clue(exchange: str) -> str:
    """Generate a next day clue for non-trading days"""
    # This could be enhanced with more sophisticated clue generation,
    # potentially using the company_discovery module to get sector information
    # For now, we'll use simple static clues
    
    clues = [
        "Technology Sector",
        "Healthcare Companies",
        "Financial Services",
        "Consumer Goods",
        "Industrial Sector",
        "Energy Companies",
        "Telecommunications",
        "Utilities Sector",
        "Real Estate",
        "Materials Companies"
    ]
    
    # Use a seeded random based on date to ensure consistency
    seed = int(datetime.now().strftime('%Y%m%d')) + (0 if exchange == "ASX" else 1)
    import random
    random.seed(seed)
    
    return random.choice(clues)

def log_scheduler_error(task_id: str, task_type: str, exchange: str, error_message: str, stack_trace: str = None):
    """Log a scheduler error to Supabase and notify admins"""
    try:
        # Create error entry
        now = datetime.utcnow().isoformat()
        error_entry = {
            "timestamp": now,
            "task_id": task_id,
            "task_type": task_type,
            "exchange": exchange,
            "error_message": error_message,
            "stack_trace": stack_trace,
            "is_resolved": False
        }
        
        # Save to Supabase
        try:
            supabase = get_supabase_admin_client()
            supabase.table(SCHEDULER_ERRORS_TABLE).insert(error_entry).execute()
        except Exception as supabase_error:
            print(f"[ERROR] Failed to log error to Supabase: {supabase_error}")
            
            # Fall back to Databutton storage
            try:
                error_log = db.storage.json.get(ERROR_LOG_KEY, default=[])
                
                # Add to log, keeping only the most recent entries
                error_log.insert(0, error_entry)  # Add to beginning
                if len(error_log) > MAX_ERROR_LOG_ENTRIES:
                    error_log = error_log[:MAX_ERROR_LOG_ENTRIES]  # Trim log
                    
                # Save updated log
                db.storage.json.put(ERROR_LOG_KEY, error_log)
                print("[INFO] Saved error to Databutton fallback storage")
            except Exception as db_error:
                print(f"[ERROR] Failed to save error to Databutton fallback: {db_error}")
        
        # Send notification to admins
        notification_title = f"Scheduler Error: {task_type} for {exchange}"
        notification_body = f"Task {task_id} failed: {error_message}"
        
        try:
            send_admin_notification(notification_title, notification_body)
        except Exception as notif_err:
            print(f"[ERROR] Failed to send admin notification: {notif_err}")
        
        print(f"[ERROR] Task '{task_id}' for '{exchange}' failed: {error_message}")
    except Exception as e:
        print(f"[ERROR] Failed to log scheduler error: {e}")

def get_recent_errors(limit: int = 10) -> List[Dict[str, Any]]:
    """Get recent scheduler errors from Supabase"""
    try:
        # Try to get from Supabase first
        try:
            supabase = get_supabase_admin_client()
            response = supabase.table(SCHEDULER_ERRORS_TABLE) \
                .select("*") \
                .order("timestamp", desc=True) \
                .limit(limit) \
                .eq("is_resolved", False) \
                .execute()
                
            if response.data:
                return response.data
        except Exception as supabase_error:
            print(f"[ERROR] Failed to get errors from Supabase: {supabase_error}")
            print(f"[INFO] Falling back to Databutton storage for errors")
        
        # Fall back to Databutton storage
        error_log = db.storage.json.get(ERROR_LOG_KEY, default=[])
        return error_log[:limit]
    except Exception as e:
        print(f"[ERROR] Failed to get recent errors: {e}")
        return []

async def process_game_results_for_date(exchange: str, game_date: date):
    """Process game results for a specific date"""
    try:
        table_name = "asx_games" if exchange.upper() == "ASX" else "nyse_games"
        supabase = get_supabase_admin_client()
        
        # Get the game for the specified date
        game_response = supabase.table(table_name)\
            .select("pair_id, status")\
            .eq("game_date", game_date.isoformat())\
            .eq("status", "active")\
            .limit(1)\
            .execute()
            
        if not game_response.data:
            print(f"[INFO] No active game found for {exchange} on {game_date.isoformat()}")
            return
            
        game = game_response.data[0]
        pair_id = game.get("pair_id")
        
        if not pair_id:
            print(f"[ERROR] Game found but pair_id is missing for {exchange} on {game_date.isoformat()}")
            return
        
        # Process the results
        print(f"[INFO] Processing results for game {pair_id} ({exchange}, {game_date.isoformat()})")
        await finalize_game_results(pair_id)
        print(f"[INFO] Successfully processed results for game {pair_id}")
        
    except Exception as e:
        print(f"[ERROR] Failed to process results for {exchange} on {game_date.isoformat()}: {e}")
        traceback.print_exc(file=sys.stdout)
        raise

# Import and include task active toggle endpoint
from app.apis.toggle_task_active import router as toggle_task_router, ToggleTaskRequest, ToggleTaskResponse

# Define a renamed endpoint to avoid conflicts
@router.post("/toggle-task-active", response_model=ToggleTaskResponse)
async def toggle_task_active(
    request: ToggleTaskRequest,
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """Toggle a task's active status (Main scheduler version)"""
    # Import the function here to avoid circular imports
    from app.apis.toggle_task_active import toggle_task_active2
    return await toggle_task_active2(request, current_user_id)

# Include routes but not the duplicate endpoint
for route in toggle_task_router.routes:
    router.routes.append(route)

# For migration endpoints
class GenericResponse(BaseModel):
    success: bool
    message: str

# Migration endpoints
@router.post("/migrate-to-supabase", response_model=GenericResponse)
async def migrate_scheduler_to_supabase(
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_SYSTEM))
):
    """Migrate scheduler config from Databutton to Supabase"""
    try:
        # Check if data already exists in Supabase
        supabase = get_supabase_admin_client()
        response = supabase.table(SCHEDULER_CONFIG_TABLE) \
            .select("id") \
            .eq("key", MASTER_SCHEDULE_KEY) \
            .execute()
            
        if response.data and len(response.data) > 0:
            return GenericResponse(
                success=False,
                message="Data already exists in Supabase. Migration not needed."
            )
        
        # Get existing config from Databutton
        try:
            config_data = db.storage.json.get(MASTER_SCHEDULE_KEY, default=None)
            if not config_data:
                return GenericResponse(
                    success=False,
                    message="No scheduler config found in Databutton storage."
                )
        except Exception as e:
            return GenericResponse(
                success=False,
                message=f"Failed to get config from Databutton: {str(e)}"
            )
        
        # Create scheduler config object and save it to Supabase
        config = SchedulerConfig(**config_data)
        
        # Store in Supabase
        now = datetime.utcnow().isoformat()
        try:
            supabase.table(SCHEDULER_CONFIG_TABLE) \
                .insert({
                    "key": MASTER_SCHEDULE_KEY,
                    "value": config_data,
                    "created_at": now,
                    "last_updated": now
                }) \
                .execute()
        except Exception as e:
            return GenericResponse(
                success=False,
                message=f"Failed to save to Supabase: {str(e)}"
            )
        
        return GenericResponse(
            success=True,
            message="Successfully migrated scheduler config to Supabase"
        )
    except Exception as e:
        print(f"[ERROR] Failed to migrate scheduler config: {e}")
        return GenericResponse(
            success=False,
            message=f"Migration failed: {str(e)}"
        )


@router.post("/migrate-errors-to-supabase", response_model=GenericResponse)
async def migrate_scheduler_errors_to_supabase(
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_SYSTEM))
):
    """Migrate scheduler errors from Databutton to Supabase"""
    try:
        # Get all error logs from Databutton
        error_prefix = "error_log_"
        
        try:
            # List all error logs
            error_files = db.storage.json.list()
            error_files = [f for f in error_files if f.name.startswith(error_prefix)]
            
            if not error_files:
                return GenericResponse(
                    success=True,
                    message="No error logs found in Databutton storage."
                )
                
            # Get Supabase client
            supabase = get_supabase_admin_client()
            
            # Migrate each error log
            migrated_count = 0
            for file in error_files:
                try:
                    # Get error data
                    error_data = db.storage.json.get(file.name)
                    if not error_data:
                        continue
                    
                    # Check if this error is already in Supabase (by timestamp)
                    if "timestamp" in error_data:
                        existing = supabase.table(SCHEDULER_ERRORS_TABLE) \
                            .select("id") \
                            .eq("task_id", error_data.get("task_id", "")) \
                            .eq("timestamp", error_data.get("timestamp")) \
                            .execute()
                            
                        if existing.data and len(existing.data) > 0:
                            continue
                    
                    # Add to Supabase
                    supabase.table(SCHEDULER_ERRORS_TABLE) \
                        .insert({
                            "task_id": error_data.get("task_id", "unknown"),
                            "task_type": error_data.get("task_type", "unknown"),
                            "exchange": error_data.get("exchange", "unknown"),
                            "error_message": error_data.get("error_message", ""),
                            "stack_trace": error_data.get("stack_trace", ""),
                            "timestamp": error_data.get("timestamp", datetime.utcnow().isoformat()),
                            "is_resolved": error_data.get("is_resolved", False)
                        }) \
                        .execute()
                        
                    migrated_count += 1
                except Exception as file_error:
                    print(f"[ERROR] Failed to migrate error log {file.name}: {file_error}")
            
            return GenericResponse(
                success=True,
                message=f"Successfully migrated {migrated_count} error logs to Supabase"
            )
            
        except Exception as e:
            return GenericResponse(
                success=False,
                message=f"Failed to list error logs from Databutton: {str(e)}"
            )
            
    except Exception as e:
        print(f"[ERROR] Failed to migrate scheduler errors: {e}")
        return GenericResponse(
            success=False,
            message=f"Migration failed: {str(e)}"
        )

@router.post("/migrate-cron-to-supabase2", response_model=GenericResponse)
async def migrate_cron_to_supabase2(
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_SYSTEM))
):
    """Migrate cron config from Databutton to Supabase (migrated to cron module)"""
    # This function just forwards to the main implementation in cron module
    from app.apis.cron import migrate_cron_to_supabase
    return await migrate_cron_to_supabase(current_user_id)

# API Endpoints
@router.get("/documentation2")
async def get_documentation2(current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Get comprehensive documentation for the scheduler system"""
    return get_scheduler_documentation()
@router.get("/status", response_model=SchedulerStatusResponse)
async def get_scheduler_status(current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Get the current status of the scheduler"""
    try:
        config = get_scheduler_config()
        recent_errors = get_recent_errors(5)  # Get 5 most recent errors
        
        return SchedulerStatusResponse(
            is_enabled=config.is_enabled,
            is_initialized=config.is_initialized,
            sandbox_mode_enabled=config.sandbox_mode_enabled,
            sandbox_mode_active=is_sandbox_mode(),
            tasks=config.tasks,
            current_time_utc=datetime.utcnow().isoformat(),
            recent_errors=recent_errors
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scheduler status: {str(e)}")

@router.post("/initialize", response_model=SchedulerStatusResponse)
async def initialize_scheduler_endpoint(current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Initialize the scheduler with default tasks"""
    try:
        config = initialize_scheduler()
        return SchedulerStatusResponse(
            is_enabled=config.is_enabled,
            is_initialized=config.is_initialized,
            sandbox_mode_enabled=config.sandbox_mode_enabled,
            sandbox_mode_active=is_sandbox_mode(),
            tasks=config.tasks,
            current_time_utc=datetime.utcnow().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize scheduler: {str(e)}")

@router.post("/enable")
async def enable_scheduler(current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Enable the scheduler"""
    try:
        config = get_scheduler_config()
        config.is_enabled = True
        save_scheduler_config(config)
        return {"success": True, "message": "Scheduler enabled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enable scheduler: {str(e)}")

@router.post("/disable")
async def disable_scheduler(current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Disable the scheduler"""
    try:
        config = get_scheduler_config()
        config.is_enabled = False
        save_scheduler_config(config)
        return {"success": True, "message": "Scheduler disabled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to disable scheduler: {str(e)}")

@router.post("/run-task/{task_id}", response_model=TaskResponse)
async def run_task(task_id: str, background_tasks: BackgroundTasks = None, current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Manually run a specific scheduled task"""
    try:
        config = get_scheduler_config()
        
        # Find the task
        task = next((t for t in config.tasks if t.task_id == task_id), None)
        if not task:
            raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found")
            
        # Execute the task
        result = await execute_task(task, background_tasks)
        return result
    except HTTPException:
        raise
    except Exception as e:
        error_message = f"Failed to run task: {str(e)}"
        # Log the error
        if task_id:
            log_scheduler_error(task_id, "manual_execution", "N/A", str(e), traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_message)

@router.post("/run-all", response_model=List[TaskResponse])
async def run_all_tasks(background_tasks: BackgroundTasks = None, current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Manually run all active scheduled tasks"""
    try:
        config = get_scheduler_config()
        
        results = []
        for task in config.tasks:
            if task.is_active:
                result = await execute_task(task, background_tasks)
                results.append(result)
                
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run all tasks: {str(e)}")

@router.post("/toggle-sandbox-mode")
async def toggle_sandbox_mode(current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Toggle whether the scheduler respects sandbox mode"""
    try:
        config = get_scheduler_config()
        config.sandbox_mode_enabled = not config.sandbox_mode_enabled
        save_scheduler_config(config)
        return {
            "success": True, 
            "message": f"Scheduler sandbox mode {'enabled' if config.sandbox_mode_enabled else 'disabled'}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle sandbox mode: {str(e)}")

# Scheduled task execution function (to be called by a background task trigger)
async def check_and_run_scheduled_tasks(background_tasks: BackgroundTasks):
    """Check for and run any scheduled tasks that are due"""
    try:
        config = get_scheduler_config()
        
        # Skip if scheduler is disabled
        if not config.is_enabled:
            print("[INFO] Scheduler is disabled, skipping task check")
            return
            
        # Skip if sandbox mode doesn't match current app mode
        if config.sandbox_mode_enabled != is_sandbox_mode():
            print(f"[INFO] Scheduler sandbox mode ({config.sandbox_mode_enabled}) doesn't match app mode ({is_sandbox_mode()}), skipping task check")
            return
            
        now = datetime.utcnow()
        print(f"[INFO] Checking scheduled tasks at {now.isoformat()}")
        
        for task in config.tasks:
            if not task.is_active:
                continue
                
            if task.next_run:
                next_run = datetime.fromisoformat(task.next_run)
                if now >= next_run:
                    print(f"[INFO] Task {task.task_id} is due, executing...")
                    await execute_task(task, background_tasks)
            else:
                # If next_run not set, calculate it
                next_run = calculate_next_run_time(task)
                update_task_timing(task.task_id, next_run=next_run)
                print(f"[INFO] Set initial next run for task {task.task_id} to {next_run.isoformat()}")
                
    except Exception as e:
        error_message = f"Error checking scheduled tasks: {str(e)}"
        print(f"[ERROR] {error_message}")
        traceback.print_exc(file=sys.stdout)
        
        # Log a general scheduler error
        log_scheduler_error("scheduler_check", "scheduler_check", "all", error_message, traceback.format_exc())

# Endpoint to trigger scheduled tasks check (called by external timer or cron job)
@router.post("/check-scheduled-tasks")
async def trigger_scheduled_tasks_check(background_tasks: BackgroundTasks):
    """Trigger a check of scheduled tasks"""
    await check_and_run_scheduled_tasks(background_tasks)
    return {"success": True, "message": "Scheduled tasks check triggered", "timestamp": datetime.utcnow().isoformat()}

# Error management endpoints
@router.get("/errors")
async def get_scheduler_errors(current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Get all scheduler error logs from Supabase"""
    try:
        # Try to get from Supabase
        try:
            supabase = get_supabase_admin_client()
            response = supabase.table(SCHEDULER_ERRORS_TABLE) \
                .select("*") \
                .order("timestamp", desc=True) \
                .eq("is_resolved", False) \
                .execute()
                
            return response.data or []
        except Exception as supabase_error:
            print(f"[ERROR] Failed to get errors from Supabase: {supabase_error}")
            
            # Fall back to Databutton storage
            error_log = db.storage.json.get(ERROR_LOG_KEY, default=[])
            return error_log
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch scheduler errors: {str(e)}")

@router.post("/clear-errors")
async def clear_scheduler_errors(current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """Mark all scheduler error logs as resolved in Supabase"""
    try:
        # Try to update in Supabase
        try:
            supabase = get_supabase_admin_client()
            # Mark all errors as resolved rather than deleting them
            supabase.table(SCHEDULER_ERRORS_TABLE) \
                .update({"is_resolved": True}) \
                .eq("is_resolved", False) \
                .execute()
        except Exception as supabase_error:
            print(f"[ERROR] Failed to clear errors in Supabase: {supabase_error}")
            # Fall back to Databutton storage
            db.storage.json.put(ERROR_LOG_KEY, [])
            
        return {"success": True, "message": "Scheduler error logs cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear scheduler errors: {str(e)}")

# Migration endpoint renamed to avoid duplicate with existing one
@router.post("/migrate-scheduler-to-supabase")
async def migrate_scheduler_to_supabase2(current_user_id: str = Depends(require_permission(Permissions.MANAGE_SYSTEM))):
    """Migrate scheduler configuration and errors from Databutton to Supabase"""
    try:
        # Get scheduler config from Databutton
        try:
            config_data = db.storage.json.get(MASTER_SCHEDULE_KEY, default=None)
            if not config_data:
                return {"status": "success", "message": "No scheduler config to migrate"}
                
            config = SchedulerConfig(**config_data)
            print(f"[INFO] Retrieved scheduler config from Databutton with {len(config.tasks)} tasks")
        except Exception as e:
            return {"status": "error", "message": f"Failed to get scheduler config from Databutton: {str(e)}"}
        
        # Save scheduler config to Supabase
        try:
            supabase = get_supabase_admin_client()
            now = datetime.utcnow().isoformat()
            
            # Check if the config already exists in Supabase
            response = supabase.table(SCHEDULER_CONFIG_TABLE) \
                .select("id") \
                .eq("key", MASTER_SCHEDULE_KEY) \
                .limit(1) \
                .execute()
                
            if response.data and len(response.data) > 0:
                # Update existing record
                print(f"[INFO] Updating existing scheduler config in Supabase")
                supabase.table(SCHEDULER_CONFIG_TABLE) \
                    .update({"value": config.model_dump(), "last_updated": now}) \
                    .eq("key", MASTER_SCHEDULE_KEY) \
                    .execute()
            else:
                # Insert new record
                print(f"[INFO] Creating new scheduler config in Supabase")
                supabase.table(SCHEDULER_CONFIG_TABLE) \
                    .insert({
                        "key": MASTER_SCHEDULE_KEY,
                        "value": config.model_dump(),
                        "created_at": now,
                        "last_updated": now
                    }) \
                    .execute()
        except Exception as e:
            return {"status": "error", "message": f"Failed to save scheduler config to Supabase: {str(e)}"}
        
        # Migrate error logs
        try:
            error_log = db.storage.json.get(ERROR_LOG_KEY, default=[])
            migrated_errors = 0
            
            if error_log and isinstance(error_log, list):
                print(f"[INFO] Migrating {len(error_log)} scheduler errors to Supabase")
                
                for error in error_log:
                    # Create error entry for Supabase with proper fields
                    error_entry = {
                        "task_id": error.get("task_id", "unknown"),
                        "task_type": error.get("task_type", "unknown"),
                        "exchange": error.get("exchange", "unknown"),
                        "error_message": error.get("error_message", "No message"),
                        "stack_trace": error.get("stack_trace"),
                        "timestamp": error.get("timestamp", datetime.utcnow().isoformat()),
                        "is_resolved": False
                    }
                    
                    # Insert error into Supabase
                    supabase.table(SCHEDULER_ERRORS_TABLE).insert(error_entry).execute()
                    migrated_errors += 1
        except Exception as e:
            print(f"[WARNING] Failed to migrate error logs: {str(e)}")
            # Continue with the migration even if error logs fail
        
        return {
            "status": "success", 
            "message": f"Successfully migrated scheduler config with {len(config.tasks)} tasks and {migrated_errors} error logs"
        }
    except Exception as e:
        return {"status": "error", "message": f"Migration failed: {str(e)}"}

# Test endpoints for validating functionality
@router.post("/test/process-results")
async def test_process_results(
    exchange: str,
    target_date: str = None,
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """Test the process_results functionality with a specific date"""
    try:
        if target_date is None:
            # Default to yesterday
            target_date = (date.today() - timedelta(days=1)).isoformat()
            
        # Convert string to date
        game_date = date.fromisoformat(target_date)
        
        # Execute the results processing function
        await process_game_results_for_date(exchange, game_date)
        
        return {
            "success": True, 
            "message": f"Test process_results executed for {exchange} on {target_date}",
            "details": {
                "exchange": exchange,
                "target_date": target_date,
                "is_trading_day": is_trading_day(exchange, game_date)
            }
        }
    except Exception as e:
        error_message = f"Test process_results failed: {str(e)}"
        log_scheduler_error("test_process_results", "process_results", exchange, error_message, traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_message)

@router.post("/test/generate-games")
async def test_generate_games(
    exchange: str,
    days_ahead: int = 1,
    background_tasks: BackgroundTasks = None,
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """Test the generate_games functionality"""
    try:
        if background_tasks:
            # Run in background
            background_tasks.add_task(generate_upcoming_games_task, days_ahead)
            return {
                "success": True, 
                "message": f"Generating games for {exchange} for the next {days_ahead} trading days in the background"
            }
        else:
            # Run immediately
            generate_upcoming_games_task(days_ahead)
            return {
                "success": True, 
                "message": f"Generated games for {exchange} for the next {days_ahead} trading days"
            }
    except Exception as e:
        error_message = f"Test generate_games failed: {str(e)}"
        log_scheduler_error("test_generate_games", "generate_games", exchange, error_message, traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_message)

@router.post("/test/update-clue")
async def test_update_clue(
    exchange: str,
    target_date: str = None,
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """Test the update_clue functionality with a specific date"""
    try:
        if target_date is None:
            # Default to tomorrow
            target_date = (date.today() + timedelta(days=1)).isoformat()
            
        # Convert string to date
        game_date = date.fromisoformat(target_date)
        
        # Execute the clue update function
        await ensure_next_day_clue_available(exchange, game_date)
        
        return {
            "success": True, 
            "message": f"Test update_clue executed for {exchange} on {target_date}",
            "details": {
                "exchange": exchange,
                "target_date": target_date,
                "is_trading_day": is_trading_day(exchange, game_date)
            }
        }
    except Exception as e:
        error_message = f"Test update_clue failed: {str(e)}"
        log_scheduler_error("test_update_clue", "update_clue", exchange, error_message, traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_message)

@router.post("/test/full-cycle")
async def test_full_scheduler_cycle(
    exchange: str,
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """Test the full scheduler cycle (process results, generate games, update clue)"""
    try:
        yesterday = date.today() - timedelta(days=1)
        tomorrow = date.today() + timedelta(days=1)
        
        # Execute all steps in sequence
        if is_trading_day(exchange, yesterday):
            await process_game_results_for_date(exchange, yesterday)
        
        # Generate games for upcoming days
        background_tasks.add_task(generate_upcoming_games_task, 2)  # Generate for next 2 trading days
        
        # Ensure clue is available for tomorrow
        await ensure_next_day_clue_available(exchange, tomorrow)
        
        return {
            "success": True, 
            "message": f"Full scheduler cycle test initiated for {exchange}",
            "details": {
                "exchange": exchange,
                "yesterday": yesterday.isoformat(),
                "yesterday_is_trading_day": is_trading_day(exchange, yesterday),
                "tomorrow": tomorrow.isoformat(),
                "tomorrow_is_trading_day": is_trading_day(exchange, tomorrow)
            }
        }
    except Exception as e:
        error_message = f"Full scheduler cycle test failed: {str(e)}"
        log_scheduler_error("test_full_cycle", "full_cycle", exchange, error_message, traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_message)

@router.post("/test/cleanup-sandbox-data")
async def cleanup_sandbox_test_data(
    days_to_keep: int = 2,
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """Clean up old sandbox test data while preserving recent entries"""
    try:
        # Only run in sandbox mode
        if not is_sandbox_mode():
            return {
                "success": False, 
                "message": "This endpoint can only be used in sandbox mode"
            }
            
        cutoff_date = date.today() - timedelta(days=days_to_keep)
        cutoff_date_str = cutoff_date.isoformat()
        
        removed_count = 0
        tables = ["asx_games", "nyse_games"]
        supabase = get_supabase_admin_client()
        
        for table in tables:
            try:
                # Find games older than the cutoff date
                response = supabase.table(table)\
                    .select("game_id, game_date")\
                    .lt("game_date", cutoff_date_str)\
                    .execute()
                    
                if response.data:
                    for game in response.data:
                        # Delete the game
                        supabase.table(table)\
                            .delete()\
                            .eq("game_id", game["game_id"])\
                            .execute()
                        removed_count += 1
            except Exception as table_err:
                print(f"[WARNING] Error cleaning up {table}: {str(table_err)}")
        
        return {
            "success": True, 
            "message": f"Cleaned up sandbox test data older than {cutoff_date_str}",
            "removed_count": removed_count
        }
    except Exception as e:
        error_message = f"Sandbox data cleanup failed: {str(e)}"
        log_scheduler_error("cleanup_sandbox_data", "maintenance", "all", error_message, traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_message)
