import React, { useState } from 'react';
import { GrantApplication, RubricCriteriaScores, ReviewerScore } from '../../types/grant';
import { MOCK_REVIEWERS } from '../../data/mockData';
import { calculateWeightedScore, RUBRIC_WEIGHTS } from '../../services/rubricMath';
import {
  X,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Send,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  TrendingUp,
  Cpu,
  User,
  DollarSign,
  Globe,
} from 'lucide-react';

interface DualReviewerModalProps {
  application: GrantApplication;
  baselineThreshold: number;
  onClose: () => void;
  onSubmitReview: (
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
  ) => void;
  onAssignReviewers: (appId: string, r1Id: string, r2Id: string) => void;
}

const CRITERIA_CONFIG = [
  {
    key: 'marketPotential' as const,
    label: '1. Commercial Potential & Market Demand',
    weight: 25,
    icon: TrendingUp,
    description: 'Market pull, customer validation, addressable market sizing (TAM/SAM/SOM), and competition barrier.',
    placeholder: 'Enter reviewer comment on market demand, customer letters of intent, pilot commitments, and competitive positioning...',
    presetTags: [
      'Strong commercial pull validated with estate LOIs',
      'Realistic TAM/SAM/SOM addressable market sizing',
      'High barrier to entry against regional competitors',
      'Immediate client ROI demonstrated in pilot trial',
    ],
  },
  {
    key: 'techFeasibility' as const,
    label: '2. Technical Feasibility & TRL Validation',
    weight: 25,
    icon: Cpu,
    description: 'Working prototype verification, TRL 6-9 stage evidence, patent/IP defensibility, and production readiness.',
    placeholder: 'Enter reviewer comment on technical feasibility, laboratory bench tests, SIRIM/CE standards, and IP moat...',
    presetTags: [
      'TRL verified via working laboratory bench prototype',
      'Granted MyIPO patent provides solid defensibility',
      'Robust optical calibration methodology confirmed',
      'Manufacturing assembly jig is viable and scalable',
    ],
  },
  {
    key: 'teamCapability' as const,
    label: '3. Team Execution & Governance',
    weight: 20,
    icon: User,
    description: 'Founders track record, technical leadership credentials, operational team depth, and execution capacity.',
    placeholder: 'Enter reviewer comment on founders background, technical expertise, hiring roadmap, and key personnel credibility...',
    presetTags: [
      'Founders possess proven engineering and agronomy track record',
      'Key technical personnel have hands-on sector experience',
      'Clear recruitment roadmap for embedded systems engineers',
      'Strong governance and SSM compliance standing',
    ],
  },
  {
    key: 'financialSoundness' as const,
    label: '4. Financial Soundness & Fund Utilization',
    weight: 15,
    icon: DollarSign,
    description: 'Realistic capex tooling budget, quotation transparency, milestone cost justification, and financial health.',
    placeholder: 'Enter reviewer comment on capex justification, supplier quotes, audited turnover, and matching fund commitments...',
    presetTags: [
      'Audited turnover and SSM accounts verified',
      'Capex budget supported by formal vendor quotations',
      'Milestone disbursements aligned with deliverables',
      'Prudent working capital management demonstrated',
    ],
  },
  {
    key: 'ecosystemImpact' as const,
    label: '5. Socio-Economic & National Ecosystem Impact',
    weight: 15,
    icon: Globe,
    description: 'High-skilled employment creation in Malaysia, import substitution, supply chain localization, and ESG/food security.',
    placeholder: 'Enter reviewer comment on local job creation, Malaysian economic spillover, export potential, and national alignment...',
    presetTags: [
      'Direct high-skilled engineering jobs created in Malaysia',
      'Substantial import substitution for plantation sensing tech',
      'Strengthens local electronics supply chain localization',
      'Clear export roadmap to Indonesia and regional markets',
    ],
  },
];

const getScoreTier = (score: number) => {
  if (score >= 4.5) return { label: 'Benchmark / Exemplary (5/5)', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
  if (score >= 3.5) return { label: 'Strong / Meets Standards (4/5)', color: 'bg-sky-50 text-sky-800 border-sky-300' };
  if (score >= 2.5) return { label: 'Moderate / Gaps Identified (3/5)', color: 'bg-amber-50 text-amber-800 border-amber-300' };
  return { label: 'Inadequate / High Risk (1-2/5)', color: 'bg-rose-50 text-rose-800 border-rose-300' };
};

export const DualReviewerModal: React.FC<DualReviewerModalProps> = ({
  application,
  baselineThreshold,
  onClose,
  onSubmitReview,
  onAssignReviewers,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'evaluate' | 'assign'>('evaluate');
  const [selectedReviewerRole, setSelectedReviewerRole] = useState<'r1' | 'r2'>('r1');

  // Reviewer assignment state
  const [assignR1, setAssignR1] = useState(application.assignedReviewers[0] || 'rev-01');
  const [assignR2, setAssignR2] = useState(application.assignedReviewers[1] || 'rev-02');

  const activeReview = application.reviewer1Score;

  // Rubric scores state (1 to 5 scale)
  const [scores, setScores] = useState<RubricCriteriaScores>(
    activeReview?.scores || {
      marketPotential: 4,
      techFeasibility: 4,
      teamCapability: 4,
      financialSoundness: 3,
      ecosystemImpact: 4,
    }
  );

  const [remarks, setRemarks] = useState({
    marketPotential:
      activeReview?.criterionRemarks?.marketPotential ||
      'Strong commercial demand confirmed with prospective plantation customer segments.',
    techFeasibility:
      activeReview?.criterionRemarks?.techFeasibility ||
      `Valid TRL ${application.technology.trlLevel} readiness with verifiable IP documentation.`,
    teamCapability:
      activeReview?.criterionRemarks?.teamCapability ||
      'Key leadership possesses relevant domain experience and execution background.',
    financialSoundness:
      activeReview?.criterionRemarks?.financialSoundness ||
      'Proposed capex budget aligns transparently with milestone targets.',
    ecosystemImpact:
      activeReview?.criterionRemarks?.ecosystemImpact ||
      'Direct contribution to national technology self-reliance and local supply chain.',
  });

  const [generalRemarks, setGeneralRemarks] = useState(
    'Thorough and credible commercialization plan with clear execution timeline.'
  );
  const [recommendation, setRecommendation] = useState<'recommend_shortlist' | 'needs_revision' | 'reject'>(
    'recommend_shortlist'
  );

  const currentWeightedScore = calculateWeightedScore(scores);
  const willPassBaseline = currentWeightedScore >= baselineThreshold;

  const currentReviewerId = selectedReviewerRole === 'r1'
    ? application.assignedReviewers[0]
    : application.assignedReviewers[1];

  const currentReviewerObj = MOCK_REVIEWERS.find((r) => r.id === currentReviewerId) || MOCK_REVIEWERS[0];

  const handleSwitchRole = (role: 'r1' | 'r2') => {
    setSelectedReviewerRole(role);
    const existing = role === 'r1' ? application.reviewer1Score : application.reviewer2Score;
    if (existing) {
      setScores(existing.scores);
      setRemarks({
        marketPotential: existing.criterionRemarks?.marketPotential || '',
        techFeasibility: existing.criterionRemarks?.techFeasibility || '',
        teamCapability: existing.criterionRemarks?.teamCapability || '',
        financialSoundness: existing.criterionRemarks?.financialSoundness || '',
        ecosystemImpact: existing.criterionRemarks?.ecosystemImpact || '',
      });
      setGeneralRemarks(existing.generalRemarks || '');
      setRecommendation(existing.recommendation || 'recommend_shortlist');
    } else {
      setScores({
        marketPotential: 4,
        techFeasibility: 4,
        teamCapability: 4,
        financialSoundness: 3,
        ecosystemImpact: 4,
      });
      setRemarks({
        marketPotential: '',
        techFeasibility: '',
        teamCapability: '',
        financialSoundness: '',
        ecosystemImpact: '',
      });
      setGeneralRemarks('');
      setRecommendation('recommend_shortlist');
    }
  };

  const handleScoreChange = (key: keyof RubricCriteriaScores, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const handleRemarksChange = (key: keyof typeof remarks, val: string) => {
    setRemarks((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReview(application.id, currentReviewerId, {
      reviewerName: currentReviewerObj.name,
      reviewerRole: selectedReviewerRole === 'r1' ? 'Technical Lead Evaluator' : 'Commercial & Market Evaluator',
      scores,
      criterionRemarks: remarks,
      recommendation,
      generalRemarks,
    });
  };

  const handleSaveAssignments = () => {
    onAssignReviewers(application.id, assignR1, assignR2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {application.id}
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-600 font-medium">{application.company.sector}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Dual-Reviewer Scoring & Evaluation: {application.company.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 bg-white text-xs font-medium">
          <button
            onClick={() => setActiveTab('evaluate')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'evaluate'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Reviewer Scoring Rubric
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Application Dossier
          </button>
          <button
            onClick={() => setActiveTab('assign')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'assign'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Assign 2 Reviewers
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'evaluate' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Reviewer Slot Selector */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-500 block mb-1">
                    Select Evaluator Role to Score:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchRole('r1')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        selectedReviewerRole === 'r1'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Reviewer 1 (Assigned: {MOCK_REVIEWERS.find((r) => r.id === application.assignedReviewers[0])?.name || 'Dr. Aiman'})
                      {application.reviewer1Score && ' ✓'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchRole('r2')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        selectedReviewerRole === 'r2'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Reviewer 2 (Assigned: {MOCK_REVIEWERS.find((r) => r.id === application.assignedReviewers[1])?.name || 'Ir. Tan'})
                      {application.reviewer2Score && ' ✓'}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Baseline Threshold:</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{baselineThreshold}%</span>
                </div>
              </div>

              {/* Status comparison banner */}
              <div className="p-4 rounded-lg border bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-600">Calculated Weighted Score</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      {currentWeightedScore}%
                    </span>
                    <span className="text-xs text-slate-500">
                      {willPassBaseline ? (
                        <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Exceeds {baselineThreshold}% Baseline
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Below {baselineThreshold}% Baseline
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 max-w-xs">
                  When both Reviewer 1 & 2 scores average &ge; {baselineThreshold}%, the application automatically moves to <strong>Shortlisted</strong> and triggers an alert to the Grant Analyst.
                </div>
              </div>

              {/* 5-Dimensional Scoring Rubric with Mandatory Comments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Weighted Evaluation Dimensions (1 – 5 Scale & Section Comments)
                  </h3>
                  <span className="text-[11px] text-slate-500 italic">
                    All 5 sections require reviewer comments and score justifications
                  </span>
                </div>

                {CRITERIA_CONFIG.map((crit) => {
                  const tier = getScoreTier(scores[crit.key]);
                  const hasComment = remarks[crit.key] && remarks[crit.key].trim().length > 0;
                  return (
                    <div
                      key={crit.key}
                      className="p-4 border border-slate-200 rounded-xl bg-white space-y-3.5 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      {/* Section Title & Score Tier */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                         <div>
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <crit.icon className="w-4 h-4 text-sky-600" />
                            {crit.label}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {crit.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tier.color}`}>
                            {tier.label}
                          </span>
                          <span className="font-mono text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                            {scores[crit.key]} / 5
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({crit.weight}% Weight)
                          </span>
                        </div>
                      </div>

                      {/* Quick-Pick Score Buttons (1-5) and Slider */}
                      <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Select Score (1 - 5 Scale):
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Contribution: {((scores[crit.key] / 5) * crit.weight).toFixed(1)}% / {crit.weight}%
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5].map((num) => {
                            const isSelected = scores[crit.key] === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleScoreChange(crit.key, num)}
                                className={`py-1.5 text-xs font-bold rounded-lg font-mono transition-all ${
                                  isSelected
                                    ? 'bg-sky-700 text-white shadow-xs scale-105 ring-2 ring-sky-300'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-300'
                                }`}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={scores[crit.key]}
                          onChange={(e) => handleScoreChange(crit.key, Number(e.target.value))}
                          className="w-full accent-sky-600 cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Reviewer Section Comment (Prominent & Dedicated) */}
                      <div className="pt-1 space-y-2 bg-sky-50/30 p-3 rounded-lg border border-sky-100">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                            Reviewer Comment & Justification:
                          </label>
                          {hasComment ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Comment recorded ({remarks[crit.key].length} chars)
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              ⚠️ Section comment requested
                            </span>
                          )}
                        </div>

                        {/* Quick Prompts / Tags */}
                        {crit.presetTags && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-slate-400 font-medium">Quick observations:</span>
                            {crit.presetTags.map((tag, tIdx) => (
                              <button
                                key={tIdx}
                                type="button"
                                onClick={() => {
                                  const current = remarks[crit.key] || '';
                                  const separator = current.trim().length > 0 ? ' ' : '';
                                  handleRemarksChange(crit.key, `${current}${separator}${tag}.`);
                                }}
                                className="text-[10px] bg-white text-slate-700 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 px-2 py-0.5 rounded-md transition-all shadow-2xs font-medium cursor-pointer"
                              >
                                + {tag}
                              </button>
                            ))}
                          </div>
                        )}

                        <textarea
                          rows={2}
                          value={remarks[crit.key]}
                          onChange={(e) => handleRemarksChange(crit.key, e.target.value)}
                          placeholder={crit.placeholder}
                          className="w-full text-xs border border-slate-300 rounded-md p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-2xs leading-relaxed"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommendation & General Remarks */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Evaluator Recommendation:
                    </label>
                    <select
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value as any)}
                      className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 bg-slate-50 text-slate-800 font-medium focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="recommend_shortlist">Recommend for Shortlisting (Proceed to Analyst Due Diligence)</option>
                      <option value="needs_revision">Conditional / Needs Clarification from Applicant</option>
                      <option value="reject">Reject Application (Does Not Meet Commercial Criteria)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Evaluator Identity:
                    </label>
                    <div className="text-xs font-medium text-slate-800 p-2 border border-slate-200 rounded bg-slate-50">
                      {currentReviewerObj.name} ({currentReviewerObj.organization})
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Overall Evaluation Summary & Executive Brief:
                  </label>
                  <textarea
                    rows={3}
                    value={generalRemarks}
                    onChange={(e) => setGeneralRemarks(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Save & Record {selectedReviewerRole === 'r1' ? 'Reviewer 1' : 'Reviewer 2'} Score ({currentWeightedScore}%)
                </button>
              </div>
            </form>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-slate-500 block">Company Name:</span>
                  <span className="font-semibold text-slate-900">{application.company.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">SSM Registration:</span>
                  <span className="font-mono text-slate-900">{application.company.ssmNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Location:</span>
                  <span>{application.company.city}, {application.company.state}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Annual Turnover:</span>
                  <span className="font-mono font-bold text-slate-900">
                    RM {application.company.annualTurnover.toLocaleString()} ({application.company.turnoverTier})
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Product / Technology Overview</h4>
                <div className="p-3 border border-slate-200 rounded bg-white">
                  <div className="font-semibold text-slate-900 mb-1">{application.technology.productName}</div>
                  <p className="text-slate-600 mb-2 leading-relaxed">{application.technology.productDescription}</p>
                  <div className="flex items-center gap-4 text-slate-500">
                    <span>Readiness: <strong>TRL {application.technology.trlLevel}</strong></span>
                    <span>IP Status: <strong>{application.technology.ipStatus}</strong></span>
                    <span>Capacity: <strong>{application.technology.currentCapacity}</strong></span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Commercialization & Fund Utilization</h4>
                <div className="p-3 border border-slate-200 rounded bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Requested Funding:</span>
                    <span className="font-mono font-bold text-sky-700 text-sm">
                      RM {application.market.fundingRequested.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Target Market: {application.market.targetMarket}
                  </div>
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-700 block">Milestone Utilization:</span>
                    {application.market.utilizationBreakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600">
                        <span>{item.category} ({item.percentage}%)</span>
                        <span className="font-mono tabular-nums">RM {item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Document Attachments ({application.documents.length})</h4>
                <div className="space-y-1.5">
                  {application.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 border border-slate-200 rounded bg-white">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-600" />
                        <span className="font-medium text-slate-800">{doc.name}</span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">{doc.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assign' && (
            <div className="space-y-5">
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg text-xs text-sky-900 leading-relaxed">
                <strong>Grant Governance Rule:</strong> Each commercialization grant application must be evaluated by two independent accredited reviewers (one technical specialist and one commercial/market specialist). When you save assignments, automatic email invitations will be queued and sent to both reviewers.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg bg-white space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <UserCheck className="w-4 h-4 text-sky-600" />
                    Reviewer 1 (Technical Lead)
                  </div>
                  <select
                    value={assignR1}
                    onChange={(e) => setAssignR1(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-slate-50 text-slate-800 font-medium"
                  >
                    {MOCK_REVIEWERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.organization})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Responsible for TRL validation, engineering feasibility, and IP strength.
                  </p>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg bg-white space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Reviewer 2 (Market & Commercial Lead)
                  </div>
                  <select
                    value={assignR2}
                    onChange={(e) => setAssignR2(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-slate-50 text-slate-800 font-medium"
                  >
                    {MOCK_REVIEWERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.organization})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Responsible for commercialization traction, pricing model, and export readiness.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Save Assignments & Dispatch Reviewer Invitation Emails
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
