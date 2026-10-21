# Technical Architecture & System Specification

This document details the software architecture, data modeling, scoring algorithms, and security guidelines for the Commercialize Grant Management Platform.

---

## 1. High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GRANT INTAKE LAYER                              │
│  - Built-in Applicant Submission Portal (Multi-Step Form + File Upload) │
│  - Jotform Webhook Receiver (/api/jotform-webhook)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      CENTRAL APPLICATION ENGINE                        │
│  - Application Repository & State Management (GrantStore)              │
│  - Audit Trail & Reference ID Generator (CRG-YYYY-XXXX)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                                                               ▼
┌──────────────────────────┐                    ┌──────────────────────────┐
│   DUAL-REVIEWER ENGINE   │                    │  ANALYST DUE DILIGENCE   │
│  - 2 Reviewers / File    │                    │  - Financial Audit Check │
│  - Weighted Rubric (1-10)│                    │  - Site Inspection Notes │
│  - Baseline Gate (>=75%) │                    │  - Committee Pitch Memo  │
└─────────────┬────────────┘                    └─────────────┬────────────┘
              │                                               │
              └─────────────────────┬─────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   NOTIFICATION & ANALYTICS SERVICES                    │
│  - Email Dispatch Service (Applicant, Reviewer, Analyst alerts)        │
│  - Squarified Treemap Visualization (Sector, State, Funding Quantum)   │
│  - Data Export & Backup (JSON / CSV)                                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dual-Reviewer Scoring Rubric Algorithm

Every submitted application is independently assigned to two evaluators:
1. **Reviewer 1**: Technical Lead Evaluator (TRL validation, engineering feasibility, IP defensibility).
2. **Reviewer 2**: Commercial & Market Evaluator (TAM/SAM/SOM sizing, revenue model, customer validation, export viability).

### Rubric Criteria & Weights

| Dimension | Weight | Description | Scoring Range |
| :--- | :--- | :--- | :--- |
| **Market Potential** | **25%** ($W_1 = 0.25$) | Customer validation, market pull, competitive moat | 1 – 10 |
| **Technical Feasibility** | **25%** ($W_2 = 0.25$) | TRL 6-9 proof, prototype maturity, IP filing status | 1 – 10 |
| **Team Execution** | **20%** ($W_3 = 0.20$) | Founder track record, technical depth, operational bench | 1 – 10 |
| **Financial Soundness** | **20%** ($W_4 = 0.20$) | Milestone capex clarity, matching funds, turnover sanity | 1 – 10 |
| **Ecosystem Impact** | **10%** ($W_5 = 0.10$) | High-value jobs created, local supply chain, ESG | 1 – 10 |

### Mathematical Formula

The total weighted score for a reviewer ($S_{\text{rev}}$) is computed as:
$$S_{\text{rev}} = \sum_{i=1}^{5} (c_i \times W_i \times 10) = 10 \times (0.25 c_1 + 0.25 c_2 + 0.20 c_3 + 0.20 c_4 + 0.10 c_5)$$
Where $c_i \in [1, 10]$ is the raw criterion score. The resulting $S_{\text{rev}}$ is normalized between $0.0\%$ and $100.0\%$.

### Composite Score & Baseline Gating
When both reviewers submit their evaluations:
$$\text{Composite Score} = \frac{S_{\text{Reviewer 1}} + S_{\text{Reviewer 2}}}{2}$$

**Baseline Gate Logic**:
- If $\text{Composite Score} \ge \text{Baseline Threshold}$ (Default: $75.0\%$):
  1. Status updates from `scoring_review` $\rightarrow$ `shortlisted`.
  2. Lead Grant Analyst is automatically assigned for due diligence.
  3. Shortlist notification email is dispatched to the applicant.
  4. Task assignment alert is dispatched to the assigned Analyst.
- If $\text{Composite Score} < \text{Baseline Threshold}$:
  - Remains in review for committee triage or clarification request.

---

## 3. Core Data Entities

### `GrantApplication`
```typescript
interface GrantApplication {
  id: string; // e.g. "CRG-2026-0101"
  submissionSource: 'portal' | 'jotform_webhook';
  status: GrantStatus;
  company: CompanyInfo;
  applicant: ApplicantInfo;
  technology: ProductionTechInfo;
  market: MarketInfo;
  documents: DocumentAttachment[];
  assignedReviewers: [string, string]; // [reviewer1Id, reviewer2Id]
  reviewer1Score?: ReviewerScore;
  reviewer2Score?: ReviewerScore;
  compositeScore?: number;
  baselinePassed?: boolean;
  assignedAnalystId?: string;
  assignedAnalystName?: string;
  analystNotes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### `ReviewerScore`
```typescript
interface ReviewerScore {
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  scores: {
    marketPotential: number;    // 1-10
    techFeasibility: number;    // 1-10
    teamCapability: number;     // 1-10
    financialSoundness: number; // 1-10
    ecosystemImpact: number;    // 1-10
  };
  criterionRemarks: Record<string, string>;
  totalWeightedScore: number;   // 0 - 100%
  recommendation: 'recommend_shortlist' | 'needs_revision' | 'reject';
  generalRemarks: string;
  evaluatedAt: string;
}
```

---

## 4. Squarified Treemap Visualization Architecture

The treemap dashboard partitions the grant pipeline into a 2D hierarchical canvas ($1000 \times 520\text{px}$):
1. **Root**: All filtered applications.
2. **First Hierarchy**: Industry Sector (AgriTech, Deep Tech & AI, Clean Energy, Digital Health, IoT, FinTech).
3. **Second Hierarchy**: Individual grant applications within each sector, with area proportional to `fundingRequested` (MYR).
4. **Visual Channels**:
   - Background Color: Sector palette.
   - Border Stroke: Active hover and shortlist status.
   - Micro-Typography: Company name, state, TRL readiness, composite score.

---

## 5. Persistence & Database Strategy (PostgreSQL)

- **PostgreSQL Relational Schema (`db/schema.sql`)**: Full SQL DDL with relational tables (`companies`, `applications`, `reviews`, `email_notifications`, `grant_settings`), foreign keys with cascade constraints, numeric types for monetary values, and performance indexes.
- **TypeScript Drizzle ORM (`src/db/schema.ts`)**: Type-safe schema definition supporting relations, nested queries, and compile-time type safety.
- **100% Free Cloud Deployment**: Fully compatible with Neon Serverless Postgres and Supabase PostgreSQL free tiers in the Singapore/APAC region for zero-cost operation.
- **Client Cache & Export**: High-performance client-side storage cache with one-click JSON backup export and reset capabilities.
