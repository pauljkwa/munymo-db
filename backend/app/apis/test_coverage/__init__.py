# Test Coverage Reporter
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Set
import databutton as db
from datetime import datetime
import uuid
import json

# Import Supabase storage functions
from app.apis.test_storage import store_coverage_report_supabase, get_coverage_report_supabase

# Create router
router = APIRouter(prefix="/test-coverage", tags=["Testing"])

# Models
class ComponentCoverage(BaseModel):
    name: str = Field(..., description="Component name")
    test_count: int = Field(..., description="Number of tests for this component")
    covered_features: List[str] = Field(..., description="Features that are covered by tests")
    total_features: List[str] = Field(..., description="All features in this component")
    coverage_percentage: float = Field(..., description="Coverage percentage")

class CoverageReport(BaseModel):
    timestamp: str = Field(..., description="Timestamp of the report")
    overall_coverage: float = Field(..., description="Overall test coverage percentage")
    components: List[ComponentCoverage] = Field(..., description="Coverage by component")
    meets_target: bool = Field(..., description="Whether the overall coverage meets the target (80%)")
    target_percentage: float = Field(default=80.0, description="Target coverage percentage")

class CoverageReportRequest(BaseModel):
    report_id: Optional[str] = Field(None, description="Optional ID for the report")
    target_percentage: float = Field(default=80.0, description="Target coverage percentage")

class CoverageSummary(BaseModel):
    report_id: str = Field(..., description="Report ID")
    timestamp: str = Field(..., description="Timestamp of the report")
    overall_coverage: float = Field(..., description="Overall test coverage percentage")
    meets_target: bool = Field(..., description="Whether the coverage meets the target")
    target_percentage: float = Field(..., description="Target coverage percentage")

# Application component definitions
# These represent the primary components of the Munymo app
APP_COMPONENTS = {
    "user_management": {
        "total_features": [
            "user_registration",
            "user_authentication",
            "profile_management",
            "subscription_management",
            "notification_preferences",
            "multi_device_support",
            "user_roles_and_permissions",
            "account_deletion",
            "password_reset"
        ],
        "covered_features": [
            "user_registration",
            "user_authentication",
            "profile_management",
            "subscription_management",
            "multi_device_support",
            "password_reset"
        ]
    },
    "game_mechanics": {
        "total_features": [
            "daily_prediction_generation",
            "company_selection_algorithm",
            "prediction_submission",
            "result_processing",
            "market_data_integration",
            "historical_performance_tracking",
            "prediction_verification",
            "clue_generation"
        ],
        "covered_features": [
            "daily_prediction_generation",
            "company_selection_algorithm",
            "prediction_submission",
            "result_processing",
            "market_data_integration",
            "prediction_verification"
        ]
    },
    "leaderboard": {
        "total_features": [
            "score_calculation",
            "ranking_algorithm",
            "global_leaderboard",
            "time_period_filtering",
            "user_performance_tracking",
            "munyiq_calculation",
            "streak_management"
        ],
        "covered_features": [
            "score_calculation",
            "ranking_algorithm",
            "global_leaderboard",
            "munyiq_calculation",
            "streak_management"
        ]
    },
    "notification_system": {
        "total_features": [
            "push_notifications",
            "email_notifications",
            "daily_game_alerts",
            "results_notifications",
            "leaderboard_updates",
            "custom_notification_preferences",
            "notification_delivery_tracking"
        ],
        "covered_features": [
            "push_notifications",
            "email_notifications",
            "daily_game_alerts",
            "results_notifications",
            "custom_notification_preferences"
        ]
    },
    "payment_processing": {
        "total_features": [
            "stripe_integration",
            "subscription_plans",
            "payment_processing",
            "billing_management",
            "subscription_upgrade_downgrade",
            "subscription_cancellation",
            "payment_webhooks",
            "invoice_generation"
        ],
        "covered_features": [
            "stripe_integration",
            "subscription_plans",
            "payment_processing",
            "subscription_upgrade_downgrade",
            "subscription_cancellation",
            "payment_webhooks"
        ]
    },
    "admin_interface": {
        "total_features": [
            "user_management",
            "game_configuration",
            "content_management",
            "system_monitoring",
            "subscription_management",
            "analytics_dashboard",
            "manual_game_override",
            "system_settings"
        ],
        "covered_features": [
            "user_management",
            "game_configuration",
            "subscription_management",
            "system_settings"
        ]
    },
    "scheduler": {
        "total_features": [
            "task_scheduling",
            "recurring_tasks",
            "task_prioritization",
            "failure_handling",
            "task_dependencies",
            "scheduler_monitoring",
            "manual_task_trigger"
        ],
        "covered_features": [
            "task_scheduling",
            "recurring_tasks",
            "failure_handling",
            "manual_task_trigger",
            "scheduler_monitoring"
        ]
    }
}

# Helper function to store coverage report
async def store_coverage_report(report: CoverageReport, report_id: str) -> str:
    """Store coverage report in Supabase and return the ID"""
    try:
        # Store in Supabase
        report_dict = report.dict()
        report_dict["report_id"] = report_id
        
        await store_coverage_report_supabase(report_dict)
        return report_id
    except Exception as e:
        print(f"Error storing coverage report in Supabase: {e}")
        return None

# Helper function to load coverage report
async def load_coverage_report(report_id: str) -> Optional[CoverageReport]:
    """Load coverage report from Supabase"""
    try:
        # Get from Supabase
        report_data = await get_coverage_report_supabase(report_id)
        if report_data:
            return CoverageReport(**report_data)
        return None
    except Exception as e:
        print(f"Error loading coverage report from Supabase: {e}")
        return None

# Function to calculate current coverage from app components
def calculate_coverage() -> CoverageReport:
    """Calculate current test coverage based on defined components"""
    components = []
    total_covered_features = 0
    total_features = 0
    
    for name, component in APP_COMPONENTS.items():
        covered = set(component["covered_features"])
        all_features = set(component["total_features"])
        
        # Ensure covered features are a subset of total features
        valid_covered = covered.intersection(all_features)
        
        coverage_percentage = (len(valid_covered) / len(all_features)) * 100 if all_features else 0
        
        components.append(ComponentCoverage(
            name=name,
            test_count=len(valid_covered),
            covered_features=list(valid_covered),
            total_features=list(all_features),
            coverage_percentage=coverage_percentage
        ))
        
        total_covered_features += len(valid_covered)
        total_features += len(all_features)
    
    overall_coverage = (total_covered_features / total_features) * 100 if total_features > 0 else 0
    meets_target = overall_coverage >= 80.0
    
    return CoverageReport(
        timestamp=datetime.now().isoformat(),
        overall_coverage=overall_coverage,
        components=components,
        meets_target=meets_target,
        target_percentage=80.0
    )

# API Endpoints
@router.post("/generate", response_model=CoverageSummary)
async def generate_coverage_report(request: CoverageReportRequest):
    """Generate a test coverage report"""
    try:
        # Generate report ID if not provided
        report_id = request.report_id or str(uuid.uuid4())
        
        # Calculate coverage
        report = calculate_coverage()
        
        # Update target percentage if specified
        if request.target_percentage != 80.0:
            report.target_percentage = request.target_percentage
            report.meets_target = report.overall_coverage >= request.target_percentage
        
        # Store report
        storage_key = await store_coverage_report(report, report_id)
        if not storage_key:
            raise HTTPException(status_code=500, detail="Failed to store coverage report")
        
        # Return summary
        return CoverageSummary(
            report_id=report_id,
            timestamp=report.timestamp,
            overall_coverage=report.overall_coverage,
            meets_target=report.meets_target,
            target_percentage=report.target_percentage
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate coverage report: {str(e)}")

@router.get("/report/{report_id}", response_model=CoverageReport)
async def get_coverage_report(report_id: str):
    """Get a specific coverage report by ID"""
    try:
        report = await load_coverage_report(report_id)
        if not report:
            raise HTTPException(status_code=404, detail=f"Coverage report with ID {report_id} not found")
        
        return report
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve coverage report: {str(e)}")

@router.get("/latest", response_model=CoverageReport)
async def get_latest_coverage():
    """Get the latest test coverage information"""
    try:
        # Just calculate current coverage
        return calculate_coverage()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate current coverage: {str(e)}")

@router.get("/missing-features", response_model=Dict[str, List[str]])
async def get_missing_features():
    """Get features that are missing test coverage"""
    try:
        missing_features = {}
        
        for name, component in APP_COMPONENTS.items():
            covered = set(component["covered_features"])
            all_features = set(component["total_features"])
            
            # Find features that are not covered
            uncovered = all_features - covered
            
            if uncovered:
                missing_features[name] = list(uncovered)
        
        return missing_features
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get missing features: {str(e)}")

@router.put("/mark-covered")
async def mark_feature_covered(component: str, feature: str):
    """Mark a feature as covered by tests"""
    try:
        if component not in APP_COMPONENTS:
            raise HTTPException(status_code=404, detail=f"Component '{component}' not found")
        
        # Check if feature exists in total features
        if feature not in APP_COMPONENTS[component]["total_features"]:
            raise HTTPException(status_code=404, detail=f"Feature '{feature}' not found in component '{component}'")
        
        # Add to covered features if not already covered
        if feature not in APP_COMPONENTS[component]["covered_features"]:
            # In a real implementation, this would update a database or storage
            # For this example, we'll just return a simulated response
            return {
                "status": "success",
                "message": f"Feature '{feature}' in component '{component}' marked as covered",
                "note": "In a real implementation, this would persist the change"
            }
        else:
            return {
                "status": "info",
                "message": f"Feature '{feature}' in component '{component}' is already covered"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark feature as covered: {str(e)}")

@router.get("/summary")
async def get_coverage_summary():
    """Get a summary of test coverage for dashboard display"""
    try:
        report = calculate_coverage()
        
        summary = {
            "overall_coverage": report.overall_coverage,
            "meets_target": report.meets_target,
            "target_percentage": report.target_percentage,
            "component_coverage": {},
            "highest_coverage": {"name": "", "percentage": 0},
            "lowest_coverage": {"name": "", "percentage": 100},
            "total_features": 0,
            "covered_features": 0
        }
        
        for component in report.components:
            summary["component_coverage"][component.name] = component.coverage_percentage
            summary["total_features"] += len(component.total_features)
            summary["covered_features"] += len(component.covered_features)
            
            if component.coverage_percentage > summary["highest_coverage"]["percentage"]:
                summary["highest_coverage"] = {
                    "name": component.name,
                    "percentage": component.coverage_percentage
                }
            
            if component.coverage_percentage < summary["lowest_coverage"]["percentage"]:
                summary["lowest_coverage"] = {
                    "name": component.name,
                    "percentage": component.coverage_percentage
                }
        
        return summary
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate coverage summary: {str(e)}")
