import React, { useState } from 'react';
import { GrantApplication } from '../../types/grant';
import { SheetDataImporter } from '../intake/SheetDataImporter';
import {
  Webhook,
  Play,
  CheckCircle2,
  Copy,
  ExternalLink,
  Code,
  FileJson,
  Layers,
  ArrowRight,
  Paperclip,
  FileSpreadsheet,
} from 'lucide-react';

interface JotformHubProps {
  onProcessWebhook: (payload: any) => GrantApplication;
  onViewApplication: (app: GrantApplication) => void;
  onImportSuccess?: (count: number) => void;
  onNavigateToCrm?: () => void;
}

const FORM_1_INTAKE_PAYLOAD = {
  submissionID: '5982104928104821',
  formID: '24098234821901',
  ip: '175.143.28.19',
  rawRequest: {
    company_name: 'NanoCarbon Membrane Systems Sdn Bhd',
    ssm_number: '202301048920 (1489021-T)',
    sector: 'Clean Energy & Mobility',
    state: 'Penang',
    annual_turnover: 1450000,
    funding_requested: 800000,
    trl: 7,
    applicant_name: 'Dr. Raymond Tan Choo Hock',
    email: 'raymond.tan@nanocarbon.my',
    phone: '+60 12-482 9910',
    product_name: 'Graphene-Oxide Electrodialysis Water Desalination Cartridge',
    description: 'Ultra-low energy capacitive deionization membrane cartridge for industrial zero-liquid discharge (ZLD) semiconductor wastewater treatment.',
    attachment_pitch_deck: 'https://files.jotform.com/uploads/NanoCarbon_Pitch_Deck_2026.pdf',
    attachment_ssm: 'https://files.jotform.com/uploads/SSM_Form_9_Cert.pdf',
  },
};

const FORM_2_DUE_DILIGENCE_PAYLOAD = {
  submissionID: '6019283948102941',
  formID: '24108849201902',
  application_id: 'CRG-2026-0101', // Links back to primary application!
  ip: '175.143.28.19',
  rawRequest: {
    application_id: 'CRG-2026-0101',
    form_title: 'Stage 2 Supplementary Due Diligence (Market Traction & Future Plans)',
    market_traction_summary: 'Achieved RM 480,000 in early commercial membrane cartridges delivered across 3 semiconductor fabrication cleanrooms in Bayan Lepas, Penang. 100% pilot retention.',
    future_plan_summary: '3-Year Commercial Expansion: Scaled production to 5,000 modular cartridges/quarter, regional sales channel in Singapore & Indonesia, target ARR RM 5.8M by 2028.',
    attachment_market_traction: 'https://files.jotform.com/uploads/NanoCarbon_Audited_Traction_Report_2026.pdf',
    attachment_market_traction_name: 'Audited_Market_Traction_Report_2026.pdf',
    attachment_future_plans: 'https://files.jotform.com/uploads/3Year_Commercialization_Financial_Projections.xlsx',
    attachment_future_plans_name: '3Year_Expansion_Financial_Model.xlsx',
    attachment_loi: 'https://files.jotform.com/uploads/Customer_LOIs_Semiconductor_Fabs.pdf',
    attachment_loi_name: 'Customer_Binding_LOIs_2026.pdf',
  },
};

export const JotformHub: React.FC<JotformHubProps> = ({
  onProcessWebhook,
  onViewApplication,
  onImportSuccess,
  onNavigateToCrm,
}) => {
  const [hubMode, setHubMode] = useState<'sheet' | 'webhook'>('sheet');
  const [activeFormPreset, setActiveFormPreset] = useState<'form1' | 'form2'>('form1');
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(FORM_1_INTAKE_PAYLOAD, null, 2)
  );
  const [testResult, setTestResult] = useState<GrantApplication | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const webhookEndpointUrl = `${window.location.origin}/api/jotform-webhook`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookEndpointUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const [simulatorError, setSimulatorError] = useState<string | null>(null);

  const handleRunSimulator = () => {
    setSimulatorError(null);
    try {
      const parsed = JSON.parse(payloadText);
      const app = onProcessWebhook(parsed);
      setTestResult(app);
    } catch (e: any) {
      setSimulatorError(`Invalid JSON format: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHubMode('sheet')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              hubMode === 'sheet'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets & CSV/TSV Importer</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-900">
              Recommended
            </span>
          </button>

          <button
            type="button"
            onClick={() => setHubMode('webhook')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              hubMode === 'webhook'
                ? 'bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Webhook className="w-4 h-4 text-sky-600" />
            <span>Jotform Webhook Simulator & Sync</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block pr-2">
          {hubMode === 'sheet'
            ? 'Paste or upload grant spreadsheet rows'
            : 'Listen for live webhooks from Jotform forms'}
        </div>
      </div>

      {hubMode === 'sheet' ? (
        <SheetDataImporter
          onImportSuccess={(count) => {
            if (onImportSuccess) onImportSuccess(count);
          }}
          onViewApplication={onViewApplication}
          onNavigateToCrm={onNavigateToCrm}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-sky-700">Third-Party Intake Integration</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">Jotform Webhook Integration Hub</h2>
          <p className="text-xs text-slate-500 mt-1">
            Connect your Jotform commercialization grant forms directly into this CRM backend. Incoming submissions are parsed and mapped to the central pipeline with zero latency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 max-w-sm truncate">
            {webhookEndpointUrl}
          </div>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            {copiedUrl ? 'Copied!' : 'Copy Endpoint'}
          </button>
        </div>
      </div>

      {/* Multi-Form Linking Architecture Banner */}
      <div className="bg-linear-to-r from-sky-900 via-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/30 text-sky-200 border border-sky-400/30">
              Architecture Explained
            </span>
            <h3 className="font-bold text-sm">How Multiple Jotform Forms Link Together</h3>
          </div>
          <span className="text-xs text-sky-200/80">Zero manual matching required</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 bg-white/10 rounded-lg border border-white/10 space-y-1">
            <div className="font-bold text-sky-300 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-sky-400 text-slate-900 flex items-center justify-center text-[10px] font-bold">1</span>
              Form 1: Intake
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Applicant submits primary proposal. System issues permanent Reference ID (e.g., <code>CRG-2026-0101</code>).
            </p>
          </div>

          <div className="p-3 bg-white/10 rounded-lg border border-white/10 space-y-1">
            <div className="font-bold text-sky-300 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-sky-400 text-slate-900 flex items-center justify-center text-[10px] font-bold">2</span>
              Reviewer Scoring
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Independent reviewers score across 5 weighted dimensions. Passing score advances to Shortlist.
            </p>
          </div>

          <div className="p-3 bg-white/10 rounded-lg border border-white/10 space-y-1">
            <div className="font-bold text-sky-300 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-sky-400 text-slate-900 flex items-center justify-center text-[10px] font-bold">3</span>
              Analyst Form 2
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Analyst sends prefilled Form 2 link with <code>?application_id=CRG-2026-0101</code>.
            </p>
          </div>

          <div className="p-3 bg-white/10 rounded-lg border border-white/10 space-y-1">
            <div className="font-bold text-sky-300 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-sky-400 text-slate-900 flex items-center justify-center text-[10px] font-bold">4</span>
              Auto Merging
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Webhook recognizes ID and merges market traction, future plans & files right into the dossier.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SETUP INSTRUCTIONS & FIELD MAPPING */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Webhook className="w-4 h-4 text-sky-600" />
              How to Connect Multiple Forms
            </h3>

            <ol className="list-decimal list-inside space-y-2 text-slate-600 leading-relaxed">
              <li>In Form 1 & Form 2, add the Webhook URL: <code>{webhookEndpointUrl}</code>.</li>
              <li>
                In <strong>Form 2 (Due Diligence)</strong>, add a <strong>Hidden Field</strong> named <code>application_id</code>.
              </li>
              <li>
                When sending the link to the applicant, prefill it: <br />
                <code className="text-[10px] bg-slate-100 p-1 rounded block mt-1 text-indigo-700">
                  https://form.jotform.com/YOUR_FORM_2?application_id=CRG-2026-0101
                </code>
              </li>
              <li>
                When submitted, the CRM recognizes <code>application_id</code> and links it directly to Form 1 without creating a duplicate!
              </li>
            </ol>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Automatic Field Mapping Reference
            </h3>

            <div className="border border-slate-200 rounded-md overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-2">Jotform Field Key</th>
                    <th className="p-2">Action / Destination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                  <tr>
                    <td className="p-2 text-indigo-700 font-bold">application_id</td>
                    <td className="p-2 text-indigo-900 font-semibold">Matches & Links to Existing Application</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-sky-700">market_traction_summary</td>
                    <td className="p-2 text-slate-900">Appends to Form 2 Traction Dossier</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-sky-700">future_plan_summary</td>
                    <td className="p-2 text-slate-900">Appends to Form 2 3-Year Plan</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-sky-700">attachment_market_traction</td>
                    <td className="p-2 text-slate-900">Appends to documents[] array</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-sky-700">attachment_future_plans</td>
                    <td className="p-2 text-slate-900">Appends to documents[] array</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-500 italic">any other new question</td>
                    <td className="p-2 text-slate-600">Stored in form_data JSONB safely</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* File Storage Architecture Callout */}
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-sky-950 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                How Jotform Uploaded Files Are Stored
              </h4>
              <p className="text-sky-900 text-[11px] leading-relaxed">
                Jotform delivers uploaded files as download URLs in the webhook payload. The platform saves these URLs to PostgreSQL (<code>documents JSONB</code> and <code>application_documents</code> table), allowing reviewers and analysts to click and view files directly in the CRM.
              </p>
            </div>
          </div>
        </div>

        {/* WEBHOOK SIMULATOR & TEST RUNNER */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-600" />
              Interactive Multi-Form Webhook Simulator
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Test Form 1 and Form 2</span>
          </div>

          {/* Form Preset Selector */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveFormPreset('form1');
                setPayloadText(JSON.stringify(FORM_1_INTAKE_PAYLOAD, null, 2));
                setTestResult(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-md transition-all ${
                activeFormPreset === 'form1'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Form 1: Initial Applicant Intake (New Dossier)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFormPreset('form2');
                setPayloadText(JSON.stringify(FORM_2_DUE_DILIGENCE_PAYLOAD, null, 2));
                setTestResult(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-md transition-all ${
                activeFormPreset === 'form2'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Form 2: Due Diligence (Links to CRG-2026-0101)
            </button>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {activeFormPreset === 'form1'
              ? 'Form 1 creates a new applicant dossier in the pipeline.'
              : 'Form 2 contains the hidden application_id "CRG-2026-0101". Notice how the webhook automatically finds the existing record and appends market traction, future plans, and new files without duplicating!'}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Inbound HTTP POST Body (JSON):</span>
              <button
                type="button"
                onClick={() =>
                  setPayloadText(
                    JSON.stringify(
                      activeFormPreset === 'form1' ? FORM_1_INTAKE_PAYLOAD : FORM_2_DUE_DILIGENCE_PAYLOAD,
                      null,
                      2
                    )
                  )
                }
                className="text-sky-700 hover:underline text-[11px]"
              >
                Reset Payload
              </button>
            </div>
            <textarea
              rows={13}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="w-full text-xs font-mono p-3 border border-slate-200 rounded-lg bg-slate-900 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
            />
          </div>

          {simulatorError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
              {simulatorError}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleRunSimulator}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors ${
                activeFormPreset === 'form2'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              {activeFormPreset === 'form2'
                ? 'Simulate Form 2 Submission & Link to CRG-2026-0101'
                : 'Simulate Form 1 Inbound Webhook'}
            </button>
          </div>

          {/* Test Result Display */}
          {testResult && (
            <div
              className={`p-4 rounded-lg text-xs space-y-2 border ${
                activeFormPreset === 'form2'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      activeFormPreset === 'form2' ? 'text-indigo-600' : 'text-emerald-600'
                    }`}
                  />
                  {activeFormPreset === 'form2'
                    ? 'Form 2 Successfully Linked to Existing Application!'
                    : 'Webhook Ingested & New Application Created!'}
                </span>
                <span className="font-mono font-bold text-sky-800 bg-white border border-sky-200 px-2 py-0.5 rounded">
                  {testResult.id}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>Company: <strong>{testResult.company.name}</strong></div>
                <div>Status: <strong className="capitalize">{testResult.status.replace(/_/g, ' ')}</strong></div>
                <div>Attached Files: <strong>{testResult.documents?.length || 0} files total</strong></div>
                <div>
                  Stage 2 Submissions: <strong>{testResult.supplementarySubmissions?.length || 0} recorded</strong>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onViewApplication(testResult)}
                  className={`px-3 py-1 font-semibold text-xs text-white rounded shadow-2xs flex items-center gap-1 ${
                    activeFormPreset === 'form2'
                      ? 'bg-indigo-700 hover:bg-indigo-800'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  View Linked Dossier in CRM
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
