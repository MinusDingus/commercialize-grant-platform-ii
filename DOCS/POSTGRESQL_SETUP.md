# Supabase PostgreSQL Setup & Table Editor Guide

This guide details how to set up, host, and manage your **PostgreSQL relational database** using **Supabase (100% Free Tier)** for the Commercialize Grant Management Platform (Dana Pengkomersialan).

---

## 🌟 Why Supabase is Perfect for Grant Management

1. **Spreadsheet Table Editor**: Non-technical grant secretariat staff can view, filter, sort, and edit grant applications in a familiar visual grid (just like Microsoft Excel or Google Sheets).
2. **True Relational PostgreSQL**: Full ACID compliance, foreign keys, numeric currency columns, and complex SQL analytics.
3. **100% Free Forever Tier**:
   - **500 MB** relational PostgreSQL database.
   - **1 GB** file storage (for applicant pitch decks and SSM registration PDFs).
   - **No credit card required** to get started.
4. **Lowest Latency in Malaysia**:
   - Host your database in the **Singapore (`ap-southeast-1`)** region (~15ms round-trip latency to Kuala Lumpur / Cyberjaya).

---

## 🚀 3-Minute Supabase Quick-Start

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and click **"Start your project"**.
2. Sign in with your GitHub or Google account.
3. Click **"New Project"** and enter:
   - **Name**: `mranti-commercialize-grant`
   - **Database Password**: Choose a strong password and save it in your records.
   - **Region**: Select **Southeast Asia (Singapore) `ap-southeast-1`**.
4. Click **"Create new project"**. Supabase provisions your PostgreSQL database in about 1 minute.

---

### Step 2: Initialize Relational Tables (`db/schema.sql`)
1. In the left sidebar of your Supabase project dashboard, click **"SQL Editor"** (the icon looks like `>_`).
2. Click **"+ New Query"**.
3. Open the file [`db/schema.sql`](../db/schema.sql) in this repository, copy all the code, and paste it into the Supabase SQL editor.
4. Click the green **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`).
5. **Done!** The following relational tables and indexes are now live in your database:
   - `companies`: SSM number, turnover, paid-up capital, state, sector, contact info.
   - `applications`: Grant details, TRL readiness (6–9), funding requested, composite scores.
   - `reviews`: 5-point weighted criteria evaluations submitted by assigned reviewers.
   - `email_notifications`: Dispatched alert log for applicants, reviewers, and analysts.
   - `grant_settings`: Configurable shortlist baseline threshold (75.0%).

---

### Step 3: (Optional) Load Sample Grant Data (`db/seed.sql`)
If you want to immediately see realistic Malaysian grant applications and reviewer scores in your Supabase dashboard:
1. In the **SQL Editor**, click **"+ New Query"**.
2. Copy the contents of [`db/seed.sql`](../db/seed.sql) and paste it into the editor.
3. Click **"Run"**.
4. You will immediately have 5 realistic Malaysian companies (Aerodyne Robotics, AgroBio Precision, NanoShield, VoltaCell, CardioSense) populated with scoring records!

---

### Step 4: Explore Your Data in the Excel-Style "Table Editor"
1. In the left sidebar, click **"Table Editor"** (the icon looks like a grid spreadsheet).
2. Click on the **`applications`** or **`companies`** table.
3. You can:
   - **Filter & Sort**: Click *Filter* to view only `status = 'shortlisted'` or `sector = 'AgriTech & Food Security'`.
   - **Inline Edit**: Double-click any cell to edit data directly like Excel.
   - **Export to CSV**: Click *Export data* &rarr; *Download as CSV* anytime for reporting to grant committees or board members.

---

## 🔑 Setting Up Supabase in Your Environment (.env & Vercel)

The application supports both client-side direct Supabase connectivity (via `@supabase/supabase-js`) and server-side direct PostgreSQL connections.

### 1. Variables Required

| Environment Variable | Where to find in Supabase Dashboard | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | **Project Settings** &rarr; **API** &rarr; Project URL | URL of your Supabase instance (e.g. `https://xyzproject.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | **Project Settings** &rarr; **API** &rarr; Project API keys &rarr; `anon` (public) | Client-side public key safe for browser use (starts with `eyJhbGciOi...`) |
| `DATABASE_URL` | **Project Settings** &rarr; **Database** &rarr; Connection string &rarr; URI | Direct PostgreSQL connection string (for server, migrations, Prisma, Drizzle) |

---

### 2. Local Setup (.env)

1. In the root directory of this repository, create or open your `.env` file (you can copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Paste your project values (Your Supabase Project Ref is `lquzcxkjfsysssqgxvbm`):
   ```ini
   # Supabase Client (Vite Frontend)
   VITE_SUPABASE_URL="https://lquzcxkjfsysssqgxvbm.supabase.co"
   # Get your anon key from: https://supabase.com/dashboard/project/lquzcxkjfsysssqgxvbm/settings/api
   VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-public-key"

   # Supabase Direct PostgreSQL Connection
   DATABASE_URL="postgresql://postgres:ZhFaTLQOt8SRUwli@db.lquzcxkjfsysssqgxvbm.supabase.co:5432/postgres"
   ```
3. Restart your dev server (`npm run dev`).
4. Click the **"DB / Env"** indicator in the top right header to confirm your connection or paste your anon key directly into the modal for instant live sync!

---

### 3. Production Setup on Vercel CI/CD

When deploying via GitHub to Vercel:

1. Open your project on [Vercel](https://vercel.com).
2. Go to **Settings** &rarr; **Environment Variables**.
3. Add the following variables:
   - **Key**: `VITE_SUPABASE_URL` &rarr; **Value**: `https://your-project-id.supabase.co`
   - **Key**: `VITE_SUPABASE_ANON_KEY` &rarr; **Value**: `eyJhbGciOi...`
   - **Key**: `DATABASE_URL` &rarr; **Value**: `postgresql://postgres:[PASSWORD]@...`
4. Select all environments (**Production**, **Preview**, **Development**).
5. Click **Save**.
6. When Vercel rebuilds on your next push, Vite will automatically bake these variables into the production bundle.

---

## 📊 Useful SQL Analytics Queries for Grant Committees

You can run these analytical queries anytime in the Supabase SQL Editor:

### 1. Total Grant Funding Requested by Industry Sector
```sql
SELECT 
    c.sector, 
    COUNT(a.id) AS total_applications,
    SUM(a.funding_requested) AS total_grant_requested,
    ROUND(AVG(a.composite_score), 2) AS avg_reviewer_score
FROM applications a
JOIN companies c ON a.company_id = c.id
GROUP BY c.sector
ORDER BY total_grant_requested DESC;
```

### 2. Applications Shortlisted for Analyst Due Diligence
```sql
SELECT 
    a.id AS ref_id,
    c.name AS company_name,
    c.state,
    a.composite_score,
    a.assigned_analyst_name,
    a.funding_requested
FROM applications a
JOIN companies c ON a.company_id = c.id
WHERE a.status = 'shortlisted' OR a.baseline_passed = TRUE
ORDER BY a.composite_score DESC;
```

### 3. Reviewer Scoring Variance Report
```sql
SELECT 
    r.application_id,
    a.product_name,
    r.reviewer_name,
    r.total_weighted_score,
    r.recommendation
FROM reviews r
JOIN applications a ON r.application_id = a.id
ORDER BY r.application_id, r.total_weighted_score DESC;
```
