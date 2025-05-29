# Comprehensive Test Documentation API
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime

# Create router
router = APIRouter(prefix="/test-documentation", tags=["Testing"])

# Models
class DocumentationSection(BaseModel):
    section_id: str = Field(..., description="Section identifier")
    title: str = Field(..., description="Section title")
    content: str = Field(..., description="Section content in markdown format")
    order: int = Field(default=0, description="Display order of the section")

class TestDocumentation(BaseModel):
    title: str = Field(..., description="Documentation title")
    overview: str = Field(..., description="Overview of the testing system")
    sections: List[DocumentationSection] = Field(default=[], description="Documentation sections")
    last_updated: str = Field(default_factory=lambda: datetime.now().isoformat(), description="Last update timestamp")

class TroubleshootingItem(BaseModel):
    item_id: str = Field(..., description="Unique identifier for the troubleshooting item")
    title: str = Field(..., description="Title of the troubleshooting item")
    description: str = Field(..., description="Description of the issue")
    symptoms: List[str] = Field(..., description="Common symptoms of the issue")
    solutions: List[str] = Field(..., description="Suggested solutions")
    component: str = Field(..., description="Which component this issue affects")
    severity: str = Field(default="medium", description="Severity of the issue")

class TestCase(BaseModel):
    test_id: str = Field(..., description="Unique identifier for the test")
    name: str = Field(..., description="Name of the test")
    description: str = Field(..., description="Description of what the test verifies")
    component: str = Field(..., description="Component that the test belongs to")
    features: List[str] = Field(..., description="Features that this test verifies")
    expected_input: Optional[Dict[str, Any]] = Field(None, description="Expected input values")
    expected_output: Optional[Dict[str, Any]] = Field(None, description="Expected output values")
    setup_instructions: Optional[str] = Field(None, description="Instructions for setting up the test")
    cleanup_instructions: Optional[str] = Field(None, description="Instructions for cleaning up after the test")

class TestPlan(BaseModel):
    title: str = Field(..., description="Test plan title")
    description: str = Field(..., description="Test plan description")
    components: List[str] = Field(..., description="Components covered in this test plan")
    test_cases: List[TestCase] = Field(..., description="Test cases in this plan")
    environment_setup: Optional[str] = Field(None, description="Environment setup requirements")
    prerequisites: Optional[List[str]] = Field(None, description="Prerequisites for executing this test plan")

# Documentation content
# Main API documentation
@router.get("/", response_model=TestDocumentation)
def get_test_documentation():
    """Get the main test documentation"""
    return TestDocumentation(
        title="Munymo Test Framework Documentation",
        overview="This documentation describes the automated testing framework for the Munymo application.",
        sections=[
            DocumentationSection(
                section_id="introduction",
                title="Introduction",
                content="The Munymo testing framework provides a comprehensive suite of tests to ensure application quality.",
                order=1
            ),
            DocumentationSection(
                section_id="structure",
                title="Test Structure",
                content="The testing framework is organized around key components of the application: game mechanics, user management, predictions, results processing, and subscription management.",
                order=2
            ),
            DocumentationSection(
                section_id="running_tests",
                title="Running Tests",
                content="Tests can be run through the API or using the automated CI/CD pipeline. Use the `/test-runner-cli` endpoint to trigger automated test runs.",
                order=3
            ),
            DocumentationSection(
                section_id="extending",
                title="Extending the Test Suite",
                content="New tests can be added by creating test case definitions and mapping them to features through the test-feature-map API.",
                order=4
            ),
            DocumentationSection(
                section_id="troubleshooting",
                title="Troubleshooting",
                content="Common issues and their solutions are documented in the troubleshooting guide. Use the `/test-troubleshooting` endpoint to access this information.",
                order=5
            ),
        ]
    )

# Troubleshooting guide
@router.get("/troubleshooting", response_model=List[TroubleshootingItem])
def get_troubleshooting_guide():
    """Get the troubleshooting guide for common test failures"""
    return [
        TroubleshootingItem(
            item_id="test-runner-timeout",
            title="Test Runner Timeout",
            description="Tests are timing out during execution",
            symptoms=[
                "Test runs terminate with timeout errors",
                "Long-running tests never complete",
                "Test runs appear to hang indefinitely"
            ],
            solutions=[
                "Increase timeout settings in the test run configuration",
                "Check for infinite loops or blocking operations in test code",
                "Break long-running tests into smaller, more focused tests",
                "Verify that external dependencies are responding properly",
                "Check system resources (CPU, memory) on the test execution environment"
            ],
            component="test-runner",
            severity="high"
        ),
        TroubleshootingItem(
            item_id="database-connection",
            title="Database Connection Issues",
            description="Tests fail due to database connection problems",
            symptoms=[
                "Connection timeouts in database tests",
                "Authentication failures when accessing database",
                "Inconsistent test results with database operations"
            ],
            solutions=[
                "Verify database credentials are correctly configured",
                "Check that the test database is accessible from the test environment",
                "Ensure proper cleanup after each test to prevent state contamination",
                "Add retry logic for transient database connection issues"
            ],
            component="database",
            severity="high"
        ),
        TroubleshootingItem(
            item_id="api-validation",
            title="API Validation Failures",
            description="API tests fail due to validation errors",
            symptoms=[
                "HTTP 422 Unprocessable Entity responses",
                "Failed request validation",
                "Schema validation errors"
            ],
            solutions=[
                "Verify the request payload matches the expected schema",
                "Check for missing required fields in test requests",
                "Ensure enum values match the expected values",
                "Verify date formats and other special field formats"
            ],
            component="api",
            severity="medium"
        ),
        TroubleshootingItem(
            item_id="authentication",
            title="Authentication Test Failures",
            description="Tests fail due to authentication or authorization issues",
            symptoms=[
                "HTTP 401 Unauthorized responses",
                "HTTP 403 Forbidden responses",
                "JWT validation failures",
                "Token expiration during test execution"
            ],
            solutions=[
                "Verify test credentials are valid and not expired",
                "Check that test users have appropriate permissions",
                "Ensure authentication headers are correctly formatted",
                "Add authentication token refresh logic for long-running tests"
            ],
            component="authentication",
            severity="high"
        ),
        TroubleshootingItem(
            item_id="test-data",
            title="Test Data Issues",
            description="Tests fail due to problems with test data",
            symptoms=[
                "Not found errors when accessing expected data",
                "Data corruption or unexpected values",
                "Tests that pass in isolation but fail in sequence"
            ],
            solutions=[
                "Ensure test data setup is correctly implemented",
                "Verify test data independence between test cases",
                "Implement proper cleanup of test data after each test",
                "Use unique identifiers for test data to prevent collisions"
            ],
            component="test-data",
            severity="medium"
        ),
    ]

# Get a specific troubleshooting item
@router.get("/troubleshooting/{item_id}", response_model=TroubleshootingItem)
def get_troubleshooting_item(item_id: str):
    """Get a specific troubleshooting guide item"""
    guide = get_troubleshooting_guide()
    for item in guide:
        if item.item_id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Troubleshooting item not found")

# Environment setup guide
@router.get("/environment-setup", response_model=str)
def get_environment_setup_guide():
    """Get the guide for setting up the test environment"""
    return """
# Munymo Test Environment Setup Guide

## Prerequisites
- Python 3.9+
- Working Supabase account and credentials
- Stripe test account for subscription testing
- Firebase project for authentication testing
- OpenAI API key for AI component testing

## Setup Steps

### 1. Database Setup
```
# Create a test database in Supabase
# Import test schema
```

### 2. Environment Variables
The following environment variables should be configured:

- `SUPABASE_URL`: URL to your Supabase instance
- `SUPABASE_ANON_KEY`: Anon key for Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `STRIPE_SECRET_KEY`: Secret key for Stripe test mode
- `STRIPE_WEBHOOK_SECRET`: Webhook secret for Stripe events
- `OPENAI_API_KEY`: API key for OpenAI services
- `FIREBASE_SERVICE_ACCOUNT_KEY_JSON`: Service account key for Firebase admin SDK

### 3. Test Data Initialization
Run the test data initialization endpoint:
```
POST /test-utilities/initialize-test-data
```

### 4. Verification
Verify the test environment is correctly set up:
```
GET /test-utilities/verify-environment
```
"""

# Extension guide
@router.get("/extension-guide", response_model=str)
def get_extension_guide():
    """Get the guide for extending the test suite"""
    return """
# Extending the Munymo Test Suite

## Adding New Test Cases

### 1. Define the Test Case
Use the test case API to define a new test case:

```
POST /test-feature-map/test

{
    "name": "Verify User Subscription Tier Access",
    "description": "Test that users can only access features allowed by their subscription tier",
    "component": "subscription",
    "features": ["subscription_tier_access", "premium_features"],
    "expected_input": {
        "user_id": "example_user_id",
        "subscription_tier": "premium"
    },
    "expected_output": {
        "has_access": true
    }
}
```

### 2. Map to Features
Ensure your test is mapped to the appropriate features. The test-feature mapping is maintained automatically, but you can verify it:

```
GET /test-feature-map/tests-for-feature/subscription_tier_access
```

### 3. Create Test Script
Implement the actual test script in the appropriate test suite.

### 4. Run the Test
Execute your test:

```
POST /test-runner-cli/run
{
    "suites": ["subscription"],
    "environment": "test"
}
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on the state from other tests.

2. **Clear Purpose**: Each test should verify a single aspect of functionality.

3. **Descriptive Names**: Use clear, descriptive names for your test cases.

4. **Proper Setup/Teardown**: Always include proper setup and teardown steps.

5. **Error Handling**: Include assertions and proper error handling in your tests.
"""

# Complete test plan
@router.get("/comprehensive-plan", response_model=TestPlan)
def get_comprehensive_e2e_test_plan2():
    """Get a comprehensive end-to-end test plan"""
    return TestPlan(
        title="Munymo Comprehensive E2E Test Plan",
        description="Complete end-to-end testing plan covering all major components and user flows",
        components=["user_management", "game_mechanics", "predictions", "results_processing", "subscription", "notifications"],
        test_cases=[
            TestCase(
                test_id="user-registration",
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
                },
                setup_instructions="Ensure test email is not already registered",
                cleanup_instructions="Delete test user after verification"
            ),
            TestCase(
                test_id="subscription-tier-access",
                name="Verify Subscription Tier Access",
                description="Test that users can only access features allowed by their subscription tier",
                component="subscription",
                features=["subscription_management", "premium_features"],
                expected_input={
                    "user_id": "<user_id>",
                    "subscription_tier": "premium"
                },
                expected_output={
                    "has_access": True
                }
            ),
            TestCase(
                test_id="game-prediction-submission",
                name="Game Prediction Submission",
                description="Test users can submit predictions for upcoming games",
                component="predictions",
                features=["prediction_submission"],
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
                name="Game Results Processing",
                description="Test that game results are correctly processed and leaderboard is updated",
                component="results_processing",
                features=["results_processing", "leaderboard_update"],
                expected_input={
                    "game_id": "<game_id>",
                    "winner": "company_a"
                },
                expected_output={
                    "processed": True,
                    "points_awarded": True,
                    "leaderboard_updated": True
                }
            ),
            TestCase(
                test_id="notification-delivery",
                name="Game Notification Delivery",
                description="Test that notifications are sent to users for new games and results",
                component="notifications",
                features=["push_notifications"],
                expected_input={
                    "event_type": "new_game",
                    "game_id": "<game_id>"
                },
                expected_output={
                    "notifications_sent": True
                }
            )
        ],
        environment_setup="Follow the environment setup guide to prepare the test environment",
        prerequisites=["Valid API keys", "Test database initialized", "Test users created"]
    )
