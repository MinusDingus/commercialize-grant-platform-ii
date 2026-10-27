import React, { useState } from 'react';
import { EmailNotification, GrantApplication } from '../../types/grant';
import { Mail, Send, CheckCircle2, Search, Filter, Inbox, Eye, Clock, UserCheck, ShieldCheck } from 'lucide-react';

interface EmailCenterProps {
  notifications: EmailNotification[];
  applications: GrantApplication[];
  onDispatchEmail: (emailData: any) => void;
  preselectedApp?: GrantApplication | null;
}

const EMAIL_TEMPLATES = [
  {
    id: 'SUBMISSION_CONFIRMATION',
    label: 'Applicant: Submission Confirmation',
    role: 'applicant',
    subject: 'Commercialize Grant Application Received: {{company_name}} [{{application_id}}]',
    body: `Dear {{applicant_name}},

We confirm receipt of your application for the Commercialize Grant (Dana Pengkomersialan) on behalf of {{company_name}}.

Reference ID: {{application_id}}
Product/Service: {{product_name}}
Funding Requested: RM {{funding_requested}}

Next Steps:
1. Secretariat Completeness Screening (1-3 working days)
2. Independent Dual-Reviewer Technical & Market Scoring
3. Shortlist Baseline Assessment (Baseline: 75.0%)

You may track your review milestones at any time in the Applicant Service Portal using your Reference ID.

Warm regards,
Grant Secretariat Team
Dana Pengkomersialan Division`,
  },
  {
    id: 'REVIEWER_ASSIGNMENT',
    label: 'Reviewer: Dossier Assignment',
    role: 'reviewer',
    subject: '[Action Required] Commercialization Evaluation Assignment: {{company_name}} ({{application_id}})',
    body: `Dear Evaluator,

You have been designated as an independent accredited reviewer for Commercialize Grant application {{application_id}} ({{company_name}}).

Innovation Title: {{product_name}}
Sector: {{sector}}
Technology Readiness Level: TRL {{trl}}

Please access your Reviewer Scoring Portal to evaluate the proposal against the 5 weighted rubric dimensions:
- Commercial Potential & Market Demand (25%)
- Technical Feasibility & TRL Validation (25%)
- Team Execution & Governance (20%)
- Financial Soundness & Fund Utilization (20%)
- Socio-Economic & Ecosystem Impact (10%)

Evaluation Window: 10 business days.

Commercialization Review Board`,
  },
  {
    id: 'APPLICANT_SHORTLISTED',
    label: 'Applicant: Shortlisted Notification',
    role: 'applicant',
    subject: 'Commercialize Grant Application Shortlisted: {{company_name}} [{{application_id}}]',
    body: `Dear {{applicant_name}},

We are pleased to inform you that your application for "{{product_name}}" has achieved an evaluation score of {{score}}% from our independent reviewers, successfully passing our shortlist baseline.

Your dossier has been assigned to Lead Grant Analyst for commercial and financial due diligence. Our team will contact you shortly to schedule an on-site audit.

Congratulations on advancing to this critical milestone.

Sincerely,
Commercialization Grant Secretariat`,
  },
  {
    id: 'SHORTLIST_ANALYST_ALERT',
    label: 'Analyst: Shortlisted File Assigned',
    role: 'analyst',
    subject: 'New Shortlisted Dossier Assigned for Due Diligence: {{company_name}} (Score: {{score}}%)',
    body: `Dear Lead Analyst,

Application {{application_id}} ({{company_name}}) has met the shortlisting baseline with an evaluation score of {{score}}%.

Please conduct:
1. SSM and CTOS / credit verification
2. Review of audited accounts and matching fund liquidity
3. On-site technical verification and management interview
4. Prepare evaluation memorandum for the Commercialization Grant Approval Committee.

Grant Operations Desk`,
  },
  {
    id: 'REQUEST_STAGE2_DUE_DILIGENCE',
    label: 'Analyst to Applicant: Request Form 2 (Traction & Future Plan)',
    role: 'applicant',
    subject: '[Action Required] Stage 2 Supplementary Due Diligence: {{company_name}} [{{application_id}}]',
    body: `Dear {{applicant_name}},

Following the review of your initial proposal for "{{product_name}}", your application has advanced to Stage 2: Analyst Commercial Due Diligence.

To finalize our assessment for committee consideration, please complete our Supplementary Due Diligence Form (Form 2) using the link below:

Secure Form 2 Link:
https://form.jotform.com/241088492019?application_id={{application_id}}&company={{company_name}}&email={{email}}

Required Information in Form 2:
1. Current Commercial Market Traction (past 12 months revenue, unit sales, paying pilot trials)
2. 3-Year Future Expansion Plan & Revenue Milestones
3. Upload supporting attachments: Customer LOIs / MOUs, Audited Financial Statements, and Detailed Costing Model.

*Note: The link is pre-linked to your Reference ID ({{application_id}}). Your submissions and files will automatically attach to your active grant dossier.

Please submit within seven (7) working days.

Sincerely,
Lead Commercial Grant Analyst
Commercialize Grant Unit`,
  },
  {
    id: 'GRANT_AWARD_OFFER',
    label: 'Applicant: Grant Award Offer Letter',
    role: 'applicant',
    subject: 'Official Grant Award Offer Letter - Commercialize Grant [{{application_id}}]',
    body: `Dear {{applicant_name}},

On behalf of the Commercialization Grant Approval Committee (Jawatankuasa Dana Pengkomersialan), we take pride in extending an official Offer of Grant for RM {{funding_requested}} for the commercialization of "{{product_name}}".

Please review the terms of reference and disbursement milestones in your portal. Kindly sign and return the acceptance agreement within twenty-one (21) calendar days.

Warmest congratulations.

Chairman, Commercialization Grant Committee`,
  },
];

export const EmailCenter: React.FC<EmailCenterProps> = ({
  notifications,
  applications,
  onDispatchEmail,
  preselectedApp,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(EMAIL_TEMPLATES[0].id);
  const [selectedAppId, setSelectedAppId] = useState<string>(
    preselectedApp?.id || (applications[0]?.id ?? '')
  );
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [customRecipient, setCustomRecipient] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchEmail, setSearchEmail] = useState('');
  const [previewEmail, setPreviewEmail] = useState<EmailNotification | null>(null);

  // Sync template when app or template changes
  const activeTemplate = EMAIL_TEMPLATES.find((t) => t.id === selectedTemplateId) || EMAIL_TEMPLATES[0];
  const targetApp = applications.find((a) => a.id === selectedAppId) || applications[0];

  const interpolate = (text: string) => {
    if (!targetApp) return text;
    return text
      .replace(/{{company_name}}/g, targetApp.company.name)
      .replace(/{{application_id}}/g, targetApp.id)
      .replace(/{{applicant_name}}/g, targetApp.applicant.fullName)
      .replace(/{{product_name}}/g, targetApp.technology.productName)
      .replace(/{{funding_requested}}/g, targetApp.market.fundingRequested.toLocaleString())
      .replace(/{{sector}}/g, targetApp.company.sector)
      .replace(/{{trl}}/g, String(targetApp.technology.trlLevel))
      .replace(/{{score}}/g, targetApp.compositeScore ? String(targetApp.compositeScore) : '82.5');
  };

  const handleTemplateSelect = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = EMAIL_TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl && targetApp) {
      setCustomSubject(interpolate(tmpl.subject));
      setCustomBody(interpolate(tmpl.body));
      if (tmpl.role === 'applicant') {
        setCustomRecipient(targetApp.applicant.email);
      } else if (tmpl.role === 'reviewer') {
        setCustomRecipient('reviewers@evaluators.my');
      } else {
        setCustomRecipient('shafiqfauzi@mranti.my');
      }
    }
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetApp) return;

    const subjectToSend = customSubject || interpolate(activeTemplate.subject);
    const bodyToSend = customBody || interpolate(activeTemplate.body);
    const recipientToSend = customRecipient || targetApp.applicant.email;

    onDispatchEmail({
      applicationId: targetApp.id,
      companyName: targetApp.company.name,
      recipientEmail: recipientToSend,
      recipientName: targetApp.applicant.fullName,
      recipientRole: activeTemplate.role,
      subject: subjectToSend,
      body: bodyToSend,
      templateType: activeTemplate.id,
    });

    // Reset or keep updated
    alert('Email successfully dispatched to recipient queue.');
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchRole = filterRole === 'all' || n.recipientRole === filterRole;
    const matchSearch =
      searchEmail === '' ||
      n.companyName.toLowerCase().includes(searchEmail.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchEmail.toLowerCase()) ||
      n.recipientEmail.toLowerCase().includes(searchEmail.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-sky-700">Commercialize Grant Operations</span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">Email Notification & Dispatch Center</h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated and manual email triggers for applicants, accredited reviewers, and due diligence analysts across pipeline milestones.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Mail className="w-4 h-4 text-sky-600" />
          <span>Total Dispatched: <strong>{notifications.length} Emails</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COMPOSE PANEL */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-600" />
            Dispatch Email Notification
          </h3>

          <form onSubmit={handleSendEmail} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Select Email Template:</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full border border-slate-200 rounded-md p-2 bg-slate-50 font-medium text-slate-800"
              >
                {EMAIL_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Application Dossier:</label>
              <select
                value={selectedAppId}
                onChange={(e) => {
                  setSelectedAppId(e.target.value);
                  const app = applications.find((a) => a.id === e.target.value);
                  if (app) setCustomRecipient(app.applicant.email);
                }}
                className="w-full border border-slate-200 rounded-md p-2 bg-slate-50 font-medium text-slate-800"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.id} - {app.company.name} ({app.company.sector})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Recipient Email:</label>
              <input
                type="email"
                required
                value={customRecipient || targetApp?.applicant.email || ''}
                onChange={(e) => setCustomRecipient(e.target.value)}
                className="w-full border border-slate-200 rounded-md p-2 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Subject:</label>
              <input
                type="text"
                required
                value={customSubject || interpolate(activeTemplate.subject)}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full border border-slate-200 rounded-md p-2 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Body Message:</label>
              <textarea
                rows={8}
                required
                value={customBody || interpolate(activeTemplate.body)}
                onChange={(e) => setCustomBody(e.target.value)}
                className="w-full border border-slate-200 rounded-md p-2.5 font-mono text-[11px] leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch Notification Email
            </button>
          </form>
        </div>

        {/* LOGS & SENT HISTORY */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Inbox className="w-4 h-4 text-emerald-600" />
              Dispatched Email History ({filteredNotifications.length})
            </h3>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50"
            >
              <option value="all">All Roles</option>
              <option value="applicant">Applicants</option>
              <option value="reviewer">Reviewers</option>
              <option value="analyst">Analysts</option>
            </select>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[640px] pr-1 text-xs">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => setPreviewEmail(n)}
                className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-slate-100/70 cursor-pointer transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-sky-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                    {n.applicationId}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.sentAt).toLocaleDateString()} {new Date(n.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="font-bold text-slate-900 truncate">{n.subject}</div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>To: <strong>{n.recipientEmail}</strong> ({n.recipientRole})</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Delivered
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EMAIL PREVIEW MODAL */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-mono text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {previewEmail.applicationId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{previewEmail.subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded px-2.5 py-1"
              >
                Close
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div><strong>Recipient:</strong> {previewEmail.recipientName} &lt;{previewEmail.recipientEmail}&gt;</div>
              <div><strong>Role:</strong> <span className="capitalize">{previewEmail.recipientRole}</span></div>
              <div><strong>Dispatched At:</strong> {new Date(previewEmail.sentAt).toLocaleString()}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 font-mono text-xs whitespace-pre-line text-slate-800 leading-relaxed max-h-80 overflow-y-auto">
              {previewEmail.body}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
