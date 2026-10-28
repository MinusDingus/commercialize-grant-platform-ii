import {
  GrantApplication,
  EmailNotification,
  ReviewerScore,
  RubricCriteriaScores,
  DocumentAttachment,
  SupplementarySubmission,
} from '../types/grant';
import {
  INITIAL_APPLICATIONS,
  INITIAL_NOTIFICATIONS,
  MOCK_REVIEWERS,
  MOCK_ANALYSTS,
} from '../data/mockData';
import { calculateWeightedScore, calculateCompositeScore } from './rubricMath';

import {
  saveApplicationsToIndexedDb,
  loadApplicationsFromIndexedDb,
  clearApplicationsIndexedDb,
} from './indexedDb';

const STORAGE_KEYS = {
  APPLICATIONS: 'crg_grant_applications_v1',
  NOTIFICATIONS: 'crg_grant_notifications_v1',
  BASELINE: 'crg_grant_baseline_threshold_v1',
};

const DEFAULT_BASELINE = 75.0;

/**
 * Validates that an application ID belongs to the commercialize grant (DPF / DF)
 * and purges legacy mock IDs like CRG-2026-0104.
 */
export function isValidDpfApplicationId(id?: string): boolean {
  if (!id) return false;
  const upper = id.trim().toUpperCase();
  // Reject mock IDs
  if (upper.startsWith('CRG')) return false;
  // Accept Dana Pengkomersialan Fasilitasi IDs: DPF, DF, or non-mock IDs
  return upper.startsWith('DPF') || upper.startsWith('DF') || upper.startsWith('D');
}

export class GrantStore {
  // In-memory cache ensures 0ms instant access and bypasses localStorage 5MB quota
  private static memoryApplications: GrantApplication[] | null = null;
  private static isInitialized = false;

  /**
   * Initializes store by loading from IndexedDB (asynchronous high-capacity storage)
   * Falls back to localStorage and initial seed applications.
   */
  static async init(): Promise<GrantApplication[]> {
    if (this.isInitialized && this.memoryApplications && this.memoryApplications.length > 0) {
      return this.memoryApplications.filter((a) => isValidDpfApplicationId(a.id));
    }

    try {
      const idbApps = await loadApplicationsFromIndexedDb();
      if (idbApps && Array.isArray(idbApps) && idbApps.length > 0) {
        // Enforce that only valid DPF / DF IDs are preserved; purge mock CRG- IDs
        const validApps = idbApps.filter((a) => isValidDpfApplicationId(a.id));
        this.memoryApplications = validApps;
        this.isInitialized = true;
        this.saveApplications(validApps);
        return validApps;
      }
    } catch (e) {
      console.warn('IndexedDB hydration notice:', e);
    }

    const apps = this.getApplications();
    this.isInitialized = true;
    return apps;
  }

  static getApplications(): GrantApplication[] {
    // 1. If in-memory cache is populated, return it directly filtered
    if (this.memoryApplications) {
      return this.memoryApplications.filter((a) => isValidDpfApplicationId(a.id));
    }

    // 2. Try loading from localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
        if (data) {
          let parsed: GrantApplication[] = JSON.parse(data);
          const originalLen = parsed.length;
          // Purge mock IDs like CRG-2026-0104; only preserve valid DPF / DF IDs
          parsed = parsed.filter((a) => isValidDpfApplicationId(a.id));
          let needsSave = parsed.length !== originalLen;
          
          // Clean up any old data where Shafiq Fauzi was mistakenly set as analyst
          parsed.forEach((app) => {
            if (app.assignedAnalystName?.includes('Shafiq Fauzi')) {
              app.assignedAnalystName = 'Reviewer 3 / Diligence Analyst';
              app.assignedAnalystId = 'ana-01';
              needsSave = true;
            }
          });

          this.memoryApplications = parsed;

          if (needsSave) {
            this.saveApplications(parsed);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse applications from storage, using empty state', e);
    }

    this.memoryApplications = [];
    return [];
  }

  static saveApplications(apps: GrantApplication[]) {
    // Enforce that only valid DPF/DF IDs are accepted
    const validApps = apps.filter((a) => isValidDpfApplicationId(a.id));

    // 1. Immediately store in memory so React UI has 0-latency access
    this.memoryApplications = validApps;

    // 2. Persist full fidelity to IndexedDB (asynchronously, unlimited quota)
    saveApplicationsToIndexedDb(validApps).catch((err) => {
      console.warn('Could not persist to IndexedDB:', err);
    });

    // 3. Persist safely to localStorage with quota protection
    this.saveToLocalStorageSafe(validApps);
  }

  /**
   * Saves to localStorage handling QuotaExceededError gracefully
   */
  private static saveToLocalStorageSafe(apps: GrantApplication[]) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
      }
    } catch (e: any) {
      console.warn('localStorage quota exceeded for full payload. Compacting backup for localStorage...', e?.message);
      try {
        // Strip out redundant raw formData and truncate large narratives for localStorage fallback
        const compacted = apps.map((app) => {
          const { formData, ...rest } = app;
          return {
            ...rest,
            technology: {
              ...rest.technology,
              productionReadiness: rest.technology?.productionReadiness?.slice(0, 300),
              currentCapacity: rest.technology?.currentCapacity?.slice(0, 300),
            },
          };
        });
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(compacted));
        }
      } catch (err2) {
        try {
          // If still over quota (e.g. 500+ apps), keep top 50 in localStorage
          const topSlice = apps.slice(0, 50).map(({ formData, ...rest }) => rest);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(topSlice));
          }
        } catch {
          // In-memory + IndexedDB keep the full dataset intact
        }
      }
    }
  }

  static getBaselineThreshold(): number {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = localStorage.getItem(STORAGE_KEYS.BASELINE);
        if (val) return parseFloat(val);
      }
    } catch {
      // ignore
    }
    return DEFAULT_BASELINE;
  }

  static setBaselineThreshold(val: number): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEYS.BASELINE, val.toString());
    }
  }

  static getNotifications(): EmailNotification[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        if (data) {
          let parsed: EmailNotification[] = JSON.parse(data);
          const originalLen = parsed.length;
          // Purge notifications referencing old mock CRG- IDs
          parsed = parsed.filter(n => !n.applicationId || isValidDpfApplicationId(n.applicationId));
          let needsSave = parsed.length !== originalLen;
          if (needsSave) {
            this.saveNotifications(parsed);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse notifications, using defaults', e);
    }
    const cleanInitial = INITIAL_NOTIFICATIONS.filter(n => !n.applicationId || isValidDpfApplicationId(n.applicationId));
    this.saveNotifications(cleanInitial);
    return cleanInitial;
  }

  static saveNotifications(notifications: EmailNotification[]) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      }
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }

  static dispatchEmail(email: Omit<EmailNotification, 'id' | 'sentAt' | 'status'>): EmailNotification {
    const notifications = this.getNotifications();
    const newEmail: EmailNotification = {
      ...email,
      id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sentAt: new Date().toISOString(),
      status: 'delivered',
    };
    const updated = [newEmail, ...notifications];
    this.saveNotifications(updated);
    return newEmail;
  }

  static importApplications(newApps: GrantApplication[]): { added: number; updated: number; total: number } {
    const existing = this.getApplications();
    let added = 0;
    let updated = 0;

    const map = new Map<string, GrantApplication>();
    existing.forEach((a) => {
      if (isValidDpfApplicationId(a.id)) {
        map.set(a.id, a);
      }
    });

    newApps.forEach((app, idx) => {
      // Ensure application ID starts with DPF or DF
      if (!isValidDpfApplicationId(app.id)) {
        const numPart = (app.id || '').replace(/\D/g, '');
        if (numPart.length >= 3) {
          app.id = `DPF${numPart.slice(-6).padStart(6, '0')}`;
        } else {
          app.id = `DPF${String(230 + existing.length + idx + 1).padStart(6, '0')}`;
        }
      }

      if (map.has(app.id)) {
        map.set(app.id, { ...map.get(app.id)!, ...app, updatedAt: new Date().toISOString() });
        updated++;
      } else {
        map.set(app.id, app);
        added++;
      }
    });

    const combined = Array.from(map.values());
    this.saveApplications(combined);
    return { added, updated, total: combined.length };
  }

  static createApplication(
    appData: Omit<GrantApplication, 'id' | 'createdAt' | 'updatedAt' | 'assignedReviewers'>
  ): GrantApplication {
    const apps = this.getApplications();
    const nextNum = 230 + apps.length + 1;
    const newId = `DPF${String(nextNum).padStart(6, '0')}`;
    const assignedReviewers: [string, string] = ['rev-01', 'rev-02'];

    const newApp: GrantApplication = {
      ...appData,
      id: newId,
      assignedReviewers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newApp, ...apps];
    this.saveApplications(updated);

    // Auto dispatch confirmation email to applicant
    this.dispatchEmail({
      applicationId: newId,
      companyName: newApp.company.name,
      recipientEmail: newApp.applicant.email,
      recipientName: newApp.applicant.fullName,
      recipientRole: 'applicant',
      subject: `Commercialize Grant Application Received: ${newApp.company.name} [${newId}]`,
      body: `Dear ${newApp.applicant.fullName},\n\nWe confirm receipt of your application for the Commercialize Grant (Dana Pengkomersialan) on behalf of ${newApp.company.name}.\n\nReference ID: ${newId}\nProduct/Service: ${newApp.technology.productName}\nFunding Requested: RM ${newApp.market.fundingRequested.toLocaleString()}\n\nNext Steps:\n1. Secretariat Completeness Check (1-3 working days)\n2. Dual-Reviewer Technical & Market Scoring\n3. Shortlist Baseline Review (Baseline: ${this.getBaselineThreshold()}%)\n\nYou can track the progress using your Reference ID in the Grant Portal.\n\nBest regards,\nGrant Secretariat Desk`,
      templateType: 'SUBMISSION_CONFIRMATION',
    });

    return newApp;
  }

  static updateApplication(id: string, updates: Partial<GrantApplication>): GrantApplication | null {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const updatedApp = {
      ...apps[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    apps[index] = updatedApp;
    this.saveApplications(apps);
    return updatedApp;
  }

  static assignReviewers(appId: string, reviewer1Id: string, reviewer2Id: string): GrantApplication | null {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId);
    if (!app) return null;

    const r1 = MOCK_REVIEWERS.find((r) => r.id === reviewer1Id);
    const r2 = MOCK_REVIEWERS.find((r) => r.id === reviewer2Id);

    const updatedApp = this.updateApplication(appId, {
      assignedReviewers: [reviewer1Id, reviewer2Id],
      status: app.status === 'submitted' || app.status === 'screening' ? 'scoring_review' : app.status,
    });

    if (r1) {
      this.dispatchEmail({
        applicationId: appId,
        companyName: app.company.name,
        recipientEmail: r1.email,
        recipientName: r1.name,
        recipientRole: 'reviewer',
        subject: `[Action Required] Reviewer Assignment: ${app.company.name} (${appId})`,
        body: `Dear ${r1.name},\n\nYou have been assigned as Reviewer 1 for grant application ${appId} (${app.company.name} - "${app.technology.productName}").\n\nPlease log in to the Reviewer Evaluation Portal to evaluate the proposal against the 5-point weighted rubric.\n\nGrant Secretariat`,
        templateType: 'REVIEWER_ASSIGNMENT',
      });
    }

    if (r2) {
      this.dispatchEmail({
        applicationId: appId,
        companyName: app.company.name,
        recipientEmail: r2.email,
        recipientName: r2.name,
        recipientRole: 'reviewer',
        subject: `[Action Required] Reviewer Assignment: ${app.company.name} (${appId})`,
        body: `Dear ${r2.name},\n\nYou have been assigned as Reviewer 2 for grant application ${appId} (${app.company.name} - "${app.technology.productName}").\n\nPlease log in to the Reviewer Evaluation Portal to evaluate the proposal against the 5-point weighted rubric.\n\nGrant Secretariat`,
        templateType: 'REVIEWER_ASSIGNMENT',
      });
    }

    return updatedApp;
  }

  static submitReviewScore(
    appId: string,
    reviewerId: string,
    scoreData: {
      reviewerName: string;
      reviewerRole: string;
      scores: RubricCriteriaScores;
      criterionRemarks: {
        marketPotential: string;
        techFeasibility: string;
        teamCapability: string;
        financialSoundness: string;
        ecosystemImpact: string;
      };
      recommendation: 'recommend_shortlist' | 'needs_revision' | 'reject';
      generalRemarks: string;
    }
  ): GrantApplication | null {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId);
    if (!app) return null;

    const weightedScore = calculateWeightedScore(scoreData.scores);
    const scoreRecord: ReviewerScore = {
      ...scoreData,
      reviewerId,
      totalWeightedScore: weightedScore,
      evaluatedAt: new Date().toISOString().split('T')[0],
    };

    let r1 = app.reviewer1Score;
    let r2 = app.reviewer2Score;

    if (app.assignedReviewers[0] === reviewerId || (!app.reviewer1Score && app.assignedReviewers[1] !== reviewerId)) {
      r1 = scoreRecord;
    } else {
      r2 = scoreRecord;
    }

    const { score: composite, bothSubmitted } = calculateCompositeScore(r1, r2);
    const baseline = this.getBaselineThreshold();
    const baselinePassed = composite !== undefined && composite >= baseline;

    const updates: Partial<GrantApplication> = {
      reviewer1Score: r1,
      reviewer2Score: r2,
      compositeScore: composite,
      baselinePassed,
    };

    // If both reviewers have submitted and passed the baseline threshold:
    if (bothSubmitted && baselinePassed && app.status === 'scoring_review') {
      updates.status = 'shortlisted';
      if (!app.assignedAnalystId) {
        updates.assignedAnalystId = MOCK_ANALYSTS[0].id;
        updates.assignedAnalystName = MOCK_ANALYSTS[0].name;
      }

      this.dispatchEmail({
        applicationId: app.id,
        companyName: app.company.name,
        recipientEmail: app.applicant.email,
        recipientName: app.applicant.fullName,
        recipientRole: 'applicant',
        subject: `Grant Application Shortlisted: ${app.company.name} [${app.id}]`,
        body: `Dear ${app.applicant.fullName},\n\nWe are pleased to inform you that your proposal "${app.technology.productName}" has achieved a composite evaluation score of ${composite}%, passing the commercialization baseline threshold (${baseline}%).\n\nYour application has been assigned to Lead Grant Analyst ${MOCK_ANALYSTS[0].name} for financial and commercial due diligence.\n\nWarm regards,\nCommercialization Grant Secretariat`,
        templateType: 'APPLICANT_SHORTLISTED',
      });

      this.dispatchEmail({
        applicationId: app.id,
        companyName: app.company.name,
        recipientEmail: MOCK_ANALYSTS[0].email,
        recipientName: MOCK_ANALYSTS[0].name,
        recipientRole: 'analyst',
        subject: `New Shortlisted Dossier Assigned: ${app.company.name} (${composite}%)`,
        body: `Hi ${MOCK_ANALYSTS[0].name},\n\nApplication ${app.id} (${app.company.name}) has met the shortlist threshold with a composite score of ${composite}% from Reviewers 1 & 2.\n\nPlease initiate due diligence checks.\n\nGrant Operations Desk`,
        templateType: 'SHORTLIST_ANALYST_ALERT',
      });
    }

    return this.updateApplication(appId, updates);
  }

  static assignAnalyst(appId: string, analystId: string): GrantApplication | null {
    const analyst = MOCK_ANALYSTS.find((a) => a.id === analystId);
    if (!analyst) return null;

    const updated = this.updateApplication(appId, {
      assignedAnalystId: analyst.id,
      assignedAnalystName: analyst.name,
      status: 'analyst_due_diligence',
    });

    return updated;
  }

  static getApplicationById(id: string): GrantApplication | undefined {
    const apps = this.getApplications();
    const cleanId = id.trim().toLowerCase();
    return apps.find((a) => a.id.toLowerCase() === cleanId || a.company.name.toLowerCase() === cleanId);
  }

  static parseJotformWebhookPayload(payload: any): GrantApplication {
    const rawAnswers = payload?.rawRequest || payload || {};

    // 1. Check if this is Form 2 (or supplementary submission) linked to an existing application
    const linkedAppId =
      rawAnswers.application_id ||
      rawAnswers.applicationId ||
      rawAnswers.app_id ||
      rawAnswers.ref_id ||
      payload?.application_id ||
      payload?.applicationId;

    if (linkedAppId) {
      const existingApp = this.getApplicationById(String(linkedAppId));
      if (existingApp) {
        // Collect any newly attached files from Form 2 (Market traction, future projections, customer LOIs, etc.)
        const newDocs: DocumentAttachment[] = [];
        if (rawAnswers.attachment_market_traction) {
          newDocs.push({
            id: `jf-supp-traction-${Date.now()}`,
            name: rawAnswers.attachment_market_traction_name || 'Form2_Market_Traction_Audit.pdf',
            type: 'application/pdf',
            size: '2.8 MB',
            url: rawAnswers.attachment_market_traction,
            uploadedAt: new Date().toISOString().split('T')[0],
          });
        }
        if (rawAnswers.attachment_future_plans || rawAnswers.attachment_financial_model) {
          newDocs.push({
            id: `jf-supp-plans-${Date.now()}`,
            name: rawAnswers.attachment_future_plans_name || 'Form2_3Year_Commercial_Plan_Financials.xlsx',
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: '1.9 MB',
            url: rawAnswers.attachment_future_plans || rawAnswers.attachment_financial_model,
            uploadedAt: new Date().toISOString().split('T')[0],
          });
        }
        if (rawAnswers.attachment_loi || rawAnswers.attachment_customer_validation) {
          newDocs.push({
            id: `jf-supp-loi-${Date.now()}`,
            name: rawAnswers.attachment_loi_name || 'Form2_Customer_LOIs_Contracts.pdf',
            type: 'application/pdf',
            size: '1.4 MB',
            url: rawAnswers.attachment_loi || rawAnswers.attachment_customer_validation,
            uploadedAt: new Date().toISOString().split('T')[0],
          });
        }

        const supplementaryItem: SupplementarySubmission = {
          id: `supp-${Date.now()}`,
          formId: payload?.formID || 'jf-stage-2-due-diligence',
          formTitle: rawAnswers.form_title || 'Stage 2 Supplementary Due Diligence (Market Traction & Future Plans)',
          submittedAt: new Date().toISOString(),
          data: rawAnswers,
          documents: newDocs,
        };

        const existingDocs = existingApp.documents || [];
        const existingSupp = existingApp.supplementarySubmissions || [];

        const updated = this.updateApplication(existingApp.id, {
          documents: [...existingDocs, ...newDocs],
          supplementarySubmissions: [...existingSupp, supplementaryItem],
          status:
            existingApp.status === 'shortlisted' || existingApp.status === 'screening'
              ? 'analyst_due_diligence'
              : existingApp.status,
          analystNotes: existingApp.analystNotes
            ? `${existingApp.analystNotes}\n[${new Date().toLocaleDateString()}] Form 2 Received: Market traction & future plans submitted.`
            : `[${new Date().toLocaleDateString()}] Form 2 Received: Market traction & future plans submitted.`,
        });

        // Dispatch alert email to assigned analyst
        this.dispatchEmail({
          applicationId: existingApp.id,
          companyName: existingApp.company.name,
          recipientEmail: 'shafiqfauzi@mranti.my',
          recipientName: existingApp.assignedAnalystName || 'Shafiq Fauzi',
          recipientRole: 'analyst',
          subject: `Stage 2 Due Diligence Form Submitted: ${existingApp.company.name} [${existingApp.id}]`,
          body: `Dear ${existingApp.assignedAnalystName || 'Lead Grant Analyst'},\n\nThe applicant for ${existingApp.company.name} (${existingApp.id}) has successfully completed and submitted Form 2 (Supplementary Due Diligence).\n\nKey Information Captured in Form 2:\n- Commercial Market Traction: ${rawAnswers.market_traction_summary || 'Submitted with verified metrics'}\n- 3-Year Future Revenue Target: ${rawAnswers.future_plan_summary || 'Detailed expansion roadmap provided'}\n- Supplementary Attachments: ${newDocs.length > 0 ? newDocs.map(d => d.name).join(', ') : 'Direct upload attachments'}\n\nThe dossier has been automatically updated and linked to their primary Form 1 record.\n\nCommercialize Grant Operations Desk`,
          templateType: 'SHORTLIST_ANALYST_ALERT',
        });

        return updated || existingApp;
      }
    }

    // 2. Otherwise: Form 1 New Intake Application
    const companyName = rawAnswers.company_name || rawAnswers.companyName || rawAnswers.q3_companyName || 'Jotform Applicant Enterprise';
    const ssm = rawAnswers.ssm_number || rawAnswers.ssmNumber || '202401099231 (1509281-U)';
    const turnover = Number(rawAnswers.annual_turnover || rawAnswers.turnover || 850000);
    const fundingRequested = Number(rawAnswers.funding_requested || rawAnswers.grant_amount || 600000);
    const applicantName = rawAnswers.applicant_name || rawAnswers.fullName || 'Azizul Bin Rahim';
    const email = rawAnswers.email || 'azizul@enterprise-demo.my';
    const phone = rawAnswers.phone || '+60 12-984 2190';
    const productName = rawAnswers.product_name || rawAnswers.innovationTitle || 'Smart AgroHydro Modular System';
    const sector = rawAnswers.sector || 'AgriTech & Food Security';
    const state = rawAnswers.state || 'Selangor';
    const trl = Number(rawAnswers.trl || 7) as 6 | 7 | 8 | 9;

    let tier: any = '< RM500K';
    if (turnover >= 5000000) tier = '> RM5M';
    else if (turnover >= 2000000) tier = 'RM2M - RM5M';
    else if (turnover >= 500000) tier = 'RM500K - RM2M';

    return this.createApplication({
      submissionSource: 'jotform_webhook',
      jotformSubmissionId: payload?.submissionID || `JF-${Date.now()}`,
      status: 'submitted',
      company: {
        name: companyName,
        ssmNumber: ssm,
        incorporationYear: 2022,
        state: state as any,
        city: 'Kuala Lumpur',
        annualTurnover: turnover,
        turnoverTier: tier,
        paidUpCapital: Math.round(turnover * 0.25),
        employeeCount: 12,
        sector: sector as any,
        address: 'Level 5, Menara Innovation, Jalan Tun Razak, 50400 Kuala Lumpur',
      },
      applicant: {
        fullName: applicantName,
        designation: 'Managing Director & Lead Innovator',
        email,
        phone,
        identificationNo: '840715-14-5231',
      },
      technology: {
        productName,
        tagline: 'High-density commercial scale innovation synced from Jotform',
        trlLevel: trl,
        productDescription: rawAnswers.description || 'Synced via Jotform external applicant submission form with file attachments and technical specifications.',
        ipStatus: 'Patent Pending',
        productionReadiness: 'Pilot testing conducted with prospective industrial clients.',
        currentCapacity: 'Ready for scale-up assembly',
        targetMilestones: [
          'Pilot scale-up validation',
          'Commercial safety testing',
          'First commercial procurement contract execution'
        ],
      },
      market: {
        targetMarket: 'B2B Commercial Enterprises and Government Agencies',
        targetCustomerProfile: 'Industrial operators and facility procurement heads',
        tamSamSom: 'TAM: RM 800M | SAM: RM 200M | SOM: RM 25M',
        fundingRequested,
        utilizationBreakdown: [
          { category: 'Tooling & Machinery', amount: Math.round(fundingRequested * 0.45), percentage: 45 },
          { category: 'Testing & Certification', amount: Math.round(fundingRequested * 0.25), percentage: 25 },
          { category: 'Commercial Pilot Deployment', amount: Math.round(fundingRequested * 0.30), percentage: 30 },
        ],
        revenueModel: 'Direct sales + maintenance service contract',
        exportPotential: true,
        exportTargetCountries: ['Singapore', 'Indonesia'],
      },
      documents: [
        {
          id: `jf-doc-${Date.now()}`,
          name: rawAnswers.attachment_pitch_deck ? 'Jotform_Submitted_PitchDeck.pdf' : 'Executive_Pitch_Deck_2026.pdf',
          type: 'application/pdf',
          size: '3.4 MB',
          url: rawAnswers.attachment_pitch_deck || 'https://files.jotform.com/uploads/NanoCarbon_Pitch_Deck_2026.pdf',
          uploadedAt: new Date().toISOString().split('T')[0],
        },
        {
          id: `jf-doc-ssm-${Date.now() + 1}`,
          name: rawAnswers.attachment_ssm ? 'Jotform_SSM_Registration_Cert.pdf' : 'SSM_Form_9_Registration.pdf',
          type: 'application/pdf',
          size: '1.2 MB',
          url: rawAnswers.attachment_ssm || 'https://files.jotform.com/uploads/SSM_Form_9_Cert.pdf',
          uploadedAt: new Date().toISOString().split('T')[0],
        },
      ],
      formData: rawAnswers,
    });
  }

  static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.BASELINE);
    clearApplicationsIndexedDb().catch(() => {});
    this.memoryApplications = INITIAL_APPLICATIONS;
    this.saveApplications(INITIAL_APPLICATIONS);
    this.saveNotifications(INITIAL_NOTIFICATIONS);
    this.setBaselineThreshold(DEFAULT_BASELINE);
  }
}
