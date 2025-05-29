
import databutton as db
from fastapi import APIRouter
from app.env import Mode, mode

# Define a router for potential future sandbox API endpoints
router = APIRouter(prefix="/sandbox", tags=["sandbox-control"])

SANDBOX_GAME_ID_KEY = "current_sandbox_game_id"

def is_sandbox_mode() -> bool:
    """Check if the application is running in Development (Sandbox) mode."""
    # Ensure we're comparing against the correct enum member
    return mode == Mode.DEV

def get_current_sandbox_game_id() -> str | None:
    """Get the game ID (string pair_id) currently targeted by the sandbox environment."""
    print(f"Attempting to get sandbox game ID from storage key: {SANDBOX_GAME_ID_KEY}")
    try:
        # Retrieve value, expecting a string or None
        game_id = db.storage.json.get(SANDBOX_GAME_ID_KEY, default=None)
        print(f"Retrieved value from storage: {game_id} (type: {type(game_id)})")
    except FileNotFoundError:
        print(f"Storage key '{SANDBOX_GAME_ID_KEY}' not found. Returning None.")
        return None
    except Exception as e:
        print(f"Error reading sandbox game ID from storage: {e}. Returning None.")
        return None

    # Check if the retrieved value is a non-empty string
    if isinstance(game_id, str) and game_id:
        print(f"Successfully retrieved string game ID: {game_id}")
        return game_id
    elif game_id is None:
        print("No sandbox game ID found in storage (value was None).")
        return None
    else:
        # Handle cases where it might be stored incorrectly (e.g., empty string, wrong type)
        print(f"Warning: Stored sandbox game ID is not a valid non-empty string: '{game_id}'. Returning None.")
        # Optionally clear the invalid stored value
        # try:
        #     db.storage.json.delete(SANDBOX_GAME_ID_KEY)
        # except Exception as delete_e:
        #     print(f"Failed to delete invalid sandbox game ID key: {delete_e}")
        return None

def set_current_sandbox_game_id(game_id: str | None):
    """Set the game ID (string pair_id) to be targeted by the sandbox environment."""
    print(f"Attempting to set sandbox game ID to: {game_id}")
    if game_id is not None:
        # Ensure it's a non-empty string before storing
        if isinstance(game_id, str) and game_id.strip():
            # Store the string ID
            db.storage.json.put(SANDBOX_GAME_ID_KEY, game_id.strip()) # Store the string
            print(f"Successfully stored sandbox game ID: {game_id.strip()}")
        else:
             print(f"Error: Invalid game_id provided: '{game_id}'. Must be a non-empty string or None.")
             # Consider raising an error or handling appropriately
    else:
        # Clear the key if None is passed
        try:
            db.storage.json.put(SANDBOX_GAME_ID_KEY, None) # Store None explicitly
            print("Cleared sandbox game ID from storage.")
        except Exception as e:
            print(f"Failed to clear sandbox game ID key: {e}")

# Initial check log to confirm loading and mode detection
print(f"Sandbox helpers initialized. Current mode: {mode}. Sandbox active: {is_sandbox_mode()}")

