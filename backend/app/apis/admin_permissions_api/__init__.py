# src/app/apis/admin_permissions_api/__init__.py

from fastapi import APIRouter, Depends, HTTPException, Request
from app.apis.admin_permissions import AdminRole, Permissions, get_user_role, assign_role, remove_role, get_role_assignments, migrate_admin_roles_to_supabase, USER, ADMIN, SUPER_ADMIN
from app.apis.auth_utils import require_permission

# Create a router for this API
router = APIRouter(prefix="/admin-roles")

@router.get("/list", tags=["admin"])
def list_admin_roles2(current_user: dict = Depends(require_permission(Permissions.MANAGE_USERS))):
    """List all admin role assignments
    
    Returns a list of all users with admin roles.
    
    Requires MANAGE_USERS permission.
    """
    roles = get_role_assignments()
    return {"roles": roles}

@router.post("/assign/{user_id}", tags=["admin"])
def assign_admin_role2(
    user_id: str, 
    role: str,
    current_user: dict = Depends(require_permission(Permissions.MANAGE_USERS))
):
    """Assign an admin role to a user
    
    Args:
        user_id: ID of the user to assign the role to
        role: Role to assign ("admin" or "super_admin")
    
    Returns:
        Success message
    
    Requires MANAGE_USERS permission.
    """
    # Validate role value
    if role not in [ADMIN, SUPER_ADMIN]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'super_admin'")
    
    # Assign the role
    admin_role = AdminRole.ADMIN if role == ADMIN else AdminRole.SUPER_ADMIN
    success = assign_role(user_id, admin_role, assigned_by=current_user.get("user_id"))
    
    if success:
        return {"message": f"Role {role} assigned to user {user_id}", "success": True}
    else:
        raise HTTPException(status_code=500, detail="Failed to assign role")

@router.delete("/remove/{user_id}", tags=["admin"])
def remove_admin_role2(
    user_id: str,
    current_user: dict = Depends(require_permission(Permissions.MANAGE_USERS))
):
    """Remove admin role from a user
    
    Args:
        user_id: ID of the user to remove the role from
    
    Returns:
        Success message
    
    Requires MANAGE_USERS permission.
    """
    # Remove the role
    success = remove_role(user_id)
    
    if success:
        return {"message": f"Role removed from user {user_id}", "success": True}
    else:
        raise HTTPException(status_code=500, detail="Failed to remove role")

@router.post("/migrate", tags=["admin"])
def migrate_roles2(
    current_user: dict = Depends(require_permission(Permissions.MANAGE_SYSTEM))
):
    """Migrate admin roles from Databutton storage to Supabase
    
    One-time migration endpoint to transfer existing role assignments.
    
    Returns:
        Migration results
    
    Requires MANAGE_SYSTEM permission.
    """
    results = migrate_admin_roles_to_supabase()
    return results