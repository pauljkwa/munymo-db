# src/app/apis/test_framework/__init__.py
# Comprehensive testing framework for end-to-end testing

from fastapi import APIRouter, Depends, HTTPException, Header, Request, Query, Response
from pydantic import BaseModel
from typing import Dict, Any, Optional, List, Union
import databutton as db
from app.env import Mode, mode
import uuid
import json
import jwt
import time

# Import existing utilities
from app.apis.test_utilities import get_test_auth_token
from app.apis.auth_utils import get_current_user, is_admin_user, is_super_admin, AdminRole
from app.apis.db_utils import get_supabase_client

router = APIRouter(prefix="/test-framework", tags=["Testing"])

# Documentation content as Markdown
TEST_FRAMEWORK_DOCS = """
# Munymo Testing Framework Documentation

## Overview

The Munymo Testing Framework is a comprehensive system for automated and semi-automated testing of the Munymo platform. It provides tools for defining test cases, mapping tests to features, executing tests, and measuring test coverage.

The framework is designed to ensure high-quality, reliable functionality across all critical components of the Munymo platform.

## Key Components

### 1. Test Runner (`/test-runner`)

The Test Runner is responsible for executing test cases, tracking their status, and reporting results.

**Key endpoints:**
- `POST /test-runner/run` - Start a test run
- `GET /test-runner/status/{run_id}` - Check status of a test run
- `GET /test-runner/results/{run_id}` - Get detailed results of a test run

### 2. Test Coverage (`/test-coverage`)

The Test Coverage module tracks which features are covered by tests and generates coverage reports.

**Key endpoints:**
- `POST /test-coverage/generate` - Generate a coverage report
- `GET /test-coverage/summary` - Get a summary of current test coverage
- `GET /test-coverage/missing-features` - Get features missing test coverage

### 3. Test Map (`/test-map`)

The Test Map module manages test cases and their relationships to features.

**Key endpoints:**
- `GET /test-map/tests` - Get all test cases
- `POST /test-map/tests` - Create a new test case
- `POST /test-map/plan` - Create a test execution plan
- `GET /test-map/coverage` - Get test coverage report

### 4. Test Runner CLI (`/test-runner-cli`)

The Test Runner CLI provides a command-line interface for CI/CD integration.

**Key endpoints:**
- `POST /test-runner-cli/run` - Run tests using the CLI tool

### 5. Test Framework (`/test-framework`)

The Test Framework provides utilities for setting up test environments and creating test users.

**Key endpoints:**
- `POST /test-framework/setup` - Set up a complete test environment
- `POST /test-framework/create-user` - Create a test user with authentication token
- `GET /test-framework/test-mode` - Check if test mode is available

## Test Cases

A test case is defined with the following properties:

- `test_id` - Unique identifier for the test case
- `name` - Human-readable name
- `description` - Detailed description of what the test verifies
- `endpoint` - API endpoint being tested (if applicable)
- `type` - Test type (unit, integration, e2e)
- `component` - Component being tested
- `feature_ids` - IDs of features this test covers
- `prerequisites` - IDs of tests that must be run before this one
- `automation_level` - Level of automation (manual, semi-automated, automated)

## Features

A feature is defined with the following properties:

- `feature_id` - Unique identifier for the feature
- `name` - Human-readable name
- `description` - Detailed description of the feature
- `component` - Component this feature belongs to
- `severity` - Importance of the feature (critical, high, medium, low)
- `covered` - Whether this feature is covered by tests
- `test_ids` - IDs of tests that cover this feature

## Running Tests

### Via API

```python
import requests

# Start a test run
response = requests.post(
    "https://api.munymo.com/test-runner/run",
    json={
        "config": {
            "test_suites": ["all"],
            "environment": "test",
            "timeout": 300
        }
    }
)

run_id = response.json()["run_id"]

# Check status
status_response = requests.get(f"https://api.munymo.com/test-runner/status/{run_id}")
status = status_response.json()["status"]

# Get results
results_response = requests.get(f"https://api.munymo.com/test-runner/results/{run_id}")
results = results_response.json()
```

### Via CLI

```bash
# Run all tests
python test_runner.py --api-url https://api.munymo.com --suites all --env test --wait

# Run specific test suites
python test_runner.py --api-url https://api.munymo.com --suites auth game payment --env test --wait
```

## Test Coverage

Test coverage is measured as the percentage of features covered by tests. The target coverage is 80% overall, with a higher target for critical features.

### Checking Coverage

```python
import requests

# Generate a coverage report
response = requests.post(
    "https://api.munymo.com/test-coverage/generate",
    json={
        "target_percentage": 80.0
    }
)

coverage = response.json()
print(f"Overall coverage: {coverage['overall_coverage']}%")
print(f"Target met: {coverage['meets_target']}")

# Get missing features
response = requests.get(
    "https://api.munymo.com/test-coverage/missing-features",
    params={"severity": "critical"}
)

missing = response.json()
print(f"Critical features missing coverage: {missing['critical_count']}")
```

## Creating Test Data

The Test Framework provides utilities for creating test data:

```python
# Set up a complete test environment
response = requests.post(
    "https://api.munymo.com/test-framework/setup",
    json={
        "create_test_user": True,
        "create_test_game": True,
        "create_test_submission": True,
        "tier": "premium"
    }
)

data = response.json()
auth_header = data["auth_header"]
user_id = data["user"]["user_id"]
game_id = data["game"]["id"]

# Use in subsequent requests
headers = {"Authorization": auth_header}
response = requests.get(f"https://api.munymo.com/game/{game_id}", headers=headers)
```

## CI/CD Integration

The Munymo Testing Framework can be integrated into CI/CD pipelines using the Test Runner CLI.

### GitHub Actions Example

```yaml
name: Run Munymo Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install requests
    - name: Run tests
      run: |
        python -c "import requests; \\n\\nexec(requests.get('https://api.munymo.com/test-runner-cli/script').text)" \\n\\n--api-url https://api.munymo.com \\n\\n--suites all \\n\\n--env test \\n\\n--coverage-target 80 \\n\\n--wait
```

## Test Environments

The testing framework supports multiple environments:

- **Development**: For local testing during development
- **Test**: Isolated environment for CI/CD pipelines
- **Production**: Limited testing in production environment

To check if test mode is available:

```python
import requests

response = requests.get("https://api.munymo.com/test-framework/test-mode")
data = response.json()
if data["test_mode_available"]:
    # Run tests
    pass
else:
    print(f"Tests not available in {data['mode']} mode")
```

## Authentication in Tests

To test endpoints that require authentication:

```python
import requests

# Create a test user
response = requests.post(
    "https://api.munymo.com/test-framework/create-user",
    json={
        "role": "admin",
        "tier": "premium"
    }
)

data = response.json()
headers = {"Authorization": data["auth_header"]}

# Use in subsequent requests
response = requests.get("https://api.munymo.com/admin/endpoint", headers=headers)
```

## Best Practices

1. **Test Critical Features First**: Prioritize testing features marked as critical or high severity.

2. **Keep Test Cases Isolated**: Each test case should be independent and not rely on the state from other tests.

3. **Use Proper Test Dependencies**: If a test must depend on another, use the prerequisites field to ensure proper execution order.

4. **Monitor Coverage Trends**: Watch for coverage changes over time to ensure test quality is maintained or improved.

5. **Automate Where Possible**: Aim to automate as many tests as possible to enable frequent testing.

6. **Document Edge Cases**: For each test case, document the edge cases it covers.

7. **Test Real User Flows**: End-to-end tests should mimic real user behavior as closely as possible.

## Troubleshooting

### Common Issues

1. **Test Timeouts**: If tests are timing out, check for performance issues or increase the timeout parameter.

2. **Dependency Failures**: If tests fail due to missing dependencies, verify that all prerequisites are being run correctly.

3. **Coverage Below Target**: If coverage is below the target, use the missing-features endpoint to identify which features need tests.

4. **Intermittent Failures**: If tests fail intermittently, look for race conditions or environment-specific issues.

### Getting Help

For assistance with the testing framework, contact the Munymo development team at dev@munymo.com.
"""

# Models for requests and responses
class TestUserRequest(BaseModel):
    user_id: Optional[str] = None
    role: str = "user"  # user, admin, super_admin
    tier: str = "free"  # free, premium, pro
    
class TestUserResponse(BaseModel):
    user_id: str
    auth_token: str
    auth_header: str
    role: str
    tier: str
    message: str

class TestSetupRequest(BaseModel):
    create_test_user: bool = True
    create_test_game: bool = False
    create_test_submission: bool = False
    tier: str = "premium"  # Which subscription tier to use
    
class TestSetupResponse(BaseModel):
    user: Optional[Dict[str, Any]] = None
    game: Optional[Dict[str, Any]] = None
    submission: Optional[Dict[str, Any]] = None
    auth_header: Optional[str] = None
    message: str

# Endpoint to get test framework documentation
@router.get("/documentation", response_class=Response)
def get_test_framework_documentation():
    """Get comprehensive documentation for the testing framework"""
    return Response(content=TEST_FRAMEWORK_DOCS, media_type="text/markdown")

@router.post("/setup")
def setup_test_environment(request: TestSetupRequest):
    """Set up a complete test environment
    
    Creates test users, games, and submissions as requested.
    Returns authentication headers and IDs for all created resources.
    """
    # Ensure this only works in development mode
    if mode != Mode.DEV:
        raise HTTPException(status_code=403, detail="This endpoint is only available in development mode")
    
    response_data = {
        "message": "Test environment set up successfully"
    }
    
    # Create test user if requested
    if request.create_test_user:
        user_id = f"test-user-{uuid.uuid4()}"
        auth_token = get_test_auth_token(user_id=user_id, role="user", tier=request.tier)
        auth_header = f"Bearer {auth_token}"
        
        # Add user to response
        response_data["user"] = {
            "user_id": user_id,
            "role": "user",
            "tier": request.tier,
            "auth_token": auth_token
        }
        response_data["auth_header"] = auth_header
    
    # Create test game if requested
    if request.create_test_game:
        # Generate a sample game
        game_id = f"test-game-{uuid.uuid4()}"
        game_data = {
            "id": game_id,
            "status": "active",
            "company_a": "AAPL",
            "company_b": "MSFT",
            "date": "2025-05-22",
            "clue": "Tech giants",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
        }
        
        # Store in test database or mock data store
        try:
            supabase = get_supabase_client()
            result = supabase.table("games").insert(game_data).execute()
            
            # Add game to response
            if result.data:
                response_data["game"] = game_data
            else:
                response_data["message"] += " (Failed to create test game)"
        except Exception as e:
            print(f"Error creating test game: {e}")
            response_data["message"] += f" (Error creating test game: {str(e)})"
    
    # Create test submission if requested
    if request.create_test_submission and request.create_test_user and request.create_test_game:
        # Create a submission for the test user and game
        submission_id = f"test-submission-{uuid.uuid4()}"
        submission_data = {
            "id": submission_id,
            "user_id": response_data["user"]["user_id"],
            "game_id": response_data["game"]["id"],
            "prediction": "company_a",  # Predicting company A will perform better
            "confidence": 80,
            "status": "pending",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
        }
        
        # Store in test database or mock data store
        try:
            supabase = get_supabase_client()
            result = supabase.table("game_submissions").insert(submission_data).execute()
            
            # Add submission to response
            if result.data:
                response_data["submission"] = submission_data
            else:
                response_data["message"] += " (Failed to create test submission)"
        except Exception as e:
            print(f"Error creating test submission: {e}")
            response_data["message"] += f" (Error creating test submission: {str(e)})"
    
    return response_data

@router.post("/create-user", response_model=TestUserResponse)
def create_test_user(request: TestUserRequest):
    """Create a test user with authentication token
    
    Creates a test user with the specified role and subscription tier.
    Returns user ID and authentication token that can be used for testing.
    """
    # Ensure this only works in development mode
    if mode != Mode.DEV:
        raise HTTPException(status_code=403, detail="This endpoint is only available in development mode")
    
    # Generate user ID if not provided
    user_id = request.user_id or f"test-user-{uuid.uuid4()}"
    
    # Generate JWT token
    auth_token = get_test_auth_token(user_id=user_id, role=request.role, tier=request.tier)
    
    return TestUserResponse(
        user_id=user_id,
        auth_token=auth_token,
        auth_header=f"Bearer {auth_token}",
        role=request.role,
        tier=request.tier,
        message=f"Test user created with {request.role} role and {request.tier} subscription tier"
    )

@router.get("/test-mode")
def get_test_mode():
    """Check if test mode is available
    
    Returns the current mode (development or production) and whether test endpoints are available.
    """
    return {
        "mode": mode.value,
        "test_mode_available": mode == Mode.DEV,
        "message": f"Current mode is {mode.value}. Test endpoints are {'available' if mode == Mode.DEV else 'NOT available'} in this environment."
    }

@router.get("/test-auth-bypass")
def get_auth_bypass_example():
    """Get example code for auth bypass in tests
    
    Returns example code snippets for bypassing authentication in tests.
    """
    # Ensure this only works in development mode
    if mode != Mode.DEV:
        raise HTTPException(status_code=403, detail="This endpoint is only available in development mode")
    
    python_example = """
# Python example (for automated tests):
from src.app.apis.test_utilities import get_test_auth_token

# Generate test token
auth_token = get_test_auth_token(user_id="test-123", role="admin", tier="premium")

# Use in requests
headers = {"Authorization": f"Bearer {auth_token}"}
response = requests.get("https://api.example.com/protected-endpoint", headers=headers)
"""
    
    typescript_example = """
// TypeScript example (for frontend tests):

// Get auth headers from test endpoint
async function getTestAuth() {
  const response = await brain.create_test_user({role: "admin", tier: "premium"});
  const data = await response.json();
  return {
    headers: {"Authorization": data.auth_header},
    userId: data.user_id
  };
}

// Use in API calls
const {headers, userId} = await getTestAuth();
const response = await brain.get_protected_endpoint({}, {headers});
"""
    
    return {
        "python_example": python_example,
        "typescript_example": typescript_example,
        "message": "Use these examples to bypass authentication in your tests"
    }

# Test data generators that can be used by other test endpoints
def generate_test_game(date=None):
    """Generate test game data"""
    import datetime
    
    game_date = date or datetime.datetime.now().strftime("%Y-%m-%d")
    
    return {
        "id": f"test-game-{uuid.uuid4()}",
        "status": "active",
        "company_a": "AAPL",
        "company_b": "MSFT",
        "date": game_date,
        "clue": "Tech giants battle it out in this classic rivalry",
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

def generate_test_submission(user_id, game_id, prediction="company_a"):
    """Generate test submission data"""
    import datetime
    
    return {
        "id": f"test-submission-{uuid.uuid4()}",
        "user_id": user_id,
        "game_id": game_id,
        "prediction": prediction,
        "confidence": 80,
        "status": "pending",
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
