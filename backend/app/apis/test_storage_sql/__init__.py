# SQL statements for creating test storage tables in Supabase
from fastapi import APIRouter

# Create router - required for all API modules
router = APIRouter(tags=["Testing"])

# Test Results Table
CREATE_TEST_RESULTS_TABLE = """
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id TEXT NOT NULL,
    config JSONB,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL,
    summary JSONB,
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by run_id
CREATE INDEX IF NOT EXISTS idx_test_results_run_id ON test_results(run_id);

-- RLS Policy for test_results
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for all authenticated users" 
    ON test_results FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Allow full access to service role
CREATE POLICY "Allow full access for service role" 
    ON test_results FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');
"""

# Validation Results Table
CREATE_VALIDATION_RESULTS_TABLE = """
CREATE TABLE IF NOT EXISTS validation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    success BOOLEAN NOT NULL,
    message TEXT,
    results JSONB,
    timestamp TIMESTAMP WITH TIME ZONE,
    ci_build_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by ci_build_id
CREATE INDEX IF NOT EXISTS idx_validation_results_ci_build_id ON validation_results(ci_build_id);

-- RLS Policy for validation_results
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for all authenticated users" 
    ON validation_results FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Allow full access to service role
CREATE POLICY "Allow full access for service role" 
    ON validation_results FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');
"""

# Coverage Reports Table
CREATE_COVERAGE_REPORTS_TABLE = """
CREATE TABLE IF NOT EXISTS coverage_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE,
    overall_coverage NUMERIC,
    meets_target BOOLEAN,
    target_percentage NUMERIC,
    component_coverage JSONB,
    feature_coverage JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by report_id
CREATE INDEX IF NOT EXISTS idx_coverage_reports_report_id ON coverage_reports(report_id);

-- RLS Policy for coverage_reports
ALTER TABLE coverage_reports ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for all authenticated users" 
    ON coverage_reports FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Allow full access to service role
CREATE POLICY "Allow full access for service role" 
    ON coverage_reports FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');
"""

# SQL to get the latest coverage report
GET_LATEST_COVERAGE_REPORT = """
SELECT * FROM coverage_reports
ORDER BY timestamp DESC
LIMIT 1;
"""

# SQL to get test results by run_id
GET_TEST_RESULTS_BY_RUN_ID = """
SELECT * FROM test_results
WHERE run_id = :run_id;
"""

# SQL to get validation results by ci_build_id
GET_VALIDATION_RESULTS_BY_BUILD_ID = """
SELECT * FROM validation_results
WHERE ci_build_id = :ci_build_id;
"""

# SQL to get coverage report by report_id
GET_COVERAGE_REPORT_BY_ID = """
SELECT * FROM coverage_reports
WHERE report_id = :report_id;
"""
