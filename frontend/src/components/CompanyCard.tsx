import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Globe, TrendingUp, TrendingDown, BarChart3, ChevronDown, ChevronUp, CandlestickChart as ChartCandlestick, DollarSign } from 'lucide-react';
import CompanyFinancialCard from './CompanyFinancialCard';
import { fetchCompanyData, formatNumber, formatPercent } from '../utils/stockApi';
import { Company } from '../utils/companyTypes';

interface CompanyCardProps {
  company: Company;
  performance: number | null;
  onClick: () => void;
  selected: boolean;
  disabled: boolean;
  winner: boolean;
}

// Company data interface for fetched data
interface CompanyData {
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  peRatio: number | null;
  dividend: number | null;
  high52Week: number | null;
  low52Week: number | null;
  loading: boolean;
  error: string | null;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ 
  company, 
  performance, 
  onClick, 
  selected, 
  disabled,
  winner
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [companyData, setCompanyData] = useState<CompanyData>({
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
    error: null
  });

  // Fetch company data when details are shown
  useEffect(() => {
    if (showDetails && !companyData.loading && !companyData.price) {
      const loadData = async () => {
        setCompanyData(prev => ({ ...prev, loading: true }));
        try {
          const data = await fetchCompanyData(company.ticker);
          setCompanyData(data);
        } catch (err) {
          setCompanyData(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load company data'
          }));
          console.error('Error loading company data:', err);
        }
      };
      
      loadData();
    }
  }, [showDetails, company.ticker, companyData.loading, companyData.price]);

  const getBorderStyle = () => {
    if (disabled) {
      if (winner) return "border-green-500";
      if (selected) return "border-red-500";
      return "border-muted";
    }
    if (selected) return "border-primary";
    return "border";
  };

  const getPerformanceColor = () => {
    if (performance === null) return "text-muted-foreground";
    return performance >= 0 ? "text-green-500" : "text-red-500";
  };

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  return (
    <Card 
      className={`overflow-hidden ${getBorderStyle()} transition-all duration-200 ${disabled ? 'opacity-80' : ''} shadow-md`}
      onClick={() => !disabled && onClick()}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{company.name}</CardTitle>
            <div className="text-sm text-muted-foreground">{company.ticker}</div>
          </div>
          <Badge variant="outline" className="font-normal">
            {company.exchange.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{company.sector.charAt(0).toUpperCase() + company.sector.slice(1)}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{company.exchange.toUpperCase()}</span>
          </div>

          {performance !== null && (
            <div className="flex items-center text-sm mt-2">
              {performance >= 0 ? (
                <TrendingUp className={`h-4 w-4 mr-2 ${getPerformanceColor()}`} />
              ) : (
                <TrendingDown className={`h-4 w-4 mr-2 ${getPerformanceColor()}`} />
              )}
              <span className={`font-medium ${getPerformanceColor()}`}>
                {performance >= 0 ? '+' : ''}{performance.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <Separator className="my-4" />
        
        {/* Market Data Section with Candlestick Chart - From Bolt project */}
        <div className="mt-3">
          <button 
            onClick={toggleDetails}
            className="w-full flex items-center justify-between py-2 px-3 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium text-foreground"
          >
            <span className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Market Data & Price Chart
            </span>
            {showDetails ? 
              <ChevronUp className="w-4 h-4" /> : 
              <ChevronDown className="w-4 h-4" />
            }
          </button>
          
          {showDetails && (
            <div className="mt-3 bg-muted/30 p-3 rounded-md text-sm">
              {companyData.loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-pulse flex space-x-2">
                    <div className="h-2 w-2 bg-primary rounded-full"></div>
                    <div className="h-2 w-2 bg-primary rounded-full"></div>
                    <div className="h-2 w-2 bg-primary rounded-full"></div>
                  </div>
                </div>
              ) : companyData.error ? (
                <div className="text-destructive text-center py-2">{companyData.error}</div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                    {/* Current Price */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-muted-foreground">Current Price</span>
                      </div>
                      <span className="font-semibold">${companyData.price?.toFixed(2) || 'N/A'}</span>
                    </div>
                    
                    {/* Price Change */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {companyData.change && companyData.change >= 0 ? 
                          <TrendingUp className="w-4 h-4 mr-1 text-green-500" /> : 
                          <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
                        }
                        <span className="text-muted-foreground">Change</span>
                      </div>
                      <span className={`font-semibold ${companyData.change === null ? 'text-muted-foreground' : companyData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {companyData.change !== null ? 
                          `${companyData.change >= 0 ? '+' : ''}${companyData.change.toFixed(2)} (${formatPercent(companyData.changePercent)})` : 
                          'N/A'}
                      </span>
                    </div>
                    
                    {/* Market Cap */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-muted-foreground">Market Cap</span>
                      </div>
                      <span className="font-semibold">{formatNumber(companyData.marketCap)}</span>
                    </div>
                    
                    {/* P/E Ratio */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-muted-foreground">P/E Ratio</span>
                      </div>
                      <span className="font-semibold">
                        {companyData.peRatio !== null ? companyData.peRatio.toFixed(2) : 'N/A'}
                      </span>
                    </div>
                    
                    {/* 52 Week Range */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-muted-foreground">52 Week Range</span>
                      </div>
                      <span className="font-semibold">
                        {companyData.low52Week !== null && companyData.high52Week !== null ? 
                          `$${companyData.low52Week.toFixed(2)} - $${companyData.high52Week.toFixed(2)}` : 
                          'N/A'}
                      </span>
                    </div>
                    
                    {/* Dividend Yield */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-muted-foreground">Dividend Yield</span>
                      </div>
                      <span className="font-semibold">
                        {companyData.dividend !== null ? 
                          (companyData.dividend > 0 ? `${companyData.dividend.toFixed(2)}%` : 'None') : 
                          'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Candlestick Chart via CompanyFinancialCard */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium text-foreground flex items-center mb-2">
                      <ChartCandlestick className="w-4 h-4 mr-1" />
                      30-Day Price History
                    </h4>
                    <CompanyFinancialCard ticker={company.ticker} companyName={company.name} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Button 
          variant={selected ? "default" : "outline"}
          className="w-full mt-4" 
          onClick={() => !disabled && onClick()}
          disabled={disabled}
        >
          {winner ? (
            "Winner"
          ) : selected ? (
            "Selected"
          ) : (
            "Select"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CompanyCard;