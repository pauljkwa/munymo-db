# src/app/apis/company_cache/__init__.py
"""
This module contains SQL for company cache tables in Supabase.
"""

from fastapi import APIRouter

# Create router (required for FastAPI to register this module)
router = APIRouter()

# SQL commands to create company cache tables in Supabase
COMPANY_CACHE_TABLES_SQL = """
-- Create company_cache table for storing company listings by exchange
CREATE TABLE IF NOT EXISTS company_cache (
    id SERIAL PRIMARY KEY,
    exchange TEXT NOT NULL,
    data JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(exchange)
);

-- Create index on the exchange field for faster lookups
CREATE INDEX IF NOT EXISTS company_cache_exchange_idx ON company_cache(exchange);

-- Create exchange_calendars table for storing exchange calendars
CREATE TABLE IF NOT EXISTS exchange_calendars (
    id SERIAL PRIMARY KEY,
    exchange TEXT NOT NULL,
    trading_days JSONB NOT NULL,
    holidays JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(exchange)
);

-- Create index on the exchange field for faster lookups
CREATE INDEX IF NOT EXISTS exchange_calendars_exchange_idx ON exchange_calendars(exchange);

-- Create RLS policies
-- For both tables, enable read access for all authenticated users
-- but only allow the service role to write

-- Company cache policies
ALTER TABLE company_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company cache read access for all users"
    ON company_cache
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Company cache write access for service role"
    ON company_cache
    FOR ALL
    TO service_role
    USING (true);

-- Exchange calendars policies
ALTER TABLE exchange_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exchange calendars read access for all users"
    ON exchange_calendars
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Exchange calendars write access for service role"
    ON exchange_calendars
    FOR ALL
    TO service_role
    USING (true);
"""

