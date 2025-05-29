from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from pydantic import BaseModel, Field
import databutton as db
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
import pytz
import re
from typing import List, Dict, Any, Optional, Tuple
import random
import json
import traceback
from openai import OpenAI
from app.apis.auth_utils import get_current_user, require_permission
from app.apis.admin_permissions import Permissions
from app.apis.company_discovery import (
    discover_companies,
    generate_company_pair,
    get_next_trading_day,
    Company
)

router = APIRouter()

# Storage keys
GAME_PAIR_KEY = "game_pair_storage"

# Configure OpenAI client
def get_openai_client():
    """Get an initialized OpenAI client"""
    api_key = db.secrets.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set in secrets")
    return OpenAI(api_key=api_key)

# Models
class AIGameInsight(BaseModel):
    """AI-generated insights about a company pair"""
    reasoning: str = Field(..., description="AI-generated reasoning paragraph explaining the matchup")
    next_day_clue: str = Field(..., description="AI-generated clue for the next day's game")

class GameGenerationRequest(BaseModel):
    """Request model for generating a new game"""
    exchange: str = Field(..., description="Stock exchange code (e.g., ASX, NYSE)")
    target_date: str = Field(..., description="Target date for the game (YYYY-MM-DD)")
    sector: Optional[str] = Field(None, description="Target sector (optional)")
    force_refresh: bool = Field(False, description="Force refresh of company data")

class GameGenerationResponse(BaseModel):
    """Response model for game generation"""
    exchange: str
    game_date: str
    company_a_ticker: str
    company_a_name: str
    company_b_ticker: str
    company_b_name: str
    sector: str
    reasoning: str
    next_day_clue: Optional[str] = None
    status: str = "scheduled"
    is_saved: bool = False

# Helper functions
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

def fetch_financial_data(ticker: str, period: str = "1mo") -> pd.DataFrame:
    """Fetch financial data for a ticker using yfinance"""
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)
        return hist
    except Exception as e:
        print(f"[ERROR] Failed to fetch financial data for {ticker}: {str(e)}")
        return pd.DataFrame()

def format_financial_summary(ticker: str, company_name: str, data: pd.DataFrame) -> str:
    """Format financial data into a summary string for AI reasoning"""
    if data.empty:
        return f"No recent financial data available for {company_name} ({ticker})."
    
    # Calculate key metrics
    current_price = data['Close'].iloc[-1] if not data.empty else 0
    price_change = data['Close'].pct_change().iloc[-1] * 100 if len(data) > 1 else 0
    avg_volume = data['Volume'].mean() if 'Volume' in data else 0
    volatility = data['Close'].pct_change().std() * 100 if len(data) > 5 else 0
    
    # Calculate more advanced metrics when data is available
    if len(data) >= 5:
        # Moving averages
        ma_5 = data['Close'].rolling(window=5).mean().iloc[-1] if len(data) >= 5 else None
        # RSI (simplified)
        delta = data['Close'].diff()
        gain = delta.where(delta > 0, 0).rolling(window=5).mean()
        loss = -delta.where(delta < 0, 0).rolling(window=5).mean()
        rs = gain / loss if loss.iloc[-1] > 0 else 0
        rsi = 100 - (100 / (1 + rs.iloc[-1])) if not pd.isna(rs.iloc[-1]) else 50
    else:
        ma_5 = None
        rsi = None
    
    # Format the summary
    summary = f"{company_name} ({ticker}) Financial Summary:\n"
    summary += f"- Current Price: ${current_price:.2f}\n"
    summary += f"- Recent Price Change: {price_change:.2f}%\n"
    summary += f"- Average Trading Volume: {avg_volume:.0f} shares\n"
    summary += f"- Price Volatility: {volatility:.2f}%\n"
    
    # Add advanced metrics if available
    if ma_5 is not None:
        summary += f"- 5-Day Moving Average: ${ma_5:.2f}\n"
    if rsi is not None:
        summary += f"- RSI (5-Day): {rsi:.1f}\n"
    
    return summary

def generate_ai_insight(company_a: Company, company_b: Company, sector: str, financial_data: Dict[str, pd.DataFrame]) -> AIGameInsight:
    """Generate AI insight for a company pair using OpenAI"""
    try:
        print(f"[INFO] Generating AI insight for {company_a.name} vs {company_b.name} in {sector} sector")
        client = get_openai_client()
        
        # Format financial summaries
        fin_summary_a = format_financial_summary(
            company_a.ticker, 
            company_a.name, 
            financial_data.get(company_a.ticker, pd.DataFrame())
        )
        
        fin_summary_b = format_financial_summary(
            company_b.ticker, 
            company_b.name, 
            financial_data.get(company_b.ticker, pd.DataFrame())
        )
        
        # Create prompt for the reasoning
        reasoning_prompt = f"""You are a financial analyst for a stock prediction game. 
        Create an insightful paragraph explaining why comparing {company_a.name} and {company_b.name} in the {sector} sector 
        makes for an interesting market matchup. Focus on their business models, recent performance, market positions, 
        and potential catalysts that might affect their performance on the next trading day.
        
        Company A: {company_a.name} ({company_a.ticker})
        Industry: {company_a.industry if company_a.industry else 'Unknown'}
        
        Company B: {company_b.name} ({company_b.ticker})
        Industry: {company_b.industry if company_b.industry else 'Unknown'}
        
        Financial Data Summary for Company A:
        {fin_summary_a}
        
        Financial Data Summary for Company B:
        {fin_summary_b}
        
        Write a concise, balanced analysis (150-200 words) that helps players understand the key factors 
        for both companies without giving away which one might perform better."""
        
        # Create prompt for the next day clue
        clue_prompt = f"""You are creating a subtle clue about tomorrow's stock matchup game.
        
        Tomorrow will feature a matchup between two companies in the {sector} sector.
        
        Create a one-sentence clue that hints at the sector without being too obvious. 
        Make it creative, slightly cryptic but still related to the {sector} industry.
        
        The clue should be 10-15 words maximum and should NOT mention the sector name directly."""
        
        print(f"[INFO] Sending reasoning prompt to OpenAI")
        # Generate reasoning
        reasoning_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a financial analyst providing insights for a stock prediction game."}, 
                {"role": "user", "content": reasoning_prompt}
            ]
        )
        
        print(f"[INFO] Sending clue prompt to OpenAI")
        # Generate clue
        clue_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are creating subtle clues for a financial game."}, 
                {"role": "user", "content": clue_prompt}
            ]
        )
        
        reasoning = reasoning_response.choices[0].message.content.strip()
        next_day_clue = clue_response.choices[0].message.content.strip()
        print(f"[INFO] Generated AI content successfully")
        
        return AIGameInsight(
            reasoning=reasoning,
            next_day_clue=next_day_clue
        )
    except Exception as e:
        print(f"[ERROR] Failed to generate AI insight: {str(e)}")
        # Fallback content
        return AIGameInsight(
            reasoning=f"This match features {company_a.name} vs {company_b.name} in the {sector} sector. Both companies have unique market positions and face similar industry challenges.",
            next_day_clue=f"Tomorrow's matchup will test your knowledge of market dynamics."
        )

def save_game_to_supabase(game_data: GameGenerationResponse, exchange: str) -> bool:
    """Save generated game data to the appropriate Supabase table"""
    try:
        from app.apis.predictions_api import get_supabase_admin_client
        
        # Get admin client
        supabase = get_supabase_admin_client()
        
        # Determine target table
        table_name = "asx_games" if exchange.upper() == "ASX" else "nyse_games"
        
        # Prepare data for insertion
        insert_data = {
            "exchange": exchange.upper(),
            "game_date": game_data.game_date,
            "company_a_ticker": game_data.company_a_ticker,
            "company_a_name": game_data.company_a_name,
            "company_b_ticker": game_data.company_b_ticker,
            "company_b_name": game_data.company_b_name,
            "sector": game_data.sector,
            "reasoning": game_data.reasoning,
            "next_day_clue": game_data.next_day_clue,
            "status": game_data.status
        }
        
        # Insert into database
        response = supabase.table(table_name).insert(insert_data).execute()
        
        # Check if insert was successful
        if response.data and len(response.data) > 0:
            print(f"[INFO] Successfully saved game to {table_name} table")
            return True
        else:
            print(f"[WARNING] Insert response didn't contain data: {response}")
            return False
    except Exception as e:
        print(f"[ERROR] Failed to save game to Supabase: {str(e)}")
        return False

def check_for_user_submitted_game(exchange: str, game_date: str) -> Optional[Dict]:
    """Check if there's a user-submitted game for the given date"""
    try:
        from app.apis.predictions_api import get_supabase_admin_client
        
        # Get admin client
        supabase = get_supabase_admin_client()
        
        # Determine target table
        table_name = "asx_games" if exchange.upper() == "ASX" else "nyse_games"
        
        # Check for user-submitted games
        response = supabase.table(table_name)\
            .select("*")\
            .eq("game_date", game_date)\
            .not_is("submitted_by_player_id", "null")\
            .limit(1)\
            .execute()
        
        # Return the first user-submitted game if available
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        print(f"[ERROR] Failed to check for user-submitted games: {str(e)}")
        return None

def notify_admins(message: str):
    """Send a notification to admin users"""
    try:
        print(f"[ADMIN NOTIFICATION] {message}")
        # TODO: Implement actual admin notification system
        # This could be via email, push notification, etc.
    except Exception as e:
        print(f"[ERROR] Failed to notify admins: {str(e)}")

# Game generation functions
def generate_game(exchange: str, target_date: str, sector: Optional[str] = None, force_refresh: bool = False) -> GameGenerationResponse:
    """Generate a new game for the target date"""
    # First check for user-submitted games
    user_game = check_for_user_submitted_game(exchange, target_date)
    
    if user_game:
        print(f"[INFO] Found user-submitted game for {target_date}")
        return GameGenerationResponse(
            exchange=user_game["exchange"],
            game_date=user_game["game_date"],
            company_a_ticker=user_game["company_a_ticker"],
            company_a_name=user_game["company_a_name"],
            company_b_ticker=user_game["company_b_ticker"],
            company_b_name=user_game["company_b_name"],
            sector=user_game["sector"],
            reasoning=user_game["reasoning"],
            next_day_clue=user_game.get("next_day_clue"),
            status=user_game["status"],
            is_saved=True  # Already in database
        )
    
    # Generate a new company pair
    company_pair = generate_company_pair(exchange, sector, force_refresh, False)
    
    # Fetch financial data for both companies
    company_a_full_ticker = f"{company_pair.company_a.ticker}.AX" if exchange.upper() == "ASX" else company_pair.company_a.ticker
    company_b_full_ticker = f"{company_pair.company_b.ticker}.AX" if exchange.upper() == "ASX" else company_pair.company_b.ticker
    
    financial_data = {
        company_pair.company_a.ticker: fetch_financial_data(company_a_full_ticker),
        company_pair.company_b.ticker: fetch_financial_data(company_b_full_ticker)
    }
    
    # Generate AI insights
    ai_insight = generate_ai_insight(
        company_pair.company_a, 
        company_pair.company_b, 
        company_pair.sector,
        financial_data
    )
    
    # Create game data
    game_data = GameGenerationResponse(
        exchange=exchange.upper(),
        game_date=target_date,
        company_a_ticker=company_pair.company_a.ticker,
        company_a_name=company_pair.company_a.name,
        company_b_ticker=company_pair.company_b.ticker,
        company_b_name=company_pair.company_b.name,
        sector=company_pair.sector,
        reasoning=ai_insight.reasoning,
        next_day_clue=ai_insight.next_day_clue,
        status="scheduled"
    )
    
    # Save to Supabase
    is_saved = save_game_to_supabase(game_data, exchange)
    game_data.is_saved = is_saved
    
    # Notify admins if save failed
    if not is_saved:
        notify_admins(f"Failed to save generated game for {exchange} on {target_date}. Manual intervention may be required.")
    
    return game_data

# Background task for automatic game generation
def generate_upcoming_games_task(days_ahead: int = 1):
    """Background task to generate games for upcoming trading days"""
    exchanges = ["ASX", "NYSE"]
    
    for exchange in exchanges:
        try:
            # Get next trading day
            today = date.today()
            next_day = get_next_trading_day(exchange, today)
            
            # Generate a game for each day ahead
            for i in range(days_ahead):
                target_date = (next_day + timedelta(days=i)).isoformat()
                
                # Check if a game already exists for this date
                from app.apis.predictions_api import get_supabase_admin_client
                supabase = get_supabase_admin_client()
                table_name = "asx_games" if exchange.upper() == "ASX" else "nyse_games"
                
                response = supabase.table(table_name)\
                    .select("pair_id")\
                    .eq("game_date", target_date)\
                    .limit(1)\
                    .execute()
                
                # Skip if game already exists
                if response.data and len(response.data) > 0:
                    print(f"[INFO] Game already exists for {exchange} on {target_date}, skipping generation")
                    continue
                
                # Generate the game
                print(f"[INFO] Generating game for {exchange} on {target_date}")
                game_data = generate_game(exchange, target_date)
                
                if game_data.is_saved:
                    print(f"[INFO] Successfully generated and saved game for {exchange} on {target_date}")
                else:
                    notify_admins(f"Failed to generate game for {exchange} on {target_date}")
        except Exception as e:
            print(f"[ERROR] Error generating games for {exchange}: {str(e)}")
            notify_admins(f"Error in automatic game generation for {exchange}: {str(e)}")

# API endpoints
@router.post("/game/generate", response_model=GameGenerationResponse)
async def generate_game_endpoint(
    request: GameGenerationRequest,
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """Generate a new game with AI reasoning for a specific date"""
    try:
        # Generate the game
        game_data = generate_game(
            request.exchange,
            request.target_date,
            request.sector,
            request.force_refresh
        )
        
        return game_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating game: {str(e)}")

@router.post("/games/generate-upcoming")
async def generate_upcoming_games_endpoint(
    days_ahead: int = Query(1, description="Number of days ahead to generate games for"),
    background_tasks: BackgroundTasks = None,
    current_user_id: str = Depends(require_permission(Permissions.MANAGE_GAMES))
):
    """Generate games for upcoming trading days"""
    try:
        if background_tasks:
            # Run in background
            background_tasks.add_task(generate_upcoming_games_task, days_ahead)
            return {"status": "success", "message": f"Generating games for the next {days_ahead} trading days in the background"}
        else:
            # Run immediately
            generate_upcoming_games_task(days_ahead)
            return {"status": "success", "message": f"Generated games for the next {days_ahead} trading days"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating upcoming games: {str(e)}")

# Mock data generation for testing
def generate_mock_game(exchange: str, target_date: str) -> GameGenerationResponse:
    """Generate a mock game for testing"""
    # Mock company data
    mock_sectors = ["Technology", "Healthcare", "Financials", "Consumer Discretionary", "Energy"]
    sector = random.choice(mock_sectors)
    
    company_a_name = f"Alpha {sector} Corp"
    company_a_ticker = f"A{sector[:3].upper()}"
    
    company_b_name = f"Beta {sector} Inc"
    company_b_ticker = f"B{sector[:3].upper()}"
    
    # Mock reasoning and clue
    reasoning = f"This matchup between {company_a_name} and {company_b_name} in the {sector} sector is particularly interesting because both companies have recently announced significant strategic initiatives. {company_a_name} is focusing on expanding its market share through innovative product development, while {company_b_name} has been streamlining operations to improve profitability. Market analysts are divided on which approach will yield better short-term results in the current economic climate."
    
    next_day_clue = f"Tomorrow's battle involves the tools that power our modern world."
    
    return GameGenerationResponse(
        exchange=exchange.upper(),
        game_date=target_date,
        company_a_ticker=company_a_ticker,
        company_a_name=company_a_name,
        company_b_ticker=company_b_ticker,
        company_b_name=company_b_name,
        sector=sector,
        reasoning=reasoning,
        next_day_clue=next_day_clue,
        status="scheduled",
        is_saved=False
    )

@router.get("/mock/game")
async def generate_mock_game_endpoint(
    exchange: str = Query("ASX", description="Stock exchange code (e.g., ASX, NYSE)"),
    target_date: Optional[str] = Query(None, description="Target date (ISO format, defaults to next trading day)")
):
    """Generate a mock game for testing"""
    try:
        # Use provided date or get next trading day
        if not target_date:
            next_day = get_next_trading_day(exchange)
            target_date = next_day.isoformat()
        
        # Generate mock game
        return generate_mock_game(exchange, target_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating mock game: {str(e)}")

@router.get("/test/ai-reasoning")
async def test_ai_reasoning():
    """Test endpoint for the AI reasoning generation"""
    try:
        # Create test company objects
        company_a = Company(
            ticker="AAPL",
            name="Apple Inc.",
            sector="Technology",
            industry="Consumer Electronics",
            exchange="NYSE",
            last_updated=datetime.now().isoformat(),
            market_cap=2500000000000,
            volume=50000000,
            is_active=True
        )
        
        company_b = Company(
            ticker="MSFT",
            name="Microsoft Corporation",
            sector="Technology",
            industry="Software",
            exchange="NYSE",
            last_updated=datetime.now().isoformat(),
            market_cap=2400000000000,
            volume=40000000,
            is_active=True
        )
        
        # Create mock financial data
        mock_data_a = pd.DataFrame({
            'Open': [180.0, 182.0, 185.0, 183.0, 187.0],
            'High': [185.0, 187.0, 190.0, 188.0, 192.0],
            'Low': [178.0, 180.0, 182.0, 180.0, 185.0],
            'Close': [182.0, 185.0, 183.0, 187.0, 190.0],
            'Volume': [50000000, 55000000, 48000000, 52000000, 60000000]
        })
        
        mock_data_b = pd.DataFrame({
            'Open': [380.0, 382.0, 385.0, 383.0, 387.0],
            'High': [385.0, 387.0, 390.0, 388.0, 392.0],
            'Low': [378.0, 380.0, 382.0, 380.0, 385.0],
            'Close': [382.0, 385.0, 383.0, 387.0, 390.0],
            'Volume': [30000000, 35000000, 28000000, 32000000, 40000000]
        })
        
        financial_data = {
            "AAPL": mock_data_a,
            "MSFT": mock_data_b
        }
        
        # Generate AI insight
        try:
            ai_insight = generate_ai_insight(company_a, company_b, "Technology", financial_data)
            return {
                "status": "success",
                "reasoning": ai_insight.reasoning,
                "next_day_clue": ai_insight.next_day_clue,
                "note": "This uses the actual OpenAI API to test reasoning generation"
            }
        except Exception as insight_error:
            return {
                "status": "error",
                "message": f"AI insight generation failed: {str(insight_error)}",
                "fallback": {
                    "reasoning": f"This match features Apple Inc. vs Microsoft Corporation in the Technology sector. Both companies have unique market positions and face similar industry challenges.",
                    "next_day_clue": "Tomorrow's matchup will test your knowledge of market dynamics."
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing AI reasoning: {str(e)}")
