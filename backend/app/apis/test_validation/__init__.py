# src/app/apis/test_validation/__init__.py
# Endpoint to validate that our fixes are working correctly

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import databutton as db
from app.env import Mode, mode
import json
import time

# Import utilities for testing
from app.apis.db_utils import get_supabase_client
from app.apis.predictions_api import get_daily_prediction_pair
from app.apis.test_utilities import get_test_auth_token

router = APIRouter(prefix="/test-validation", tags=["Testing"])

class TestValidationRequest(BaseModel):
    run_auth_test: bool = True
    run_database_test: bool = True
    run_stripe_test: bool = False  # Optional as it requires Stripe setup
    
class TestResult(BaseModel):
    name: str
    success: bool
    details: Dict[str, Any]
    error: Optional[str] = None
    
class TestValidationResponse(BaseModel):
    overall_success: bool
    results: List[TestResult]
    timestamp: str
    environment: str
    message: str

@router.post("/validate-fixes", response_model=TestValidationResponse)
async def validate_fixes2(request: TestValidationRequest):
    """Run validation tests on critical fixes for MYA-83
    
    Tests that the database fix, authentication improvements, and Stripe testing enhancements
    are working correctly.
    """
    # Ensure this only works in development mode
    if mode != Mode.DEV:
        raise HTTPException(status_code=403, detail="This endpoint is only available in development mode")
    
    results = []
    all_success = True
    
    # Test 1: Database fix for daily prediction pair
    if request.run_database_test:
        try:
            # Call the prediction pair endpoint directly
            prediction_data = get_daily_prediction_pair()
            
            # Convert to dict if it's a Pydantic model
            if hasattr(prediction_data, "dict"):
                prediction_dict = prediction_data.dict()
            else:
                prediction_dict = prediction_data
                
            # Check if we have valid response structure
            success = (
                isinstance(prediction_dict, dict) and
                'company_a' in prediction_dict and
                'company_b' in prediction_dict and
                'pair_id' in prediction_dict
            )
            
            details = {
                "has_data": success,
                "response_keys": list(prediction_data.keys()) if isinstance(prediction_data, dict) else [],
                "company_a": prediction_data.get("company_a") if isinstance(prediction_data, dict) else None,
                "company_b": prediction_data.get("company_b") if isinstance(prediction_data, dict) else None
            }
            
            results.append(TestResult(
                name="Database Fix Test",
                success=success,
                details=details,
                error=None if success else "Response missing required fields"
            ))
            
            if not success:
                all_success = False
                
        except Exception as e:
            all_success = False
            results.append(TestResult(
                name="Database Fix Test",
                success=False,
                details={},
                error=f"Error testing database fix: {str(e)}"
            ))
    
    # Test 2: Authentication improvements
    if request.run_auth_test:
        try:
            # Generate a test token
            test_user_id = f"test-user-{int(time.time())}"
            auth_token = get_test_auth_token(user_id=test_user_id, role="admin", tier="premium")
            
            # Validate token structure
            token_parts = auth_token.split('.')
            token_valid = len(token_parts) == 3  # Header, payload, signature
            
            # Basic validation of the token
            success = token_valid and len(auth_token) > 50  # Simple length check
            
            details = {
                "token_generated": bool(auth_token),
                "token_structure_valid": token_valid,
                "test_user_id": test_user_id,
                "token_length": len(auth_token) if auth_token else 0
            }
            
            results.append(TestResult(
                name="Authentication Test",
                success=success,
                details=details,
                error=None if success else "Failed to generate valid authentication token"
            ))
            
            if not success:
                all_success = False
                
        except Exception as e:
            all_success = False
            results.append(TestResult(
                name="Authentication Test",
                success=False,
                details={},
                error=f"Error testing authentication: {str(e)}"
            ))
    
    # Test 3: Stripe testing enhancements (optional)
    if request.run_stripe_test:
        try:
            # Import stripe testing module
            from app.apis.test_stripe import STRIPE_TEST_PLANS
            
            # Basic validation that plans exist
            plans_exist = bool(STRIPE_TEST_PLANS) and len(STRIPE_TEST_PLANS) > 0
            premium_plan_exists = any(p.get('tier') == 'premium' for p in STRIPE_TEST_PLANS.values())
            
            details = {
                "test_plans_available": plans_exist,
                "premium_plan_available": premium_plan_exists,
                "number_of_plans": len(STRIPE_TEST_PLANS) if STRIPE_TEST_PLANS else 0,
                "plan_keys": list(STRIPE_TEST_PLANS.keys()) if STRIPE_TEST_PLANS else []
            }
            
            success = plans_exist and premium_plan_exists
            
            results.append(TestResult(
                name="Stripe Testing Enhancement Test",
                success=success,
                details=details,
                error=None if success else "Stripe test plans not properly configured"
            ))
            
            if not success:
                all_success = False
                
        except Exception as e:
            # Not making this a failure since it's optional
            results.append(TestResult(
                name="Stripe Testing Enhancement Test",
                success=False,
                details={},
                error=f"Error testing Stripe enhancements: {str(e)}"
            ))
    
    # Prepare response
    response = TestValidationResponse(
        overall_success=all_success,
        results=results,
        timestamp=time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
        environment=mode.value,
        message="All fixes have been validated successfully" if all_success else "Some fixes require attention"
    )
    
    return response
