# Setup & Deployment Guide: Commercialize Grant Platform

This document provides complete instructions for installing, configuring, running locally, and deploying the Commercialize Grant Management Platform to zero-cost production environments.

---

## 1. System Requirements & Prerequisites

- **Node.js**: Version 18.18.0 or 20.x LTS (Recommended: Node 20)
- **Package Manager**: `npm` (v9 or v10) or `yarn` / `bun` / `pnpm`
- **Git**: v2.30+ installed for repository version control
- **Web Browser**: Any modern browser (Chrome, Edge, Firefox, Safari)

---

## 2. Local Development Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/commercialize-grant-platform.git
cd commercialize-grant-platform
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Edit `.env` to configure your settings:
```ini
# GEMINI_API_KEY: Optional. Used for AI evaluation summary and proposal parsing.
# You can get a free API key from Google AI Studio (https://aistudio.google.com).
GEMINI_API_KEY="your-gemini-pro-api-key"

# APP_URL: The base URL of the running platform.
APP_URL="http://localhost:3000"

# PORT: Server port (defaults to 3000)
PORT=3000
```

### Step 4: Run Development Server
```bash
npm run dev
```

The application will start on `http://localhost:3000`. Hot-module reloading and background server endpoints are active.

---

## 3. Production Build & Verification

To verify that the code compiles cleanly for production:
```bash
# Type check without emitting files
npm run lint

# Compile production bundle
npm run build
```
This produces the optimized production assets in the `dist/` directory.

---

## 4. Zero-Cost Production Hosting Options (Vercel + PostgreSQL)

Because you have zero budget for infrastructure, this platform is engineered to run seamlessly on the free tiers of leading cloud providers:

### Option A: Vercel (Recommended - 100% Free) + Serverless PostgreSQL

> [!NOTE]
> **Vercel + PostgreSQL Architecture**:
> - **Vercel** acts purely as the high-speed web host (serving HTML, CSS, JavaScript, and icons), giving you **100 GB/month of free bandwidth** and automated CI/CD from GitHub.
> - **PostgreSQL** (hosted for free on **Neon.tech** or **Supabase.com**) acts as your relational database with ACID compliance, relational foreign keys, and SQL analytics.
> - The browser application interacts smoothly, backed by client-side local caching and direct SQL export/import tools.

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     VERCEL HOSTING (FRONTEND)   │       │   POSTGRESQL DATABASE (CLOUD)   │
│                                 │       │   (Neon Serverless / Supabase)  │
│ • Serves website assets         │  ───> │ • Relational SQL tables         │
│ • 100 GB/month free bandwidth   │       │ • Foreign keys & ACID integrity │
│ • Automatic GitHub deployments  │       │ • Free 0.5 GB storage tier      │
│ • Zero configuration via        │       │ • SQL analytics & schema.sql    │
│   root `vercel.json`            │       │ • Singapore / APAC region       │
│ • Cost: $0 (Free Hobby tier)    │       │ • Cost: $0 (100% Free Tier)     │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

#### Why `vercel.json` is Already Included
This repository includes a pre-configured `vercel.json` file in the root directory:
```json
{
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This rewrite rule ensures that all single-page application (SPA) client routes and browser page refreshes work smoothly without 404 errors.

#### Step-by-Step Deployment Instructions to Vercel:

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial release with vercel and postgresql"
   git remote add origin https://github.com/YOUR_ORGANIZATION_OR_USERNAME/commercialize-grant-platform.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Log in to [https://vercel.com](https://vercel.com) using your GitHub account (Free Hobby tier).
   - Click **"Add New Project"** from your dashboard.
   - Select your `commercialize-grant-platform` repository from the list.

3. **Verify Build Settings**:
   - **Framework Preset**: Vite (automatically detected).
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `dist` (default).
   - **Root Directory**: `./` (default).

4. **Click Deploy**:
   - Click **"Deploy"**. Vercel builds the bundle and makes your app live in ~30 seconds with a free `.vercel.app` URL (e.g., `commercialize-grant.vercel.app`).
   - You can also add your own custom organization domain (e.g. `dana.mranti.my`) under Project Settings &rarr; Domains for free with automated SSL certificates!

5. **Initialize your PostgreSQL Cloud Database**:
   - Open [https://neon.tech](https://neon.tech) or [https://supabase.com](https://supabase.com) (both 100% free).
   - Create a free project in the Singapore region.
   - In the SQL Editor, copy and run the `db/schema.sql` file from this repository to create all tables and indexes in 1 click!

---

### Option B: Google Cloud Run (Container Free Tier)
- **Why**: Standard container deployment for full-stack Node.js and PostgreSQL.
- **Cost**: $0 / month within free tier (Free Tier includes 2 million requests/month, 360,000 GB-seconds memory, and 180,000 vCPU-seconds).
- **Deployment Steps**:
  1. Install Google Cloud SDK (`gcloud`).
  2. Authenticate: `gcloud auth login`
  3. Set your project: `gcloud config set project [YOUR_PROJECT_ID]`
  4. Build & deploy:
     ```bash
     gcloud run deploy commercialize-grant \
       --source . \
       --platform managed \
       --region asia-southeast1 \
       --allow-unauthenticated
     ```

---

## 5. Security & Environment Best Practices

1. **Never commit `.env` with real credentials**: Ensure `.gitignore` contains `.env` and `.env.local`.
2. **Jotform Webhook Endpoint**: When deploying to production, configure your Jotform webhook URL to `https://[YOUR_PRODUCTION_DOMAIN]/api/jotform-webhook`.
3. **Database Backups**: Use the built-in **Export Data** button in the CRM to download JSON backups of grant applications periodically, or run automated PostgreSQL dumps via `pg_dump`.
