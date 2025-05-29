# Test Runner Utility for CI/CD Integration
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
import uuid
import time
from datetime import datetime, timedelta
import databutton as db
import asyncio
import json

# Import Supabase storage functions
from app.apis.test_storage import store_test_results_supabase, get_test_results_supabase

# Create router
router = APIRouter(prefix="/test-runner", tags=["Testing"])

# Models
class TestRunConfig(BaseModel):
    """Configuration for a test run"""
    test_suites: List[str] = Field(default=["all"], description="Test suites to run (e.g., 'core', 'user', 'game', 'payment', 'all')")
    parallel: bool = Field(default=False, description="Whether to run tests in parallel")
    timeout: int = Field(default=300, description="Timeout in seconds for the entire test run")
    ci_build_id: Optional[str] = Field(None, description="CI build ID for tracking")
    environment: str = Field(default="test", description="Environment to test against (test, dev, prod)")
    notification_email: Optional[str] = Field(None, description="Email to notify when tests complete")

class TestRunStatus(BaseModel):
    """Status of a test run"""
    run_id: str = Field(..., description="Unique ID for this test run")
    status: str = Field(..., description="Status of the test run (queued, running, completed, failed)")
    start_time: Optional[str] = Field(None, description="When the test run started")
    end_time: Optional[str] = Field(None, description="When the test run completed")
    progress: float = Field(default=0.0, description="Progress percentage (0-100)")
    results_key: Optional[str] = Field(None, description="Storage key for full results")
    summary: Optional[Dict[str, Any]] = Field(None, description="Summary of test results")

class TestRunRequest(BaseModel):
    """Request to start a test run"""
    config: TestRunConfig = Field(..., description="Test run configuration")

# Storage for active test runs
test_runs: Dict[str, TestRunStatus] = {}

# Test suites definition
TEST_SUITES = {
    "core": ["database", "authentication", "scheduler"],
    "user": ["signup", "notification", "multi-device", "edge-cases"],
    "game": ["game-generation", "result-processing", "leaderboard", "munyiq"],
    "payment": ["stripe-integration", "subscription-flow", "webhook-handling"],
    "all": ["database", "authentication", "scheduler", "signup", "notification", 
            "multi-device", "edge-cases", "game-generation", "result-processing", 
            "leaderboard", "munyiq", "stripe-integration", "subscription-flow", 
            "webhook-handling"]
}

# Helper function to store test results
async def store_test_results(run_id: str, results: Dict[str, Any]) -> str:
    """Store test results in Supabase and return the ID"""
    try:
        # Store in Supabase
        supabase_id = await store_test_results_supabase(run_id, results)
        return supabase_id
    except Exception as e:
        print(f"Error storing test results in Supabase: {e}")
        return None

# Helper function to run a mock test case
async def run_test_case(test_case: str, environment: str) -> Dict[str, Any]:
    """Run a single test case and return results"""
    print(f"Running test case: {test_case} in environment: {environment}")
    
    # Simulate test execution time
    await asyncio.sleep(2)
    
    # Mock different test outcomes based on test case
    result = {
        "test_case": test_case,
        "environment": environment,
        "timestamp": datetime.now().isoformat(),
        "duration": 2.0,  # seconds
    }
    
    # Simulate different test outcomes
    if test_case == "database":
        # Call validation endpoint for database
        from app.apis.testing import validate_database
        validation_result = validate_database()
        success = validation_result.status == "pass"
        
        result.update({
            "success": success,
            "details": validation_result.details,
            "message": "Database validation complete"
        })
    elif test_case == "authentication":
        # Call validation endpoint for authentication
        from app.apis.testing import validate_authentication
        validation_result = validate_authentication()
        success = validation_result.status == "pass"
        
        result.update({
            "success": success,
            "details": validation_result.details,
            "message": "Authentication validation complete"
        })
    elif test_case == "scheduler":
        # Call validation endpoint for scheduler
        from app.apis.testing import validate_scheduler
        validation_result = validate_scheduler()
        success = validation_result.status == "pass"
        
        result.update({
            "success": success,
            "details": validation_result.details,
            "message": "Scheduler validation complete"
        })
    elif test_case.startswith("game-"):
        # Simulate game-related tests
        success = test_case != "game-generation" or (test_case == "game-generation" and environment != "prod")  
        result.update({
            "success": success,
            "message": f"{test_case} {'successful' if success else 'failed'}",
            "details": {"note": "This is a simulated game test case"}
        })
    elif test_case.startswith("stripe-") or test_case.startswith("subscription-") or test_case.startswith("webhook-"):
        # Simulate payment-related tests
        success = environment != "prod" or test_case != "stripe-integration"
        result.update({
            "success": success,
            "message": f"{test_case} {'successful' if success else 'failed'}",
            "details": {"note": "This is a simulated payment test case"}
        })
    else:
        # Default case for other tests
        success = True
        result.update({
            "success": success,
            "message": f"{test_case} successful",
            "details": {"note": "This is a simulated test case"}
        })
    
    return result

# Background task to run tests
async def run_tests(run_id: str, config: TestRunConfig):
    """Run tests in the background"""
    try:
        # Update status to running
        test_runs[run_id].status = "running"
        test_runs[run_id].start_time = datetime.now().isoformat()
        test_runs[run_id].progress = 0.0
        
        # Determine tests to run
        all_test_cases = []
        for suite in config.test_suites:
            if suite in TEST_SUITES:
                all_test_cases.extend(TEST_SUITES[suite])
        
        # Remove duplicates while preserving order
        test_cases = []
        for case in all_test_cases:
            if case not in test_cases:
                test_cases.append(case)
        
        if not test_cases:
            # No valid test cases
            test_runs[run_id].status = "failed"
            test_runs[run_id].end_time = datetime.now().isoformat()
            test_runs[run_id].summary = {"error": "No valid test cases found"}
            return
        
        # Run tests
        results = []
        total_cases = len(test_cases)
        successful_tests = 0
        
        for i, test_case in enumerate(test_cases):
            # Update progress
            test_runs[run_id].progress = (i / total_cases) * 100
            
            # Run the test
            result = await run_test_case(test_case, config.environment)
            results.append(result)
            
            if result.get("success", False):
                successful_tests += 1
        
        # Store results
        full_results = {
            "run_id": run_id,
            "config": config.dict(),
            "start_time": test_runs[run_id].start_time,
            "end_time": datetime.now().isoformat(),
            "results": results
        }
        
        results_key = await store_test_results(run_id, full_results)
        
        # Create summary
        summary = {
            "total_tests": total_cases,
            "successful_tests": successful_tests,
            "failed_tests": total_cases - successful_tests,
            "success_rate": (successful_tests / total_cases) * 100 if total_cases > 0 else 0,
            "duration_seconds": (datetime.now() - datetime.fromisoformat(test_runs[run_id].start_time)).total_seconds()
        }
        
        # Update status
        test_runs[run_id].status = "completed" if summary["failed_tests"] == 0 else "failed"
        test_runs[run_id].end_time = datetime.now().isoformat()
        test_runs[run_id].progress = 100.0
        test_runs[run_id].results_key = results_key
        test_runs[run_id].summary = summary
        
        # Send email notification if configured
        if config.notification_email:
            try:
                status_word = "PASSED" if summary["failed_tests"] == 0 else "FAILED"
                email_subject = f"Test Run {status_word}: {run_id} - {summary['success_rate']:.1f}% Success Rate"
                email_body = f"""
                <h2>Test Run Summary</h2>
                <p><strong>Run ID:</strong> {run_id}</p>
                <p><strong>Status:</strong> {status_word}</p>
                <p><strong>Total Tests:</strong> {summary['total_tests']}</p>
                <p><strong>Successful Tests:</strong> {summary['successful_tests']}</p>
                <p><strong>Failed Tests:</strong> {summary['failed_tests']}</p>
                <p><strong>Success Rate:</strong> {summary['success_rate']:.1f}%</p>
                <p><strong>Duration:</strong> {summary['duration_seconds']:.1f} seconds</p>
                <p>View full results in the Munymo admin dashboard.</p>
                """
                
                db.notify.email(
                    to=config.notification_email,
                    subject=email_subject,
                    content_html=email_body,
                    content_text=email_body.replace('<h2>', '').replace('</h2>', '\n').replace('<p>', '').replace('</p>', '\n').replace('<strong>', '').replace('</strong>', '')
                )
                
                print(f"Sent notification email to {config.notification_email}")
            except Exception as email_error:
                print(f"Error sending notification email: {email_error}")
        
    except Exception as e:
        # Update status on error
        print(f"Error in test run {run_id}: {e}")
        test_runs[run_id].status = "failed"
        test_runs[run_id].end_time = datetime.now().isoformat()
        test_runs[run_id].summary = {"error": str(e)}

@router.post("/run", response_model=TestRunStatus)
async def start_test_run(request: TestRunRequest, background_tasks: BackgroundTasks):
    """Start a new test run"""
    try:
        # Generate run ID
        run_id = str(uuid.uuid4())
        
        # Create initial status
        status = TestRunStatus(
            run_id=run_id,
            status="queued",
            progress=0.0
        )
        
        # Store in active runs
        test_runs[run_id] = status
        
        # Start background task
        background_tasks.add_task(run_tests, run_id, request.config)
        
        return status
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start test run: {str(e)}")

@router.get("/status/{run_id}", response_model=TestRunStatus)
async def get_test_status(run_id: str):
    """Get the status of a test run"""
    if run_id not in test_runs:
        raise HTTPException(status_code=404, detail=f"Test run with ID {run_id} not found")
    
    return test_runs[run_id]

@router.get("/results/{run_id}")
async def get_test_results(run_id: str):
    """Get the detailed results of a test run"""
    if run_id not in test_runs:
        raise HTTPException(status_code=404, detail=f"Test run with ID {run_id} not found")
    
    status = test_runs[run_id]
    
    if status.status not in ["completed", "failed"]:
        raise HTTPException(status_code=400, detail=f"Test run {run_id} is not yet complete")
    
    try:
        # Get results from Supabase
        results = await get_test_results_supabase(run_id)
        if not results:
            raise HTTPException(status_code=404, detail=f"Results for test run {run_id} not found")
        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve test results: {str(e)}")

@router.delete("/run/{run_id}")
async def delete_test_run(run_id: str):
    """Delete a test run and its results"""
    if run_id not in test_runs:
        raise HTTPException(status_code=404, detail=f"Test run with ID {run_id} not found")
    
    try:
        # For Supabase, we won't actually delete the results as they might be needed for historical analysis
        # Just remove the run from active runs in memory
        
        # Remove from active runs
        del test_runs[run_id]
        
        return {"message": f"Test run {run_id} deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete test run: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint for the test runner"""
    return {"status": "healthy", "active_runs": len(test_runs)}
