# src/app/apis/analytics/__init__.py

import databutton as db
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from supabase.client import Client, create_client
from typing import Dict, List, Optional, Any, Union
import json

# Import auth functions from fcm module
from app.apis.fcm import get_current_user_id

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# --- Pydantic Models ---
class DeviceTypeAnalytics(BaseModel):
    """Analytics for device types"""
    desktop: int = Field(default=0, description="Number of desktop devices")
    mobile: int = Field(default=0, description="Number of mobile devices")
    tablet: int = Field(default=0, description="Number of tablet devices")
    unknown: int = Field(default=0, description="Number of unknown devices")
    total: int = Field(default=0, description="Total number of devices")

class DeviceActivityAnalytics(BaseModel):
    """Analytics for device activity"""
    daily_active: int = Field(default=0, description="Number of daily active devices")
    weekly_active: int = Field(default=0, description="Number of weekly active devices")
    monthly_active: int = Field(default=0, description="Number of monthly active devices")
    total_active: int = Field(default=0, description="Total number of active devices")
    total_registered: int = Field(default=0, description="Total number of registered devices")

class BrowserAnalytics(BaseModel):
    """Analytics for browser usage"""
    name: str = Field(..., description="Browser name")
    count: int = Field(..., description="Number of devices using this browser")
    percentage: float = Field(..., description="Percentage of devices using this browser")

class OSAnalytics(BaseModel):
    """Analytics for operating system usage"""
    name: str = Field(..., description="Operating system name")
    count: int = Field(..., description="Number of devices using this OS")
    percentage: float = Field(..., description="Percentage of devices using this OS")

class NotificationAnalytics(BaseModel):
    """Analytics for notification delivery and preferences"""
    total_sent: int = Field(default=0, description="Total notifications sent")
    delivery_success_rate: float = Field(default=0.0, description="Notification delivery success rate")
    opt_in_rate: float = Field(default=0.0, description="Percentage of users opted in to notifications")
    category_preferences: Dict[str, int] = Field(default_factory=dict, description="Count of users per notification category")

class DeviceAnalyticsResponse(BaseModel):
    """Complete device analytics response"""
    device_types: DeviceTypeAnalytics = Field(..., description="Device type distribution")
    activity: DeviceActivityAnalytics = Field(..., description="Device activity metrics")
    browsers: List[BrowserAnalytics] = Field(default_factory=list, description="Browser usage statistics")
    operating_systems: List[OSAnalytics] = Field(default_factory=list, description="OS usage statistics")
    notifications: NotificationAnalytics = Field(..., description="Notification delivery and preferences")
    timestamp: str = Field(..., description="Timestamp when analytics were generated")

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
    print(f"Error initializing Supabase client in analytics module: {e}")
    supabase = None

# --- Analytics Helper Functions ---
def get_device_type_analytics() -> DeviceTypeAnalytics:
    """Get device type distribution analytics"""
    device_types = DeviceTypeAnalytics()
    
    try:
        # Query all devices to get type distribution
        response = supabase.table("devices").select("device_type, count").eq("is_active", True).group_by("device_type").execute()
        
        if not response.data:
            return device_types
        
        # Process the counts by device type
        for item in response.data:
            device_type = item.get("device_type", "unknown")
            count = item.get("count", 0)
            
            if device_type == "desktop":
                device_types.desktop = count
            elif device_type == "mobile":
                device_types.mobile = count
            elif device_type == "tablet":
                device_types.tablet = count
            else:
                device_types.unknown = count
        
        # Calculate total
        device_types.total = device_types.desktop + device_types.mobile + device_types.tablet + device_types.unknown
    except Exception as e:
        print(f"Error getting device type analytics: {e}")
    
    return device_types

def get_device_activity_analytics() -> DeviceActivityAnalytics:
    """Get device activity analytics"""
    activity = DeviceActivityAnalytics()
    
    try:
        # Calculate time thresholds for activity metrics
        now = datetime.utcnow()
        daily_threshold = (now - timedelta(days=1)).isoformat()
        weekly_threshold = (now - timedelta(days=7)).isoformat()
        monthly_threshold = (now - timedelta(days=30)).isoformat()
        
        # Get total registered devices
        total_response = supabase.table("devices").select("count").execute()
        if total_response.data and len(total_response.data) > 0:
            activity.total_registered = total_response.data[0].get("count", 0)
        
        # Get total active devices
        active_response = supabase.table("devices").select("count").eq("is_active", True).execute()
        if active_response.data and len(active_response.data) > 0:
            activity.total_active = active_response.data[0].get("count", 0)
        
        # Get daily active devices (seen in last 24 hours)
        daily_response = supabase.table("devices").select("count").gte("last_seen", daily_threshold).execute()
        if daily_response.data and len(daily_response.data) > 0:
            activity.daily_active = daily_response.data[0].get("count", 0)
        
        # Get weekly active devices (seen in last 7 days)
        weekly_response = supabase.table("devices").select("count").gte("last_seen", weekly_threshold).execute()
        if weekly_response.data and len(weekly_response.data) > 0:
            activity.weekly_active = weekly_response.data[0].get("count", 0)
        
        # Get monthly active devices (seen in last 30 days)
        monthly_response = supabase.table("devices").select("count").gte("last_seen", monthly_threshold).execute()
        if monthly_response.data and len(monthly_response.data) > 0:
            activity.monthly_active = monthly_response.data[0].get("count", 0)
    except Exception as e:
        print(f"Error getting device activity analytics: {e}")
    
    return activity

def get_browser_analytics() -> List[BrowserAnalytics]:
    """Get browser usage analytics"""
    browsers = []
    
    try:
        # Query all devices to get browser distribution
        response = supabase.table("devices").select("browser, count").group_by("browser").execute()
        
        if not response.data:
            return browsers
        
        # Calculate the total for percentage calculation
        total_devices = sum(item.get("count", 0) for item in response.data)
        
        # Process the counts by browser
        for item in response.data:
            browser_name = item.get("browser", "Unknown")
            count = item.get("count", 0)
            percentage = (count / total_devices * 100) if total_devices > 0 else 0
            
            browsers.append(BrowserAnalytics(
                name=browser_name,
                count=count,
                percentage=round(percentage, 2)
            ))
        
        # Sort by count descending
        browsers.sort(key=lambda x: x.count, reverse=True)
    except Exception as e:
        print(f"Error getting browser analytics: {e}")
    
    return browsers

def get_os_analytics() -> List[OSAnalytics]:
    """Get operating system usage analytics"""
    operating_systems = []
    
    try:
        # Query all devices to get OS distribution
        response = supabase.table("devices").select("os, count").group_by("os").execute()
        
        if not response.data:
            return operating_systems
        
        # Calculate the total for percentage calculation
        total_devices = sum(item.get("count", 0) for item in response.data)
        
        # Process the counts by OS
        for item in response.data:
            os_name = item.get("os", "Unknown")
            count = item.get("count", 0)
            percentage = (count / total_devices * 100) if total_devices > 0 else 0
            
            operating_systems.append(OSAnalytics(
                name=os_name,
                count=count,
                percentage=round(percentage, 2)
            ))
        
        # Sort by count descending
        operating_systems.sort(key=lambda x: x.count, reverse=True)
    except Exception as e:
        print(f"Error getting OS analytics: {e}")
    
    return operating_systems

def get_notification_analytics() -> NotificationAnalytics:
    """Get notification delivery and preferences analytics"""
    notifications = NotificationAnalytics()
    
    try:
        # Get notification preferences data
        # Check how many users have push notifications enabled
        profiles_response = supabase.table("profiles").select("push_notifications, notification_categories").execute()
        
        if profiles_response.data:
            total_users = len(profiles_response.data)
            opted_in_users = sum(1 for profile in profiles_response.data if profile.get("push_notifications", False))
            
            if total_users > 0:
                notifications.opt_in_rate = round(opted_in_users / total_users * 100, 2)
            
            # Count category preferences
            category_counts = {}
            for profile in profiles_response.data:
                categories = profile.get("notification_categories", [])
                if isinstance(categories, list):
                    for category in categories:
                        category_counts[category] = category_counts.get(category, 0) + 1
            
            notifications.category_preferences = category_counts
        
        # For notification delivery stats, we would ideally track this in a separate table
        # This is a placeholder for now - in a real implementation, you would track these metrics
        # when notifications are sent and store results in a database table
        notifications.total_sent = 0
        notifications.delivery_success_rate = 0.0
    except Exception as e:
        print(f"Error getting notification analytics: {e}")
    
    return notifications

# --- API Endpoints ---
@router.get("/devices", response_model=APIResponse)
async def get_device_analytics(user_id: str = Depends(get_current_user_id)):
    """Get comprehensive device analytics"""
    try:
        # Check if user is an admin
        profile_response = supabase.table("profiles").select("is_admin").eq("id", user_id).execute()
        
        if not profile_response.data or not profile_response.data[0].get("is_admin", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin rights required for this operation"
            )
        
        # Collect all analytics
        device_types = get_device_type_analytics()
        activity = get_device_activity_analytics()
        browsers = get_browser_analytics()
        operating_systems = get_os_analytics()
        notifications = get_notification_analytics()
        
        # Build the complete analytics response
        analytics = DeviceAnalyticsResponse(
            device_types=device_types,
            activity=activity,
            browsers=browsers,
            operating_systems=operating_systems,
            notifications=notifications,
            timestamp=datetime.utcnow().isoformat()
        )
        
        return APIResponse(
            success=True,
            message="Device analytics retrieved successfully",
            data={"analytics": analytics.dict()}
        )
    except HTTPException as http_e:
        raise http_e
    except Exception as e:
        print(f"Error retrieving device analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve device analytics: {str(e)}"
        )

# Track notification delivery events
class NotificationEventRequest(BaseModel):
    """Request model for tracking notification events"""
    event_type: str = Field(..., description="Type of event (delivered, clicked, dismissed)")
    notification_id: str = Field(..., description="Notification ID")
    category: str = Field(None, description="Notification category")
    timestamp: str = Field(None, description="Timestamp of the event")

@router.post("/notification-events", response_model=APIResponse)
async def track_notification_event(request: NotificationEventRequest, user_id: str = Depends(get_current_user_id)):
    """Track notification delivery and interaction events"""
    try:
        # Store the notification event in Supabase
        # This could be expanded to track more detailed analytics
        timestamp = request.timestamp or datetime.utcnow().isoformat()
        
        notification_data = {
            "user_id": user_id,
            "notification_id": request.notification_id,
            "event_type": request.event_type,
            "category": request.category,
            "timestamp": timestamp
        }
        
        # Insert the event into a notification_events table
        response = supabase.table("notification_events").insert(notification_data).execute()
        
        if response.error:
            raise Exception(f"Failed to store notification event: {response.error}")
        
        return APIResponse(
            success=True,
            message=f"Notification {request.event_type} event tracked successfully",
            data={"event_id": response.data[0].get("id") if response.data else None}
        )
    except Exception as e:
        print(f"Error tracking notification event: {e}")
        return APIResponse(
            success=False,
            message=f"Failed to track notification event: {str(e)}",
            data={}
        )
