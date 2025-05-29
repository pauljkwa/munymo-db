from fastapi import APIRouter, HTTPException, Depends, Path
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import traceback # For detailed error logging
from datetime import datetime, timezone, date # Added date
import databutton as db # Import databutton
from supabase import create_client, Client # Import supabase client
from app.env import mode, Mode # Import app environment mode

from app.apis.predictions_api import process_game_results, ProcessResultsRequest

# Import authentication utilities
from app.apis.auth_utils import get_current_user, require_permission
from app.apis.admin_permissions import Permissions

# --- Constants ---
SANDBOX_GAME_ID_STORAGE_KEY = "sandbox_current_game_id" # Legacy Databutton storage key
SANDBOX_SETTINGS_TABLE = "sandbox_settings" # Supabase table name
SANDBOX_GAME_ID_KEY = "current_game_id" # Key in the settings table

# --- Sandbox Utility Functions (Defined Locally) ---
def is_sandbox_mode() -> bool:
    """Checks if the application is running in development (sandbox) mode."""
    return mode == Mode.DEV

def get_supabase_client() -> Client:
    """Returns an initialized Supabase client with admin privileges."""
    import databutton as db
    
    supabase_url = db.secrets.get("SUPABASE_URL")
    service_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not service_key:
        print("[ERROR] Missing Supabase credentials")
        raise ValueError("Missing Supabase credentials")
    
    return create_client(supabase_url, service_key)

def set_current_sandbox_game_id(game_id: Optional[str]):
    """Sets the current sandbox game ID in Supabase."""
    print(f"[DEBUG] Persisting sandbox game ID to Supabase: {game_id}")
    try:
        supabase = get_supabase_client()
        
        # Store the value (can be None/null in Supabase)
        update_result = supabase.table(SANDBOX_SETTINGS_TABLE).update({
            "value": game_id,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }).eq("key", SANDBOX_GAME_ID_KEY).execute()
        
        if update_result.data and len(update_result.data) > 0:
            print(f"[INFO] Successfully persisted sandbox game ID to Supabase: '{game_id}'")
        else:
            # If no rows updated, try inserting instead (first time setup)
            insert_result = supabase.table(SANDBOX_SETTINGS_TABLE).insert({
                "key": SANDBOX_GAME_ID_KEY,
                "value": game_id,
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }).execute()
            
            if insert_result.data and len(insert_result.data) > 0:
                print(f"[INFO] Successfully inserted sandbox game ID to Supabase: '{game_id}'")
            else:
                print(f"[WARNING] Could not update or insert sandbox game ID in Supabase: {game_id}")
    except Exception as e:
        print(f"[ERROR] Failed to persist sandbox game ID '{game_id}' to Supabase: {e}")
        # Fallback to legacy Databutton storage
        try:
            print(f"[DEBUG] Falling back to Databutton storage for sandbox game ID: {game_id}")
            value_to_store = game_id if game_id is not None else ""
            db.storage.text.put(SANDBOX_GAME_ID_STORAGE_KEY, value_to_store)
            print(f"[INFO] Successfully persisted sandbox game ID to Databutton fallback: '{value_to_store}'")
        except Exception as fallback_e:
            print(f"[ERROR] Failed to persist sandbox game ID to fallback storage: {fallback_e}")

def get_current_sandbox_game_id() -> Optional[str]:
    """Gets the current sandbox game ID from Supabase."""
    print("[DEBUG] Retrieving sandbox game ID from Supabase.")
    try:
        supabase = get_supabase_client()
        
        # Query the settings table
        result = supabase.table(SANDBOX_SETTINGS_TABLE)\
            .select("value")\
            .eq("key", SANDBOX_GAME_ID_KEY)\
            .limit(1)\
            .execute()
        
        if result.data and len(result.data) > 0:
            stored_value = result.data[0].get("value")
            print(f"[DEBUG] Retrieved value from Supabase: '{stored_value}'")
            return stored_value
        else:
            print(f"[DEBUG] No sandbox game ID found in Supabase or setting row doesn't exist yet")
            return None
    except Exception as e:
        print(f"[ERROR] Failed to retrieve sandbox game ID from Supabase: {e}")
        # Fallback to legacy Databutton storage
        try:
            print("[DEBUG] Falling back to Databutton storage for sandbox game ID retrieval")
            stored_value = db.storage.text.get(SANDBOX_GAME_ID_STORAGE_KEY, default=None)
            print(f"[DEBUG] Retrieved value from Databutton fallback: '{stored_value}'")
            # Return None if the stored value is None or an empty string
            if stored_value is None or stored_value == "":
                return None
            return stored_value
        except Exception as fallback_e:
            print(f"[ERROR] Failed to retrieve sandbox game ID from fallback storage: {fallback_e}")
            return None

def migrate_sandbox_settings_to_supabase() -> Dict[str, Any]:
    """One-time migration of sandbox settings from Databutton to Supabase.
    
    Migrates the current sandbox game ID from Databutton storage to Supabase table.
    This function assumes the sandbox_settings table already exists in Supabase.
    
    Returns:
        dict: Migration results with status information
    """
    print("[INFO] Starting migration of sandbox settings to Supabase")
    try:
        # Get current sandbox game ID from Databutton
        current_game_id = None
        try:
            current_game_id = db.storage.text.get(SANDBOX_GAME_ID_STORAGE_KEY, default=None)
            print(f"[INFO] Current sandbox game ID from Databutton: '{current_game_id}'")
        except Exception as e:
            print(f"[WARNING] Could not retrieve sandbox game ID from Databutton: {e}")
        
        # Set the value in Supabase using our existing function
        try:
            set_current_sandbox_game_id(current_game_id)
            return {
                "status": "success",
                "message": f"Successfully migrated sandbox settings to Supabase",
                "migrated_value": current_game_id
            }
        except Exception as e:
            print(f"[ERROR] Failed to update/insert sandbox settings: {e}")
            return {
                "status": "error",
                "message": f"Failed to update/insert sandbox settings: {str(e)}"
            }
        
    except Exception as e:
        print(f"[ERROR] Failed to migrate sandbox settings to Supabase: {e}")
        return {
            "status": "error",
            "message": f"Migration failed: {str(e)}"
        }


# No longer need the global client initialization since we use get_supabase_client()
# which creates a new client when needed

def get_supabase_admin_client() -> Client:
    """Returns the initialized Supabase ADMIN (service role) client for sandbox control API."""
    try:
        return get_supabase_client()
    except Exception as e:
        print(f"[CRITICAL] Sandbox Control API: Failed to create Supabase admin client: {e}")
        raise HTTPException(status_code=503, detail="Database admin client is not available.")


router = APIRouter()

# --- Pydantic Models ---

class SandboxStatusResponse(BaseModel):
    is_sandbox_mode: bool = Field(..., description="Indicates if the application is running in sandbox (DEV) mode.")
    current_sandbox_game_id: Optional[str] = Field(None, description="The game ID currently set for sandbox testing, if any.")

class SetGameRequest(BaseModel):
    # Allow null to clear the game ID
    game_id: Optional[str] = Field(None, description="The game ID to set for sandbox testing, or null to clear.")

class SetGameResponse(BaseModel):
    message: str
    set_game_id: Optional[str] # Can be null if cleared

class TriggerResponse(BaseModel):
    message: str
    details: Optional[Dict[str, Any]] = None

# --- Helper Functions ---

async def _get_sandbox_game_details(game_id: str) -> Dict[str, Any]:
    """Fetches essential details (date, exchange) for a given sandbox game ID."""
    print(f"[DEBUG] Helper: Fetching details for sandbox game ID: {game_id}")
    supabase_admin = get_supabase_admin_client()
    if not supabase_admin:
        print("[ERROR] Helper: Supabase admin client not available.")
        raise HTTPException(status_code=503, detail="Database admin connection not available.")

    # Assuming asx_games for now, might need dynamic table determination later
    game_table_name = "asx_games"
    try:
        response = supabase_admin.table(game_table_name) \
                       .select("game_date, exchange") \
                       .eq("pair_id", game_id) \
                       .limit(1) \
                       .maybe_single() \
                       .execute()
        
        print(f"[DEBUG] Helper: Supabase response for game details: {response}")
        if response.data:
            # Validate data structure
            if 'game_date' in response.data and 'exchange' in response.data:
                 print(f"[DEBUG] Helper: Found details: {response.data}")
                 return response.data
            else:
                 print(f"[ERROR] Helper: Game data missing expected fields (game_date, exchange). Data: {response.data}")
                 raise HTTPException(status_code=404, detail=f"Game {game_id} found, but missing date/exchange details.")
        else:
            print(f"[ERROR] Helper: Game details not found for ID: {game_id}")
            raise HTTPException(status_code=404, detail=f"Sandbox game details not found for ID: {game_id}")

    except HTTPException as e:
        # Re-raise known HTTP exceptions directly
        print(f"[ERROR] Helper: HTTP error fetching game details: {e.detail}")
        raise e
    except Exception as e:
        # Catch other Supabase client errors or unexpected issues
        error_detail = f"Unexpected Supabase client error or processing issue: {e}"
        print(f"[ERROR] Helper: {error_detail}")
        # traceback.print_exc() # Optional: uncomment for full trace
        raise HTTPException(status_code=500, detail=error_detail) from e

# --- API Endpoints ---

@router.post("/admin/migrate-sandbox-settings", response_model=Dict[str, Any])
async def migrate_sandbox_settings(current_user_id: str = Depends(require_permission(Permissions.MANAGE_SYSTEM))):
    """Migrates sandbox settings from Databutton storage to Supabase."""
    print("[INFO] Received request to migrate sandbox settings to Supabase")
    result = migrate_sandbox_settings_to_supabase()
    return result

@router.get("/sandbox/status", response_model=SandboxStatusResponse)
async def get_sandbox_status(current_user_id: str = Depends(require_permission(Permissions.VIEW_SANDBOX))):
    """Returns the current sandbox mode status and the configured game ID."""
    print("[INFO] Getting sandbox status.")
    sandbox_mode_status = is_sandbox_mode() # Correctly call the function here
    game_id = get_current_sandbox_game_id()
    print(f"[INFO] Sandbox mode: {sandbox_mode_status}, Current game ID: {game_id}")
    return SandboxStatusResponse(is_sandbox_mode=sandbox_mode_status, current_sandbox_game_id=game_id)

@router.post("/sandbox/set-game", response_model=SetGameResponse)
async def set_sandbox_game(request: SetGameRequest, current_user_id: str = Depends(require_permission(Permissions.MANAGE_SANDBOX))):
    """Sets or clears the game ID to be used for sandbox testing."""
    target_game_id = request.game_id
    action = "clear" if target_game_id is None else "set"

    print(f"[INFO] Attempting to {action} sandbox game ID to: {target_game_id}")

    sandbox_mode_status = is_sandbox_mode()
    if not sandbox_mode_status:
        print("[ERROR] Cannot modify sandbox game ID when not in sandbox mode (DEV).")
        raise HTTPException(status_code=403, detail="Sandbox game ID can only be modified in DEV mode.")

    try:
        if target_game_id is None:
            set_current_sandbox_game_id(None) # Call set with None to clear
            message = "Sandbox game ID successfully cleared."
            print(f"[INFO] {message}")
        else:
            # Basic validation: Ensure game_id is not empty if provided
            if not isinstance(target_game_id, str) or not target_game_id.strip():
                 print(f"[ERROR] Invalid game ID provided: '{target_game_id}'")
                 raise HTTPException(status_code=400, detail="A non-empty game ID string must be provided.")
            
            set_current_sandbox_game_id(target_game_id)
            message = f"Sandbox game ID successfully set to: {target_game_id}"
            print(f"[INFO] {message}")

        return SetGameResponse(message=message, set_game_id=target_game_id)

    except HTTPException as http_err:
        # Re-raise validation errors
        raise http_err
    except Exception as e:
        print(f"[ERROR] Failed to {action} sandbox game ID: {e}")
        # traceback.print_exc() # Uncomment for more detailed debugging if needed
        raise HTTPException(status_code=500, detail=f"Failed to store/clear sandbox game ID: {e}") from e

# Future endpoints for triggering actions can be added here

# --- Trigger Endpoints ---

@router.post("/sandbox/trigger-close-predictions", response_model=TriggerResponse)
async def trigger_close_predictions(current_user_id: str = Depends(require_permission(Permissions.MANAGE_SANDBOX))):
    """Manually sets the status of the current sandbox game to 'closed'. Only works in DEV mode."""
    print("[INFO] Received request to trigger close predictions.")
    if not is_sandbox_mode():
        raise HTTPException(status_code=403, detail="Action only available in DEV mode.")

    sandbox_game_id = get_current_sandbox_game_id()
    if not sandbox_game_id:
        raise HTTPException(status_code=400, detail="No sandbox game ID is currently set.")

    print(f"[INFO] Attempting to close predictions for sandbox game ID: {sandbox_game_id}")
    supabase_admin = get_supabase_admin_client()
    if not supabase_admin:
        raise HTTPException(status_code=503, detail="Database admin connection not available.")

    try:
        # Need exchange to determine table, fetch details first
        game_details = await _get_sandbox_game_details(sandbox_game_id)
        exchange = game_details.get("exchange")
        if not exchange:
            raise HTTPException(status_code=500, detail="Could not determine exchange for the game.")
        
        game_table_name = f"{exchange.lower()}_games"
        print(f"[DEBUG] Updating status in table: {game_table_name}")
        
        response = supabase_admin.table(game_table_name) \
                       .update({"status": "closed"}) \
                       .eq("pair_id", sandbox_game_id) \
                       .execute()

        print(f"[DEBUG] Supabase update response for closing game: {response}")
        if response.data:
            message = f"Successfully set status to 'closed' for sandbox game {sandbox_game_id}."
            print(f"[INFO] {message}")
            return TriggerResponse(message=message, details={"updated_game_id": sandbox_game_id})
        else:
            # Check if the game ID was simply not found by the update
            # Fetch again to see if it exists but update failed for other reasons
            try:
                check_response = supabase_admin.table(game_table_name).select("pair_id").eq("pair_id", sandbox_game_id).limit(1).execute()
                if not check_response.data:
                    raise HTTPException(status_code=404, detail=f"Sandbox game {sandbox_game_id} not found in table {game_table_name} during update attempt.")
                else:
                     print(f"[WARNING] Update query for game {sandbox_game_id} returned no data, but game exists. Update might have failed silently or status was already 'closed'.")
                     raise HTTPException(status_code=500, detail=f"Failed to confirm status update for game {sandbox_game_id}. It might already be closed or another issue occurred.")
            except Exception as check_e:
                print(f"[ERROR] Error checking game existence after failed update: {check_e}")
                # Raise the original or a new error
                if isinstance(check_e, HTTPException):
                    raise check_e from None # Reraise the original HTTPException
                raise HTTPException(status_code=500, detail=f"Failed to update game status and failed to verify reason. Error: {check_e}") from check_e

    except HTTPException as http_err:
        print(f"[ERROR] HTTP error during close predictions trigger: {http_err.detail}")
        raise http_err
    except Exception as e:
        print(f"[ERROR] Unexpected error during close predictions trigger: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error closing predictions: {e}") from e

@router.post("/sandbox/trigger-process-results", response_model=TriggerResponse)
async def trigger_process_results(current_user_id: str = Depends(require_permission(Permissions.MANAGE_SANDBOX))):
    """Manually triggers the process_game_results logic for the current sandbox game. Only works in DEV mode."""
    print("[INFO] Received request to trigger process results.")
    if not is_sandbox_mode():
        raise HTTPException(status_code=403, detail="Action only available in DEV mode.")

    sandbox_game_id = get_current_sandbox_game_id()
    if not sandbox_game_id:
        raise HTTPException(status_code=400, detail="No sandbox game ID is currently set.")

    print(f"[INFO] Attempting to process results for sandbox game ID: {sandbox_game_id}")

    try:
        game_details = await _get_sandbox_game_details(sandbox_game_id)
        game_date_str = game_details.get("game_date")
        exchange = game_details.get("exchange")

        if not game_date_str or not exchange:
            raise HTTPException(status_code=500, detail="Missing game date or exchange from fetched game details.")

        # Ensure date is in correct format if needed (assuming YYYY-MM-DD)
        try:
            date.fromisoformat(game_date_str)
        except ValueError:
             raise HTTPException(status_code=500, detail=f"Invalid date format '{game_date_str}' for game {sandbox_game_id}.")

        print(f"[DEBUG] Triggering process_game_results with date: {game_date_str}, exchange: {exchange}")
        process_request = ProcessResultsRequest(game_date_str=game_date_str, exchange=exchange)
        
        # Call the imported function
        result = await process_game_results(request=process_request)
        
        message = f"Successfully triggered process_game_results for sandbox game {sandbox_game_id} ({game_date_str}, {exchange})."
        print(f"[INFO] {message}")
        # Include result from the function if it's useful (it returns a dict)
        return TriggerResponse(message=message, details=result)

    except HTTPException as http_err:
        print(f"[ERROR] HTTP error during process results trigger: {http_err.detail}")
        raise http_err
    except Exception as e:
        print(f"[ERROR] Unexpected error during process results trigger: {e}")
        traceback.print_exc() # More details for unexpected errors
        raise HTTPException(status_code=500, detail=f"Unexpected error processing results: {e}") from e

@router.post("/sandbox/trigger-leaderboard-update", response_model=TriggerResponse)
async def trigger_leaderboard_update(current_user_id: str = Depends(require_permission(Permissions.MANAGE_SANDBOX))):
    """(Simulated) Manually triggers the leaderboard update logic. Only works in DEV mode."""
    print("[INFO] Received request to trigger leaderboard update (Simulated)." )
    if not is_sandbox_mode():
        raise HTTPException(status_code=403, detail="Action only available in DEV mode.")

    sandbox_game_id = get_current_sandbox_game_id()
    if not sandbox_game_id:
        raise HTTPException(status_code=400, detail="No sandbox game ID is currently set.")

    print(f"[INFO] Simulating leaderboard update trigger for sandbox game context (ID: {sandbox_game_id})")

    try:
        game_details = await _get_sandbox_game_details(sandbox_game_id)
        exchange = game_details.get("exchange")

        if not exchange:
            raise HTTPException(status_code=500, detail="Missing exchange from fetched game details.")

        # TODO: Replace simulation with actual call when _update_all_time_leaderboard is available
        # e.g., await _update_all_time_leaderboard(exchange=exchange)
        simulation_message = f"SIMULATED leaderboard update trigger for exchange: {exchange}."
        print(f"[INFO] {simulation_message}")
        
        return TriggerResponse(message="Leaderboard update triggered (Simulated).", details={"exchange": exchange, "note": "Actual update function not yet implemented/called."}) 

    except HTTPException as http_err:
        print(f"[ERROR] HTTP error during leaderboard update trigger: {http_err.detail}")
        raise http_err
    except Exception as e:
        print(f"[ERROR] Unexpected error during leaderboard update trigger: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error triggering leaderboard update: {e}") from e

