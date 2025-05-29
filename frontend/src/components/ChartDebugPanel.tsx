import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Info, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { CandlestickDataPoint } from './CandlestickChart';

interface ChartDebugPanelProps {
  ticker?: string;
  data?: CandlestickDataPoint[];
  onClose: () => void;
}

/**
 * A debugging panel component that displays detailed chart data information
 * This is a standalone component to help diagnose chart rendering issues
 * 
 * Features:
 * - Detailed data validation metrics
 * - Price range and variation analysis
 * - Visual indicators for potential issues
 * - Sample data point inspection
 */
export const ChartDebugPanel: React.FC<ChartDebugPanelProps> = ({ 
  ticker, 
  data, 
  onClose 
}) => {
  if (!data || data.length === 0) {
    return (
      <Card className="fixed bottom-4 right-4 w-96 shadow-md z-50 bg-card border-border">
        <CardContent className="pt-4 pb-2 px-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-1 items-center">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Chart Debug: {ticker || 'Unknown'}</h3>
            </div>
            <button 
              onClick={onClose} 
              className="text-muted-foreground hover:text-foreground p-1 rounded-sm hover:bg-muted"
            >
              &times;
            </button>
          </div>
          <div className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-destructive">No data available for analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate key metrics for debugging with expanded analysis
  const nanCount = data.filter(d => 
    isNaN(d.open) || isNaN(d.high) || isNaN(d.low) || isNaN(d.close)
  ).length;
  
  const invalidRangeCount = data.filter(d => 
    !isNaN(d.high) && !isNaN(d.low) && d.high < d.low
  ).length;
  
  const zeroOrNegativeCount = data.filter(d => 
    !isNaN(d.high) && !isNaN(d.low) && (d.high <= 0 || d.low <= 0)
  ).length;
  
  const openCloseIssues = data.filter(d => 
    d.open === d.close && d.high === d.low && d.high === d.open
  ).length;
  
  const validPoints = data.filter(d => 
    !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close) &&
    d.high >= d.low && d.high > 0 && d.low > 0 &&
    !(d.open === d.close && d.high === d.low && d.high === d.open)
  ).length;
  
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd');
    } catch (e) {
      return dateStr;
    }
  };
  
  // Price and trend analysis
  const closes = data.filter(d => !isNaN(d.close)).map(d => d.close);
  const minValue = Math.min(...data.filter(d => !isNaN(d.low)).map(d => d.low));
  const maxValue = Math.max(...data.filter(d => !isNaN(d.high)).map(d => d.high));
  
  // Calculate price variation and trend
  const priceVariation = minValue > 0 ? ((maxValue - minValue) / minValue) * 100 : 0;
  
  // Calculate price trend (positive days vs negative days)
  const upDays = data.filter(d => d.close > d.open).length;
  const downDays = data.filter(d => d.close < d.open).length;
  const flatDays = data.filter(d => d.close === d.open).length;
  
  const trendPercentage = data.length > 0 ? (upDays / data.length) * 100 : 0;
  const trendType = trendPercentage > 60 ? 'bullish' : 
                    trendPercentage < 40 ? 'bearish' : 'neutral';
  
  const statsData = [
    { label: 'Total Points', value: data.length },
    { label: 'Valid Points', value: validPoints },
    { label: 'Invalid Points', value: data.length - validPoints },
    { label: 'NaN Values', value: nanCount },
    { label: 'Invalid Ranges', value: invalidRangeCount },
    { label: 'Zero/Negative', value: zeroOrNegativeCount },
    { label: 'Flat Points', value: openCloseIssues },
    { label: 'Date Range', value: `${formatDate(data[0]?.date)} to ${formatDate(data[data.length-1]?.date)}` },
  ];
  
  const priceStats = [
    { label: 'Price Range', value: `$${minValue?.toFixed(2)} - $${maxValue?.toFixed(2)}` },
    { label: 'Variation %', value: `${priceVariation.toFixed(2)}%` },
    { label: 'Up/Down/Flat', value: `${upDays}/${downDays}/${flatDays}` },
    { label: 'Trend', value: trendType, trend: trendType }
  ];
  
  const issues = [];
  if (nanCount > 0) {
    issues.push(`${nanCount} data points with NaN values`);
  }
  
  if (invalidRangeCount > 0) {
    issues.push(`${invalidRangeCount} points where high < low`);
  }
  
  if (zeroOrNegativeCount > 0) {
    issues.push(`${zeroOrNegativeCount} points with zero/negative values`);
  }
  
  if (openCloseIssues > 0) {
    issues.push(`${openCloseIssues} points with identical OHLC values`);
  }
  
  if (priceVariation < 0.5) {
    issues.push(`Low price variation (${priceVariation.toFixed(2)}%) may affect chart display`);
  }
  
  return (
    <Card className="fixed bottom-4 right-4 w-[380px] shadow-md z-50 bg-card border-border overflow-auto max-h-[80vh]">
      <CardContent className="pt-4 pb-2 px-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-1 items-center">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="font-medium flex items-center gap-1">
              Chart Debug: 
              <Badge variant="outline" className="font-mono text-xs">
                {ticker || 'Unknown'}
              </Badge>
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground p-1 rounded-sm hover:bg-muted"
          >
            &times;
          </button>
        </div>
        
        {/* Overall health status */}
        <div className="mb-3 border rounded-md p-2 bg-muted/30">
          <div className="flex items-center gap-2 mb-1">
            <div className={`h-2 w-2 rounded-full ${validPoints === data.length ? 'bg-green-500' : issues.length > 2 ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <Label className="text-sm font-medium">
              Data Health: {validPoints === data.length ? 'Perfect' : issues.length > 2 ? 'Poor' : 'Fair'}
            </Label>
          </div>
          <div className="text-xs text-muted-foreground">
            {validPoints}/{data.length} valid points ({((validPoints/data.length)*100).toFixed(0)}%)
          </div>
        </div>

        {/* Data statistics */}
        <div className="mb-2">
          <Label className="text-xs font-medium">Data Statistics</Label>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mt-1">
            {statsData.map((stat, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-muted-foreground">{stat.label}</span>
                <span className={`font-medium ${(stat.label.includes('Invalid') || stat.label.includes('NaN') || stat.label.includes('Zero')) && stat.value > 0 ? 'text-destructive' : ''}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price statistics */}
        <div className="mb-2">
          <Label className="text-xs font-medium">Price Statistics</Label>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mt-1">
            {priceStats.map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-muted-foreground">{stat.label}</span>
                <span className={`font-medium flex items-center ${
                  stat.trend === 'bullish' ? 'text-green-500' : 
                  stat.trend === 'bearish' ? 'text-red-500' : ''
                }`}>
                  {stat.trend === 'bullish' && <TrendingUp className="h-3 w-3 mr-1" />}
                  {stat.trend === 'bearish' && <TrendingDown className="h-3 w-3 mr-1" />}
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Issues detected */}
        {issues.length > 0 && (
          <>
            <Separator className="my-2" />
            <div className="text-xs">
              <Label className="text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {issues.length} Issues Detected:
              </Label>
              <ul className="mt-1 ml-4 list-disc text-destructive">
                {issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          </>
        )}
        
        <Separator className="my-2" />
        
        {/* Sample data points */}
        <div className="text-xs">
          <Label className="text-muted-foreground">First Data Point:</Label>
          <pre className="mt-1 p-1.5 bg-muted rounded text-[10px] overflow-auto max-h-16">
            {JSON.stringify(data[0], null, 2)}
          </pre>
        </div>
        
        <div className="text-xs mt-2">
          <Label className="text-muted-foreground">Middle Data Point:</Label>
          <pre className="mt-1 p-1.5 bg-muted rounded text-[10px] overflow-auto max-h-16">
            {JSON.stringify(data[Math.floor(data.length / 2)], null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartDebugPanel;