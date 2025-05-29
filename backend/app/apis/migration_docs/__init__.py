# src/app/apis/migration_docs/__init__.py
"""
This module contains documentation for migrations, including SQL commands
that need to be run in the Supabase SQL editor before the migration.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import databutton as db

from app.apis.auth_utils import require_permission
from app.apis.admin_permissions import Permissions
from app.apis.predictions_api import get_supabase_admin_client
from app.apis.company_cache import COMPANY_CACHE_TABLES_SQL

# Create router
router = APIRouter()

# SQL commands to create scheduler and error tables in Supabase
SCHEDULER_TABLES_SQL = """
-- Create scheduler_config table for storing configuration
CREATE TABLE IF NOT EXISTS scheduler_config (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on the key field for faster lookups
CREATE INDEX IF NOT EXISTS scheduler_config_key_idx ON scheduler_config(key);

-- Create scheduler_errors table for tracking errors
CREATE TABLE IF NOT EXISTS scheduler_errors (
    id SERIAL PRIMARY KEY,
    task_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    exchange TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_resolved BOOLEAN DEFAULT FALSE
);

-- Create indexes for error logs
CREATE INDEX IF NOT EXISTS scheduler_errors_task_id_idx ON scheduler_errors(task_id);
CREATE INDEX IF NOT EXISTS scheduler_errors_timestamp_idx ON scheduler_errors(timestamp DESC);
CREATE INDEX IF NOT EXISTS scheduler_errors_is_resolved_idx ON scheduler_errors(is_resolved);

-- Add RLS policies to restrict access
-- Enable RLS on tables
ALTER TABLE scheduler_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler_errors ENABLE ROW LEVEL SECURITY;

-- Create policy for scheduler_config (only admins can access)
CREATE POLICY scheduler_config_admin_policy ON scheduler_config
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create policy for scheduler_errors (only admins can access)
CREATE POLICY scheduler_errors_admin_policy ON scheduler_errors
    USING (auth.jwt() ->> 'role' = 'admin');
"""

class MigrationDocResponse(BaseModel):
    sql: str
    tables_exist: bool
    scheduler_migrated: bool
    cron_migrated: bool
    company_cache_sql: str
    instructions: str

# Constants - match those in scheduler and cron modules
SCHEDULER_CONFIG_TABLE = "scheduler_config"
MASTER_SCHEDULE_KEY = "scheduler_master_config"
CRON_CONFIG_KEY = "cron_config"

def get_scheduler_migration_sql():
    """Returns the SQL commands needed to create scheduler tables in Supabase"""
    return SCHEDULER_TABLES_SQL

def check_tables_exist() -> bool:
    """Check if the required tables exist in Supabase"""
    try:
        supabase = get_supabase_admin_client()
        # Try to query the scheduler_config table
        response = supabase.table(SCHEDULER_CONFIG_TABLE).select("id").limit(1).execute()
        # If we got here without exception, the table exists
        return True
    except Exception as e:
        print(f"[INFO] Checking tables exist: {e}")
        return False

def check_scheduler_migrated() -> bool:
    """Check if scheduler config has been migrated to Supabase"""
    try:
        supabase = get_supabase_admin_client()
        response = supabase.table(SCHEDULER_CONFIG_TABLE) \
            .select("value") \
            .eq("key", MASTER_SCHEDULE_KEY) \
            .limit(1) \
            .execute()
            
        return len(response.data) > 0
    except Exception as e:
        print(f"[INFO] Checking scheduler migrated: {e}")
        return False

def check_cron_migrated() -> bool:
    """Check if cron config has been migrated to Supabase"""
    try:
        supabase = get_supabase_admin_client()
        response = supabase.table(SCHEDULER_CONFIG_TABLE) \
            .select("value") \
            .eq("key", CRON_CONFIG_KEY) \
            .limit(1) \
            .execute()
            
        return len(response.data) > 0
    except Exception as e:
        print(f"[INFO] Checking cron migrated: {e}")
        return False

@router.get("/get-migration-docs", response_model=MigrationDocResponse)
async def get_migration_docs(current_user_id: str = Depends(require_permission(Permissions.MANAGE_SYSTEM))):
    """Get SQL and instructions for migrating scheduler and cron to Supabase"""
    try:
        tables_exist = check_tables_exist()
        scheduler_migrated = check_scheduler_migrated()
        cron_migrated = check_cron_migrated()
        
        instructions = """
## Migration Instructions:

### Step 1: Create Tables
Run the SQL commands in the Supabase SQL Editor to create necessary tables.

#### Scheduler and Cron Tables
Run the SQL in the `sql` field.

#### Company Cache Tables
Run the SQL in the `company_cache_sql` field.

### Step 2: Migrate Data
After creating tables, call these endpoints to migrate data:
- POST /scheduler/migrate-to-supabase
- POST /cron/migrate-to-supabase
- POST /company-discovery/company-cache/migrate

### Step 3: Verify Migration
Refresh this page to verify migration status. All checks should show 'true'.
"""
        
        if tables_exist:
            instructions += "\n✅ Tables already exist\n"
        else:
            instructions += "\n❌ Tables not yet created\n"
            
        if scheduler_migrated:
            instructions += "✅ Scheduler data migrated\n"
        else:
            instructions += "❌ Scheduler data not yet migrated\n"
            
        if cron_migrated:
            instructions += "✅ Cron data migrated\n"
        else:
            instructions += "❌ Cron data not yet migrated\n"
        
        return MigrationDocResponse(
            sql=SCHEDULER_TABLES_SQL,
            tables_exist=tables_exist,
            scheduler_migrated=scheduler_migrated,
            cron_migrated=cron_migrated,
            company_cache_sql=COMPANY_CACHE_TABLES_SQL,
            instructions=instructions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get migration docs: {str(e)}")
