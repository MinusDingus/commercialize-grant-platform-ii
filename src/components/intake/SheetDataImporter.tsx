import React, { useState } from 'react';
import { GrantApplication } from '../../types/grant';
import { parseSheetData, generateSqlInserts } from '../../services/sheetParser';
import { GrantStore } from '../../services/grantStore';
import { syncApplicationsToSupabase, isSupabaseConfigured } from '../../services/supabase';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Database,
  ArrowRight,
  FileCode2,
  Sparkles,
  Info,
  Download,
} from 'lucide-react';

interface SheetDataImporterProps {
  onImportSuccess: (count: number) => void;
  onViewApplication: (app: GrantApplication) => void;
  onNavigateToCrm?: () => void;
}

const SAMPLE_SHEET_DATA = `Submission Date\tFlow Status\tApplication ID\tSubmission ID\tApplication Status\tLast Update Date\t1.1.1 Organisation Name\t1.1.2 SSM Registration Number\t1.1.3 Upload SSM Corporate Information\t1.1.4 Incorporation Date\t1.1.5 Company Website URL\t1.1.6 Company Category\t1.1.7 Industry\t1.1.8 Registered Business Address\t1.1.9 Registered Address State\t1.1.10 Is Bumiputra?\t1.1.11 Majority Malaysian-Owned?\t2.1.1.1 Name\t2.1.1.2 Designation\t2.1.1.3 Identification No. \t2.1.1.4 Role in Project\t2.1.1.5 Email\t2.1.1.6 Contact Number\t2.1.1.7 Upload CV\t2.1.2.1 Name\t2.1.2.2 Designation\t2.1.2.3 Identification No. \t2.1.2.4 Role in Project\t2.1.2.5 Email\t2.1.2.6 Contact Number\t2.1.2.7 Upload CV\t2.1.3.1 Name\t2.1.3.2 Designation\t2.1.3.3 Identification No. \t2.1.3.4 Role in Project\t2.1.3.5 Email\t2.1.3.6 Contact Number\t2.1.3.7 Upload CV\t2.2.1 Describe team competency and experience relevant to the project \t2.2.2 Explain governance and project management structure\t3.1.1.1 Organisation Name\t3.1.1.2 Role & Scope of Work\t3.1.1.3 Contribution (RM), if any\t3.1.1.4 Contact Person\t3.1.1.5 Designation\t3.1.1.6 Email\t3.1.1.7 Contact Number\t3.1.1.8 Upload CV\t3.1.1.9 Upload Signed Agreements\t3.1.2.1 Organisation Name\t3.1.2.2 Role & Scope of Work\t3.1.2.3 Contribution (RM), if any\t3.1.2.4 Contact Person\t3.1.2.5 Designation\t3.1.2.6 Email\t3.1.2.7 Contact Number\t3.1.2.8 Upload CV\t3.1.2.9 Upload Signed Agreements\t3.1.3.1 Organisation Name\t3.1.3.2 Role & Scope of Work\t3.1.3.3 Contribution (RM), if any\t3.1.3.4 Contact Person\t3.1.3.5 Designation\t3.1.3.6 Email\t3.1.3.7 Contact Number\t3.1.3.8 Upload CV\t3.1.3.9 Upload Signed Agreements\t4.1.1 Project Title\t4.1.2 Executive Summary\t4.1.3 Problem Statement\t4.1.4 Proposed Solution\t4.1.5 Value Proposition\t4.1.6 Regulatory / Standards / Compliance Requirements\t4.1.7 Upload Certificate\t4.1.8 10–10 MySTIE Technology Driver\t4.1.9 10–10 MySTIE Socio-Economic\t4.2.1 Technology Architecture & System Overview\t4.2.1.1 Upload Document(s)\t4.2.2 Development History & Validation Evidence\t4.2.2.1 Upload Document(s)\t4.2.3 IP Status\t4.2.3.1 Upload Document(s)\t4.2.4 Technical Risks & Mitigation\t4.2.5 Design for Manufacturing (DFM) & Scalability\t4.2.6 Infrastructure & Resource Requirements\t4.2.7 Ethical, Safety & Environmental Considerations\t5.1.1 What problem does your innovation solve and for whom?\t5.1.1.1 Upload Document\t5.1.2 Target customer segments\t5.1.2.1 Upload Document\t5.1.3 Evidence of measurable demand\t5.1.3.1 Upload Document\t5.2.1 Direct & indirect competitors\t5.2.2 Barriers to entry\t5.3.1 Revenue streams & validation evidence\t5.3.2 Pricing strategy\t5.3.3 Go-to-market strategy (next 24 months)\t5.4.1 Product development & manufacturing plan\t5.4.2 Regulatory/compliance continuity plan\t5.4.3 Cybersecurity, data protection & operational risk mitigation\t5.4.4 Customer success & retention strategy\t5.5.1 Cost to produce one unit\t5.5.2 Selling Price (RM)\t5.5.3 Customer acquisition cost (RM), (if applicable)\t6.1.1 Milestone 1 (0–6 months) - Add new row for each line item\t6.1.2 Milestone 2 (6–12 months) - Add new row for each line item\t6.2 Key overall project deliverables\t7.1 Declaration\t7.2 PDPA consent\t7.3 Name & Designation of Authorised Signatory \t7.4 Date\t7.5 Company Stamp / Authorisation Letter\tTechnology Readiness Level (TRL)\tCustomer Readiness Level (CRL)\tLocal Entity\tEmail\tContact Number\tName\tOrganisation Name\tDesignation\tSection 4 Combine Remarks\tSection 5 Combine Remarks\tSection 6 Combine Remarks\tOverall Combine Remarks\tReviewer 1\tReviewer 2\tSection 1 Weight Score\tSection 2 Weight Score\tSection 3 Weight Score\tSection 4 Weight Score\tSection 5 Weight Score\tSection 6 Weight Score\tTotal Score\tSection 1 Combine Remarks\tSection 2 Combine Remarks\tSection 3 Combine Remarks\tSubmission IP
Apr 15, 2026\tCOMPLETED\tDPF000230\t6520778441524576291\treview_done\tApr 19, 2026\tAIHQ SDN BHD\t1651383-T\t"https://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/Sec%2017%20Certificate%20of%20Incorporation%20-%20AIHQ%20SDN%20BHD%20%2824.10.25%29%20%281%29.pdf\\nhttps://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/Sec%2051%20ROM%20-%20AIHQ%20SB%20%2812.11.2025%29%20%281%29.pdf"\tOct 27, 2025\tHTTP://THEAIHQ.NET\tStartup\tInformation Technology (IT) and Business Process Outsourcing (BPO)\tLot 1.3.19, Pearl Point Shopping Mall, Batu 5, Jln Klang Lama, 58000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur\tWilayah Persekutuan Kuala Lumpur\tNo\tYes\tPANG SERN YONG\tDIRECTOR\t850930016203\tDIRECTOR\tPANG@THEAIHQ.NET\t183251026\thttps://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/Pang-CV.pdf\tWANI HAMIZAH BINTI HAMZAN\tLEAD SOLUTIONS ENGINEER\t1015011680\t"- Lead digital and solutions development across AIHQ initiatives, supporting delivery and execution of multiple platform and programme builds\\n- Oversees and supports junior contributors specifically within the Firefly Stories platform workflow\\n- Coordinate workflows, communications, and solution delivery across internal initiatives and projects\\n- Support structured implementation, platform execution, and operational follow-through across product and digital workstreams"\tWANI@THEAIHQ.NET\t1175112953\thttps://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/Wani-CV.pdf\tALEISHA FEDORA SYAFIRA BINTI MОНАМMAD AZEAN\tJUNIOR DEVELOPER\t30703100526\t"- Contribute to the development of Firefly Stories, a digital platform for custom children's book, creation and delivery Support implementation of platform features and structured system workflows\\n- Assist with testing, debugging, and ongoing product improvements\\n- Work within a small product team to strengthen platform functionality and reliability"\tALEISHA@THEAIHQ.NET\t010-988 5679\thttps://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/Aleisha-CV.pdf\t"Firefly Stories is developed by a multidisciplinary team under AIHQ Sdn Bhd with strong capabilities in product development, software engineering, and AI-driven system implementation."\t"Firefly Stories is managed under a centralized and execution-focused governance structure within AIHQ Sdn Bhd, ensuring clear accountability, efficient decision-making, and coordinated project delivery."\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tNA\t"No formal external collaborators have been engaged at this stage."\t\t\t\t\t\t\t\tFirefly Stories: A Premium AI-Assisted Children’s Book Platform for Localised, Personalised and Curated Reading Experiences\tFirefly Stories is a premium digital children’s book platform developed by AIHQ Sdn Bhd to address the lack of locally relevant, high-quality, niche-topic children’s books for Malaysian families. Combines custom creation, curated public Story Library, and private reading.\tParents in Malaysia face a persistent gap in access to children’s books that are both high quality and meaningfully relevant to local realities.\t"Firefly Stories is a structured children’s publishing platform allowing families to create and read custom books."\t"Firefly’s unique value proposition is that it delivers beautiful children’s books made for here."\t"Compliance with Malaysia PDPA, HitPay payment gateway standards, content safety and moderation."\t\tAdvanced intelligent systems\tEducation\t"Built with Vite + React frontend, PostgreSQL database, HitPay payments, Google & OpenAI APIs, AWS hosting."\t"https://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/Firefly-Architecture.pdf\\nhttps://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/User-Journey-Firefly-Stories.pdf"\t"End-to-end working flow from create -> review -> pay -> generate -> library/read."\thttps://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/Firefly-Development.pdf\t"Company-owned and internally developed, trade secret know-how."\thttps://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/Firefly_Stories_IP_Rights_Summary_2276.pdf\t"Quality inconsistency, payment reconciliation, idempotency mitigations."\t"Software-led scalable digital production."\t"Cloud infrastructure, API budget, Vite/React engineering team."\t"User data privacy, child safety content controls."\t"Solves poor fit and culturally distant children books for parents."\thttps://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/Firefly_Stories_Market_Validation.pdf\t"Parents of young children aged 3-10."\thttps://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/Firefly_Stories_Customer_Segments_4132.pdf\t"Clear parent value proposition and defined pricing."\thttps://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/Firefly_Demand.pdf\t"Personalised storybook apps and generic AI tools."\t"Structured workflow, review-before-payment gating, local catalogue."\t"Custom books at RM29.90, shelf books at RM19.90."\t"Premium but accessible digital pricing."\t"Parent acquisition via social channels and parent communities."\t"Platform-led digital scale up."\t"Visible legal and trust surfaces."\t"Authentication and backend controlled jobs."\t"Retention via My Library and story freshness."\t10\t29.9\t\t"Deliverables: Production reliability hardening, Budget Allocation (RM): 120,000\\nDeliverables: Evidence pack, Budget Allocation (RM): 40000\\nDeliverables: Payment flow, Budget Allocation (RM): 55000\\nDeliverables: Story rendering, Budget Allocation (RM): 70000\\nDeliverables: Cloud API usage, Budget Allocation (RM): 45000\\nDeliverables: Ops monitoring, Budget Allocation (RM): 35000\\nDeliverables: Team implementation, Budget Allocation (RM): 110000"\t"Deliverables: Go-to-market launch, Budget Allocation (RM): 55000\\nDeliverables: Catalogue growth, Budget Allocation (RM): 45000\\nDeliverables: User testing, Budget Allocation (RM): 35000\\nDeliverables: Retention loops, Budget Allocation (RM): 35000\\nDeliverables: Commercial analytics, Budget Allocation (RM): 30000\\nDeliverables: Ongoing infrastructure, Budget Allocation (RM): 30000\\nDeliverables: Team implementation, Budget Allocation (RM): 45000"\t"Launch-ready Firefly Stories platform."\tI declare that all information provided is true.\tI consent to MRANTI PDPA.\tPANG SERN YONG\tApr 15, 2026\thttps://www.jotform.com/uploads/learn103/260193165468058/6520778441524576291/Firefly_Authorization.pdf\tYes\tYes\tYes\tPANG@THEAIHQ.NET\t183251026\tPANG SERN YONG\tAIHQ SDN BHD\tDIRECTOR\t"Comprehensive architecture schematic with clear data flows. Functional platform built in-house."\t"Target customers well segmented. Needs commercial purchase orders."\t"Specific deliverables against timeline. Clear budget utilisation."\t"High technical maturity beyond TRL 6."\trossuriana@mranti.my\tmaisarah@mranti.my\t4\t4\t1.5\t18\t15\t17.5\t60\t"Statutory documentation complete."\t"Roles clearly defined."\t"No collaborators mentioned."\t27.125.243.251`;

export const SheetDataImporter: React.FC<SheetDataImporterProps> = ({
  onImportSuccess,
  onViewApplication,
  onNavigateToCrm,
}) => {
  const [inputText, setInputText] = useState('');
  const [parsedApps, setParsedApps] = useState<GrantApplication[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isCopiedSql, setIsCopiedSql] = useState(false);
  const [sqlStatements, setSqlStatements] = useState('');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleParse = (textToParse: string) => {
    if (!textToParse.trim()) {
      setParsedApps([]);
      setParseErrors([]);
      setSqlStatements('');
      return;
    }

    const res = parseSheetData(textToParse);
    setParsedApps(res.applications);
    setParseErrors(res.errors);

    if (res.applications.length > 0) {
      const sql = generateSqlInserts(res.applications);
      setSqlStatements(sql);
    } else {
      setSqlStatements('');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    handleParse(val);
  };

  const processFile = (file: File) => {
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setUploadedFileName('DPF_Sample_Application.tsv (AIHQ SDN BHD)');
    setInputText(SAMPLE_SHEET_DATA);
    handleParse(SAMPLE_SHEET_DATA);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const [isImporting, setIsImporting] = useState(false);
  const [importModalData, setImportModalData] = useState<{
    added: number;
    updated: number;
    supabaseSynced: boolean;
    supabaseMessage: string;
    firstApp?: GrantApplication;
  } | null>(null);

  const [importError, setImportError] = useState<string | null>(null);

  const handleExecuteImport = async () => {
    setImportError(null);
    if (parsedApps.length === 0) {
      setImportError('Please paste spreadsheet data or upload a CSV file before clicking import.');
      return;
    }

    setIsImporting(true);
    try {
      // 1. Direct synchronous save to GrantStore (memory + IndexedDB + safe localStorage)
      const res = GrantStore.importApplications(parsedApps);

      // 2. Direct Supabase sync if credentials are configured
      let supabaseSynced = false;
      let supabaseMessage = 'Supabase not connected. Stored in local high-capacity platform database.';

      if (isSupabaseConfigured()) {
        try {
          const supaRes = await syncApplicationsToSupabase(parsedApps);
          supabaseSynced = supaRes.success;
          supabaseMessage = supaRes.message;
        } catch (supaErr: any) {
          supabaseMessage = `Supabase sync skipped: ${supaErr.message}`;
        }
      }

      // 3. Notify parent component to reload state
      onImportSuccess(parsedApps.length);

      // 4. Open success modal
      setImportModalData({
        added: res.added,
        updated: res.updated,
        supabaseSynced,
        supabaseMessage,
        firstApp: parsedApps[0],
      });
    } catch (err: any) {
      setImportError(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadSqlFile = () => {
    if (!sqlStatements) return;
    const blob = new Blob([sqlStatements], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DPF_Supabase_Import_${Date.now()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlStatements);
    setIsCopiedSql(true);
    setTimeout(() => setIsCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Bulk Data Intake
            </span>
            <span className="text-xs font-semibold text-slate-500">Google Sheets / CSV / TSV</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">Spreadsheet & Sheet Ingestion Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Copy and paste rows straight from Google Sheets, Excel, or Jotform export into this platform. All columns, documents, reviewer scores, and budgets map automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/samples/DPF_Sample_Application.csv"
            download="DPF_Sample_Application.csv"
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Download the exact sample CSV with all 100+ columns and first row"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Download Sample CSV
          </a>

          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Load Sample DPF Data
          </button>

          <label className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            Upload .CSV / .TSV
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Error Notification */}
      {importError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-4 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs font-semibold">{importError}</span>
          </div>
          <button
            onClick={() => setImportError(null)}
            className="text-xs text-rose-600 hover:text-rose-900 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Notification */}
      {importStatusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-medium">{importStatusMsg}</span>
        </div>
      )}

      {/* Prominent Top Action Banner when Applications are Detected */}
      {parsedApps.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4 border border-emerald-400/40 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  {parsedApps.length} Applications Detected & Mapped!
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/30 text-emerald-100 border border-emerald-300/40">
                  Ready to Ingest
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                All 100+ columns, reviewer scores, budgets, and document attachments are parsed. Click to save into your live platform database!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isImporting}
              onClick={handleExecuteImport}
              className="px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 active:scale-[0.98] text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Database className={`w-4 h-4 text-emerald-700 ${isImporting ? 'animate-spin' : ''}`} />
              <span>
                {isImporting
                  ? `Ingesting ${parsedApps.length} Applications...`
                  : `Import All ${parsedApps.length} Applications to Live CRM`}
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-700" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Input Area vs Live Mapping Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Paste Area & Instructions */}
        <div className="lg:col-span-6 space-y-4">
          {/* Drag & Drop File Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                : uploadedFileName
                ? 'border-emerald-300 bg-emerald-50/40'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {uploadedFileName ? (
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">File Loaded: {uploadedFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFileName(null);
                    setInputText('');
                    handleParse('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-red-600 font-medium shrink-0"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-600">
                  <label className="font-bold text-emerald-700 hover:underline cursor-pointer">
                    Click to select CSV file
                    <input
                      type="file"
                      accept=".csv,.tsv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>{' '}
                  or drag and drop here
                </div>
                <p className="text-[11px] text-slate-400">
                  Accepts Google Sheet exports (.csv, .tsv) with header row
                </p>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Or Paste Spreadsheet Cells (Tab or Comma Separated)
              </label>
              {inputText && (
                <button
                  type="button"
                  onClick={() => {
                    setInputText('');
                    setUploadedFileName(null);
                    handleParse('');
                  }}
                  className="text-[11px] text-slate-400 hover:text-red-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <textarea
              value={inputText}
              onChange={handleTextChange}
              placeholder="1. Select rows in Google Sheets (including header)&#10;2. Press Ctrl+C (or Cmd+C)&#10;3. Paste here (Ctrl+V)&#10;&#10;Supported columns: 1.1.1 Organisation Name, 1.1.2 SSM, 4.1.1 Project Title, Reviewers, Scores, Documents..."
              rows={9}
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400"
            />

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{inputText ? `${inputText.split('\n').length} line(s) in editor` : 'Waiting for spreadsheet input...'}</span>
              <span className="font-semibold text-emerald-700">
                {parsedApps.length} valid application(s) detected
              </span>
            </div>
          </div>

          {/* Quick Guide: 3 Ways to Feed Your Database */}
          <div className="bg-linear-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-sm text-slate-100">3 Ways to Supply the Database from Sheets</h3>
            </div>

            <div className="space-y-2.5 pt-1 text-slate-300 text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center font-bold shrink-0 text-[10px]">1</span>
                <div>
                  <strong className="text-white">Direct In-App Paste (This Screen):</strong> Copy cells from Google Sheets, paste above, and click <em>"Import to Live Platform"</em>. It instantly populates your pipeline with zero code.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center font-bold shrink-0 text-[10px]">2</span>
                <div>
                  <strong className="text-white">Supabase SQL Migration:</strong> Click <em>"Generate Supabase SQL"</em> below, copy the SQL, open your Supabase project &rarr; <em>SQL Editor</em>, and click Run to write straight to your live PostgreSQL database!
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center font-bold shrink-0 text-[10px]">3</span>
                <div>
                  <strong className="text-white">Supabase Table Editor CSV Upload:</strong> In Supabase &rarr; <em>Table Editor</em> &rarr; <code>applications</code> &rarr; click <em>Insert</em> &rarr; <em>Import data from CSV</em>.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Parsed Application Cards & Actions */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  Parsed Intake Applications ({parsedApps.length})
                </h3>
                <p className="text-xs text-slate-500">Live preview of mapped records before database ingestion</p>
              </div>

              {parsedApps.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSqlModal(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <FileCode2 className="w-3.5 h-3.5 text-slate-600" />
                    Supabase SQL
                  </button>
                </div>
              )}
            </div>

            {/* Error alerts if any */}
            {parseErrors.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Warnings:
                </div>
                {parseErrors.map((err, i) => (
                  <p key={i} className="text-[11px]">{err}</p>
                ))}
              </div>
            )}

            {/* Application Previews List */}
            {parsedApps.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No applications parsed yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Paste rows or click <strong>"Load Sample DPF Sheet"</strong> above to see how AIHQ - Firefly Stories maps into the system.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {parsedApps.map((app) => (
                  <div
                    key={app.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100/70 transition-all space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded text-[11px]">
                            {app.id}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                            {app.company.sector}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{app.company.name}</h4>
                        <p className="text-slate-500 text-[11px] line-clamp-1">{app.technology.productName}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-900 block">
                          RM {app.market.fundingRequested.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {app.compositeScore ? `Score: ${app.compositeScore}%` : 'Unscored'}
                        </span>
                      </div>
                    </div>

                    {/* Meta tags & reviewers */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60 text-slate-600">
                      <div>
                        <span className="text-slate-400">Applicant: </span>
                        <strong>{app.applicant.fullName}</strong> ({app.applicant.designation})
                      </div>
                      <div>
                        <span className="text-slate-400">Location: </span>
                        {app.company.state} (SSM: {app.company.ssmNumber})
                      </div>
                      <div>
                        <span className="text-slate-400">Reviewers: </span>
                        {app.reviewer1Score?.reviewerName || 'rossuriana@mranti.my'} & {app.reviewer2Score?.reviewerName || 'maisarah@mranti.my'}
                      </div>
                      <div>
                        <span className="text-slate-400">Attached Files: </span>
                        <strong>{app.documents.length} document(s)</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        app.baselinePassed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {app.baselinePassed ? 'Baseline Met (Shortlisted)' : `Score: ${app.compositeScore ?? 'N/A'}% (Under Baseline 75%)`}
                      </span>

                      <button
                        type="button"
                        onClick={() => onViewApplication(app)}
                        className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                      >
                        Inspect Dossier <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Primary Action Button */}
            {parsedApps.length > 0 && (
              <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleExecuteImport}
                  className={`flex-1 py-3 px-4 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isImporting
                      ? 'bg-emerald-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
                  }`}
                >
                  <Database className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
                  {isImporting
                    ? 'Importing into Database...'
                    : `Import ${parsedApps.length} Application(s) to Live Platform`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Modal */}
      {importModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Successfully Ingested to Database!</h3>
              <p className="text-xs text-slate-500">
                {importModalData.added} application(s) added, {importModalData.updated} updated.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Saved to CRM pipeline & memory storage</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className={`w-4 h-4 ${importModalData.supabaseSynced ? 'text-emerald-600' : 'text-slate-400'} shrink-0`} />
                <span className="truncate">{importModalData.supabaseMessage}</span>
              </div>
              {importModalData.firstApp && (
                <div className="pt-2 border-t border-slate-200 text-slate-600">
                  Dossier: <strong>{importModalData.firstApp.id}</strong> — {importModalData.firstApp.company.name}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToCrm) {
                    onNavigateToCrm();
                  } else if (importModalData.firstApp) {
                    onViewApplication(importModalData.firstApp);
                  }
                  setImportModalData(null);
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Open in Pipeline & CRM Now ({importModalData.added + importModalData.updated} Applications)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {importModalData.firstApp && (
                <button
                  type="button"
                  onClick={() => {
                    onViewApplication(importModalData.firstApp!);
                    setImportModalData(null);
                  }}
                  className="w-full py-2 px-4 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Inspect First Dossier ({importModalData.firstApp.id})</span>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setImportModalData(null)}
                className="w-full py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Stay on Intake Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Migration Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-emerald-600" />
                  PostgreSQL SQL Migration for Supabase
                </h3>
                <p className="text-xs text-slate-500">Compact, single-line SQL queries formatted to prevent query editor size limits</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-sky-900 text-[11px] leading-relaxed">
                <strong>💡 Tip:</strong> You do NOT need to run this SQL manually if your Supabase is connected in the top header — clicking <em>"Import to Live Platform"</em> will sync directly to Supabase via its API! If you prefer running SQL manually in Supabase SQL Editor, download the .sql file or copy below.
              </div>

              <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto whitespace-pre">
                {sqlStatements}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Single-line sanitized statements
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSqlFile}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  Download .sql File
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  {isCopiedSql ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  {isCopiedSql ? 'Copied!' : 'Copy SQL Statements'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
