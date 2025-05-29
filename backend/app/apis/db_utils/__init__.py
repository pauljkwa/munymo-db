# src/app/apis/db_utils/__init__.py
# Utility functions for database operations

import databutton as db
from supabase import create_client
from fastapi import APIRouter, HTTPException

# Create a dummy router to satisfy the framework
router = APIRouter()

def get_supabase_client():
    """Get a Supabase client instance using credentials from secrets
    
    Returns:
        A Supabase client instance that can be used to interact with the database
        
    Raises:
        HTTPException: If the Supabase URL or key is not configured
    """
    try:
        # Get configuration from Databutton secrets
        supabase_url = db.secrets.get("SUPABASE_URL")
        supabase_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise HTTPException(
                status_code=500,
                detail="Supabase configuration missing"
            )
        
        # Create and return the client
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"Error creating Supabase client: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database connection error: {str(e)}"
        ) from e

def sanitize_storage_key(key):
    """Sanitize a storage key to ensure it only contains safe characters
    
    Args:
        key: The key to sanitize
        
    Returns:
        A sanitized key that can be safely used with db.storage
    """
    import re
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)
