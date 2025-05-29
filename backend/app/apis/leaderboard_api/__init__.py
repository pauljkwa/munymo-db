import os
from fastapi import APIRouter, Depends, Query, Path, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import databutton as db
from supabase import create_client, Client, PostgrestAPIResponse
import math
from app.apis.auth_utils import get_current_user # Assuming auth_utils provides user info

# --- Supabase Client Initialization ---
# Reuse the client initialization pattern if it exists elsewhere, or define here
supabase_url = db.secrets.get("SUPABASE_URL")
supabase_key = db.secrets.get("SUPABASE_SERVICE_ROLE_KEY") # Use service role for backend operations

if not supabase_url or not supabase_key:
    raise ValueError("Supabase URL or Service Role Key secret is missing.")

supabase: Client = create_client(supabase_url, supabase_key)
# --- End Supabase Client Initialization ---


# --- Pydantic Models ---
# Updated models reflecting the new requirements

class LeaderboardEntry(BaseModel):
    rank: int
    player_id: str # Keep UUID as string
    username: str = Field(..., description="Display name of the user")
    accuracy_percent: float = Field(..., description="Overall prediction accuracy percentage")
    games_played: int = Field(..., description="Total number of games played")
    avg_speed_ms: Optional[float] = Field(None, description="Average submission speed for correct answers in milliseconds")
    avg_score: Optional[float] = Field(None, description="Average points scored per game based on calculate_game_score")
    # streak: int # Removed as per comment, use only for tie-breaking internally

class LeaderboardResponse(BaseModel):
    leaderboard: List[LeaderboardEntry]
    total_players: int = Field(..., description="Total number of eligible players on this leaderboard (played >= 1 game)")
    # user_rank: Optional[int] = Field(None, description="Rank of the requesting user, if available") # Can be added later if needed

# --- API Endpoint ---

router = APIRouter()

@router.get("/leaderboard/{exchange}", response_model=LeaderboardResponse, summary="Get Leaderboard", description="Retrieves the ranked leaderboard for a specific exchange based on accuracy, speed, and streak.")
def get_leaderboard(
    exchange: str = Path(..., description="The exchange identifier (e.g., 'asx', 'nyse') for the leaderboard"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return (max 50)"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    user_info: tuple = Depends(get_current_user) # Require authentication
):
    """
    Retrieves the leaderboard for a specific exchange_code, ranked by:
    1. Accuracy Percentage (Descending)
    2. Average Submission Speed for Correct Answers (Ascending, milliseconds)
    3. Current Winning Streak (Descending)

    Only includes players who have played at least one game.
    Requires authentication.
    """
    print(f"Fetching leaderboard for exchange: {exchange}, limit: {limit}, offset: {offset}")
    requesting_user_id, _ = user_info # Extract user ID from auth dependency

    try:
        # Define columns to select, including calculated fields alias if possible,
        # or base columns needed for calculation.
        # Note: Direct calculation within Supabase select might need complex syntax or DB functions.
        # Fetching base columns and calculating here is often more straightforward.
        # We need: user_id, exchange, total_games_played, total_correct,
        # total_submission_time_correct_ms, current_streak, total_points_raw (if needed for avg_score)
        # We also need the username. Assuming a 'profiles' table linked to auth.users via 'id'.

        # Step 1: Query base data (player_exchange_stats only)
        stats_query = (
            supabase.table("player_exchange_stats")
            .select(
                """
                player_id,
                exchange_code,
                games_played,
                total_correct,
                total_time_milliseconds,
                current_streak,
                total_score
                """
            )
            .eq("exchange_code", exchange)
            .gt("games_played", 0) # Only players who have played at least 1 game
        )

        # Execute the stats query
        stats_response: PostgrestAPIResponse = stats_query.execute()

        if stats_response.data is None:
             print(f"Error fetching data from player_exchange_stats for exchange {exchange}. Response: {stats_response}")
             raise HTTPException(status_code=500, detail=f"Failed to fetch player stats data for exchange {exchange}")

        if not stats_response.data:
             print(f"No player stats found for exchange {exchange}")
             # Return empty leaderboard if no stats found
             return LeaderboardResponse(leaderboard=[], total_players=0)

        print(f"Fetched {len(stats_response.data)} raw player stats entries for exchange {exchange}")

        # Step 2: Extract user IDs and fetch profiles
        player_ids = list(set(stat["player_id"] for stat in stats_response.data))
        profiles_data = {}
        if player_ids:
            profiles_query = (
                supabase.table("profiles")
                .select("id, username") # Assuming profile table has user_id PK/FK
                .in_("id", player_ids)
            )
            profiles_response: PostgrestAPIResponse = profiles_query.execute()

            if profiles_response.data is None:
                print(f"Warning: Failed to fetch profiles for users. Response: {profiles_response}")
                # Continue without usernames if profiles fetch fails
            elif profiles_response.data:
                 profiles_data = {profile["id"]: profile["username"] for profile in profiles_response.data}
                 print(f"Fetched {len(profiles_data)} profiles for {len(player_ids)} unique users")


        # Step 3: Calculate metrics and prepare for sorting
        processed_players = []
        for player_stat in stats_response.data:
            player_id_val = player_stat.get("player_id")
            username = profiles_data.get(player_id_val, "Unknown User") # Get username from map

            games_played_val = player_stat.get("games_played", 0)
            correct_predictions = player_stat.get("total_correct", 0)
            total_time_ms = player_stat.get("total_time_milliseconds", 0)
            streak = player_stat.get("current_streak", 0)
            total_raw_score = player_stat.get("total_score", 0)

            # Calculate accuracy
            accuracy = (correct_predictions / games_played_val) * 100 if games_played_val > 0 else 0.0

            # Calculate average speed for correct answers in milliseconds
            avg_speed = (total_time_ms / correct_predictions) if correct_predictions > 0 else None # Keep as None if no correct answers

             # Calculate average score (optional, based on raw score from calculate_game_score)
            avg_score_calculated = (total_raw_score / games_played_val) if games_played_val > 0 else 0.0

            processed_players.append({
                "player_id": player_id_val,
                "username": username,
                "accuracy_percent": accuracy,
                "games_played": games_played_val,
                "avg_speed_ms": avg_speed,
                "avg_score": avg_score_calculated,
                "current_streak": streak,
            })

        # Step 4: Sort the processed data in Python
        # Primary: accuracy_percent DESC
        # Secondary: avg_speed_ms ASC (treat None as infinitely slow, place them last in ascending sort)
        # Tertiary: current_streak DESC
        def sort_key(player):
            # For avg_speed_ms, use infinity if None or 0, ensuring they rank lower in ascending sort
            speed = player["avg_speed_ms"]
            sortable_speed = speed if speed is not None and speed > 0 else float('inf')
            # Return tuple for multi-level sorting
            return (-player["accuracy_percent"], sortable_speed, -player["current_streak"])

        processed_players.sort(key=sort_key)

        # Step 5: Apply pagination and assign ranks
        total_players_count = len(processed_players)
        paginated_players = processed_players[offset : offset + limit]

        leaderboard_entries = []
        for i, player in enumerate(paginated_players):
            rank = offset + i + 1
            leaderboard_entries.append(
                LeaderboardEntry(
                    rank=rank,
                    player_id=player["player_id"],
                    username=player["username"],
                    accuracy_percent=round(player["accuracy_percent"], 2), # Round for display
                    games_played=player["games_played"],
                    # Round speed for display, handle None
                    avg_speed_ms=round(player["avg_speed_ms"]) if player["avg_speed_ms"] is not None else None,
                    # Round avg score for display
                    avg_score=round(player["avg_score"], 2) if player["avg_score"] is not None else None,
                )
            )

        print(f"Returning {len(leaderboard_entries)} leaderboard entries for exchange {exchange}. Total eligible players: {total_players_count}")

        return LeaderboardResponse(
            leaderboard=leaderboard_entries,
            total_players=total_players_count
        )

    except Exception as e:
        print(f"Error in get_leaderboard for exchange {exchange}: {e}")
        # Check if it's a Supabase/PostgREST error specifically
        if hasattr(e, 'message'):
             error_detail = e.message
        else:
             error_detail = str(e)
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching the leaderboard: {error_detail}")
