import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Building2, TrendingUp, TrendingDown, DollarSign, ChevronUp, ChevronDown, BarChart, ExternalLink, AlertCircle } from "lucide-react";
import CandlestickChart, { CandlestickDataPoint } from './CandlestickChart';
import ChartDebugPanel from './ChartDebugPanel';
import { fetchCandlestickData, getExchangeURL } from '../utils/stockApi';

// No need to import Chart.js components directly as they're already imported in CandlestickChart
// and LineChart components
import LineChart from "./LineChart";

// Chart.js components are registered in their respective components

// Interface for financial metrics
interface FinancialMetrics {
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  weekRange: {
    low: number;
    high: number;
  };
}

interface StockCardProps {
  companyName: string;
  ticker: string;
  sector: string;
  exchange?: string;
  isSelected?: boolean;
  onSelect: () => void;
  isDisabled?: boolean;
  variant?: "simple" | "detailed";
}

// Helper to calculate EMA (Exponential Moving Average)
const calculateEMA = (data: number[], period: number): number[] => {
  if (data.length < period) {
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

// Format currency with appropriate precision
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 10 ? 2 : value < 100 ? 2 : 0,
    maximumFractionDigits: value < 10 ? 2 : value < 100 ? 2 : 0
  }).format(value);
};

// Format large numbers (millions, billions)
const formatLargeNumber = (value: number): string => {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  } else if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
};

// Format percentage with appropriate sign
const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
};

const StockCard: React.FC<StockCardProps> = ({
  companyName,
  ticker,
  sector,
  exchange = "NYSE",
  isSelected = false,
  onSelect,
  isDisabled = false,
  variant = "detailed",
}) => {
  const [chartData, setChartData] = useState<CandlestickDataPoint[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("14"); // Default to 14 days
  const [activeTab, setActiveTab] = useState("chart"); // Default tab
  const [showDebugPanel, setShowDebugPanel] = useState(false); // Debug panel state

  // Generate mock financial metrics based on ticker
  const generateMockMetrics = (price: number): FinancialMetrics => {
    // Use ticker to seed the random generator for consistent results
    const tickerSeed = ticker.split('').reduce((acc, char, index) => 
      acc + (char.charCodeAt(0) * (index + 1)), 0);
      
    const random = (min: number, max: number, seedOffset = 0): number => {
      const seed = (tickerSeed + seedOffset) % 10000;
      return min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);
    };
    
    const changePercent = random(-0.05, 0.08, 1);
    
    return {
      currentPrice: price,
      changeAmount: price * changePercent,
      changePercent: changePercent,
      marketCap: price * random(1000000000, 10000000000, 2),
      peRatio: random(8, 40, 3),
      dividendYield: random(0.005, 0.06, 4),
      weekRange: {
        low: price * (1 - random(0.15, 0.4, 5)),
        high: price * (1 + random(0.05, 0.3, 6))
      }
    };
  };

  // Only fetch stock data when component is visible (and not just on mount)
  // This is crucial for security - we don't want to leak stock data in console logs
  // before the player actually starts the game
  useEffect(() => {
    // Skip data loading if component is disabled (game not started)
    if (isDisabled) {
      console.log(`[StockCard] Skipping data load for ${ticker} - game not started yet`);
      return;
    }
    
    const loadStockData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Only fetch data when component is enabled (game started)
        console.log(`[StockCard] Loading candlestick data for ${ticker}`);
        const candlestickData = await fetchCandlestickData(ticker);
        
        if (!candlestickData || candlestickData.length === 0) {
          throw new Error(`No data available for ${ticker}`);
        }
        
        // Validate data before setting
        const validDataPoints = candlestickData.filter(d => 
          !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close) &&
          d.high >= d.low && d.high > 0 && d.low > 0
        );
        
        if (validDataPoints.length === 0) {
          throw new Error(`No valid price data for ${ticker}`);
        }
        
        if (validDataPoints.length < candlestickData.length) {
          console.warn(`[StockCard] Only ${validDataPoints.length} of ${candlestickData.length} data points are valid for ${ticker}`);
        }
        
        setChartData(candlestickData);
        
        // Get most recent closing price for metrics calculation
        // Use the valid data only for price calculation
        const latestValidData = validDataPoints[validDataPoints.length - 1];
        const latestPrice = latestValidData.close;
        setMetrics(generateMockMetrics(latestPrice));
        
        console.log(`[StockCard] Successfully loaded data for ${ticker} with ${validDataPoints.length} valid points`);
      } catch (err) {
        console.error(`[StockCard] Error loading stock data for ${ticker}:`, err);
        setError(err instanceof Error ? err.message : 'Unable to load stock data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStockData();
  }, [ticker, isDisabled]); // Added isDisabled dependency

  // Prepare chart data for Chart.js
  const prepareChartData = (timeframeDays: number) => {
    if (!chartData || chartData.length === 0) return null;
    
    // Get subset of data based on timeframe
    const dataPoints = Math.min(parseInt(timeframe), chartData.length);
    const data = chartData.slice(-dataPoints);
    
    // Calculate moving average
    const closes = data.map(d => d.close);
    const ema = calculateEMA(closes, Math.min(9, closes.length));
    
    return {
      labels: data.map(d => d.date.slice(5)), // Format as MM-DD
      datasets: [
        {
          label: ticker,
          data: data.map(d => d.close),
          borderColor: metrics && metrics.changePercent >= 0 ? 'rgba(74, 222, 128, 1)' : 'rgba(248, 113, 113, 1)',
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'EMA',
          data: ema,
          borderColor: 'rgba(99, 179, 237, 0.8)',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 0,
        }
      ]
    };
  };

  // Chart.js options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
          font: {
            size: 10,
          }
        }
      },
      y: {
        position: 'right' as const,
        grid: {
          color: 'rgba(200, 200, 200, 0.1)',
        },
        ticks: {
          callback: (value: number) => formatCurrency(value),
          font: {
            size: 10,
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    elements: {
      line: {
        tension: 0.1
      }
    }
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={`overflow-hidden border-2 transition-all duration-200 ${isSelected ? 'border-primary shadow-lg' : 'border-border'} ${isDisabled ? 'opacity-70' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div>
              <Skeleton className="h-7 w-48 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[260px] w-full flex items-center justify-center">
            <Skeleton className="h-[220px] w-[95%] mx-auto" />
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-4">
          <Button 
            variant="outline" 
            className="w-full" 
            disabled
          >
            Select
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render error state with more detailed information
  if (error) {
    return (
      <Card className={`overflow-hidden border-2 transition-all duration-200 ${isSelected ? 'border-primary shadow-lg' : 'border-border'} ${isDisabled ? 'opacity-70' : ''}`}>
        <CardHeader>
          <CardTitle className="text-lg">{companyName}</CardTitle>
          <div className="text-sm text-muted-foreground">{ticker}</div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[200px] gap-2">
          <AlertCircle className="h-8 w-8 text-destructive mb-1" />
          <div className="text-destructive font-medium mb-1">Unable to load stock data</div>
          <p className="text-sm text-muted-foreground text-center max-w-[250px]">{error}</p>
          <div className="mt-2 border p-2 rounded text-xs text-muted-foreground bg-muted/30">
            <p>Exchange: {exchange || 'Unknown'}</p>
            <p>Sector: {sector || 'Unknown'}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant={isSelected ? "default" : "outline"}
            className="w-full" 
            onClick={onSelect}
            disabled={isDisabled}
          >
            {isSelected ? "Selected" : "Select"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Simple variant (matches financial-tech minimalism design)
  if (variant === "simple" && metrics) {
    return (
      <Card className={`overflow-hidden border-2 transition-all duration-200 ${isSelected ? 'border-primary shadow-lg' : 'border-border'} ${isDisabled ? 'opacity-70' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-lg uppercase font-bold">
                {companyName}
              </CardTitle>
              <div className="text-sm text-muted-foreground">{ticker}</div>
            </div>
            <Badge variant="outline" className="font-normal">
              {sector}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="h-[270px]">
              <div className="text-center mt-4">
                <div className="text-3xl font-bold">{formatCurrency(metrics.currentPrice)}</div>
                <div className={`flex items-center justify-center text-sm ${metrics.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.changePercent >= 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="font-medium">
                    {formatCurrency(metrics.changeAmount)} ({formatPercentage(metrics.changePercent)})
                  </span>
                </div>
              </div>
              

              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Market Cap</div>
                  <div className="font-medium">{formatLargeNumber(metrics.marketCap)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">P/E Ratio</div>
                  <div className="font-medium">{metrics.peRatio.toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">52 Week Range</div>
                  <div className="font-medium text-sm">
                    {formatCurrency(metrics.weekRange.low)} - {formatCurrency(metrics.weekRange.high)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Dividend Yield</div>
                  <div className="font-medium">{(metrics.dividendYield * 100).toFixed(2)}%</div>
                </div>
              </div>
              

            </TabsContent>
            
            <TabsContent value="metrics" className="h-[270px]">
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="col-span-2 space-y-1">
                  <div className="text-xs text-muted-foreground">Current Price</div>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold">{formatCurrency(metrics.currentPrice)}</div>
                    <div className={`text-sm font-medium ${metrics.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {metrics.changePercent >= 0 ? <span>↑</span> : <span>↓</span>} {formatPercentage(metrics.changePercent)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Company</div>
                  <div className="font-medium flex items-center">
                    <Building2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {companyName}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Exchange</div>
                  <div className="font-medium flex items-center">
                    <Globe className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {exchange}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Market Cap</div>
                  <div className="font-medium flex items-center">
                    <DollarSign className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {formatLargeNumber(metrics.marketCap)}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Trend</div>
                  <div className="font-medium flex items-center">
                    {metrics.changePercent >= 0 ? (
                      <>
                        <TrendingUp className="h-3.5 w-3.5 mr-1 text-green-500" />
                        <span className="text-green-500">Bullish</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3.5 w-3.5 mr-1 text-red-500" />
                        <span className="text-red-500">Bearish</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="chart" className="h-[270px]">
              <div className="flex justify-between items-center mb-2">
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                >
                  <BarChart className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="relative h-[220px] w-full border border-border rounded-md overflow-hidden">
                {chartData && chartData.length > 0 ? (
                  <CandlestickChart
                    data={chartData.slice(-parseInt(timeframe))}
                    ticker={ticker}
                    companyName={companyName}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm">No chart data available</div>
                  </div>
                )}
              </div>
              {showDebugPanel && chartData.length > 0 && (
                <ChartDebugPanel
                  ticker={ticker}
                  data={chartData}
                  onClose={() => setShowDebugPanel(false)}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="pt-0 pb-4 flex flex-col gap-2">
          <Button 
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => window.open(getExchangeURL(ticker, exchange), '_blank', 'noopener,noreferrer')}
          >
            <Globe className="h-4 w-4 mr-2" />
            Go to Official Webpage
          </Button>
          <Button 
            variant={isSelected ? "default" : "outline"}
            className="w-full" 
            onClick={onSelect}
            disabled={isDisabled}
          >
            {isSelected ? "Selected" : "Select"}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Detailed variant (full financial data display)
  return (
    <Card className={`overflow-hidden border-2 transition-all duration-200 ${isSelected ? 'border-primary shadow-lg' : 'border-border'} ${isDisabled ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg">{companyName}</CardTitle>
          <Badge variant="outline" className="font-normal">
            {ticker}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {metrics && (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-1 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Current Price</span>
                </div>
                <div className="flex items-center">
                  {metrics.changePercent >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                  )}
                  <span className="text-sm">Change</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <div className="text-2xl font-bold">{formatCurrency(metrics.currentPrice)}</div>
                <div className={`text-sm font-medium ${metrics.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(metrics.changeAmount)}
                  <span className="ml-1">({formatPercentage(metrics.changePercent)})</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Market Cap</span>
                <span className="text-sm font-medium">{formatLargeNumber(metrics.marketCap)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">P/E Ratio</span>
                <span className="text-sm font-medium">{metrics.peRatio.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">52 Week Range</span>
                <span className="text-sm font-medium whitespace-nowrap">
                  {formatCurrency(metrics.weekRange.low)} - {formatCurrency(metrics.weekRange.high)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dividend Yield</span>
                <span className="text-sm font-medium">{(metrics.dividendYield * 100).toFixed(2)}%</span>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">30-Day Price History</span>
                <div className="flex items-center text-xs">
                  <div className="flex items-center mr-2">
                    <div className="w-3 h-3 bg-green-500 mr-1"></div>
                    <span>Up</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 mr-1"></div>
                    <span>Down</span>
                  </div>
                </div>
              </div>
              
              <div className="relative h-[180px] w-full border border-border rounded-md overflow-hidden">
                {chartData && chartData.length > 0 ? (
                  <div className="h-full">
                    <CandlestickChart
                      data={chartData.slice(-30)} 
                      ticker={ticker}
                      companyName={companyName}
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm">No chart data available</div>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-center text-muted-foreground mt-2">
                Hover over the chart to see detailed price information
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                >
                  <BarChart className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(getExchangeURL(ticker, exchange), '_blank', 'noopener,noreferrer')}
                  className="text-xs"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Go to official webpage
                </Button>
              </div>
              
              {showDebugPanel && chartData.length > 0 && (
                <ChartDebugPanel
                  ticker={ticker}
                  data={chartData}
                  onClose={() => setShowDebugPanel(false)}
                />
              )}

            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => window.open(getExchangeURL(ticker, exchange), '_blank', 'noopener,noreferrer')}
        >
          <Globe className="h-4 w-4 mr-2" />
          Go to Official Webpage
        </Button>
        <Button 
          variant={isSelected ? "default" : "outline"}
          className="w-full" 
          onClick={onSelect}
          disabled={isDisabled}
        >
          {isSelected ? "Selected" : "Choose This Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StockCard;