import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
} from "recharts";
import { ArrowUp, ArrowDown, Layers, BarChart3, Activity, TrendingUp, Bug } from "lucide-react";
import { toast } from "sonner";
import { API_URL, mode, Mode } from "app";
import brain from "brain";
import CandlestickChart from "./CandlestickChart";
import ChartDebugPanel from "./ChartDebugPanel";

// Helper function to calculate EMA
const calculateEMA = (data: number[], period: number): number[] => {
  if (data.length < period) {
    // Return the same array filled with the first value if not enough data
    return data.map(() => data[0] || 0);
  }
  
  const k = 2 / (period + 1);
  let emaValues: number[] = [];
  
  // Calculate first EMA as SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let ema = sum / period;
  emaValues.push(ema);
  
  // Calculate EMA for remaining data points
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * k + ema;
    emaValues.push(ema);
  }
  
  // Pad with nulls at the beginning to match length of original data
  const padding = Array(data.length - emaValues.length).fill(null);
  return [...padding, ...emaValues];
};

interface CompanyFinancialCardProps {
  ticker: string;
  companyName: string;
  sector: string;
  isSelected: boolean;
  onSelect: () => void;
  isDisabled: boolean;
}

interface FinancialData {
  ticker: string;
  name: string;
  volume: number;
  vwap: number;
  rsi: number;
  ma_ema9: number;
  ma_ema20: number;
  atr: number;
  bid: number;
  ask: number;
  spread: number;
  historical_data: HistoricalDataPoint[];
  candlestick_data: CandlestickDataPoint[];
}

interface HistoricalDataPoint {
  date: string;
  close: number;
  volume: number;
  ema9: number | null;
  ema20: number | null;
}

interface CandlestickDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatLargeNumber = (value: number): string => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toString();
};

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Card className="bg-background border-border p-2 text-xs">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(2)}
          </p>
        ))}
      </Card>
    );
  }
  return null;
};

const CustomCandlestickTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Card className="bg-background border-border p-2 text-xs">
        <p className="font-medium">{label}</p>
        <p className="text-green-500">Open: {formatCurrency(data.open)}</p>
        <p className="text-primary">High: {formatCurrency(data.high)}</p>
        <p className="text-destructive">Low: {formatCurrency(data.low)}</p>
        <p className="text-blue-500">Close: {formatCurrency(data.close)}</p>
        <p className="text-gray-500">Volume: {formatLargeNumber(data.volume)}</p>
      </Card>
    );
  }
  return null;
};

// Chart component moved to dedicated TradingViewChart.tsx file

const CompanyFinancialCard: React.FC<CompanyFinancialCardProps> = ({
  ticker,
  companyName,
  sector,
  isSelected,
  onSelect,
  isDisabled,
}) => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<string>("14");
  const [activeTab, setActiveTab] = useState<string>("chart"); // Default to chart tab for testing
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use real API data since mock data is properly implemented now
      // Try appending .AX suffix for Australian stocks if not already present
      // This improves chances of finding the stock on first attempt
      let tickerToUse = ticker;
      if (!ticker.includes('.') && retryCount === 0) {
        tickerToUse = `${ticker}.AX`;
      }
      
      const response = await fetch(`${API_URL}/stock/financial-data/${tickerToUse}?days=${timeframe}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        ...(mode === Mode.DEV && { credentials: "include" }),
      });

      if (!response.ok) {
        // If first attempt with .AX fails, try without the suffix
        if (tickerToUse.endsWith('.AX') && retryCount === 0) {
          setRetryCount(1);
          // Recursive call with original ticker
          return fetchFinancialData();
        }
        throw new Error(`Error ${response.status}: ${await response.text() || 'Failed to fetch data'}`);
      }

      const data = await response.json();
      
      // If we got mock data, indicate this to the user
      if (data.is_mock_data) {
        console.warn(`Displaying mock data for ${ticker} - this is not real data`);
      }
      
      setFinancialData(data);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error(`Error fetching financial data for ${ticker}:`, err);
      
      // Try one more time with ?forceMock=true parameter to ensure we get mock data
      if (retryCount < 2) {
        setRetryCount(2);
        try {
          console.log(`Attempting to fetch mock data for ${ticker}`);
          const mockResponse = await fetch(`${API_URL}/stock/financial-data/${ticker}?days=${timeframe}&forceMock=true`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            ...(mode === Mode.DEV && { credentials: "include" }),
          });
          
          if (mockResponse.ok) {
            const mockData = await mockResponse.json();
            setFinancialData(mockData);
            setError(null);
            setIsLoading(false);
            return;
          }
        } catch (mockErr) {
          console.error(`Failed to fetch mock data for ${ticker}:`, mockErr);
        }
      }
      
      setError(err.message || "Failed to load financial data");
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for testing
  useEffect(() => {
    const setupMockData = async () => {
      setIsLoading(true);
      try {
        console.log(`[DEBUG] Setting up financial data for ${ticker}`);
        
        // Generate dynamic candlestick data with improved volatility
        const { fetchCandlestickData } = await import('../utils/stockApi');
        const candlestickData = await fetchCandlestickData(ticker);
        
        // Verify we have valid data
        if (!candlestickData || candlestickData.length === 0) {
          throw new Error('Failed to generate candlestick data');
        }
        
        // Debug log the entire dataset to verify structure
        console.log(`[DEBUG] Got ${candlestickData.length} candlestick data points for ${ticker}`);
        console.log(`[DEBUG] First point:`, candlestickData[0]);
        console.log(`[DEBUG] Last point:`, candlestickData[candlestickData.length - 1]);
        
        // Validate data points for expected attributes
        const validDataPoints = candlestickData.filter(item => 
          !isNaN(item.open) && !isNaN(item.high) && !isNaN(item.low) && !isNaN(item.close) &&
          item.high >= item.low && item.high > 0 && item.low > 0
        );
        
        console.log(`[DEBUG] ${validDataPoints.length} valid points out of ${candlestickData.length}`);
        
        if (validDataPoints.length === 0) {
          // If filtering removed all points, log detailed issues with the dataset
          console.log('[DEBUG] Validation issues with candlestick data:');
          candlestickData.forEach((item, index) => {
            const issues = [];
            if (isNaN(item.open)) issues.push('Invalid open');
            if (isNaN(item.high)) issues.push('Invalid high');
            if (isNaN(item.low)) issues.push('Invalid low');
            if (isNaN(item.close)) issues.push('Invalid close');
            if (item.high < item.low) issues.push('High < Low');
            if (item.high <= 0) issues.push('Non-positive High');
            if (item.low <= 0) issues.push('Non-positive Low');
            
            console.log(`[DEBUG] Point ${index}: ${JSON.stringify(item)}, Issues: ${issues.join(', ') || 'None'}`);
          });
          
          throw new Error('No valid candlestick data points found');
        }
        
        // Generate base level metrics from the latest valid point
        const latestDataPoint = validDataPoints[validDataPoints.length - 1];
        const latestClose = latestDataPoint.close;
        
        // Generate a more realistic volume based on price
        const volume = Math.floor((latestClose * 10000) * (0.5 + Math.random()));
        
        // Calculate price values for technical indicators
        const priceValues = validDataPoints.map(item => item.close);
        
        // Ensure minimum data points for EMA calculation
        const ema9 = priceValues.length >= 9 ? 
          calculateEMA(priceValues, 9).slice(-1)[0] : 
          latestClose * (1 + (Math.random() * 0.02 - 0.01));
          
        const ema20 = priceValues.length >= 20 ? 
          calculateEMA(priceValues, 20).slice(-1)[0] : 
          latestClose * (1 - (Math.random() * 0.02 - 0.01));
        
        // Map candlestick data to historical data format with proper date ordering
        const historicalData = validDataPoints.map(item => ({
          date: item.date,
          close: item.close,
          volume: item.volume,
          ema9: null,
          ema20: null
        }));
        
        // Calculate EMAs for historical data
        const closes = historicalData.map(item => item.close);
        const ema9Values = calculateEMA(closes, 9);
        const ema20Values = calculateEMA(closes, 20);
        
        // Add EMAs to historical data
        historicalData.forEach((item, index) => {
          item.ema9 = ema9Values[index] || null;
          item.ema20 = ema20Values[index] || null;
        });
        
        // Log price range to help diagnose chart scaling issues
        const priceRange = {
          min: Math.min(...priceValues),
          max: Math.max(...priceValues),
          range: Math.max(...priceValues) - Math.min(...priceValues),
          rangePct: ((Math.max(...priceValues) - Math.min(...priceValues)) / Math.min(...priceValues)) * 100
        };
        
        console.log(`[DEBUG] Price range for ${ticker}:`, priceRange);
        
        // Create or validate atr calculation
        let atr = 0;
        if (validDataPoints.length >= 2) {
          // Calculate basic ATR as average of high-low ranges
          const ranges = validDataPoints.map(p => p.high - p.low);
          atr = ranges.reduce((sum, val) => sum + val, 0) / ranges.length;
        } else {
          atr = latestClose * 0.02; // Fallback to 2% of price
        }
        
        // Create mock financial data using our dynamic candlestick data
        const mockData = {
          ticker: ticker,
          name: companyName,
          volume: volume,
          vwap: latestClose * (1 + (Math.random() * 0.01 - 0.005)), // +/- 0.5% from close for VWAP
          rsi: 40 + Math.random() * 20, // Random RSI between 40-60
          ma_ema9: ema9,
          ma_ema20: ema20,
          atr: atr,
          bid: latestClose * 0.997, // Tighter spread - 0.3% below close
          ask: latestClose * 1.003, // Tighter spread - 0.3% above close
          spread: latestClose * 0.006, // 0.6% spread
          historical_data: historicalData,
          candlestick_data: validDataPoints,  // Use only valid data points
          is_mock_data: true
        };
        
        // Final data validation
        console.log(`[DEBUG] Financial metrics for ${ticker}:`, {
          close: latestClose,
          ema9: mockData.ma_ema9,
          ema20: mockData.ma_ema20,
          bid: mockData.bid,
          ask: mockData.ask,
          candlestickPoints: mockData.candlestick_data.length
        });
        
        setFinancialData(mockData);
      } catch (error) {
        console.error(`[ERROR] Failed to generate data for ${ticker}:`, error);
        setError("Could not generate chart data");
      } finally {
        setIsLoading(false);
      }
    };
    
    setupMockData();
  }, [ticker, companyName]);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={`flex flex-col justify-between p-0 border-2 transition-all duration-200 min-h-[550px] ${
        isSelected ? 'border-primary shadow-lg' : 'border-border hover:border-muted-foreground/50'
      } ${isDisabled ? 'opacity-75 cursor-not-allowed' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between">
            <div>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="px-6 py-2">
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
        <CardFooter className="pt-2 pb-6 px-6">
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={`flex flex-col justify-between p-6 border-2 transition-all duration-200 min-h-[550px] ${
        isSelected ? 'border-primary shadow-lg' : 'border-border hover:border-muted-foreground/50'
      } ${isDisabled ? 'opacity-75 cursor-not-allowed' : ''}`}>
        <div>
          <h3 className="text-xl font-semibold mb-2">{companyName}</h3>
          <p className="text-sm text-muted-foreground mb-4">Ticker: {ticker}</p>
          <p className="text-sm">Sector: {sector}</p>
          <div className="mt-4 text-destructive text-sm">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchFinancialData()}
              className="mt-2 w-full"
            >
              Retry
            </Button>
          </div>
        </div>
        <Button
          variant={isSelected ? "default" : "outline"}
          onClick={isDisabled ? undefined : onSelect}
          disabled={isDisabled}
          className="w-full mt-4"
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
      </Card>
    );
  }

  return (
    <Card 
      className={`flex flex-col justify-between p-0 border-2 transition-all duration-200 min-h-[550px] ${
        isSelected ? 'border-primary shadow-lg' : 'border-border hover:border-muted-foreground/50'
      } ${isDisabled ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      <CardHeader className="pb-2 h-[120px]">
        <div className="flex justify-between items-start h-full">
          <div className="flex flex-col justify-center">
            <h3 className="text-xl font-semibold line-clamp-2 h-[3rem]" title={companyName}>{companyName}</h3>
            <p className="text-sm text-muted-foreground">{ticker}</p>
          </div>
          <Badge variant="secondary" className="whitespace-nowrap h-6">{sector}</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sticky top-0 bg-background z-10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
          </TabsList>
          <div className="min-h-[350px] pb-4">
          
          <TabsContent value="overview" className="space-y-4 p-2 min-h-[300px]">
            {financialData && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Price</Label>
                  <p className="text-lg font-semibold">{formatCurrency(financialData.historical_data[financialData.historical_data.length - 1].close)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Volume</Label>
                  <p className="text-lg font-semibold">{formatLargeNumber(financialData.volume)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">VWAP</Label>
                  <p className="text-base font-medium">{formatCurrency(financialData.vwap)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">RSI</Label>
                  <p className="text-base font-medium flex items-center">
                    {financialData.rsi.toFixed(2)}
                    {financialData.rsi > 70 ? (
                      <Badge variant="destructive" className="ml-1 text-xs">Overbought</Badge>
                    ) : financialData.rsi < 30 ? (
                      <Badge variant="success" className="ml-1 text-xs">Oversold</Badge>
                    ) : null}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-3 p-2 min-h-[300px]">
            {financialData && (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">EMA 9</Label>
                    <span className="font-medium">{formatCurrency(financialData.ma_ema9)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">EMA 20</Label>
                    <span className="font-medium">{formatCurrency(financialData.ma_ema20)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">ATR</Label>
                    <span className="font-medium">{financialData.atr.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">Spread</Label>
                    <span className="font-medium">{formatCurrency(financialData.spread)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">Bid</Label>
                    <span className="font-medium">{formatCurrency(financialData.bid)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">Ask</Label>
                    <span className="font-medium">{formatCurrency(financialData.ask)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-1 text-muted-foreground" />
                    <Label className="text-muted-foreground">Trend Analysis</Label>
                  </div>
                  <span className={`font-medium ${
                    financialData.ma_ema9 > financialData.ma_ema20 ? 'text-green-500' : 'text-destructive'
                  }`}>
                    {financialData.ma_ema9 > financialData.ma_ema20 ? (
                      <span className="flex items-center">
                        <ArrowUp className="h-4 w-4 mr-1" /> Bullish
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <ArrowDown className="h-4 w-4 mr-1" /> Bearish
                      </span>
                    )}
                  </span>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="chart" className="p-2 min-h-[300px]">
            <div className="pb-2 flex justify-between items-center">
              <Select 
                value={timeframe} 
                onValueChange={handleTimeframeChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setShowDebugPanel(!showDebugPanel)} 
                title="Toggle debug panel"
              >
                <Bug className="h-4 w-4" />
              </Button>
            </div>
            
            {financialData ? (
              <CandlestickChart 
                data={financialData.candlestick_data ? financialData.candlestick_data.slice(-parseInt(timeframe)) : []} 
                ticker={ticker} 
                companyName={companyName}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Loading chart data...
              </div>
            )}
          </TabsContent>
          </div>
        </Tabs>
      </CardContent>
      <CardFooter className="pt-2 pb-6 px-6 mt-auto">
        <Button
          variant={isSelected ? "default" : "outline"}
          onClick={(e) => {
            e.stopPropagation();
            if (!isDisabled) onSelect();
          }}
          disabled={isDisabled}
          className="w-full"
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
      </CardFooter>
      
      {/* Debug panel */}
      {showDebugPanel && financialData && (
        <ChartDebugPanel 
          ticker={ticker} 
          data={financialData.candlestick_data}
          onClose={() => setShowDebugPanel(false)}
        />
      )}
    </Card>
  );
};

export default CompanyFinancialCard;
