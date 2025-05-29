# src/app/apis/auth_utils/__init__.py
# This file holds shared authentication utility functions.

# import logging # Removed logging import
import jwt
import databutton as db
from fastapi import APIRouter, Depends, HTTPException, Header, Request # Added APIRouter
from app.apis.admin_permissions import get_user_role, AdminRole, has_permission, Permissions
from app.env import Mode, mode
from supabase import create_client  # Add missing import

# Try to import test utilities (will fail in production but that's okay)
try:
    from app.apis.test_utilities import BYPASS_AUTH_FOR_TESTING
except ImportError:
    # Define fallback if import fails
    BYPASS_AUTH_FOR_TESTING = False

# Create a dummy router to satisfy the framework
# This utility module doesn't expose actual API endpoints.
router = APIRouter()

# Configure logging - REMOVED
# logging.basicConfig(level=logging.INFO) # Use print() instead? Consider databutton best practices
# logger = logging.getLogger(__name__)

# Note: This is not an API endpoint, but a utility function placed here
# due to file structure constraints.
async def get_current_user(request: Request, authorization: str | None = Header(None)) -> tuple[dict, str]:    
    """    
    Dependency function to get the current user based on a Supabase JWT token
    passed in the Authorization header. Verifies the token using PyJWT and the
    SUPABASE_JWT_SECRET.
    
    Args:
        request: The FastAPI Request object to access headers.
        authorization: The content of the Authorization header (automatically injected by FastAPI).
    
    Returns:
        A tuple containing the decoded JWT payload (dict) and the original Authorization header string.
    
    Raises:
        HTTPException:
            - 401 Not authenticated: If header is missing, format is wrong, token is invalid/expired, or 'sub' claim is missing.
            - 500 Internal Server Error: If SUPABASE_JWT_SECRET is missing or an unexpected error occurs.
    """
    # Log headers *inside* the dependency, right at the start
    # Consider using print for Databutton compatibility
    print(f"DEBUG: Headers received by get_current_user: {request.headers}") # Using print
    
    # Special test mode handling for development only
    if mode == Mode.DEV and BYPASS_AUTH_FOR_TESTING:
        # Check for special test headers
        test_user_id = request.headers.get("X-Test-User-Id")
        test_user_role = request.headers.get("X-Test-User-Role")
        test_user_tier = request.headers.get("X-Test-User-Tier")
        
        # If we have test headers, create a mock payload
        if test_user_id and test_user_role:
            print(f"INFO: Using test authentication for user {test_user_id} with role {test_user_role}")
            mock_payload = {
                "sub": test_user_id,
                "role": test_user_role,
                "email": f"{test_user_id}@test.example.com",
                "app_metadata": {
                    "subscription_tier": test_user_tier or "free"
                }
            }
            return mock_payload, authorization or f"Bearer test_token_{test_user_id}"
        
        # Also check for test token format in authorization header
        if authorization and authorization.startswith("Bearer test_token_"):
            try:
                # Format is "Bearer test_token_USER_ID"
                test_user_id = authorization.split("_")[2]
                print(f"INFO: Using test token authentication for user {test_user_id}")
                mock_payload = {
                    "sub": test_user_id,
                    "role": test_user_role or "user",
                    "email": f"{test_user_id}@test.example.com",
                    "app_metadata": {
                        "subscription_tier": test_user_tier or "free"
                    }
                }
                return mock_payload, authorization
            except (IndexError, ValueError):
                # If test token format is wrong, continue with normal auth
                pass
    
    if authorization is None:
        print("WARNING: Authorization header missing") # Using print
        # logger.warning("Authorization header missing")
        raise HTTPException(status_code=401, detail="Not authenticated: Authorization header missing")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        print(f"WARNING: Invalid Authorization header format: {authorization}") # Using print
        # logger.warning(f"Invalid Authorization header format: {authorization}")
        raise HTTPException(status_code=401, detail="Not authenticated: Invalid token format")

    token = parts[1]

    try:
        print(f"INFO: Attempting to verify token using PyJWT: {token[:10]}...") # Using print
        # logger.info(f"Attempting to verify token using PyJWT: {token[:10]}...")
        jwt_secret = db.secrets.get("SUPABASE_JWT_SECRET")
        if not jwt_secret:
            print("ERROR: SUPABASE_JWT_SECRET is not set in Databutton secrets!") # Using print
            # logger.error("SUPABASE_JWT_SECRET is not set in Databutton secrets!")
            raise HTTPException(status_code=500, detail="Authentication configuration error")

        # Define the expected audience
        expected_audience = "authenticated"

        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience=expected_audience # Verify the audience
        )
        user_id = payload.get('sub')
        if not user_id:
            print(f"WARNING: Token validation successful, but 'sub' claim missing in payload: {payload}") # Using print
            # logger.warning(f"Token validation successful, but 'sub' claim missing in payload: {payload}")
            raise HTTPException(status_code=401, detail="Not authenticated: Invalid token payload")

        print(f"INFO: Successfully authenticated user ID via PyJWT: {user_id}") # Using print
        # logger.info(f"Successfully authenticated user ID via PyJWT: {user_id}")
        return payload, authorization # Return payload and original header

    except jwt.ExpiredSignatureError:
        print("WARNING: Token validation failed: Expired signature") # Using print
        # logger.warning("Token validation failed: Expired signature")
        raise HTTPException(status_code=401, detail="Not authenticated: Token has expired")
    except jwt.InvalidAudienceError:
         # Cannot easily get payload here if audience is invalid before decoding sub
         print(f"WARNING: Token validation failed: Invalid audience. Expected '{expected_audience}'") # Using print
         # logger.warning(f"Token validation failed: Invalid audience. Expected '{expected_audience}', got '{payload.get('aud')}'")
         raise HTTPException(status_code=401, detail="Not authenticated: Invalid token audience")
    except jwt.InvalidTokenError as e:
        # Catch other PyJWT errors (InvalidSignatureError, DecodeError, etc.)
        print(f"WARNING: Token verification failed: Invalid token - {e}") # Using print
        # logger.warning(f"Token verification failed: Invalid token - {e}")
        raise HTTPException(status_code=401, detail=f"Not authenticated: Invalid token ({e})")
    except HTTPException as http_err:
         # Re-raise specific HTTPExceptions we might throw inside
         raise http_err
    except Exception as e:
        # Catch any other unexpected errors during the process
        print(f"ERROR: Unexpected error during token verification: {e}") # Using print
        # logger.error(f"Unexpected error during token verification: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Authentication error")

# Function to check if user is an admin (any admin role)
def is_admin_user():
    """FastAPI dependency that restricts access to admin users only."""
    async def admin_check(user_info: tuple = Depends(get_current_user)):
        payload, _ = user_info
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Not authenticated")
            
        user_role = get_user_role(user_id)
        
        # Check if user has any admin role
        if user_role == AdminRole.USER:
            print(f"WARNING: User {user_id} attempted to access admin endpoint but has role {user_role.value}")
            raise HTTPException(status_code=403, detail="Access denied: Administrator privileges required")
            
        print(f"INFO: Admin access granted for user {user_id} with role {user_role.value}")
        return user_id
    
    return admin_check

# Function to check for super admin privileges
def is_super_admin():
    """FastAPI dependency that restricts access to super admin users only."""
    async def super_admin_check(user_info: tuple = Depends(get_current_user)):
        payload, _ = user_info
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Not authenticated")
            
        user_role = get_user_role(user_id)
        
        # Check if user has super admin role
        if user_role != AdminRole.SUPER_ADMIN:
            print(f"WARNING: User {user_id} attempted to access super admin endpoint but has role {user_role.value}")
            raise HTTPException(status_code=403, detail="Access denied: Super Administrator privileges required")
            
        print(f"INFO: Super admin access granted for user {user_id}")
        return user_id
    
    return super_admin_check

# Function to check for specific permission
def require_permission(permission: Permissions):
    """FastAPI dependency factory that restricts access to users with a specific permission."""
    async def permission_check(user_info: tuple = Depends(get_current_user)):
        payload, _ = user_info
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Not authenticated")
            
        # Check if user has the required permission
        if not has_permission(user_id, permission):
            user_role = get_user_role(user_id)
            print(f"WARNING: User {user_id} with role {user_role.value} lacks permission {permission}")
            raise HTTPException(status_code=403, detail=f"Access denied: Missing permission: {permission}")
            
        print(f"INFO: Permission {permission} granted for user {user_id}")
        return user_id
    
    return permission_check

# Function to check for premium subscription
async def verify_premium_subscription(user_info: tuple = Depends(get_current_user)):
    """FastAPI dependency that checks if a user has a premium subscription."""
    payload, _ = user_info
    user_id = payload.get('sub')
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get the user's profile from Supabase to check subscription tier
    try:
        # Get Supabase credentials
        supabase_url = db.secrets.get("SUPABASE_URL")
        supabase_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
        supabase = create_client(supabase_url, supabase_key)
        
        # Get user profile
        profile_response = supabase.table("profiles").select("subscription_tier").eq("id", user_id).execute()
        
        if not profile_response.data or len(profile_response.data) == 0:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        subscription_tier = profile_response.data[0].get("subscription_tier")
        
        # Check if user has premium or pro tier
        if subscription_tier not in ["premium", "pro"]:
            raise HTTPException(
                status_code=403, 
                detail="This feature requires a premium subscription"
            )
        
        return user_id
    except Exception as e:
        print(f"Error verifying premium subscription: {e}")
        raise HTTPException(status_code=500, detail="Error verifying subscription status")
