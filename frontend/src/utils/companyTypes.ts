// Company types for the CompanyCard component
export interface Company {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  exchange: string;
  description?: string;
}

export interface CompanyData {
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