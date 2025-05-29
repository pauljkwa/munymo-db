# src/app/apis/admin_permissions/__init__.py

from fastapi import APIRouter, Depends, HTTPException, Request, Security
from typing import Optional, List, Dict, Any
from enum import Enum, auto
from supabase import create_client, Client

# Create a router for this API
router = APIRouter()

# Permission levels
USER = "user"
ADMIN = "admin"
SUPER_ADMIN = "super_admin"

# Explicitly define exports for other modules
__all__ = [
    "USER", "ADMIN", "SUPER_ADMIN",
    "AdminRole", "Permissions", 
    "get_user_role", "has_permission", 
    "AdminPermissions", "assign_role",
    "remove_role", "get_role_assignments",
    "migrate_admin_roles_to_supabase",
    "router"
]

class AdminRole(str, Enum):
    """Admin role levels"""
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class Permissions:
    # Old permission levels retained for backwards compatibility
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    
    # Specific permission types
    MANAGE_GAMES = "manage_games"
    VIEW_GAMES = "view_games"
    MANAGE_USERS = "manage_users"
    VIEW_USERS = "view_users"
    VIEW_SUBMISSIONS = "view_submissions"
    MANAGE_SUBMISSIONS = "manage_submissions"
    MANAGE_SUBSCRIPTIONS = "manage_subscriptions"
    MANAGE_NOTIFICATIONS = "manage_notifications"
    VIEW_ANALYTICS = "view_analytics"
    ADMIN_DASHBOARD = "admin_dashboard"
    MANAGE_SYSTEM = "manage_system"
    VIEW_SANDBOX = "view_sandbox"
    MANAGE_SANDBOX = "manage_sandbox"
    IMPORT_DATA = "import_data"

def get_supabase_client() -> Client:
    """Returns an initialized Supabase client with admin privileges"""
    import databutton as db
    
    supabase_url = db.secrets.get("SUPABASE_URL")
    service_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not service_key:
        print("Missing Supabase credentials")
        raise ValueError("Missing Supabase credentials")
    
    return create_client(supabase_url, service_key)

def get_user_role(user_id: str) -> AdminRole:
    """Get the user's role from Supabase
    
    Returns the user's role based on stored permissions in Supabase.
    
    Args:
        user_id: The ID of the user to check
        
    Returns:
        AdminRole enum value (USER, ADMIN, SUPER_ADMIN)
    """
    try:
        supabase = get_supabase_client()
        
        # Query admin_roles table for this user
        response = supabase.table("admin_roles").select("role").eq("user_id", user_id).execute()
            
        if response.data and len(response.data) > 0:
            role_value = response.data[0].get("role")
            if role_value == SUPER_ADMIN:
                return AdminRole.SUPER_ADMIN
            elif role_value == ADMIN:
                return AdminRole.ADMIN
    except Exception as e:
        print(f"Error getting user role from Supabase: {e}")
    
    # Default to regular user
    return AdminRole.USER

def has_permission(user_id: str, permission: str) -> bool:
    """Check if user has sufficient permission
    
    Args:
        user_id: The user ID to check
        permission: The permission to check for
        
    Returns:
        True if the user has the required permission
    """
    user_role = get_user_role(user_id)
    
    # Super admins have all permissions
    if user_role == AdminRole.SUPER_ADMIN:
        return True
        
    # Admins have most permissions except those reserved for super admins
    if user_role == AdminRole.ADMIN:
        # Define permissions that only super admins have
        super_admin_only = [
            Permissions.MANAGE_SYSTEM,
            Permissions.IMPORT_DATA
        ]
        return permission not in super_admin_only
    
    # Regular users have limited permissions
    if user_role == AdminRole.USER:
        # Define permissions that regular users have
        user_permissions = [
            Permissions.VIEW_GAMES,
            Permissions.VIEW_SUBMISSIONS
        ]
        return permission in user_permissions
    
    # Default to deny
    return False

def assign_role(user_id: str, role: AdminRole, assigned_by: str = None) -> bool:
    """Assign a role to a user
    
    Saves the role assignment in Supabase admin_roles table.
    
    Args:
        user_id: The ID of the user to assign the role to
        role: The role to assign (AdminRole enum)
        assigned_by: The ID of the user who assigned this role (optional)
        
    Returns:
        True if the role was assigned successfully
    """
    from datetime import datetime
    
    try:
        supabase = get_supabase_client()
        
        # Check if user already has a role
        check_response = supabase.table("admin_roles").select("id").eq("user_id", user_id).execute()
            
        # Prepare role data
        role_data = {
            "user_id": user_id,
            "role": role.value,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if assigned_by:
            role_data["assigned_by"] = assigned_by
        
        # Update or insert
        if check_response.data and len(check_response.data) > 0:
            # Update existing role
            record_id = check_response.data[0]["id"]
            supabase.table("admin_roles").update(role_data).eq("id", record_id).execute()
        else:
            # Insert new role
            role_data["created_at"] = datetime.utcnow().isoformat()
            supabase.table("admin_roles").insert(role_data).execute()
        
        print(f"Role {role.value} assigned to user {user_id}")
        return True
    except Exception as e:
        print(f"Error assigning role in Supabase: {e}")
        return False

def remove_role(user_id: str) -> bool:
    """Remove a role from a user
    
    Removes the role assignment from Supabase admin_roles table.
    
    Args:
        user_id: The ID of the user to remove the role from
        
    Returns:
        True if the role was removed successfully
    """
    try:
        supabase = get_supabase_client()
        
        # Delete the role record for this user
        supabase.table("admin_roles").delete().eq("user_id", user_id).execute()
            
        print(f"Role removed for user {user_id}")
        return True
    except Exception as e:
        print(f"Error removing role from Supabase: {e}")
        return False

def get_role_assignments():
    """Get all role assignments from Supabase
    
    Returns:
        List of role assignments
    """
    try:
        supabase = get_supabase_client()
        
        response = supabase.table("admin_roles").select("*").execute()
            
        return response.data if response.data else []
    except Exception as e:
        print(f"Error getting role assignments from Supabase: {e}")
        return []

def list_users_with_roles():
    """List all users with their roles from Supabase
    
    Join admin_roles with profiles table to get both user details and their roles.
    
    Returns:
        List of users with their roles
    """
    try:
        supabase = get_supabase_client()
        
        # Join admin_roles with profiles to get user details with roles
        response = supabase.table("admin_roles").select("*, profiles!inner(email)").execute()
            
        result = []
        if response.data:
            for entry in response.data:
                user_data = {
                    "user_id": entry.get("user_id"),
                    "email": entry.get("profiles", {}).get("email"),
                    "role": entry.get("role"),
                    "created_at": entry.get("created_at")
                }
                result.append(user_data)
        
        return result
    except Exception as e:
        print(f"Error listing users with roles from Supabase: {e}")
        # Fallback to mock data if there's an error
        return [
            {"user_id": "test-user-1", "email": "admin@test.example.com", "role": ADMIN, "created_at": "2025-01-01T00:00:00Z"},
            {"user_id": "test-user-2", "email": "super@test.example.com", "role": SUPER_ADMIN, "created_at": "2025-01-02T00:00:00Z"},
            {"user_id": "test-user-3", "email": "user@test.example.com", "role": USER, "created_at": "2025-01-03T00:00:00Z"}
        ]

def migrate_admin_roles_to_supabase():
    """One-time migration of admin roles from Databutton storage to Supabase
    
    This function should be called once after deploying the code to transfer
    existing admin role assignments from Databutton to Supabase.
    
    Returns:
        dict: Migration results with counts of migrated records
    """
    import databutton as db
    from datetime import datetime
    try:
        # Get current admin roles from Databutton
        admin_roles = db.storage.json.get("admin_roles", default={"roles": []})
        source_roles = admin_roles.get("roles", [])
        
        if not source_roles:
            return {"status": "success", "migrated": 0, "message": "No roles to migrate"}
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Count existing roles in Supabase
        check_response = supabase.table("admin_roles").select("count").execute()
        existing_count = len(check_response.data) if check_response.data else 0
        
        # Prepare roles for migration
        roles_to_migrate = []
        for role in source_roles:
            # Transform Databutton format to Supabase format
            role_data = {
                "user_id": role.get("user_id"),
                "role": role.get("role"),
                "created_at": role.get("assigned_at") or datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "notes": "Migrated from Databutton storage"
            }
            roles_to_migrate.append(role_data)
        
        # Insert roles to Supabase (if not already exists)
        migrated_count = 0
        for role in roles_to_migrate:
            # Check if this user already has a role in Supabase
            check_user = supabase.table("admin_roles").select("id").eq("user_id", role["user_id"]).execute()
                
            if check_user.data and len(check_user.data) > 0:
                # Skip this user, already has a role in Supabase
                print(f"User {role['user_id']} already has a role in Supabase, skipping")
                continue
                
            # Insert the role
            supabase.table("admin_roles").insert(role).execute()
            migrated_count += 1
        
        return {
            "status": "success",
            "source_count": len(source_roles),
            "migrated": migrated_count,
            "existing": existing_count,
            "message": f"Migrated {migrated_count} roles to Supabase"
        }
    except Exception as e:
        print(f"Error migrating admin roles to Supabase: {e}")
        return {
            "status": "error",
            "message": f"Migration failed: {str(e)}"
        }

class AdminPermissions:
    """Utility class for handling admin permissions
    
    This is used by various endpoints to check if a user has the necessary
    permissions to perform admin actions.
    """
    
    @staticmethod
    def is_admin(request: Request) -> bool:
        """Check if the user has admin permissions"""
        role = get_user_role(request)
        return role in [ADMIN, SUPER_ADMIN]
    
    @staticmethod
    def is_super_admin(request: Request) -> bool:
        """Check if the user has super admin permissions"""
        role = get_user_role(request)
        return role == SUPER_ADMIN
    
    @staticmethod
    def admin_only(request: Request):
        """Dependency for endpoints that require admin permissions"""
        # If not in a test environment, verify the user is an admin
        if not AdminPermissions.is_admin(request):
            raise HTTPException(status_code=403, detail="Admin permissions required")
        
        return {"is_admin": True, "role": get_user_role(request)}
    
    @staticmethod
    def super_admin_only(request: Request):
        """Dependency for endpoints that require super admin permissions"""
        # If not in a test environment, verify the user is a super admin
        if not AdminPermissions.is_super_admin(request):
            raise HTTPException(status_code=403, detail="Super admin permissions required")
        
        return {"is_super_admin": True, "role": SUPER_ADMIN}

# Add the endpoints for admin roles management later to avoid circular imports
# This will be handled by moving the endpoints to a separate module or
# restructuring the auth_utils dependency

# These endpoint definitions are moved to admin_api to prevent circular imports
# @router.get("/admin/roles", tags=["admin"])
# def list_admin_roles(...):
#     ...

# @router.post("/admin/roles/assign", tags=["admin"])
# def assign_admin_role(...):
#     ...

# @router.post("/admin/roles/remove", tags=["admin"])
# def remove_admin_role(...):
#     ...

# @router.post("/admin/migrate-roles", tags=["admin"])
# def migrate_roles(...):
#     ...