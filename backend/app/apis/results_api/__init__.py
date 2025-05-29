"""
API endpoints for processing and retrieving game results.
"""

from fastapi import APIRouter, HTTPException, Path, Depends
from pydantic import BaseModel
import databutton as db
import yfinance as yf
import pandas as pd
from datetime import datetime, timezone, date, timedelta
import re
from typing import List, Dict, Any

from app.apis.predictions_api import get_supabase_client, logger # Import Supabase client and logger
from app.apis.fcm import send_fcm_notification # Import FCM notification function
from app.apis.auth_utils import get_current_user, require_permission # Import auth utils
from app.apis.admin_permissions import Permissions # Import permissions
from postgrest.exceptions import APIError # Import Supabase APIError
from decimal import Decimal # Import Decimal for type checking

router = APIRouter(prefix="/results", tags=["Results"])

# --- Helper Functions ---

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

# --- Pydantic Models ---

class ProcessResultsResponse(BaseModel):
    """Response model for the results processing endpoint."""
    success: bool
    message: str
    pair_id: str
    
# New model for retrieving results
class PerformanceDetail(BaseModel):
    open: float | None = None
    close: float | None = None
    change_percent: float
    candle_count: int | None = None
    error: str | None = None
    # raw_response: Dict[str, Any] | None = None # Exclude raw response for brevity

class UserScoreDetail(BaseModel):
    user_id: str
    predicted_ticker: str | None = None
    is_correct: bool
    submission_timestamp_utc: str | None = None
    prediction_id: str | None = None

class GameResultResponse(BaseModel):
    """Response model for retrieving processed game results."""
    pair_id: str
    date: str # YYYY-MM-DD format
    company_a_ticker: str
    company_b_ticker: str
    actual_winner_ticker: str # Ticker symbol or 'ERROR' or 'TIE'
    actual_loser_ticker: str # Ticker symbol or 'ERROR' or 'TIE'
    # Simplified performance data for yfinance
    company_a_change_percent: float | None = None
    company_b_change_percent: float | None = None
    calculation_details: str | None = None # Reason for winner/error/tie
    processed_at_utc: str # ISO 8601 format
    user_scores: List[UserScoreDetail]


# --- API Endpoints ---

# Endpoint placeholder - more logic to be added
@router.post("/process/{pair_id}", response_model=ProcessResultsResponse)
def finalize_game_results(
    pair_id: str = Path(..., description="The ID of the prediction pair to process results for"),
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """
    Processes the results for a given prediction pair.
    1. Fetches pair details (tickers, date) from storage.
    2. Fetches user predictions for the pair from storage.
    3. Fetches actual stock performance data from Finnhub for the relevant date.
    4. Determines the winning stock based on performance.
    5. Compares user predictions against the actual winner.
    6. Stores the results (winner, performance, user scores).
    7. (Later) Triggers notifications.
    """

    # --- Get Supabase Client ---
    try:
        supabase = get_supabase_client()
    except ConnectionError as e:
        logger.error(f"Supabase client not available for processing results: {e}")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    # --- Step 1: Fetch Game Details from Supabase 'asx_games' ---
    logger.info(f"Fetching game details for pair_id: {pair_id} from Supabase 'asx_games' table.")
    try:
        game_response = supabase.table("asx_games").select("pair_id, game_date, company_a_ticker, company_b_ticker").eq("pair_id", pair_id).maybe_single().execute()
        if not game_response.data:
             logger.error(f"Game details not found in Supabase 'asx_games' for pair_id: {pair_id}")
             raise HTTPException(status_code=404, detail=f"Details for prediction pair '{pair_id}' not found in asx_games.")
        pair_details = game_response.data
        logger.info(f"Fetched game details from Supabase: {pair_details}")
        # Extract details needed later
        ticker_a = pair_details['company_a_ticker']
        ticker_b = pair_details['company_b_ticker']
        try:
            game_date = date.fromisoformat(pair_details['game_date']) # Already a string YYYY-MM-DD
        except ValueError as e:
            logger.error(f"Invalid date format '{pair_details['game_date']}' received from Supabase for pair {pair_id}: {e}")
            raise HTTPException(status_code=500, detail="Invalid game date format retrieved from database.") from e

    except APIError as e:
        logger.exception(f"Supabase API error fetching game details for {pair_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Database error retrieving game details: {e.message}") from e
    except Exception as e:
        logger.exception(f"Unexpected error fetching game details for {pair_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve game details.") from e

    # --- Step 2: Fetch User Predictions from Supabase 'predictions' ---
    logger.info(f"Fetching predictions for pair_id: {pair_id} from Supabase 'predictions' table.")
    try:
        predictions_response = supabase.table("predictions").select("prediction_id, user_id, predicted_ticker, submission_timestamp_utc").eq("pair_id", pair_id).execute()
        user_predictions = predictions_response.data # This is a list of dicts
        logger.info(f"Fetched {len(user_predictions)} predictions from Supabase for pair {pair_id}")

        if not user_predictions:
            logger.warning(f"No predictions found in Supabase for pair {pair_id}. Nothing to process.")
            # Store a result indicating no predictions?
            # Or just return? Let's return for now, as no scores can be calculated.
            # TODO: Consider if a game_result record should still be created even with no predictions.
            return ProcessResultsResponse(
                success=True, # Success in the sense that processing wasn't needed
                message=f"No user predictions found for pair '{pair_id}'. No results processed.",
                pair_id=pair_id
            )
    except APIError as e:
        logger.exception(f"Supabase API error fetching predictions for {pair_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Database error retrieving predictions: {e.message}") from e
    except Exception as e:
        logger.exception(f"Unexpected error fetching predictions for {pair_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user predictions.") from e



    logger.info("[INFO] Fetching stock data using yfinance")
    # Tickers and game_date already extracted from Supabase data above


    close_a_prev, close_a_game, close_b_prev, close_b_game = None, None, None, None
    change_a, change_b = None, None
    calculation_details = None # To store calculation reason or error message

    try:
        # Define date range (fetch a few days before to ensure we get the previous trading day)
        start_date_dt = game_date - timedelta(days=7) # Fetch 1 week window
        end_date_dt = game_date + timedelta(days=1) # yf end date is exclusive
        start_date_str = start_date_dt.isoformat()
        end_date_str = end_date_dt.isoformat()

        print(f"[INFO] Fetching yfinance data for {ticker_a}, {ticker_b} from {start_date_str} to {end_date_str}")
        data = yf.download(tickers=[ticker_a, ticker_b], start=start_date_str, end=end_date_str, progress=False)

        if data.empty:
            print(f"[WARN] yfinance returned empty DataFrame for tickers {ticker_a}, {ticker_b} and date range {start_date_str} to {end_date_str}.")
            raise ValueError("No market data found for the specified tickers and date range.")

        close_col_a = ('Close', ticker_a)
        close_col_b = ('Close', ticker_b)

        if close_col_a not in data.columns or close_col_b not in data.columns:
             print(f"[WARN] Missing 'Close' data for one or both tickers ({ticker_a}, {ticker_b}) in yfinance response.")
             raise ValueError("Incomplete market data received.")

        game_date_ts_naive = pd.Timestamp(game_date).tz_localize(None)
        game_day_data_index = data.index[data.index <= game_date_ts_naive]
        if game_day_data_index.empty:
            print(f"[WARN] No trading data found on or before the game date {game_date} in the fetched range.")
            raise ValueError("Market data for game date or prior not available.")

        actual_game_date_ts = game_day_data_index[-1]
        game_day_data = data.loc[actual_game_date_ts]

        previous_trading_days_index = data.index[data.index < actual_game_date_ts]
        if previous_trading_days_index.empty:
             print(f"[WARN] No trading data found strictly before {actual_game_date_ts} in the fetched range.")
             raise ValueError("Previous trading day market data not available.")

        prev_trading_date_ts = previous_trading_days_index[-1]
        prev_day_data = data.loc[prev_trading_date_ts]

        close_a_prev = prev_day_data[close_col_a]
        close_a_game = game_day_data[close_col_a]
        close_b_prev = prev_day_data[close_col_b]
        close_b_game = game_day_data[close_col_b]

        print(f"[DEBUG] {ticker_a}: Prev Date={prev_trading_date_ts.date()}, Prev Close={close_a_prev}, Game Date Used={actual_game_date_ts.date()}, Game Close={close_a_game}")
        print(f"[DEBUG] {ticker_b}: Prev Date={prev_trading_date_ts.date()}, Prev Close={close_b_prev}, Game Date Used={actual_game_date_ts.date()}, Game Close={close_b_game}")

        if pd.isna(close_a_prev) or pd.isna(close_a_game) or pd.isna(close_b_prev) or pd.isna(close_b_game):
            print("[WARN] NaN value encountered in closing prices after lookup.")
            raise ValueError("Could not retrieve complete market data for comparison (NaN value encountered).")

        if actual_game_date_ts.date() != game_date:
            print(f"[WARN] Original game date {game_date} was not a trading day. Used data from {actual_game_date_ts.date()}.")

        # --- Step 4: Determine Winner --- (This logic is now integrated within the yfinance block)
        print("[INFO] Determining winner based on yfinance performance")
        if close_a_prev == 0 or close_b_prev == 0:
            print(f"[WARN] Zero baseline price detected for {pair_id}. Cannot calculate percentage change.")
            raise ValueError("Cannot calculate performance change due to zero baseline price.")
        else:
            change_a = (close_a_game - close_a_prev) / close_a_prev
            change_b = (close_b_game - close_b_prev) / close_b_prev
            logger.info(f"[DEBUG] Change A: {change_a*100:.2f}%, Change B: {change_b*100:.2f}%")

            if change_a > change_b:
                actual_winner_ticker = ticker_a
                actual_loser_ticker = ticker_b
                calculation_details = f"{ticker_a} performed better ({change_a*100:.2f}% vs {change_b*100:.2f}%)."
                logger.info(f"[INFO] Winner: {actual_winner_ticker} ({calculation_details})")
            elif change_b > change_a:
                 actual_winner_ticker = ticker_b
                 actual_loser_ticker = ticker_a
                 calculation_details = f"{ticker_b} performed better ({change_b*100:.2f}% vs {change_a*100:.2f}%)."
                 logger.info(f"[INFO] Winner: {actual_winner_ticker} ({calculation_details})")
            else: # Tie condition
                 actual_winner_ticker = "TIE"
                 actual_loser_ticker = "TIE"
                 calculation_details = f"Both companies had the same performance change ({change_a*100:.2f}%)."
                 logger.info(f"[INFO] Tie: {calculation_details}")


    except ValueError as ve:
        logger.error(f"[ERROR] Value error during yfinance processing for {pair_id}: {ve}")
        calculation_details = f"Market data lookup/calculation failed: {ve}"
        # Set defaults for storing results later
        actual_winner_ticker = "ERROR"
        actual_loser_ticker = "ERROR"
    except Exception as e:
        logger.exception(f"[ERROR] Unexpected error during yfinance data fetching/processing for {pair_id}: {e}")
        # Raise HTTPException for unexpected server-side issues that prevent processing
        raise HTTPException(status_code=503, detail=f"Error retrieving or processing market data: {e}") from e


    # --- Step 5 & 6: Store Results in Supabase & Prepare User Scores ---
    logger.info(f"Storing results in Supabase for pair_id: {pair_id}")

    # 5a. Store overall game result
    game_result_data = {
        "pair_id": pair_id,
        "game_date": game_date.isoformat(),
        "company_a_ticker": ticker_a,
        "company_b_ticker": ticker_b,
        "actual_winner_ticker": actual_winner_ticker,
        "actual_loser_ticker": actual_loser_ticker,
        "company_a_change_percent": float(change_a) if change_a is not None else None,
        "company_b_change_percent": float(change_b) if change_b is not None else None,
        "calculation_details": calculation_details,
        # processed_at_utc is handled by default in Supabase
    }

    try:
        game_results_insert_response = supabase.table("game_results").insert(game_result_data).execute()
        if not game_results_insert_response.data:
            logger.error(f"Failed to insert game_results for {pair_id}. Response: {game_results_insert_response}")
            raise HTTPException(status_code=500, detail="Failed to store game results in database.")
        
        inserted_game_result = game_results_insert_response.data[0]
        result_id = inserted_game_result["result_id"]
        logger.info(f"Stored game_results successfully for {pair_id}. Result ID: {result_id}")

    except APIError as e:
        # Handle potential unique constraint violation if processing is re-run
        if e.code == '23505': # Unique violation
            logger.warning(f"Game results for pair_id {pair_id} already exist. Fetching existing result_id. Error: {e.message}")
            # Fetch the existing result_id to continue scoring users
            try:
                existing_result_response = supabase.table("game_results").select("result_id").eq("pair_id", pair_id).single().execute()
                result_id = existing_result_response.data["result_id"]
                logger.info(f"Fetched existing result_id: {result_id} for pair_id {pair_id}")
            except Exception as fetch_e:
                 logger.exception(f"Failed to fetch existing result_id for {pair_id} after unique violation: {fetch_e}")
                 raise HTTPException(status_code=500, detail="Failed to retrieve existing game result after conflict.") from fetch_e
        else:
            logger.exception(f"Supabase API error inserting game_results for {pair_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Database error storing game results: {e.message}") from e
    except Exception as e:
        logger.exception(f"Unexpected error storing game_results for {pair_id}: {e}")
        raise HTTPException(status_code=500, detail="Unexpected error storing game results.") from e

    # 5b. Calculate and store user scores
    user_scores_to_insert = []
    user_score_details_for_response = [] # For the final response model
    
    for pred in user_predictions:
        user_id = pred["user_id"] 
        prediction_id = pred["prediction_id"]
        predicted_ticker = pred.get("predicted_ticker") # Use .get() for safety
        is_correct = (predicted_ticker == actual_winner_ticker)
        
        score_data = {
            "result_id": result_id,
            "prediction_id": prediction_id,
            "user_id": user_id,
            "pair_id": pair_id, # Denormalized
            "is_correct": is_correct,
            # calculated_at_utc is handled by default
        }
        user_scores_to_insert.append(score_data)
        
        # Prepare data for the GameResultResponse model used by get_results_for_pair
        user_score_details_for_response.append(UserScoreDetail(
            user_id=user_id,
            predicted_ticker=predicted_ticker,
            is_correct=is_correct,
            submission_timestamp_utc=pred.get("submission_timestamp_utc"),
            prediction_id=prediction_id
        ))
        logger.debug(f"User {user_id} prediction {prediction_id} for {pair_id}. Predicted: {predicted_ticker}. Correct: {is_correct}")

    if user_scores_to_insert:
        logger.info(f"Attempting to insert {len(user_scores_to_insert)} user scores for result_id {result_id}.")
        try:
            # Use upsert with ignore_duplicates=True based on prediction_id unique constraint
            # This handles re-running the processing without failing if scores already exist
            user_scores_insert_response = supabase.table("user_scores").upsert(user_scores_to_insert, on_conflict="prediction_id", ignore_duplicates=True).execute()
            # Check for errors in response (upsert might not raise APIError 23505 like insert)
            # Note: Difficult to get precise count of inserted vs ignored rows easily from response
            logger.info(f"Completed upsert for user_scores for result_id {result_id}. Response status: {user_scores_insert_response.status_code}")
            # Add more robust checking if needed based on response structure

        except APIError as e:
            logger.exception(f"Supabase API error upserting user_scores for result {result_id}: {e}")
            # Don't necessarily fail the whole process, but log it
            # Allow process to return success, but log the scoring error
        except Exception as e:
            logger.exception(f"Unexpected error upserting user_scores for result {result_id}: {e}")
            # Log error but maybe don't fail?

    # Remove old storage logic
    # results_storage_key = sanitize_storage_key(f"results__{pair_id}")
    # try:
    #     db.storage.json.put(results_storage_key, final_results)
    #     print(f"[INFO] Results successfully processed and stored for {pair_id} at key: {results_storage_key}")
    # except Exception as e:
    #      print(f"[ERROR] Failed to store results for {pair_id}: {e}")
    #      # If storage fails, the processing wasn't fully successful.
    #      raise HTTPException(status_code=500, detail="Failed to store processing results.") from e




    # --- Step 7: Send Notifications ---
    print("[INFO] Sending notifications to users")
    # Placeholder emails are fine for now, but user_id needs mapping to email eventually
    placeholder_recipient_email = "test@example.com" # Replace this!
    
    # Use the user_score_details_for_response which matches the structure needed
    for score_entry in user_score_details_for_response:
        user_id = score_entry.user_id # Access via attribute now
        predicted_ticker = score_entry.predicted_ticker
        is_correct = score_entry.is_correct
        
        # Construct notification content
        subject = f"Munymo Result for {game_date.isoformat()}: {ticker_a} vs {ticker_b}"
        result_text = "correctly" if is_correct else "incorrectly"
        outcome_message = f"The winner was {actual_winner_ticker}."
        if predicted_ticker:
             your_prediction_message = f"You predicted {predicted_ticker} and were {result_text}."
        else:
             your_prediction_message = "You did not make a prediction for this pair."

        notification_body = f"{outcome_message} {your_prediction_message}"
        
        content_text = f"Hello {user_id},\n\nHere are the results for today's Munymo prediction ({ticker_a} vs {ticker_b}):\n\n{outcome_message}\n{your_prediction_message}\n\nThanks for playing!\n- The Munymo Team"
        
        content_html = f"""\
        <p>Hello {user_id},</p>
        <p>Here are the results for today's Munymo prediction (<strong>{ticker_a}</strong> vs <strong>{ticker_b}</strong>):</p>
        <p>The winner was <strong>{actual_winner_ticker}</strong>.</p>
        <p>{your_prediction_message}</p>
        <p>Thanks for playing!<br/>- The Munymo Team</p>
        """

        # Send email (using placeholder address for now)
        try:
            if placeholder_recipient_email: # Only send if we have an address
                logger.info(f"Sending notification email to {placeholder_recipient_email} for user {user_id}")
                db.notify.email(
                    to=placeholder_recipient_email, 
                    subject=subject, 
                    content_text=content_text, 
                    content_html=content_html
                )
            else:
                logger.warning(f"No recipient email configured, skipping email notification for user {user_id}")
        except Exception as e:
            # Log error but don't fail the whole process if email fails
            logger.error(f"Failed to send notification email to {placeholder_recipient_email} for user {user_id}: {e}")
            
        # Send FCM push notification
        try:
            logger.info(f"Sending FCM notification to user {user_id}")
            notification_title = "Munymo Daily Result"
            notification_data = {
                "click_action": "/Results",
                "pair_id": pair_id,
                "correct": str(is_correct).lower() # Convert bool to string "true"/"false"
            }
            
            # Call the FCM notification function
            send_fcm_notification(
                user_id=user_id,
                title=notification_title,
                body=notification_body,
                data=notification_data
            )
        except Exception as e:
            # Log error but don't fail the whole process if FCM notification fails
            logger.error(f"Failed to send FCM notification to user {user_id}: {e}")
            # Continue processing other users
    return ProcessResultsResponse(
        success=True,
        message=f"Successfully processed results for pair '{pair_id}'. Winner: {actual_winner_ticker}", 
        pair_id=pair_id
    )

# TODO: Add endpoint to retrieve processed results for a pair or user
# e.g., @router.get("/results/{pair_id}")
# e.g., @router.get("/user/{user_id}/history")


def get_results_for_pair(
    pair_id: str = Path(..., description="The ID of the prediction pair to retrieve results for")
):
    """Retrieves the processed results for a given prediction pair ID from Supabase."""
    logger.info(f"Received request to retrieve results for pair_id: {pair_id}")
    
    # --- Get Supabase Client ---
    try:
        supabase = get_supabase_client()
    except ConnectionError as e:
        logger.error(f"Supabase client not available for retrieving results: {e}")
        raise HTTPException(status_code=503, detail="Database connection not available.")

    # --- Fetch Game Result from 'game_results' table ---
    try:
        game_result_response = supabase.table("game_results").select("*, user_scores(*)").eq("pair_id", pair_id).maybe_single().execute()
        
        if not game_result_response.data:
            logger.warning(f"Results not found in Supabase 'game_results' for pair_id: {pair_id}")
            raise HTTPException(status_code=404, detail=f"Processed results for prediction pair '{pair_id}' not found. Has it been processed yet?")
        
        game_result_data = game_result_response.data
        logger.info(f"Successfully retrieved game result for {pair_id} from Supabase.")

        # --- Format User Scores ---
        # The related user_scores are fetched directly due to the select("*, user_scores(*)") query
        user_scores_raw = game_result_data.get("user_scores", [])
        user_scores_formatted = []
        for score_raw in user_scores_raw:
            # Fetch submission timestamp from prediction table if needed and available
            # This currently requires an additional query or joining in the original query if possible
            # For now, we rely on what's in user_scores or potentially add submission_timestamp later
            # Let's assume prediction details might be needed later, but focus on score structure now
            # We need to fetch the submission_timestamp_utc from the predictions table
            # Since it's not directly on user_scores, let's fetch it based on prediction_id if available
            submission_ts = None
            if score_raw.get("prediction_id"):
                try:
                    pred_resp = supabase.table("predictions").select("submission_timestamp_utc").eq("prediction_id", score_raw["prediction_id"]).maybe_single().execute()
                    if pred_resp.data:
                        submission_ts = pred_resp.data.get("submission_timestamp_utc")
                except APIError as pred_e:
                    logger.error(f"Failed to fetch prediction timestamp for pred_id {score_raw['prediction_id']}: {pred_e}")
                except Exception as pred_e:
                    logger.exception(f"Unexpected error fetching prediction timestamp for pred_id {score_raw['prediction_id']}: {pred_e}")

            user_scores_formatted.append(UserScoreDetail(
                user_id=score_raw.get("user_id", "unknown_user"),
                predicted_ticker=score_raw.get("predicted_ticker"), # Ensure this column exists in user_scores or fetch from prediction
                is_correct=score_raw.get("is_correct", False),
                submission_timestamp_utc=submission_ts, # Fetch from related prediction table
                prediction_id=score_raw.get("prediction_id")
            ))

        # --- Construct Final Response --- 
        # Map Supabase columns to GameResultResponse fields
        return GameResultResponse(
            pair_id=game_result_data["pair_id"],
            date=game_result_data["game_date"], # Assuming game_date is stored as YYYY-MM-DD string
            company_a_ticker=game_result_data["company_a_ticker"],
            company_b_ticker=game_result_data["company_b_ticker"],
            actual_winner_ticker=game_result_data["actual_winner_ticker"],
            actual_loser_ticker=game_result_data["actual_loser_ticker"],
            company_a_change_percent=game_result_data.get("company_a_change_percent"),
            company_b_change_percent=game_result_data.get("company_b_change_percent"),
            calculation_details=game_result_data.get("calculation_details"),
            processed_at_utc=game_result_data.get("processed_at_utc"), # Assuming this is auto-generated timestamp string
            user_scores=user_scores_formatted
        )

    except APIError as e:
        logger.exception(f"Supabase API error retrieving results for {pair_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Database error retrieving results: {e.message}")
    except Exception as e:
        logger.exception(f"Unexpected error retrieving results for {pair_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve results due to an internal server error.") from e


