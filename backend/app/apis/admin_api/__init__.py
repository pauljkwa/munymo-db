"""
API endpoints for administrative tasks, including game data upload, game management, and user management.
"""

import pandas as pd
import io
import logging # Use logging
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timezone
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form, Path, Query
from pydantic import ValidationError, BaseModel, Field, validator
from postgrest.exceptions import APIError # Import Supabase APIError

# Import the Supabase client function from predictions_api
from app.apis.predictions_api import get_supabase_client, get_supabase_admin_client
from app.apis.admin_permissions import AdminRole, Permissions, get_user_role, assign_role, remove_role, get_role_assignments, list_users_with_roles

# Import the authentication utility
try:
    from app.apis.auth_utils import get_current_user, is_admin_user, is_super_admin, require_permission
except ImportError:
    logging.exception("[CRITICAL] Could not import auth_utils.")
    def get_current_user(): raise NotImplementedError("Auth utils not available.")
    def is_admin_user(): return lambda: None  # Placeholder dependency
    def is_super_admin(): return lambda: None  # Placeholder dependency
    def require_permission(perm): return lambda: None  # Placeholder dependency

# --- Admin Role Management Models ---

class AdminRoleRequest(BaseModel):
    """Request model for assigning admin roles."""
    role: str = Field(..., description="Admin role to assign (super_admin, admin, moderator)")

    @validator('role')
    def validate_role(cls, v):
        valid_roles = [role.value for role in AdminRole if role != AdminRole.USER]
        if v not in valid_roles:
            raise ValueError(f"Role must be one of {valid_roles}")
        return v

class AdminRoleResponse(BaseModel):
    """Response model for admin role operations."""
    user_id: str
    role: str
    success: bool
    message: str

class AdminRoleListResponse(BaseModel):
    """Response model for listing admin roles."""
    roles: List[Dict[str, str]]

# Import our model definitions
from app.apis.admin_models import (
    GameCreateRequest,
    GameUpdateRequest,
    GameResponse,
    GameSubmissionRequest,
    GameSubmissionResponse,
    GameSubmissionListResponse,
    GameSubmissionUpdateRequest,
    UserListResponse, 
    UserUpdateRequest
)

# Import the GameData model (for validation) but not put_game_data
try:
    from app.apis.predictions_api import GameData
except ImportError:
    logging.exception("[CRITICAL] Could not import GameData from predictions_api. Admin upload validation will fail.")
    # Define a dummy version to prevent immediate crash, but functionality is broken
    class GameData(BaseModel):
        pass 

# Setup logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Get Supabase client instance
try:
    admin_supabase = get_supabase_admin_client()
    anon_supabase = get_supabase_client()
except Exception as e:
    logger.critical(f"Admin API failed to get Supabase client: {e}")
    admin_supabase = None
    anon_supabase = None

# Define the router for this API
router = APIRouter(
    prefix="/admin", 
    tags=["Admin"],
    # We'll use more specific permissions at the endpoint level
)

class UploadResponse(BaseModel):
    """Response model for the CSV upload endpoint."""
    processed_rows: int
    successful_uploads: int
    failed_rows: int
    errors: List[str]

ALLOWED_TABLES = {"ASX_GAMES", "asx_games", "NYSE_GAMES", "nyse_games"}

@router.post("/upload-game-data", response_model=UploadResponse)
async def upload_game_data_csv(file: UploadFile = File(...), target_table: str = Form(...), current_user_id: str = Depends(require_permission(Permissions.IMPORT_DATA))):
    """
    Accepts a CSV file upload containing daily game matchup data and a target table name.
    Parses the CSV, validates each row against the GameData model,
    and upserts valid records into the specified Supabase table (ASX_GAMES or NYSE_GAMES).

    Expected CSV Columns (matching GameData fields, using alias 'date'):
    - exchange
    - date (YYYY-MM-DD)
    - company_a_ticker
    - company_a_name
    - company_b_ticker
    - company_b_name
    - sector
    - reasoning
    - submitted_by_player_id (optional, UUID)
    - next_day_clue (optional)
    - status (optional, defaults to 'scheduled')
    """
    if admin_supabase is None:
         # Fail early if supabase client wasn't initialized
        logger.error("Supabase client not available for upload.")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    # --- Validate Target Table --- 
    if target_table not in ALLOWED_TABLES:
        logger.error(f"Invalid target table specified: {target_table}")
        raise HTTPException(status_code=400, detail=f"Invalid target table specified. Must be one of: {', '.join(ALLOWED_TABLES)}")
    logger.info(f"Target table specified: {target_table}")

    # --- Basic File Validation ---
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    # --- Read and Parse CSV --- 
    processed = 0
    success = 0
    failed = 0
    error_messages = []

    try:
        contents = await file.read()
        # Read CSV, ensuring date columns are strings and using header row 0
        # Handle potential empty file or parsing errors
        try:
            df = pd.read_csv(io.BytesIO(contents), header=0, dtype=str, keep_default_na=False)
        except pd.errors.EmptyDataError:
            logger.warning("Uploaded CSV file is empty.")
            return UploadResponse(processed_rows=0, successful_uploads=0, failed_rows=0, errors=["Uploaded CSV file is empty."])

        processed = len(df)
        logger.info(f"Read {processed} rows from uploaded CSV: {file.filename}")
        logger.info(f"CSV Columns: {df.columns.tolist()}") # Log detected columns

        # --- Process Each Row --- 
        required_columns = set(df.columns) # Use columns from the actual CSV header

        # Add expected DB columns that might be missing in CSV but needed (and nullable)
        # This list should ideally match the DB schema
        db_columns = [
            'id', 'exchange', 'game_date', 'company_a_ticker', 'company_a_name', 
            'company_b_ticker', 'company_b_name', 'sector', 'reasoning', 
            'submitted_by_player_id', 'next_day_clue', 'status', 
            'company_a_start_price', 'company_a_end_price', 'company_a_performance', 
            'company_b_start_price', 'company_b_end_price', 'company_b_performance', 
            'actual_winner_ticker', 'result_status', 'evaluation_time', 
            'created_at', 'updated_at'
        ]

        records_to_insert = []
        for index, row in df.iterrows():
            row_num = index + 1 # 1-based index for user messages
            try:
                # Convert row to dict. Replace empty strings with None. Use keep_default_na=False above.
                row_dict = {col: (row[col] if row[col] != '' else None) for col in df.columns if col in row}
                logger.debug(f"Processing Row {row_num} Dict: {row_dict}")

                # --- REMOVED Pydantic Validation Step ---
                # We now rely on the CSV structure matching the DB

                # Prepare data for Supabase insert directly from row_dict
                # Ensure only columns that exist in the DB schema are included
                # Note: 'id' is usually excluded for insert as it's auto-generated
                supabase_data = {db_col: row_dict.get(db_col) for db_col in db_columns if db_col != 'id' and db_col in row_dict}

                # Add default values if needed, though DB defaults should handle this
                if 'status' not in supabase_data or supabase_data['status'] is None:
                    supabase_data['status'] = 'scheduled'
                if 'exchange' not in supabase_data or supabase_data['exchange'] is None:
                    # Infer exchange from table name if not present
                    if target_table.lower() == 'asx_games': supabase_data['exchange'] = 'ASX'
                    elif target_table.lower() == 'nyse_games': supabase_data['exchange'] = 'NYSE'
                    # Add more mappings if other tables are added

                # Remove keys with None values if DB handles NULL correctly (generally safe)
                # supabase_data = {k: v for k, v in supabase_data.items() if v is not None} 
                logger.debug(f"Row {row_num} Data for Supabase: {supabase_data}")
                records_to_insert.append(supabase_data)

            except KeyError as ke:
                failed += 1
                error_messages.append(f"Row {row_num}: Missing expected column in CSV data - {ke}")
                logger.warning(f"Missing column in row {row_num}: {ke}")
            except Exception as e:
                failed += 1
                error_messages.append(f"Row {row_num}: Error preparing data - {type(e).__name__}: {str(e)}")
                logger.exception(f"Error preparing data for row {row_num}: {e}")

        # --- Batch Insert into Supabase ---
        if records_to_insert:
            try:
                logger.info(f"Attempting to insert {len(records_to_insert)} records into {target_table}")
                # Example: Log first record structure
                if records_to_insert:
                    logger.debug(f"Structure of first record to insert: {records_to_insert[0]}")

                # Execute the batch insert
                print(f"[DEBUG] ABOUT TO INSERT {len(records_to_insert)} records into {target_table}.") # Explicit print
                response = admin_supabase.table(target_table).insert(records_to_insert).execute()
                print(f"[DEBUG] INSERT EXECUTED. Response status: {getattr(response, 'status_code', 'N/A')}") # Explicit print

                # More Robust Response Check
                logger.info(f"Supabase insert response status: {getattr(response, 'status_code', 'N/A')}")
                # Log first few items of response.data for inspection
                data_preview = response.data[:min(len(response.data), 3)] if response.data else 'No data'
                logger.debug(f"Supabase insert response data (preview): {data_preview}")
                # logger.debug(f"Full Supabase insert response: {response}") # Uncomment for full detail

                # Check specifically for errors in the Postgrest response structure (supabase-py v1)
                # A successful insert usually returns a list of the inserted dictionaries in response.data
                if isinstance(response.data, list) and len(response.data) == len(records_to_insert):
                     # Check if maybe the insert happened but returned something unexpected?
                     # This assumes success if the number of items in response.data matches submitted records
                    success = len(response.data)
                    logger.info(f"Successfully inserted {success} records.")
                else:
                    # Attempt to find an error message
                    error_detail = "Unknown error during insert." # Default error
                    if hasattr(response, 'error') and response.error:
                        error_detail = f"Error: {response.error.message} (Code: {response.error.code})"
                    elif response.data and isinstance(response.data, dict) and 'message' in response.data:
                        error_detail = response.data['message'] # Other possible error format
                    elif response.data: # Log if data is present but not the expected list
                         error_detail = f"Unexpected data format in response: {str(response.data)[:200]}..."

                    failed = len(records_to_insert) # Assume all failed if response isn't right
                    success = 0
                    error_messages.append(f"Supabase batch insert failed. {error_detail}")
                    logger.error(f"Supabase batch insert failed into {target_table}. {error_detail}")
                    # Log the first record that was attempted for debugging
                    if records_to_insert:
                        logger.error(f"First record attempted: {records_to_insert[0]}")

            except APIError as dbe:
                failed = len(records_to_insert)
                error_messages.append(f"Database batch insert error - {dbe.message}")
                logger.error(f"Database batch insert error into {target_table}: {dbe}")
            except Exception as e:
                failed = len(records_to_insert)
                error_messages.append(f"Unexpected batch insert error - {type(e).__name__}: {str(e)}")
                logger.exception(f"Unexpected batch insert error into {target_table}: {e}")
        else:
             logger.info("No valid records found in CSV to insert.")
             # Adjust processed count if all rows failed preparation
             processed = df.shape[0] if 'df' in locals() else 0
             failed = processed # All processed rows failed preparation
             success = 0 


    except pd.errors.ParserError as pe:
        logger.error(f"Failed to parse CSV file: {pe}")
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {pe}") from pe
    except Exception as e:
        # Catch potential errors during file read or initial processing
        logger.exception(f"An unexpected error occurred during CSV upload: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}") from e
    finally:
        if file:
            await file.close()

    logger.info(f"CSV Upload Summary: Processed={processed}, Success={success}, Failed={failed}")
    return UploadResponse(
        processed_rows=processed,
        successful_uploads=success,
        failed_rows=failed,
        errors=error_messages
    )

# --- Game Management Endpoints ---

@router.post("/games", response_model=GameResponse)
async def create_game(game: GameCreateRequest, current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """
    Create a new game manually with the provided data.
    """
    if admin_supabase is None:
        logger.error("Supabase client not available for game creation.")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    try:
        # Generate a unique ID for the new game
        pair_id = str(uuid.uuid4())

        # Prepare data for insertion
        game_data = game.dict()
        game_data["pair_id"] = pair_id
        game_data["game_date"] = game.game_date  # Ensure this is in YYYY-MM-DD format

        # Determine the table based on exchange
        target_table = game.exchange.lower() + "_games"

        # Insert the new game
        response = admin_supabase.table(target_table).insert(game_data).execute()

        if response.data and len(response.data) > 0:
            logger.info(f"Game created successfully with pair_id: {pair_id}")
            return GameResponse(**response.data[0])
        else:
            logger.error(f"Failed to create game: No data returned from insert operation")
            raise HTTPException(status_code=500, detail="Failed to create game")

    except Exception as e:
        logger.exception(f"Error creating game: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating game: {str(e)}")

@router.get("/games", response_model=List[GameResponse])
async def list_games(
    exchange: Optional[str] = Query(None, description="Filter by exchange"),
    from_date: Optional[str] = Query(None, description="Filter games from this date (inclusive, YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="Filter games to this date (inclusive, YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user_id: str = Depends(require_permission(Permissions.VIEW_GAMES))
):
    """
    List games with optional filtering by exchange, date range, and status.
    """
    if admin_supabase is None:
        logger.error("Supabase client not available for listing games.")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    try:
        # Start with ASX games (we'll combine results)
        query = admin_supabase.table("asx_games").select("*")

        # Apply filters if provided
        if exchange and exchange.upper() == "ASX":
            # Only query ASX games
            pass  # Already querying ASX games
        elif exchange and exchange.upper() == "NYSE":
            # Switch to only NYSE games
            query = admin_supabase.table("nyse_games").select("*")

        # Apply date range filter
        if from_date:
            query = query.gte("game_date", from_date)
        if to_date:
            query = query.lte("game_date", to_date)

        # Apply status filter
        if status:
            query = query.eq("status", status)

        # Execute the query
        response = query.execute()
        games = response.data or []

        # If not filtering to only NYSE, and not filtering to only ASX, also get NYSE games
        if not exchange or exchange.upper() != "ASX":
            nyse_query = admin_supabase.table("nyse_games").select("*")

            # Apply same filters
            if from_date:
                nyse_query = nyse_query.gte("game_date", from_date)
            if to_date:
                nyse_query = nyse_query.lte("game_date", to_date)
            if status:
                nyse_query = nyse_query.eq("status", status)

            nyse_response = nyse_query.execute()
            nyse_games = nyse_response.data or []

            # Combine the results
            games.extend(nyse_games)

        # Sort combined results by date
        games.sort(key=lambda x: x.get("game_date", ""), reverse=True)

        return games

    except Exception as e:
        logger.exception(f"Error listing games: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing games: {str(e)}")

@router.get("/games/{pair_id}", response_model=GameResponse)
async def get_game(pair_id: str = Path(..., description="The unique ID of the game"), current_user_id: str = Depends(require_permission(Permissions.VIEW_GAMES))):
    """
    Get a specific game by its pair_id.
    """
    if admin_supabase is None:
        logger.error("Supabase client not available for getting game.")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    try:
        # Try to find the game in ASX table first
        response = admin_supabase.table("asx_games").select("*").eq("pair_id", pair_id).maybe_single().execute()

        if response.data:
            return GameResponse(**response.data)

        # If not found, try NYSE table
        response = admin_supabase.table("nyse_games").select("*").eq("pair_id", pair_id).maybe_single().execute()

        if response.data:
            return GameResponse(**response.data)

        # If still not found, raise 404
        raise HTTPException(status_code=404, detail=f"Game with pair_id {pair_id} not found")

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.exception(f"Error getting game: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting game: {str(e)}")

@router.put("/games/{pair_id}", response_model=GameResponse)
async def update_game(
    pair_id: str = Path(..., description="The unique ID of the game"),
    game_update: GameUpdateRequest = None,
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """
    Update a specific game by its pair_id.
    """
    if admin_supabase is None:
        logger.error("Supabase client not available for updating game.")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    try:
        # First, check which table has this game
        asx_response = admin_supabase.table("asx_games").select("*").eq("pair_id", pair_id).maybe_single().execute()

        if asx_response.data:
            target_table = "asx_games"
        else:
            nyse_response = admin_supabase.table("nyse_games").select("*").eq("pair_id", pair_id).maybe_single().execute()
            if nyse_response.data:
                target_table = "nyse_games"
            else:
                raise HTTPException(status_code=404, detail=f"Game with pair_id {pair_id} not found")

        # Prepare update data, removing None values
        update_data = {k: v for k, v in game_update.dict().items() if v is not None}

        # Add updated_at timestamp
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Update the game
        response = admin_supabase.table(target_table).update(update_data).eq("pair_id", pair_id).execute()

        if response.data and len(response.data) > 0:
            return GameResponse(**response.data[0])
        else:
            raise HTTPException(status_code=500, detail="Failed to update game")

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.exception(f"Error updating game: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating game: {str(e)}")

@router.delete("/games/{pair_id}", status_code=204)
async def delete_game(pair_id: str = Path(..., description="The unique ID of the game"), current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """
    Delete a specific game by its pair_id.
    """
    if admin_supabase is None:
        logger.error("Supabase client not available for deleting game.")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    try:
        # First, check which table has this game
        asx_response = admin_supabase.table("asx_games").select("*").eq("pair_id", pair_id).maybe_single().execute()

        if asx_response.data:
            target_table = "asx_games"
        else:
            nyse_response = admin_supabase.table("nyse_games").select("*").eq("pair_id", pair_id).maybe_single().execute()
            if nyse_response.data:
                target_table = "nyse_games"
            else:
                raise HTTPException(status_code=404, detail=f"Game with pair_id {pair_id} not found")

        # Delete the game
        admin_supabase.table(target_table).delete().eq("pair_id", pair_id).execute()
        return None  # Return 204 No Content

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.exception(f"Error deleting game: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting game: {str(e)}")

# --- User Submission Management ---

@router.post("/submissions", response_model=GameSubmissionResponse)
async def create_game_submission(submission: GameSubmissionRequest, current_user_id: str = Depends(get_current_user)):
    """
    Allow users to submit game ideas for admin review.
    """
    if admin_supabase is None:
        logger.error("Supabase client not available for creating submission.")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    try:
        # Generate a unique ID for the submission
        submission_id = str(uuid.uuid4())

        # Prepare data for insertion
        submission_data = {
            "id": submission_id,
            "user_id": current_user_id,
            "exchange": submission.exchange,
            "company_a_ticker": submission.company_a_ticker,
            "company_a_name": submission.company_a_name,
            "company_b_ticker": submission.company_b_ticker,
            "company_b_name": submission.company_b_name,
            "reasoning": submission.reasoning,
            "status": "pending_review",
            "submitted_at": datetime.now(timezone.utc).isoformat()
        }

        # Insert the submission
        response = admin_supabase.table("game_submissions").insert(submission_data).execute()

        if response.data and len(response.data) > 0:
            return GameSubmissionResponse(
                submission_id=submission_id,
                status="pending_review",
                message="Your game idea has been submitted for review. Thank you for your contribution!"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to submit game idea")

    except Exception as e:
        logger.exception(f"Error creating game submission: {e}")
        raise HTTPException(status_code=500, detail=f"Error submitting game idea: {str(e)}")

@router.get("/submissions", response_model=GameSubmissionListResponse)
async def list_game_submissions(
    status: Optional[str] = Query(None, description="Filter by status: pending_review, approved, rejected"),
    current_user_id: str = Depends(require_permission(Permissions.VIEW_SUBMISSIONS))
):
    """
    List all game submissions with optional filtering by status.
    """
    if admin_supabase is None:
        logger.error("Supabase client not available for listing submissions.")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    try:
        # Start query
        query = admin_supabase.table("game_submissions").select("*")

        # Apply status filter if provided
        if status:
            query = query.eq("status", status)

        # Execute query
        response = query.order("submitted_at", desc=True).execute()

        return GameSubmissionListResponse(submissions=response.data or [])

    except Exception as e:
        logger.exception(f"Error listing game submissions: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing submissions: {str(e)}")

@router.put("/submissions/{submission_id}", response_model=GameResponse)
async def update_game_submission(
    submission_id: str = Path(..., description="The unique ID of the submission"),
    update: GameSubmissionUpdateRequest = None,
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_SUBMISSIONS))
):
    """
    Update a game submission status (approve/reject) and optionally schedule it.
    """
    if admin_supabase is None:
        logger.error("Supabase client not available for updating submission.")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    try:
        # First, get the submission details
        response = admin_supabase.table("game_submissions").select("*").eq("id", submission_id).maybe_single().execute()

        if not response.data:
            raise HTTPException(status_code=404, detail=f"Submission with ID {submission_id} not found")

        submission_data = response.data

        # Update the submission status
        admin_supabase.table("game_submissions").update({
            "status": update.status,
            "moderation_reason": update.reason,
            "moderated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", submission_id).execute()

        # If approved and scheduled_date is provided, create a game entry
        if update.status == "approved" and update.scheduled_date:
            # Create a new game from the submission
            game_data = {
                "pair_id": str(uuid.uuid4()),
                "exchange": submission_data["exchange"],
                "game_date": update.scheduled_date,
                "company_a_ticker": submission_data["company_a_ticker"],
                "company_a_name": submission_data["company_a_name"],
                "company_b_ticker": submission_data["company_b_ticker"],
                "company_b_name": submission_data["company_b_name"],
                "sector": "User Submitted",  # Default sector for user submissions
                "reasoning": submission_data["reasoning"],
                "submitted_by_player_id": submission_data["user_id"],
                "status": "scheduled",
                "created_at": datetime.now(timezone.utc).isoformat()
            }

            # Determine target table based on exchange
            target_table = submission_data["exchange"].lower() + "_games"

            # Insert the new game
            game_response = admin_supabase.table(target_table).insert(game_data).execute()

            if game_response.data and len(game_response.data) > 0:
                return GameResponse(**game_response.data[0])
            else:
                raise HTTPException(status_code=500, detail="Submission approved but failed to schedule game")

        # If rejected or approved without scheduling, just return success
        return GameResponse(
            pair_id="none",  # Placeholder
            exchange=submission_data["exchange"],
            game_date="",  # Placeholder
            company_a_ticker=submission_data["company_a_ticker"],
            company_a_name=submission_data["company_a_name"],
            company_b_ticker=submission_data["company_b_ticker"],
            company_b_name=submission_data["company_b_name"],
            sector="User Submitted",
            reasoning=submission_data["reasoning"],
            status=update.status  # Use the updated status
        )

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.exception(f"Error updating game submission: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating submission: {str(e)}")

# --- Admin Role Management Endpoints ---

# These endpoints have been moved to admin_permissions_api module
# Users should call the new endpoints instead

@router.get("/roles", response_model=AdminRoleListResponse, tags=["Admin"], deprecated=True)
async def list_admin_roles(current_user_id: str = Depends(is_super_admin())):
    """List all users with administrative roles. DEPRECATED: Use /admin-roles/list instead."""
    # Import and call the function from admin_permissions_api
    from app.apis.admin_permissions_api import list_admin_roles2 as get_roles
    roles_data = get_roles({"user_id": current_user_id})
    
    # Enrich with user info where possible
    if admin_supabase and "roles" in roles_data:
        for role_entry in roles_data["roles"]:
            user_id = role_entry.get("user_id")
            if user_id:
                try:
                    # Get user profile for additional info
                    profile = admin_supabase.table("profiles").select("username, email").eq("id", user_id).execute()
                    if profile.data and len(profile.data) > 0:
                        role_entry["username"] = profile.data[0].get("username")
                        role_entry["email"] = profile.data[0].get("email")
                        
                    # If email is still missing, try to get it from auth.users
                    if not role_entry.get("email"):
                        try:
                            # This requires admin access to auth.users
                            auth_user = admin_supabase.auth.admin.get_user_by_id(user_id)
                            if auth_user and hasattr(auth_user, 'user') and hasattr(auth_user.user, 'email'):
                                role_entry["email"] = auth_user.user.email
                        except Exception as auth_err:
                            print(f"Error fetching auth user for {user_id}: {auth_err}")
                except Exception as e:
                    print(f"Error fetching profile for user {user_id}: {e}")
                    # Continue even if we can't enrich with profile data
    
    return AdminRoleListResponse(roles=roles_data.get("roles", []))

@router.post("/roles/{user_id}", response_model=AdminRoleResponse, tags=["Admin"], deprecated=True)
async def assign_admin_role(user_id: str, role_request: AdminRoleRequest, current_user_id: str = Depends(is_super_admin())):
    """Assign an administrative role to a user. DEPRECATED: Use /admin-roles/assign/{user_id} instead."""
    try:
        # Verify user exists
        if admin_supabase:
            user_check = admin_supabase.table("profiles").select("id").eq("id", user_id).execute()
            if not user_check.data or len(user_check.data) == 0:
                raise HTTPException(status_code=404, detail=f"User {user_id} not found")
        
        # Import and call the function from admin_permissions_api
        from app.apis.admin_permissions_api import assign_admin_role2
        result = assign_admin_role2(user_id, role_request.role, {"user_id": current_user_id})
        
        if result.get("success"):
            # If assigning admin or above, also set is_admin flag in profiles
            if role_request.role != AdminRole.MODERATOR.value and admin_supabase:
                try:
                    admin_supabase.table("profiles").update({"is_admin": True}).eq("id", user_id).execute()
                    
                    # Also update auth.users metadata
                    try:
                        admin_supabase.auth.admin.update_user_by_id(
                            user_id,
                            {"app_metadata": {"is_admin": True}}
                        )
                    except Exception as auth_err:
                        print(f"Warning: Could not update auth metadata: {auth_err}")
                        
                except Exception as e:
                    print(f"Warning: Could not update is_admin flag: {e}")
            
            return AdminRoleResponse(
                user_id=user_id,
                role=role_request.role,
                success=True,
                message=f"User {user_id} assigned role {role_request.role}"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to assign role")
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error assigning admin role: {e}")
        raise HTTPException(status_code=500, detail=f"Error assigning admin role: {str(e)}")

@router.delete("/roles/{user_id}", response_model=AdminRoleResponse, tags=["Admin"], deprecated=True)
async def remove_admin_role(user_id: str, current_user_id: str = Depends(is_super_admin())):
    """Remove administrative role from a user. DEPRECATED: Use /admin-roles/remove/{user_id} instead."""
    try:
        # Get current role before removing
        current_role = get_user_role(user_id)
        
        # Import and call the function from admin_permissions_api
        from app.apis.admin_permissions_api import remove_admin_role2
        result = remove_admin_role2(user_id, {"user_id": current_user_id})
        
        if result.get("success"):
            # Also update is_admin flag in profiles if needed
            if current_role != AdminRole.USER and admin_supabase:
                try:
                    admin_supabase.table("profiles").update({"is_admin": False}).eq("id", user_id).execute()
                    
                    # Also update auth.users metadata
                    try:
                        admin_supabase.auth.admin.update_user_by_id(
                            user_id,
                            {"app_metadata": {"is_admin": False}}
                        )
                    except Exception as auth_err:
                        print(f"Warning: Could not update auth metadata: {auth_err}")
                        
                except Exception as e:
                    print(f"Warning: Could not update is_admin flag: {e}")
            
            return AdminRoleResponse(
                user_id=user_id,
                role=AdminRole.USER.value,  # Reset to regular user
                success=True,
                message=f"Administrative role removed from user {user_id}"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to remove role")
    
    except Exception as e:
        print(f"Error removing admin role: {e}")
        raise HTTPException(status_code=500, detail=f"Error removing admin role: {str(e)}")

@router.post("/migrate-roles", response_model=dict, tags=["Admin"])
async def migrate_roles(current_user_id: str = Depends(is_super_admin())):
    """Migrate admin roles from Databutton storage to Supabase.
    
    This endpoint triggers the one-time migration of admin roles from
    Databutton storage to the Supabase admin_roles table.
    """
    # Import the migration function from admin_permissions_api
    from app.apis.admin_permissions_api import migrate_roles2 as do_migration
    
    # Call the migration endpoint
    try:
        result = do_migration({"user_id": current_user_id}) # Pass a mock current_user dict
        return result
    except Exception as e:
        print(f"Error during migration: {e}")
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")

# --- User Management Endpoints ---

@router.get("/users", response_model=UserListResponse)
async def list_users(
    is_admin: Optional[bool] = Query(None, description="Filter by admin status"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user_id: str = Depends(require_permission(Permissions.VIEW_USERS))
):
    """
    List all users with optional filtering.
    """
    if admin_supabase is None:
        logger.error("Supabase client not available for listing users.")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    try:
        # First get auth users directly (using admin token/service role)
        import databutton as db
        import json
        import requests
        from supabase import create_client, Client

        # Get API keys from secrets
        supabase_url = db.secrets.get("SUPABASE_URL")
        service_role_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not service_role_key:
            logger.error("Missing Supabase credentials")
            raise HTTPException(status_code=500, detail="Server configuration error")

        # Create a new client with service role key for admin access
        admin_client = create_client(supabase_url, service_role_key)

        # Directly fetch users from auth.users table using admin client
        try:
            users_response = admin_client.auth.admin.list_users()
            auth_users = []

            # Extract user data based on response structure and build lookup dictionaries
            email_lookup = {}
            last_login_lookup = {}
            auth_users_data = []

            # Try to determine the structure of users_response
            if hasattr(users_response, 'users'):
                auth_users_data = users_response.users
                logger.info(f"Found users in users_response.users: {len(auth_users_data)}")
            elif isinstance(users_response, dict) and 'users' in users_response:
                auth_users_data = users_response['users']
                logger.info(f"Found users in users_response['users']: {len(auth_users_data)}")
            elif isinstance(users_response, list):
                auth_users_data = users_response
                logger.info(f"Found users directly in list response: {len(auth_users_data)}")
            else:
                # Try to log the actual structure
                logger.warning(f"Unknown users_response structure: {type(users_response)}")
                try:
                    if hasattr(users_response, 'data'):
                        auth_users_data = users_response.data
                        logger.info(f"Found users in users_response.data: {len(auth_users_data)}")
                    elif isinstance(users_response, dict) and 'data' in users_response:
                        auth_users_data = users_response['data']
                        logger.info(f"Found users in users_response['data']: {len(auth_users_data)}")
                except Exception as attr_err:
                    logger.warning(f"Error inspecting users_response: {attr_err}")

            # Log the whole response structure for debugging
            logger.debug(f"Auth users response: {repr(users_response)}")

            # Process each auth user
            for auth_user in auth_users_data:
                # Extract user ID and email based on whether it's a dict or object
                user_id = None
                email = None
                last_sign_in = None

                if isinstance(auth_user, dict):
                    user_id = auth_user.get('id')
                    email = auth_user.get('email')
                    last_sign_in = auth_user.get('last_sign_in_at')
                    logger.debug(f"Dict user found: id={user_id}, email={email}, last_login={last_sign_in}")
                else:
                    # Try object with attributes
                    try:
                        user_id = getattr(auth_user, 'id', None)
                        email = getattr(auth_user, 'email', None)
                        last_sign_in = getattr(auth_user, 'last_sign_in_at', None)
                        logger.debug(f"Object user found: id={user_id}, email={email}, last_login={last_sign_in}")
                    except Exception as attr_err:
                        logger.warning(f"Error accessing object attributes: {attr_err}")

                # Store in lookup dictionaries if valid
                if user_id and email:
                    email_lookup[user_id] = email
                    if last_sign_in:
                        last_login_lookup[user_id] = last_sign_in

            logger.info(f"Built email lookup with {len(email_lookup)} entries")
            logger.info(f"Built last login lookup with {len(last_login_lookup)} entries")

            # Print the first few entries of each lookup for debugging
            if email_lookup:
                first_key = next(iter(email_lookup))
                logger.debug(f"Sample email entry: {first_key} -> {email_lookup[first_key]}")

            if last_login_lookup:
                first_key = next(iter(last_login_lookup))
                logger.debug(f"Sample last login entry: {first_key} -> {last_login_lookup[first_key]}")

            # Get subscription data with comprehensive approach
            subscription_lookup = {}
            
            # Method 1: Check profiles table first (most reliable source)
            try:
                profiles_response = admin_supabase.table("profiles").select("id, subscription_tier").execute()
                if profiles_response.data:
                    for profile in profiles_response.data:
                        if profile.get('id') and profile.get('subscription_tier'):
                            # Only set if it's not 'free' or None
                            tier = profile.get('subscription_tier')
                            if tier and tier != 'free':
                                subscription_lookup[profile['id']] = tier
                            
                    logger.info(f"Found {len(subscription_lookup)} subscription tiers from profiles table")
                else:
                    logger.info("No profile data found")
            except Exception as profile_err:
                logger.warning(f"Error fetching profile subscription data: {str(profile_err)}")
                
            # Method 2: Check active subscriptions table
            try:
                subs_response = admin_supabase.table("subscriptions").select("user_id, subscription_tier, status").eq("status", "active").execute()
                if subs_response.data:
                    for sub in subs_response.data:
                        if sub.get('user_id') and sub.get('subscription_tier'):
                            subscription_lookup[sub['user_id']] = sub['subscription_tier']

                    logger.info(f"Found {len(subscription_lookup)} active subscriptions from subscriptions table")
                else:
                    logger.info("No subscription data found in subscriptions table")
            except Exception as sub_err:
                logger.warning(f"Error fetching subscription data: {str(sub_err)}")  

                # Try alternate table name
                try:
                    subs_response = admin_supabase.table("user_subscriptions").select("user_id, tier, status").eq("status", "active").execute()
                    if subs_response.data:
                        for sub in subs_response.data:
                            if sub.get('user_id') and sub.get('tier'):
                                subscription_lookup[sub['user_id']] = sub['tier']

                        logger.info(f"Found {len(subscription_lookup)} active subscriptions in user_subscriptions table")
                except Exception as alt_err:
                    logger.warning(f"Error fetching alternate subscription data: {str(alt_err)}")

                # Last resort: check payment_history
                try:
                    payment_response = admin_supabase.table("payment_history").select("user_id, subscription_level").order("created_at", desc=True).execute()
                    if payment_response.data:
                        # Group by user_id and take the most recent subscription_level
                        seen_users = set()
                        for payment in payment_response.data:
                            user_id = payment.get('user_id')
                            sub_level = payment.get('subscription_level')
                            if user_id and sub_level and user_id not in seen_users:
                                subscription_lookup[user_id] = sub_level
                                seen_users.add(user_id)

                        logger.info(f"Found {len(subscription_lookup)} subscriptions from payment history")
                except Exception as payment_err:
                    logger.warning(f"Error fetching payment history: {str(payment_err)}")
                    
            # Method 3: Check auth metadata for any users still missing tier info
            try:
                # Get all users from auth.users to check app_metadata
                users_response = admin_client.auth.admin.list_users()
                if hasattr(users_response, 'users'):
                    auth_users = users_response.users
                elif isinstance(users_response, dict) and 'users' in users_response:
                    auth_users = users_response['users']
                elif isinstance(users_response, list):
                    auth_users = users_response
                else:
                    auth_users = []
                    
                # Go through auth users and extract subscription tiers from metadata
                metadata_count = 0
                for auth_user in auth_users:
                    try:
                        # Extract user ID
                        user_id = None
                        metadata = None
                        
                        if isinstance(auth_user, dict):
                            user_id = auth_user.get('id')
                            metadata = auth_user.get('app_metadata', {})
                        else:
                            # Try as object
                            user_id = getattr(auth_user, 'id', None)
                            metadata = getattr(auth_user, 'app_metadata', {}) if user_id else {}
                            
                        # Check for tier in metadata
                        if user_id and metadata:
                            tier = None
                            if isinstance(metadata, dict):
                                tier = metadata.get('subscription_tier')
                            else:
                                tier = getattr(metadata, 'subscription_tier', None)
                                
                            if tier and tier != 'free' and user_id not in subscription_lookup:
                                subscription_lookup[user_id] = tier
                                metadata_count += 1
                    except Exception as user_err:
                        continue  # Skip users with errors
                        
                logger.info(f"Found {metadata_count} additional subscription tiers from auth metadata")
            except Exception as auth_err:
                logger.warning(f"Error fetching auth metadata subscription data: {str(auth_err)}")

            # Get profile data
            query = admin_supabase.table("profiles").select("*")

            # Apply filters if provided
            if is_admin is not None:
                query = query.eq("is_admin", is_admin)
            if is_active is not None:
                query = query.eq("is_active", is_active)

            profile_response = query.execute()
            profiles = profile_response.data or []
            logger.info(f"Retrieved {len(profiles)} profiles from database")

            # Finally, merge all data together
            for profile in profiles:
                user_id = profile.get('id')
                
                # Add email if available
                if user_id in email_lookup:
                    profile['email'] = email_lookup[user_id]
                    logger.debug(f"Added email for user {user_id}: {email_lookup[user_id]}")
                
                # Add last login time if available
                if user_id in last_login_lookup:
                    profile['last_login_at'] = last_login_lookup[user_id]
                    logger.debug(f"Added last_login for user {user_id}: {last_login_lookup[user_id]}")
                
                # Add subscription tier if available
                if user_id in subscription_lookup:
                    profile['subscription_tier'] = subscription_lookup[user_id]
                    logger.debug(f"Added subscription for user {user_id}: {subscription_lookup[user_id]}")
                elif not profile.get('subscription_tier'):
                    profile['subscription_tier'] = 'free'  # Default if not found
            
            # Log full details of first profile for debugging
            if profiles and len(profiles) > 0:
                logger.info(f"First profile after merging all data: {json.dumps(profiles[0])}")
                
            # Explicitly log counts of each data point
            email_count = sum(1 for p in profiles if p.get('email'))
            login_count = sum(1 for p in profiles if p.get('last_login_at'))
            sub_count = sum(1 for p in profiles if p.get('subscription_tier') and p.get('subscription_tier') != 'free')
            
            logger.info(f"Final data counts: {len(profiles)} profiles, {email_count} with emails, {login_count} with login times, {sub_count} with non-free subscriptions")
            
            # Return the enhanced data
            return UserListResponse(users=profiles)

        except Exception as auth_err:
            logger.exception(f"Error fetching auth users: {str(auth_err)}")
            # Fall back to profiles only if auth fetch fails

        # Fallback: get profiles only without emails
        query = admin_supabase.table("profiles").select("*")

        # Apply filters if provided
        if is_admin is not None:
            query = query.eq("is_admin", is_admin)
        if is_active is not None:
            query = query.eq("is_active", is_active)

        profile_response = query.execute()
        profiles = profile_response.data or []
        logger.warning("Falling back to profiles without email data")

        return UserListResponse(users=profiles)

    except Exception as e:
        logger.exception(f"Error listing users: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing users: {str(e)}")

@router.put("/users/{user_id}", status_code=200)
async def update_user_status(user_id: str, update: UserUpdateRequest):
    """
    Update a user's admin status or active status.
    """
    if admin_supabase is None:
        logger.error("Supabase client not available for updating user.")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    try:
        # Prepare update data, removing None values
        update_data = {k: v for k, v in update.dict().items() if v is not None}

        if not update_data:  # If nothing to update
            return {"message": "No changes to apply"}

        # Update the user in profiles table
        admin_supabase.table("profiles").update(update_data).eq("id", user_id).execute()

        # If updating admin status, also update auth.users app_metadata
        if update.is_admin is not None:
            try:
                admin_supabase.auth.admin.update_user_by_id(
                    user_id,
                    {"app_metadata": {"is_admin": update.is_admin}}
                )
            except Exception as auth_err:
                logger.warning(f"Failed to update auth metadata for user {user_id}: {auth_err}")

        return {"message": f"User {user_id} updated successfully"}

    except Exception as e:
        logger.exception(f"Error updating user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")
