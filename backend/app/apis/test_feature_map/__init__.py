# Comprehensive Test Feature Map API
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import uuid
from datetime import datetime

router = APIRouter(prefix="/test-feature-map", tags=["Testing"])

# Models
class Component(BaseModel):
    name: str = Field(..., description="Component name")
    description: str = Field(..., description="Component description")
    features: List[str] = Field(default=[], description="Features in this component")

class Feature(BaseModel):
    name: str = Field(..., description="Feature name")
    description: str = Field(..., description="Feature description")
    component: str = Field(..., description="Component this feature belongs to")

class TestCase(BaseModel):
    test_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique identifier for the test")
    name: str = Field(..., description="Name of the test")
    description: str = Field(..., description="Description of what the test verifies")
    component: str = Field(..., description="Component that the test belongs to")
    features: List[str] = Field(..., description="Features that this test verifies")
    expected_input: Optional[Dict[str, Any]] = Field(None, description="Expected input values")
    expected_output: Optional[Dict[str, Any]] = Field(None, description="Expected output values")

class TestResults(BaseModel):
    test_id: str = Field(..., description="Test ID that was executed")
    success: bool = Field(..., description="Whether the test passed")
    execution_time: float = Field(..., description="Time taken to execute the test in seconds")
    errors: Optional[List[str]] = Field(None, description="List of errors if test failed")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat(), description="When the test was executed")

class TestExecutionPlan(BaseModel):
    plan_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique identifier for the execution plan")
    components: List[str] = Field(..., description="Components to test")
    features: Optional[List[str]] = Field(None, description="Specific features to test")
    test_ids: Optional[List[str]] = Field(None, description="Specific tests to run")
    environment: str = Field(default="test", description="Environment to run tests in")

# In-memory storage for test data
_components = [
    Component(
        name="user_management",
        description="User authentication and profile management",
        features=["user_registration", "user_authentication", "profile_management"]
    ),
    Component(
        name="game_mechanics",
        description="Game creation and mechanics",
        features=["game_generation", "company_selection", "clue_management"]
    ),
    Component(
        name="predictions",
        description="User prediction submission and management",
        features=["prediction_submission", "prediction_validation"]
    ),
    Component(
        name="results_processing",
        description="Game results processing and scoring",
        features=["results_calculation", "leaderboard_update", "performance_analysis"]
    ),
    Component(
        name="subscription",
        description="Subscription and payment management",
        features=["subscription_management", "payment_processing", "subscription_tier_access"]
    ),
    Component(
        name="notifications",
        description="User notification management",
        features=["push_notifications", "email_notifications", "notification_preferences"]
    ),
]

_features = [
    Feature(
        name="user_registration",
        description="User registration and account creation",
        component="user_management"
    ),
    Feature(
        name="user_authentication",
        description="User login and authentication",
        component="user_management"
    ),
    Feature(
        name="profile_management",
        description="User profile management and settings",
        component="user_management"
    ),
    Feature(
        name="game_generation",
        description="Creation of daily games and company pairs",
        component="game_mechanics"
    ),
    Feature(
        name="company_selection",
        description="Selection of company pairs for daily predictions",
        component="game_mechanics"
    ),
    Feature(
        name="clue_management",
        description="Generation and display of game clues",
        component="game_mechanics"
    ),
    Feature(
        name="prediction_submission",
        description="User prediction submission process",
        component="predictions"
    ),
    Feature(
        name="prediction_validation",
        description="Validation of user prediction submissions",
        component="predictions"
    ),
    Feature(
        name="results_calculation",
        description="Calculation of game results based on market data",
        component="results_processing"
    ),
    Feature(
        name="leaderboard_update",
        description="Update of user rankings and leaderboard",
        component="results_processing"
    ),
    Feature(
        name="performance_analysis",
        description="Analysis of user prediction performance",
        component="results_processing"
    ),
    Feature(
        name="subscription_management",
        description="Management of user subscription plans",
        component="subscription"
    ),
    Feature(
        name="payment_processing",
        description="Processing of payments and subscription charges",
        component="subscription"
    ),
    Feature(
        name="subscription_tier_access",
        description="Control of feature access based on subscription tier",
        component="subscription"
    ),
    Feature(
        name="push_notifications",
        description="Delivery of push notifications to users",
        component="notifications"
    ),
    Feature(
        name="email_notifications",
        description="Delivery of email notifications to users",
        component="notifications"
    ),
    Feature(
        name="notification_preferences",
        description="Management of user notification preferences",
        component="notifications"
    ),
]

_test_cases = [
    TestCase(
        test_id="user-registration-flow",
        name="User Registration Flow",
        description="Verify new users can register and create an account",
        component="user_management",
        features=["user_registration"],
        expected_input={
            "email": "test@example.com",
            "password": "securePassword123"
        },
        expected_output={
            "success": True,
            "user_id": "<user_id>"
        }
    ),
    TestCase(
        test_id="authentication-flow",
        name="User Authentication Flow",
        description="Verify users can log in with correct credentials",
        component="user_management",
        features=["user_authentication"],
        expected_input={
            "email": "test@example.com",
            "password": "securePassword123"
        },
        expected_output={
            "success": True,
            "session": "<session_token>"
        }
    ),
    TestCase(
        test_id="game-generation",
        name="Daily Game Generation",
        description="Verify system can generate a new daily game",
        component="game_mechanics",
        features=["game_generation", "company_selection"],
        expected_input={
            "date": "2023-05-21"
        },
        expected_output={
            "game_id": "<game_id>",
            "company_a": "<company_a>",
            "company_b": "<company_b>"
        }
    ),
    TestCase(
        test_id="prediction-submission",
        name="Prediction Submission",
        description="Verify users can submit predictions for games",
        component="predictions",
        features=["prediction_submission", "prediction_validation"],
        expected_input={
            "user_id": "<user_id>",
            "game_id": "<game_id>",
            "prediction": "company_a"
        },
        expected_output={
            "success": True,
            "prediction_id": "<prediction_id>"
        }
    ),
    TestCase(
        test_id="results-processing",
        name="Results Processing",
        description="Verify game results are calculated correctly",
        component="results_processing",
        features=["results_calculation"],
        expected_input={
            "game_id": "<game_id>",
            "market_data": {
                "company_a": {
                    "open": 100.0,
                    "close": 105.0
                },
                "company_b": {
                    "open": 50.0,
                    "close": 52.0
                }
            }
        },
        expected_output={
            "winner": "company_a",
            "company_a_performance": 5.0,
            "company_b_performance": 4.0
        }
    ),
    TestCase(
        test_id="subscription-purchase",
        name="Subscription Purchase",
        description="Verify users can purchase subscription plans",
        component="subscription",
        features=["subscription_management", "payment_processing"],
        expected_input={
            "user_id": "<user_id>",
            "plan": "premium",
            "payment_method": "<payment_method_id>"
        },
        expected_output={
            "success": True,
            "subscription_id": "<subscription_id>",
            "active": True
        }
    ),
    TestCase(
        test_id="notification-delivery",
        name="Push Notification Delivery",
        description="Verify push notifications are delivered to users",
        component="notifications",
        features=["push_notifications"],
        expected_input={
            "user_ids": ["<user_id>"],
            "title": "New Game Available",
            "body": "Today's prediction is now available!"
        },
        expected_output={
            "success": True,
            "delivered": 1,
            "failed": 0
        }
    ),
]

_test_results = []
_test_execution_plans = []

# Endpoints
@router.get("/components", response_model=List[Component])
def get_components():
    """Get all components"""
    return _components

@router.get("/features-for-component/{component_name}", response_model=List[Feature])
def get_features_for_component(component_name: str):
    """Get features for a specific component"""
    return [f for f in _features if f.component == component_name]

@router.get("/tests-for-feature/{feature_name}", response_model=List[TestCase])
def get_tests_for_feature(feature_name: str):
    """Get tests that verify a specific feature"""
    return [t for t in _test_cases if feature_name in t.features]

@router.get("/test/{test_id}", response_model=TestCase)
def get_test_case(test_id: str):
    """Get a specific test case"""
    for test in _test_cases:
        if test.test_id == test_id:
            return test
    raise HTTPException(status_code=404, detail="Test case not found")

@router.get("/tests", response_model=List[TestCase])
def get_all_test_cases():
    """Get all test cases"""
    return _test_cases

@router.post("/test", response_model=TestCase)
def create_test_case(test_case: TestCase):
    """Create a new test case"""
    # Verify component exists
    if test_case.component not in [c.name for c in _components]:
        raise HTTPException(status_code=400, detail=f"Component '{test_case.component}' does not exist")
    
    # Verify features exist
    for feature in test_case.features:
        if feature not in [f.name for f in _features]:
            raise HTTPException(status_code=400, detail=f"Feature '{feature}' does not exist")
    
    _test_cases.append(test_case)
    return test_case

@router.put("/test/{test_id}", response_model=TestCase)
def update_test_case(test_id: str, updated_test: TestCase):
    """Update an existing test case"""
    for i, test in enumerate(_test_cases):
        if test.test_id == test_id:
            # Keep the original test_id
            updated_test.test_id = test_id
            _test_cases[i] = updated_test
            return updated_test
    raise HTTPException(status_code=404, detail="Test case not found")

@router.delete("/test/{test_id}", response_model=dict)
def delete_test_case(test_id: str):
    """Delete a test case"""
    for i, test in enumerate(_test_cases):
        if test.test_id == test_id:
            _test_cases.pop(i)
            return {"success": True, "message": f"Test case {test_id} deleted"}
    raise HTTPException(status_code=404, detail="Test case not found")

@router.post("/test-results", response_model=TestResults)
def record_test_results(results: TestResults):
    """Record results from a test execution"""
    # Verify test exists
    test_exists = False
    for test in _test_cases:
        if test.test_id == results.test_id:
            test_exists = True
            break
    
    if not test_exists:
        raise HTTPException(status_code=400, detail=f"Test with ID '{results.test_id}' does not exist")
    
    _test_results.append(results)
    return results

@router.post("/execution-plan", response_model=TestExecutionPlan)
def create_test_execution_plan(plan: TestExecutionPlan):
    """Create a test execution plan"""
    # Validate components
    for component in plan.components:
        if component not in [c.name for c in _components]:
            raise HTTPException(status_code=400, detail=f"Component '{component}' does not exist")
    
    # Validate features if provided
    if plan.features:
        for feature in plan.features:
            if feature not in [f.name for f in _features]:
                raise HTTPException(status_code=400, detail=f"Feature '{feature}' does not exist")
    
    # Validate test_ids if provided
    if plan.test_ids:
        for test_id in plan.test_ids:
            test_exists = False
            for test in _test_cases:
                if test.test_id == test_id:
                    test_exists = True
                    break
            if not test_exists:
                raise HTTPException(status_code=400, detail=f"Test with ID '{test_id}' does not exist")
    
    _test_execution_plans.append(plan)
    return plan

@router.get("/test-coverage", response_model=Dict[str, Dict[str, List[str]]])
def get_test_coverage():
    """Get coverage of features by tests"""
    coverage = {}
    
    # Initialize coverage structure
    for component in _components:
        coverage[component.name] = {}
        for feature in [f for f in _features if f.component == component.name]:
            coverage[component.name][feature.name] = []
    
    # Add tests to coverage
    for test in _test_cases:
        for feature in test.features:
            # Find component for feature
            for f in _features:
                if f.name == feature:
                    component = f.component
                    if test.test_id not in coverage[component][feature]:
                        coverage[component][feature].append(test.test_id)
                    break
    
    return coverage

@router.get("/map-summary", response_model=Dict[str, Dict])
def get_map_summary():
    """Get summary of components, features, and test coverage"""
    coverage = get_test_coverage()
    
    summary = {}
    for component in _components:
        component_features = [f for f in _features if f.component == component.name]
        
        total_tests = 0
        total_features = len(component_features)
        features_with_tests = 0
        
        if component.name in coverage:
            for feature, tests in coverage[component.name].items():
                total_tests += len(tests)
                if len(tests) > 0:
                    features_with_tests += 1
        
        summary[component.name] = {
            "total_features": total_features,
            "features_with_tests": features_with_tests,
            "total_tests": total_tests,
            "coverage_percent": 0 if total_features == 0 else (features_with_tests / total_features) * 100
        }
    
    return summary