# src/app/apis/documentation/__init__.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List

router = APIRouter()

class DocumentationResponse(BaseModel):
    title: str
    sections: List[Dict[str, Any]]
    last_updated: str

class SimpleDocumentationResponse(BaseModel):
    title: str
    content: str

# Add functions to let the documentation module satisfy imports
def get_scheduler_documentation():
    """Get documentation for the scheduler
    
    This is a simplified implementation for testing purposes.
    """
    return {
        "title": "Scheduler Documentation",
        "description": "Documentation for the scheduler system",
        "tasks": []
    }

@router.get("/rules")
def get_development_rules() -> SimpleDocumentationResponse:
    """Get documentation on development rules"""
    return SimpleDocumentationResponse(
        title="Development Rules for Munymo",
        content="""
## Development Rules

### Storage Rules

1. **Supabase-Only Storage**: All data storage operations must use Supabase exclusively. 
   No Databutton storage operations should be used.
   - ✅ `await store_data_supabase(data_dict)`
   - ❌ `db.storage.json.put(key, data_dict)`

2. **Error Handling Pattern**: When handling errors in storage operations, use specific 
   error messages indicating the storage system:
   ```python
   try:
       # Supabase operation
   except Exception as e:
       print(f"Error storing data in Supabase: {e}")
       return None
   ```

3. **Async Storage Operations**: All storage operations should be async functions to support 
   Supabase operations properly.
   ```python
   async def store_data(data):
       # implementation
   ```

### API Implementation Rules

1. **Type Safety**: Always create detailed Pydantic models for API endpoints, avoiding 
   generic types like dict or list.

2. **Endpoint Signatures**: Do not change the signature (path and parameters) of established 
   endpoints unless absolutely necessary.

3. **Function Names**: Endpoint handler function names must be unique across the entire app.

### Frontend Rules

1. **Direct Supabase Communication**: Frontend should communicate directly with Supabase for 
   data operations when appropriate, rather than always going through backend APIs.

2. **Error Handling**: Always implement comprehensive error handling for all API calls and 
   Supabase operations.

### Testing Rules

1. **Test After Changes**: After implementing changes, always test the affected functionality 
   using appropriate endpoints or UI flows.

2. **Error Logging**: Implement proper error logging in all components to facilitate debugging.

### Deployment Compatibility

1. **Vercel Compatibility**: All code must be compatible with Vercel deployment - this means 
   no Databutton-specific storage operations.
"""
    )

@router.get("/constraints")
def get_technical_constraints() -> SimpleDocumentationResponse:
    """Get documentation on technical constraints"""
    return SimpleDocumentationResponse(
        title="Technical Constraints for Munymo",
        content="""
## Technical Constraints

### Deployment Constraints

1. **Vercel Deployment Compatibility**
   - **CRITICAL**: The application must be compatible with Vercel deployment
   - Databutton storage operations (`db.storage.*`) must NOT be used in any part of the application
   - All data storage must use Supabase exclusively

2. **Environment Variables**
   - Frontend code cannot use environment variables
   - Configuration must be hardcoded or fetched from backend endpoints

### Backend Constraints

1. **Storage Limitations**
   - The server does not have persistent local storage
   - File system operations should be avoided or limited to temporary files
   - All persistent data must be stored in Supabase

2. **Logging Limitations**
   - The Python `logging` module is NOT available
   - Use `print` statements for logging instead

### Frontend Constraints

1. **Router Limitations**
   - The router is auto-generated and cannot be modified directly
   - Path params like `/pages/:id` are not supported
   - Query params must be used instead

2. **Directory Structure Limitations**
   - Cannot add directories under:
     - `ui/src/components`
     - `ui/src/utils`
     - `ui/src/pages`
     - `src/app/apis`

### API Constraints

1. **Router Configuration**
   - Each API file must define an APIRouter in a variable named "router"
   - Never create a FastAPI app or mount the router on another router
   - Never use the empty path: `@router.get("")`
   - Never use the reserved word "query" for path parameters

2. **File Upload Constraints**
   - Never use Form unless otherwise stated
   - Sanitize storage keys to only allow alphanumeric and ._- symbols
"""
    )

@router.get("/migration-docs2")
def get_migration_docs2() -> SimpleDocumentationResponse:
    """Get documentation on how to migrate storage to Supabase"""
    return SimpleDocumentationResponse(
        title="Storage Migration Documentation",
        content="""
## Storage Migration Guidelines

### Overview
This document outlines the process and standards for migrating data storage from Databutton to Supabase.

### Key Principles

1. **Supabase-Only Storage**: All data storage operations must use Supabase exclusively. 
   No Databutton storage operations should be used.
   - ✅ `await store_data_supabase(data_dict)`
   - ❌ `db.storage.json.put(key, data_dict)`

2. **Error Handling Pattern**: When handling errors in storage operations, use specific 
   error messages indicating the storage system:
   ```python
   try:
       # Supabase operation
   except Exception as e:
       print(f"Error storing data in Supabase: {e}")
       return None
   ```

3. **Async Storage Operations**: All storage operations should be async functions to support 
   Supabase operations properly.
   ```python
   async def store_data(data):
       # implementation
   ```

### Vercel Deployment Compatibility
- **CRITICAL**: The application must be compatible with Vercel deployment
- Databutton storage operations (`db.storage.*`) must NOT be used in any part of the application
- All data storage must use Supabase exclusively

### Implementation Checklist
- [ ] Create appropriate tables in Supabase
- [ ] Create async functions for Supabase operations
- [ ] Update all storage functions to use Supabase exclusively
- [ ] Remove all Databutton fallback code
- [ ] Test all functionality after migration
- [ ] Create migration endpoints to transfer historical data
"""
    )

@router.get("/subscription-flow")
def get_subscription_documentation() -> DocumentationResponse:
    """
    Returns comprehensive documentation about the subscription flow for users
    """
    return DocumentationResponse(
        title="Munymo Subscription Guide",
        last_updated="2025-05-21",
        sections=[
            {
                "title": "Subscription Overview",
                "content": [
                    "Munymo offers three subscription tiers to enhance your financial prediction experience:",
                    "• **Free Tier**: Daily predictions with basic features",
                    "• **Premium Tier**: Advanced analytics and early access to predictions",
                    "• **Pro Tier**: Professional insights, unlimited history, and exclusive training tools"
                ]
            },
            {
                "title": "How to Subscribe",
                "content": [
                    "1. **Sign in** to your Munymo account",
                    "2. Navigate to the **Subscription** page from your profile menu",
                    "3. **Select** your desired subscription tier and billing frequency (monthly or yearly)",
                    "4. Click **Subscribe** to proceed to checkout",
                    "5. Complete payment details in the secure Stripe checkout form",
                    "6. You'll be automatically redirected back to Munymo after successful payment"
                ]
            },
            {
                "title": "Managing Your Subscription",
                "content": [
                    "You can manage your subscription at any time from your account settings:",
                    "",
                    "• **View** your current subscription details and renewal date",
                    "• **Upgrade** to a higher tier for immediate access to more features",
                    "• **Cancel** your subscription to prevent automatic renewal",
                    "",
                    "Note: Canceling your subscription will maintain your access until the current billing period ends."
                ]
            },
            {
                "title": "Payment & Billing",
                "content": [
                    "• All payments are processed securely through Stripe",
                    "• We support all major credit and debit cards",
                    "• Subscriptions are automatically renewed at the end of each billing cycle",
                    "• Receipts are automatically emailed after each successful payment",
                    "• You can update your payment method at any time through your account settings"
                ]
            },
            {
                "title": "Subscription Comparison",
                "type": "table",
                "headers": ["Feature", "Free", "Premium", "Pro"],
                "rows": [
                    ["Daily Predictions", "✓", "✓", "✓"],
                    ["Basic Analytics", "✓", "✓", "✓"],
                    ["Leaderboard Access", "Limited", "Full", "Full"],
                    ["History Storage", "7 days", "30 days", "Unlimited"],
                    ["Early Access", "", "✓", "✓"],
                    ["Advanced Analytics", "", "✓", "✓"],
                    ["AI Strategy Assistant", "", "", "✓"],
                    ["Premium Support", "", "", "✓"]
                ]
            },
            {
                "title": "Billing Frequency Options",
                "type": "table",
                "headers": ["Plan", "Monthly", "Yearly (Save 15%)"],
                "rows": [
                    ["Premium", "$9.99/month", "$101.90/year"],
                    ["Pro", "$19.99/month", "$203.90/year"]
                ]
            },
            {
                "title": "FAQ",
                "type": "qa",
                "items": [
                    {
                        "question": "Can I change my subscription tier?",
                        "answer": "Yes, you can upgrade your subscription at any time. The price difference will be prorated for the remainder of your billing cycle."
                    },
                    {
                        "question": "How do I cancel my subscription?",
                        "answer": "You can cancel your subscription from your account settings page. Your subscription will remain active until the end of the current billing period."
                    },
                    {
                        "question": "Will I lose my data if I downgrade?",
                        "answer": "No, but you may lose access to historical data beyond what your new tier allows."
                    },
                    {
                        "question": "Do you offer refunds?",
                        "answer": "We don't typically offer refunds for subscription payments. Please contact our support team for exceptional circumstances."
                    },
                    {
                        "question": "Is my payment information secure?",
                        "answer": "Yes, all payment processing is handled securely by Stripe. We never store your complete credit card information."
                    }
                ]
            },
            {
                "title": "Need Help?",
                "content": [
                    "If you have any questions or issues with your subscription:",
                    "",
                    "• Check our [Help Center](https://munymo.com/help)",
                    "• Contact our support team at support@munymo.com",
                    "• Live chat support is available for Pro subscribers"
                ]
            }
        ]
    )
