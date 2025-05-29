export const getTestTickers = (): string[] => [
  'AAPL',   // US Large Cap Tech
  'MSFT',   // US Large Cap Tech
  'TSLA',   // US Auto with high volatility
  'BHP.AX', // Australian Mining
  'NAB.AX', // Australian Bank
  'HSBA.L', // UK Bank
  'BP.L',   // UK Oil & Gas
  'RY.TO',  // Canadian Bank
  'ENB.TO', // Canadian Energy
  'TLS.AX', // Australian Telecom
  'RIO.L',  // UK Mining
  'MMM',    // US Industrial
  'PG',     // US Consumer Staples
  'JPM',    // US Bank
  'IBM',    // US Tech with lower volatility
  'XRO.AX', // Australian Tech
  'QAN.AX', // Australian Airline
  'WOW.AX', // Australian Retail
  '0700.HK', // Hong Kong Tech
  '0005.HK', // Hong Kong Finance
];

// Test utility to check different tickers for rendering issues
export const testTickerRendering = async (selector = 'test') => {
  console.log(`[DEBUG][TICKER-TEST] Starting comprehensive ticker test`);
  
  // Get test tickers based on the selector
  const tickers = getTestTickers();
  let testResults: {ticker: string, success: boolean, error?: string, data?: any}[] = [];
  
  // Test each ticker
  for (let ticker of tickers) {
    console.log(`[DEBUG][TICKER-TEST] Testing ${ticker}...`);
    
    try {
      const data = await fetchCandlestickData(ticker);
      
      // Validate the data
      const validData = data.filter(item => 
        !isNaN(item.open) && !isNaN(item.high) && !isNaN(item.low) && !isNaN(item.close) &&
        item.high >= item.low && item.high > 0 && item.low > 0
      );
      
      const success = validData.length > 0;
      
      testResults.push({
        ticker,
        success,
        data: success ? {
          points: validData.length,
          firstDate: validData[0].date,
          lastDate: validData[validData.length-1].date,
          priceRange: [
            Math.min(...validData.map(d => Math.min(d.low, d.open, d.close))),
            Math.max(...validData.map(d => Math.max(d.high, d.open, d.close)))
          ]
        } : undefined,
        error: !success ? 'No valid data points' : undefined
      });
      
    } catch (err: any) {
      testResults.push({
        ticker,
        success: false,
        error: err.message || 'Unknown error'
      });
    }
  }
  
  // Report overall results
  const passCount = testResults.filter(r => r.success).length;
  const failCount = testResults.length - passCount;
  
  console.log(`[DEBUG][TICKER-TEST] Results: ${passCount}/${testResults.length} tickers passed`);
  
  if (failCount > 0) {
    console.log(`[DEBUG][TICKER-TEST] Failed tickers:`);
    testResults.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.ticker}: ${r.error}`);
    });
  }
  
  return testResults;
};
// Importing types
import { Company, CompanyData } from './companyTypes';
import { CandlestickDataPoint } from '../components/CandlestickChart';

// Function to fetch company data with consistent seeded randomization
export const fetchCompanyData = async (ticker: string): Promise<CompanyData> => {
  try {
    console.log(`[DEBUG] Fetching company data for ${ticker}`);
    // Use ticker to seed the random generator for consistent results
    const tickerSeed = ticker.split('').reduce((acc, char, index) => 
      acc + (char.charCodeAt(0) * (index + 1)), 0);
    
    // Deterministic random function based on ticker
    const random = (min: number, max: number, seedOffset = 0): number => {
      const seed = (tickerSeed + seedOffset) % 10000;
      return min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);
    };
    
    // Generate realistic price data
    const price = random(15, 150, 1);
    const changePercent = random(-0.05, 0.05, 2);
    const change = price * changePercent;
    const volume = random(100000, 5000000, 3);
    const marketCap = price * random(10000000, 100000000, 4);
    const peRatio = random(8, 30, 5);
    const dividend = random(0, 0.05, 6);
    const low52Week = price * (1 - random(0.1, 0.3, 7));
    const high52Week = price * (1 + random(0.1, 0.3, 8));
    
    return {
      price,
      change,
      changePercent,
      volume,
      marketCap,
      peRatio,
      dividend,
      high52Week,
      low52Week,
      loading: false,
      error: null
    };
  } catch (err) {
    console.error('Error fetching company data:', err);
    return {
      price: null,
      change: null,
      changePercent: null,
      volume: null,
      marketCap: null,
      peRatio: null,
      dividend: null,
      high52Week: null,
      low52Week: null,
      loading: false,
      error: 'Failed to fetch company data'
    };
  }
};

// Candlestick chart data fetching
export const fetchCandlestickData = async (ticker: string): Promise<CandlestickDataPoint[]> => {
  try {
    console.log(`[DEBUG] Generating candlestick data for ${ticker}`);
    // For demo purposes, return mock data based on ticker
    // In a real app, we would fetch this from a financial API
    
    // Generate 30 days of data
    const mockData: CandlestickDataPoint[] = [];
    
    // Use ticker to seed the random generator for consistent results
    // More sophisticated seeding technique for better variance between companies
    const tickerSeed = ticker.split('').reduce((acc, char, index) => 
      acc + (char.charCodeAt(0) * (index + 1)), 0);
    
    console.log(`[DEBUG] Using seed ${tickerSeed} for ${ticker}`);
      
    // Deterministic but ticker-specific random function
    const random = (min: number, max: number, seedOffset = 0) => {
      // Each call gets a unique seed based on data length and offset
      const seed = (tickerSeed * (mockData.length + 1 + seedOffset)) % 10000;
      const normalizedRandom = (((seed * 9301 + 49297) % 233280) / 233280);
      return min + normalizedRandom * (max - min);
    };
    
    // Choose a price tier based on ticker
    // This creates more variety in stock prices (penny stocks vs blue chips)
    const priceTier = Math.abs(tickerSeed % 4); // 0-3 price tiers
    
    let basePrice: number;
    let volatilityFactor: number;
    
    switch(priceTier) {
      case 0: // Penny stocks
        basePrice = 0.5 + random(0, 4.5);
        volatilityFactor = 0.04 + random(0, 0.04); // 4-8% daily volatility
        break;
      case 1: // Low-priced stocks
        basePrice = 5 + random(0, 15);
        volatilityFactor = 0.02 + random(0, 0.03); // 2-5% daily volatility
        break;
      case 2: // Mid-range stocks
        basePrice = 20 + random(0, 80);
        volatilityFactor = 0.01 + random(0, 0.02); // 1-3% daily volatility
        break;
      case 3: // Blue chips
        basePrice = 100 + random(0, 400);
        volatilityFactor = 0.005 + random(0, 0.015); // 0.5-2% daily volatility
        break;
      default:
        basePrice = 50 + random(0, 50);
        volatilityFactor = 0.01 + random(0, 0.02);
    }
    
    console.log(`[DEBUG] Base price for ${ticker}: $${basePrice.toFixed(2)}, volatility: ${(volatilityFactor * 100).toFixed(2)}%`);
    
    // Create a trend bias (slightly bullish or bearish overall)
    // This ensures we have a general direction with some variations
    const trendBias = random(-0.002, 0.003); // Slight positive bias on average
    console.log(`[DEBUG] Trend bias for ${ticker}: ${(trendBias * 100).toFixed(4)}% per day`);
    
    // Create a cycle pattern for the stock (oscillations)
    const cycleLength = Math.floor(random(5, 12)); // 5-12 day cycles
    const cycleAmplitude = basePrice * random(0.01, 0.04); // 1-4% of base price
    
    // Ensure at least 40 days of data for proper visualization
    const dataPoints = 40;
    let currentPrice = basePrice;
    const today = new Date();
    
    for (let i = dataPoints; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip weekends for realism (no trading on Sat/Sun)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      // Add cyclical component (sine wave pattern)
      const cyclicalComponent = Math.sin((dataPoints - i) * (2 * Math.PI / cycleLength)) * cycleAmplitude;
      
      // Random daily volatility with trend bias plus cyclical component
      const volatility = volatilityFactor * currentPrice;
      let randomChange = (random(-1, 1, i) * volatility) + (trendBias * currentPrice) + (cyclicalComponent / 20);
      
      // Ensure minimum viable change to prevent flat lines
      const minChange = currentPrice * 0.001; // At least 0.1% change
      if (Math.abs(randomChange) < minChange) {
        randomChange = minChange * (randomChange >= 0 ? 1 : -1);
      }
      
      // Calculate open and close prices
      const open = currentPrice;
      const close = Math.max(open + randomChange, open * 0.93); // Prevent extreme drops
      
      // Generate high and low with realistic intraday volatility
      const highVolatility = volatilityFactor * (1 + random(0, 1, i+100));
      const lowVolatility = volatilityFactor * (1 + random(0, 1, i+200));
      
      // Create high and low that properly contains open and close
      const maxPrice = Math.max(open, close);
      const minPrice = Math.min(open, close);
      const high = maxPrice * (1 + (highVolatility * random(0.2, 1, i+300)));
      const low = minPrice * (1 - (lowVolatility * random(0.2, 1, i+400)));
      
      // Volume correlates with volatility and price movement
      const volatilityRatio = Math.abs(randomChange) / volatility;
      const volumeBase = basePrice * 10000; // Base volume proportional to price
      const volume = Math.floor(volumeBase * (0.5 + volatilityRatio + random(0, 1, i+500)));
      
      // Ensure all values are positive and properly ordered
      const safeOpen = Math.max(0.01, open);
      const safeClose = Math.max(0.01, close);
      const safeHigh = Math.max(safeOpen, safeClose, high);
      const safeLow = Math.max(0.01, Math.min(safeOpen, safeClose, low));
      
      // Format values to 2 decimal places for consistency
      mockData.push({
        date: dateStr,
        open: Number(safeOpen.toFixed(2)),
        high: Number(safeHigh.toFixed(2)),
        close: Number(safeClose.toFixed(2)),
        low: Number(safeLow.toFixed(2)), 
        volume: Math.max(100, volume) // Ensure minimum volume
      });
      
      // Set close as the next day's reference
      currentPrice = safeClose; 
    }
    
    // Log overall price data quality metrics
    const priceValues = mockData.flatMap(item => [item.open, item.high, item.low, item.close]);
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);
    const priceRange = maxPrice - minPrice;
    const variationPercent = (priceRange / minPrice) * 100;
    
    console.log(`[DEBUG] ${ticker} price range: $${minPrice.toFixed(2)} to $${maxPrice.toFixed(2)}`);
    console.log(`[DEBUG] ${ticker} price variation: ${variationPercent.toFixed(2)}% over ${mockData.length} days`);
    
    if (variationPercent < 2) {
      console.warn(`[WARNING] Low price variation for ${ticker}: only ${variationPercent.toFixed(2)}%`);
    }
    
    // Validate the data before returning
    const validPoints = mockData.filter(p => 
      !isNaN(p.open) && !isNaN(p.high) && !isNaN(p.low) && !isNaN(p.close) &&
      p.high >= p.low && p.high >= p.open && p.high >= p.close &&
      p.low <= p.open && p.low <= p.close
    );
    
    console.log(`[DEBUG] Generated ${validPoints.length} valid candlesticks for ${ticker} out of ${mockData.length} total`);
    
    if (validPoints.length < mockData.length) {
      console.warn(`[WARNING] Some invalid points were filtered out for ${ticker}`);
    }
    
    if (validPoints.length === 0) {
      throw new Error(`Failed to generate valid candlestick data for ${ticker}`);
    }
    
    return validPoints;
  } catch (error) {
    console.error('Error generating candlestick data:', error);
    return [];
  }
};

// Helper function to format large numbers with appropriate suffixes
export const formatNumber = (value: number | null): string => {
  if (value === null) return 'N/A';
  
  // Support for trillion-level values
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  } else if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  
  return `$${value.toFixed(2)}`;
};

// Helper function to format percentages with proper sign
export const formatPercent = (value: number | null): string => {
  if (value === null) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
};

// Helper function to generate exchange website URLs

export const getExchangeURL = (ticker: string, exchange: string): string => {
  // Remove any special characters or spaces from ticker
  const cleanTicker = ticker.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // Map for common stock exchanges
  switch (exchange) {
    case 'ASX':
      return `https://www.asx.com.au/markets/company/${cleanTicker}`;
    case 'NYSE':
    case 'NYSEARCA':
    case 'NYSEAMERICAN':
      return `https://www.nyse.com/quote/${cleanTicker}`;
    case 'NASDAQ':
      return `https://www.nasdaq.com/market-activity/stocks/${cleanTicker}`;
    case 'LSE':
      return `https://www.londonstockexchange.com/stock/${cleanTicker}/`;
    case 'TSX':
    case 'TSXV':
      return `https://www.tsx.com/listings/listing-with-us/listed-company-directory/company-summary?id=${cleanTicker}`;
    case 'JSE':
      return `https://www.jse.co.za/listed-companies/${cleanTicker}`;
    default:
      // Generic fallback to a stock lookup site
      return `https://finance.yahoo.com/quote/${ticker}`;
  }
};