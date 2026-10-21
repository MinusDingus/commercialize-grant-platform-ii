import { pgTable, text, serial, integer, timestamp, boolean, doublePrecision } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * PostgreSQL Schema for Commercialize Grant Platform (Dana Pengkomersialan)
 */

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ssmNumber: text('ssm_number').notNull().unique(),
  incorporationYear: integer('incorporation_year').notNull(),
  state: text('state').notNull(),
  city: text('city').notNull(),
  annualTurnover: doublePrecision('annual_turnover').notNull(),
  turnoverTier: text('turnover_tier').notNull(),
  paidUpCapital: doublePrecision('paid_up_capital').notNull(),
  employeeCount: integer('employee_count').notNull(),
  sector: text('sector').notNull(),
  website: text('website'),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const applications = pgTable('applications', {
  id: text('id').primaryKey(), // e.g. CRG-2026-0101
  companyId: integer('company_id').references(() => companies.id),
  submissionSource: text('submission_source').notNull().default('portal'), // 'portal' | 'jotform_webhook'
  jotformSubmissionId: text('jotform_submission_id'),
  status: text('status').notNull().default('submitted'),
  // Applicant details
  applicantName: text('applicant_name').notNull(),
  applicantDesignation: text('applicant_designation').notNull(),
  applicantEmail: text('applicant_email').notNull(),
  applicantPhone: text('applicant_phone').notNull(),
  identificationNo: text('identification_no').notNull(),
  // Product / Tech
  productName: text('product_name').notNull(),
  tagline: text('tagline'),
  trlLevel: integer('trl_level').notNull(), // 6, 7, 8, 9
  productDescription: text('product_description').notNull(),
  ipStatus: text('ip_status').notNull(),
  productionReadiness: text('production_readiness'),
  currentCapacity: text('current_capacity'),
  // Market & Funding
  targetMarket: text('target_market'),
  tamSamSom: text('tam_sam_som'),
  fundingRequested: doublePrecision('funding_requested').notNull(),
  revenueModel: text('revenue_model'),
  exportPotential: boolean('export_potential').default(false),
  // Reviewers & Baseline
  assignedReviewer1Id: text('assigned_reviewer_1_id'),
  assignedReviewer2Id: text('assigned_reviewer_2_id'),
  compositeScore: doublePrecision('composite_score'),
  baselinePassed: boolean('baseline_passed').default(false),
  assignedAnalystId: text('assigned_analyst_id'),
  assignedAnalystName: text('assigned_analyst_name'),
  analystNotes: text('analyst_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => applications.id),
  reviewerId: text('reviewer_id').notNull(),
  reviewerName: text('reviewer_name').notNull(),
  reviewerRole: text('reviewer_role').notNull(),
  // 5 Rubric dimensions (1 - 10)
  scoreMarketPotential: integer('score_market_potential').notNull(), // 25%
  scoreTechFeasibility: integer('score_tech_feasibility').notNull(), // 25%
  scoreTeamCapability: integer('score_team_capability').notNull(),   // 20%
  scoreFinancialSoundness: integer('score_financial_soundness').notNull(), // 20%
  scoreEcosystemImpact: integer('score_ecosystem_impact').notNull(),       // 10%
  totalWeightedScore: doublePrecision('total_weighted_score').notNull(), // 0 - 100%
  recommendation: text('recommendation').notNull(), // 'recommend_shortlist' | 'needs_revision' | 'reject'
  remarksMarketPotential: text('remarks_market_potential'),
  remarksTechFeasibility: text('remarks_tech_feasibility'),
  remarksTeamCapability: text('remarks_team_capability'),
  remarksFinancialSoundness: text('remarks_financial_soundness'),
  remarksEcosystemImpact: text('remarks_ecosystem_impact'),
  generalRemarks: text('general_remarks'),
  evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
});

export const emailNotifications = pgTable('email_notifications', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').notNull(),
  companyName: text('company_name').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  recipientName: text('recipient_name').notNull(),
  recipientRole: text('recipient_role').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  templateType: text('template_type').notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  status: text('status').notNull().default('delivered'),
});

export const grantSettings = pgTable('grant_settings', {
  key: text('key').primaryKey(), // e.g. 'global'
  baselineThreshold: doublePrecision('baseline_threshold').notNull().default(75.0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  company: one(companies, {
    fields: [applications.companyId],
    references: [companies.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  application: one(applications, {
    fields: [reviews.applicationId],
    references: [applications.id],
  }),
}));
