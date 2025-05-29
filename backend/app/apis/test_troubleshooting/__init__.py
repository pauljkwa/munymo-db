# Test Troubleshooting Guide API
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

router = APIRouter(prefix="/test-troubleshooting", tags=["Testing"])

# Models
class TroubleshootingItem(BaseModel):
    item_id: str = Field(..., description="Unique identifier for the troubleshooting item")
    title: str = Field(..., description="Title of the troubleshooting item")
    description: str = Field(..., description="Description of the issue")
    symptoms: List[str] = Field(..., description="Common symptoms of the issue")
    solutions: List[str] = Field(..., description="Suggested solutions")
    component: str = Field(..., description="Which component this issue affects")
    severity: str = Field(default="medium", description="Severity of the issue")

# Endpoints
@router.get("/", response_model=List[TroubleshootingItem])
def get_troubleshooting_guide2():
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

@router.get("/{item_id}", response_model=TroubleshootingItem)
def get_troubleshooting_item2(item_id: str):
    """Get a specific troubleshooting guide item"""
    guide = get_troubleshooting_guide2()
    for item in guide:
        if item.item_id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Troubleshooting item not found")
