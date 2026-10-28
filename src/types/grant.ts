export type GrantStatus =
  | 'submitted'
  | 'screening'
  | 'scoring_review'
  | 'shortlisted'
  | 'analyst_due_diligence'
  | 'committee_approval'
  | 'awarded'
  | 'rejected';

export type IndustrySector =
  | 'AgriTech & Food Security'
  | 'Deep Tech & AI'
  | 'Clean Energy & Mobility'
  | 'Digital Health & Biotech'
  | 'Smart Manufacturing & IoT'
  | 'Creative Multimedia & FinTech';

export type MalaysianState =
  | 'Selangor'
  | 'Kuala Lumpur'
  | 'Penang'
  | 'Johor'
  | 'Sarawak'
  | 'Sabah'
  | 'Perak'
  | 'Kedah'
  | 'Melaka'
  | 'Pahang'
  | 'Negeri Sembilan'
  | 'Terengganu'
  | 'Kelantan'
  | 'Perlis'
  | 'Putrajaya'
  | 'Labuan';

export type TurnoverTier =
  | '< RM500K'
  | 'RM500K - RM2M'
  | 'RM2M - RM5M'
  | '> RM5M';

export type IPStatus =
  | 'Patented'
  | 'Patent Pending'
  | 'Trade Secret'
  | 'Copyright'
  | 'None';

export interface CompanyInfo {
  name: string;
  ssmNumber: string;
  incorporationYear: number;
  state: MalaysianState;
  city: string;
  annualTurnover: number;
  turnoverTier: TurnoverTier;
  paidUpCapital: number;
  employeeCount: number;
  sector: IndustrySector;
  website?: string;
  address: string;
}

export interface ApplicantInfo {
  fullName: string;
  designation: string;
  email: string;
  phone: string;
  identificationNo: string;
  secondaryContactName?: string;
  secondaryContactPhone?: string;
}

export interface ProductionTechInfo {
  productName: string;
  tagline: string;
  trlLevel: 6 | 7 | 8 | 9;
  productDescription: string;
  ipStatus: IPStatus;
  productionReadiness: string;
  currentCapacity: string;
  targetMilestones: string[];
}

export interface FundBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface MarketInfo {
  targetMarket: string;
  targetCustomerProfile: string;
  tamSamSom: string;
  fundingRequested: number;
  utilizationBreakdown: FundBreakdownItem[];
  revenueModel: string;
  exportPotential: boolean;
  exportTargetCountries: string[];
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  url?: string;
  uploadedAt: string;
}

export interface RubricCriteriaScores {
  marketPotential: number;     // 1-10 (Weight 25%)
  techFeasibility: number;     // 1-10 (Weight 25%)
  teamCapability: number;      // 1-10 (Weight 20%)
  financialSoundness: number;  // 1-10 (Weight 20%)
  ecosystemImpact: number;     // 1-10 (Weight 10%)
}

export interface ReviewerScore {
  reviewerId: string;
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
  totalWeightedScore: number; // 0 - 100%
  recommendation: 'recommend_shortlist' | 'needs_revision' | 'reject';
  generalRemarks: string;
  evaluatedAt: string;
}

export interface SupplementarySubmission {
  id: string;
  formId?: string;
  formTitle: string;
  submittedAt: string;
  data: Record<string, any>;
  documents?: DocumentAttachment[];
}

export interface GrantApplication {
  id: string; // e.g., CRG-2026-0841
  submissionSource: 'portal' | 'jotform_webhook';
  jotformSubmissionId?: string;
  status: GrantStatus;
  company: CompanyInfo;
  applicant: ApplicantInfo;
  technology: ProductionTechInfo;
  market: MarketInfo;
  documents: DocumentAttachment[];
  assignedReviewers: [string, string]; // [reviewer1Id, reviewer2Id]
  reviewer1Score?: ReviewerScore;
  reviewer2Score?: ReviewerScore;
  compositeScore?: number; // Average of both reviewers
  baselinePassed?: boolean;
  assignedAnalystId?: string;
  assignedAnalystName?: string;
  assignedAnalystEmail?: string;
  analystNotes?: string;
  committeeDecision?: {
    decision: 'approved' | 'conditional' | 'rejected';
    memo: string;
    grantApprovedAmount: number;
    approvedDate: string;
  };
  formData?: Record<string, any>; // Stores arbitrary & changing form questions from Jotform/custom forms
  supplementarySubmissions?: SupplementarySubmission[]; // Form 2 (Due Diligence / Traction / Future Plans) linked via application_id
  createdAt: string;
  updatedAt: string;
}

export interface EmailNotification {
  id: string;
  applicationId: string;
  companyName: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole: 'applicant' | 'reviewer' | 'analyst' | 'committee';
  subject: string;
  body: string;
  templateType:
    | 'SUBMISSION_CONFIRMATION'
    | 'REVIEWER_ASSIGNMENT'
    | 'SHORTLIST_ANALYST_ALERT'
    | 'APPLICANT_SHORTLISTED'
    | 'CLARIFICATION_REQUIRED'
    | 'GRANT_AWARD_OFFER'
    | 'APPLICATION_REJECTED';
  sentAt: string;
  status: 'delivered' | 'simulated';
}

export interface ReviewerProfile {
  id: string;
  name: string;
  email: string;
  expertise: IndustrySector[];
  organization: string;
  activeReviewsCount: number;
}

export interface AnalystProfile {
  id: string;
  name: string;
  email: string;
  specialization: string;
  activeCasesCount: number;
}
