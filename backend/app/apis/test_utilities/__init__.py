# src/app/apis/test_utilities/__init__.py

from fastapi import APIRouter, Depends, HTTPException, Header, Request, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import databutton as db
from app.env import Mode, mode
import uuid
import json

router = APIRouter(prefix="/test-utilities", tags=["Testing"])

# Flag to bypass authentication in testing mode
# This should be used carefully and only in test environments
BYPASS_AUTH_FOR_TESTING = False

class AuthHeadersResponse(BaseModel):
    auth_headers: Dict[str, str]
    message: str

@router.get("/auth-headers")
def get_auth_headers():
    """Generate authentication headers for testing
    
    Returns headers that can be used for testing authenticated endpoints
    without requiring actual authentication.
    """
    # Ensure this only works in development mode
    if mode != Mode.DEV:
        raise HTTPException(status_code=403, detail="This endpoint is only available in development mode")
    
    # For testing purposes, we'll use fixed values
    test_user_id = f"test-{uuid.uuid4()}"
    
    headers = {
        "Authorization": f"Bearer test_token_{test_user_id}",
        "X-Test-User-Id": test_user_id,
        "X-Test-User-Role": "user",
        "X-Test-User-Tier": "premium"
    }
    
    return AuthHeadersResponse(
        auth_headers=headers,
        message="Use these headers when testing authenticated endpoints in development mode"
    )

# Function to generate test auth token for endpoints
def get_test_auth_token(user_id: str = None, role: str = "user", tier: str = "free"):
    """Generate a test token for authentication bypass
    
    This is used by tests to generate valid tokens without going through
    the full authentication flow.
    """
    import jwt
    import time
    import uuid
    import databutton as db
    
    # Generate user ID if not provided
    user_id = user_id or f"test-{uuid.uuid4()}"
    
    # Current time and expiration (24 hours in the future)
    now = int(time.time())
    exp = now + 24 * 60 * 60
    
    # Create token payload
    payload = {
        "aud": "authenticated",
        "exp": exp,
        "iat": now,
        "iss": "testing@munymo.app",
        "sub": user_id,
        "email": f"{user_id}@test.example.com",
        "role": role,
        "app_metadata": {
            "subscription_tier": tier,
            "provider": "test"
        }
    }
    
    # Get JWT secret for signing
    jwt_secret = db.secrets.get("SUPABASE_JWT_SECRET")
    if not jwt_secret:
        raise ValueError("JWT secret not configured for test auth")
    
    # Sign the token
    return jwt.encode(payload, jwt_secret, algorithm="HS256")