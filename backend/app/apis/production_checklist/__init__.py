"""Production Configuration Checklist

This module provides documentation for the necessary configurations
that must be verified before deploying the Munymo application to production.
"""

from fastapi import APIRouter

# Create a router for this API
router = APIRouter(prefix="/production-checklist", tags=["Admin"])

# Firebase Configuration Checks
FIREBASE_CHECKS = [
    "Verify the Firebase API key in ui/src/utils/firebaseConfig.ts is correctly formatted",
    "Ensure the Firebase API key is valid for production use",
    "Confirm that the Firebase project ID and other details match the production environment",
    "Verify the VAPID key for Firebase Cloud Messaging is correct"
]

# Supabase Configuration Checks
SUPABASE_CHECKS = [
    "Update ui/src/utils/supabaseClient.ts to use environment variables instead of hardcoded values",
    "Ensure Supabase URL and anon key are properly configured for production",
    "Verify that the JWT secret for Supabase authentication is securely stored",
    "Confirm that Supabase service role key is secure"
]

# Stripe Configuration Checks
STRIPE_CHECKS = [
    "Review Stripe plan IDs in src/app/apis/stripe_api/__init__.py to ensure they correspond to production plans",
    "Replace development redirect URLs with production URLs in Stripe checkout flow",
    "Verify Stripe webhook secret is properly configured",
    "Ensure Stripe publishable key is set for frontend use",
    "Check that Stripe secret key is valid for production"
]

# API Endpoint Checks
API_CHECKS = [
    "Update hardcoded API endpoint URLs in frontend code if needed",
    "Ensure all API endpoints include proper authentication when required",
    "Verify CORS settings for production environment"
]

# Environment Detection Checks
ENVIRONMENT_CHECKS = [
    "Confirm that environment detection is working properly (app.env.Mode)",
    "Ensure all environment-specific code properly checks for production vs. development"
]

# Security Checks
SECURITY_CHECKS = [
    "Ensure no API keys or secrets are hardcoded in the frontend code",
    "Verify all sensitive configuration values are stored in Databutton secrets",
    "Check for any test credentials that should be removed before production deployment",
    "Ensure proper error handling without leaking sensitive information"
]

# Testing Checks
TESTING_CHECKS = [
    "Verify that test-only endpoints are disabled in production",
    "Ensure sandbox and testing features are properly gated behind environment checks"
]

# Post-Deployment Checks
POST_DEPLOYMENT_CHECKS = [
    "After deployment, verify that the app properly connects to production databases",
    "Test the complete authentication flow in production",
    "Validate Stripe subscription flow works correctly",
    "Confirm push notifications are working properly"
]

# Combined list of all checks for easy iteration
ALL_CHECKS = {
    "Firebase": FIREBASE_CHECKS,
    "Supabase": SUPABASE_CHECKS,
    "Stripe": STRIPE_CHECKS,
    "API Endpoints": API_CHECKS,
    "Environment": ENVIRONMENT_CHECKS,
    "Security": SECURITY_CHECKS,
    "Testing": TESTING_CHECKS,
    "Post-Deployment": POST_DEPLOYMENT_CHECKS
}


def print_checklist():
    """Print the production configuration checklist to the console."""
    print("\n===== PRODUCTION CONFIGURATION CHECKLIST =====\n")
    
    for category, checks in ALL_CHECKS.items():
        print(f"\n== {category} ==\n")
        for i, check in enumerate(checks, 1):
            print(f"{i}. [ ] {check}")
    
    print("\n============================================\n")
    print("Instructions: Mark each item as [x] when verified.")


@router.get("/")
def get_production_checklist():
    """Get the production configuration checklist"""
    return ALL_CHECKS


if __name__ == "__main__":
    print_checklist()
