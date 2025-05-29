from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
import databutton as db
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import re
from typing import List, Dict, Any, Optional
import random
from app.apis.auth_utils import get_current_user

router = APIRouter()

# Models
class FinancialMetricsResponse(BaseModel):
    ticker: str
    name: str
    volume: int
    vwap: float
    rsi: float
    ma_ema9: float
    ma_ema20: float
    atr: float
    bid: float
    ask: float
    spread: float
    historical_data: List[Dict[str, Any]]
    candlestick_data: List[Dict[str, Any]]
    is_mock_data: bool = False

def calculate_rsi(data, period=14):
    """Calculate the Relative Strength Index (RSI)"""
    delta = data.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    return rsi.iloc[-1] if not pd.isna(rsi.iloc[-1]) else 50.0  # Default to 50 if not enough data

def calculate_atr(data, period=14):
    """Calculate the Average True Range (ATR)"""
    high = data['High']
    low = data['Low']
    close = data['Close'].shift(1)
    
    tr1 = high - low
    tr2 = (high - close).abs()
    tr3 = (low - close).abs()
    
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(window=period).mean()
    
    return atr.iloc[-1] if not pd.isna(atr.iloc[-1]) else 0.0

def format_ticker_for_yfinance(ticker):
    """Format ticker symbol for yfinance based on likely exchange"""
    # Remove any spaces
    ticker = ticker.strip().upper()
    
    # For Australian stocks (ASX), add .AX suffix if not present
    if not ticker.endswith('.AX') and len(ticker) <= 3:
        # Short tickers like TPG are likely ASX
        return f"{ticker}.AX"
    
    # For Australian stocks with longer names, still try to add .AX
    if not '.' in ticker:
        return f"{ticker}.AX"
        
    return ticker

def generate_mock_stock_data(ticker: str, days: int = 30) -> FinancialMetricsResponse:
    """Generate mock stock data for demonstration purposes only - NOT FOR PRODUCTION"""
    # IMPORTANT: This function is for demonstration purposes only
    # It generates fake but realistic-looking financial data
    # This should be removed before the game goes live
    
    print(f"[WARNING] Generating mock data for {ticker} - THIS IS NOT REAL DATA and should be removed before production")
    
    # Generate a base price between $10 and $200
    base_price = random.uniform(10.0, 200.0)
    
    # Generate dates
    end_date = datetime.now()
    dates = [(end_date - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days, 0, -1)]
    
    # Create random price movements with some trend
    trend = random.uniform(-0.1, 0.1)  # Random trend direction
    vol = random.uniform(0.005, 0.02)  # Random volatility level
    
    prices = []
    close_price = base_price
    
    for i in range(days):
        # Random daily price movement following a slight trend
        daily_change = close_price * (trend + random.normalvariate(0, vol))
        open_price = close_price
        close_price = open_price + daily_change
        high_price = max(open_price, close_price) * (1 + random.uniform(0, 0.01))
        low_price = min(open_price, close_price) * (1 - random.uniform(0, 0.01))
        
        prices.append({
            "date": dates[i],
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
            "volume": int(random.uniform(100000, 10000000))
        })
    
    # Generate other metrics
    latest_close = prices[-1]["close"]
    latest_volume = prices[-1]["volume"]
    
    # Calculate EMAs
    df = pd.DataFrame(prices)
    ema9 = df['close'].ewm(span=9, adjust=False).mean().iloc[-1]
    ema20 = df['close'].ewm(span=20, adjust=False).mean().iloc[-1]
    
    # Prepare historical data for line charts
    historical_data = [{
        "date": p["date"],
        "close": p["close"],
        "volume": p["volume"],
        "ema9": round(df['close'].ewm(span=9, adjust=False).mean().iloc[i], 2) if i >= 8 else None,
        "ema20": round(df['close'].ewm(span=20, adjust=False).mean().iloc[i], 2) if i >= 19 else None,
    } for i, p in enumerate(prices)]
    
    # Create a mock response
    mock_data = FinancialMetricsResponse(
        ticker=ticker,
        name=f"{ticker} Corporation",
        volume=latest_volume,
        vwap=round(latest_close * random.uniform(0.98, 1.02), 2),
        rsi=round(random.uniform(30, 70), 2),
        ma_ema9=round(ema9, 2),
        ma_ema20=round(ema20, 2),
        atr=round(random.uniform(0.5, 5.0), 2),
        bid=round(latest_close * 0.999, 2),
        ask=round(latest_close * 1.001, 2),
        spread=round(latest_close * 0.002, 2),
        historical_data=historical_data,
        candlestick_data=prices,
        is_mock_data=True
    )
    
    return mock_data

@router.get("/stock/financial-data/{ticker}")
async def get_financial_data(ticker: str, days: int = Query(30, ge=1, le=365), forceMock: bool = Query(False)):
    """Get detailed financial metrics and historical data for a stock"""
    try:
        # Sanitize ticker
        original_ticker = ticker.strip().upper()
        if not re.match(r'^[A-Z0-9.]+$', original_ticker):
            raise HTTPException(status_code=400, detail="Invalid ticker format")
            
        # If force mock parameter is set, generate mock data immediately
        if forceMock:
            print(f"[INFO] Force mock parameter set for {original_ticker}")
            return generate_mock_stock_data(original_ticker, days)
        
        # Format ticker for yfinance
        yf_ticker = format_ticker_for_yfinance(original_ticker)
        print(f"[INFO] Looking up ticker {original_ticker} as {yf_ticker} in yfinance")
        
        # Get stock info
        stock = yf.Ticker(yf_ticker)
        
        # Try multiple approaches to get data
        try:
            info = stock.info
            if not info or 'regularMarketPrice' not in info:
                print(f"[INFO] Failed to get stock info for {yf_ticker}, trying alternative approach")
                # If first approach fails, try direct history fetch
                raise ValueError("Missing regular market price")
        except:
            # Skip the info approach and go straight to history
            info = {}
        
        # Get name or use ticker as fallback
        name = info.get('shortName', info.get('longName', original_ticker))
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=max(days, 50))  # At least 50 days for calculations
        
        # Get historical data
        hist_data = stock.history(start=start_date, end=end_date, interval="1d")
        
        # If recent data is empty, try different ticker formats
        if hist_data.empty:
            # Try with .AX suffix for Australian stocks if not already tried
            if '.AX' not in yf_ticker:
                yf_ticker = f"{original_ticker}.AX"
                print(f"[INFO] First attempt failed, trying with .AX suffix: {yf_ticker}")
                stock = yf.Ticker(yf_ticker)
                hist_data = stock.history(start=start_date, end=end_date, interval="1d")
                
            # If still empty, try without any suffix
            if hist_data.empty and '.AX' in yf_ticker:
                yf_ticker = original_ticker
                print(f"[INFO] Second attempt failed, trying without suffix: {yf_ticker}")
                stock = yf.Ticker(yf_ticker)
                hist_data = stock.history(start=start_date, end=end_date, interval="1d")
        
        # If recent data is still empty, try fetching older data (last available)
        if hist_data.empty:
            # Try with a wider date range for last available data
            print(f"[INFO] No recent data found, trying to fetch older data for {yf_ticker}")
            older_start_date = end_date - timedelta(days=365)  # Go back a year
            stock = yf.Ticker(yf_ticker)
            hist_data = stock.history(start=older_start_date, end=end_date, interval="1d")
            
            if not hist_data.empty:
                print(f"[INFO] Found historical data from {hist_data.index[0]} to {hist_data.index[-1]}")
            
        # If all attempts to get real data fail, generate mock data for demonstration purposes
        if hist_data.empty or len(hist_data) < 2:
            # For demonstration purposes only - generate mock data
            # THIS SHOULD BE REMOVED BEFORE PRODUCTION
            return generate_mock_stock_data(original_ticker, days)
            
        # Calculate financial metrics
        latest_data = hist_data.iloc[-1]
        
        # Calculate VWAP (Volume Weighted Average Price)
        hist_data['vwap'] = (hist_data['Close'] * hist_data['Volume']).cumsum() / hist_data['Volume'].cumsum()
        
        # Calculate RSI
        rsi_value = calculate_rsi(hist_data['Close'])
        
        # Calculate EMAs
        ema9 = hist_data['Close'].ewm(span=9, adjust=False).mean()
        ema20 = hist_data['Close'].ewm(span=20, adjust=False).mean()
        
        # Calculate ATR
        atr_value = calculate_atr(hist_data)
        
        # Get bid-ask spread (approximated from last price and day range)
        closing_price = latest_data['Close']
        bid = info.get('bid', closing_price * 0.999)  # Default to 0.1% below close
        ask = info.get('ask', closing_price * 1.001)  # Default to 0.1% above close
        
        # If bid or ask are 0 or NaN, estimate them
        if not bid or pd.isna(bid) or bid == 0:
            bid = closing_price * 0.999
        if not ask or pd.isna(ask) or ask == 0:
            ask = closing_price * 1.001
        
        # Make sure volume is valid
        volume = latest_data['Volume']
        if pd.isna(volume) or volume == 0:
            volume = 1000  # Provide a default for display purposes
        
        # Prepare candlestick data
        candlestick_data = [{
            "date": date.strftime("%Y-%m-%d"),
            "open": float(row["Open"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "close": float(row["Close"]),
            "volume": float(row["Volume"])
        } for date, row in hist_data.iterrows()]
        
        # Prepare historical data for line chart
        historical_data = [{
            "date": date.strftime("%Y-%m-%d"),
            "close": float(row["Close"]),
            "volume": float(row["Volume"]),
            "ema9": float(ema9.loc[date]) if date in ema9.index else None,
            "ema20": float(ema20.loc[date]) if date in ema20.index else None,
        } for date, row in hist_data.iterrows()]
        
        # Create response
        response = FinancialMetricsResponse(
            ticker=original_ticker,
            name=name,
            volume=int(volume),
            vwap=float(hist_data['vwap'].iloc[-1]),
            rsi=float(rsi_value),
            ma_ema9=float(ema9.iloc[-1]),
            ma_ema20=float(ema20.iloc[-1]),
            atr=float(atr_value),
            bid=float(bid),
            ask=float(ask),
            spread=float(ask - bid),
            historical_data=historical_data,
            candlestick_data=candlestick_data,
            is_mock_data=False
        )
        
        return response
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error fetching financial data for {ticker}: {str(e)}")
        
        # If all other attempts fail, generate mock data for demonstration
        # THIS SHOULD BE REMOVED BEFORE PRODUCTION
        return generate_mock_stock_data(original_ticker, days)
