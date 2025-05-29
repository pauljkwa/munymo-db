import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { fetchCandlestickData, getTestTickers } from '../utils/stockApi';
import CandlestickChart, { CandlestickDataPoint } from '../components/CandlestickChart';
import { ArrowLeftIcon, ArrowRightIcon, HomeIcon, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TestResult {
  ticker: string;
  success: boolean;
  error?: string;
  data?: {
    points: number;
    firstDate: string;
    lastDate: string;
    priceRange: [number, number];
  };
}

const ChartTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTicker, setSelectedTicker] = useState<string>('AAPL');
  const [customTicker, setCustomTicker] = useState<string>('');
  const [chartData, setChartData] = useState<CandlestickDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('14');
  
  const loadTickerData = async (ticker: string) => {
    if (!ticker) return;
    
    setLoading(true);
    setError(null);
    setSelectedTicker(ticker);
    setChartData([]);
    
    try {
      const data = await fetchCandlestickData(ticker);
      
      if (!data || data.length === 0) {
        throw new Error(`No data returned for ${ticker}`);
      }
      
      setChartData(data);
    } catch (err: any) {
      console.error(`Error loading chart data for ${ticker}:`, err);
      setError(err.message || 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTickerSelect = (ticker: string) => {
    loadTickerData(ticker);
  };
  
  const handleCustomTickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTicker.trim()) {
      loadTickerData(customTicker.trim());
    }
  };
  
  useEffect(() => {
    // Load a default ticker on mount
    loadTickerData(selectedTicker);
  }, []);
  
  const testTickers = getTestTickers().slice(0, 8);
  
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <HomeIcon className="h-4 w-4" />
          </Button>
        </div>
        <h1 className="text-2xl font-bold">Chart Testing</h1>
        <Button variant="outline" size="icon" onClick={() => navigate(1)}>
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Candlestick Chart Tester</CardTitle>
          <CardDescription>
            View and test candlestick charts for different tickers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <form onSubmit={handleCustomTickerSubmit} className="flex space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="custom-ticker" className="sr-only">Custom Ticker</Label>
                    <Input 
                      id="custom-ticker" 
                      placeholder="Enter ticker (e.g., AAPL, MSFT.US, BHP.AX)" 
                      value={customTicker}
                      onChange={(e) => setCustomTicker(e.target.value)}
                    />
                  </div>
                  <Button type="submit">Load</Button>
                </form>
              </div>
              
              <div>
                <Select 
                  value={timeframe} 
                  onValueChange={setTimeframe}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mt-2">
              {testTickers.map((ticker) => (
                <Button 
                  key={ticker} 
                  variant={selectedTicker === ticker ? "default" : "outline"} 
                  onClick={() => handleTickerSelect(ticker)}
                  size="sm"
                >
                  {ticker}
                </Button>
              ))}
            </div>
            
            <Separator className="my-2" />
            
            <div className="h-[400px] mt-2 relative border border-border rounded-md overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-pulse flex flex-col items-center space-y-2">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                    </div>
                    <span className="text-xs text-muted-foreground">Loading chart data...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-destructive mb-2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-destructive font-medium mb-1">Chart Error</p>
                  <p className="text-sm text-muted-foreground text-center">{error}</p>
                </div>
              ) : chartData.length > 0 ? (
                <CandlestickChart 
                  data={chartData.slice(-parseInt(timeframe))} 
                  ticker={selectedTicker} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-muted-foreground">Select a ticker to view chart</p>
                </div>
              )}
            </div>
            
            {chartData.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-xs">
                <div>
                  <Label className="text-muted-foreground">Data Points</Label>
                  <p className="font-medium">{chartData.length}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date Range</Label>
                  <p className="font-medium">{chartData[0]?.date} to {chartData[chartData.length-1]?.date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Price Range</Label>
                  <p className="font-medium">
                    ${Math.min(...chartData.map(d => Math.min(d.low, d.open, d.close))).toFixed(2)} - 
                    ${Math.max(...chartData.map(d => Math.max(d.high, d.open, d.close))).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Variation</Label>
                  <p className="font-medium">
                    {((
                      Math.max(...chartData.map(d => d.high)) - 
                      Math.min(...chartData.map(d => d.low))
                    ) / Math.min(...chartData.map(d => d.low)) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartTestPage;
