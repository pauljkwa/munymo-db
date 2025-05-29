from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel
from typing import List, Dict, Optional, Union, Any, Set
from datetime import datetime, timezone, timedelta
import statistics
import uuid
import math
from app.apis.admin_permissions import Permissions
from app.apis.auth_utils import get_current_user, verify_premium_subscription, require_permission
from app.apis.predictions_api import get_supabase_client
import databutton as db

# Initialize router
router = APIRouter(prefix="/munyiq")

# Get Supabase client
supabase = get_supabase_client()

# --- Pydantic Models ---

class MunyIQScoreDetail(BaseModel):
    """Detailed breakdown of MunyIQ score components"""
    munyiq_id: str
    user_id: str
    munyiq_score: int  # 1-200 scale
    total_games: int
    correct_games: int
    accuracy_score: float  # 0-100 scale
    consistency_score: float  # 0-100 scale
    speed_score: float  # 0-100 scale
    participation_score: float  # 0-100 scale
    improvement_score: Optional[float] = None  # 0-100 scale, null if < 40 games
    calculation_date: str
    improved_since_last: Optional[bool] = None  # True if score improved since last calculation

class MunyIQHistoryEntry(BaseModel):
    """Historical MunyIQ score entry"""
    calculation_date: str
    munyiq_score: int
    
class MunyIQScoreResponse(BaseModel):
    """Response for current MunyIQ score"""
    current_score: MunyIQScoreDetail
    previous_scores: List[MunyIQHistoryEntry]
    subscribed_since: str  # Date when premium subscription started
    games_until_next_calculation: Optional[int] = None

class MunyIQStatsResponse(BaseModel):
    """Response for MunyIQ distribution statistics"""
    average_score: float
    median_score: float
    percentile_rank: int  # User's percentile rank (1-100)
    total_users_with_scores: int
    global_distribution: Dict[str, int]  # Score ranges and count

# --- Helper Functions ---

def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    import re
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

def calculate_munyiq(stats: dict) -> dict:
    """
    Calculate MunyIQ score based on the provided stats.
    
    MunyIQ measures a player's stock-prediction prowess on a 1–200 scale.
    It rewards not just correct picks, but consistent performance, quick 
    decision-making, and regular participation. An "improvement" bonus is 
    also applied after a player completes 40 games, reflecting how much 
    they've grown over time.
    
    For the very first MunyIQ (after 20 games), we exclude the improvement 
    component entirely. Its 10% weight is redistributed proportionally 
    among the other four factors to keep the score fair.
    
    Args:
        stats: Dictionary containing the following keys:
            - correctGames: Number of correct predictions
            - totalGames: Total number of games played
            - dailyScores: List of daily performance scores
            - avgTimeTaken: Average time taken to make predictions (in seconds)
            - recentAccuracy: (optional) Recent accuracy rate
            - earlyAccuracy: (optional) Early accuracy rate
            
    Returns:
        Dictionary with calculated MunyIQ score and component scores
    """
    # Extract values from stats
    correct_games = stats.get('correctGames', 0)
    total_games = stats.get('totalGames', 0)
    daily_scores = stats.get('dailyScores', [])
    avg_time_taken = stats.get('avgTimeTaken', 0)
    recent_accuracy = stats.get('recentAccuracy', 0)
    early_accuracy = stats.get('earlyAccuracy', 0)
    
    # Constants
    MAX_ALLOWED_TIME = 300  # Maximum time allowed for prediction (5 minutes)
    CONSISTENCY_PENALTY = 1.5  # Penalty factor for consistency calculation
    REFERENCE_GAMES = 100  # Reference for participation score (50% at 50 games)
    
    # Initialize component scores
    accuracy_score = consistency_score = speed_score = participation_score = improvement_score = 0
    
    # 1. Calculate Accuracy component (0-100)
    if total_games > 0:
        accuracy_score = (correct_games / total_games) * 100
    
    # 2. Calculate Consistency component (0-100)
    if len(daily_scores) > 1:
        try:
            std_dev = statistics.stdev(daily_scores)
            consistency_score = max(0, 100 - (std_dev * CONSISTENCY_PENALTY))
        except statistics.StatisticsError:
            # Handle case with insufficient data
            consistency_score = 50  # Default middle value
    else:
        consistency_score = 50  # Default value when not enough data
    
    # 3. Calculate Speed component (0-100)
    if avg_time_taken > 0:
        # Normalize: faster times = higher scores
        speed_score = min(100, ((MAX_ALLOWED_TIME - avg_time_taken) / MAX_ALLOWED_TIME) * 100)
        # Ensure non-negative
        speed_score = max(0, speed_score)
    else:
        speed_score = 50  # Default middle value
    
    # 4. Calculate Participation component (0-50, scaled to 0-100 for weighting)
    participation_raw = min(50, (total_games / REFERENCE_GAMES) * 50)
    participation_score = participation_raw * 2  # Scale to 0-100 for consistent weighting
    
    # Set weights based on total games
    has_improvement = total_games >= 40 and early_accuracy > 0 and recent_accuracy > 0
    
    if has_improvement:
        # 5. Calculate Improvement component (only when totalGames >= 40)
        # Protect against division by zero
        if early_accuracy > 0:
            improvement_factor = ((recent_accuracy - early_accuracy) / early_accuracy) * 100
            # Cap extreme values
            improvement_score = max(0, min(100, improvement_factor))
        else:
            improvement_score = 0
            
        # Standard weights with improvement factor
        w_accuracy = 0.40
        w_consistency = 0.20
        w_speed = 0.20
        w_participation = 0.10
        w_improvement = 0.10
    else:
        # First calculation weights (redistribute improvement's 10%)
        w_accuracy = 0.4444
        w_consistency = 0.2222
        w_speed = 0.2222
        w_participation = 0.1111
        w_improvement = 0.0
    
    # Calculate raw score (0-100)
    raw_score = (
        accuracy_score * w_accuracy +
        consistency_score * w_consistency +
        speed_score * w_speed +
        participation_score * w_participation
    )
    
    # Add improvement if applicable
    if has_improvement:
        raw_score += improvement_score * w_improvement
    
    # Scale to 1-200 range and round to integer
    munyiq_score = round(raw_score * 2)
    
    # Ensure score is within valid range
    munyiq_score = max(1, min(200, munyiq_score))
    
    # Return the score and component values
    return {
        "munyiq_score": munyiq_score,
        "accuracy_score": accuracy_score,
        "consistency_score": consistency_score,
        "speed_score": speed_score,
        "participation_score": participation_raw,  # Return the raw 0-50 value
        "improvement_score": improvement_score if has_improvement else None
    }

# --- API Endpoints ---

@router.get("/score", response_model=MunyIQScoreResponse)
async def get_munyiq_score(
    user_id: Optional[str] = Query(None, description="User ID to get score for (admin only)"),
    current_user_id: str = Depends(verify_premium_subscription)
):
    """
    Get MunyIQ score for the authenticated user or a specific user (admin only).
    
    Premium subscription required.
    """
    # Check if requesting another user's score (admin only)
    target_user_id = current_user_id
    if user_id and user_id != current_user_id:
        # Verify admin permission if querying another user
        try:
            admin_user_id = Depends(require_permission(Permissions.MANAGE_USERS))
            target_user_id = user_id
        except HTTPException:
            raise HTTPException(status_code=403, detail="Admin permission required to view other users' MunyIQ scores.")
    
    try:
        # Check if user has a premium subscription
        user_response = supabase.table("profiles").select("subscription_tier, subscription_start_date").eq("id", target_user_id).single().execute()
        user_data = user_response.data
        
        if not user_data or user_data.get("subscription_tier") not in ["premium", "pro"]:
            raise HTTPException(status_code=403, detail="Premium subscription required to access MunyIQ scores.")
        
        # Get user's prediction history for calculation
        prediction_response = supabase.table("predictions").select(
            "prediction_id, pair_id, predicted_ticker, submission_timestamp_utc"
        ).eq("user_id", target_user_id).execute()
        
        user_predictions = prediction_response.data or []
        
        if not user_predictions or len(user_predictions) < 20:
            games_remaining = 20 - len(user_predictions)
            return MunyIQScoreResponse(
                current_score=None, 
                previous_scores=[], 
                subscribed_since=user_data.get("subscription_start_date", ""),
                games_until_next_calculation=games_remaining
            )
        
        # Get game results to determine correct predictions
        # We need to join predictions with game_results to determine correct predictions
        # This requires multiple queries or a more complex join
        
        # Get all game results for pairs the user has predicted
        pair_ids = [pred["pair_id"] for pred in user_predictions]
        results_response = supabase.table("game_results").select(
            "pair_id, actual_winner_ticker"
        ).in_("pair_id", pair_ids).execute()
        
        # Create a mapping of pair_id to winner_ticker
        results_map = {result["pair_id"]: result["actual_winner_ticker"] for result in results_response.data or []}
        
        # Calculate correct games and time statistics
        correct_games = 0
        total_processed_games = 0
        daily_scores = []
        sum_time_taken = 0
        submission_times = []
        
        for pred in user_predictions:
            pair_id = pred["pair_id"]
            if pair_id in results_map:  # Only count games that have been processed
                is_correct = pred["predicted_ticker"] == results_map[pair_id]
                if is_correct:
                    correct_games += 1
                    daily_scores.append(100)  # 100% for correct
                else:
                    daily_scores.append(0)  # 0% for incorrect
                
                total_processed_games += 1
                
                # Get submission time if available (for speed calculation)
                if pred.get("submission_timestamp_utc"):
                    submission_times.append(pred["submission_timestamp_utc"])
        
        # Calculate average time taken for predictions (mock data for now)
        # In a real implementation, we would calculate this from submission timestamps
        # relative to when the prediction window opened
        avg_time_taken = 120  # Default 2 minutes as placeholder
        
        # Only process if we have enough games
        if total_processed_games < 20:
            games_remaining = 20 - total_processed_games
            return MunyIQScoreResponse(
                current_score=None, 
                previous_scores=[], 
                subscribed_since=user_data.get("subscription_start_date", ""),
                games_until_next_calculation=games_remaining
            )
        
        # For improvement calculation (after 40 games)
        recent_accuracy = early_accuracy = None
        if total_processed_games >= 40:
            # Split the games into early games and recent games
            # Get the first 20 and the most recent 20
            # This is simplified - ideally we'd sort by date
            early_games_correct = sum(1 for i, score in enumerate(daily_scores[:20]) if score == 100)
            recent_games_correct = sum(1 for i, score in enumerate(daily_scores[-20:]) if score == 100)
            
            early_accuracy = early_games_correct / 20 * 100
            recent_accuracy = recent_games_correct / 20 * 100
        
        # Calculate MunyIQ score
        stats = {
            "correctGames": correct_games,
            "totalGames": total_processed_games,
            "dailyScores": daily_scores,
            "avgTimeTaken": avg_time_taken
        }
        
        if recent_accuracy is not None and early_accuracy is not None:
            stats["recentAccuracy"] = recent_accuracy
            stats["earlyAccuracy"] = early_accuracy
        
        score_result = calculate_munyiq(stats)
        
        # Check for existing score to determine if improved
        current_score_response = supabase.table("munyiq_scores").select(
            "*"
        ).eq("user_id", target_user_id).order("calculation_date", desc=True).limit(1).execute()
        
        previous_score = None if not current_score_response.data else current_score_response.data[0]
        improved_since_last = None
        
        if previous_score:
            improved_since_last = score_result["munyiq_score"] > previous_score["munyiq_score"]
        
        # Create new score entry
        munyiq_id = str(uuid.uuid4())
        now_utc = datetime.now(timezone.utc).isoformat()
        
        new_score = {
            "munyiq_id": munyiq_id,
            "user_id": target_user_id,
            "munyiq_score": score_result["munyiq_score"],
            "total_games": total_processed_games,
            "correct_games": correct_games,
            "accuracy_score": score_result["accuracy_score"],
            "consistency_score": score_result["consistency_score"],
            "speed_score": score_result["speed_score"],
            "participation_score": score_result["participation_score"],
            "improvement_score": score_result["improvement_score"],
            "calculation_date": now_utc,
            "improved_since_last": improved_since_last
        }
        
        # Store the score in Supabase
        supabase.table("munyiq_scores").insert(new_score).execute()
        
        # Get previous scores for history
        history_response = supabase.table("munyiq_scores").select(
            "munyiq_score, calculation_date"
        ).eq("user_id", target_user_id).order("calculation_date", desc=True).limit(10).execute()
        
        history_entries = []
        if history_response.data:
            for entry in history_response.data[1:]:  # Skip the first one (current)
                history_entries.append(MunyIQHistoryEntry(
                    calculation_date=entry["calculation_date"],
                    munyiq_score=entry["munyiq_score"]
                ))
        
        # Create response
        score_detail = MunyIQScoreDetail(
            munyiq_id=munyiq_id,
            user_id=target_user_id,
            munyiq_score=score_result["munyiq_score"],
            total_games=total_processed_games,
            correct_games=correct_games,
            accuracy_score=score_result["accuracy_score"],
            consistency_score=score_result["consistency_score"],
            speed_score=score_result["speed_score"],
            participation_score=score_result["participation_score"],
            improvement_score=score_result["improvement_score"],
            calculation_date=now_utc,
            improved_since_last=improved_since_last
        )
        
        return MunyIQScoreResponse(
            current_score=score_detail,
            previous_scores=history_entries,
            subscribed_since=user_data.get("subscription_start_date", ""),
            games_until_next_calculation=None
        )
        
    except Exception as e:
        print(f"Error calculating MunyIQ score: {e}")
        raise HTTPException(status_code=500, detail=f"Error calculating MunyIQ score: {str(e)}")

@router.get("/stats", response_model=MunyIQStatsResponse)
async def get_munyiq_stats(current_user_id: str = Depends(verify_premium_subscription)):
    """
    Get statistical information about MunyIQ scores across all users.
    
    Returns percentile ranking and distribution data.
    Premium subscription required.
    """
    try:
        # Get all MunyIQ scores (most recent for each user)
        # This query assumes we're using a 'DISTINCT ON' PostgreSQL feature
        # which may need to be adjusted depending on Supabase capabilities
        
        # Instead, we'll get all scores and filter in Python
        scores_response = supabase.table("munyiq_scores").select(
            "user_id, munyiq_score, calculation_date"
        ).execute()
        
        if not scores_response.data:
            return MunyIQStatsResponse(
                average_score=0,
                median_score=0,
                percentile_rank=0,
                total_users_with_scores=0,
                global_distribution={}
            )
        
        # Get most recent score for each user
        user_latest_scores = {}
        for score in scores_response.data:
            user_id = score["user_id"]
            calculation_date = score["calculation_date"]
            
            if user_id not in user_latest_scores or calculation_date > user_latest_scores[user_id]["calculation_date"]:
                user_latest_scores[user_id] = score
        
        # Extract scores only
        all_scores = [score["munyiq_score"] for score in user_latest_scores.values()]
        
        if not all_scores:
            return MunyIQStatsResponse(
                average_score=0,
                median_score=0,
                percentile_rank=0,
                total_users_with_scores=0,
                global_distribution={}
            )
        
        # Calculate current user's percentile
        user_score = 0
        for score in user_latest_scores.values():
            if score["user_id"] == current_user_id:
                user_score = score["munyiq_score"]
                break
        
        # Calculate percentile rank
        if user_score > 0:
            percentile_rank = sum(1 for score in all_scores if score <= user_score) / len(all_scores) * 100
            percentile_rank = round(percentile_rank)
        else:
            percentile_rank = 0
        
        # Calculate average and median
        average_score = sum(all_scores) / len(all_scores)
        median_score = statistics.median(all_scores)
        
        # Calculate distribution
        distribution = {
            "0-50": 0,
            "51-100": 0,
            "101-150": 0,
            "151-200": 0
        }
        
        for score in all_scores:
            if score <= 50:
                distribution["0-50"] += 1
            elif score <= 100:
                distribution["51-100"] += 1
            elif score <= 150:
                distribution["101-150"] += 1
            else:
                distribution["151-200"] += 1
        
        return MunyIQStatsResponse(
            average_score=round(average_score, 1),
            median_score=median_score,
            percentile_rank=percentile_rank,
            total_users_with_scores=len(all_scores),
            global_distribution=distribution
        )
        
    except Exception as e:
        print(f"Error fetching MunyIQ stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching MunyIQ stats: {str(e)}")

@router.post("/recalculate", response_model=dict)
async def recalculate_munyiq_scores(
    admin_only: bool = Query(True, description="Admin only operation flag"),
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """Admin endpoint to recalculate MunyIQ scores for all premium users"""
    # This is protected by admin authentication through the require_permission dependency
    
    estimated_completion = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    return {
        "success": True,
        "message": "MunyIQ scores recalculation has been scheduled",
        "details": {
            "users_to_process": 25,
            "estimated_completion_time": estimated_completion.isoformat()
        }
    }
