import React, { useState, useMemo } from 'react';
import {
  GrantApplication,
  GrantStatus,
  IndustrySector,
} from '../../types/grant';
import { MOCK_ANALYSTS, MOCK_REVIEWERS } from '../../data/mockData';
import { GrantStore } from '../../services/grantStore';
import {
  Search,
  Filter,
  Sliders,
  UserCheck,
  Award,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  Mail,
  FileText,
  Paperclip,
  ExternalLink,
  Download,
  Link as LinkIcon,
  Copy,
  Check,
  Send,
  Sparkles,
  FileSpreadsheet,
  Building2,
  User,
  Cpu,
  Globe,
  MapPin,
  Calendar,
  DollarSign,
  ShieldCheck,
  FileCode,
  MessageSquare,
  Quote,
} from 'lucide-react';

interface GrantCRMProps {
  applications: GrantApplication[];
  baselineThreshold: number;
  onUpdateBaseline: (val: number) => void;
  onOpenReviewModal: (app: GrantApplication) => void;
  onAssignAnalyst: (appId: string, analystId: string) => void;
  onUpdateStatus: (appId: string, status: GrantStatus) => void;
  onOpenEmailCenterWithRecipient?: (app: GrantApplication) => void;
  onDataRefresh?: () => void;
}

const CRITERIA_METADATA = [
  {
    key: 'marketPotential' as const,
    label: '1. Commercial Potential & Market Demand',
    weight: '25%',
    icon: TrendingUp,
    description: 'Market pull, customer validation, addressable market sizing (TAM/SAM/SOM), and competition barrier.',
  },
  {
    key: 'techFeasibility' as const,
    label: '2. Technical Feasibility & TRL Validation',
    weight: '25%',
    icon: Cpu,
    description: 'Working prototype verification, TRL 6-9 stage evidence, patent/IP defensibility, and production readiness.',
  },
  {
    key: 'teamCapability' as const,
    label: '3. Team Execution & Governance',
    weight: '20%',
    icon: User,
    description: 'Founders track record, technical leadership credentials, operational team depth, and execution capacity.',
  },
  {
    key: 'financialSoundness' as const,
    label: '4. Financial Soundness & Fund Utilization',
    weight: '15%',
    icon: DollarSign,
    description: 'Realistic capex tooling budget, quotation transparency, milestone cost justification, and financial health.',
  },
  {
    key: 'ecosystemImpact' as const,
    label: '5. Socio-Economic & National Ecosystem Impact',
    weight: '15%',
    icon: Globe,
    description: 'High-skilled employment creation in Malaysia, import substitution, supply chain localization, and ESG/food security.',
  },
];

const PIPELINE_STAGES: { key: GrantStatus; label: string; countColor: string }[] = [
  { key: 'submitted', label: '1. New Submissions', countColor: 'bg-slate-200 text-slate-800' },
  { key: 'scoring_review', label: '2. Scoring Review (2 Reviewers)', countColor: 'bg-amber-100 text-amber-800' },
  { key: 'shortlisted', label: '3. Shortlisted Baseline Met', countColor: 'bg-sky-100 text-sky-800' },
  { key: 'analyst_due_diligence', label: '4. Analyst Due Diligence', countColor: 'bg-indigo-100 text-indigo-800' },
  { key: 'awarded', label: '5. Grant Awarded', countColor: 'bg-emerald-100 text-emerald-800' },
];

export const GrantCRM: React.FC<GrantCRMProps> = ({
  applications,
  baselineThreshold,
  onUpdateBaseline,
  onOpenReviewModal,
  onAssignAnalyst,
  onUpdateStatus,
  onOpenEmailCenterWithRecipient,
  onDataRefresh,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<GrantApplication | null>(null);
  const [copiedForm2Link, setCopiedForm2Link] = useState(false);
  const [dossierTab, setDossierTab] = useState<'overview' | 'form1' | 'scoring' | 'form2' | 'documents' | 'raw'>('overview');
  const [scoringViewMode, setScoringViewMode] = useState<'cards' | 'comparison'>('cards');

  const handleSimulateApplicantForm2 = (app: GrantApplication) => {
    const payload = {
      submissionID: `supp-${Date.now()}`,
      formID: '241088492019',
      application_id: app.id,
      rawRequest: {
        application_id: app.id,
        form_title: 'Stage 2 Supplementary Due Diligence (Market Traction & Future Plans)',
        market_traction_summary: `Validated industrial pilot with 3 semiconductor fabs in Penang. Achieved RM 480,000 in early commercial membrane cartridges delivered, 100% client reorder rate over past 6 months.`,
        future_plan_summary: `3-Year Commercial Expansion: Scaled manufacturing output to 5,000 units/quarter, expanding distribution to Singapore & Vietnam, targeting RM 5.8M ARR by 2028.`,
        attachment_market_traction: 'https://files.jotform.com/uploads/NanoCarbon_Audited_Market_Traction_2026.pdf',
        attachment_market_traction_name: 'Audited_Traction_Client_Pilots_2026.pdf',
        attachment_future_plans: 'https://files.jotform.com/uploads/3Year_Commercialization_Financial_Model.xlsx',
        attachment_future_plans_name: '3Year_Expansion_Financial_Model.xlsx',
        attachment_loi: 'https://files.jotform.com/uploads/Customer_LOIs_Semiconductor_Fabs.pdf',
        attachment_loi_name: 'Customer_Binding_LOIs_2026.pdf',
      },
    };

    const updated = GrantStore.parseJotformWebhookPayload(payload);
    setSelectedAppForDetail(updated);
    if (onDataRefresh) {
      onDataRefresh();
    }
  };

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        searchQuery === '' ||
        app.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.technology.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicant.fullName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSector = filterSector === 'all' || app.company.sector === filterSector;
      return matchSearch && matchSector;
    });
  }, [applications, searchQuery, filterSector]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Baseline Setting Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Company, Product, Ref ID, Applicant..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-3 py-2 bg-slate-50 font-medium text-slate-800"
          >
            <option value="all">All Sectors ({applications.length})</option>
            <option value="AgriTech & Food Security">AgriTech & Food Security</option>
            <option value="Deep Tech & AI">Deep Tech & AI</option>
            <option value="Clean Energy & Mobility">Clean Energy & Mobility</option>
            <option value="Digital Health & Biotech">Digital Health & Biotech</option>
            <option value="Smart Manufacturing & IoT">Smart Manufacturing & IoT</option>
            <option value="Creative Multimedia & FinTech">Creative Multimedia & FinTech</option>
          </select>
        </div>

        {/* Shortlist Baseline Configurator */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
          <div>
            <span className="font-semibold text-slate-700 block">Shortlist Baseline Threshold:</span>
            <span className="text-[11px] text-slate-500">Auto-triggers Analyst assignment when composite &ge; baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="60"
              max="90"
              step="5"
              value={baselineThreshold}
              onChange={(e) => onUpdateBaseline(Number(e.target.value))}
              className="w-24 accent-sky-600"
            />
            <span className="font-mono font-bold text-sky-800 bg-white border border-sky-200 px-2 py-0.5 rounded text-xs">
              {baselineThreshold}%
            </span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded transition-all ${
              viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Kanban Pipeline
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded transition-all ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Dense Table
          </button>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((col) => {
            const colApps = filteredApps.filter((a) => {
              if (col.key === 'submitted') return a.status === 'submitted' || a.status === 'screening';
              if (col.key === 'scoring_review') return a.status === 'scoring_review';
              if (col.key === 'shortlisted') return a.status === 'shortlisted';
              if (col.key === 'analyst_due_diligence') return a.status === 'analyst_due_diligence';
              if (col.key === 'awarded') return a.status === 'awarded';
              return false;
            });

            return (
              <div key={col.key} className="bg-slate-100/70 border border-slate-200 rounded-lg p-3 flex flex-col min-w-[260px] max-h-[800px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
                  <span className="text-xs font-bold text-slate-900 truncate">{col.label}</span>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${col.countColor}`}>
                    {colApps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {colApps.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded bg-white/50">
                      No applications in this phase
                    </div>
                  ) : (
                    colApps.map((app) => (
                      <div
                        key={app.id}
                        className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs hover:border-slate-400 transition-all space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                            {app.id}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {app.company.state} · TRL {app.technology.trlLevel}
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900 truncate">{app.company.name}</div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">{app.technology.productName}</div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">
                            RM {(app.market.fundingRequested / 1000).toLocaleString()}K
                          </span>
                          {app.compositeScore ? (
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {app.compositeScore}% Score
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Scores pending</span>
                          )}
                        </div>

                        {/* Reviewer / Analyst badges */}
                        <div className="pt-1 text-[11px] text-slate-500 space-y-0.5">
                          {app.reviewer1Score && app.reviewer2Score ? (
                            <div className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Both Reviewers Completed
                            </div>
                          ) : (
                            <div className="text-amber-700 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Reviewers: {app.reviewer1Score ? '1/2' : app.reviewer2Score ? '1/2' : '0/2'}
                            </div>
                          )}

                          {app.assignedAnalystName && (
                            <div className="text-indigo-800 font-medium truncate">
                              Analyst: {app.assignedAnalystName}
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenReviewModal(app)}
                            className="py-1 px-2 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 text-center"
                          >
                            Score Rubric
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppForDetail(app);
                              setDossierTab('overview');
                            }}
                            className="py-1 px-2.5 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 flex items-center gap-1 shadow-2xs"
                            title="View Full Application Dossier (Form 1 & Form 2)"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-600" />
                            <span>Form 1 & 2</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DENSE TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Company & Innovation</th>
                  <th className="p-3">Sector</th>
                  <th className="p-3">Turnover Tier</th>
                  <th className="p-3">TRL</th>
                  <th className="p-3 text-right">Requested</th>
                  <th className="p-3 text-center">Composite Score</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAppForDetail(app);
                          setDossierTab('overview');
                        }}
                        className="font-mono font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1 text-left"
                        title="Click to view full Form 1 & Form 2 submissions"
                      >
                        <span>{app.id}</span>
                        <Eye className="w-3 h-3 text-sky-500 opacity-70" />
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{app.company.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{app.technology.productName}</div>
                    </td>
                    <td className="p-3 text-slate-600">{app.company.sector}</td>
                    <td className="p-3 font-mono text-[11px]">{app.company.turnoverTier}</td>
                    <td className="p-3 font-semibold">TRL {app.technology.trlLevel}</td>
                    <td className="p-3 text-right font-mono font-bold">
                      RM {app.market.fundingRequested.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      {app.compositeScore ? (
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {app.compositeScore}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Pending</span>
                      )}
                    </td>
                    <td className="p-3 capitalize text-slate-700 font-medium">
                      {app.status.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenReviewModal(app)}
                          className="px-2 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded hover:bg-sky-100"
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppForDetail(app);
                            setDossierTab('overview');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 hover:border-slate-400 flex items-center gap-1 shadow-2xs"
                          title="View Full Form 1 & Form 2 Submissions"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-600" />
                          <span>View Form 1 & 2</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL DOSSIER MODAL (FORM 1 & FORM 2 FULL INFORMATION) */}
      {selectedAppForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 shrink-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-1 rounded-md border border-sky-300 shadow-2xs">
                    {selectedAppForDetail.id}
                  </span>
                  <span className="text-xs font-bold capitalize px-2.5 py-1 rounded-md bg-slate-200 text-slate-800">
                    Status: {selectedAppForDetail.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Form 1: Complete
                  </span>
                  {selectedAppForDetail.supplementarySubmissions && selectedAppForDetail.supplementarySubmissions.length > 0 ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700" />
                      Form 2: Linked ({selectedAppForDetail.supplementarySubmissions.length} Submission)
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      Form 2: Awaiting Submission
                    </span>
                  )}
                  {selectedAppForDetail.compositeScore && (
                    <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300">
                      Score: {selectedAppForDetail.compositeScore}%
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAppForDetail(null)}
                  className="text-slate-400 hover:text-slate-800 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
                  title="Close modal"
                >
                  <span className="text-sm font-bold px-2">✕ Close</span>
                </button>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedAppForDetail.company.name}</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  <span className="font-semibold text-slate-800">{selectedAppForDetail.technology.productName}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="font-semibold text-sky-700">TRL {selectedAppForDetail.technology.trlLevel}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span>{selectedAppForDetail.company.sector}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span>{selectedAppForDetail.company.city}, {selectedAppForDetail.company.state}</span>
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-200 -mb-5 pt-1 overflow-x-auto text-xs font-semibold">
                {[
                  { key: 'overview', label: '📑 Consolidated Overview' },
                  { key: 'form1', label: '📋 Form 1: Intake Information' },
                  { key: 'scoring', label: '⚖️ Reviewer Scorecard' },
                  {
                    key: 'form2',
                    label: `📊 Form 2: Due Diligence ${
                      selectedAppForDetail.supplementarySubmissions?.length ? '✓' : '(Pending)'
                    }`,
                  },
                  {
                    key: 'documents',
                    label: `📁 All Attachments (${
                      (selectedAppForDetail.documents?.length || 0) +
                      (selectedAppForDetail.supplementarySubmissions?.reduce(
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
                    onClick={() => setDossierTab(t.key as any)}
                    className={`px-3.5 py-2.5 border-b-2 transition-all whitespace-nowrap ${
                      dossierTab === t.key
                        ? 'border-sky-600 text-sky-800 bg-white font-bold rounded-t-md'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body with Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
              {/* TAB 1: CONSOLIDATED OVERVIEW */}
              {dossierTab === 'overview' && (
                <div className="space-y-5">
                  {/* Pipeline Lifecycle Stepper */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                      Multi-Stage Application Lifecycle & Linking Flow
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
                      <div className="p-2.5 rounded-lg border bg-emerald-50 border-emerald-300 text-emerald-950 text-left">
                        <div className="font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>1. Form 1: Intake</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Primary profile, TRL & Capex</p>
                      </div>

                      <div className={`p-2.5 rounded-lg border text-left ${
                        selectedAppForDetail.compositeScore ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <div className="font-bold flex items-center gap-1 text-[11px]">
                          {selectedAppForDetail.compositeScore ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                          <span>2. Scoring Review</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {selectedAppForDetail.compositeScore ? `Passed: ${selectedAppForDetail.compositeScore}%` : 'Dual evaluators scoring'}
                        </p>
                      </div>

                      <div className={`p-2.5 rounded-lg border text-left ${
                        selectedAppForDetail.supplementarySubmissions?.length ? 'bg-indigo-50 border-indigo-300 text-indigo-950' : 'bg-amber-50 border-amber-300 text-amber-950'
                      }`}>
                        <div className="font-bold flex items-center gap-1 text-[11px]">
                          {selectedAppForDetail.supplementarySubmissions?.length ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          <span>3. Form 2: Due Diligence</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {selectedAppForDetail.supplementarySubmissions?.length ? 'Market traction submitted' : 'Assigned analyst verification'}
                        </p>
                      </div>

                      <div className={`p-2.5 rounded-lg border text-left ${
                        selectedAppForDetail.status === 'awarded' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <div className="font-bold flex items-center gap-1 text-[11px]">
                          {selectedAppForDetail.status === 'awarded' ? <Award className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                          <span>4. Committee Award</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Final grant disbursement</p>
                      </div>
                    </div>
                  </div>

                  {/* Stage Advance & Analyst Assignment Bar */}
                  <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Current Phase:</span>
                        <span className="font-bold text-slate-900 capitalize text-sm">
                          {selectedAppForDetail.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">Advance Phase:</span>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateStatus(selectedAppForDetail.id, 'shortlisted');
                            setSelectedAppForDetail((prev) => (prev ? { ...prev, status: 'shortlisted' } : null));
                          }}
                          className="px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded font-semibold hover:bg-sky-100"
                        >
                          Shortlisted
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateStatus(selectedAppForDetail.id, 'analyst_due_diligence');
                            setSelectedAppForDetail((prev) => (prev ? { ...prev, status: 'analyst_due_diligence' } : null));
                          }}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded font-semibold hover:bg-indigo-100"
                        >
                          Due Diligence
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateStatus(selectedAppForDetail.id, 'awarded');
                            setSelectedAppForDetail((prev) => (prev ? { ...prev, status: 'awarded' } : null));
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 shadow-2xs"
                        >
                          Award Grant
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">Assigned Analyst:</span>
                        <select
                          value={selectedAppForDetail.assignedAnalystId || ''}
                          onChange={(e) => onAssignAnalyst(selectedAppForDetail.id, e.target.value)}
                          className="border border-slate-300 rounded px-2 py-1 bg-white font-medium"
                        >
                          <option value="" disabled>Assign Analyst...</option>
                          {MOCK_ANALYSTS.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 3 Executive Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card 1: Form 1 Summary */}
                    <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-sky-600" /> Form 1: Intake Summary
                        </span>
                        <button
                          type="button"
                          onClick={() => setDossierTab('form1')}
                          className="text-[11px] font-bold text-sky-700 hover:underline"
                        >
                          View Full Form 1 →
                        </button>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        <div><strong>SSM:</strong> <span className="font-mono">{selectedAppForDetail.company.ssmNumber}</span></div>
                        <div><strong>Applicant:</strong> {selectedAppForDetail.applicant.fullName} ({selectedAppForDetail.applicant.designation})</div>
                        <div><strong>Turnover:</strong> <span className="font-mono font-semibold text-slate-900">RM {selectedAppForDetail.company.annualTurnover.toLocaleString()}</span> ({selectedAppForDetail.company.turnoverTier})</div>
                        <div><strong>Grant Requested:</strong> <span className="font-mono font-bold text-sky-900">RM {selectedAppForDetail.market.fundingRequested.toLocaleString()}</span></div>
                        <div><strong>TRL & IP:</strong> TRL {selectedAppForDetail.technology.trlLevel} · {selectedAppForDetail.technology.ipStatus}</div>
                        <div><strong>Intake Files:</strong> {selectedAppForDetail.documents?.length || 0} files attached</div>
                      </div>
                    </div>

                    {/* Card 2: Reviewer Scoring Summary */}
                    <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <UserCheck className="w-4 h-4 text-emerald-600" /> Reviewer Rubric
                        </span>
                        <button
                          type="button"
                          onClick={() => setDossierTab('scoring')}
                          className="text-[11px] font-bold text-sky-700 hover:underline"
                        >
                          View Scorecard →
                        </button>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        <div className="flex justify-between items-center">
                          <span>Composite Score:</span>
                          <span className="font-mono font-bold text-sm text-emerald-700">
                            {selectedAppForDetail.compositeScore ? `${selectedAppForDetail.compositeScore}%` : 'Pending'}
                          </span>
                        </div>
                        <div><strong>Reviewer 1:</strong> {selectedAppForDetail.reviewer1Score ? `${selectedAppForDetail.reviewer1Score.reviewerName} (${selectedAppForDetail.reviewer1Score.totalWeightedScore}%)` : 'Pending'}</div>
                        <div><strong>Reviewer 2:</strong> {selectedAppForDetail.reviewer2Score ? `${selectedAppForDetail.reviewer2Score.reviewerName} (${selectedAppForDetail.reviewer2Score.totalWeightedScore}%)` : 'Pending'}</div>
                        <div><strong>Baseline Passed:</strong> {selectedAppForDetail.baselinePassed ? '✅ Passed (>=75%)' : 'In Review'}</div>
                        <div><strong>Section Feedback:</strong> <span className="text-emerald-700 font-semibold">5/5 sections with reviewer comments</span></div>
                        {selectedAppForDetail.reviewer1Score?.generalRemarks && (
                          <div className="text-[10px] text-slate-500 italic mt-1 line-clamp-2">
                            "{selectedAppForDetail.reviewer1Score.generalRemarks}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card 3: Form 2 Due Diligence Summary */}
                    <div className="p-4 border border-indigo-200 rounded-xl bg-indigo-50/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-indigo-600" /> Form 2: Due Diligence
                        </span>
                        <button
                          type="button"
                          onClick={() => setDossierTab('form2')}
                          className="text-[11px] font-bold text-indigo-700 hover:underline"
                        >
                          View Full Form 2 →
                        </button>
                      </div>
                      {selectedAppForDetail.supplementarySubmissions && selectedAppForDetail.supplementarySubmissions.length > 0 ? (
                        <div className="space-y-1 text-slate-600">
                          <div className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Stage 2 Information Linked!
                          </div>
                          <div><strong>Submission:</strong> {new Date(selectedAppForDetail.supplementarySubmissions[0].submittedAt).toLocaleDateString()}</div>
                          {selectedAppForDetail.supplementarySubmissions[0].data?.market_traction_summary && (
                            <div className="line-clamp-2 text-[11px] text-slate-700 font-medium">
                              "{selectedAppForDetail.supplementarySubmissions[0].data.market_traction_summary}"
                            </div>
                          )}
                          <div><strong>Due Diligence Files:</strong> {selectedAppForDetail.supplementarySubmissions[0].documents?.length || 0} attached</div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-slate-500 text-[11px]">
                            Form 2 has not yet been submitted by the applicant.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleSimulateApplicantForm2(selectedAppForDetail)}
                            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-2xs flex items-center justify-center gap-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Simulate Form 2 Submission
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DETAILED FORM 1 INTAKE INFORMATION */}
              {dossierTab === 'form1' && (
                <div className="space-y-6">
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sky-900 block text-xs">Form 1: Primary Grant Application Intake</span>
                      <span className="text-[11px] text-sky-700">
                        Submitted via {selectedAppForDetail.submissionSource === 'jotform_webhook' ? 'Jotform Webhook Integration' : 'Direct Portal Submission'} • Ref ID: <strong>{selectedAppForDetail.id}</strong>
                      </span>
                    </div>
                    {selectedAppForDetail.jotformSubmissionId && (
                      <span className="font-mono text-[11px] bg-white text-sky-800 px-2 py-1 rounded border border-sky-200">
                        Jotform ID: {selectedAppForDetail.jotformSubmissionId}
                      </span>
                    )}
                  </div>

                  {/* 1. Company Profile */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Building2 className="w-4 h-4 text-sky-600" />
                      1. Enterprise & Corporate Profile
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Company Name</span>
                        <span className="font-bold text-slate-900">{selectedAppForDetail.company.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">SSM Registration Number</span>
                        <span className="font-mono font-bold text-slate-800">{selectedAppForDetail.company.ssmNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Incorporation Year</span>
                        <span className="font-semibold text-slate-800">{selectedAppForDetail.company.incorporationYear}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Industry Sector</span>
                        <span className="font-semibold text-slate-800">{selectedAppForDetail.company.sector}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Location</span>
                        <span className="font-semibold text-slate-800">{selectedAppForDetail.company.city}, {selectedAppForDetail.company.state}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Registered Address</span>
                        <span className="text-slate-700 truncate block">{selectedAppForDetail.company.address || 'Registered HQ'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Annual Turnover</span>
                        <span className="font-mono font-bold text-slate-900">RM {selectedAppForDetail.company.annualTurnover.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Turnover Tier</span>
                        <span className="font-semibold text-slate-800">{selectedAppForDetail.company.turnoverTier}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Paid-Up Capital & Employees</span>
                        <span className="font-semibold text-slate-800">RM {selectedAppForDetail.company.paidUpCapital.toLocaleString()} ({selectedAppForDetail.company.employeeCount} Employees)</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Applicant & Contact Info */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <User className="w-4 h-4 text-sky-600" />
                      2. Primary Applicant & Management Contact
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Full Name</span>
                        <span className="font-bold text-slate-900">{selectedAppForDetail.applicant.fullName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Designation</span>
                        <span className="font-semibold text-slate-800">{selectedAppForDetail.applicant.designation}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Email Address</span>
                        <span className="font-mono text-sky-700">{selectedAppForDetail.applicant.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Direct Mobile</span>
                        <span className="font-mono text-slate-800">{selectedAppForDetail.applicant.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">MyKad / Identification No.</span>
                        <span className="font-mono text-slate-800">{selectedAppForDetail.applicant.identificationNo || 'Verified'}</span>
                      </div>
                      {selectedAppForDetail.applicant.secondaryContactName && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">Secondary Contact</span>
                          <span className="text-slate-800">{selectedAppForDetail.applicant.secondaryContactName} ({selectedAppForDetail.applicant.secondaryContactPhone})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Technology & TRL */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Cpu className="w-4 h-4 text-sky-600" />
                      3. Technology Readiness Level (TRL) & Innovation Description
                    </h3>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Product / Innovation Name</span>
                          <span className="font-bold text-sm text-slate-900">{selectedAppForDetail.technology.productName}</span>
                          <span className="block text-slate-500 italic mt-0.5">{selectedAppForDetail.technology.tagline}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-sky-100 text-sky-900 font-bold rounded-lg border border-sky-300 font-mono">
                            TRL {selectedAppForDetail.technology.trlLevel}
                          </span>
                          <span className="px-3 py-1 bg-slate-100 text-slate-800 font-semibold rounded-lg border border-slate-300">
                            IP: {selectedAppForDetail.technology.ipStatus}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                          Full Product Technical Specification:
                        </span>
                        <p className="text-slate-800 leading-relaxed">{selectedAppForDetail.technology.productDescription}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">Production Readiness Status:</span>
                          <p className="text-slate-800">{selectedAppForDetail.technology.productionReadiness}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">Current Monthly Manufacturing Capacity:</span>
                          <p className="text-slate-800">{selectedAppForDetail.technology.currentCapacity}</p>
                        </div>
                      </div>

                      {selectedAppForDetail.technology.targetMilestones && (
                        <div>
                          <span className="font-bold text-slate-800 block mb-1 text-[11px]">Key Commercialization Milestones (Form 1 Roadmap):</span>
                          <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                            {selectedAppForDetail.technology.targetMilestones.map((m, idx) => (
                              <li key={idx}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Commercial Market, Capex & Funding */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      4. Commercial Market Sizing & Capex Budget Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Total Funding Requested</span>
                          <span className="font-mono font-bold text-base text-emerald-700">
                            RM {selectedAppForDetail.market.fundingRequested.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Market Sizing (TAM / SAM / SOM)</span>
                          <span className="font-medium text-slate-800">{selectedAppForDetail.market.tamSamSom || 'Regional ASEAN focus'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Export Potential</span>
                          <span className="font-medium text-slate-800">
                            {selectedAppForDetail.market.exportPotential ? `Yes - ${selectedAppForDetail.market.exportTargetCountries?.join(', ')}` : 'Domestic Malaysia only'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] mb-0.5">Commercial Revenue Model</span>
                        <p className="text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200">
                          {selectedAppForDetail.market.revenueModel}
                        </p>
                      </div>

                      {selectedAppForDetail.market.utilizationBreakdown && (
                        <div>
                          <span className="font-bold text-slate-800 block mb-1 text-[11px]">Grant Budget Capex / Opex Allocation:</span>
                          <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-[11px] text-left">
                              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                                <tr>
                                  <th className="p-2">Expenditure Category</th>
                                  <th className="p-2 text-right">Allocated Amount</th>
                                  <th className="p-2 text-right">% of Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {selectedAppForDetail.market.utilizationBreakdown.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="p-2 font-medium">{item.category}</td>
                                    <td className="p-2 text-right font-mono font-bold">RM {item.amount.toLocaleString()}</td>
                                    <td className="p-2 text-right font-mono text-slate-600">{item.percentage}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. Form 1 Uploaded Files */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Paperclip className="w-4 h-4 text-slate-600" />
                      5. Form 1 Attached Uploads ({selectedAppForDetail.documents?.length || 0})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedAppForDetail.documents && selectedAppForDetail.documents.length > 0 ? (
                        selectedAppForDetail.documents.map((doc) => (
                          <div key={doc.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                              <div className="truncate">
                                <span className="font-semibold text-slate-900 truncate block text-[11px]">{doc.name}</span>
                                <span className="text-[10px] text-slate-500">{doc.size} • {doc.uploadedAt}</span>
                              </div>
                            </div>
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-white border border-sky-200 rounded hover:bg-sky-50 flex items-center gap-1 ml-2 shrink-0"
                              >
                                <ExternalLink className="w-3 h-3" /> View
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Archived</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic text-[11px]">No initial documents uploaded.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DUAL REVIEWER SCORING RUBRIC & SECTION COMMENTS */}
              {dossierTab === 'scoring' && (
                <div className="space-y-5">
                  {/* Executive Header Banner */}
                  <div className="p-4 bg-linear-to-r from-emerald-900 via-slate-900 to-sky-950 text-white rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono text-[11px] border border-emerald-400/30">
                          Stage 1.5 Evaluation
                        </span>
                        <h3 className="font-bold text-sm text-white">
                          Dual-Reviewer Scoring & Section Comments
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-300 max-w-xl">
                        Independent evaluation across 5 weighted dimensions. Every section features specific qualitative evaluator observations, score justifications, and evidence validation.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-300 block uppercase tracking-wider">Composite Score</span>
                        <div className="flex items-baseline gap-1.5 justify-end">
                          <span className="font-mono font-bold text-2xl text-emerald-300">
                            {selectedAppForDetail.compositeScore ? `${selectedAppForDetail.compositeScore}%` : 'Pending'}
                          </span>
                          <span className="text-[10px] text-slate-300">/ 100%</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenReviewModal(selectedAppForDetail)}
                        className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Score / Edit Comments
                      </button>
                    </div>
                  </div>

                  {/* Sub-view toggle (Section Matrix vs Evaluator Cards) */}
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setScoringViewMode('comparison')}
                        className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                          scoringViewMode === 'comparison'
                            ? 'bg-white text-sky-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
                        Section-by-Section Comments Matrix
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoringViewMode('cards')}
                        className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                          scoringViewMode === 'cards'
                            ? 'bg-white text-sky-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Full Evaluator Dossiers
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Baseline Pass Mark: <strong>{baselineThreshold}%</strong></span>
                      <span>·</span>
                      <span className="font-semibold text-emerald-700">
                        {selectedAppForDetail.baselinePassed ? '✅ Baseline Requirement Met' : '⏳ Baseline Pending'}
                      </span>
                    </div>
                  </div>

                  {/* VIEW MODE 1: SECTION-BY-SECTION COMPARISON WITH REVIEWER COMMENTS */}
                  {scoringViewMode === 'comparison' && (
                    <div className="space-y-4">
                      {CRITERIA_METADATA.map((crit, idx) => {
                        const r1ScoreVal = selectedAppForDetail.reviewer1Score?.scores?.[crit.key];
                        const r2ScoreVal = selectedAppForDetail.reviewer2Score?.scores?.[crit.key];
                        const r1Comment = selectedAppForDetail.reviewer1Score?.criterionRemarks?.[crit.key];
                        const r2Comment = selectedAppForDetail.reviewer2Score?.criterionRemarks?.[crit.key];

                        return (
                          <div
                            key={crit.key}
                            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition-all"
                          >
                            {/* Section Header */}
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                                  {idx + 1}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 text-xs block flex items-center gap-1.5">
                                    <crit.icon className="w-3.5 h-3.5 text-sky-600" />
                                    {crit.label}
                                  </span>
                                  <span className="text-[10px] text-slate-500">{crit.description}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  Weight: {crit.weight}
                                </span>
                              </div>
                            </div>

                            {/* Two Reviewers Comments & Scores Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                              {/* Reviewer 1 Column */}
                              <div className="p-4 space-y-2 bg-sky-50/20">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                                    <span className="font-bold text-xs text-slate-900">
                                      Reviewer 1: {selectedAppForDetail.reviewer1Score?.reviewerName || 'Assigned Evaluator'}
                                    </span>
                                  </div>
                                  {r1ScoreVal !== undefined ? (
                                    <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
                                      {r1ScoreVal} / 10
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">Score pending</span>
                                  )}
                                </div>

                                <div className="p-3 bg-white border border-sky-100 rounded-lg space-y-1 shadow-2xs">
                                  <div className="text-[10px] font-bold text-sky-800 flex items-center gap-1 uppercase tracking-wider">
                                    <MessageSquare className="w-3 h-3 text-sky-600" />
                                    Reviewer 1 Section Comment:
                                  </div>
                                  <p className="text-xs text-slate-800 leading-relaxed italic">
                                    {r1Comment ? (
                                      `"${r1Comment}"`
                                    ) : (
                                      <span className="text-slate-400 not-italic">No comment recorded for this section.</span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Reviewer 2 Column */}
                              <div className="p-4 space-y-2 bg-indigo-50/20">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    <span className="font-bold text-xs text-slate-900">
                                      Reviewer 2: {selectedAppForDetail.reviewer2Score?.reviewerName || 'Assigned Evaluator'}
                                    </span>
                                  </div>
                                  {r2ScoreVal !== undefined ? (
                                    <span className="font-mono text-xs font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300">
                                      {r2ScoreVal} / 10
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">Score pending</span>
                                  )}
                                </div>

                                <div className="p-3 bg-white border border-indigo-100 rounded-lg space-y-1 shadow-2xs">
                                  <div className="text-[10px] font-bold text-indigo-800 flex items-center gap-1 uppercase tracking-wider">
                                    <MessageSquare className="w-3 h-3 text-indigo-600" />
                                    Reviewer 2 Section Comment:
                                  </div>
                                  <p className="text-xs text-slate-800 leading-relaxed italic">
                                    {r2Comment ? (
                                      `"${r2Comment}"`
                                    ) : (
                                      <span className="text-slate-400 not-italic">No comment recorded for this section.</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* VIEW MODE 2: FULL EVALUATOR SCORECARDS */}
                  {scoringViewMode === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Reviewer 1 Full Dossier */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">Reviewer 1 Evaluation</span>
                            <span className="text-[11px] text-slate-500">
                              {selectedAppForDetail.reviewer1Score?.reviewerRole || 'Technical Evaluator'}
                            </span>
                          </div>
                          {selectedAppForDetail.reviewer1Score && (
                            <div className="text-right">
                              <span className="font-mono font-bold text-base text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                                {selectedAppForDetail.reviewer1Score.totalWeightedScore}%
                              </span>
                            </div>
                          )}
                        </div>

                        {selectedAppForDetail.reviewer1Score ? (
                          <div className="space-y-3">
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                              <div><strong>Evaluator:</strong> {selectedAppForDetail.reviewer1Score.reviewerName}</div>
                              <div><strong>Date Evaluated:</strong> {selectedAppForDetail.reviewer1Score.evaluatedAt}</div>
                              <div>
                                <strong>Recommendation:</strong>{' '}
                                <span className="font-semibold text-emerald-700 capitalize">
                                  {selectedAppForDetail.reviewer1Score.recommendation.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>

                            {/* Section-by-Section Scoring & Comments */}
                            <div className="space-y-2.5">
                              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                                Section Scores & Reviewer Comments:
                              </span>

                              {CRITERIA_METADATA.map((crit) => {
                                const sc = selectedAppForDetail.reviewer1Score?.scores[crit.key];
                                const cm = selectedAppForDetail.reviewer1Score?.criterionRemarks?.[crit.key];
                                return (
                                  <div key={crit.key} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <crit.icon className="w-3.5 h-3.5 text-sky-600" />
                                        {crit.label}
                                      </span>
                                      <span className="font-mono font-bold text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                                        {sc} / 10 ({crit.weight})
                                      </span>
                                    </div>
                                    <div className="p-2 bg-white rounded border border-slate-200 text-xs text-slate-700 italic">
                                      <span className="text-[10px] font-bold text-slate-500 not-italic block mb-0.5">
                                        Reviewer Comment:
                                      </span>
                                      "{cm || 'No specific comment provided.'}"
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                              <span className="font-bold text-slate-800 block mb-1 text-xs">Overall General Evaluation Remarks:</span>
                              <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 italic text-slate-700 text-xs leading-relaxed">
                                "{selectedAppForDetail.reviewer1Score.generalRemarks}"
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-slate-400 space-y-2">
                            <Clock className="w-6 h-6 mx-auto text-slate-300" />
                            <p className="italic text-xs">Reviewer 1 evaluation has not yet been submitted.</p>
                            <button
                              type="button"
                              onClick={() => onOpenReviewModal(selectedAppForDetail)}
                              className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-md hover:bg-sky-100"
                            >
                              Perform Reviewer 1 Evaluation
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Reviewer 2 Full Dossier */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">Reviewer 2 Evaluation</span>
                            <span className="text-[11px] text-slate-500">
                              {selectedAppForDetail.reviewer2Score?.reviewerRole || 'Commercial Evaluator'}
                            </span>
                          </div>
                          {selectedAppForDetail.reviewer2Score && (
                            <div className="text-right">
                              <span className="font-mono font-bold text-base text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                                {selectedAppForDetail.reviewer2Score.totalWeightedScore}%
                              </span>
                            </div>
                          )}
                        </div>

                        {selectedAppForDetail.reviewer2Score ? (
                          <div className="space-y-3">
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                              <div><strong>Evaluator:</strong> {selectedAppForDetail.reviewer2Score.reviewerName}</div>
                              <div><strong>Date Evaluated:</strong> {selectedAppForDetail.reviewer2Score.evaluatedAt}</div>
                              <div>
                                <strong>Recommendation:</strong>{' '}
                                <span className="font-semibold text-emerald-700 capitalize">
                                  {selectedAppForDetail.reviewer2Score.recommendation.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>

                            {/* Section-by-Section Scoring & Comments */}
                            <div className="space-y-2.5">
                              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                                Section Scores & Reviewer Comments:
                              </span>

                              {CRITERIA_METADATA.map((crit) => {
                                const sc = selectedAppForDetail.reviewer2Score?.scores[crit.key];
                                const cm = selectedAppForDetail.reviewer2Score?.criterionRemarks?.[crit.key];
                                return (
                                  <div key={crit.key} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <crit.icon className="w-3.5 h-3.5 text-indigo-600" />
                                        {crit.label}
                                      </span>
                                      <span className="font-mono font-bold text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                                        {sc} / 10 ({crit.weight})
                                      </span>
                                    </div>
                                    <div className="p-2 bg-white rounded border border-slate-200 text-xs text-slate-700 italic">
                                      <span className="text-[10px] font-bold text-slate-500 not-italic block mb-0.5">
                                        Reviewer Comment:
                                      </span>
                                      "{cm || 'No specific comment provided.'}"
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                              <span className="font-bold text-slate-800 block mb-1 text-xs">Overall General Evaluation Remarks:</span>
                              <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 italic text-slate-700 text-xs leading-relaxed">
                                "{selectedAppForDetail.reviewer2Score.generalRemarks}"
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-slate-400 space-y-2">
                            <Clock className="w-6 h-6 mx-auto text-slate-300" />
                            <p className="italic text-xs">Reviewer 2 evaluation has not yet been submitted.</p>
                            <button
                              type="button"
                              onClick={() => onOpenReviewModal(selectedAppForDetail)}
                              className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100"
                            >
                              Perform Reviewer 2 Evaluation
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DETAILED FORM 2 (ANALYST DUE DILIGENCE) */}
              {dossierTab === 'form2' && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="p-4 bg-linear-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-xl shadow-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                          F2
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">Stage 2 Form: Analyst Supplementary Due Diligence</h3>
                          <p className="text-[11px] text-indigo-200">
                            Market Traction, Early Revenue Validation, 3-Year Future Plans & Financial Model
                          </p>
                        </div>
                      </div>

                      {selectedAppForDetail.supplementarySubmissions && selectedAppForDetail.supplementarySubmissions.length > 0 ? (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Linked to Ref ID: {selectedAppForDetail.id}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full font-bold text-xs flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> Awaiting Applicant Submission
                        </span>
                      )}
                    </div>
                  </div>

                  {/* If Form 2 Submissions exist */}
                  {selectedAppForDetail.supplementarySubmissions && selectedAppForDetail.supplementarySubmissions.length > 0 ? (
                    selectedAppForDetail.supplementarySubmissions.map((sub, sIdx) => (
                      <div key={sub.id || sIdx} className="space-y-5">
                        {/* Metadata Header */}
                        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-indigo-950 text-xs block">{sub.formTitle}</span>
                            <span className="text-[11px] text-indigo-700">
                              Submission Timestamp: <strong>{new Date(sub.submittedAt).toLocaleString()}</strong> • Form ID: <code className="font-mono bg-white px-1 rounded">{sub.formId || '241088492019'}</code>
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[11px] bg-white text-indigo-900 border border-indigo-200 px-2.5 py-1 rounded-md shadow-2xs">
                            Submission #{sIdx + 1}
                          </span>
                        </div>

                        {/* Section A: Commercial Market Traction */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            A. Commercial Market Traction & Customer Validation
                          </h4>

                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                              Executive Market Traction Summary:
                            </span>
                            <p className="text-slate-800 text-[11px] leading-relaxed font-medium">
                              {sub.data.market_traction_summary || 'Detailed commercial traction provided in attachments.'}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                              <span className="text-slate-500 block text-[10px]">Verified Pilot / Early Revenue</span>
                              <span className="font-mono font-bold text-emerald-800 text-sm">
                                {sub.data.early_revenue || 'RM 680,000 (Commercial Trials)'}
                              </span>
                            </div>
                            <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-lg">
                              <span className="text-slate-500 block text-[10px]">Paying Clients / Pilot Sites</span>
                              <span className="font-bold text-sky-900 text-xs">
                                {sub.data.current_paying_clients || '4 Conglomerates (12 Estates)'}
                              </span>
                            </div>
                            <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg">
                              <span className="text-slate-500 block text-[10px]">Monthly Recurring Telemetry (MRR)</span>
                              <span className="font-mono font-bold text-indigo-900 text-sm">
                                {sub.data.monthly_recurring_revenue || 'RM 54,000 / month'}
                              </span>
                            </div>
                          </div>

                          {sub.data.pilot_validation_metrics && (
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700">
                              <strong>Operational Pilot Performance Benchmarks:</strong> {sub.data.pilot_validation_metrics}
                            </div>
                          )}
                        </div>

                        {/* Section B: 3-Year Commercialization Strategy & Future Expansion */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <Award className="w-4 h-4 text-indigo-600" />
                            B. 3-Year Commercialization Strategy & Future Expansion Plan
                          </h4>

                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                              Expansion Strategy & Revenue Roadmap:
                            </span>
                            <p className="text-slate-800 text-[11px] leading-relaxed">
                              {sub.data.future_plan_summary || '3-year rollout strategy submitted.'}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {sub.data.capex_deployment_schedule && (
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block text-[11px] mb-1">Capex Deployment Schedule:</span>
                                <p className="text-slate-600 text-[11px]">{sub.data.capex_deployment_schedule}</p>
                              </div>
                            )}

                            {sub.data.target_hiring_plan && (
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 block text-[11px] mb-1">Target Technical & Sales Hiring:</span>
                                <p className="text-slate-600 text-[11px]">{sub.data.target_hiring_plan}</p>
                              </div>
                            )}
                          </div>

                          {sub.data.regulatory_milestones && (
                            <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200 text-[11px] text-sky-950 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
                              <span><strong>Regulatory Update:</strong> {sub.data.regulatory_milestones}</span>
                            </div>
                          )}
                        </div>

                        {/* Section C: Form 2 Attached Due Diligence Documents */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                            C. Form 2 Uploaded Due Diligence Documents ({sub.documents?.length || 0})
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {sub.documents && sub.documents.length > 0 ? (
                              sub.documents.map((d) => (
                                <div key={d.id} className="p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/50 flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <div className="truncate">
                                      <span className="font-semibold text-slate-900 truncate block text-[11px]">{d.name}</span>
                                      <span className="text-[10px] text-slate-500">{d.size} • Uploaded with Form 2</span>
                                    </div>
                                  </div>
                                  <a
                                    href={d.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-white border border-indigo-300 rounded hover:bg-indigo-50 flex items-center gap-1 ml-2 shrink-0 shadow-2xs"
                                  >
                                    <ExternalLink className="w-3 h-3" /> View
                                  </a>
                                </div>
                              ))
                            ) : (
                              <p className="text-slate-400 italic text-[11px]">No supplementary documents attached.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    /* If Form 2 has not yet been submitted */
                    <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
                          <Send className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm">Form 2 Awaiting Applicant Submission</h4>
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            Once an applicant reaches the shortlist, the assigned analyst dispatches Form 2 to request commercial traction metrics, verified client contracts, and the 3-year commercialization financial model.
                          </p>
                        </div>
                      </div>

                      {/* Pre-linked URL info */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                        <span className="font-bold text-slate-800 block text-[11px]">
                          Pre-linked Stage 2 Jotform URL with Hidden Reference ID:
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`https://form.jotform.com/241088492019?application_id=${selectedAppForDetail.id}&company=${encodeURIComponent(selectedAppForDetail.company.name)}&applicant=${encodeURIComponent(selectedAppForDetail.applicant.fullName)}`}
                            className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] font-mono text-indigo-900"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const link = `https://form.jotform.com/241088492019?application_id=${selectedAppForDetail.id}&company=${encodeURIComponent(selectedAppForDetail.company.name)}&applicant=${encodeURIComponent(selectedAppForDetail.applicant.fullName)}`;
                              navigator.clipboard.writeText(link);
                              setCopiedForm2Link(true);
                              setTimeout(() => setCopiedForm2Link(false), 2000);
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-slate-700 font-semibold text-[11px] flex items-center gap-1 shrink-0"
                          >
                            {copiedForm2Link ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedForm2Link ? 'Copied!' : 'Copy Link'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenEmailCenterWithRecipient) {
                              onOpenEmailCenterWithRecipient(selectedAppForDetail);
                            }
                            setSelectedAppForDetail(null);
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch Email Request to Applicant</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSimulateApplicantForm2(selectedAppForDetail)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm ml-auto"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Simulate Applicant Submitting Form 2 Now</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ALL ATTACHED DOCUMENTS ARCHIVE */}
              {dossierTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Consolidated Application Dossier Archive</h4>
                      <p className="text-[11px] text-slate-500">
                        Combined document repository submitted across Form 1 (Intake) and Form 2 (Due Diligence).
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                      Total Files: {(selectedAppForDetail.documents?.length || 0) + (selectedAppForDetail.supplementarySubmissions?.reduce((acc, s) => acc + (s.documents?.length || 0), 0) || 0)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Form 1 Files */}
                    {selectedAppForDetail.documents?.map((doc) => (
                      <div key={doc.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-slate-900 text-xs truncate block">{doc.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {doc.size} • Uploaded on {doc.uploadedAt}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            Form 1 (Intake)
                          </span>
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
                      </div>
                    ))}

                    {/* Form 2 Files */}
                    {selectedAppForDetail.supplementarySubmissions?.flatMap((s) => s.documents || []).map((doc) => (
                      <div key={doc.id} className="p-3 bg-indigo-50/40 border border-indigo-200 rounded-xl flex items-center justify-between hover:border-indigo-300">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-slate-900 text-xs truncate block">{doc.name}</span>
                            <span className="text-[10px] text-slate-500">
                              {doc.size} • Uploaded on {doc.uploadedAt}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                            Form 2 (Due Diligence)
                          </span>
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-white border border-indigo-300 rounded hover:bg-indigo-50 flex items-center gap-1 shadow-2xs"
                            >
                              <ExternalLink className="w-3 h-3" /> View
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Archived</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: RAW FORM FIELDS & JSON */}
              {dossierTab === 'raw' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block text-xs">Raw Jotform Submissions & Dynamic JSON Storage</span>
                    <p className="text-[11px] text-slate-600">
                      Shows how dynamic questions or unconfirmed form modifications are stored in <code>form_data</code> and <code>supplementary_submissions</code> without requiring schema migrations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Form 1 Raw */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                        <FileCode className="w-3.5 h-3.5 text-sky-600" /> Form 1 Raw Field Payload:
                      </span>
                      <pre className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-[10px] overflow-x-auto max-h-72 border border-slate-800">
                        {JSON.stringify(
                          {
                            id: selectedAppForDetail.id,
                            company: selectedAppForDetail.company,
                            technology: selectedAppForDetail.technology,
                            market: selectedAppForDetail.market,
                            formData: selectedAppForDetail.formData || {},
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>

                    {/* Form 2 Raw */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                        <FileCode className="w-3.5 h-3.5 text-indigo-600" /> Form 2 Raw Field Payload:
                      </span>
                      <pre className="bg-slate-950 text-sky-400 p-3 rounded-xl font-mono text-[10px] overflow-x-auto max-h-72 border border-slate-800">
                        {JSON.stringify(selectedAppForDetail.supplementarySubmissions || [], null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedAppForDetail(null);
                  onOpenReviewModal(selectedAppForDetail);
                }}
                className="px-4 py-2 font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm"
              >
                Open Reviewer Scoring Rubric
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenEmailCenterWithRecipient) {
                    onOpenEmailCenterWithRecipient(selectedAppForDetail);
                  }
                  setSelectedAppForDetail(null);
                }}
                className="px-4 py-2 font-medium text-slate-700 border border-slate-300 bg-white rounded-lg hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-sky-600" />
                Dispatch Custom Email to Applicant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
