from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
import databutton as db
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
import pytz
import re
from typing import List, Dict, Any, Optional
import random
import json
import traceback
# Import permissions
from app.apis.auth_utils import require_permission
from app.apis.admin_permissions import Permissions
from app.apis.db_utils import get_supabase_client

router = APIRouter()

# Storage keys (retained for migration purposes)
COMPANY_LISTINGS_KEY = "company_listings"
EXCHANGE_CALENDAR_KEY = "exchange_calendar"

# Models
class Company(BaseModel):
    ticker: str
    name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    exchange: str
    last_updated: str
    market_cap: Optional[float] = None
    volume: Optional[int] = None
    is_active: bool = True

class ExchangeCalendar(BaseModel):
    exchange: str
    trading_days: List[str]  # List of dates in ISO format
    holidays: List[str]  # List of holiday dates in ISO format
    last_updated: str

class CompanyDiscoveryResponse(BaseModel):
    companies: List[Company]
    total_count: int
    active_count: int
    is_mock_data: bool = False

class CompanyPair(BaseModel):
    company_a: Company
    company_b: Company
    sector: str
    date: str

# Helper functions
def sanitize_storage_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

def get_storage_key_for_exchange(exchange: str) -> str:
    """Generate a storage key for a specific exchange's company listings"""
    return sanitize_storage_key(f"{COMPANY_LISTINGS_KEY}_{exchange.lower()}")

def get_exchange_calendar_key(exchange: str) -> str:
    """Generate a storage key for a specific exchange's calendar"""
    return sanitize_storage_key(f"{EXCHANGE_CALENDAR_KEY}_{exchange.lower()}")

def is_trading_day(exchange: str, check_date: date = None) -> bool:
    """Check if a specific date is a trading day for the given exchange"""
    if check_date is None:
        check_date = date.today()
    
    # Get the exchange calendar
    calendar = get_exchange_calendar(exchange)
    
    # Check if the date is in the trading days list
    date_str = check_date.isoformat()
    return date_str in calendar.trading_days and date_str not in calendar.holidays

def get_next_trading_day(exchange: str, start_date: date = None) -> date:
    """Get the next trading day for the given exchange"""
    if start_date is None:
        start_date = date.today()
    
    # Get the exchange calendar
    calendar = get_exchange_calendar(exchange)
    
    # Iterate through the next 10 days to find the next trading day
    for i in range(1, 10):
        next_date = start_date + timedelta(days=i)
        date_str = next_date.isoformat()
        if date_str in calendar.trading_days and date_str not in calendar.holidays:
            return next_date
    
    # If no trading day found, return the date 1 business day ahead (fallback)
    return start_date + timedelta(days=1 if start_date.weekday() < 4 else 3)

# Exchange calendar functions
def generate_exchange_calendar(exchange: str, days_ahead: int = 30) -> ExchangeCalendar:
    """Generate an exchange calendar with trading days and holidays"""
    today = date.today()
    
    # Generate dates for the next 'days_ahead' days
    all_dates = [today + timedelta(days=i) for i in range(days_ahead)]
    
    # Basic filtering for weekends
    trading_days = [d for d in all_dates if d.weekday() < 5]  # 0-4 are Mon-Fri
    
    # Known holidays (placeholder - should be replaced with actual exchange holidays)
    holidays = []
    
    # If exchange is ASX, add Australian holidays
    if exchange.upper() == "ASX":
        # Add some Australian holidays (simplified example)
        aus_holidays = [
            # 2024-2025 Australian holidays (simplified)
            "2024-12-25",  # Christmas
            "2024-12-26",  # Boxing Day
            "2025-01-01",  # New Year's Day
            "2025-01-27",  # Australia Day (observed)
            "2025-04-18",  # Good Friday
            "2025-04-21",  # Easter Monday
            "2025-04-25",  # Anzac Day
        ]
        holidays = aus_holidays
    
    # Convert dates to strings for JSON serialization
    trading_days_str = [d.isoformat() for d in trading_days if d.isoformat() not in holidays]
    
    return ExchangeCalendar(
        exchange=exchange,
        trading_days=trading_days_str,
        holidays=holidays,
        last_updated=datetime.now().isoformat()
    )

def get_exchange_calendar(exchange: str) -> ExchangeCalendar:
    """Get the exchange calendar from Supabase, or generate a new one"""
    try:
        # Try to get the calendar from Supabase
        supabase = get_supabase_client()
        
        response = supabase.table("exchange_calendars").select("*").eq("exchange", exchange.upper()).execute()
        
        if response.data and len(response.data) > 0:
            calendar_data = response.data[0]
            
            # Check if the calendar is fresh (updated within last week)
            last_updated = datetime.fromisoformat(calendar_data["last_updated"])
            if datetime.now() - last_updated < timedelta(days=7):
                return ExchangeCalendar(
                    exchange=exchange.upper(),
                    trading_days=calendar_data["trading_days"],
                    holidays=calendar_data["holidays"],
                    last_updated=calendar_data["last_updated"]
                )
        
        # If calendar doesn't exist or is stale, generate a new one
        calendar = generate_exchange_calendar(exchange)
        
        # Save to Supabase
        calendar_data = {
            "exchange": exchange.upper(),
            "trading_days": calendar.trading_days,
            "holidays": calendar.holidays,
            "last_updated": calendar.last_updated
        }
        
        if response.data and len(response.data) > 0:
            # Update existing record
            supabase.table("exchange_calendars").update(calendar_data).eq("exchange", exchange.upper()).execute()
        else:
            # Insert new record
            supabase.table("exchange_calendars").insert(calendar_data).execute()
        
        return calendar
    except Exception as e:
        print(f"Error getting exchange calendar: {str(e)}")
        # Fall back to generating a fresh calendar without saving it
        return generate_exchange_calendar(exchange)

# Company discovery functions
def discover_companies_from_yfinance(exchange: str) -> List[Company]:
    """Discover companies from yfinance for a specific exchange"""
    try:
        print(f"[INFO] Discovering companies from yFinance for {exchange}")
        
        # Map exchange code to yfinance exchange code
        exchange_map = {
            "ASX": ".AX",  # Australian Securities Exchange
            "NYSE": "",   # New York Stock Exchange
            "NASDAQ": "", # NASDAQ
        }
        
        exchange_suffix = exchange_map.get(exchange.upper(), "")
        
        # In practice, yfinance doesn't provide a direct API for getting all listings
        # We'd likely use a service or dataset like pandas-datareader, exchange APIs, or preloaded tickers
        # For this implementation, we'll use a simplified approach with known stock lists
        
        # For ASX, use a sample of well-known Australian stocks
        if exchange.upper() == "ASX":
            sample_tickers = [
                "BHP", "CBA", "NAB", "ANZ", "WBC", "RIO", "FMG", "WES", "WOW", "CSL",
                "TLS", "QAN", "MQG", "APT", "REA", "COL", "AMC", "NCM", "SUN", "IAG",
                "AGL", "STO", "ORG", "LLC", "MPL", "JHX", "NST", "SVW", "NXT", "SEK",
                "TCL", "MEZ", "ASX", "APA", "RMD", "ALD", "BOQ", "WHC", "CTX", "NHF",
                "TWE", "XRO", "ALL", "MIN", "SCG", "SGP", "GMG", "VCX", "BXB", "LNK"
            ]
        else:
            # For other exchanges, use a smaller sample set (placeholder)
            sample_tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", "JPM", "V", "PG"]
        
        # Process each ticker to get info
        companies = []
        for ticker_base in sample_tickers:
            try:
                # Format ticker with exchange suffix
                ticker = f"{ticker_base}{exchange_suffix}"
                
                # Get stock info
                stock = yf.Ticker(ticker)
                info = stock.info
                
                # Process stock info
                if info and 'longName' in info:
                    # Get trading data to determine if active
                    hist = stock.history(period="5d")
                    is_active = not hist.empty and hist['Volume'].sum() > 0
                    
                    companies.append(Company(
                        ticker=ticker_base,  # Store the base ticker without suffix
                        name=info.get('longName', ticker_base),
                        sector=info.get('sector', None),
                        industry=info.get('industry', None),
                        exchange=exchange.upper(),
                        last_updated=datetime.now().isoformat(),
                        market_cap=info.get('marketCap', None),
                        volume=info.get('averageVolume', None),
                        is_active=is_active
                    ))
                    print(f"[INFO] Added {ticker_base} to {exchange} company list")
            except Exception as e:
                print(f"[WARNING] Error processing ticker {ticker_base}: {str(e)}")
                continue
        
        return companies
    except Exception as e:
        print(f"[ERROR] Failed to discover companies from yFinance: {str(e)}")
        return []

def generate_mock_companies(exchange: str, count: int = 50) -> List[Company]:
    """Generate mock company data for development and testing"""
    print(f"[WARNING] Generating mock company data for {exchange} - NOT FOR PRODUCTION")
    
    # Sectors and industries for realistic data
    sectors = [
        "Technology", "Healthcare", "Financials", "Consumer Discretionary", 
        "Industrials", "Materials", "Energy", "Consumer Staples", 
        "Telecommunications", "Utilities", "Real Estate"
    ]
    
    industries_by_sector = {
        "Technology": ["Software", "Hardware", "Semiconductors", "IT Services"],
        "Healthcare": ["Pharmaceuticals", "Biotechnology", "Medical Devices", "Healthcare Services"],
        "Financials": ["Banking", "Insurance", "Asset Management", "Diversified Financials"],
        "Consumer Discretionary": ["Retail", "Automotive", "Hotels & Entertainment", "Media"],
        "Industrials": ["Aerospace & Defense", "Construction", "Machinery", "Transportation"],
        "Materials": ["Chemicals", "Metals & Mining", "Construction Materials", "Paper & Forest Products"],
        "Energy": ["Oil & Gas", "Coal", "Renewable Energy"],
        "Consumer Staples": ["Food & Beverages", "Household Products", "Personal Products"],
        "Telecommunications": ["Wireless Services", "Wireline Services", "Communication Equipment"],
        "Utilities": ["Electric", "Gas", "Water", "Renewable Power"],
        "Real Estate": ["REIT", "Real Estate Development", "Real Estate Services"]
    }
    
    # Generate company names and tickers
    def generate_company_name(sector):
        prefixes = ["Alpha", "Beta", "Global", "Pacific", "Metro", "United", "First", "Advanced", "Superior", "Prime"]
        keywords = {
            "Technology": ["Tech", "Digital", "Cyber", "Quantum", "Data"],
            "Healthcare": ["Health", "Medical", "Pharma", "Life", "Care"],
            "Financials": ["Bank", "Financial", "Capital", "Asset", "Trust"],
            "Consumer Discretionary": ["Retail", "Leisure", "Style", "Design", "Luxury"],
            "Industrials": ["Industries", "Manufacturing", "Systems", "Build", "Construct"],
            "Materials": ["Materials", "Resources", "Mineral", "Chemical", "Mining"],
            "Energy": ["Energy", "Power", "Oil", "Gas", "Fuel"],
            "Consumer Staples": ["Foods", "Consumer", "Goods", "Products", "Essential"],
            "Telecommunications": ["Telecom", "Communications", "Connect", "Network", "Mobile"],
            "Utilities": ["Utilities", "Electric", "Water", "Gas", "Power"],
            "Real Estate": ["Properties", "Realty", "Estate", "Land", "Development"]
        }
        suffixes = ["Corp", "Inc", "Group", "Partners", "Holdings", "Solutions", "Enterprises"]
        
        prefix = random.choice(prefixes)
        keyword = random.choice(keywords.get(sector, ["Business"]))
        suffix = random.choice(suffixes)
        
        return f"{prefix} {keyword} {suffix}"
    
    def generate_ticker(name):
        # Take first letter of each word, up to 3-4 characters
        words = name.split()
        if len(words) >= 3:
            return ''.join([word[0] for word in words[:3]]).upper()
        else:
            # For shorter names, use first 3-4 letters of first word
            return words[0][:random.randint(3, 4)].upper()
    
    companies = []
    for i in range(count):
        sector = random.choice(sectors)
        industry = random.choice(industries_by_sector[sector])
        name = generate_company_name(sector)
        ticker_base = generate_ticker(name)
        
        # Make sure ticker is unique
        while any(c.ticker == ticker_base for c in companies):
            ticker_base = ticker_base + random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        
        companies.append(Company(
            ticker=ticker_base,
            name=name,
            sector=sector,
            industry=industry,
            exchange=exchange.upper(),
            last_updated=datetime.now().isoformat(),
            market_cap=random.uniform(1e8, 1e11),  # Random market cap between 100M and 100B
            volume=random.randint(10000, 10000000),  # Random volume
            is_active=random.random() > 0.1  # 90% chance of being active
        ))
    
    return companies

def discover_companies(exchange: str, force_refresh: bool = False, use_mock: bool = False) -> List[Company]:
    """Discover companies for a specific exchange"""
    try:
        supabase = get_supabase_client()
        
        # Check if we already have company data stored in Supabase
        if not force_refresh and not use_mock:
            try:
                response = supabase.table("company_cache").select("*").eq("exchange", exchange.upper()).execute()
                
                if response.data and len(response.data) > 0:
                    company_data = response.data[0]
                    companies_json = company_data["data"]
                    
                    # Check if data is fresh (less than 7 days old)
                    last_updated = datetime.fromisoformat(company_data["last_updated"])
                    if (datetime.now() - last_updated) < timedelta(days=7):
                        print(f"[INFO] Using cached company data for {exchange} from Supabase")
                        return [Company(**c) for c in companies_json]
                    else:
                        print(f"[INFO] Cached company data for {exchange} is stale, refreshing...")
            except Exception as e:
                print(f"[WARNING] Error reading stored company data from Supabase: {str(e)}")
        
        # If we need to refresh or no data exists
        companies = []
        if use_mock:
            companies = generate_mock_companies(exchange)
        else:
            companies = discover_companies_from_yfinance(exchange)
            
            # If no companies found, fall back to mock data
            if not companies:
                print(f"[WARNING] No companies discovered for {exchange}, falling back to mock data")
                companies = generate_mock_companies(exchange)
        
        # Store the company data in Supabase
        if companies:
            companies_json = [c.dict() for c in companies]
            company_data = {
                "exchange": exchange.upper(),
                "data": companies_json,
                "last_updated": datetime.now().isoformat()
            }
            
            # Check if we need to update an existing record or insert a new one
            response = supabase.table("company_cache").select("id").eq("exchange", exchange.upper()).execute()
            
            if response.data and len(response.data) > 0:
                # Update existing record
                print(f"[INFO] Updating existing company cache for {exchange} in Supabase")
                supabase.table("company_cache").update(company_data).eq("exchange", exchange.upper()).execute()
            else:
                # Insert new record
                print(f"[INFO] Creating new company cache for {exchange} in Supabase")
                supabase.table("company_cache").insert(company_data).execute()
        
        return companies
    except Exception as e:
        print(f"[ERROR] Error in company discovery: {str(e)}")
        # Fallback to mock data
        return generate_mock_companies(exchange)

# API Endpoints
@router.get("/companies/discover")
async def discover_companies_endpoint(
    exchange: str = Query("ASX", description="Stock exchange code (e.g., ASX, NYSE)"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    min_market_cap: Optional[float] = Query(None, description="Minimum market capitalization"),
    force_refresh: bool = Query(False, description="Force refresh of company data"),
    only_active: bool = Query(True, description="Only include actively traded companies"),
    mock_data: bool = Query(False, description="Use mock data for testing")
):
    """Discover companies from specified exchange with optional filtering"""
    try:
        # Discover companies
        all_companies = discover_companies(exchange, force_refresh, mock_data)
        
        # Apply filters
        filtered_companies = all_companies
        
        if sector:
            filtered_companies = [c for c in filtered_companies if c.sector and sector.lower() in c.sector.lower()]
        
        if min_market_cap is not None:
            filtered_companies = [c for c in filtered_companies if c.market_cap and c.market_cap >= min_market_cap]
        
        if only_active:
            filtered_companies = [c for c in filtered_companies if c.is_active]
        
        # Return the results
        return CompanyDiscoveryResponse(
            companies=filtered_companies,
            total_count=len(all_companies),
            active_count=len([c for c in all_companies if c.is_active]),
            is_mock_data=mock_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error discovering companies: {str(e)}")

# Function for generating company pairs without HTTP dependency
def generate_company_pair(exchange: str, target_sector: Optional[str] = None, force_refresh: bool = False, mock_data: bool = False) -> CompanyPair:
    """Generate a pair of companies from the same sector for comparison"""
    # Discover companies
    all_companies = discover_companies(exchange, force_refresh, mock_data)
    
    # Filter for active companies
    active_companies = [c for c in all_companies if c.is_active]
    
    if not active_companies:
        raise ValueError("No active companies found")
    
    # Group by sector
    sectors = {}
    for company in active_companies:
        if company.sector:
            sectors.setdefault(company.sector, []).append(company)
    
    # Filter sectors with at least 2 companies
    valid_sectors = {k: v for k, v in sectors.items() if len(v) >= 2}
    
    if not valid_sectors:
        raise ValueError("No sectors with multiple companies found")
    
    # Select target sector
    selected_sector = target_sector
    if not selected_sector or selected_sector not in valid_sectors:
        selected_sector = random.choice(list(valid_sectors.keys()))
    
    # Select two companies from the sector
    sector_companies = valid_sectors[selected_sector]
    company_a, company_b = random.sample(sector_companies, 2)
    
    # Get the next trading day
    next_day = get_next_trading_day(exchange)
    
    # Create the pair
    return CompanyPair(
        company_a=company_a,
        company_b=company_b,
        sector=selected_sector,
        date=next_day.isoformat()
    )

@router.get("/companies/pair/generate")
async def generate_company_pair_endpoint(
    exchange: str = Query("ASX", description="Stock exchange code (e.g., ASX, NYSE)"),
    target_sector: Optional[str] = Query(None, description="Target sector for the pair"),
    force_refresh: bool = Query(False, description="Force refresh of company data"),
    mock_data: bool = Query(False, description="Use mock data for testing")
):
    """Generate a pair of companies from the same sector for comparison"""
    try:
        return generate_company_pair(exchange, target_sector, force_refresh, mock_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating company pair: {str(e)}")

@router.get("/exchange/calendar")
async def get_exchange_calendar_endpoint(
    exchange: str = Query("ASX", description="Stock exchange code (e.g., ASX, NYSE)"),
    force_refresh: bool = Query(False, description="Force refresh of calendar data")
):
    """Get the trading calendar for a specific exchange"""
    try:
        if force_refresh:
            # Generate a fresh calendar
            calendar = generate_exchange_calendar(exchange)
            
            # Store the calendar in Supabase
            supabase = get_supabase_client()
            calendar_data = {
                "exchange": exchange.upper(),
                "trading_days": calendar.trading_days,
                "holidays": calendar.holidays,
                "last_updated": calendar.last_updated
            }
            
            # Check if we need to update or insert
            response = supabase.table("exchange_calendars").select("id").eq("exchange", exchange.upper()).execute()
            
            if response.data and len(response.data) > 0:
                supabase.table("exchange_calendars").update(calendar_data).eq("exchange", exchange.upper()).execute()
            else:
                supabase.table("exchange_calendars").insert(calendar_data).execute()
        else:
            # Get calendar from Supabase or generate if not available
            calendar = get_exchange_calendar(exchange)
        
        return calendar
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting exchange calendar: {str(e)}")

@router.get("/exchange/next-trading-day")
async def get_next_trading_day_endpoint(
    exchange: str = Query("ASX", description="Stock exchange code (e.g., ASX, NYSE)"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format, e.g., 2023-04-15)")
):
    """Get the next trading day for a specific exchange"""
    try:
        # Parse start date or use today
        if start_date:
            start = date.fromisoformat(start_date)
        else:
            start = date.today()
        
        # Get the next trading day
        next_day = get_next_trading_day(exchange, start)
        
        return {"exchange": exchange, "next_trading_day": next_day.isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting next trading day: {str(e)}")
        
# Test endpoint for validating the company discovery functionality
@router.get("/test-company-discovery")
async def test_company_discovery():
    """Test endpoint for company discovery module"""
    try:
        results = {}
        
        # Test mock company generation
        companies = generate_mock_companies("ASX", 10)
        results["mock_companies"] = {
            "count": len(companies),
            "sample": companies[0].dict() if companies else None
        }
        
        # Test exchange calendar
        calendar = get_exchange_calendar("ASX")
        results["exchange_calendar"] = {
            "exchange": calendar.exchange,
            "trading_days_count": len(calendar.trading_days),
            "next_trading_days": calendar.trading_days[:5] if calendar.trading_days else []
        }
        
        # Test company pair generation
        try:
            pair = generate_company_pair("ASX", None, False, True)
            results["company_pair"] = {
                "sector": pair.sector,
                "date": pair.date,
                "company_a": pair.company_a.dict(),
                "company_b": pair.company_b.dict()
            }
        except Exception as pair_error:
            results["company_pair"] = {
                "error": str(pair_error)
            }
        
        # Test next trading day
        next_day = get_next_trading_day("ASX")
        results["next_trading_day"] = {
            "date": next_day.isoformat(),
            "is_weekend": next_day.weekday() >= 5
        }

        # Test Supabase storage
        try:
            # Generate test companies
            test_companies = generate_mock_companies("TEST_EXCHANGE", 3)
            test_companies_json = [c.dict() for c in test_companies]
            
            # Store in Supabase
            supabase = get_supabase_client()
            
            # Prepare data
            test_data = {
                "exchange": "TEST_EXCHANGE",
                "data": test_companies_json,
                "last_updated": datetime.now().isoformat()
            }
            
            # Check if record exists
            check_response = supabase.table("company_cache").select("id").eq("exchange", "TEST_EXCHANGE").execute()
            
            if check_response.data and len(check_response.data) > 0:
                # Update
                update_response = supabase.table("company_cache").update(test_data).eq("exchange", "TEST_EXCHANGE").execute()
                results["supabase_test"] = {
                    "action": "update",
                    "success": len(update_response.data) > 0
                }
            else:
                # Insert
                insert_response = supabase.table("company_cache").insert(test_data).execute()
                results["supabase_test"] = {
                    "action": "insert",
                    "success": len(insert_response.data) > 0
                }
                
            # Test retrieval
            get_response = supabase.table("company_cache").select("*").eq("exchange", "TEST_EXCHANGE").execute()
            if get_response.data and len(get_response.data) > 0:
                results["supabase_test"]["retrieval"] = "success"
                results["supabase_test"]["record_id"] = get_response.data[0]["id"]
            else:
                results["supabase_test"]["retrieval"] = "failed"
        except Exception as supabase_error:
            results["supabase_test"] = {
                "error": str(supabase_error),
                "traceback": traceback.format_exc()
            }
        
        return {
            "status": "success",
            "message": "All tests completed successfully!",
            "results": results
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }

# Migration endpoint
@router.post("/company-cache/migrate")
async def migrate_company_cache_to_supabase(current_user_id: str = Depends(require_permission(Permissions.MANAGE_SYSTEM))):
    """Migrate company cache and exchange calendars from Databutton to Supabase"""
    try:
        supabase = get_supabase_client()
        migration_results = {
            "company_cache": {
                "migrated": 0,
                "failed": 0,
                "exchanges": []
            },
            "exchange_calendars": {
                "migrated": 0,
                "failed": 0,
                "exchanges": []
            }
        }
        
        # 1. Migrate company listings
        try:
            # List all company listings in Databutton storage
            storage_files = db.storage.json.list()
            company_files = [f for f in storage_files if f.name.startswith(COMPANY_LISTINGS_KEY)]
            
            print(f"[INFO] Found {len(company_files)} company listing files to migrate")
            
            for file in company_files:
                try:
                    # Extract exchange from filename
                    exchange = file.name.replace(f"{COMPANY_LISTINGS_KEY}_", "").upper()
                    
                    # Get data from Databutton
                    companies_json = db.storage.json.get(file.name)
                    
                    if companies_json and isinstance(companies_json, list):
                        # Prepare for Supabase
                        company_data = {
                            "exchange": exchange,
                            "data": companies_json,
                            "last_updated": datetime.now().isoformat()
                        }
                        
                        # Check if record already exists
                        response = supabase.table("company_cache").select("id").eq("exchange", exchange).execute()
                        
                        if response.data and len(response.data) > 0:
                            # Update existing record
                            print(f"[INFO] Updating existing company cache for {exchange}")
                            supabase.table("company_cache").update(company_data).eq("exchange", exchange).execute()
                        else:
                            # Insert new record
                            print(f"[INFO] Creating new company cache for {exchange}")
                            supabase.table("company_cache").insert(company_data).execute()
                        
                        migration_results["company_cache"]["migrated"] += 1
                        migration_results["company_cache"]["exchanges"].append(exchange)
                except Exception as e:
                    print(f"[ERROR] Error migrating company cache for {file.name}: {str(e)}")
                    migration_results["company_cache"]["failed"] += 1
        except Exception as e:
            print(f"[ERROR] Error during company cache migration: {str(e)}")
        
        # 2. Migrate exchange calendars
        try:
            # List all exchange calendars in Databutton storage
            storage_files = db.storage.json.list()
            calendar_files = [f for f in storage_files if f.name.startswith(EXCHANGE_CALENDAR_KEY)]
            
            print(f"[INFO] Found {len(calendar_files)} exchange calendar files to migrate")
            
            for file in calendar_files:
                try:
                    # Extract exchange from filename
                    exchange = file.name.replace(f"{EXCHANGE_CALENDAR_KEY}_", "").upper()
                    
                    # Get data from Databutton
                    calendar_json = db.storage.json.get(file.name)
                    
                    if calendar_json:
                        # Prepare for Supabase
                        calendar_data = {
                            "exchange": exchange,
                            "trading_days": calendar_json.get("trading_days", []),
                            "holidays": calendar_json.get("holidays", []),
                            "last_updated": calendar_json.get("last_updated", datetime.now().isoformat())
                        }
                        
                        # Check if record already exists
                        response = supabase.table("exchange_calendars").select("id").eq("exchange", exchange).execute()
                        
                        if response.data and len(response.data) > 0:
                            # Update existing record
                            print(f"[INFO] Updating existing exchange calendar for {exchange}")
                            supabase.table("exchange_calendars").update(calendar_data).eq("exchange", exchange).execute()
                        else:
                            # Insert new record
                            print(f"[INFO] Creating new exchange calendar for {exchange}")
                            supabase.table("exchange_calendars").insert(calendar_data).execute()
                        
                        migration_results["exchange_calendars"]["migrated"] += 1
                        migration_results["exchange_calendars"]["exchanges"].append(exchange)
                except Exception as e:
                    print(f"[ERROR] Error migrating exchange calendar for {file.name}: {str(e)}")
                    migration_results["exchange_calendars"]["failed"] += 1
        except Exception as e:
            print(f"[ERROR] Error during exchange calendar migration: {str(e)}")
        
        return {
            "status": "success",
            "message": "Migration completed",
            "results": migration_results
        }
    except Exception as e:
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Error during migration: {str(e)}"
        }

# Testing endpoint for company cache migration
@router.get("/test/migrate-company-cache")
async def test_migrate_company_cache_to_supabase():
    """Test endpoint for migrating company cache to Supabase (no auth required)"""
    try:
        # Create a test company cache entry in Databutton
        mock_companies = generate_mock_companies("TEST_EXCHANGE", 5)
        mock_companies_json = [c.dict() for c in mock_companies]
        test_key = f"{COMPANY_LISTINGS_KEY}_test_exchange"
        
        # Store in Databutton for migration testing
        db.storage.json.put(test_key, mock_companies_json)
        
        # Create a test exchange calendar in Databutton
        test_calendar = generate_exchange_calendar("TEST_EXCHANGE")
        test_calendar_json = {
            "trading_days": test_calendar.trading_days,
            "holidays": test_calendar.holidays,
            "last_updated": test_calendar.last_updated
        }
        test_calendar_key = f"{EXCHANGE_CALENDAR_KEY}_test_exchange"
        db.storage.json.put(test_calendar_key, test_calendar_json)
        
        # Run the migration for the test data
        supabase = get_supabase_client()
        migration_results = {
            "company_cache": {
                "migrated": 0,
                "exchanges": []
            },
            "exchange_calendars": {
                "migrated": 0,
                "exchanges": []
            },
            "verification": {
                "company_cache": None,
                "exchange_calendar": None
            }
        }
        
        # 1. Migrate test company listings
        try:
            companies_json = db.storage.json.get(test_key)
            
            if companies_json and isinstance(companies_json, list):
                # Prepare for Supabase
                company_data = {
                    "exchange": "TEST_EXCHANGE",
                    "data": companies_json,
                    "last_updated": datetime.now().isoformat()
                }
                
                # Check if record already exists
                response = supabase.table("company_cache").select("id").eq("exchange", "TEST_EXCHANGE").execute()
                
                if response.data and len(response.data) > 0:
                    # Update existing record
                    supabase.table("company_cache").update(company_data).eq("exchange", "TEST_EXCHANGE").execute()
                else:
                    # Insert new record
                    supabase.table("company_cache").insert(company_data).execute()
                
                migration_results["company_cache"]["migrated"] += 1
                migration_results["company_cache"]["exchanges"].append("TEST_EXCHANGE")
        except Exception as e:
            print(f"[ERROR] Error in test migration (company cache): {str(e)}")
            migration_results["error"] = str(e)
        
        # 2. Migrate test exchange calendar
        try:
            calendar_json = db.storage.json.get(test_calendar_key)
            
            if calendar_json:
                # Prepare for Supabase
                calendar_data = {
                    "exchange": "TEST_EXCHANGE",
                    "trading_days": calendar_json.get("trading_days", []),
                    "holidays": calendar_json.get("holidays", []),
                    "last_updated": calendar_json.get("last_updated", datetime.now().isoformat())
                }
                
                # Check if record already exists
                response = supabase.table("exchange_calendars").select("id").eq("exchange", "TEST_EXCHANGE").execute()
                
                if response.data and len(response.data) > 0:
                    # Update existing record
                    supabase.table("exchange_calendars").update(calendar_data).eq("exchange", "TEST_EXCHANGE").execute()
                else:
                    # Insert new record
                    supabase.table("exchange_calendars").insert(calendar_data).execute()
                
                migration_results["exchange_calendars"]["migrated"] += 1
                migration_results["exchange_calendars"]["exchanges"].append("TEST_EXCHANGE")
        except Exception as e:
            print(f"[ERROR] Error in test migration (exchange calendar): {str(e)}")
            migration_results["error"] = str(e)
        
        # 3. Verify the data was properly migrated
        try:
            # Verify company cache
            company_response = supabase.table("company_cache").select("*").eq("exchange", "TEST_EXCHANGE").execute()
            if company_response.data and len(company_response.data) > 0:
                migration_results["verification"]["company_cache"] = True
            else:
                migration_results["verification"]["company_cache"] = False
                
            # Verify exchange calendar
            calendar_response = supabase.table("exchange_calendars").select("*").eq("exchange", "TEST_EXCHANGE").execute()
            if calendar_response.data and len(calendar_response.data) > 0:
                migration_results["verification"]["exchange_calendar"] = True
            else:
                migration_results["verification"]["exchange_calendar"] = False
        except Exception as e:
            print(f"[ERROR] Error verifying migration: {str(e)}")
            migration_results["verification_error"] = str(e)
        
        # Clean up test data from Databutton
        try:
            db.storage.json.delete(test_key)
            db.storage.json.delete(test_calendar_key)
        except Exception as e:
            print(f"[WARNING] Error cleaning up test data: {str(e)}")
        
        return {
            "status": "success",
            "message": "Test migration completed",
            "results": migration_results
        }
    except Exception as e:
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Error during test migration: {str(e)}"
        }