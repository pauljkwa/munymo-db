// Helper function to calculate EMA
const calculateEMA = (data: CandlestickData[], period: number) => {
  const k = 2 / (period + 1);
  let emaData: { time: any; value: number; }[] = [];
  
  let ema = data[0].close; // Initial SMA value
  emaData.push({ time: data[0].time, value: ema });
  
  for (let i = 1; i < data.length; i++) {
    ema = (data[i].close - ema) * k + ema;
    emaData.push({ time: data[i].time, value: ema });
  }
  
  return emaData;
};
import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineStyle } from 'lightweight-charts';

interface CandlestickDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingViewChartProps {
  data: CandlestickDataPoint[];
  width?: number;
  height?: number;
  ticker?: string; // Added ticker for watermark
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  data,
  width = 600,
  height = 300,
  ticker
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Format the data for the chart
  const formattedData = data.map(item => ({
    time: typeof item.date === 'string' ? item.date.substring(0, 10) : item.date,
    open: Number(item.open),
    high: Number(item.high),
    low: Number(item.low),
    close: Number(item.close)
  }));

  // Filter out invalid data points
  const validData = formattedData.filter(
    item => !isNaN(item.open) && !isNaN(item.high) && !isNaN(item.low) && !isNaN(item.close) && 
           item.high >= item.low // Ensure high is greater than or equal to low
  ) as CandlestickData[];

  // Log some points for debugging
  console.log(`[DEBUG] TradingViewChart: ${validData.length} valid data points out of ${formattedData.length} total`);
  if (validData.length > 0) {
    // Log first and last points
    console.log('[DEBUG] First point:', validData[0]);
    console.log('[DEBUG] Last point:', validData[validData.length - 1]);
    
    // Check for small price differences (flat prices)
    const priceValues = validData.flatMap(item => [item.open, item.high, item.low, item.close]);
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);
    console.log(`[DEBUG] Price range: ${minPrice.toFixed(4)} to ${maxPrice.toFixed(4)}, diff: ${(maxPrice - minPrice).toFixed(4)}`);
    
    // Log bearish vs bullish candles count
    const bearishCount = validData.filter(item => item.close < item.open).length;
    const bullishCount = validData.filter(item => item.close > item.open).length;
    const neutralCount = validData.filter(item => item.close === item.open).length;
    console.log(`[DEBUG] Candle types: ${bullishCount} bullish, ${bearishCount} bearish, ${neutralCount} neutral`);
  }

  // Initialize the chart
  useEffect(() => {
    if (chartContainerRef.current && validData.length > 0) {
      // Clear previous chart if it exists
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
      
      // Check for container dimensions
      const containerWidth = chartContainerRef.current.clientWidth || width;
      console.log(`[DEBUG] Chart container width: ${containerWidth}`);

      // Create a new chart with improved styling
      const chart = createChart(chartContainerRef.current, {
        width: containerWidth,
        height: height,
        layout: {
          background: { type: 'solid', color: 'transparent' },
          textColor: '#d1d5db',
          fontSize: 12,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.2)', style: LineStyle.Dotted },
          horzLines: { color: 'rgba(42, 46, 57, 0.2)', style: LineStyle.Dotted },
        },
        crosshair: {
          mode: 1,
          vertLine: { width: 1, color: '#758696', style: 3 },
          horzLine: { width: 1, color: '#758696', style: 3 },
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.3)',
          timeVisible: true,
          secondsVisible: false,
          borderVisible: true,
          rightOffset: 5,
          barSpacing: 12, // Wider spacing between candles
          fixLeftEdge: true,
          fixRightEdge: true,
        },
        priceScale: {
          borderColor: 'rgba(197, 203, 206, 0.3)',
          scaleMargins: { top: 0.1, bottom: 0.2 },
          borderVisible: true,
          alignLabels: true,
          autoScale: true,
        },
        handleScale: true,
        handleScroll: true,
        watermark: {
          visible: true,
          fontSize: 24,
          horzAlign: 'center',
          vertAlign: 'center',
          color: 'rgba(120, 123, 134, 0.1)',
          text: ticker || ' ',
        },
      });
      
      // Store chart reference
      chartRef.current = chart;

      // Add candlestick series with improved styling
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#22c55e', // Brighter green
        downColor: '#ef4444', // Brighter red
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#16a34a',
        wickDownColor: '#dc2626',
        priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
      });
      
      // Store series reference
      candlestickSeriesRef.current = candlestickSeries;

      // Examine the data for potential issues
      const priceValues = validData.flatMap(item => [item.open, item.high, item.low, item.close]);
      const minPrice = Math.min(...priceValues);
      const maxPrice = Math.max(...priceValues);
      const range = maxPrice - minPrice;
      const meanPrice = priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
      
      console.log(`[DEBUG] Price statistics: min=${minPrice.toFixed(4)}, max=${maxPrice.toFixed(4)}, mean=${meanPrice.toFixed(4)}, range=${range.toFixed(4)}`);
      
      // Always set the data first
      candlestickSeries.setData(validData);
      
      // For stocks with minimal price movement, ensure visible movement
      if (range < 0.01 && minPrice > 0) {
        // Set fixed price range for very small movements
        console.log('[DEBUG] Detected low volatility stock, applying special visualization settings');
        const buffer = meanPrice * 0.02; // 2% buffer
        
        // Apply visible range with padding
        candlestickSeries.priceScale().applyOptions({
          autoScale: false,
          scaleMargins: { top: 0.2, bottom: 0.2 },
          // Set min and max values instead of using setVisibleRange
          minimum: Math.max(0, minPrice - buffer),
          maximum: maxPrice + buffer
        });
      }
      
      // Add EMA indicators for better analysis
      if (validData.length >= 9) {
        try {
          // Calculate EMAs
          const ema9Data = calculateEMA(validData, 9);
          const lineSeries = chart.addLineSeries({
            color: '#34d399', // Green
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          lineSeries.setData(ema9Data);
          
          if (validData.length >= 20) {
            const ema20Data = calculateEMA(validData, 20);
            const lineSeries2 = chart.addLineSeries({
              color: '#60a5fa', // Blue
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            lineSeries2.setData(ema20Data);
          }
        } catch (err) {
          console.warn('[DEBUG] Error adding EMA indicators:', err);
        }
      }
      
      // Fit the content after all data is loaded
      chart.timeScale().fitContent();

      // Handle window resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          const newWidth = chartContainerRef.current.clientWidth;
          chartRef.current.applyOptions({ width: newWidth });
          chartRef.current.timeScale().fitContent();
        }
      };

      // Set up resize handler
      window.addEventListener('resize', handleResize);

      // Clean up
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          candlestickSeriesRef.current = null;
        }
      };
    }
  }, [data, width, height]);

  // Return early with a message if no valid data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No candlestick data available
      </div>
    );
  }

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No valid candlestick data available
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <div 
        ref={chartContainerRef} 
        className="w-full h-full" 
        style={{ position: 'relative' }}
      />
    </div>
  );
};

export default TradingViewChart;