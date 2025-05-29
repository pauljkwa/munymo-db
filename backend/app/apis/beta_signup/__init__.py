from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, Depends, HTTPException, status
import databutton as db
from supabase import create_client, Client
import json
import uuid
import re

router = APIRouter()

# Beta signup request model
class BetaSignupRequest(BaseModel):
    email: EmailStr
    name: str = Field("")
    referral_source: str = Field("")

# Beta signup response model
class BetaSignupResponse(BaseModel):
    success: bool
    message: str

# Sanitize storage key to only allow alphanumeric and ._- symbols
def sanitize_storage_key(key: str) -> str:
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# Function to initialize the supabase client
def get_supabase_client() -> Client:
    supabase_url = db.secrets.get("SUPABASE_URL")
    supabase_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration is missing"
        )
    
    return create_client(supabase_url, supabase_key)

@router.post("/beta-signup")
def create_beta_signup(request: BetaSignupRequest) -> BetaSignupResponse:
    """
    Register a new beta tester with their email address
    """
    try:
        # Get supabase client
        supabase = get_supabase_client()
        
        # Check if email already exists
        response = supabase.table("beta_testers").select("email").eq("email", request.email).execute()
        
        if response.data and len(response.data) > 0:
            return BetaSignupResponse(
                success=True,  # Still return success to prevent email harvesting
                message="Thank you for your interest! We'll notify you when Munymo beta is available."
            )
        
        # Create new beta tester record
        beta_tester_data = {
            "id": str(uuid.uuid4()),
            "email": request.email,
            "name": request.name,
            "referral_source": request.referral_source,
            "signup_date": "now()",  # Use Supabase's SQL function for current timestamp
        }
        
        # Insert into Supabase
        supabase.table("beta_testers").insert(beta_tester_data).execute()
        
        # Also store in databutton storage as backup
        beta_testers = db.storage.json.get("beta_testers", default=[])
        beta_testers.append(beta_tester_data)
        db.storage.json.put(sanitize_storage_key("beta_testers"), beta_testers)
        
        return BetaSignupResponse(
            success=True,
            message="Thank you for your interest! We'll notify you when Munymo beta is available."
        )
        
    except Exception as e:
        print(f"Error in beta signup: {str(e)}")
        
        # Store failed signups for later processing
        try:
            failed_signups = db.storage.json.get("failed_beta_signups", default=[])
            failed_signups.append({
                "email": request.email,
                "name": request.name,
                "referral_source": request.referral_source,
                "error": str(e)
            })
            db.storage.json.put(sanitize_storage_key("failed_beta_signups"), failed_signups)
        except Exception as backup_error:
            print(f"Error saving failed signup: {str(backup_error)}")
        
        # Still return success to the client to prevent revealing system details
        # We'll process the failed signups manually later
        return BetaSignupResponse(
            success=True,
            message="Thank you for your interest! We'll notify you when Munymo beta is available."
        )
