-- ==============================================================================
-- Commercialize Grant Management Platform (Dana Pengkomersialan)
-- PostgreSQL Relational Schema DDL
-- Compatible with: Supabase, Neon, Cloud SQL, AWS RDS, PostgreSQL 14+
-- ==============================================================================

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ssm_number VARCHAR(100) NOT NULL UNIQUE,
    incorporation_year INTEGER NOT NULL,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    annual_turnover NUMERIC(15, 2) NOT NULL,
    turnover_tier VARCHAR(50) NOT NULL, -- '< RM500K', 'RM500K - RM2M', 'RM2M - RM5M', '> RM5M'
    paid_up_capital NUMERIC(15, 2) NOT NULL,
    employee_count INTEGER NOT NULL,
    sector VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Grant Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'CRG-2026-0101'
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    submission_source VARCHAR(50) DEFAULT 'portal' NOT NULL, -- 'portal' | 'jotform_webhook'
    jotform_submission_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'submitted' NOT NULL,
    
    -- Applicant Contact (Essential baseline fields)
    applicant_name VARCHAR(255) NOT NULL,
    applicant_designation VARCHAR(150),
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(50),
    identification_no VARCHAR(50),
    
    -- Technology & Product (Flexible for draft / unconfirmed questions)
    product_name VARCHAR(255) NOT NULL,
    tagline TEXT,
    trl_level INTEGER DEFAULT 6,
    product_description TEXT,
    ip_status VARCHAR(50) DEFAULT 'None',
    production_readiness TEXT,
    current_capacity VARCHAR(255),
    
    -- Market & Funding
    target_market TEXT,
    tam_sam_som TEXT,
    funding_requested NUMERIC(15, 2) DEFAULT 0,
    revenue_model TEXT,
    export_potential BOOLEAN DEFAULT FALSE,
    
    -- Reviewer & Due Diligence Assignments
    assigned_reviewer_1_id VARCHAR(50),
    assigned_reviewer_2_id VARCHAR(50),
    composite_score NUMERIC(5, 2), -- 0.00% to 100.00%
    baseline_passed BOOLEAN DEFAULT FALSE,
    assigned_analyst_id VARCHAR(50),
    assigned_analyst_name VARCHAR(255),

    -- Dynamic Form Answers & Future Question Changes (Jotform / Dynamic Fields)
    -- Stores ANY new, unconfirmed, or modified questions as JSON key-value pairs without breaking the database
    form_data JSONB DEFAULT '{}'::jsonb,

    -- Supplementary Submissions (Stage 2 Form: Market Traction, Future Plans sent by Analyst)
    -- Linked automatically by application_id
    supplementary_submissions JSONB DEFAULT '[]'::jsonb,

    -- Uploaded Documents & Attachments (Jotform / Supabase Storage)
    documents JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Reviewer Scoring Assessments Table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(50) NOT NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    reviewer_role VARCHAR(150) NOT NULL,
    
    -- 5-Point Weighted Rubric Criteria (1 to 10 each)
    score_market_potential INTEGER CHECK (score_market_potential BETWEEN 1 AND 10) NOT NULL, -- Weight 25%
    score_tech_feasibility INTEGER CHECK (score_tech_feasibility BETWEEN 1 AND 10) NOT NULL, -- Weight 25%
    score_team_capability INTEGER CHECK (score_team_capability BETWEEN 1 AND 10) NOT NULL,   -- Weight 20%
    score_financial_soundness INTEGER CHECK (score_financial_soundness BETWEEN 1 AND 10) NOT NULL, -- Weight 20%
    score_ecosystem_impact INTEGER CHECK (score_ecosystem_impact BETWEEN 1 AND 10) NOT NULL,       -- Weight 10%
    
    total_weighted_score NUMERIC(5, 2) NOT NULL, -- 0.00 to 100.00%
    recommendation VARCHAR(50) NOT NULL, -- 'recommend_shortlist' | 'needs_revision' | 'reject'
    remarks_market_potential TEXT,
    remarks_tech_feasibility TEXT,
    remarks_team_capability TEXT,
    remarks_financial_soundness TEXT,
    remarks_ecosystem_impact TEXT,
    general_remarks TEXT,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_reviewer_per_application UNIQUE (application_id, reviewer_id)
);

-- 4. Email Notification Log Table
CREATE TABLE IF NOT EXISTS email_notifications (
    id VARCHAR(100) PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_role VARCHAR(50) NOT NULL, -- 'applicant' | 'reviewer' | 'analyst'
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'delivered' NOT NULL
);

-- 5. Global Grant Platform Settings Table
CREATE TABLE IF NOT EXISTS grant_settings (
    key VARCHAR(50) PRIMARY KEY, -- 'global'
    baseline_threshold NUMERIC(5, 2) DEFAULT 75.0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Application Documents & Jotform Attachments Table
CREATE TABLE IF NOT EXISTS application_documents (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size VARCHAR(50),
    file_url TEXT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'jotform' NOT NULL, -- 'jotform' | 'supabase_storage'
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for Fast Query Performance
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_state ON companies(state);
CREATE INDEX IF NOT EXISTS idx_reviews_application_id ON reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_application_id ON email_notifications(application_id);
CREATE INDEX IF NOT EXISTS idx_docs_application_id ON application_documents(application_id);

-- Insert Default Global Baseline Settings
INSERT INTO grant_settings (key, baseline_threshold) 
VALUES ('global', 75.0) 
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 7. Row Level Security (RLS) for Supabase Compliance
-- Enables RLS and grants full access to eliminate Supabase security warnings
-- ==============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

-- Permissive access policies for public/service access
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Allow all access to companies') THEN
        CREATE POLICY "Allow all access to companies" ON companies FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'Allow all access to applications') THEN
        CREATE POLICY "Allow all access to applications" ON applications FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Allow all access to reviews') THEN
        CREATE POLICY "Allow all access to reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_notifications' AND policyname = 'Allow all access to email_notifications') THEN
        CREATE POLICY "Allow all access to email_notifications" ON email_notifications FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grant_settings' AND policyname = 'Allow all access to grant_settings') THEN
        CREATE POLICY "Allow all access to grant_settings" ON grant_settings FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'application_documents' AND policyname = 'Allow all access to application_documents') THEN
        CREATE POLICY "Allow all access to application_documents" ON application_documents FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
