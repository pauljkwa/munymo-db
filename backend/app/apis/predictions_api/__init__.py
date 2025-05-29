# src/app/apis/predictions_api/__init__.py

from fastapi import APIRouter, HTTPException, Depends, Header, Request # Add Request
from supabase.lib.client_options import ClientOptions
from gotrue.errors import AuthApiError
from pydantic import BaseModel, Field
from datetime import date, datetime, timezone, timedelta, time # Ensure time is imported
import uuid
import re
from typing import Optional
import yfinance as yf
import pandas as pd
import pytz
import logging
import os
# import jwt # Removed jwt import
import databutton as db # Ensure db is imported
from supabase import create_client, Client
from app.apis.auth_utils import get_current_user, require_permission # Added auth imports
from app.apis.sandbox_control import is_sandbox_mode, get_current_sandbox_game_id # Import sandbox helpers
from app.apis.admin_permissions import Permissions # Import permissions
from app.env import Mode, mode # Import Mode for environment checking

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Supabase Client Initialization ---
supabase_admin_client: Client | None = None
supabase_anon_client: Client | None = None
try:
    supabase_url = db.secrets.get("SUPABASE_URL")
    service_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY")
    anon_key = db.secrets.get("SUPABASE_ANON_KEY")

    if not supabase_url: logger.error("SUPABASE_URL secret is missing!")
    if not service_key: logger.error("SUPABASE_SERVICE_ROLE_KEY secret is missing!")
    if not anon_key: logger.error("SUPABASE_ANON_KEY secret is missing!")

    if supabase_url and service_key:
        supabase_admin_client = create_client(supabase_url, service_key)
        masked_key = f"{service_key[:4]}...{service_key[-4:]}" if service_key and len(service_key) > 8 else "[Key Invalid/Short]"
        logger.info(f"Supabase ADMIN client created with URL: {supabase_url} and Service Key (masked): {masked_key}")
    else:
        supabase_admin_client = None
        logger.error("Supabase ADMIN client set to None due to missing secrets.")

    if supabase_url and anon_key:
        supabase_anon_client = create_client(supabase_url, anon_key)
        logger.info("Supabase ANON client initialized successfully.")
    else:
        supabase_anon_client = None
        logger.error("Supabase ANON client set to None due to missing secrets.")

except Exception as e:
    logger.exception(f"Failed to initialize Supabase clients: {e}")
    supabase_admin_client = None
    supabase_anon_client = None

def get_supabase_admin_client() -> Client:
    """Returns the initialized Supabase ADMIN (service role) client."""
    if supabase_admin_client is None:
        logger.critical("Attempted to use Supabase ADMIN client, but it's not initialized!")
        raise HTTPException(status_code=503, detail="Database admin client is not initialized.")
    return supabase_admin_client

def get_supabase_anon_client() -> Client:
    """Returns the initialized Supabase ANON client (respects RLS)."""
    if supabase_anon_client is None:
        logger.critical("Attempted to use Supabase ANON client, but it's not initialized!")
        raise HTTPException(status_code=503, detail="Database anon client is not initialized.")
    return supabase_anon_client

def get_supabase_client() -> Client:
    """DEPRECATED? Returns the ADMIN (service role) client. Use get_supabase_admin_client() or get_supabase_anon_client() explicitly."""
    logger.warning("Using deprecated get_supabase_client(), prefer get_supabase_admin_client() or get_supabase_anon_client().")
    return get_supabase_admin_client()
# --- End Supabase Client Initialization ---


# --- Authentication Dependency Moved to app.utils.auth ---


# Define the router for this API
router = APIRouter()

# --- Helper functions ---
async def _update_all_time_leaderboard(exchange: str, game_date: date):
    """
    Updates player exchange stats for all players who submitted predictions for games on
    the given exchange up to the specified date.
    
    This function:
    1. Gets all processed predictions for the given exchange up to the specified date
    2. For each player, calculates:
       - Total games played
       - Total correct predictions
       - Current streak (consecutive correct predictions)
       - Total time taken for submissions
       - Total score (based on correctness and timing)
    3. Updates the player_exchange_stats table with this data
    
    Args:
        exchange: Exchange code (e.g., 'ASX', 'NYSE')
        game_date: The game date we just processed
    """
    logger.info(f"Updating all-time leaderboard for {exchange} after processing game on {game_date}")
    
    try:
        supabase_admin = get_supabase_admin_client()
        
        # 1. Get all game results for this exchange up to and including the processed date
        game_table_name = f"{exchange.lower()}_games"
        
        # Get all processed games with their dates (up to our current game_date)
        games_query = supabase_admin.table(game_table_name)\
            .select("id, game_date")\
            .lte("game_date", game_date.isoformat())\
            .execute()
            
        if not games_query.data:
            logger.warning(f"No games found for {exchange} up to {game_date}. Nothing to update.")
            return
            
        # Get all pair_ids for these games to fetch results
        pair_ids = [game["id"] for game in games_query.data]
        pair_date_map = {game["id"]: game["game_date"] for game in games_query.data}
        
        # 2. Get all results for these games
        results_query = supabase_admin.table("game_results")\
            .select("pair_id, actual_winner_ticker")\
            .in_("pair_id", pair_ids)\
            .execute()
            
        if not results_query.data:
            logger.warning(f"No results found for {exchange} games up to {game_date}. Nothing to update.")
            return
            
        # Create mapping of pair_id to winner for easy lookup
        results_map = {result["pair_id"]: result["actual_winner_ticker"] for result in results_query.data}
        
        # 3. Get all predictions for these games
        predictions_query = supabase_admin.table("predictions")\
            .select("prediction_id, pair_id, user_id, predicted_ticker, submission_timestamp_utc, time_taken_secs")\
            .in_("pair_id", pair_ids)\
            .execute()
            
        if not predictions_query.data:
            logger.warning(f"No predictions found for {exchange} games up to {game_date}. Nothing to update.")
            return
            
        # 4. Group predictions by user
        user_predictions = {}
        
        for pred in predictions_query.data:
            user_id = pred["user_id"]
            if user_id not in user_predictions:
                user_predictions[user_id] = []
            user_predictions[user_id].append(pred)
            
        # 5. Calculate stats for each user
        stats_to_update = []
        
        for user_id, predictions in user_predictions.items():
            # Sort predictions by date (using pair_id lookup to game_date)
            # This is important for calculating streaks correctly
            sorted_predictions = sorted(
                predictions,
                key=lambda p: pair_date_map.get(p["pair_id"], "")
            )
            
            # Calculate stats
            total_games = len(sorted_predictions)
            correct_games = 0
            current_streak = 0
            longest_streak = 0
            total_time_ms = 0
            total_score = 0
            
            # Track consecutive correct predictions
            temp_streak = 0
            
            for pred in sorted_predictions:
                pair_id = pred["pair_id"]
                if pair_id in results_map:
                    predicted_ticker = pred["predicted_ticker"]
                    actual_winner = results_map[pair_id]
                    
                    # Skip ties and errors
                    if actual_winner in ["TIE", "ERROR"]:
                        continue
                    
                    is_correct = predicted_ticker == actual_winner
                    
                    if is_correct:
                        correct_games += 1
                        temp_streak += 1
                        
                        # Add to score (base 100 for correct + speed bonus)
                        time_taken_secs = pred.get("time_taken_secs", 0)
                        time_taken_ms = time_taken_secs * 1000 if time_taken_secs else 0
                        
                        if time_taken_ms > 0:
                            # Up to 50 bonus points based on speed (faster = more points)
                            # Scale: 0 seconds = 50 points, 60+ seconds = 0 points
                            time_bonus = max(0, 50 - min(50, time_taken_secs / 1.2))
                            prediction_score = 100 + time_bonus
                        else:
                            prediction_score = 100
                            
                        total_score += prediction_score
                    else:
                        # Reset streak
                        temp_streak = 0
                        # Still give base score for participation
                        total_score += 25
                    
                    # Track best streak
                    longest_streak = max(longest_streak, temp_streak)
                    
                    # Add time taken if available
                    if time_taken_secs:
                        total_time_ms += time_taken_secs * 1000
            
            # Current streak is the most recent consecutive correct predictions
            current_streak = temp_streak
            
            # 6. Create or update player_exchange_stats entry
            stats_entry = {
                "player_id": user_id,
                "exchange_code": exchange.upper(),
                "games_played": total_games,
                "total_correct": correct_games,
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "total_time_milliseconds": total_time_ms,
                "total_score": total_score,
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
            
            stats_to_update.append(stats_entry)
            
        # 7. Bulk upsert stats to player_exchange_stats table
        if stats_to_update:
            logger.info(f"Upserting {len(stats_to_update)} player stats entries for {exchange}")
            
            # Use upsert to handle both insert and update cases
            stats_response = supabase_admin.table("player_exchange_stats")\
                .upsert(stats_to_update, on_conflict="player_id,exchange_code")\
                .execute()
                
            logger.info(f"Leaderboard update complete for {exchange}. Status: {getattr(stats_response, 'status_code', 'unknown')}")
        else:
            logger.warning(f"No player stats to update for {exchange}")
            
    except Exception as e:
        logger.exception(f"Error updating all-time leaderboard for {exchange}: {e}")
        raise

# --- Pydantic Models ---
class NextClueResponse(BaseModel):
    """Response model for the next game clue."""
    next_day_clue: Optional[str] = None

class GameData(BaseModel):
    """Represents the curated data for a single day's game matchup."""
    exchange: str
    date_str: str = Field(..., description="Game date in YYYY-MM-DD format", alias="date")
    company_a_ticker: str
    company_a_name: str
    company_b_ticker: str
    company_b_name: str
    sector: str
    reasoning: str = Field(..., description="Paragraph explaining the matchup interest.")
    submitted_by_player_id: Optional[str] = Field(None, description="User ID if submitted by a player")
    next_day_clue: Optional[str] = Field(None, description="Clue for the following day's game")
    status: str = Field("scheduled", description="Status: scheduled, active, played, error")

    class Config:
        allow_population_by_field_name = True # Correct config option

class CompanyInfo(BaseModel):
    """Basic information about a company."""
    name: str
    ticker: str

class DailyPredictionPairResponse(BaseModel):
    """Response model for the daily prediction pair."""
    pair_id: str
    company_a: CompanyInfo
    company_b: CompanyInfo
    prediction_date: date

class GameResultResponse(BaseModel):
    """Response model for game result details."""
    pair_id: str
    date: date
    company_a_ticker: str
    company_b_ticker: str
    winning_ticker: Optional[str] = None
    reason: Optional[str] = None

class ProcessResultsRequest(BaseModel): # Defined before use
    game_date_str: str = Field(..., description="Date of the game to process in YYYY-MM-DD format.")
    exchange: str = Field(..., description="Exchange the game belongs to (e.g., 'ASX', 'NYSE').")
    manual_results: Optional[dict] = Field(None, description="Optional manual results data when automated API fails")

class PredictionRequest(BaseModel): # Defined before use
    pair_id: str = Field(..., description="The unique ID of the prediction pair for the day.")
    predicted_ticker: str = Field(..., description="The ticker symbol of the company predicted to perform better.")

class PredictionResponse(BaseModel): # Defined before use
    prediction_id: str
    message: str
    submitted_at: datetime


# --- Helper Functions ---
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)


# --- API Endpoints ---

@router.get("/predictions/daily-pair", response_model=DailyPredictionPairResponse)
def get_daily_prediction_pair():
    """
    Retrieves the pair of companies for the game.
    - In Sandbox mode (DEV) with a specific game ID set, fetches that game.
    - Otherwise, fetches today's scheduled game.
    Raises a 404 error if the required game data is not found.
    """
    logger.info("Attempting to get daily prediction pair...")
    game_data = None
    fetch_mode = "standard" # Default mode
    target_game_info = "today's scheduled game" # Default target description

    try:
        # Get client, ensuring it's initialized
        current_supabase_client = get_supabase_anon_client() # Use getter function
    except Exception as e:
        logger.error(f"[ERROR] Error getting Supabase ANON client: {e}")
        raise HTTPException(status_code=503, detail="Database connection setup error.") from None

    # --- Sandbox Check ---
    if is_sandbox_mode():
        logger.info("App is in Sandbox mode (DEV). Checking for specific game ID.")
        sandbox_game_id = get_current_sandbox_game_id()
        if sandbox_game_id is not None:
            fetch_mode = "sandbox"
            target_game_info = f"sandbox game ID {sandbox_game_id}"
            logger.info(f"Sandbox game ID '{sandbox_game_id}' found. Fetching this specific game.")
            # TODO: Determine game_table_name dynamically if needed, assuming asx_games for now
            game_table_name = "asx_games"
            try:
                response = current_supabase_client.table(game_table_name) \
                                .select("id, game_date, exchange, company_a_ticker, company_a_name, company_b_ticker, company_b_name") \
                                .eq("id", sandbox_game_id) \
                                .limit(1) \
                                .execute()
                logger.debug(f"Supabase response for sandbox game ID {sandbox_game_id}: {response}")
                if response.data and len(response.data) > 0:
                    game_data = response.data[0]
                else:
                    logger.warning(f"No game found with ID {sandbox_game_id} in {game_table_name}")
                    # Don't raise yet - will fall through to test data fallback
            except Exception as e:
                logger.exception(f"Error querying Supabase for sandbox game ID {sandbox_game_id}: {e}")
                # Don't raise immediately, allow fallback to standard if sandbox fetch fails
        else:
            logger.info("Sandbox mode active, but no specific game ID set. Will fetch standard game.")
            # fetch_mode remains "standard", game_data remains None, fall through
    else:
        logger.info("App is not in Sandbox mode. Will fetch standard game.")
        # fetch_mode remains "standard", game_data remains None, fall through

    # --- Standard Logic (Fallback) ---
    # Execute this block only if game_data is still None (i.e., not in sandbox mode, or sandbox ID not set)
    if game_data is None:
        today = date.today()
        today_str = today.isoformat()
        target_game_info = f"today's ({today_str}) scheduled game" # Update target info
        logger.info(f"Attempting standard retrieval for {target_game_info}")
        # TODO: Determine game_table_name dynamically if needed, assuming asx_games for now
        game_table_name = "asx_games"
        try:
            # Add more detailed debugging
            logger.debug(f"Executing query: game_date={today_str}, status=scheduled in table {game_table_name}")
            
            # Try with proper error handling
            try:
                response = current_supabase_client.table(game_table_name) \
                             .select("id, game_date, exchange, company_a_ticker, company_a_name, company_b_ticker, company_b_name") \
                             .eq("game_date", today_str) \
                             .eq("status", "scheduled") \
                             .limit(1) \
                             .execute()
                             
                logger.debug(f"Raw Supabase response: {response}")
                logger.debug(f"Response data: {response.data if hasattr(response, 'data') else 'No data attribute'}")
            except Exception as query_err:
                logger.error(f"Error executing Supabase query: {query_err}")
                raise
            
            if response and hasattr(response, 'data') and response.data and len(response.data) > 0:
                game_data = response.data[0]  # First result
                logger.info(f"Successfully found game with ID: {game_data.get('id')}")
            else:
                # Try fallback strategies
                logger.info("No scheduled games found for today, checking any game status...")
                
                # Try any status for today
                try:
                    fallback_response = current_supabase_client.table(game_table_name) \
                                 .select("id, game_date, exchange, company_a_ticker, company_a_name, company_b_ticker, company_b_name") \
                                 .eq("game_date", today_str) \
                                 .limit(1) \
                                 .execute()
                except Exception as fallback_err:
                    logger.error(f"Error executing fallback query: {fallback_err}")
                    raise
                
                if fallback_response and hasattr(fallback_response, 'data') and fallback_response.data and len(fallback_response.data) > 0:
                    game_data = fallback_response.data[0]  # First result
                    logger.info(f"Found fallback game with ID: {game_data.get('id')}")
                    
                    # Update the game status to scheduled for future consistency
                    try:
                        update_response = current_supabase_client.table(game_table_name) \
                            .update({"status": "scheduled"}) \
                            .eq("id", game_data.get('id')) \
                            .execute()
                        logger.info(f"Updated fallback game status to scheduled: {update_response}")
                    except Exception as update_err:
                        logger.warning(f"Failed to update game status: {update_err}")
                        # Continue anyway since we have the game data
                else:
                    # Try latest game from previous days if nothing for today
                    logger.info("No games found for today, checking recent games...")
                    try:
                        recent_response = current_supabase_client.table(game_table_name) \
                                     .select("id, game_date, exchange, company_a_ticker, company_a_name, company_b_ticker, company_b_name") \
                                     .order("game_date", desc=True) \
                                     .limit(1) \
                                     .execute()
                    except Exception as recent_err:
                        logger.error(f"Error executing recent games query: {recent_err}")
                        raise
                                     
                    if recent_response and hasattr(recent_response, 'data') and recent_response.data and len(recent_response.data) > 0:
                        game_data = recent_response.data[0]  # First result
                        logger.info(f"Using most recent available game with ID: {game_data.get('id')}")
                    else:
                        # Use test data if in development mode and no data found anywhere
                        if mode == Mode.DEV:
                            logger.warning("No game found in database, using test data for DEV mode")
                            # Create test data for development
                            game_data = {
                                "id": str(uuid.uuid4()),
                                "game_date": today_str,
                                "exchange": "NYSE",
                                "company_a_ticker": "AAPL",
                                "company_a_name": "Apple Inc.",
                                "company_b_ticker": "MSFT", 
                                "company_b_name": "Microsoft Corporation",
                                "status": "scheduled"
                            }
                            logger.info(f"Created test game data with ID: {game_data.get('id')}")
                        else:
                            logger.warning(f"No game found for today or recent days in {game_table_name}")
                            raise Exception("No game data found")
        except Exception as e:
            logger.exception(f"Error querying Supabase for standard daily game on {today_str}: {e}")
            # In development mode, provide fallback test data
            if mode == Mode.DEV:
                logger.warning("Database query failed in DEV mode, using fallback test data")
                # Create fallback test data for development
                game_data = {
                    "id": str(uuid.uuid4()),
                    "game_date": today_str,
                    "exchange": "NYSE",
                    "company_a_ticker": "AAPL",
                    "company_a_name": "Apple Inc.",
                    "company_b_ticker": "MSFT", 
                    "company_b_name": "Microsoft Corporation",
                    "status": "scheduled"
                }
                logger.info(f"Created fallback test game data with ID: {game_data.get('id')}")
            else:
                # If standard fetch fails in production, we have no game data
                raise HTTPException(status_code=500, detail=f"Failed to retrieve standard game data. Error: {str(e)[:100]}") from e

    # --- Process Result ---
    if not game_data:
        # This means neither sandbox fetch (if attempted) nor standard fetch yielded data, and we're not in DEV mode
        logger.warning(f"No game data found for {target_game_info}. Raising 404.")
        raise HTTPException(status_code=404, detail=f"No game data found for {target_game_info}.")

    logger.info(f"Successfully fetched data. Using game ID: {game_data.get('id', 'N/A')}")

    # Safely process the data with better error handling
    if game_data:
        try:
            pair_id = str(game_data.get("id", ""))  # Convert id to string for consistency, with empty fallback
            if not pair_id:
                logger.error(f"Missing 'id' field in game data: {game_data}")
                pair_id = str(uuid.uuid4())  # Generate a fallback ID if needed
            
            # Safely extract company data with fallbacks
            company_a_name = game_data.get('company_a_name', "Company A")
            company_a_ticker = game_data.get('company_a_ticker', "TKRA")
            company_b_name = game_data.get('company_b_name', "Company B")
            company_b_ticker = game_data.get('company_b_ticker', "TKRB")
            
            company_a = CompanyInfo(name=company_a_name, ticker=company_a_ticker)
            company_b = CompanyInfo(name=company_b_name, ticker=company_b_ticker)

            # Use the actual date from the fetched game data
            try:
                prediction_date_str = game_data.get('game_date')
                if not prediction_date_str:
                    logger.error(f"Fetched game data is missing 'game_date': {game_data}")
                    prediction_date = date.today()  # Fallback to today if missing
                else:
                    prediction_date = date.fromisoformat(prediction_date_str)
            except (ValueError, TypeError) as date_err:
                logger.error(f"Invalid date format in fetched game data ('{game_data.get('game_date')}'). Falling back to today. Error: {date_err}")
                prediction_date = date.today()  # Fallback

            return DailyPredictionPairResponse(
                pair_id=pair_id,
                company_a=company_a,
                company_b=company_b,
                prediction_date=prediction_date
            )
        except Exception as process_err:
            logger.exception(f"Error processing game data: {process_err}")
            # Last resort fallback - create a completely synthetic response regardless of environment
            logger.warning("Using emergency fallback synthetic response")
            return DailyPredictionPairResponse(
                pair_id=str(uuid.uuid4()),
                company_a=CompanyInfo(name="Apple Inc.", ticker="AAPL"),
                company_b=CompanyInfo(name="Microsoft Corporation", ticker="MSFT"),
                prediction_date=date.today()
            )


@router.post("/predictions/process-results", status_code=200)
async def process_game_results(request: ProcessResultsRequest, current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))):
    """
    Processes the results for a given game date and exchange.
    1. Fetches game details.
    2. Uses yfinance to determine the winner.
    3. Updates the game table with the winner.
    4. Calculates market timings and prediction time taken.
    5. Updates associated predictions with correctness and time.
    6. Placeholder for triggering leaderboard update.
    """
    logger.info(f"Processing results for date: {request.game_date_str}, exchange: {request.exchange}")
    supabase_admin = get_supabase_admin_client()
    game_date = date.fromisoformat(request.game_date_str)
    exchange = request.exchange.upper()

    game_table_name = f"{exchange.lower()}_games"

    try:
        # 1. Fetch game details
        game_response = supabase_admin.table(game_table_name) \
            .select("id, game_date, company_a_ticker, company_b_ticker, actual_winner_ticker") \
            .eq("game_date", request.game_date_str) \
            .limit(1) \
            .single() \
            .execute()
        game_data = game_response.data
        logger.debug(f"Fetched game data: {game_data}")

        if not game_data:
            logger.warning(f"No game found for date {request.game_date_str} and exchange {exchange}")
            raise HTTPException(status_code=404, detail="Game not found for the specified date and exchange.")

        if game_data.get("actual_winner_ticker"):
             logger.info(f"Results already processed for game {game_data['pair_id']} on {game_data['game_date']}.")
             return {"message": "Results already processed for this game."}

        ticker_a = game_data['company_a_ticker']
        ticker_b = game_data['company_b_ticker']
        pair_id = game_data['id']  # Changed from 'pair_id' to 'id'

        # 2. Determine winner
        actual_winner = None
        perf_a = None
        perf_b = None
        
        # Check for manual results first
        if request.manual_results:
            logger.info(f"Using manually provided results for game {pair_id}")
            manual_results = request.manual_results
            perf_a = manual_results.get('company_a_performance')
            perf_b = manual_results.get('company_b_performance')
            # Use provided winner or determine from performances
            if manual_results.get('winner_ticker'):
                actual_winner = manual_results['winner_ticker']
                logger.info(f"Using manually specified winner: {actual_winner}")
            elif perf_a is not None and perf_b is not None:
                if perf_a > perf_b: actual_winner = ticker_a
                elif perf_b > perf_a: actual_winner = ticker_b
                else: actual_winner = "TIE"
                logger.info(f"Determined winner from manual performances: {actual_winner}")
        else:
            # Use yfinance for automatic results
            try:
                end_date = game_date + timedelta(days=1)
                data_a = yf.download(ticker_a, start=game_date, end=end_date, progress=False)
                data_b = yf.download(ticker_b, start=game_date, end=end_date, progress=False)

                # Check for valid data and non-zero open price before calculating performance
                if data_a.empty or data_b.empty or 'Open' not in data_a or 'Close' not in data_a or 'Open' not in data_b or 'Close' not in data_b or data_a['Open'].iloc[0] == 0 or data_b['Open'].iloc[0] == 0:
                    logger.error(f"Could not fetch valid yfinance data or zero open price for {ticker_a} or {ticker_b} on {game_date}")
                else:
                    perf_a = (data_a['Close'].iloc[-1] - data_a['Open'].iloc[0]) / data_a['Open'].iloc[0] * 100  # Convert to percentage
                    perf_b = (data_b['Close'].iloc[-1] - data_b['Open'].iloc[0]) / data_b['Open'].iloc[0] * 100  # Convert to percentage
                    logger.info(f"Performance on {game_date}: {ticker_a}={perf_a:.4f}%, {ticker_b}={perf_b:.4f}%")

                    if perf_a > perf_b: actual_winner = ticker_a
                    elif perf_b > perf_a: actual_winner = ticker_b
                    else: actual_winner = "TIE"
                    logger.info(f"Determined winner for {pair_id}: {actual_winner}")

            except Exception as yf_err:
                logger.exception(f"Error fetching/processing yfinance data: {yf_err}")

        # 3. Update game table
        if actual_winner:
            try:
                update_payload = {"actual_winner_ticker": actual_winner}
                # Add performance values if available
                if perf_a is not None:
                    update_payload["company_a_performance"] = perf_a
                if perf_b is not None:
                    update_payload["company_b_performance"] = perf_b
                    
                update_game_response = supabase_admin.table(game_table_name) \
                    .update(update_payload) \
                    .eq("id", str(pair_id)) \
                    .execute()
                if update_game_response.data:
                     logger.info(f"Updated {game_table_name} with winner {actual_winner} for {pair_id}")
                else:
                     # Check for specific error information if available
                     error_info = getattr(update_game_response, 'error', 'No error info')
                     logger.error(f"Failed to update {game_table_name} winner for {pair_id}. Error: {error_info}")
            except Exception as db_err:
                logger.exception(f"DB Error updating {game_table_name} winner for {pair_id}: {db_err}")

        # 4. Calculate market timings
        tz_map = {"ASX": "Australia/Sydney", "NYSE": "America/New_York"}
        exchange_tz_str = tz_map.get(exchange)
        game_start_utc = None
        if exchange_tz_str:
            try:
                exchange_tz = pytz.timezone(exchange_tz_str)
                prev_day = game_date - timedelta(days=1)
                # Simple check for weekend, needs refinement for holidays
                while prev_day.weekday() >= 5: prev_day -= timedelta(days=1)
                # TODO: Use accurate market calendar (e.g., trading_calendars library)
                game_start_local = datetime.combine(prev_day, time(16, 0), tzinfo=exchange_tz) # Approx 4 PM market close previous day
                game_start_utc = game_start_local.astimezone(pytz.utc)
                logger.info(f"Estimated Game Start UTC: {game_start_utc}")
            except Exception as tz_err:
                logger.exception(f"Error calculating game start time for {exchange}: {tz_err}")
        else:
             logger.error(f"Timezone not configured for exchange: {exchange}. Cannot calculate time_taken.")

        # 5. Update predictions
        predictions_response = supabase_admin.table("predictions") \
            .select("prediction_id, user_id, predicted_ticker, submission_timestamp_utc") \
            .eq("pair_id", pair_id) \
            .filter("is_correct", "is", None) \
            .execute() # Corrected: Ensure no trailing backslash if it's the last line

        predictions_data = predictions_response.data
        logger.info(f"Found {len(predictions_data)} unprocessed predictions for pair_id {pair_id}")

        updates_to_perform = []
        for pred in predictions_data:
            is_correct = None
            if actual_winner and actual_winner != "TIE":
                is_correct = (pred['predicted_ticker'] == actual_winner)
            elif actual_winner == "TIE":
                 is_correct = False # Ties count as incorrect

            time_taken_secs = None
            if game_start_utc and pred.get('submission_timestamp_utc'): # Check if timestamp exists
                 try:
                     submission_utc_str = pred['submission_timestamp_utc']
                     # Ensure the string has timezone info for consistent parsing
                     if '+' not in submission_utc_str and 'Z' not in submission_utc_str.upper():
                         submission_utc_str += '+00:00' # Assume UTC if missing
                     submission_utc = pd.to_datetime(submission_utc_str).tz_convert(pytz.utc)

                     if submission_utc >= game_start_utc:
                         time_diff = submission_utc - game_start_utc
                         time_taken_secs = time_diff.total_seconds()
                     else:
                         # Prediction submitted before market close of previous day? Set time to 0.
                         logger.warning(f"Pred {pred['prediction_id']} submitted BEFORE game start {game_start_utc}. time_taken=0.0")
                         time_taken_secs = 0.0
                 except Exception as time_calc_err:
                      logger.exception(f"Error calculating time_taken for pred {pred['prediction_id']} (Timestamp: {pred.get('submission_timestamp_utc')}): {time_calc_err}")

            updates_to_perform.append({
                "prediction_id": pred['prediction_id'],
                "is_correct": is_correct,
                "time_taken_secs": time_taken_secs
            })

        # Batch update predictions
        update_count = 0
        update_errors = 0
        for update_data in updates_to_perform:
            pred_id = update_data.pop("prediction_id")
            # Prepare payload, removing keys with None values
            update_payload = {k: v for k, v in update_data.items() if v is not None}

            if not update_payload:
                logger.debug(f"Skipping update for pred {pred_id}, payload empty after None filter.")
                continue

            try:
                update_pred_resp = supabase_admin.table("predictions") \
                    .update(update_payload) \
                    .eq("prediction_id", pred_id) \
                    .execute()
                # Check response data count for success indication
                if update_pred_resp.data and len(update_pred_resp.data) > 0:
                     update_count += 1
                else:
                    error_info = getattr(update_pred_resp, 'error', 'No data returned and no error info')
                    logger.error(f"Failed update pred {pred_id} payload {update_payload}: {error_info}")
                    update_errors += 1
            except Exception as upd_err:
                logger.exception(f"Error updating pred {pred_id} payload {update_payload}: {upd_err}")
                update_errors += 1

        logger.info(f"Updated {update_count} predictions for {pair_id}. Errors: {update_errors}.")

        # 6. Trigger leaderboard update
        if update_count > 0:
            logger.info(f"Triggering leaderboard update for exchange {exchange}...")
            try:
                await _update_all_time_leaderboard(exchange, game_date)
                logger.info(f"Leaderboard successfully updated for exchange {exchange}")
            except Exception as le:
                logger.exception(f"Error updating leaderboard for {exchange}: {le}")

        return {"message": f"Processed results for {pair_id}. Winner: {actual_winner or 'Not determined'}. Updated {update_count} predictions."}

    except HTTPException as http_err:
        # Re-raise HTTPExceptions to be handled by FastAPI
        raise http_err
    except Exception as e:
        # Catch-all for unexpected errors during processing
        logger.exception(f"Error processing results for {request.game_date_str}, {exchange}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process results: An unexpected error occurred.")


@router.post("/predictions/submit", response_model=PredictionResponse)
async def submit_prediction(prediction_req: PredictionRequest, user_info: tuple = Depends(get_current_user)):
    """
    Submits a user's prediction for the daily pair.
    Stores the prediction in Supabase 'predictions' table.
    Includes check for duplicate predictions.
    """
    payload, _ = user_info
    user_id = payload.get('sub')

    if not user_id:
        # This should technically be caught by the dependency, but check again
        logger.error("User ID missing from JWT payload after validation in submit_prediction.")
        raise HTTPException(status_code=401, detail="Authentication error: User ID not found.")

    logger.info(f"Received prediction for pair: {prediction_req.pair_id} from user: {user_id}")

    prediction_id = str(uuid.uuid4())
    submission_timestamp_utc = datetime.now(timezone.utc)

    prediction_data = {
        "prediction_id": prediction_id,
        "user_id": user_id,
        "pair_id": prediction_req.pair_id,
        "predicted_ticker": prediction_req.predicted_ticker,
        "submission_timestamp_utc": submission_timestamp_utc.isoformat(), # Use ISO format string
        "is_correct": None, # Default to None
        "time_taken_secs": None # Default to None
    }

    try:
        supabase_admin = get_supabase_admin_client() # Use admin client for insert
        logger.info(f"Attempting to insert prediction {prediction_id} into Supabase...") # Added log
        response = supabase_admin.table("predictions").insert(prediction_data).execute()

        logger.debug(f"Supabase insert response for pred {prediction_id}: {response}")

        # Improved error handling based on Supabase response structure
        if hasattr(response, 'error') and response.error:
             error_message = str(response.error.message) if hasattr(response.error, 'message') else str(response.error)
             logger.error(f"Supabase error inserting pred {prediction_id} for user {user_id}: {error_message}")
             # Check specifically for unique constraint violation on (user_id, pair_id)
             # Adjust constraint name based on your actual DB schema if different
             if "duplicate key value violates unique constraint" in error_message and ("predictions_user_id_pair_id_key" in error_message or "unique_user_pair" in error_message):
                 raise HTTPException(status_code=409, detail="You have already submitted a prediction for this pair today.")
             # Raise a generic 500 for other DB errors
             raise HTTPException(status_code=500, detail=f"Failed to store prediction due to a database error.")
        # Check if data was actually returned, indicating successful insert
        elif not response.data:
             logger.error(f"Supabase insert for pred {prediction_id} returned no data and no error. Assuming failure.")
             raise HTTPException(status_code=500, detail="Failed to confirm prediction storage.")

        # Improved error handling based on Supabase response structure
        if hasattr(response, 'error') and response.error:
             error_message = str(response.error.message) if hasattr(response.error, 'message') else str(response.error)
             # Log the specific Supabase error *before* raising HTTPException
             logger.error(f"Supabase insert failed for pred {prediction_id}. Supabase Error: {error_message}") # Added specific log
             # Check specifically for unique constraint violation on (user_id, pair_id)
             # Adjust constraint name based on your actual DB schema if different
             if "duplicate key value violates unique constraint" in error_message and ("predictions_user_id_pair_id_key" in error_message or "unique_user_pair" in error_message):
                 raise HTTPException(status_code=409, detail="You have already submitted a prediction for this pair today.")
             # Raise a generic 500 for other DB errors
             raise HTTPException(status_code=500, detail="Failed to store prediction due to a database error.")
        # Check if data was actually returned, indicating successful insert
        elif not response.data:
             # Log this specific condition before raising
             logger.error(f"Supabase insert for pred {prediction_id} returned no data and no error. Treating as failure.") # Added specific log
             raise HTTPException(status_code=500, detail="Failed to confirm prediction storage.")

        logger.info(f"Stored prediction {prediction_id} for user {user_id}.")

        return PredictionResponse(
            prediction_id=prediction_id,
            message="Prediction submitted successfully.",
            submitted_at=submission_timestamp_utc # Return the datetime object
        )

    except HTTPException as http_err:
         # Re-raise specific HTTPExceptions (like the 409 duplicate)
         raise http_err
    except Exception as e:
        # Catch any other unexpected errors (network, etc.)
        # Log the detailed exception *before* raising the generic 500
        logger.exception(f"Caught UNEXPECTED exception during submit_prediction for pred {prediction_id}, user {user_id}: {e}") # Enhanced log
        raise HTTPException(status_code=500, detail="An unexpected error occurred while submitting the prediction.")

# --- Endpoint for Next Game Clue ---

@router.get("/predictions/next-clue", response_model=NextClueResponse)
def get_next_game_clue():
    """
    Retrieves the next_day_clue from the most recent game record on or before today.
    Returns the clue if found, otherwise null.
    """
    try:
        current_supabase_client = get_supabase_anon_client()
    except Exception as e:
         logger.error(f"Supabase client not available for getting next clue: {e}")
         raise HTTPException(status_code=503, detail="Database connection not available.")

    today_str = date.today().isoformat()
    logger.info(f"Attempting to retrieve next_day_clue based on date: {today_str}")

    game_table_name = "asx_games" # Assuming ASX for now

    try:
        # First try to get today's game
        response = current_supabase_client.table(game_table_name) \
                         .select("next_day_clue") \
                         .eq("game_date", today_str) \
                         .limit(1) \
                         .execute()
        
        # If today's game not found, try to get the most recent game
        game_data_list = response.data
        if not game_data_list or len(game_data_list) == 0:
            logger.info(f"No game found for today ({today_str}), looking for the most recent game")
            response = current_supabase_client.table(game_table_name) \
                             .select("next_day_clue") \
                             .order("game_date", desc=True) \
                             .limit(1) \
                             .execute()

        logger.debug(f"Supabase response for next clue query from {game_table_name}: {response}")

        # Check for Supabase errors first
        if hasattr(response, 'error') and response.error:
            logger.error(f"Supabase error fetching next clue: {response.error}")
            # Attempt to get a more specific message if available
            error_message = getattr(response.error, 'message', str(response.error))
            raise HTTPException(status_code=500, detail=f"Database error fetching next clue: {error_message}")

        # Process data list returned by execute()
        game_data_list = response.data
        clue = None
        if game_data_list and isinstance(game_data_list, list) and len(game_data_list) > 0:
            # Get the first item from the list
            first_game = game_data_list[0]
            if isinstance(first_game, dict):
                clue = first_game.get("next_day_clue") # Get the clue, could be string or None
                logger.info(f"Found clue from game on {today_str}: {'Present' if clue else 'Not Present'}")
            else:
                logger.warning(f"Unexpected item format in next clue response list: {first_game}")
        elif isinstance(game_data_list, list) and len(game_data_list) == 0:
            logger.warning(f"No game data found in {game_table_name} for date {today_str} to retrieve clue.")
            # Only provide mock data if no real data exists anywhere in the table
            if not response.data or len(response.data) == 0:
                from app.env import Mode, mode
                if mode == Mode.DEV:
                    clue = "Next day will feature companies from the Healthcare Equipment sector"
                    logger.info(f"Using mock clue for testing in DEV mode: {clue}")
        else:
            logger.warning(f"Unexpected Supabase response format for next clue (expected list): {game_data_list}")

        return NextClueResponse(next_day_clue=clue)

    except HTTPException as http_err:
        # Re-raise specific HTTPExceptions
        raise http_err
    except Exception as e:
        # Catch other exceptions during processing
        logger.exception(f"Error processing Supabase response for next clue based on {today_str}: {e}")
        # Ensure we don't raise the generic 'Failed to retrieve' if it was a specific DB error caught above
        if isinstance(e, HTTPException):
             raise e # Should already be handled, but safeguard
        raise HTTPException(status_code=500, detail="Failed to retrieve next game clue due to an internal error.")


# --- (Optional) Endpoint for Past Results ---
# @router.get("/predictions/results/{game_date_str}", response_model=GameResultResponse)
# def get_past_result(game_date_str: str):
#     # ... Implementation needed ...
#     pass
