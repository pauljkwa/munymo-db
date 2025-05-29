# src/app/apis/test_auth/__init__.py
# Testing endpoint for authentication during tests

from fastapi import APIRouter, Response, Request, Depends, HTTPException
from pydantic import BaseModel
import jwt
import time
import uuid
import databutton as db
from app.env import Mode, mode

router = APIRouter(prefix="/test-auth", tags=["Testing"])

class TestAuthRequest(BaseModel):
    user_id: str = None  # If None, a random test user ID will be generated
    role: str = "user"  # Can be user, admin, super_admin
    tier: str = "free"  # Can be free, premium, pro

class TestAuthResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user_id: str
    role: str
    tier: str

@router.post("/token", response_model=TestAuthResponse)
def get_test_auth_token(request: TestAuthRequest):
    """Generate a test authentication token for testing purposes
    
    This endpoint is only available in development mode and should never be
    exposed in production. It generates a valid JWT token that can be used
    for testing endpoints that require authentication.
    """
    # Ensure this only works in development mode
    if mode != Mode.DEV:
        raise HTTPException(status_code=403, detail="This endpoint is only available in development mode")
    
    # Get JWT secret for signing
    jwt_secret = db.secrets.get("SUPABASE_JWT_SECRET")
    if not jwt_secret:
        raise HTTPException(status_code=500, detail="JWT secret not configured for test auth")
    
    # Generate user ID if not provided
    user_id = request.user_id or f"test-{uuid.uuid4()}"
    
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
        "role": request.role,
        "app_metadata": {
            "subscription_tier": request.tier,
            "provider": "test"
        }
    }
    
    # Sign the token
    token = jwt.encode(payload, jwt_secret, algorithm="HS256")
    
    # Create response
    return TestAuthResponse(
        access_token=token,
        user_id=user_id,
        role=request.role,
        tier=request.tier
    )

@router.get("/verify")
def verify_test_token(request: Request):
    """Verify a test token from Authorization header
    
    This endpoint can be used to verify if a test token is valid and will be
    accepted by the authentication system. Useful for debugging auth issues.
    """
    # Ensure this only works in development mode
    if mode != Mode.DEV:
        raise HTTPException(status_code=403, detail="This endpoint is only available in development mode")
    
    # Check for Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No valid authorization header found")
    
    # Extract token
    token = auth_header.split(" ")[1]
    
    # Get JWT secret for verification
    jwt_secret = db.secrets.get("SUPABASE_JWT_SECRET")
    if not jwt_secret:
        raise HTTPException(status_code=500, detail="JWT secret not configured for test auth")
    
    try:
        # Verify the token
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        # Return the decoded payload for inspection
        return {
            "valid": True,
            "payload": payload,
            "user_id": payload.get("sub"),
            "expires_at": payload.get("exp")
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying token: {str(e)}")
