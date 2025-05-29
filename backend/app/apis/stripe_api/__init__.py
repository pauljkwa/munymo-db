import databutton as db
import stripe
from fastapi import APIRouter, Request, Header, HTTPException
from pydantic import BaseModel
import os
# Import the Supabase client function from predictions_api
from app.apis.predictions_api import get_supabase_client 
import json

# --- Configuration --- 

# Initialize Stripe client with secret key from Databutton secrets
try:
    retrieved_key = db.secrets.get("STRIPE_SECRET_KEY")
    # More detailed debug logging
    print(f"[DEBUG] Attempted to retrieve STRIPE_SECRET_KEY. Key is None or Empty: {not retrieved_key}")
    stripe.api_key = retrieved_key
    if stripe.api_key:
        # Log prefix to help verify if it's a test key without exposing the whole key
        key_prefix = stripe.api_key[:10] # e.g., sk_test_xxxx
        print(f"[INFO] Using Stripe API key starting with: {key_prefix}...")
    else:
        # This case handles if db.secrets.get returns None or empty string
        print("[ERROR] Stripe API key retrieved from secrets is None or empty.")
except Exception as e:
    print(f"[ERROR] Exception during Stripe API key initialization: {e}")
    # Depending on requirements, you might want to prevent the app from fully starting
    # or allow it to start but have Stripe endpoints fail later.
    stripe.api_key = None # Ensure it's None if init fails

print("[DEBUG] Finished Stripe API key initialization block.")

# --- Supabase Admin Client ---
# Get the client instance from the shared utility
# This will raise an error on startup if the client failed to initialize
supabase = get_supabase_client() 


# Get Webhook secret
# endpoint_secret = db.secrets.get("STRIPE_WEBHOOK_SECRET")

# Define features for different tiers
PLAN_FEATURES = {
    "free": [
        "Access to daily game",
        "Basic leaderboard view",
        "Limited historical data",
    ],
    "pro": [
        "Access to daily game",
        "Full leaderboard access",
        "Extended historical data",
        "Basic performance analytics",
    ],
    "premium": [
        "Access to daily game",
        "Full leaderboard access & ranking alerts",
        "Unlimited historical data",
        "Advanced performance analytics & insights",
        "Priority support",
    ],
}

# Define Stripe plans using provided Price IDs
# TODO: Get Success/Cancel URLs from environment/config
STRIPE_PLANS = {
    "pro_monthly": {
        "name": "Pro Monthly",
        "tier": "pro",
        "price_id": "price_1RF92KRHhZZAsDMZt3CBr3NP",
        "frequency": "monthly",
        "features": PLAN_FEATURES["pro"],
    },
    "pro_annual": {
        "name": "Pro Annual",
        "tier": "pro",
        "price_id": "price_1RF95mRHhZZAsDMZWp4PXUC1",
        "frequency": "annual",
        "features": PLAN_FEATURES["pro"],
    },
    "premium_monthly": {
        "name": "Premium Monthly",
        "tier": "premium",
        "price_id": "price_1RF93ZRHhZZAsDMZp555lkHK",
        "frequency": "monthly",
        "features": PLAN_FEATURES["premium"],
    },
    "premium_annual": {
        "name": "Premium Annual",
        "tier": "premium",
        "price_id": "price_1RF94mRHhZZAsDMZ8dzWt7nr",
        "frequency": "annual",
        "features": PLAN_FEATURES["premium"],
    }
}

# Define router
# Force reload
router = APIRouter()

# --- Pydantic Models --- (Will add models for endpoints later)

class CreateCheckoutSessionRequest(BaseModel):
    price_id: str
    user_id: str  # Added user ID from frontend
    user_email: str # Added user email from frontend
    discount_code: str | None = None # Added discount code support

class CreateCheckoutSessionResponse(BaseModel):
    checkout_url: str # Changed from session_id to url

# --- Database Interaction --- 

def find_user_by_stripe_customer_id(customer_id: str) -> str | None:
    """Finds a user by their Stripe customer ID in the profiles table."""
    if not supabase or not customer_id:
        print(f"[ERROR] Cannot lookup user: Supabase client not initialized or customer_id is empty")
        return None
        
    try:
        print(f"[INFO] Looking up user with Stripe customer ID: {customer_id}")
        # Query the profiles table where stripe_customer_id matches
        response = supabase.table('profiles').select('id').eq('stripe_customer_id', customer_id).execute()
        
        # Check if we found any matches
        if response.data and len(response.data) > 0:
            user_id = response.data[0]['id']
            print(f"[INFO] Found user {user_id} for Stripe customer ID: {customer_id}")
            return user_id
            
        # If no match in profiles, try querying auth.users with metadata filter (requires admin privileges)
        print(f"[INFO] No match in profiles table, checking auth metadata for customer ID: {customer_id}")
        # This requires admin rights and depends on whether metadata contains stripe_customer_id
        # The implementation would depend on Supabase client capabilities
        
        print(f"[WARNING] User not found for Stripe customer ID: {customer_id}")
        return None
        
    except Exception as e:
        print(f"[ERROR] Error finding user for Stripe customer ID {customer_id}: {e}")
        return None

def update_user_subscription(user_id: str, tier: str | None, customer_id: str | None, price_id: str | None):
    """Updates user subscription details in Supabase Auth metadata and profiles table."""
    if not supabase:
        print("[ERROR] Supabase client not initialized. Cannot update user subscription.")
        return
        
    print(f"[INFO] Updating DB for User: {user_id}, Tier: {tier}, CustomerID: {customer_id}, PriceID: {price_id}")

    # Define the metadata to update
    # We store tier, price_id, and customer_id in app_metadata for easy access on frontend/backend
    metadata_update = {
        'subscription_tier': tier if tier else 'free', # Default to 'free' if tier is None
        'stripe_price_id': price_id,
        'stripe_customer_id': customer_id
    }

    profile_update = {
         'subscription_tier': tier if tier else 'free', # Keep profiles table consistent
         'stripe_customer_id': customer_id
    }

    # Also update the subscriptions table if applicable
    subscription_data = None
    if tier and tier != 'free':
        subscription_data = {
            'user_id': user_id,
            'subscription_tier': tier,
            'stripe_customer_id': customer_id,
            'stripe_price_id': price_id,
            'status': 'active'
        }
    
    try:
        # 1. Update Supabase Auth User Metadata
        print(f"[DEBUG] Attempting to update app_metadata for user {user_id} with: {metadata_update}")
        try:
            response = supabase.auth.admin.update_user_by_id(
                user_id,
                {"app_metadata": metadata_update} 
            )
            print(f"[INFO] Successfully updated auth metadata for user {user_id} with tier: {tier}")
        except Exception as auth_error:
            print(f"[ERROR] Failed to update auth metadata for user {user_id}: {auth_error}")
            # Continue to update profiles even if auth update fails

        # 2. Create or update profiles table record
        # First check if profile exists
        check_profile = supabase.table('profiles').select('*').eq('id', user_id).execute()
        if check_profile.data and len(check_profile.data) > 0:
            # Profile exists, update it
            print(f"[DEBUG] Updating existing profile for user {user_id} with: {profile_update}")
            try:
                profile_response = supabase.table('profiles').update(profile_update).eq('id', user_id).execute()
                if profile_response.data:
                    print(f"[INFO] Successfully updated profile table for user {user_id} with subscription tier: {tier}")
                else:
                    print(f"[WARNING] Profile update for user {user_id} returned no data. Response: {profile_response}")
            except Exception as profile_update_error:
                print(f"[ERROR] Failed to update profile for user {user_id}: {profile_update_error}")
        else:
            # Profile doesn't exist, create it with required fields
            print(f"[DEBUG] Creating new profile for user {user_id} with subscription tier: {tier}")
            try:
                # Get user info from auth to ensure we have all the data we need
                auth_user = None
                try:
                    auth_user_response = supabase.auth.admin.get_user_by_id(user_id)
                    auth_user = auth_user_response.user if hasattr(auth_user_response, 'user') else None
                except Exception as auth_get_error:
                    print(f"[WARNING] Could not get auth user data for profile creation: {auth_get_error}")
                
                # Create complete profile data
                profile_data = {
                    'id': user_id,
                    'subscription_tier': tier if tier else 'free',
                    'stripe_customer_id': customer_id,
                    # Add email if available from auth user
                    'email': auth_user.email if auth_user and hasattr(auth_user, 'email') else None,
                    # Default values for required fields
                    'preferred_markets': [],
                    'is_admin': False,
                    'is_active': True,
                    'last_login_at': None
                }
                
                create_response = supabase.table('profiles').insert(profile_data).execute()
                print(f"[INFO] Created new profile for user {user_id} with subscription tier: {tier}")
            except Exception as profile_error:
                print(f"[ERROR] Failed to create profile for user {user_id}: {profile_error}")
        
        # 3. Update the subscriptions table if applicable
        if subscription_data:
            try:
                # Delete any existing active subscription records for this user
                supabase.table('subscriptions').delete().eq('user_id', user_id).eq('status', 'active').execute()
                # Insert the new active subscription
                sub_response = supabase.table('subscriptions').insert(subscription_data).execute()
                print(f"[INFO] Updated subscription record for user {user_id} with tier: {tier}")
            except Exception as sub_error:
                print(f"[WARNING] Failed to update subscriptions table: {sub_error}")
        elif tier == 'free':
            # If downgrading to free tier, mark all subscriptions as inactive
            try:
                supabase.table('subscriptions').update({'status': 'inactive'}).eq('user_id', user_id).eq('status', 'active').execute()
                print(f"[INFO] Marked all active subscriptions as inactive for user {user_id}")
            except Exception as sub_error:
                print(f"[WARNING] Failed to mark subscriptions as inactive: {sub_error}")

    except Exception as e:
        print(f"[ERROR] Exception during Supabase update for user {user_id}: {e}")



# --- API Endpoints ---

# Placeholder function to get/create Stripe customer ID
# In reality, this would involve checking our DB (e.g., the user's profile table)
async def get_or_create_stripe_customer(user_id: str, email: str):
    print(f"[INFO] Checking/Creating Stripe customer for user {user_id} ({email})")
    # 1. TODO: Look up user in our DB (e.g., profiles table) by user_id
    # profile = lookup_user_profile(user_id)
    # if profile and profile.stripe_customer_id:
    #    print(f"[INFO] Found existing Stripe customer ID: {profile.stripe_customer_id}")
    #    # Optional: Verify customer exists in Stripe
    #    try:
    #        customer = stripe.Customer.retrieve(profile.stripe_customer_id)
    #        return customer.id
    #    except stripe.error.InvalidRequestError:
    #        print("[WARNING] Stripe customer ID from DB not found in Stripe. Creating new one.")
    #        pass # Fall through to create new customer

    # 2. If not found or verification failed, create a new Stripe Customer
    print("[INFO] Creating new Stripe customer")
    try:
        customer = stripe.Customer.create(
            email=email,
            # You can add metadata to link back to your user ID
            metadata={
                'supabase_user_id': user_id
            }
        )
        print(f"[INFO] Created Stripe customer: {customer.id}")
        # 3. TODO: Save the new customer.id back to the user's profile in our DB
        # save_stripe_customer_id_to_profile(user_id, customer.id)
        return customer.id
    except Exception as e:
        print(f"[ERROR] Failed to create Stripe customer: {e}")
        raise HTTPException(status_code=500, detail="Failed to create Stripe customer.")


# --- API Endpoints ---

# Dynamic base URL for redirects based on environment
from app.env import Mode, mode

# Set environment-specific base URL for Stripe redirects
if mode == Mode.PROD:
    # Production URL when deployed
    APP_BASE_URL = "https://databutton.com/_projects/bd9da57e-5a12-44e1-966c-743d69f5536f/dbtn/prodx/ui/"
else:
    # Development URL for testing
    APP_BASE_URL = "https://databutton.com/_projects/bd9da57e-5a12-44e1-966c-743d69f5536f/dbtn/devx/ui/"

# URLs for Stripe checkout session
SUCCESS_URL = f"{APP_BASE_URL}payment-success-page?session_id={{CHECKOUT_SESSION_ID}}"
CANCEL_URL = f"{APP_BASE_URL}payment-cancel-page"

print(f"[INFO] Stripe redirect URLs configured for {mode} environment")
print(f"[INFO] Success URL: {SUCCESS_URL.replace('{CHECKOUT_SESSION_ID}', 'XXXX')}")
print(f"[INFO] Cancel URL: {CANCEL_URL}")

@router.post("/create-checkout-session", response_model=CreateCheckoutSessionResponse)
async def create_checkout_session(payload: CreateCheckoutSessionRequest):
    """Creates a Stripe Checkout Session for the selected price ID and user."""
    if not stripe.api_key:
        print("[ERROR] Stripe API key is not configured at runtime!")
        raise HTTPException(status_code=500, detail="Stripe integration is not configured.")
        
    price_id = payload.price_id
    user_id = payload.user_id
    user_email = payload.user_email

    print(f"[INFO] Received request to create checkout session. User: {user_id}, Email: {user_email}, PriceID: {price_id}")

    # Validate Price ID
    if not any(plan['price_id'] == price_id for plan in STRIPE_PLANS.values()):
        print(f"[ERROR] Invalid Price ID received: {price_id}")
        raise HTTPException(status_code=400, detail="Invalid Price ID specified.")

    try:
        # --- Get or Create Stripe Customer using provided user details --- 
        stripe_customer_id = await get_or_create_stripe_customer(user_id, user_email)

        # --- Create Stripe Checkout Session --- 
        print(f"[INFO] Creating checkout session for price {price_id} for customer {stripe_customer_id}")
        
        # Setup line items
        line_items = [
            {
                'price': price_id,
                'quantity': 1,
            },
        ]
        
        # Setup checkout session parameters
        checkout_params = {
            'customer': stripe_customer_id,
            'payment_method_types': ['card'],
            'line_items': line_items,
            'mode': 'subscription',
            'success_url': SUCCESS_URL,
            'cancel_url': CANCEL_URL,
            'metadata': {
                'supabase_user_id': user_id # Pass Supabase ID in metadata
            }
        }
        
        # Apply discount code if provided
        if payload.discount_code:
            discount_code = payload.discount_code.strip().upper()
            print(f"[INFO] Applying discount code: {discount_code}")
            
            # Map of valid discount codes to Stripe promotion codes
            # In a production app, these would be stored in a database
            DISCOUNT_CODES = {
                "LAUNCH20": "promo_1RGa2jRHhZZAsDMZMNykl8Zv",  # 20% off
                "WELCOME10": "promo_1RGa3GRHhZZAsDMZMBmvdjH7",  # 10% off
                "BETASIGNUP": "promo_1RGa3gRHhZZAsDMZlhqyVYVj"   # 15% off
            }
            
            if discount_code in DISCOUNT_CODES:
                promotion_code = DISCOUNT_CODES[discount_code]
                checkout_params['discounts'] = [{'promotion_code': promotion_code}]
                print(f"[INFO] Applied Stripe promotion code: {promotion_code}")
            else:
                print(f"[WARNING] Invalid discount code: {discount_code}")
                # We'll still create the session without a discount
        
        checkout_session = stripe.checkout.Session.create(**checkout_params)
        print(f"[INFO] Created session: {checkout_session.id}")

        # TODO: Decide on returning session.id vs session.url
        # Returning session.id requires Stripe.js on frontend
        # Returning session.url might work for direct redirect but is less standard
        # For now, returning ID, assuming frontend handles redirect via Stripe.js later
        # return CreateCheckoutSessionResponse(session_id=checkout_session.id) # Returning ID
        return CreateCheckoutSessionResponse(checkout_url=checkout_session.url) # Returning URL for direct redirect

    except stripe.error.StripeError as e:
        print(f"[ERROR] Stripe error creating checkout session for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
    except HTTPException as e:
        # Re-raise specific HTTP exceptions (e.g., invalid price, customer creation failure)
        raise e
    except Exception as e:
        print(f"[ERROR] Unexpected error creating checkout session for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


# --- Stripe Webhook Endpoint ---

@router.post("/stripe-webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(...)):
    """Handles incoming webhook events from Stripe."""
    payload = await request.body()
    endpoint_secret = db.secrets.get("STRIPE_WEBHOOK_SECRET")

    if not endpoint_secret:
        print("[ERROR] Stripe webhook secret is not configured.")
        raise HTTPException(status_code=500, detail="Webhook secret not configured.")

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, endpoint_secret
        )
        print(f"[INFO] Received Stripe event: {event['type']}")

    except ValueError as e:
        # Invalid payload
        print(f"[ERROR] Invalid webhook payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print(f"[ERROR] Invalid webhook signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        print(f"[ERROR] Error constructing webhook event: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing error")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        print(f"[INFO] Handling checkout.session.completed for session: {session.id}")
        
        # Extract necessary information
        stripe_customer_id = session.get('customer')
        # Retrieve user ID from metadata we added during session creation
        supabase_user_id = session.get('metadata', {}).get('supabase_user_id')
        # Get subscription details (important to fetch the subscription object)
        stripe_subscription_id = session.get('subscription')

        if not supabase_user_id:
            print("[ERROR] supabase_user_id missing from checkout session metadata!")
            # Need a way to handle this - maybe log and investigate?
            return {"status": "error", "message": "User ID missing from metadata"}
            
        if session.payment_status == 'paid':
            print(f"[INFO] Checkout session {session.id} paid successfully.")
            # TODO: Retrieve the plan/tier purchased. 
            # This might require retrieving the subscription object or line items
            # For simplicity, let's assume metadata or lookup gives us the tier
            # Example: Fetch subscription to get price ID, then lookup tier
            try:
                subscription = stripe.Subscription.retrieve(stripe_subscription_id)
                price_id = subscription['items']['data'][0]['price']['id']
                # Find the plan tier corresponding to this price_id
                purchased_tier = None
                for plan_key, plan_details in STRIPE_PLANS.items():
                    if plan_details['price_id'] == price_id:
                        purchased_tier = plan_details['tier']
                        break
                
                if purchased_tier:
                    print(f"[INFO] User {supabase_user_id} subscribed to tier: {purchased_tier} (Price: {price_id})")
                    update_user_subscription(supabase_user_id, purchased_tier, stripe_customer_id, price_id)
                else:
                    print(f"[ERROR] Could not determine subscription tier for price_id: {price_id}")

            except stripe.error.StripeError as e:
                print(f"[ERROR] Stripe error retrieving subscription {stripe_subscription_id}: {e}")
            except Exception as e:
                 print(f"[ERROR] Error processing subscription details: {e}")
        else:
            print(f"[WARNING] Checkout session {session.id} completed but payment status is {session.payment_status}")

    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        print(f"[INFO] Handling customer.subscription.updated for subscription: {subscription.id}")
        stripe_customer_id = subscription.get('customer')
        # Find user associated with this customer ID
        supabase_user_id = find_user_by_stripe_customer_id(stripe_customer_id)
        
        if supabase_user_id:
            # Determine the current tier based on the active price ID
            current_price_id = subscription['items']['data'][0]['price']['id']
            current_tier = None
            for plan_key, plan_details in STRIPE_PLANS.items():
                if plan_details['price_id'] == current_price_id:
                    current_tier = plan_details['tier']
                    break
            
            # Handle status changes
            if subscription.status == 'active':
                 print(f"[INFO] Subscription {subscription.id} for user {supabase_user_id} is active. Tier: {current_tier} (Price: {current_price_id})")
                 update_user_subscription(supabase_user_id, current_tier, stripe_customer_id, current_price_id)
            elif subscription.status == 'canceled' or subscription.status == 'unpaid' or subscription.status == 'past_due':
                 print(f"[INFO] Subscription {subscription.id} for user {supabase_user_id} is {subscription.status}. Reverting to free tier.")
                 # Update with tier='free', customer_id might still be relevant, price_id is None for free tier
                 update_user_subscription(supabase_user_id, 'free', stripe_customer_id, None)
            else:
                 print(f"[INFO] Subscription {subscription.id} for user {supabase_user_id} has unhandled status: {subscription.status}. No changes made.")
        else:
            print(f"[WARNING] Could not find user for Stripe customer ID: {stripe_customer_id} during subscription update.")


    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        print(f"[INFO] Handling customer.subscription.deleted for subscription: {subscription.id}")
        stripe_customer_id = subscription.get('customer')
        supabase_user_id = find_user_by_stripe_customer_id(stripe_customer_id)

        if supabase_user_id:
            print(f"[INFO] Subscription {subscription.id} for user {supabase_user_id} deleted. Reverting to free tier.")
            # Update with tier='free', price_id=None, but keep customer_id if available
            update_user_subscription(supabase_user_id, 'free', stripe_customer_id, None)
        else:
            print(f"[WARNING] Could not find user for Stripe customer ID: {stripe_customer_id} during subscription deletion.")

    else:
        print(f"[INFO] Unhandled Stripe event type: {event['type']}")

    # Acknowledge receipt to Stripe
    return {"status": "success"}



@router.post("/admin/fix-subscription", tags=["Admin"])
async def admin_fix_subscription(user_id: str, tier: str):
    """Admin endpoint to manually update a user's subscription tier.
    
    This is useful for fixing subscription tiers that were not properly updated.
    
    Args:
        user_id: The Supabase user ID
        tier: The subscription tier (free, pro, premium)
    """
    # Verify tier is valid
    valid_tiers = ["free", "pro", "premium"]
    if tier not in valid_tiers:
        return {"status": "error", "message": f"Invalid tier. Must be one of {valid_tiers}"}
    
    # First, get user's current subscription data
    try:
        # Get profile to see current data
        profile_response = supabase.table('profiles').select('*').eq('id', user_id).execute()
        
        # Get auth metadata
        try:
            auth_response = supabase.auth.admin.get_user_by_id(user_id)
            auth_metadata = auth_response.user.app_metadata if hasattr(auth_response, 'user') and auth_response.user else {}
            email = auth_response.user.email if hasattr(auth_response, 'user') and auth_response.user else None
        except Exception as auth_err:
            print(f"[WARNING] Could not get auth data for user {user_id}: {auth_err}")
            auth_metadata = {}
            email = None
        
        # Check if profile exists
        if profile_response.data and len(profile_response.data) > 0:
            current_profile = profile_response.data[0]
            current_tier = current_profile.get('subscription_tier', 'free')
            customer_id = current_profile.get('stripe_customer_id')
        else:
            print(f"[WARNING] User {user_id} not found in profiles table. Will create profile.")
            current_profile = {}
            current_tier = auth_metadata.get('subscription_tier', 'free')
            customer_id = auth_metadata.get('stripe_customer_id')
        
        print(f"[INFO] Admin fix: User {user_id} current tier: {current_tier}, new tier: {tier}")
        print(f"[INFO] Admin fix: User metadata: {json.dumps(auth_metadata)}")
        
        # For premium tiers, try to get a price ID from the STRIPE_PLANS
        price_id = None
        if tier != 'free':
            # Find a matching price ID for this tier (using first match)
            for plan_key, plan_details in STRIPE_PLANS.items():
                if plan_details['tier'] == tier:
                    price_id = plan_details['price_id']
                    break
        
        # Update subscription
        update_user_subscription(user_id, tier, customer_id, price_id)
        
        # Retrieve updated data
        updated_profile_response = supabase.table('profiles').select('*').eq('id', user_id).execute()
        updated_profile = updated_profile_response.data[0] if updated_profile_response.data else {}
        
        try:
            updated_auth_response = supabase.auth.admin.get_user_by_id(user_id)
            updated_auth_metadata = updated_auth_response.user.app_metadata if hasattr(updated_auth_response, 'user') and updated_auth_response.user else {}
        except Exception:
            updated_auth_metadata = {}
        
        return {
            "status": "success", 
            "message": f"Updated user {user_id} from tier {current_tier} to {tier}",
            "previous_data": {
                "profile": current_profile,
                "auth_metadata": auth_metadata
            },
            "updated_data": {
                "profile": updated_profile,
                "auth_metadata": updated_auth_metadata
            }
        }
            
    except Exception as e:
        print(f"[ERROR] Admin fix subscription error for user {user_id}: {e}")
        return {"status": "error", "message": str(e)}

