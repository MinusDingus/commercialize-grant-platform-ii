# Commercialize Grant Platform & CRM (Dana Pengkomersialan)

A zero-budget, high-trust Commercialization Grant Management System built with **TypeScript, React, and Node.js**. It automates the entire grant governance lifecycle for grant secretariats, accredited reviewers, investment analysts, and innovative enterprises.

---

## 🚀 Key Capabilities

1. **Dual-Intake Submission Pipeline**:
   - Comprehensive **Applicant Portal**: Captures enterprise registration, SSM certificate, TRL readiness (TRL 6–9), IP status, market sizing (TAM/SAM/SOM), milestone capex utilization, and file uploads.
   - **Jotform Webhook Sync**: Dedicated webhook listener and interactive simulator to ingest submissions from external Jotform forms with zero third-party fees.

2. **Dual-Reviewer Scoring Engine**:
   - Automatic assignment of **2 independent accredited reviewers** (one Technical Evaluator and one Commercial/Market Evaluator) per application.
   - Weighted 5-dimensional scoring rubric:
     - Commercial Potential & Market Demand (25%)
     - Technical Feasibility & TRL Validation (25%)
     - Team Execution & Governance (20%)
     - Financial Soundness & Fund Utilization (20%)
     - Socio-Economic & Ecosystem Impact (10%)
   - Automated composite scoring with a configurable baseline threshold (e.g. 75.0%).

3. **Shortlist Gating & Analyst Due Diligence**:
   - Applications that hit the scoring baseline automatically graduate to **Shortlisted** status.
   - Automatically prompts and assigns a **Grant Analyst** for audited financial verification, site inspection, and preparation of committee pitch memos.

4. **Automated Email Notification Hub**:
   - Context-aware email notifications and activity log for Applicants, Reviewers, and Analysts across key milestones (Submission Confirmation, Reviewer Assignment, Shortlist Notification, Due Diligence Alert, Grant Award Offer).

5. **Interactive Treemap Analytics Dashboard**:
   - Hierarchical Squarified Treemap rendering distribution across Industry Sectors (AgriTech, Deep Tech & AI, Clean Energy, Digital Health, Smart Manufacturing, FinTech) and Malaysian States/Locations, with tile sizes proportional to requested grant funding.
   - High-density distribution metrics: Total Pipeline Quantum, Average TRL Readiness, Turnover Tier distribution, and Shortlisted Rate.

6. **Full Documentation & Team Collaboration Suite**:
   - Dedicated Markdown files in `DOCS/` for local development setup, zero-cost production hosting, technical architecture, and team collaboration with Google Gemini Pro.

---

## 📂 Repository Documentation Structure

| Document | Purpose |
| :--- | :--- |
| [`DOCS/SETUP_GUIDE.md`](DOCS/SETUP_GUIDE.md) | Step-by-step local setup, environment variables, and zero-cost production deployment (Vercel, Cloud Run, Neon/Supabase PostgreSQL). |
| [`DOCS/POSTGRESQL_SETUP.md`](DOCS/POSTGRESQL_SETUP.md) | PostgreSQL relational database hosting, tables, relations, and sample SQL analytics queries. |
| [`DOCS/ARCHITECTURE.md`](DOCS/ARCHITECTURE.md) | Technical architecture, data schemas, scoring rubric math, baseline gating, and security design. |
| [`DOCS/JOTFORM_WEBHOOKS.md`](DOCS/JOTFORM_WEBHOOKS.md) | Jotform webhook configuration, field mapping, question IDs, file attachment handling, and sample payloads. |
| [`DOCS/TEAM_COLLABORATION.md`](DOCS/TEAM_COLLABORATION.md) | Git workflow, GitHub repository setup, branching rules, and instructions for team members to collaborate using Google Gemini Pro. |

---

## 🛠️ Tech Stack & Language

- **Primary Language**: TypeScript (strict type checking across all grant entities)
- **Frontend Framework**: React 19 (functional components, modern hooks)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Runtime & Backend Server**: Node.js with Express & Vite
- **AI Acceleration**: Google Gemini (@google/genai SDK)
- **Database**: PostgreSQL (Relational tables, Drizzle ORM in `src/db/schema.ts`, DDL in `db/schema.sql`, 100% Free on Neon / Supabase) + Local Persistent Storage Cache

---

## ⚡ Quickstart (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional Gemini API key)
cp .env.example .env

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` to view the platform.

---

## 📜 License
Apache-2.0 License. Built for national commercialization grant acceleration.
