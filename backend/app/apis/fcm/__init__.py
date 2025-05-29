# src/app/apis/fcm/__init__.py

import databutton as db
import jwt
import time
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, Field
from supabase.client import Client, create_client
from typing import Annotated, Dict, Any

# --- Firebase Admin SDK Imports ---
import firebase_admin
from firebase_admin import credentials, messaging
import json

router = APIRouter(prefix="/fcm", tags=["FCM"])

# --- Pydantic Models ---
class NotificationCategory:
    """Enum-like class for notification categories"""
    GAME_RESULTS = "game_results"
    LEADERBOARD = "leaderboard"
    SYSTEM_UPDATES = "system_updates"
    PREDICTIONS = "predictions"
    ALL_CATEGORIES = [GAME_RESULTS, LEADERBOARD, SYSTEM_UPDATES, PREDICTIONS]

class NotificationRequest(BaseModel):
    """Request model for sending a notification"""
    user_id: str = Field(..., description="User ID to send notification to")
    title: str = Field(..., description="Notification title")
    body: str = Field(..., description="Notification body")
    category: str = Field(..., description="Notification category")
    data: Dict[str, Any] = Field(default_factory=dict, description="Additional data to send with notification")

class AdminNotificationRequest(BaseModel):
    """Request model for sending a notification to multiple users by admin"""
    user_ids: list[str] = Field(..., description="List of user IDs to send notification to")
    title: str = Field(..., description="Notification title")
    body: str = Field(..., description="Notification body")
    category: str = Field(..., description="Notification category")
    data: Dict[str, Any] = Field(default_factory=dict, description="Additional data to send with notification")

class BatchNotificationRequest(BaseModel):
    """Request model for sending a batch notification to users with a specific subscription tier"""
    subscription_tier: str = Field(..., description="Subscription tier to filter users")
    title: str = Field(..., description="Notification title")
    body: str = Field(..., description="Notification body")
    category: str = Field(..., description="Notification category")
    data: Dict[str, Any] = Field(default_factory=dict, description="Additional data to send with notification")

class APIResponse(BaseModel):
    """Standard API response model"""
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="A message describing the result")
    data: Dict[str, Any] = Field(default_factory=dict, description="Additional data returned")

# --- Supabase Client Initialization ---
try:
    supabase_url: str = db.secrets.get("SUPABASE_URL")
    supabase_key: str = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(supabase_url, supabase_key)
except Exception as e:
    print(f"Error initializing Supabase client in fcm module: {e}")
    supabase = None


# --- Firebase Admin Initialization ---
_firebase_admin_initialized = False

def initialize_firebase_admin():
    """Initializes the Firebase Admin SDK using credentials from secrets."""
    global _firebase_admin_initialized
    if _firebase_admin_initialized or firebase_admin._apps:
        return

    print("Initializing Firebase Admin SDK in fcm module...")
    try:
        service_account_json_str = db.secrets.get("FIREBASE_SERVICE_ACCOUNT_KEY_JSON")
        if not service_account_json_str:
            print("Error [FCM Init]: FIREBASE_SERVICE_ACCOUNT_KEY_JSON secret not found.")
            return

        service_account_info = json.loads(service_account_json_str)
        cred = credentials.Certificate(service_account_info)
        firebase_admin.initialize_app(cred)
        _firebase_admin_initialized = True
        print("Firebase Admin SDK initialized successfully in fcm module.")

    except json.JSONDecodeError:
        print("Error [FCM Init]: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON secret.")
    except ValueError as e:
        print(f"Error initializing Firebase Admin SDK (ValueError): {e}")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")

# Attempt to initialize when the module is loaded
initialize_firebase_admin()


# --- JWT Authentication Dependency ---
async def get_current_user_id(authorization: Annotated[str | None, Header()] = None) -> str:
    """Validates JWT token from Authorization header and returns user ID."""
    if authorization is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header format")

    token = parts[1]
    try:
        jwt_secret = db.secrets.get("SUPABASE_JWT_SECRET")
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"], audience="authenticated")
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload (sub missing)")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired") from None
    except jwt.InvalidTokenError as e:
        print(f"InvalidTokenError: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}") from e
    except Exception as e:
        print(f"Error during token validation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not validate token") from e



# --- Utility Function: Send FCM Notification ---
# (This is not an API endpoint, but a helper function to be called by other modules)
def send_fcm_notification(user_id: str, title: str, body: str, data: dict | None = None, category: str | None = None):
    """Sends an FCM push notification to a specific user."""
    # Generate a notification ID for tracking
    notification_id = f"{user_id}-{int(time.time())}-{hash(title)}"
    """Sends an FCM push notification to a specific user."""
    global _firebase_admin_initialized
    if not _firebase_admin_initialized and not firebase_admin._apps:
        print("Error [Send Notify]: Firebase Admin SDK not initialized. Trying again...")
        initialize_firebase_admin()
        if not _firebase_admin_initialized and not firebase_admin._apps:
             print("Error [Send Notify]: Initialization failed again. Giving up.")
             return

    global supabase
    if supabase is None:
        print(f"Error [Send Notify]: Supabase client is None. Cannot fetch token for user {user_id}.")
        return

    print(f"Attempting to send notification to user_id: {user_id}, title: {title}")
    try:
        # 0. Check if user has opted out of notifications for this category
        if category:
            profile_response = supabase.table("profiles").select("push_notifications,notification_categories").eq("id", user_id).execute()
            
            if profile_response.data and len(profile_response.data) > 0:
                profile = profile_response.data[0]
                
                # Skip if user has opted out of push notifications entirely
                if not profile.get("push_notifications", True):
                    print(f"User {user_id} has opted out of push notifications")
                    return
                
                # Skip if user has opted out of this specific category
                categories = profile.get("notification_categories", [])
                if categories and category not in categories:
                    print(f"User {user_id} has opted out of {category} notifications")
                    return
        
        # Fetch FCM token(s) from devices table (tokens are stored with each device)
        response = supabase.table("devices").select("fcm_token").eq("user_id", user_id).is_("fcm_token", "not.null").execute()
        if not response.data:
            print(f"No FCM tokens found for user_id: {user_id}")
            return

        tokens = [item['fcm_token'] for item in response.data if item.get('fcm_token')]
        if not tokens:
             print(f"No valid FCM tokens extracted for user_id: {user_id}")
             return
        print(f"Found {len(tokens)} token(s) for user {user_id}.")

        # 2. Construct message
        merged_data = {"category": category} if category else {}
        if data:
            merged_data.update(data)
        
        # Make sure all data values are strings for FCM compatibility
        # Add notification_id for tracking purposes
        merged_data["notification_id"] = notification_id
        safe_data = {str(k): str(v) for k, v in merged_data.items()} if merged_data else None
        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data=safe_data,
            tokens=tokens,
        )

        # 3. Send message
        batch_response = messaging.send_multicast(message)
        print(f"FCM send_multicast response: Success={batch_response.success_count}, Failure={batch_response.failure_count}")

        # 4. Handle failures (delete unregistered tokens)
        if batch_response.failure_count > 0:
            responses = batch_response.responses
            tokens_to_delete = []
            for idx, resp in enumerate(responses):
                if not resp.success:
                    token = tokens[idx]
                    # Default error code extraction
                    error_code = getattr(resp.exception, 'code', None)
                    # More specific check for unregistered/invalid argument
                    is_unregistered = False
                    if error_code == 'messaging/registration-token-not-registered':
                        is_unregistered = True
                    elif error_code == 'messaging/invalid-argument' and 'registration token' in str(resp.exception).lower():
                         is_unregistered = True
                    # Fallback check in exception string itself
                    elif 'messaging/registration-token-not-registered' in str(resp.exception):
                        is_unregistered = True

                    print(f"  Token {token} failed: {resp.exception} (Code: {error_code}, Unregistered: {is_unregistered})")
                    if is_unregistered:
                         tokens_to_delete.append(token)

            if tokens_to_delete:
                # Dedup tokens before attempting delete
                unique_tokens_to_delete = list(set(tokens_to_delete))
                print(f"Attempting to delete {len(unique_tokens_to_delete)} unique unregistered tokens...")
                try:
                    for token in unique_tokens_to_delete:
                        supabase.table("devices").update({"fcm_token": None}).eq("fcm_token", token).execute()
                    print(f"Successfully cleared unregistered tokens from devices table")
                except Exception as delete_e:
                    print(f"Error deleting unregistered tokens from devices table: {delete_e}")

    except Exception as e:
        print(f"Error sending FCM notification to user {user_id}: {e}")
        return False
    
    return True


# --- API Endpoints ---
@router.post("/send", response_model=APIResponse)
async def send_notification(request: NotificationRequest, user_id: str = Depends(get_current_user_id)):
    """Send a notification to a specific user"""
    # Verify the requesting user matches the target user (security check)
    if user_id != request.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only send notifications to yourself"
        )
        
    # Ensure the category is valid
    if request.category not in NotificationCategory.ALL_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(NotificationCategory.ALL_CATEGORIES)}"
        )
    
    # Send the notification
    result = send_fcm_notification(
        user_id=request.user_id,
        title=request.title,
        body=request.body,
        data=request.data,
        category=request.category
    )
    
    if result:
        return APIResponse(
            success=True,
            message="Notification sent successfully",
            data={"user_id": request.user_id}
        )
    else:
        return APIResponse(
            success=False,
            message="Failed to send notification",
            data={"user_id": request.user_id}
        )


@router.post("/admin/send", response_model=APIResponse)
async def admin_send_notification(request: AdminNotificationRequest, user_id: str = Depends(get_current_user_id)):
    """Send a notification to multiple users (admin only)"""
    # Verify the requesting user is an admin
    profile_response = supabase.table("profiles").select("is_admin").eq("id", user_id).execute()
    
    if not profile_response.data or not profile_response.data[0].get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin rights required for this operation"
        )
    
    # Ensure the category is valid
    if request.category not in NotificationCategory.ALL_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(NotificationCategory.ALL_CATEGORIES)}"
        )
    
    # Send notifications to all users in the list
    results = {
        "success": [],
        "failure": []
    }
    
    for target_user_id in request.user_ids:
        result = send_fcm_notification(
            user_id=target_user_id,
            title=request.title,
            body=request.body,
            data=request.data,
            category=request.category
        )
        
        if result:
            results["success"].append(target_user_id)
        else:
            results["failure"].append(target_user_id)
    
    return APIResponse(
        success=len(results["failure"]) == 0,
        message=f"Sent {len(results['success'])}/{len(request.user_ids)} notifications successfully",
        data=results
    )


@router.post("/test", response_model=APIResponse)
async def test_notification(user_id: str = Depends(get_current_user_id)):
    """Send a test notification to the current user"""
    # Send a test notification with all categories
    results = {}
    
    for category in NotificationCategory.ALL_CATEGORIES:
        result = send_fcm_notification(
            user_id=user_id,
            title=f"Test {category} notification",
            body=f"This is a test notification for the {category} category",
            data={"test": "true", "timestamp": str(int(time.time()))},
            category=category
        )
        results[category] = "success" if result else "failed"
    
    return APIResponse(
        success=True,
        message="Test notifications sent",
        data={
            "user_id": user_id,
            "results": results
        }
    )


@router.post("/admin/batch", response_model=APIResponse)
async def admin_batch_notification(request: BatchNotificationRequest, user_id: str = Depends(get_current_user_id)):
    """Send a notification to all users with a specific subscription tier (admin only)"""
    # Verify the requesting user is an admin
    profile_response = supabase.table("profiles").select("is_admin").eq("id", user_id).execute()
    
    if not profile_response.data or not profile_response.data[0].get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin rights required for this operation"
        )
    
    # Ensure the category is valid
    if request.category not in NotificationCategory.ALL_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(NotificationCategory.ALL_CATEGORIES)}"
        )
    
    # Get all users with specified subscription tier
    users_response = supabase.table("profiles").select("id").eq("subscription_tier", request.subscription_tier).execute()
    
    if not users_response.data:
        return APIResponse(
            success=True,
            message=f"No users found with subscription tier: {request.subscription_tier}",
            data={"count": 0}
        )
    
    user_ids = [user["id"] for user in users_response.data]
    
    # Send notifications to all users in the list
    results = {
        "success": [],
        "failure": []
    }
    
    for target_user_id in user_ids:
        result = send_fcm_notification(
            user_id=target_user_id,
            title=request.title,
            body=request.body,
            data=request.data,
            category=request.category
        )
        
        if result:
            results["success"].append(target_user_id)
        else:
            results["failure"].append(target_user_id)
    
    return APIResponse(
        success=len(results["failure"]) == 0,
        message=f"Sent {len(results['success'])}/{len(user_ids)} notifications successfully",
        data={
            "total": len(user_ids),
            "success_count": len(results["success"]),
            "failure_count": len(results["failure"])
        }
    )
