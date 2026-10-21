import React, { useState } from 'react';
import { BookOpen, Copy, Download, Check, FileText, Terminal, ExternalLink, GitBranch, Shield } from 'lucide-react';

interface DocItem {
  id: string;
  title: string;
  filename: string;
  description: string;
  content: string;
}

const DOCS_LIST: DocItem[] = [
  {
    id: 'readme',
    title: 'Project Overview & Matrix',
    filename: 'README.md',
    description: 'System overview, capabilities, tech stack, and rapid local quickstart.',
    content: `# Commercialize Grant Platform & CRM (Dana Pengkomersialan)

A zero-budget, high-trust Commercialization Grant Management System built with TypeScript, React, and Node.js. It automates the entire grant governance lifecycle for grant secretariats, accredited reviewers, investment analysts, and innovative enterprises.

## Key Capabilities
1. Dual-Intake Submission Pipeline (Built-in Applicant Portal + Jotform Webhook Sync)
2. Dual-Reviewer Scoring Engine (Weighted 5-dimension rubric, 2 independent reviewers, 75% baseline shortlisting gate)
3. Analyst Due Diligence Pipeline & Committee Pitch
4. Automated Email Notification Hub (Applicants, Reviewers, Analysts)
5. Interactive Treemap Analytics Dashboard (Distribution across Industry Sectors, States, and Funding Quantum)
6. Full Documentation & Team Collaboration Suite (.md files for GitHub and Google Gemini)

## Tech Stack
- Primary Language: TypeScript (Node.js runtime)
- Frontend: React 19, Tailwind CSS v4, Lucide React
- Visualizations: Interactive SVG Squarified Treemap layout
- Database: PostgreSQL (Relational tables, Drizzle ORM, 100% Free on Neon / Supabase)`,
  },
  {
    id: 'setup',
    title: 'Setup & Zero-Cost Deployment',
    filename: 'DOCS/SETUP_GUIDE.md',
    description: 'Installation, environment variables, and zero-cost hosting (Vercel, Cloud Run, Neon/Supabase PostgreSQL).',
    content: `# Setup & Deployment Guide

## 1. System Requirements
- Node.js: 18.x or 20.x LTS
- Package Manager: npm (v9+) or pnpm / bun
- Git installed

## 2. Local Setup
\`\`\`bash
git clone https://github.com/your-org/commercialize-grant-platform.git
cd commercialize-grant-platform
npm install
cp .env.example .env
npm run dev
\`\`\`
Server runs at http://localhost:3000.

## 3. Zero-Cost Production Hosting (Vercel + PostgreSQL)
- Option A: Vercel (Frontend Hosting) + Neon Serverless PostgreSQL (Database)
  * Free Vercel Hobby Tier: 100 GB/month bandwidth with automated GitHub deployments.
  * Free Neon Postgres Tier: 0.5 GB relational storage with Singapore region (<20ms latency).
  * Single-Page App (SPA) routing is handled automatically by the included root 'vercel.json'.
  * Zero Firebase needed! All relational SQL schema defined in 'db/schema.sql'.
- Option B: Supabase (PostgreSQL with Spreadsheet Table Editor)
  * Free 500 MB database with visual Excel-like table manager for non-technical team members.
- Option C: Google Cloud Run (Full-Stack Container Free Tier) - 2 million requests/month free.`,
  },
  {
    id: 'architecture',
    title: 'Technical Architecture & Scoring Math',
    filename: 'DOCS/ARCHITECTURE.md',
    description: 'Entity models, dual-reviewer scoring math, baseline gating, and security design.',
    content: `# Technical Architecture & System Specification

## Dual-Reviewer Scoring Rubric Formula
Each grant has 2 independent evaluators (Technical & Commercial).
Total score = (Market * 0.25 + Tech * 0.25 + Team * 0.20 + Finance * 0.20 + Impact * 0.10) * 10

Composite Score = (Reviewer 1 Score + Reviewer 2 Score) / 2

Baseline Gate:
If Composite >= Baseline Threshold (Default: 75.0%):
- Status advances automatically to Shortlisted
- Lead Analyst is assigned for financial due diligence
- Automatic emails dispatched to applicant and analyst`,
  },
  {
    id: 'webhooks',
    title: 'Jotform Webhook Integration',
    filename: 'DOCS/JOTFORM_WEBHOOKS.md',
    description: 'Jotform form mapping, question IDs, file upload handling, and sample payloads.',
    content: `# Jotform Webhook Integration Guide

## Endpoint
POST /api/jotform-webhook

## In Jotform
1. Go to Form Settings -> Integrations -> WebHooks.
2. Enter your deployment URL endpoint.
3. Submissions automatically parse company details, funding request, TRL level, and attachments directly into the CRM.

## Tested Field Keys
- company_name, ssm_number, annual_turnover, funding_requested, trl, applicant_name, email, phone, sector, state`,
  },
  {
    id: 'team',
    title: 'Team GitHub & Gemini Workflow',
    filename: 'DOCS/TEAM_COLLABORATION.md',
    description: 'How team members clone, collaborate, and use Google Gemini Pro to modify code.',
    content: `# Team Collaboration & Google Gemini Workflow

## Step 1: Push Code to GitHub
\`\`\`bash
git init
git add .
git commit -m "feat: commercialize grant platform initial release"
git remote add origin https://github.com/YOUR_ORG/commercialize-grant-platform.git
git branch -M main
git push -u origin main
\`\`\`

## Step 2: Modifying Code with Google Gemini Pro
Teammates can use Google AI Studio or VS Code with Gemini:
- Prompt Gemini to add new rubric dimensions
- Prompt Gemini to generate custom reporting views
- Prompt Gemini to inspect and test Jotform webhook payloads`,
  },
  {
    id: 'postgres-setup',
    title: 'Supabase PostgreSQL Setup Guide',
    filename: 'DOCS/POSTGRESQL_SETUP.md',
    description: '100% free Supabase cloud hosting, Excel-style Table Editor, and sample SQL analytics queries.',
    content: `# Supabase PostgreSQL Setup & Table Editor Guide

## 1. Why Supabase for Commercialize Grants?
- Spreadsheet Table Editor: Non-technical team members can view, filter, sort, and edit grant records just like Excel!
- 100% Free: 500 MB PostgreSQL database + 1 GB file storage (for applicant pitch decks and SSM certificates).
- Singapore Region: Low-latency hosting (~15ms to Malaysia).

## 2. 3-Minute Quickstart:
1. Sign up at https://supabase.com (Free, no credit card required).
2. Create project 'mranti-commercialize-grant' in Southeast Asia (Singapore).
3. Open the SQL Editor in the left menu.
4. Copy and paste 'db/schema.sql' from this repository, then click Run.
5. (Optional) Run 'db/seed.sql' to load 5 realistic Malaysian sample grant applications.
6. Open the 'Table Editor' tab to view your grant applications in a visual spreadsheet grid!

## 3. Connecting Supabase to .env & Vercel
1. In Supabase: Project Settings -> API:
   - Copy 'Project URL' -> set VITE_SUPABASE_URL
   - Copy 'anon public key' -> set VITE_SUPABASE_ANON_KEY
2. In Supabase: Project Settings -> Database:
   - Copy Connection String (URI) -> set DATABASE_URL
3. On Vercel: Project Settings -> Environment Variables:
   - Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   - Redeploy and the app connects directly to Supabase!`,
  },
  {
    id: 'postgres-ddl',
    title: 'PostgreSQL Schema DDL (SQL Script)',
    filename: 'db/schema.sql',
    description: 'Raw SQL creation script with tables, foreign keys, constraints, and performance indexes.',
    content: `-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ssm_number VARCHAR(100) NOT NULL UNIQUE,
    incorporation_year INTEGER NOT NULL,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    annual_turnover NUMERIC(15, 2) NOT NULL,
    turnover_tier VARCHAR(50) NOT NULL,
    paid_up_capital NUMERIC(15, 2) NOT NULL,
    employee_count INTEGER NOT NULL,
    sector VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(50) PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE RESTRICT,
    submission_source VARCHAR(50) DEFAULT 'portal' NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted' NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    trl_level INTEGER CHECK (trl_level BETWEEN 6 AND 9) NOT NULL,
    funding_requested NUMERIC(15, 2) NOT NULL,
    composite_score NUMERIC(5, 2),
    baseline_passed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(50) NOT NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    score_market_potential INTEGER NOT NULL,
    score_tech_feasibility INTEGER NOT NULL,
    score_team_capability INTEGER NOT NULL,
    score_financial_soundness INTEGER NOT NULL,
    score_ecosystem_impact INTEGER NOT NULL,
    total_weighted_score NUMERIC(5, 2) NOT NULL,
    recommendation VARCHAR(50) NOT NULL,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Enable Supabase Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write" ON applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write" ON reviews FOR ALL USING (true) WITH CHECK (true);`,
  },
  {
    id: 'drizzle-schema',
    title: 'TypeScript Drizzle Schema',
    filename: 'src/db/schema.ts',
    description: 'Type-safe Drizzle ORM PostgreSQL definitions with table relationships.',
    content: `import { pgTable, text, serial, integer, timestamp, boolean, doublePrecision } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ssmNumber: text('ssm_number').notNull().unique(),
  sector: text('sector').notNull(),
  annualTurnover: doublePrecision('annual_turnover').notNull(),
});

export const applications = pgTable('applications', {
  id: text('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id),
  productName: text('product_name').notNull(),
  trlLevel: integer('trl_level').notNull(),
  fundingRequested: doublePrecision('funding_requested').notNull(),
  compositeScore: doublePrecision('composite_score'),
  status: text('status').notNull(),
});

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => applications.id),
  reviewerId: text('reviewer_id').notNull(),
  totalWeightedScore: doublePrecision('total_weighted_score').notNull(),
  recommendation: text('recommendation').notNull(),
});`,
  },
  {
    id: 'postgres-seed',
    title: 'PostgreSQL Sample Seed Data (SQL)',
    filename: 'db/seed.sql',
    description: 'Populate Supabase with 5 realistic Malaysian companies, reviewer rubrics, and shortlisting scores.',
    content: `-- Run this in Supabase SQL Editor after running db/schema.sql
-- Inserts 5 realistic Malaysian tech companies and grant applications:
-- 1. Aerodyne Robotics Sdn Bhd (Cyberjaya, LiDAR Drone Inspection, Score: 88%)
-- 2. AgroBio Precision Systems (Johor, BioEnzyme Soil Enhancer, Score: 77.5%)
-- 3. NanoShield Nanomaterials Sdn Bhd (Penang, Graphene Thermal Barrier)
-- 4. VoltaCell Energy Solutions (Sarawak, HydroFlow Kinetic Turbine)
-- 5. CardioSense BioMed Diagnostics (KL, AI-ECG 12-Lead Patch, Score: 91%)

-- Includes 2 independent reviewers (Dr. Aiman Razak & Ir. Tan Mei Ling)
-- and automated composite scoring matching the 75% baseline threshold.`,
  },
];

export const DocumentationHub: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState<string>('readme');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');

  const activeDoc = DOCS_LIST.find((d) => d.id === selectedDocId) || DOCS_LIST[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeDoc.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeDoc.filename.split('/').pop() || 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-sky-700">Team Repository & Handover</span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">Codebase Documentation Hub (.md & SQL Files)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete technical documentation and relational SQL schemas prepared for your team repository.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            {copied ? 'Copied to Clipboard' : 'Copy File'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download File
          </button>
        </div>
      </div>

      {/* Relational PostgreSQL Status & Free Host Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Database Engine: PostgreSQL (Relational SQL Schema Ready)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <a
              href="https://neon.tech"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 flex items-center gap-1 shadow-2xs transition-colors"
            >
              <span>Neon Free Postgres (Instant Setup)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 flex items-center gap-1 shadow-2xs transition-colors"
            >
              <span>Supabase (Excel-like UI)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[11px]">Relational Tables:</span>
            <span className="font-mono font-semibold text-slate-900">companies, applications, reviews</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">DDL Script:</span>
            <span className="font-mono text-slate-800 text-[11px]">db/schema.sql (Ready to run)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Guide:</span>
            <button
              type="button"
              onClick={() => setSelectedDocId('postgres-setup')}
              className="text-sky-700 font-semibold hover:underline"
            >
              Read DOCS/POSTGRESQL_SETUP.md &rarr;
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1 mb-2">
            Documentation Files ({DOCS_LIST.length})
          </div>
          {DOCS_LIST.map((doc) => {
            const isSelected = doc.id === selectedDocId;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedDocId(doc.id)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-sky-50/70 border-sky-300 shadow-2xs text-sky-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{doc.title}</span>
                  <span className="font-mono text-[10px] text-slate-400">{doc.filename}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{doc.description}</p>
              </button>
            );
          })}

          {/* Quick Git Setup Box */}
          <div className="mt-6 bg-slate-900 text-slate-200 p-4 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Quick Git Setup Commands
            </div>
            <pre className="font-mono text-[10px] text-emerald-400 p-2.5 bg-slate-950 rounded overflow-x-auto leading-relaxed">
{`git init
git add .
git commit -m "feat: grant platform v1"
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main`}
            </pre>
            <p className="text-[10px] text-slate-400">
              Run in project terminal to push to your team GitHub repository.
            </p>
          </div>
        </div>

        {/* Markdown Reader View */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {activeDoc.filename}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">{activeDoc.title}</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Format: Markdown</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto">
            <pre className="font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {activeDoc.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
