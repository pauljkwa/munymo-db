# Test validation module for CI/CD integration
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
import databutton as db
from datetime import datetime, timedelta
import json
import time
import uuid

# Import Supabase storage functions
from app.apis.test_storage import store_validation_results_supabase, get_validation_results_supabase

# Create router
# Create the router that FastAPI will use
router = APIRouter(prefix="/validation", tags=["Testing"])

# For backward compatibility
validation_router = router

# Models
class ValidationResult(BaseModel):
    component: str = Field(..., description="Component being validated")
    status: str = Field(..., description="Status of the validation")  # pass, fail, pending
    details: Dict[str, Any] = Field(default_factory=dict, description="Validation details")
    timestamp: str = Field(..., description="Time of validation")

class ValidationSummary(BaseModel):
    success: bool = Field(..., description="Overall validation success")
    message: str = Field(..., description="Validation summary message")
    results: List[ValidationResult] = Field(..., description="Individual validation results")
    timestamp: str = Field(..., description="Time of validation")
    ci_build_id: Optional[str] = Field(None, description="CI build ID if run in CI environment")

class ValidationRequest(BaseModel):
    components: Optional[List[str]] = Field(None, description="Specific components to validate")
    ci_build_id: Optional[str] = Field(None, description="CI build ID for tracking")

# Store validation history
async def store_validation_results(results: ValidationSummary) -> str:
    """Store validation results in Supabase"""
    try:
        # Store in Supabase
        validation_id = str(uuid.uuid4())
        results_dict = results.dict()
        results_dict["validation_id"] = validation_id
        
        await store_validation_results_supabase(results_dict)
        return validation_id
    except Exception as e:
        print(f"Error storing validation results in Supabase: {e}")
        return None

# Helper functions for component validation
def validate_database():
    """Validate database connections and schema"""
    try:
        # Test if we can connect to Supabase and fetch data
        from supabase import create_client, Client
        
        supabase_url = db.secrets.get("SUPABASE_URL")
        supabase_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            return ValidationResult(
                component="database",
                status="fail",
                details={
                    "error": "Missing Supabase credentials",
                    "message": "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in secrets"
                },
                timestamp=datetime.now().isoformat()
            )
            
        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Check tables existence
        required_tables = ["profiles", "games", "predictions", "devices"]
        table_results = {}
        
        for table in required_tables:
            try:
                # Try to get a single row to test access
                response = supabase.table(table).select("count(*)").limit(1).execute()
                table_results[table] = {
                    "exists": True,
                    "row_count": response.count if hasattr(response, 'count') else None,
                    "status": "pass"
                }
            except Exception as table_error:
                table_results[table] = {
                    "exists": False,
                    "error": str(table_error),
                    "status": "fail"
                }
        
        # Check if all tables passed
        all_passed = all(result.get("status") == "pass" for table, result in table_results.items())
        
        return ValidationResult(
            component="database",
            status="pass" if all_passed else "fail",
            details={
                "tables": table_results,
                "connection": "successful"
            },
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        return ValidationResult(
            component="database",
            status="fail",
            details={
                "error": str(e),
                "message": "Failed to validate database connection"
            },
            timestamp=datetime.now().isoformat()
        )

def validate_authentication():
    """Validate authentication system"""
    try:
        # Test if authentication system is working
        from supabase import create_client, Client
        
        supabase_url = db.secrets.get("SUPABASE_URL")
        supabase_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            return ValidationResult(
                component="authentication",
                status="fail",
                details={
                    "error": "Missing Supabase credentials",
                    "message": "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in secrets"
                },
                timestamp=datetime.now().isoformat()
            )
        
        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Check if we can access user administration
        try:
            auth_response = supabase.auth.admin.list_users()
            user_count = len(auth_response.users) if hasattr(auth_response, 'users') else 0
            
            auth_details = {
                "user_count": user_count,
                "admin_access": "successful"
            }
            
            # Try to create a temporary test user (will be removed after test)
            test_email = f"temp_test_{uuid.uuid4()}@example.com"
            test_password = str(uuid.uuid4())
            
            try:
                create_response = supabase.auth.admin.create_user({
                    "email": test_email,
                    "password": test_password,
                    "email_confirm": True
                })
                
                test_user_id = create_response.user.id if hasattr(create_response, 'user') else None
                
                if test_user_id:
                    # Successfully created test user, now delete it
                    try:
                        supabase.auth.admin.delete_user(test_user_id)
                        auth_details["test_user_creation"] = "pass"
                        auth_details["test_user_deletion"] = "pass"
                    except Exception as delete_error:
                        auth_details["test_user_creation"] = "pass"
                        auth_details["test_user_deletion"] = "fail"
                        auth_details["deletion_error"] = str(delete_error)
                else:
                    auth_details["test_user_creation"] = "pass but no user ID returned"
            except Exception as create_error:
                auth_details["test_user_creation"] = "fail"
                auth_details["creation_error"] = str(create_error)
            
            # Determine overall status
            auth_status = "pass"
            if auth_details.get("test_user_creation") != "pass" or auth_details.get("admin_access") != "successful":
                auth_status = "fail"
                
            return ValidationResult(
                component="authentication",
                status=auth_status,
                details=auth_details,
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as auth_error:
            return ValidationResult(
                component="authentication",
                status="fail",
                details={
                    "error": str(auth_error),
                    "message": "Failed to access authentication system"
                },
                timestamp=datetime.now().isoformat()
            )
            
    except Exception as e:
        return ValidationResult(
            component="authentication",
            status="fail",
            details={
                "error": str(e),
                "message": "Failed to validate authentication system"
            },
            timestamp=datetime.now().isoformat()
        )

def validate_payment_system():
    """Validate payment system (Stripe)"""
    try:
        # Check if Stripe keys are available
        stripe_secret_key = db.secrets.get("STRIPE_SECRET_KEY")
        stripe_webhook_secret = db.secrets.get("STRIPE_WEBHOOK_SECRET")
        
        if not stripe_secret_key or not stripe_webhook_secret:
            return ValidationResult(
                component="payments",
                status="fail",
                details={
                    "error": "Missing Stripe credentials",
                    "message": "STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not found in secrets"
                },
                timestamp=datetime.now().isoformat()
            )
        
        # Import Stripe and check connection
        import stripe
        stripe.api_key = stripe_secret_key
        
        try:
            # Perform a simple API call to verify connection
            product_list = stripe.Product.list(limit=1)
            
            # Check webhook endpoint is registered
            webhook_endpoints = stripe.WebhookEndpoint.list(limit=10)
            webhook_details = []
            
            for endpoint in webhook_endpoints.get('data', []):
                webhook_details.append({
                    "id": endpoint.get('id'),
                    "url": endpoint.get('url'),
                    "status": endpoint.get('status'),
                    "enabled_events": endpoint.get('enabled_events')
                })
            
            # Determine if we have the correct webhook endpoints
            prod_webhook_found = any(
                "prod" in endpoint.get('url', '').lower() and 
                endpoint.get('status') == 'enabled' 
                for endpoint in webhook_details
            )
            
            dev_webhook_found = any(
                "dev" in endpoint.get('url', '').lower() and 
                endpoint.get('status') == 'enabled' 
                for endpoint in webhook_details
            )
            
            return ValidationResult(
                component="payments",
                status="pass",
                details={
                    "connection": "successful",
                    "prod_webhook": "found" if prod_webhook_found else "not found",
                    "dev_webhook": "found" if dev_webhook_found else "not found",
                    "webhook_endpoints": webhook_details
                },
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as stripe_error:
            return ValidationResult(
                component="payments",
                status="fail",
                details={
                    "error": str(stripe_error),
                    "message": "Failed to connect to Stripe API"
                },
                timestamp=datetime.now().isoformat()
            )
            
    except Exception as e:
        return ValidationResult(
            component="payments",
            status="fail",
            details={
                "error": str(e),
                "message": "Failed to validate payment system"
            },
            timestamp=datetime.now().isoformat()
        )

def validate_ai_components():
    """Validate AI components (OpenAI)"""
    try:
        # Check if OpenAI API key is available
        openai_api_key = db.secrets.get("OPENAI_API_KEY")
        
        if not openai_api_key:
            return ValidationResult(
                component="ai_components",
                status="fail",
                details={
                    "error": "Missing OpenAI API key",
                    "message": "OPENAI_API_KEY not found in secrets"
                },
                timestamp=datetime.now().isoformat()
            )
        
        # Import OpenAI and check connection
        from openai import OpenAI
        
        client = OpenAI(api_key=openai_api_key)
        
        try:
            # Make a simple API call to check connection
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": "Hello, this is a test."}],
                max_tokens=10
            )
            
            return ValidationResult(
                component="ai_components",
                status="pass",
                details={
                    "connection": "successful",
                    "model_tested": "gpt-4o-mini",
                    "response": {
                        "received": True,
                        "model": response.model,
                        "id": response.id
                    }
                },
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as openai_error:
            return ValidationResult(
                component="ai_components",
                status="fail",
                details={
                    "error": str(openai_error),
                    "message": "Failed to connect to OpenAI API"
                },
                timestamp=datetime.now().isoformat()
            )
            
    except Exception as e:
        return ValidationResult(
            component="ai_components",
            status="fail",
            details={
                "error": str(e),
                "message": "Failed to validate AI components"
            },
            timestamp=datetime.now().isoformat()
        )

def validate_scheduler():
    """Validate scheduler functionality"""
    try:
        # Import scheduler status API if available
        try:
            from app.apis.scheduler import get_scheduler_status
            
            # Call the status function to check state
            scheduler_status = get_scheduler_status()
            
            return ValidationResult(
                component="scheduler",
                status="pass",
                details={
                    "active": scheduler_status.get("active", False),
                    "tasks": scheduler_status.get("tasks", []),
                    "last_run": scheduler_status.get("last_run"),
                    "next_run": scheduler_status.get("next_run")
                },
                timestamp=datetime.now().isoformat()
            )
        except (ImportError, AttributeError):
            # If scheduler module doesn't exist or function not found
            # Try alternative method to check scheduler
            try:
                # Check if we can access the scheduler database table
                from supabase import create_client, Client
                
                supabase_url = db.secrets.get("SUPABASE_URL")
                supabase_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
                
                if not supabase_url or not supabase_key:
                    raise Exception("Missing Supabase credentials")
                    
                # Initialize Supabase client
                supabase: Client = create_client(supabase_url, supabase_key)
                
                # Try to fetch scheduler state from database
                response = supabase.table("scheduler_state").select("*").limit(1).execute()
                
                if response.data and len(response.data) > 0:
                    scheduler_data = response.data[0]
                    return ValidationResult(
                        component="scheduler",
                        status="pass",
                        details={
                            "active": scheduler_data.get("active", False),
                            "last_run": scheduler_data.get("last_run"),
                            "next_run": scheduler_data.get("next_run"),
                            "note": "Data retrieved from database table"
                        },
                        timestamp=datetime.now().isoformat()
                    )
                else:
                    return ValidationResult(
                        component="scheduler",
                        status="fail",
                        details={
                            "error": "No scheduler data found in database",
                            "message": "The scheduler table exists but no data was found"
                        },
                        timestamp=datetime.now().isoformat()
                    )
            except Exception as alt_error:
                return ValidationResult(
                    component="scheduler",
                    status="fail",
                    details={
                        "error": str(alt_error),
                        "message": "Both direct module import and database access failed"
                    },
                    timestamp=datetime.now().isoformat()
                )
    except Exception as e:
        return ValidationResult(
            component="scheduler",
            status="fail",
            details={
                "error": str(e),
                "message": "Failed to validate scheduler"
            },
            timestamp=datetime.now().isoformat()
        )

# Map of all available validation functions
VALIDATION_FUNCTIONS = {
    "database": validate_database,
    "authentication": validate_authentication,
    "payments": validate_payment_system,
    "ai_components": validate_ai_components,
    "scheduler": validate_scheduler
}

@router.post("/", response_model=ValidationSummary)
async def validate_fixes(body: Optional[ValidationRequest] = None):
    """Validate that all system components are properly configured and working"""
    try:
        # Initialize request body if None
        if body is None:
            body = ValidationRequest()
        
        # Get components to validate (default to all)
        components_to_validate = body.components or list(VALIDATION_FUNCTIONS.keys())
        
        # Track validation results
        validation_results = []
        
        # Execute each validation function
        for component in components_to_validate:
            if component in VALIDATION_FUNCTIONS:
                try:
                    start_time = time.time()
                    result = VALIDATION_FUNCTIONS[component]()
                    end_time = time.time()
                    
                    # Add execution time to details
                    if isinstance(result.details, dict):
                        result.details["execution_time"] = f"{(end_time - start_time):.2f}s"
                    
                    validation_results.append(result)
                except Exception as func_error:
                    # If validation function itself fails
                    validation_results.append(
                        ValidationResult(
                            component=component,
                            status="fail",
                            details={
                                "error": str(func_error),
                                "message": f"Validation function for {component} failed"
                            },
                            timestamp=datetime.now().isoformat()
                        )
                    )
            else:
                # Unknown component
                validation_results.append(
                    ValidationResult(
                        component=component,
                        status="fail",
                        details={
                            "error": "Unknown component",
                            "message": f"No validation function exists for component '{component}'",
                            "available_components": list(VALIDATION_FUNCTIONS.keys())
                        },
                        timestamp=datetime.now().isoformat()
                    )
                )
        
        # Determine overall success (all components must pass)
        all_passed = all(result.status == "pass" for result in validation_results)
        
        # Create summary
        summary = ValidationSummary(
            success=all_passed,
            message="All systems operational" if all_passed else "One or more systems need attention",
            results=validation_results,
            timestamp=datetime.now().isoformat(),
            ci_build_id=body.ci_build_id
        )
        
        # Store the validation results
        storage_key = await store_validation_results(summary)
        if storage_key:
            # Add storage reference to the response
            if isinstance(summary.dict(), dict) and "details" not in summary.dict():
                summary_dict = summary.dict()
                summary_dict["details"] = {}
                summary_dict["details"]["storage_key"] = storage_key
                # We need to create a new ValidationSummary since it's immutable
                summary = ValidationSummary(**summary_dict)
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Validation process failed: {str(e)}"
        )
