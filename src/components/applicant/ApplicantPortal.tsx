import React, { useState } from 'react';
import {
  GrantApplication,
  MalaysianState,
  IndustrySector,
  TurnoverTier,
  IPStatus,
} from '../../types/grant';
import {
  Building2,
  User,
  Cpu,
  TrendingUp,
  Paperclip,
  CheckCircle2,
  Search,
  Upload,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Clock,
  ShieldCheck,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Eye,
} from 'lucide-react';

interface ApplicantPortalProps {
  onSubmitApplication: (appData: any) => GrantApplication;
  existingApplications: GrantApplication[];
}

const MALAYSIAN_STATES: MalaysianState[] = [
  'Selangor',
  'Kuala Lumpur',
  'Penang',
  'Johor',
  'Sarawak',
  'Sabah',
  'Perak',
  'Kedah',
  'Melaka',
  'Pahang',
  'Negeri Sembilan',
  'Terengganu',
  'Kelantan',
  'Perlis',
  'Putrajaya',
  'Labuan',
];

const SECTORS: IndustrySector[] = [
  'AgriTech & Food Security',
  'Deep Tech & AI',
  'Clean Energy & Mobility',
  'Digital Health & Biotech',
  'Smart Manufacturing & IoT',
  'Creative Multimedia & FinTech',
];

export const ApplicantPortal: React.FC<ApplicantPortalProps> = ({
  onSubmitApplication,
  existingApplications,
}) => {
  const [activeMode, setActiveMode] = useState<'apply' | 'track'>('apply');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [ssmNumber, setSsmNumber] = useState('');
  const [incorporationYear, setIncorporationYear] = useState(2022);
  const [state, setState] = useState<MalaysianState>('Selangor');
  const [city, setCity] = useState('');
  const [annualTurnover, setAnnualTurnover] = useState(1200000);
  const [paidUpCapital, setPaidUpCapital] = useState(300000);
  const [employeeCount, setEmployeeCount] = useState(12);
  const [sector, setSector] = useState<IndustrySector>('AgriTech & Food Security');
  const [address, setAddress] = useState('');

  const [applicantName, setApplicantName] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nric, setNric] = useState('');

  const [productName, setProductName] = useState('');
  const [tagline, setTagline] = useState('');
  const [trlLevel, setTrlLevel] = useState<6 | 7 | 8 | 9>(7);
  const [productDescription, setProductDescription] = useState('');
  const [ipStatus, setIpStatus] = useState<IPStatus>('Patented');
  const [productionReadiness, setProductionReadiness] = useState('');
  const [currentCapacity, setCurrentCapacity] = useState('');

  const [targetMarket, setTargetMarket] = useState('');
  const [fundingRequested, setFundingRequested] = useState(650000);
  const [tamSamSom, setTamSamSom] = useState('');
  const [revenueModel, setRevenueModel] = useState('');
  const [exportPotential, setExportPotential] = useState(true);

  // Uploaded files
  const [files, setFiles] = useState<{ name: string; size: string; type: string }[]>([
    { name: 'Pitch_Deck_Commercialization_v2.pdf', size: '3.8 MB', type: 'application/pdf' },
    { name: 'SSM_Company_Profile_Form9.pdf', size: '1.4 MB', type: 'application/pdf' },
  ]);

  // Tracking State
  const [searchRefId, setSearchRefId] = useState('');
  const [trackedApp, setTrackedApp] = useState<GrantApplication | null>(null);

  const getTurnoverTier = (amt: number): TurnoverTier => {
    if (amt >= 5000000) return '> RM5M';
    if (amt >= 2000000) return 'RM2M - RM5M';
    if (amt >= 500000) return 'RM500K - RM2M';
    return '< RM500K';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        type: f.type || 'application/octet-stream',
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const created = onSubmitApplication({
      submissionSource: 'portal',
      status: 'submitted',
      company: {
        name: companyName || 'Alpha NextGen Innovations Sdn Bhd',
        ssmNumber: ssmNumber || '202301049210 (1482012-P)',
        incorporationYear,
        state,
        city: city || 'Kuala Lumpur',
        annualTurnover,
        turnoverTier: getTurnoverTier(annualTurnover),
        paidUpCapital,
        employeeCount,
        sector,
        address: address || 'Technology Park Malaysia, Bukit Jalil, 57000 Kuala Lumpur',
      },
      applicant: {
        fullName: applicantName || 'Dr. Hishamudin Bin Kassim',
        designation: designation || 'Chief Operating Officer',
        email: email || 'hishamudin@alphanextgen.my',
        phone: phone || '+60 12-382 1092',
        identificationNo: nric || '840210-14-5193',
      },
      technology: {
        productName: productName || 'BioSmart Autonomous Drone Inspection Pod',
        tagline: tagline || 'Automated structural integrity sensing for high-rise facades and bridges',
        trlLevel,
        productDescription: productDescription || 'Field-validated multispectral drone docking payload with edge defect inference and automatic battery swapping.',
        ipStatus,
        productionReadiness: productionReadiness || 'Pilot production completed for 10 units with testing partner.',
        currentCapacity: currentCapacity || '20 pods / year',
        targetMilestones: [
          'Industrial design refinement & waterproofing certification',
          'Autonomous dock manufacturing line scale-up',
          'Deploy 30 pods for Malaysian bridge and viaduct inspection'
        ],
      },
      market: {
        targetMarket: targetMarket || 'Infrastructure asset owners, highway concessionaires, railway authorities',
        targetCustomerProfile: 'Engineering heads and maintenance directors',
        tamSamSom: tamSamSom || 'TAM: RM 1.5B | SAM: RM 240M | SOM: RM 35M',
        fundingRequested,
        utilizationBreakdown: [
          { category: 'Tooling & High-Tolerance CNC Molds', amount: Math.round(fundingRequested * 0.40), percentage: 40 },
          { category: 'Testing & Aviation Safety Certification', amount: Math.round(fundingRequested * 0.25), percentage: 25 },
          { category: 'Commercial Pilot Fleet Deployment', amount: Math.round(fundingRequested * 0.35), percentage: 35 },
        ],
        revenueModel: revenueModel || 'Hardware unit leasing + recurring SaaS inspection software analytics',
        exportPotential,
        exportTargetCountries: ['Singapore', 'Indonesia', 'Australia'],
      },
      documents: files.map((f, i) => ({
        id: `doc-${Date.now()}-${i}`,
        name: f.name,
        type: f.type,
        size: f.size,
        uploadedAt: new Date().toISOString().split('T')[0],
      })),
    });

    setSubmittedRef(created.id);
  };

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = existingApplications.find(
      (a) => a.id.toLowerCase() === searchRefId.trim().toLowerCase()
    );
    setTrackedApp(found || null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Mode Switcher */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-sky-700">Commercialize Grant (Dana Pengkomersialan)</span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Applicant Service Portal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit your commercialization grant proposal or track the progress of your submitted application through the evaluation pipeline.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMode('apply')}
            className={`px-4 py-2 rounded-md transition-all ${
              activeMode === 'apply'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Grant Application
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('track')}
            className={`px-4 py-2 rounded-md transition-all ${
              activeMode === 'track'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Track Status by Ref ID
          </button>
        </div>
      </div>

      {activeMode === 'apply' && (
        <>
          {submittedRef ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Application Successfully Submitted!</h2>
              <p className="text-xs text-slate-600 max-w-lg mx-auto">
                Your grant application has been recorded in the central commercialization repository. A confirmation email has been dispatched to your email address.
              </p>
              <div className="inline-block bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-base font-bold text-slate-900 my-2">
                Reference ID: <span className="text-sky-700">{submittedRef}</span>
              </div>
              <div className="text-xs text-slate-500 max-w-md mx-auto">
                Please retain this Reference ID. You may use it to track your evaluation progress across the dual-reviewer scoring and analyst due diligence phases.
              </div>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedRef(null);
                    setCurrentStep(1);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Submit Another Proposal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchRefId(submittedRef);
                    const found = existingApplications.find((a) => a.id === submittedRef);
                    setTrackedApp(found || null);
                    setActiveMode('track');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm"
                >
                  Track Application Status
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              {/* Step indicator */}
              <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50 text-xs">
                {[
                  { step: 1, label: 'Company Info', icon: Building2 },
                  { step: 2, label: 'Applicant Profile', icon: User },
                  { step: 3, label: 'Technology & TRL', icon: Cpu },
                  { step: 4, label: 'Market & Grant', icon: TrendingUp },
                  { step: 5, label: 'Attachments & Review', icon: Paperclip },
                ].map((s) => {
                  const Icon = s.icon;
                  const isActive = currentStep === s.step;
                  const isDone = currentStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setCurrentStep(s.step)}
                      className={`p-3 text-center border-r last:border-r-0 border-slate-200 flex flex-col items-center gap-1 transition-colors ${
                        isActive
                          ? 'bg-white text-sky-700 font-bold border-b-2 border-b-sky-600'
                          : isDone
                          ? 'text-slate-800 font-medium'
                          : 'text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Form Body */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
                {/* STEP 1: Company Profile */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      1. Registered Enterprise Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Registered Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. BioHarvest Dynamics Sdn Bhd"
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          SSM Registration Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={ssmNumber}
                          onChange={(e) => setSsmNumber(e.target.value)}
                          placeholder="e.g. 202101034821 (1428930-T)"
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 font-mono focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Primary Industry Sector *
                        </label>
                        <select
                          value={sector}
                          onChange={(e) => setSector(e.target.value as IndustrySector)}
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 bg-slate-50 font-medium"
                        >
                          {SECTORS.map((sec) => (
                            <option key={sec} value={sec}>
                              {sec}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          State / Location *
                        </label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value as MalaysianState)}
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 bg-slate-50 font-medium"
                        >
                          {MALAYSIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          City / Town *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Shah Alam, Petaling Jaya, Bayan Lepas"
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Incorporation Year *
                        </label>
                        <input
                          type="number"
                          min="1990"
                          max="2026"
                          value={incorporationYear}
                          onChange={(e) => setIncorporationYear(Number(e.target.value))}
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 font-mono focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Latest Annual Turnover (MYR) *
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="10000"
                            min="0"
                            value={annualTurnover}
                            onChange={(e) => setAnnualTurnover(Number(e.target.value))}
                            className="w-full text-xs border border-slate-200 rounded-md p-2.5 font-mono focus:ring-1 focus:ring-sky-500"
                          />
                          <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-2 py-2 rounded border border-sky-200 shrink-0">
                            Tier: {getTurnoverTier(annualTurnover)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Paid-up Capital (MYR) *
                        </label>
                        <input
                          type="number"
                          step="10000"
                          min="0"
                          value={paidUpCapital}
                          onChange={(e) => setPaidUpCapital(Number(e.target.value))}
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 font-mono focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Operating Facility / Factory Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Lot 14, Kawasan Perindustrian Bukit Kemuning, 40460 Shah Alam"
                        className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: Applicant Profile */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      2. Primary Contact & Authorized Applicant
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Full Name (as per NRIC / Passport) *
                        </label>
                        <input
                          type="text"
                          required
                          value={applicantName}
                          onChange={(e) => setApplicantName(e.target.value)}
                          placeholder="e.g. Dr. Syahril Nizam Bin Ahmad"
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Designation / Role in Company *
                        </label>
                        <input
                          type="text"
                          required
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="e.g. Chief Technology Officer, Managing Director"
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Official Corporate Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. syahril@bioharvestdynamics.my"
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Direct Contact Mobile Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +60 12-384 9912"
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 font-mono focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Identification Number (NRIC / Passport) *
                        </label>
                        <input
                          type="text"
                          required
                          value={nric}
                          onChange={(e) => setNric(e.target.value)}
                          placeholder="e.g. 850412-10-5421"
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 font-mono focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Technology & TRL */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      3. Product / Technology Readiness (TRL 6 – 9)
                    </h3>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Commercial Product / Service Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g. PrecisionPulse Smart Harvester & Spectral Ripeness Sensor"
                        className="w-full text-xs border border-slate-200 rounded-md p-2.5 font-medium focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        One-Line Value Proposition / Tagline
                      </label>
                      <input
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="e.g. AI-driven optical sorting and predictive yield forecasting for palm oil plantations"
                        className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    {/* TRL Selector */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Technology Readiness Level (TRL) *
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { trl: 6, label: 'TRL 6: Prototype Tested in Relevant Environment' },
                          { trl: 7, label: 'TRL 7: Integrated Prototype Demonstrated in Operational Environment' },
                          { trl: 8, label: 'TRL 8: System Complete & Qualified through Test & Demonstration' },
                          { trl: 9, label: 'TRL 9: Full Commercial Scale & Deployment Ready' },
                        ].map((t) => (
                          <button
                            key={t.trl}
                            type="button"
                            onClick={() => setTrlLevel(t.trl as any)}
                            className={`p-3 text-left border rounded-lg transition-all ${
                              trlLevel === t.trl
                                ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="font-bold text-sm block font-mono">TRL {t.trl}</span>
                            <span className="text-[11px] leading-tight block text-slate-600 mt-1">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Intellectual Property (IP) Status *
                        </label>
                        <select
                          value={ipStatus}
                          onChange={(e) => setIpStatus(e.target.value as IPStatus)}
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 bg-slate-50 font-medium"
                        >
                          <option value="Patented">Patented (Granted by MyIPO / International)</option>
                          <option value="Patent Pending">Patent Pending (Filing in progress)</option>
                          <option value="Trade Secret">Trade Secret / Proprietary Formulation</option>
                          <option value="Copyright">Copyright / Software Source Code Registered</option>
                          <option value="None">None / Open Standard</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Current Pilot / Assembly Capacity
                        </label>
                        <input
                          type="text"
                          value={currentCapacity}
                          onChange={(e) => setCurrentCapacity(e.target.value)}
                          placeholder="e.g. 15 units/month assembly capacity"
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Technical Description & Core Innovation *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="Explain your technology, operating mechanism, scientific validation, and competitive advantages..."
                        className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: Market & Grant */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      4. Market Commercialization & Funding Request
                    </h3>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Requested Commercialize Grant Amount (MYR) *
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="200000"
                          max="1000000"
                          step="50000"
                          value={fundingRequested}
                          onChange={(e) => setFundingRequested(Number(e.target.value))}
                          className="flex-1 accent-sky-600"
                        />
                        <div className="font-mono text-base font-bold text-sky-800 bg-sky-50 px-3 py-1.5 rounded-md border border-sky-200 min-w-[160px] text-right">
                          RM {fundingRequested.toLocaleString()}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Eligible grant quantum: RM 200,000 to RM 1,000,000. Matching fund requirement applies.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Target Market & Customer Segments *
                        </label>
                        <input
                          type="text"
                          required
                          value={targetMarket}
                          onChange={(e) => setTargetMarket(e.target.value)}
                          placeholder="e.g. Palm oil plantation conglomerates, OSAT foundries, clinics"
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Market Sizing (TAM / SAM / SOM)
                        </label>
                        <input
                          type="text"
                          value={tamSamSom}
                          onChange={(e) => setTamSamSom(e.target.value)}
                          placeholder="e.g. TAM: RM 1.2B | SAM: RM 340M | SOM: RM 42M"
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Commercial Revenue Model
                        </label>
                        <input
                          type="text"
                          value={revenueModel}
                          onChange={(e) => setRevenueModel(e.target.value)}
                          placeholder="e.g. Direct hardware sale + annual SaaS subscription"
                          className="w-full text-xs border border-slate-200 rounded-md p-2.5 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Export Potential
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-800 p-2 border border-slate-200 rounded-md bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exportPotential}
                            onChange={(e) => setExportPotential(e.target.checked)}
                            className="accent-sky-600 rounded"
                          />
                          <span>Plan to commercialize and export to ASEAN or global markets</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: Attachments & Review */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      5. Document Attachments & Final Submission
                    </h3>

                    {/* Upload Box */}
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <div className="text-xs font-semibold text-slate-800">
                        Upload Supporting Documents & Pitch Deck
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        SSM Certificate, Audited Financial Reports, Technical Specs, MyIPO Patent Filing (PDF, max 10MB)
                      </div>
                      <label className="inline-block mt-3 px-3.5 py-1.5 text-xs font-semibold text-sky-700 bg-white border border-sky-300 rounded-md shadow-2xs hover:bg-sky-50 cursor-pointer">
                        Browse Files
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                        />
                      </label>
                    </div>

                    {/* File List */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-700 block">
                        Attached Files ({files.length}):
                      </span>
                      {files.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 border border-slate-200 rounded-md bg-white text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-emerald-600" />
                            <span className="font-medium text-slate-800">{file.name}</span>
                          </div>
                          <span className="font-mono text-slate-500 text-[11px]">{file.size}</span>
                        </div>
                      ))}
                    </div>

                    {/* Declaration */}
                    <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-950 space-y-1">
                      <span className="font-bold block">Applicant Governance Declaration:</span>
                      <p className="leading-relaxed">
                        I hereby declare that the information submitted is true, accurate, and represents verifiable commercialization milestones. I acknowledge that this proposal will undergo independent technical scoring by 2 accredited reviewers and financial due diligence by an appointed grant analyst.
                      </p>
                    </div>
                  </div>
                )}

                {/* Form Navigation Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((prev) => prev - 1)}
                      className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Step {currentStep - 1}
                    </button>
                  ) : <div />}

                  {currentStep < 5 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((prev) => prev + 1)}
                      className="px-5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      Continue to Step {currentStep + 1}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Submit Commercialize Grant Proposal
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* TRACKING MODE */}
      {activeMode === 'track' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-2">Track Grant Application by Reference ID</h2>
            <form onSubmit={handleTrackSearch} className="flex gap-2">
              <input
                type="text"
                value={searchRefId}
                onChange={(e) => setSearchRefId(e.target.value)}
                placeholder="Enter Reference ID, e.g. CRG-2026-0101"
                className="flex-1 text-xs border border-slate-200 rounded-md p-2.5 font-mono uppercase focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                Track Status
              </button>
            </form>
          </div>

          {trackedApp && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-4 gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {trackedApp.id}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{trackedApp.company.name}</h3>
                  <div className="text-xs text-slate-600 mt-0.5">{trackedApp.technology.productName}</div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Requested Amount:</span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    RM {trackedApp.market.fundingRequested.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Stepper */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Pipeline Progression Tracker
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    { key: 'submitted', title: '1. Submitted', desc: 'Received & Screening' },
                    { key: 'scoring_review', title: '2. Dual Scoring', desc: '2 Reviewers Evaluating' },
                    { key: 'shortlisted', title: '3. Shortlisted', desc: 'Analyst Due Diligence' },
                    { key: 'awarded', title: '4. Awarded', desc: 'Grant Disbursed' },
                  ].map((step, idx) => {
                    const isPassed =
                      (step.key === 'submitted') ||
                      (step.key === 'scoring_review' && trackedApp.status !== 'submitted') ||
                      (step.key === 'shortlisted' && (trackedApp.status === 'shortlisted' || trackedApp.status === 'analyst_due_diligence' || trackedApp.status === 'awarded')) ||
                      (step.key === 'awarded' && trackedApp.status === 'awarded');

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-left ${
                          isPassed
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          {isPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5" />}
                          <span>{step.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">{step.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Evaluation State */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-semibold capitalize text-slate-800">{trackedApp.status.replace(/_/g, ' ')}</span>
                </div>
                {trackedApp.compositeScore && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dual-Reviewer Composite Score:</span>
                    <span className="font-mono font-bold text-sky-700">{trackedApp.compositeScore}%</span>
                  </div>
                )}
                {trackedApp.assignedAnalystName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Grant Analyst:</span>
                    <span className="font-semibold text-slate-800">{trackedApp.assignedAnalystName}</span>
                  </div>
                )}
                {trackedApp.committeeDecision && (
                  <div className="pt-2 border-t border-slate-200 text-emerald-800">
                    <span className="font-bold block">Committee Decision:</span>
                    <p className="mt-0.5">{trackedApp.committeeDecision.memo}</p>
                  </div>
                )}
              </div>

              {/* Form 1 & Form 2 Linked Submission Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Form 1 Intake Info */}
                <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                    <span className="font-bold text-sky-950 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-sky-700" /> Form 1: Intake Information
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                      Completed
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div><strong>SSM Registration:</strong> <span className="font-mono">{trackedApp.company.ssmNumber}</span></div>
                    <div><strong>Lead Applicant:</strong> {trackedApp.applicant.fullName} ({trackedApp.applicant.designation})</div>
                    <div><strong>Technology:</strong> {trackedApp.technology.productName} (TRL {trackedApp.technology.trlLevel})</div>
                    <div><strong>Requested Funding:</strong> <span className="font-mono font-bold text-sky-900">RM {trackedApp.market.fundingRequested.toLocaleString()}</span></div>
                    <div><strong>Attached Documents:</strong> {trackedApp.documents?.length || 0} files</div>
                  </div>
                </div>

                {/* Form 2 Due Diligence Info */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-700" /> Form 2: Due Diligence
                    </span>
                    {trackedApp.supplementarySubmissions && trackedApp.supplementarySubmissions.length > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Linked ({trackedApp.supplementarySubmissions.length})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Awaiting Submission
                      </span>
                    )}
                  </div>
                  {trackedApp.supplementarySubmissions && trackedApp.supplementarySubmissions.length > 0 ? (
                    <div className="space-y-1 text-slate-700">
                      <div><strong>Submitted On:</strong> {new Date(trackedApp.supplementarySubmissions[0].submittedAt).toLocaleDateString()}</div>
                      {trackedApp.supplementarySubmissions[0].data?.market_traction_summary && (
                        <div>
                          <strong>Market Traction:</strong>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                            "{trackedApp.supplementarySubmissions[0].data.market_traction_summary}"
                          </p>
                        </div>
                      )}
                      <div><strong>Attached Proof Files:</strong> {trackedApp.supplementarySubmissions[0].documents?.length || 0} files</div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      Stage 2 information will be requested by the assigned grant analyst after scoring review.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
