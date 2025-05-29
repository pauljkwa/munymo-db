import databutton as db
import json
from fastapi import APIRouter, HTTPException, Header, Depends, Request, Response, Body
from supabase import create_client, Client
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

# Get Supabase credentials from secrets
supabase_url = db.secrets.get("SUPABASE_URL")
supabase_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")

# Initialize Supabase client with service role key
supabase: Client = create_client(supabase_url, supabase_key)

# Create a router
router = APIRouter()

# Import from FCM module
from app.apis.fcm import send_fcm_notification

# Note: FCM token storage has been consolidated to use only the devices table
# The fcm_tokens module and user_fcm_tokens table have been removed

# Admin notification function
def send_admin_notification(title: str, body: str, data: Dict[str, Any] = None):
    """Send a notification to all admin users"""
    try:
        # Get all admin users
        admin_response = supabase.table("profiles").select("id").eq("is_admin", True).execute()
        
        if not admin_response.data:
            print(f"No admin users found to notify: {title}")
            return False
        
        admin_ids = [admin["id"] for admin in admin_response.data]
        
        # Send to each admin
        for admin_id in admin_ids:
            send_fcm_notification(
                user_id=admin_id,
                title=title,
                body=body,
                data=data,
                category="system_updates"
            )
        
        return True
    except Exception as e:
        print(f"Error sending admin notification: {e}")
        return False

class FcmTokenRequest(BaseModel):
    token: str

@router.post("/device-fcm-token")
async def register_device_fcm_token(request: Request, body: FcmTokenRequest):
    """Store a Firebase Cloud Messaging token for push notifications"""
    # Get user ID from the request header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    try:
        # Verify the token with Supabase
        token = auth_header.replace("Bearer ", "")
        response = supabase.auth.get_user(token)
        user_id = response.user.id
        
        # Get device ID from the request
        device_id = request.cookies.get("munymo_device_id")
        if not device_id:
            # If no device ID in cookies, generate a placeholder one
            device_id = f"api-device-{user_id}"
        
        # Update the device with the FCM token
        # First check if the device exists
        device_response = supabase.table("devices").select("*").eq("user_id", user_id).eq("device_id", device_id).execute()
        
        if device_response.data and len(device_response.data) > 0:
            # Update existing device
            device = device_response.data[0]
            supabase.table("devices").update({"fcm_token": body.token, "last_seen": "now()", "is_active": True}).eq("id", device["id"]).execute()
        else:
            # Create new device with generic name
            supabase.table("devices").insert({
                "user_id": user_id,
                "device_id": device_id,
                "name": "Unknown Device",
                "fcm_token": body.token,
                "is_active": True
            }).execute()
        
        return {"success": True, "message": "FCM token stored successfully"}
    except Exception as e:
        print(f"Error storing FCM token: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to store FCM token: {str(e)}")
