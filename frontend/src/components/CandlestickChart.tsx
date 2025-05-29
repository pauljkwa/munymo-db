// Simplified imports for Chart initialization
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import { Activity, TrendingUp, TrendingDown, AlertCircle, GitCommit } from 'lucide-react';


// Export types but move component to separate file
export interface CandlestickDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CandlestickChartProps {
  data?: CandlestickDataPoint[];
  ticker?: string;
  companyName?: string;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ 
  data,
  ticker,
  companyName
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Format the data for the chart
  const [chartData, setChartData] = useState<CandlestickDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch data when ticker changes
  useEffect(() => {
    if (!ticker) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (data && data.length > 0) {
          setChartData(data);
        } else {
          throw new Error('No chart data provided');
        }
      } catch (err: any) {
        console.error(`Error loading chart data for ${ticker}:`, err);
        setError(err.message || 'Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [ticker, data]);

// Update useEffect in CandlestickChart to add more detailed logging and validation

  // Validate data before rendering with improved diagnostics
  useEffect(() => {
    // Enhanced data validation and logging
    if (chartData && chartData.length > 0) {
      const nanCount = chartData.filter(d => 
        isNaN(d.open) || isNaN(d.high) || isNaN(d.low) || isNaN(d.close)
      ).length;
      
      const invalidRangeCount = chartData.filter(d => 
        !isNaN(d.high) && !isNaN(d.low) && d.high < d.low
      ).length;
      
      const zeroOrNegativeCount = chartData.filter(d => 
        !isNaN(d.high) && !isNaN(d.low) && (d.high <= 0 || d.low <= 0)
      ).length;
      
      const validPoints = chartData.filter(d => 
        !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close) &&
        d.high >= d.low && d.high > 0 && d.low > 0
      ).length;
      
      // Calculate price metrics
      const prices = chartData
        .filter(d => !isNaN(d.close))
        .map(d => d.close);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const priceVariation = minPrice > 0 ? ((maxPrice - minPrice) / minPrice) * 100 : 0;
      
      console.log(`[CandlestickChart] Data validation for ${ticker}:`, {
        totalPoints: chartData.length,
        validPoints,
        nanValues: nanCount,
        invalidRanges: invalidRangeCount,
        zeroOrNegativeValues: zeroOrNegativeCount,
        priceRange: `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`,
        priceVariation: `${priceVariation.toFixed(2)}%`,
        first: chartData[0],
        last: chartData[chartData.length - 1],
        sampleMid: chartData[Math.floor(chartData.length / 2)],
      });
      
      // Log warnings for problematic data
      if (nanCount > 0 || invalidRangeCount > 0 || zeroOrNegativeCount > 0) {
        console.warn(`[CandlestickChart] Chart data for ${ticker} contains ${nanCount + invalidRangeCount + zeroOrNegativeCount} problematic points`);
      }
      
      // Log warning for insufficient price variation which affects chart readability
      if (priceVariation < 0.5) {
        console.warn(`[CandlestickChart] Low price variation for ${ticker}: only ${priceVariation.toFixed(2)}% which may affect chart readability`);
      }
    } else {
      console.warn(`[CandlestickChart] No data available for ${ticker}`);
    }
  }, [chartData, ticker]);

  // Calculate EMA for the dataset
  const calculateEMA = (data: number[], period: number) => {
    const k = 2/(period + 1);
    let emaArray = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      emaArray.push((data[i] * k) + (emaArray[i-1] * (1-k)));
    }
    
    return emaArray;
  };

  // Create or update chart when data changes
  useEffect(() => {
    if (!chartRef.current || !chartData || chartData.length === 0) return;

    try {
      // Validate and fix the data before chart creation with comprehensive approach
      // We'll attempt repairs progressively with detailed logging
      console.log(`[CandlestickChart] Starting data validation for ${ticker} with ${chartData.length} points`);
      
      // STEP 1: Create a deep copy to avoid mutating original data
      const fixedData = chartData.map(item => ({ ...item }));
      
      // STEP 2: Detect and count issues before fixing
      const initialDiagnostics = {
        nanValues: fixedData.filter(d => isNaN(d.open) || isNaN(d.high) || isNaN(d.low) || isNaN(d.close)).length,
        invertedRange: fixedData.filter(d => !isNaN(d.high) && !isNaN(d.low) && d.high < d.low).length,
        negativeValues: fixedData.filter(d => d.open <= 0 || d.high <= 0 || d.low <= 0 || d.close <= 0).length,
        missingDates: fixedData.filter(d => !d.date).length
      };
      
      console.log(`[CandlestickChart] Initial issues detected for ${ticker}:`, initialDiagnostics);
      
      // STEP 3: Apply fixes to each data point
      let fixedCount = 0;
      
      for (let i = 0; i < fixedData.length; i++) {
        const point = fixedData[i];
        let pointFixed = false;
        
        // Fix 1: Handle NaN values using nearby data or reasonable defaults
        if (isNaN(point.close)) {
          // Try to use values from adjacent points for better continuity
          const prevPoint = i > 0 ? fixedData[i-1] : null;
          const nextPoint = i < fixedData.length-1 ? fixedData[i+1] : null;
          
          if (prevPoint && !isNaN(prevPoint.close)) {
            point.close = prevPoint.close;
          } else if (nextPoint && !isNaN(nextPoint.close)) {
            point.close = nextPoint.close;
          } else if (!isNaN(point.open)) {
            point.close = point.open;
          } else {
            // Last resort - use a default value based on ticker seed for consistency
            const tickerSum = ticker.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
            point.close = 10 + (tickerSum % 90); // Generate a value between 10-100
          }
          pointFixed = true;
        }
        
        // Repeat similar approach for other OHLC values
        if (isNaN(point.open)) {
          point.open = point.close;
          pointFixed = true;
        }
        
        if (isNaN(point.high)) {
          point.high = Math.max(point.open, point.close);
          pointFixed = true;
        }
        
        if (isNaN(point.low)) {
          point.low = Math.min(point.open, point.close);
          pointFixed = true;
        }
        
        // Fix 2: Ensure high is at least equal to the maximum of open and close
        if (point.high < Math.max(point.open, point.close)) {
          point.high = Math.max(point.open, point.close) * 1.001; // Add small buffer
          pointFixed = true;
        }
        
        // Fix 3: Ensure low is at most equal to the minimum of open and close
        if (point.low > Math.min(point.open, point.close)) {
          point.low = Math.min(point.open, point.close) * 0.999; // Subtract small buffer
          pointFixed = true;
        }
        
        // Fix 4: Ensure all values are positive
        if (point.low <= 0) {
          const smallValue = 0.01;
          point.low = smallValue;
          if (point.open <= smallValue) point.open = smallValue * 1.1;
          if (point.close <= smallValue) point.close = smallValue * 1.2;
          if (point.high <= smallValue) point.high = Math.max(point.open, point.close) * 1.05;
          pointFixed = true;
        }
        
        // Fix 5: Ensure high/low relationship is correct
        if (point.high < point.low) {
          const temp = point.high;
          point.high = point.low;
          point.low = temp;
          pointFixed = true;
        }
        
        if (pointFixed) fixedCount++;
      }
      
      // STEP 4: Final validation - only remove points that couldn't be fixed
      const validData = fixedData.filter(item => 
        !isNaN(item.open) && !isNaN(item.high) && !isNaN(item.low) && !isNaN(item.close) &&
        item.high >= item.low && item.high > 0 && item.low > 0 && item.date
      );
      
      // STEP 5: Detailed logging of results
      console.log(`[CandlestickChart] Data validation results for ${ticker}:`, {
        totalPoints: chartData.length,
        fixedPoints: fixedCount,
        validPoints: validData.length,
        removedPoints: chartData.length - validData.length,
        sample: validData.length > 0 ? {
          first: validData[0],
          last: validData[validData.length-1],
          mid: validData[Math.floor(validData.length/2)]
        } : 'No valid points'
      });
      
      if (validData.length === 0) {
        console.error(`[CandlestickChart] No valid data points for ${ticker} after fixing attempts`);
        setError('Unable to display chart: No valid data points after correction attempts');
        return;
      } else if (validData.length < chartData.length) {
        console.warn(`[CandlestickChart] ${chartData.length - validData.length} invalid data points were removed for ${ticker} after fixes`);
      }
      
      // Extract data for chart
      const labels = validData.map(item => format(new Date(item.date), 'MMM dd'));
      const closes = validData.map(item => item.close);
      
      // Calculate EMAs
      const ema9 = calculateEMA(closes, 9);
      const ema20 = calculateEMA(closes, 20);
      
      // Calculate a custom color scale based on price action
      const upDays = validData.filter(d => d.close > d.open).length;
      const trend = upDays / validData.length;
      
      const colorScale = {
        borderColor: trend > 0.6 ? 'rgb(16, 185, 129)' : 
                   trend < 0.4 ? 'rgb(239, 68, 68)' : 
                   'rgb(250, 204, 21)',
        backgroundColor: trend > 0.6 ? 'rgba(16, 185, 129, 0.1)' : 
                        trend < 0.4 ? 'rgba(239, 68, 68, 0.1)' : 
                        'rgba(250, 204, 21, 0.1)'
      };
      
      // Destroy previous chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Create new chart
      chartInstance.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              type: 'line',
              label: ticker || 'Price',
              data: validData.map(d => d.close),
              borderColor: colorScale.borderColor,
              backgroundColor: colorScale.backgroundColor,
              borderWidth: 2,
              fill: true,
              tension: 0.3,
              pointRadius: 0.5,
              pointHoverRadius: 3,
            },
            {
              type: 'line',
              label: 'EMA-9',
              data: ema9,
              borderColor: 'rgba(59, 130, 246, 0.8)',
              borderWidth: 1.5,
              borderDash: [3, 3],
              fill: false,
              tension: 0.4,
              pointRadius: 0,
            },
            {
              type: 'line',
              label: 'EMA-20',
              data: ema20,
              borderColor: 'rgba(139, 92, 246, 0.8)',
              borderWidth: 1.5,
              borderDash: [3, 3],
              fill: false,
              tension: 0.4,
              pointRadius: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 8,
              },
            },
            y: {
              type: 'linear',
              position: 'right',
              grid: {
                display: true,
                drawBorder: false,
                color: 'rgba(255, 255, 255, 0.1)',
              },
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                },
                padding: 10,
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                title: function(tooltipItems) {
                  const index = tooltipItems[0].dataIndex;
                  return validData[index].date;
                },
                label: function(context) {
                  const dataIndex = context.dataIndex;
                  const datasetIndex = context.datasetIndex;
                  
                  if (datasetIndex === 0) {
                    const dataPoint = validData[dataIndex];
                    return [
                      `Open: $${dataPoint.open.toFixed(2)}`,
                      `High: $${dataPoint.high.toFixed(2)}`,
                      `Low: $${dataPoint.low.toFixed(2)}`,
                      `Close: $${dataPoint.close.toFixed(2)}`,
                    ];
                  } else if (datasetIndex === 1) {
                    return `EMA-9: $${ema9[dataIndex].toFixed(2)}`;
                  } else {
                    return `EMA-20: $${ema20[dataIndex].toFixed(2)}`;
                  }
                }
              }
            },
            legend: {
              display: false,
            },
            title: {
              display: false,
            },
          },
        },
      });
      
      // Clear any previous errors since we succeeded
      setError(null);
      
    } catch (err: any) {
      console.error(`[CandlestickChart] Error rendering chart for ${ticker}:`, err);
      setError(err.message || 'Failed to render chart');
    }

    // Cleanup function to destroy chart when component unmounts
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData, ticker]);

  // Handle loading and error states with consistent sizing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full min-h-[300px]" style={{ aspectRatio: '16/9' }}>
        <div className="animate-pulse flex flex-col items-center space-y-2">
          <div className="flex space-x-2">
            <div className="h-2 w-2 bg-primary rounded-full"></div>
            <div className="h-2 w-2 bg-primary rounded-full"></div>
            <div className="h-2 w-2 bg-primary rounded-full"></div>
          </div>
          <span className="text-xs text-muted-foreground">Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full min-h-[300px]" style={{ aspectRatio: '16/9' }}>
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive font-medium mb-1">Chart Error</p>
        <p className="text-sm text-muted-foreground text-center max-w-[80%]">{error}</p>
        {ticker && (
          <div className="mt-4 text-xs text-muted-foreground">
            <p>Ticker: {ticker}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full min-h-[300px]" style={{ aspectRatio: '16/9' }}>
      <canvas ref={chartRef} className="w-full h-full" />
      {/* Add a subtle label overlay with the ticker symbol */}
      {ticker && (
        <div className="absolute top-2 left-2 text-xs font-mono opacity-60 bg-background/30 px-1 rounded">
          {ticker}
        </div>
      )}
    </div>
  );
};



// Remove ChartDebugPanel export as it's now moved to its own file

export default CandlestickChart;
