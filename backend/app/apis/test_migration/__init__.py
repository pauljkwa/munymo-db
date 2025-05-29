# API endpoints for migrating test storage to Supabase
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union

from app.apis.test_storage import (
    migrate_test_storage_tables,
    migrate_test_results,
    migrate_validation_results,
    migrate_coverage_reports,
    MigrationResult
)

# Create router
router = APIRouter(prefix="/test-migration", tags=["Testing"])

class MigrationDocumentation(BaseModel):
    migration_type: str
    description: str
    steps: List[str]
    notes: Optional[str] = None

@router.get("/documentation")
async def get_migration_docs2() -> Dict[str, Any]:
    """Get documentation on the migration process"""
    return {
        "migration_docs": [
            MigrationDocumentation(
                migration_type="test_storage_tables",
                description="Create necessary tables in Supabase for test result storage",
                steps=[
                    "1. Calls the migration endpoint to create tables in Supabase",
                    "2. Creates test_results, validation_results, and coverage_reports tables",
                    "3. Sets up appropriate indexes and RLS policies"
                ],
                notes="This should be run first before migrating any data"
            ),
            MigrationDocumentation(
                migration_type="test_results",
                description="Migrate test results from Databutton storage to Supabase",
                steps=[
                    "1. Retrieves all test result data from Databutton storage",
                    "2. Transforms data to match the Supabase schema",
                    "3. Inserts data into the test_results table in Supabase"
                ]
            ),
            MigrationDocumentation(
                migration_type="validation_results",
                description="Migrate validation results from Databutton storage to Supabase",
                steps=[
                    "1. Retrieves all validation result data from Databutton storage",
                    "2. Transforms data to match the Supabase schema",
                    "3. Inserts data into the validation_results table in Supabase"
                ]
            ),
            MigrationDocumentation(
                migration_type="coverage_reports",
                description="Migrate coverage reports from Databutton storage to Supabase",
                steps=[
                    "1. Retrieves all coverage report data from Databutton storage",
                    "2. Transforms data to match the Supabase schema",
                    "3. Inserts data into the coverage_reports table in Supabase"
                ]
            )
        ]
    }

@router.post("/storage-tables", response_model=MigrationResult)
async def migrate_test_storage_tables_endpoint():
    """Create required tables in Supabase for test storage"""
    return await migrate_test_storage_tables()

@router.post("/test-results", response_model=MigrationResult)
async def migrate_test_results_endpoint():
    """Migrate existing test results from Databutton storage to Supabase"""
    return await migrate_test_results()

@router.post("/validation-results", response_model=MigrationResult)
async def migrate_validation_results_endpoint():
    """Migrate existing validation results from Databutton storage to Supabase"""
    return await migrate_validation_results()

@router.post("/coverage-reports", response_model=MigrationResult)
async def migrate_coverage_reports_endpoint():
    """Migrate existing coverage reports from Databutton storage to Supabase"""
    return await migrate_coverage_reports()
