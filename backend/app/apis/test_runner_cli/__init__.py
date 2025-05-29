# Test Runner CLI Module
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
import time
import json

router = APIRouter(prefix="/test-runner-cli", tags=["Testing"])

# Models
class TestRunRequest(BaseModel):
    components: Optional[List[str]] = Field(None, description="Components to test (all if not specified)")
    features: Optional[List[str]] = Field(None, description="Features to test (all if not specified)")
    tests: Optional[List[str]] = Field(None, description="Specific tests to run (all if not specified)")
    environment: str = Field(default="test", description="Environment to run tests in")
    reporter: str = Field(default="default", description="Test result reporter to use")

class TestRunStatus(BaseModel):
    run_id: str = Field(..., description="Unique ID for this test run")
    status: str = Field(..., description="Current status of the test run")
    start_time: str = Field(..., description="When the test run started")
    end_time: Optional[str] = Field(None, description="When the test run finished")
    total_tests: int = Field(..., description="Total number of tests in the run")
    completed_tests: int = Field(..., description="Number of completed tests")
    passed_tests: int = Field(..., description="Number of passed tests")
    failed_tests: int = Field(..., description="Number of failed tests")
    error_message: Optional[str] = Field(None, description="Error message if the run failed")

class TestCaseResult(BaseModel):
    test_id: str = Field(..., description="ID of the test case")
    name: str = Field(..., description="Name of the test case")
    component: str = Field(..., description="Component the test belongs to")
    features: List[str] = Field(..., description="Features the test verifies")
    status: str = Field(..., description="Status of the test case (passed, failed, skipped, error)")
    duration: float = Field(..., description="Duration of the test in seconds")
    error_message: Optional[str] = Field(None, description="Error message if the test failed")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional test details")

class TestRunResults(BaseModel):
    run_id: str = Field(..., description="Unique ID for this test run")
    summary: TestRunStatus = Field(..., description="Summary of the test run")
    results: List[TestCaseResult] = Field(..., description="Results of individual test cases")

# In-memory storage for test runs
_test_runs: Dict[str, TestRunStatus] = {}
_test_results: Dict[str, List[TestCaseResult]] = {}

# Mock test cases (would be loaded from test_feature_map in a real implementation)
MOCK_TEST_CASES = [
    {
        "test_id": "user-registration-flow",
        "name": "User Registration Flow",
        "component": "user_management",
        "features": ["user_registration"],
        "duration": 0.8,
        "status": "passed"
    },
    {
        "test_id": "authentication-flow",
        "name": "User Authentication Flow",
        "component": "user_management", 
        "features": ["user_authentication"],
        "duration": 1.2,
        "status": "passed"
    },
    {
        "test_id": "game-generation", 
        "name": "Daily Game Generation",
        "component": "game_mechanics",
        "features": ["game_generation", "company_selection"],
        "duration": 2.5,
        "status": "passed"
    },
    {
        "test_id": "prediction-submission",
        "name": "Prediction Submission",
        "component": "predictions",
        "features": ["prediction_submission", "prediction_validation"],
        "duration": 0.9,
        "status": "passed"
    },
    {
        "test_id": "results-processing",
        "name": "Results Processing",
        "component": "results_processing",
        "features": ["results_calculation"],
        "duration": 1.5,
        "status": "passed" 
    },
    {
        "test_id": "subscription-purchase",
        "name": "Subscription Purchase",
        "component": "subscription",
        "features": ["subscription_management", "payment_processing"],
        "duration": 3.0,
        "status": "passed"
    },
    {
        "test_id": "notification-delivery",
        "name": "Push Notification Delivery",
        "component": "notifications",
        "features": ["push_notifications"],
        "duration": 1.8,
        "status": "passed"
    },
    {
        "test_id": "leaderboard-update",
        "name": "Leaderboard Update",
        "component": "results_processing",
        "features": ["leaderboard_update"],
        "duration": 1.1,
        "status": "passed"
    },
]

# Helper for simulating test execution
def run_tests_async(run_id: str, config: TestRunRequest):
    """Simulate running tests asynchronously"""
    try:
        # Get current run status
        run_status = _test_runs[run_id]
        
        # Filter tests based on configuration
        tests_to_run = MOCK_TEST_CASES.copy()
        if config.components:
            tests_to_run = [t for t in tests_to_run if t["component"] in config.components]
        
        if config.features:
            tests_to_run = [t for t in tests_to_run if any(f in t["features"] for f in config.features)]
        
        if config.tests:
            tests_to_run = [t for t in tests_to_run if t["test_id"] in config.tests]
        
        # Update run status with total test count
        run_status.total_tests = len(tests_to_run)
        _test_runs[run_id] = run_status
        
        # Initialize results list
        results = []
        
        # Simulate test execution
        for i, test in enumerate(tests_to_run):
            # Small delay to simulate execution time
            time.sleep(0.1)
            
            # Create test result
            result = TestCaseResult(
                test_id=test["test_id"],
                name=test["name"],
                component=test["component"],
                features=test["features"],
                status=test["status"],
                duration=test["duration"],
                error_message=None if test["status"] == "passed" else "Test failed",
                details=None
            )
            
            # Add to results
            results.append(result)
            
            # Update run status
            run_status.completed_tests = i + 1
            run_status.passed_tests = sum(1 for r in results if r.status == "passed")
            run_status.failed_tests = sum(1 for r in results if r.status != "passed")
            _test_runs[run_id] = run_status
        
        # Store results
        _test_results[run_id] = results
        
        # Update final status
        run_status.status = "completed"
        run_status.end_time = datetime.now().isoformat()
        _test_runs[run_id] = run_status
    
    except Exception as e:
        # Handle errors
        run_status = _test_runs.get(run_id)
        if run_status:
            run_status.status = "error"
            run_status.error_message = str(e)
            run_status.end_time = datetime.now().isoformat()
            _test_runs[run_id] = run_status

# Endpoints
@router.post("/run", response_model=TestRunStatus)
def run_tests(request: TestRunRequest, background_tasks: BackgroundTasks):
    """Start a test run"""
    # Create a new test run ID
    run_id = f"run-{str(uuid.uuid4())[:8]}"
    
    # Initialize run status
    run_status = TestRunStatus(
        run_id=run_id,
        status="running",
        start_time=datetime.now().isoformat(),
        end_time=None,
        total_tests=0,
        completed_tests=0,
        passed_tests=0,
        failed_tests=0,
        error_message=None
    )
    
    # Store initial status
    _test_runs[run_id] = run_status
    
    # Start test execution in background
    background_tasks.add_task(run_tests_async, run_id, request)
    
    return run_status

@router.get("/status/{run_id}", response_model=TestRunStatus)
def get_test_run_status(run_id: str):
    """Get the status of a test run"""
    if run_id not in _test_runs:
        raise HTTPException(status_code=404, detail=f"Test run {run_id} not found")
    
    return _test_runs[run_id]

@router.get("/results/{run_id}", response_model=TestRunResults)
def get_test_run_results(run_id: str):
    """Get the results of a test run"""
    if run_id not in _test_runs:
        raise HTTPException(status_code=404, detail=f"Test run {run_id} not found")
    
    if run_id not in _test_results:
        if _test_runs[run_id].status != "completed":
            raise HTTPException(status_code=400, detail=f"Test run {run_id} is not completed yet")
        else:
            raise HTTPException(status_code=404, detail=f"Results for test run {run_id} not found")
    
    return TestRunResults(
        run_id=run_id,
        summary=_test_runs[run_id],
        results=_test_results[run_id]
    )

@router.get("/runs", response_model=List[TestRunStatus])
def list_test_runs(limit: int = Query(10, ge=1, le=100)):
    """List recent test runs"""
    # Sort runs by start time in descending order
    sorted_runs = sorted(
        _test_runs.values(),
        key=lambda run: run.start_time,
        reverse=True
    )
    
    # Return only the requested number of runs
    return sorted_runs[:limit]
