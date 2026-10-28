import React, { useState } from 'react';
import { GrantApplication } from '../../types/grant';
import {
  X,
  Building2,
  User,
  Cpu,
  DollarSign,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  FileCode,
  ExternalLink,
  ShieldCheck,
  Send,
  MessageSquare,
  Sparkles,
  Paperclip,
} from 'lucide-react';

interface ApplicationDossierModalProps {
  application: GrantApplication | null;
  onClose: () => void;
  onOpenReviewModal?: (app: GrantApplication) => void;
  onNavigateToCrm?: (app: GrantApplication) => void;
}

const CRITERIA_METADATA = [
  { key: 'marketPotential' as const, label: '1. Commercial Potential & Market Demand', weight: '25%', icon: TrendingUp, description: 'Market pull, customer validation, addressable market sizing (TAM/SAM/SOM)' },
  { key: 'techFeasibility' as const, label: '2. Technical Feasibility & TRL Validation', weight: '25%', icon: Cpu, description: 'Working prototype verification, TRL stage evidence, IP defensibility' },
  { key: 'teamCapability' as const, label: '3. Team Execution & Governance', weight: '20%', icon: User, description: 'Founders track record, technical depth, operational capability' },
  { key: 'financialSoundness' as const, label: '4. Financial Soundness & Fund Utilization', weight: '20%', icon: DollarSign, description: 'Realistic capex budget, quotation transparency, matching liquidity' },
  { key: 'ecosystemImpact' as const, label: '5. Socio-Economic Impact & Ecosystem Spillover', weight: '10%', icon: Award, description: 'High-skilled employment creation, import substitution, local supply chain' },
];

export const ApplicationDossierModal: React.FC<ApplicationDossierModalProps> = ({
  application,
  onClose,
  onOpenReviewModal,
  onNavigateToCrm,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'form1' | 'scoring' | 'form2' | 'documents' | 'raw'>('overview');

  if (!application) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-1 rounded-md border border-sky-300 shadow-2xs">
                {application.id}
              </span>
              <span className="text-xs font-bold capitalize px-2.5 py-1 rounded-md bg-slate-200 text-slate-800">
                Status: {application.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                Form 1: Complete
              </span>
              {application.supplementarySubmissions && application.supplementarySubmissions.length > 0 ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700" />
                  Form 2: Linked ({application.supplementarySubmissions.length} Submission)
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  Form 2: Awaiting Submission
                </span>
              )}
              {application.compositeScore !== undefined && (
                <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300">
                  Score: {application.compositeScore}%
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-800 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
              title="Close modal"
            >
              <span className="text-sm font-bold px-2">✕ Close</span>
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">{application.company.name}</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              <span className="font-semibold text-slate-800">{application.technology.productName}</span>
              <span className="mx-2 text-slate-300">|</span>
              <span className="font-semibold text-sky-700">TRL {application.technology.trlLevel}</span>
              <span className="mx-2 text-slate-300">|</span>
              <span>{application.company.sector}</span>
              <span className="mx-2 text-slate-300">|</span>
              <span>{application.company.city}, {application.company.state}</span>
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 -mb-5 pt-1 overflow-x-auto text-xs font-semibold">
            {[
              { key: 'overview', label: '📑 Consolidated Overview' },
              { key: 'form1', label: '📋 Form 1: Intake Information' },
              { key: 'scoring', label: '⚖️ Reviewer Scorecard (1-5 Scale)' },
              {
                key: 'form2',
                label: `📊 Form 2: Due Diligence ${
                  application.supplementarySubmissions?.length ? '✓' : '(Pending)'
                }`,
              },
              {
                key: 'documents',
                label: `📁 All Attachments (${
                  (application.documents?.length || 0) +
                  (application.supplementarySubmissions?.reduce(
                    (sum, s) => sum + (s.documents?.length || 0),
                    0
                  ) || 0)
                })`,
              },
              { key: 'raw', label: '🔍 Raw Form Fields & JSON' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key as any)}
                className={`px-3.5 py-2.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === t.key
                    ? 'border-sky-600 text-sky-800 bg-white font-bold rounded-t-md'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* TAB 1: CONSOLIDATED OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Pipeline Lifecycle Stepper */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Multi-Stage Application Lifecycle &amp; Linking Flow
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
                  <div className="p-2.5 rounded-lg border bg-emerald-50 border-emerald-300 text-emerald-950 text-left">
                    <div className="font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1. Form 1: Intake</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Primary profile, TRL &amp; Capex</p>
                  </div>

                  <div className={`p-2.5 rounded-lg border text-left ${
                    application.compositeScore ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <div className="font-bold flex items-center gap-1 text-[11px]">
                      {application.compositeScore ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                      <span>2. Scoring Review</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {application.compositeScore ? `Passed: ${application.compositeScore}%` : 'Dual evaluators scoring'}
                    </p>
                  </div>

                  <div className={`p-2.5 rounded-lg border text-left ${
                    application.supplementarySubmissions?.length ? 'bg-indigo-50 border-indigo-300 text-indigo-950' : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}>
                    <div className="font-bold flex items-center gap-1 text-[11px]">
                      {application.supplementarySubmissions?.length ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      <span>3. Form 2: Due Diligence</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {application.supplementarySubmissions?.length ? 'Traction & plans linked' : 'Awaiting submission'}
                    </p>
                  </div>

                  <div className={`p-2.5 rounded-lg border text-left ${
                    application.status === 'awarded' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <div className="font-bold flex items-center gap-1 text-[11px]">
                      {application.status === 'awarded' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                      <span>4. Grant Approval</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {application.status === 'awarded' ? 'Grant offer finalized' : 'Committee memo pending'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-sky-600" /> Form 1 Profile
                  </span>
                  <div className="space-y-1 text-slate-600 text-xs">
                    <div><strong>SSM:</strong> <span className="font-mono">{application.company.ssmNumber}</span></div>
                    <div><strong>Applicant:</strong> {application.applicant.fullName}</div>
                    <div><strong>Grant Requested:</strong> <span className="font-mono font-bold text-sky-900">RM {application.market.fundingRequested.toLocaleString()}</span></div>
                    <div><strong>TRL &amp; IP:</strong> TRL {application.technology.trlLevel} · {application.technology.ipStatus}</div>
                    <div><strong>Attached Files:</strong> {application.documents?.length || 0} files</div>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Award className="w-4 h-4 text-emerald-600" /> Reviewer Rubric
                  </span>
                  <div className="space-y-1 text-slate-600 text-xs">
                    <div className="flex justify-between items-center">
                      <span>Composite Score:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {application.compositeScore ? `${application.compositeScore}%` : 'Pending'}
                      </span>
                    </div>
                    <div><strong>Reviewer 1:</strong> {application.reviewer1Score ? `${application.reviewer1Score.reviewerName} (${application.reviewer1Score.totalWeightedScore}%)` : 'Pending'}</div>
                    <div><strong>Reviewer 2:</strong> {application.reviewer2Score ? `${application.reviewer2Score.reviewerName} (${application.reviewer2Score.totalWeightedScore}%)` : 'Pending'}</div>
                    <div><strong>Baseline Status:</strong> {application.baselinePassed ? '✅ Passed (≥75%)' : 'In Review'}</div>
                  </div>
                </div>

                <div className="p-4 border border-indigo-200 rounded-xl bg-indigo-50/40 space-y-2.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-indigo-600" /> Form 2 Due Diligence
                  </span>
                  {application.supplementarySubmissions && application.supplementarySubmissions.length > 0 ? (
                    <div className="space-y-1 text-slate-600 text-xs">
                      <div className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Stage 2 Data Linked!
                      </div>
                      <div><strong>Submitted:</strong> {new Date(application.supplementarySubmissions[0].submittedAt).toLocaleDateString()}</div>
                      <div><strong>Due Diligence Files:</strong> {application.supplementarySubmissions[0].documents?.length || 0} attached</div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs space-y-1">
                      <p>Form 2 has not yet been submitted by the applicant.</p>
                      <span className="text-[11px] font-mono text-indigo-700 block">Prefilled Ref ID: {application.id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FORM 1 INTAKE */}
          {activeTab === 'form1' && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-sky-600" /> Enterprise &amp; Corporate Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-500 block text-[10px]">Company Name</span><span className="font-bold text-slate-900">{application.company.name}</span></div>
                  <div><span className="text-slate-500 block text-[10px]">SSM Registration</span><span className="font-mono font-bold text-slate-800">{application.company.ssmNumber}</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Industry Sector</span><span className="font-semibold text-slate-800">{application.company.sector}</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Location</span><span className="font-semibold text-slate-800">{application.company.city}, {application.company.state}</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Annual Turnover</span><span className="font-mono font-bold text-slate-900">RM {application.company.annualTurnover.toLocaleString()}</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Paid-Up Capital</span><span className="font-semibold text-slate-800">RM {application.company.paidUpCapital.toLocaleString()} ({application.company.employeeCount} Employees)</span></div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <User className="w-4 h-4 text-sky-600" /> Applicant &amp; Management Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><span className="text-slate-500 block text-[10px]">Full Name</span><span className="font-bold text-slate-900">{application.applicant.fullName}</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Designation</span><span className="font-semibold text-slate-800">{application.applicant.designation}</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Email</span><span className="font-mono text-sky-700">{application.applicant.email}</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Mobile</span><span className="font-mono text-slate-800">{application.applicant.phone}</span></div>
                  <div><span className="text-slate-500 block text-[10px]">Identification No.</span><span className="font-mono text-slate-800">{application.applicant.identificationNo || 'Verified'}</span></div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Cpu className="w-4 h-4 text-sky-600" /> Innovation &amp; Technology Readiness
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{application.technology.productName}</span>
                      <span className="text-xs text-slate-500">{application.technology.tagline}</span>
                    </div>
                    <span className="px-2.5 py-1 bg-sky-100 text-sky-900 font-bold rounded-lg border border-sky-300 font-mono text-xs">
                      TRL {application.technology.trlLevel} · {application.technology.ipStatus}
                    </span>
                  </div>
                  <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed text-xs">
                    {application.technology.productDescription}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWER SCORECARD (1-5 SCALE) */}
          {activeTab === 'scoring' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Evaluator Rubric Scoring (1 to 5 Scale)</span>
                  <span className="text-[11px] text-slate-600">Each dimension is evaluated on a 1 – 5 scale, normalized by its weighting factor.</span>
                </div>
                {application.compositeScore !== undefined && (
                  <span className="font-mono font-bold text-base text-emerald-800 bg-white px-3 py-1 rounded border border-emerald-300">
                    Composite: {application.compositeScore}%
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {CRITERIA_METADATA.map((crit, idx) => {
                  const r1Score = application.reviewer1Score?.scores?.[crit.key];
                  const r2Score = application.reviewer2Score?.scores?.[crit.key];
                  const r1Remark = application.reviewer1Score?.criterionRemarks?.[crit.key];
                  const r2Remark = application.reviewer2Score?.criterionRemarks?.[crit.key];

                  return (
                    <div key={crit.key} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{crit.label}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Weight: {crit.weight}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 bg-sky-50/40 rounded-lg border border-sky-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">Reviewer 1 ({application.reviewer1Score?.reviewerName || 'Assigned'})</span>
                            <span className="font-mono font-bold text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-200">
                              {r1Score !== undefined ? `${r1Score} / 5` : 'Pending'}
                            </span>
                          </div>
                          <p className="text-slate-600 italic text-[11px]">"{r1Remark || 'No specific remarks recorded.'}"</p>
                        </div>

                        <div className="p-2.5 bg-indigo-50/40 rounded-lg border border-indigo-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">Reviewer 2 ({application.reviewer2Score?.reviewerName || 'Assigned'})</span>
                            <span className="font-mono font-bold text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200">
                              {r2Score !== undefined ? `${r2Score} / 5` : 'Pending'}
                            </span>
                          </div>
                          <p className="text-slate-600 italic text-[11px]">"{r2Remark || 'No specific remarks recorded.'}"</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: FORM 2 DUE DILIGENCE */}
          {activeTab === 'form2' && (
            <div className="space-y-4">
              {application.supplementarySubmissions && application.supplementarySubmissions.length > 0 ? (
                application.supplementarySubmissions.map((sub, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-900 text-xs">{sub.formTitle}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(sub.submittedAt).toLocaleString()}</span>
                    </div>
                    {sub.data?.market_traction_summary && (
                      <div>
                        <span className="text-slate-500 font-semibold block text-[10px] mb-1">Commercial Traction Summary:</span>
                        <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-800">{sub.data.market_traction_summary}</p>
                      </div>
                    )}
                    {sub.data?.future_plan_summary && (
                      <div>
                        <span className="text-slate-500 font-semibold block text-[10px] mb-1">3-Year Commercial Expansion Plan:</span>
                        <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-800">{sub.data.future_plan_summary}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                  <Clock className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="font-semibold text-slate-700 text-xs">Form 2 Supplementary Due Diligence is Pending</p>
                  <p className="text-[11px] text-slate-500">Applicant has not yet completed their Form 2 submission.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-2">
              {application.documents?.map((doc) => (
                <div key={doc.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-slate-900 text-xs truncate block">{doc.name}</span>
                      <span className="text-[10px] text-slate-400">{doc.size} • Uploaded on {doc.uploadedAt}</span>
                    </div>
                  </div>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-white border border-sky-300 rounded hover:bg-sky-50 flex items-center gap-1 shadow-2xs"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Archived</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: RAW FORM FIELDS */}
          {activeTab === 'raw' && (
            <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[10px] overflow-x-auto max-h-80 border border-slate-800">
              {JSON.stringify(
                {
                  id: application.id,
                  company: application.company,
                  applicant: application.applicant,
                  technology: application.technology,
                  market: application.market,
                  formData: application.formData || {},
                  supplementarySubmissions: application.supplementarySubmissions || [],
                },
                null,
                2
              )}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            {onOpenReviewModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReviewModal(application);
                }}
                className="px-4 py-2 font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm"
              >
                Open Reviewer Scoring Rubric (1-5)
              </button>
            )}
            {onNavigateToCrm && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToCrm(application);
                }}
                className="px-3.5 py-2 font-medium text-slate-700 border border-slate-300 bg-white rounded-lg hover:bg-slate-100"
              >
                Inspect in CRM Pipeline →
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
