# Supabase integration for test storage
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
import uuid
from datetime import datetime
import databutton as db
import json
from supabase import create_client, Client
from app.apis.test_storage_sql import (
    CREATE_TEST_RESULTS_TABLE,
    CREATE_VALIDATION_RESULTS_TABLE,
    CREATE_COVERAGE_REPORTS_TABLE,
    GET_TEST_RESULTS_BY_RUN_ID,
    GET_VALIDATION_RESULTS_BY_BUILD_ID,
    GET_COVERAGE_REPORT_BY_ID,
    GET_LATEST_COVERAGE_REPORT
)

# Create router
router = APIRouter(prefix="/test-storage", tags=["Testing"])

# Models
class MigrationResult(BaseModel):
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None

# Helper function to create Supabase client
def get_supabase_client() -> Client:
    """Create and return a Supabase client"""
    supabase_url = db.secrets.get("SUPABASE_URL")
    supabase_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials not found in secrets")
    
    return create_client(supabase_url, supabase_key)

# Function to store test results in Supabase
async def store_test_results_supabase(run_id: str, results: Dict[str, Any]) -> str:
    """Store test results in Supabase and return the ID"""
    try:
        supabase = get_supabase_client()
        
        # Prepare data for insertion
        data = {
            "run_id": run_id,
            "config": results.get("config", {}),
            "start_time": results.get("start_time"),
            "end_time": results.get("end_time"),
            "status": "completed",  # Assuming results are only stored when complete
            "summary": results.get("summary", {}),
            "results": results.get("results", []),
        }
        
        # Insert into Supabase
        response = supabase.table("test_results").insert(data).execute()
        
        # Get the ID of the inserted record
        if response.data and len(response.data) > 0:
            return response.data[0].get("id")
        
        print(f"Warning: No ID returned from Supabase for test results insertion")
        return str(uuid.uuid4())  # Fallback ID
    
    except Exception as e:
        print(f"Error storing test results in Supabase: {e}")
        # Fallback to Databutton storage if Supabase fails
        key = f"test_run_{run_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        db.storage.json.put(key, results)
        return key

# Function to get test results from Supabase
async def get_test_results_supabase(run_id: str) -> Optional[Dict[str, Any]]:
    """Get test results from Supabase by run_id"""
    try:
        supabase = get_supabase_client()
        
        # Query Supabase
        response = supabase.table("test_results").select("*").eq("run_id", run_id).execute()
        
        # Return the first matching record
        if response.data and len(response.data) > 0:
            return response.data[0]
        
        # Try fallback to Databutton storage
        print(f"No test results found in Supabase for run_id {run_id}, trying Databutton storage")
        
        # List all storage items matching the run_id pattern
        storage_items = db.storage.json.list()
        for item in storage_items:
            if f"test_run_{run_id}_" in item.name:
                return db.storage.json.get(item.name)
        
        return None
    
    except Exception as e:
        print(f"Error retrieving test results from Supabase: {e}")
        return None

# Function to store validation results in Supabase
async def store_validation_results_supabase(results: Dict[str, Any]) -> str:
    """Store validation results in Supabase and return the ID"""
    try:
        supabase = get_supabase_client()
        
        # Extract components from results to store in a normalized way
        timestamp = results.get("timestamp", datetime.now().isoformat())
        
        # Prepare data for insertion
        data = {
            "success": results.get("success", False),
            "message": results.get("message", ""),
            "results": results.get("results", []),
            "timestamp": timestamp,
            "ci_build_id": results.get("ci_build_id"),
        }
        
        # Insert into Supabase
        response = supabase.table("validation_results").insert(data).execute()
        
        # Get the ID of the inserted record
        if response.data and len(response.data) > 0:
            return response.data[0].get("id")
        
        print(f"Warning: No ID returned from Supabase for validation results insertion")
        return str(uuid.uuid4())  # Fallback ID
    
    except Exception as e:
        print(f"Error storing validation results in Supabase: {e}")
        # Fallback to Databutton storage
        key = f"validation_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"
        db.storage.json.put(key, results)
        return key

# Function to get validation results from Supabase
async def get_validation_results_supabase(validation_id: str) -> Optional[Dict[str, Any]]:
    """Get validation results from Supabase by ID"""
    try:
        supabase = get_supabase_client()
        
        # Query Supabase
        response = supabase.table("validation_results").select("*").eq("id", validation_id).execute()
        
        # Return the first matching record
        if response.data and len(response.data) > 0:
            return response.data[0]
        
        # Try to interpret validation_id as a Databutton storage key
        if validation_id.startswith("validation_results_"):
            try:
                return db.storage.json.get(validation_id)
            except:
                pass
        
        return None
    
    except Exception as e:
        print(f"Error retrieving validation results from Supabase: {e}")
        return None

# Function to store coverage report in Supabase
async def store_coverage_report_supabase(report: Dict[str, Any], report_id: str) -> str:
    """Store coverage report in Supabase and return the ID"""
    try:
        supabase = get_supabase_client()
        
        # Prepare data for insertion
        data = {
            "report_id": report_id,
            "timestamp": report.get("timestamp", datetime.now().isoformat()),
            "overall_coverage": report.get("overall_coverage", 0),
            "meets_target": report.get("meets_target", False),
            "target_percentage": report.get("target_percentage", 0),
            "component_coverage": report.get("component_coverage", {}),
            "feature_coverage": report.get("feature_coverage", {}),
        }
        
        # Insert into Supabase
        response = supabase.table("coverage_reports").insert(data).execute()
        
        # Get the ID of the inserted record
        if response.data and len(response.data) > 0:
            return response.data[0].get("id")
        
        print(f"Warning: No ID returned from Supabase for coverage report insertion")
        return str(uuid.uuid4())  # Fallback ID
    
    except Exception as e:
        print(f"Error storing coverage report in Supabase: {e}")
        # Fallback to Databutton storage
        key = f"coverage_report_{report_id}"
        db.storage.json.put(key, report)
        return key

# Function to get coverage report from Supabase
async def get_coverage_report_supabase(report_id: str) -> Optional[Dict[str, Any]]:
    """Get coverage report from Supabase by report_id"""
    try:
        supabase = get_supabase_client()
        
        # Query Supabase
        response = supabase.table("coverage_reports").select("*").eq("report_id", report_id).execute()
        
        # Return the first matching record
        if response.data and len(response.data) > 0:
            return response.data[0]
        
        # Try fallback to Databutton storage
        key = f"coverage_report_{report_id}"
        try:
            return db.storage.json.get(key)
        except:
            return None
    
    except Exception as e:
        print(f"Error retrieving coverage report from Supabase: {e}")
        return None

# Function to get the latest coverage report from Supabase
async def get_latest_coverage_report_supabase() -> Optional[Dict[str, Any]]:
    """Get the latest coverage report from Supabase"""
    try:
        supabase = get_supabase_client()
        
        # Query Supabase for the latest report
        response = supabase.table("coverage_reports").select("*").order("timestamp", desc=True).limit(1).execute()
        
        # Return the first matching record
        if response.data and len(response.data) > 0:
            return response.data[0]
        
        # No report found in Supabase, try Databutton storage
        print("No coverage reports found in Supabase, trying Databutton storage")
        storage_items = db.storage.json.list()
        latest_report = None
        latest_timestamp = None
        
        for item in storage_items:
            if item.name.startswith("coverage_report_"):
                report = db.storage.json.get(item.name)
                if report and "timestamp" in report:
                    report_timestamp = report["timestamp"]
                    if latest_timestamp is None or report_timestamp > latest_timestamp:
                        latest_timestamp = report_timestamp
                        latest_report = report
        
        return latest_report
    
    except Exception as e:
        print(f"Error retrieving latest coverage report from Supabase: {e}")
        return None

# Endpoint to create required tables in Supabase
@router.post("/migrate-tables", response_model=MigrationResult)
async def migrate_test_storage_tables():
    """Create required tables in Supabase for test storage"""
    try:
        supabase = get_supabase_client()
        
        # Execute the SQL statements using Supabase's REST API
        # Note: This approach assumes the service role has permission to execute raw SQL
        # In a production environment, you might want to use the Supabase dashboard or migrations
        
        # Create test_results table
        await supabase.rpc('execute_sql', { 'sql': CREATE_TEST_RESULTS_TABLE }).execute()
        
        # Create validation_results table
        await supabase.rpc('execute_sql', { 'sql': CREATE_VALIDATION_RESULTS_TABLE }).execute()
        
        # Create coverage_reports table
        await supabase.rpc('execute_sql', { 'sql': CREATE_COVERAGE_REPORTS_TABLE }).execute()
        
        return MigrationResult(
            success=True,
            message="Successfully created test storage tables in Supabase",
            details={
                "tables_created": ["test_results", "validation_results", "coverage_reports"]
            }
        )
    
    except Exception as e:
        print(f"Error creating tables in Supabase: {e}")
        return MigrationResult(
            success=False,
            message=f"Failed to create tables: {str(e)}",
            details={"error": str(e)}
        )

# Endpoint to migrate existing test results to Supabase
@router.post("/migrate-test-results", response_model=MigrationResult)
async def migrate_test_results():
    """Migrate existing test results from Databutton storage to Supabase"""
    try:
        # Get all test result keys from Databutton storage
        storage_items = db.storage.json.list()
        test_result_keys = [item.name for item in storage_items if item.name.startswith("test_run_")]
        
        migrated_count = 0
        failed_count = 0
        
        # Migrate each test result
        for key in test_result_keys:
            try:
                # Get the test result from Databutton storage
                result = db.storage.json.get(key)
                
                if not result or not isinstance(result, dict):
                    print(f"Skipping invalid test result: {key}")
                    continue
                
                # Extract run_id from the key or from the result
                run_id = result.get("run_id")
                if not run_id:
                    # Try to extract from key (format: test_run_{run_id}_{timestamp})
                    parts = key.split("_")
                    if len(parts) >= 3:
                        run_id = parts[2]
                    else:
                        print(f"Could not determine run_id for test result: {key}")
                        continue
                
                # Store in Supabase
                supabase = get_supabase_client()
                
                # Prepare data for insertion
                data = {
                    "run_id": run_id,
                    "config": result.get("config", {}),
                    "start_time": result.get("start_time"),
                    "end_time": result.get("end_time"),
                    "status": "completed",  # Assuming results are only stored when complete
                    "summary": result.get("summary", {}),
                    "results": result.get("results", []),
                }
                
                # Insert into Supabase
                supabase.table("test_results").insert(data).execute()
                
                migrated_count += 1
            
            except Exception as item_error:
                print(f"Error migrating test result {key}: {item_error}")
                failed_count += 1
        
        return MigrationResult(
            success=True,
            message=f"Migration completed: {migrated_count} test results migrated, {failed_count} failed",
            details={
                "migrated_count": migrated_count,
                "failed_count": failed_count,
                "total_count": len(test_result_keys)
            }
        )
    
    except Exception as e:
        print(f"Error migrating test results: {e}")
        return MigrationResult(
            success=False,
            message=f"Failed to migrate test results: {str(e)}",
            details={"error": str(e)}
        )

# Endpoint to migrate existing validation results to Supabase
@router.post("/migrate-validation-results", response_model=MigrationResult)
async def migrate_validation_results():
    """Migrate existing validation results from Databutton storage to Supabase"""
    try:
        # Get all validation result keys from Databutton storage
        storage_items = db.storage.json.list()
        validation_result_keys = [item.name for item in storage_items if item.name.startswith("validation_results_")]
        
        migrated_count = 0
        failed_count = 0
        
        # Migrate each validation result
        for key in validation_result_keys:
            try:
                # Get the validation result from Databutton storage
                result = db.storage.json.get(key)
                
                if not result or not isinstance(result, dict):
                    print(f"Skipping invalid validation result: {key}")
                    continue
                
                # Store in Supabase
                supabase = get_supabase_client()
                
                # Prepare data for insertion
                data = {
                    "success": result.get("success", False),
                    "message": result.get("message", ""),
                    "results": result.get("results", []),
                    "timestamp": result.get("timestamp", datetime.now().isoformat()),
                    "ci_build_id": result.get("ci_build_id"),
                }
                
                # Insert into Supabase
                supabase.table("validation_results").insert(data).execute()
                
                migrated_count += 1
            
            except Exception as item_error:
                print(f"Error migrating validation result {key}: {item_error}")
                failed_count += 1
        
        return MigrationResult(
            success=True,
            message=f"Migration completed: {migrated_count} validation results migrated, {failed_count} failed",
            details={
                "migrated_count": migrated_count,
                "failed_count": failed_count,
                "total_count": len(validation_result_keys)
            }
        )
    
    except Exception as e:
        print(f"Error migrating validation results: {e}")
        return MigrationResult(
            success=False,
            message=f"Failed to migrate validation results: {str(e)}",
            details={"error": str(e)}
        )

# Endpoint to migrate existing coverage reports to Supabase
@router.post("/migrate-coverage-reports", response_model=MigrationResult)
async def migrate_coverage_reports():
    """Migrate existing coverage reports from Databutton storage to Supabase"""
    try:
        # Get all coverage report keys from Databutton storage
        storage_items = db.storage.json.list()
        coverage_report_keys = [item.name for item in storage_items if item.name.startswith("coverage_report_")]
        
        migrated_count = 0
        failed_count = 0
        
        # Migrate each coverage report
        for key in coverage_report_keys:
            try:
                # Get the coverage report from Databutton storage
                report = db.storage.json.get(key)
                
                if not report or not isinstance(report, dict):
                    print(f"Skipping invalid coverage report: {key}")
                    continue
                
                # Extract report_id from the key
                report_id = key.replace("coverage_report_", "")
                
                # Store in Supabase
                supabase = get_supabase_client()
                
                # Prepare data for insertion
                data = {
                    "report_id": report_id,
                    "timestamp": report.get("timestamp", datetime.now().isoformat()),
                    "overall_coverage": report.get("overall_coverage", 0),
                    "meets_target": report.get("meets_target", False),
                    "target_percentage": report.get("target_percentage", 0),
                    "component_coverage": report.get("component_coverage", {}),
                    "feature_coverage": report.get("feature_coverage", {}),
                }
                
                # Insert into Supabase
                supabase.table("coverage_reports").insert(data).execute()
                
                migrated_count += 1
            
            except Exception as item_error:
                print(f"Error migrating coverage report {key}: {item_error}")
                failed_count += 1
        
        return MigrationResult(
            success=True,
            message=f"Migration completed: {migrated_count} coverage reports migrated, {failed_count} failed",
            details={
                "migrated_count": migrated_count,
                "failed_count": failed_count,
                "total_count": len(coverage_report_keys)
            }
        )
    
    except Exception as e:
        print(f"Error migrating coverage reports: {e}")
        return MigrationResult(
            success=False,
            message=f"Failed to migrate coverage reports: {str(e)}",
            details={"error": str(e)}
        )
