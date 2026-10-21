import React, { useState, useEffect } from 'react';
import { GrantStore } from './services/grantStore';
import { GrantApplication, EmailNotification, GrantStatus } from './types/grant';
import { GrantCRM } from './components/crm/GrantCRM';
import { TreemapChart } from './components/dashboard/TreemapChart';
import { ApplicantPortal } from './components/applicant/ApplicantPortal';
import { EmailCenter } from './components/email/EmailCenter';
import { JotformHub } from './components/jotform/JotformHub';
import { DocumentationHub } from './components/docs/DocumentationHub';
import { DualReviewerModal } from './components/review/DualReviewerModal';
import { DatabaseConfigModal } from './components/common/DatabaseConfigModal';
import { isSupabaseConfigured } from './services/supabase';
import {
  Building2,
  PieChart,
  UserCheck,
  Mail,
  Webhook,
  BookOpen,
  FileSpreadsheet,
  RotateCcw,
  Download,
  CheckCircle2,
  HelpCircle,
  Database,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'crm' | 'treemap' | 'applicant' | 'email' | 'jotform' | 'docs'
  >('crm');

  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [baselineThreshold, setBaselineThreshold] = useState<number>(75.0);

  // Active modal for review
  const [reviewingApp, setReviewingApp] = useState<GrantApplication | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [preselectedEmailApp, setPreselectedEmailApp] = useState<GrantApplication | null>(null);
  const [showDbModal, setShowDbModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadData = () => {
    setApplications(GrantStore.getApplications());
    setNotifications(GrantStore.getNotifications());
    setBaselineThreshold(GrantStore.getBaselineThreshold());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleCreateApplication = (appData: any) => {
    const created = GrantStore.createApplication(appData);
    reloadData();
    showToast(`Application ${created.id} submitted successfully! Confirmation email dispatched.`);
    return created;
  };

  const handleAssignReviewers = (appId: string, r1Id: string, r2Id: string) => {
    GrantStore.assignReviewers(appId, r1Id, r2Id);
    reloadData();
    showToast(`Reviewers assigned for ${appId}. Review invitations dispatched via email.`);
    setReviewingApp(null);
  };

  const handleSubmitReviewScore = (
    appId: string,
    reviewerId: string,
    scoreData: any
  ) => {
    const updated = GrantStore.submitReviewScore(appId, reviewerId, scoreData);
    reloadData();
    if (updated?.baselinePassed && updated?.status === 'shortlisted') {
      showToast(`Review saved! Composite score (${updated.compositeScore}%) hit baseline. Promoted to Shortlisted!`);
    } else {
      showToast(`Reviewer evaluation recorded successfully for ${appId}.`);
    }
    setReviewingApp(null);
  };

  const handleAssignAnalyst = (appId: string, analystId: string) => {
    GrantStore.assignAnalyst(appId, analystId);
    reloadData();
    showToast(`Analyst assigned for application ${appId}. Due diligence phase started.`);
  };

  const handleUpdateStatus = (appId: string, status: GrantStatus) => {
    GrantStore.updateApplication(appId, { status });
    reloadData();
    showToast(`Application status updated to ${status.replace(/_/g, ' ')}.`);
  };

  const handleUpdateBaseline = (val: number) => {
    GrantStore.setBaselineThreshold(val);
    setBaselineThreshold(val);
    showToast(`Shortlist baseline threshold updated to ${val}%.`);
  };

  const handleProcessJotform = (payload: any) => {
    const created = GrantStore.parseJotformWebhookPayload(payload);
    reloadData();
    showToast(`Jotform submission ingested! Reference ID: ${created.id}`);
    return created;
  };

  const handleDispatchEmail = (emailData: any) => {
    GrantStore.dispatchEmail(emailData);
    reloadData();
    showToast(`Notification email successfully delivered.`);
  };

  const handleResetData = () => {
    if (confirm('Reset application database to initial mock dataset?')) {
      GrantStore.resetToDefault();
      reloadData();
      showToast('Database reset to initial demo state.');
    }
  };

  const handleExportData = () => {
    const data = {
      applications: GrantStore.getApplications(),
      notifications: GrantStore.getNotifications(),
      baselineThreshold: GrantStore.getBaselineThreshold(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commercialize_grant_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Contract (3 Zones: Brand, Nav Links, Primary CTA) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-base tracking-tight text-slate-900 whitespace-nowrap">
              Commercialize Grant Platform
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Dana Pengkomersialan
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('crm')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeTab === 'crm' ? 'text-sky-700 border-b-2 border-sky-600 font-bold' : ''
              }`}
            >
              Pipeline & CRM
            </button>
            <button
              onClick={() => setActiveTab('treemap')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeTab === 'treemap' ? 'text-sky-700 border-b-2 border-sky-600 font-bold' : ''
              }`}
            >
              Treemap Analytics
            </button>
            <button
              onClick={() => setActiveTab('applicant')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeTab === 'applicant' ? 'text-sky-700 border-b-2 border-sky-600 font-bold' : ''
              }`}
            >
              Applicant Portal
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeTab === 'email' ? 'text-sky-700 border-b-2 border-sky-600 font-bold' : ''
              }`}
            >
              Email Alerts ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('jotform')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeTab === 'jotform' ? 'text-sky-700 border-b-2 border-sky-600 font-bold' : ''
              }`}
            >
              Jotform Sync
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeTab === 'docs' ? 'text-sky-700 border-b-2 border-sky-600 font-bold' : ''
              }`}
            >
              Team Docs (.md)
            </button>
          </nav>

          {/* Zone 3: Primary Action & Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowDbModal(true)}
              title="Supabase Database & Environment Configuration"
              className={`px-2.5 py-1.5 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isSupabaseConfigured()
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">
                {isSupabaseConfigured() ? 'Supabase: Active' : 'DB / Env'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </button>
            <button
              type="button"
              onClick={handleExportData}
              title="Download JSON Database Backup"
              className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetData}
              title="Reset Database to Mock Sample"
              className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('applicant')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              + New Application
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Selector */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto flex items-center gap-2 text-xs">
        {[
          { key: 'crm', label: 'Pipeline' },
          { key: 'treemap', label: 'Treemap' },
          { key: 'applicant', label: 'Applicant' },
          { key: 'email', label: 'Emails' },
          { key: 'jotform', label: 'Jotform' },
          { key: 'docs', label: 'Docs (.md)' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-3 py-1 rounded-md whitespace-nowrap font-medium ${
              activeTab === t.key ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'crm' && (
          <GrantCRM
            applications={applications}
            baselineThreshold={baselineThreshold}
            onUpdateBaseline={handleUpdateBaseline}
            onOpenReviewModal={(app) => setReviewingApp(app)}
            onAssignAnalyst={handleAssignAnalyst}
            onUpdateStatus={handleUpdateStatus}
            onOpenEmailCenterWithRecipient={(app) => {
              setPreselectedEmailApp(app);
              setActiveTab('email');
            }}
            onDataRefresh={reloadData}
          />
        )}

        {activeTab === 'treemap' && (
          <TreemapChart
            applications={applications}
            onSelectApplication={(app) => {
              setReviewingApp(app);
            }}
          />
        )}

        {activeTab === 'applicant' && (
          <ApplicantPortal
            onSubmitApplication={handleCreateApplication}
            existingApplications={applications}
          />
        )}

        {activeTab === 'email' && (
          <EmailCenter
            notifications={notifications}
            applications={applications}
            onDispatchEmail={handleDispatchEmail}
            preselectedApp={preselectedEmailApp}
          />
        )}

        {activeTab === 'jotform' && (
          <JotformHub
            onProcessWebhook={handleProcessJotform}
            onViewApplication={(app) => {
              setActiveTab('crm');
            }}
          />
        )}

        {activeTab === 'docs' && <DocumentationHub />}
      </main>

      {/* Dual Reviewer Scoring Modal */}
      {reviewingApp && (
        <DualReviewerModal
          application={reviewingApp}
          baselineThreshold={baselineThreshold}
          onClose={() => setReviewingApp(null)}
          onSubmitReview={handleSubmitReviewScore}
          onAssignReviewers={handleAssignReviewers}
        />
      )}

      {/* Supabase Environment & Connectivity Modal */}
      <DatabaseConfigModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
      />

      {/* Clean Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Commercialize Grant Platform &copy; 2026. Built for national commercialization grant governance and innovation acceleration.
          </div>
          <div className="flex items-center gap-4">
            <span>Baseline Threshold: <strong>{baselineThreshold}%</strong></span>
            <span>·</span>
            <span>Active Pipeline: <strong>{applications.length} Grants</strong></span>
            <span>·</span>
            <span>Stack: <strong>TypeScript / React / Node.js</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
