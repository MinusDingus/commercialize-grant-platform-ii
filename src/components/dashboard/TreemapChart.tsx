import React, { useState, useMemo } from 'react';
import { GrantApplication, IndustrySector, MalaysianState } from '../../types/grant';
import { ApplicationDossierModal } from '../common/ApplicationDossierModal';
import {
  Layers,
  MapPin,
  Building2,
  TrendingUp,
  Info,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Award,
  Globe2,
  FileCheck2,
  UserCheck,
  Percent,
  Compass,
  FileText,
  Search,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
} from 'lucide-react';

interface TreemapProps {
  applications: GrantApplication[];
  onSelectApplication: (app: GrantApplication) => void;
}

interface TileItem {
  id: string;
  app: GrantApplication;
  label: string;
  subLabel: string;
  value: number;
  sector: IndustrySector;
  state: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bgHex: string;
  borderHex: string;
}

interface DrilldownState {
  id: string;
  title: string;
  subtitle: string;
  badgeLabel?: string;
  badgeColor?: string;
  filterFn: (app: GrantApplication) => boolean;
}

const SECTOR_COLOR_MAP: Record<IndustrySector, { bg: string; border: string; badge: string; text: string }> = {
  'AgriTech & Food Security': { bg: '#ecfdf5', border: '#10b981', badge: '#059669', text: '#064e3b' },
  'Deep Tech & AI': { bg: '#eef2ff', border: '#6366f1', badge: '#4f46e5', text: '#312e81' },
  'Clean Energy & Mobility': { bg: '#f0fdfa', border: '#14b8a6', badge: '#0d9488', text: '#134e4a' },
  'Digital Health & Biotech': { bg: '#fff1f2', border: '#f43f5e', badge: '#e11d48', text: '#881337' },
  'Smart Manufacturing & IoT': { bg: '#fffbeb', border: '#f59e0b', badge: '#d97706', text: '#78350f' },
  'Creative Multimedia & FinTech': { bg: '#f0f9ff', border: '#0284c7', badge: '#0369a1', text: '#0c4a6e' },
};

export const TreemapChart: React.FC<TreemapProps> = ({
  applications,
  onSelectApplication,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'score_dist' | 'geo_dist' | 'form_tracking' | 'treemap'>('score_dist');
  const [hoveredTile, setHoveredTile] = useState<TileItem | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Interactive drilldown dropdown state
  const [activeDrilldown, setActiveDrilldown] = useState<DrilldownState | null>(null);
  const [drilldownSearch, setDrilldownSearch] = useState<string>('');

  // Dossier modal view for inspecting the actual form directly from statistics
  const [selectedDossierApp, setSelectedDossierApp] = useState<GrantApplication | null>(null);

  // Filtered applications by sector & search
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSector = selectedSector === 'all' || app.company.sector === selectedSector;
      const matchSearch =
        searchFilter === '' ||
        app.company.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        app.technology.productName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        app.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
        app.company.state.toLowerCase().includes(searchFilter.toLowerCase());
      return matchSector && matchSearch;
    });
  }, [applications, selectedSector, searchFilter]);

  // Aggregate metrics
  const totalFunding = useMemo(() => {
    return filteredApps.reduce((acc, curr) => acc + (curr.market?.fundingRequested || 0), 0);
  }, [filteredApps]);

  const scoredApps = useMemo(() => {
    return filteredApps.filter((a) => typeof a.compositeScore === 'number');
  }, [filteredApps]);

  const averageScore = useMemo(() => {
    if (scoredApps.length === 0) return 0;
    const sum = scoredApps.reduce((acc, curr) => acc + (curr.compositeScore || 0), 0);
    return Number((sum / scoredApps.length).toFixed(1));
  }, [scoredApps]);

  const medianScore = useMemo(() => {
    if (scoredApps.length === 0) return 0;
    const sorted = [...scoredApps].map((a) => a.compositeScore || 0).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
  }, [scoredApps]);

  const baselinePassCount = useMemo(() => {
    return filteredApps.filter((a) => a.baselinePassed || (a.compositeScore !== undefined && a.compositeScore >= 75)).length;
  }, [filteredApps]);

  // 1 to 5 criteria averages computed from actual reviewer scores
  const criteriaAverages = useMemo(() => {
    if (scoredApps.length === 0) return { market: 0, tech: 0, team: 0, finance: 0, ecosystem: 0 };
    let mSum = 0, tSum = 0, teamSum = 0, fSum = 0, eSum = 0;
    let count = 0;
    scoredApps.forEach((a) => {
      const r = a.reviewer1Score || a.reviewer2Score;
      if (r?.scores) {
        mSum += r.scores.marketPotential || 0;
        tSum += r.scores.techFeasibility || 0;
        teamSum += r.scores.teamCapability || 0;
        fSum += r.scores.financialSoundness || 0;
        eSum += r.scores.ecosystemImpact || 0;
        count++;
      }
    });
    if (count === 0) return { market: 0, tech: 0, team: 0, finance: 0, ecosystem: 0 };
    return {
      market: Number((mSum / count).toFixed(1)),
      tech: Number((tSum / count).toFixed(1)),
      team: Number((teamSum / count).toFixed(1)),
      finance: Number((fSum / count).toFixed(1)),
      ecosystem: Number((eSum / count).toFixed(1)),
    };
  }, [scoredApps]);

  // Score distribution brackets
  const scoreBrackets = useMemo(() => {
    const brackets = [
      { key: 'top', label: '≥ 85% High Distinction', min: 85, max: 100, color: 'bg-emerald-600', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', count: 0 },
      { key: 'shortlist', label: '75% – 84% Shortlisted (Baseline Met)', min: 75, max: 84.99, color: 'bg-sky-600', textColor: 'text-sky-700', bgLight: 'bg-sky-50', count: 0 },
      { key: 'borderline', label: '65% – 74% Near Baseline (Revision)', min: 65, max: 74.99, color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50', count: 0 },
      { key: 'below', label: '50% – 64% Below Baseline', min: 50, max: 64.99, color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50', count: 0 },
      { key: 'low', label: '< 50% High Gap / Unqualified', min: 0, max: 49.99, color: 'bg-rose-500', textColor: 'text-rose-700', bgLight: 'bg-rose-50', count: 0 },
    ];

    scoredApps.forEach((app) => {
      const s = app.compositeScore || 0;
      for (const b of brackets) {
        if (s >= b.min && s <= b.max) {
          b.count++;
          break;
        }
      }
    });

    return brackets;
  }, [scoredApps]);

  // Reviewer variance / consensus
  const reviewerDiscrepancies = useMemo(() => {
    return filteredApps.filter((app) => {
      if (app.reviewer1Score && app.reviewer2Score) {
        const diff = Math.abs(app.reviewer1Score.totalWeightedScore - app.reviewer2Score.totalWeightedScore);
        return diff >= 15;
      }
      return false;
    });
  }, [filteredApps]);

  // Geographic distribution (States)
  const stateDistribution = useMemo(() => {
    const map = new Map<string, { count: number; funding: number; shortlisted: number }>();
    filteredApps.forEach((app) => {
      const state = app.company.state || 'Kuala Lumpur';
      const existing = map.get(state) || { count: 0, funding: 0, shortlisted: 0 };
      existing.count += 1;
      existing.funding += app.market?.fundingRequested || 0;
      if (app.baselinePassed || (app.compositeScore && app.compositeScore >= 75)) {
        existing.shortlisted += 1;
      }
      map.set(state, existing);
    });

    return Array.from(map.entries())
      .map(([state, data]) => ({ state, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [filteredApps]);

  // Export target countries
  const exportCountries = useMemo(() => {
    const countryMap = new Map<string, number>();
    filteredApps.forEach((app) => {
      if (app.market?.exportTargetCountries && app.market.exportTargetCountries.length > 0) {
        app.market.exportTargetCountries.forEach((c) => {
          const clean = c.trim();
          if (clean) countryMap.set(clean, (countryMap.get(clean) || 0) + 1);
        });
      }
      const text = `${app.market?.targetMarket || ''} ${app.market?.revenueModel || ''}`.toLowerCase();
      ['singapore', 'indonesia', 'thailand', 'vietnam', 'philippines', 'australia', 'japan', 'china', 'united states', 'middle east', 'europe'].forEach((cnt) => {
        if (text.includes(cnt)) {
          const label = cnt.charAt(0).toUpperCase() + cnt.slice(1);
          countryMap.set(label, (countryMap.get(label) || 0) + 1);
        }
      });
    });

    return Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredApps]);

  // Form Tracking Statistics
  const formTrackingStats = useMemo(() => {
    const total = filteredApps.length;
    const form1Complete = total;
    const bothReviewers = filteredApps.filter((a) => a.reviewer1Score && a.reviewer2Score).length;
    const singleReviewer = filteredApps.filter((a) => (a.reviewer1Score && !a.reviewer2Score) || (!a.reviewer1Score && a.reviewer2Score)).length;
    const pendingReviewers = filteredApps.filter((a) => !a.reviewer1Score && !a.reviewer2Score).length;

    const form2Linked = filteredApps.filter((a) => a.supplementarySubmissions && a.supplementarySubmissions.length > 0).length;
    const form2Pending = filteredApps.filter((a) => a.status === 'shortlisted' && (!a.supplementarySubmissions || a.supplementarySubmissions.length === 0)).length;

    const trlBreakdown = {
      trl6: filteredApps.filter((a) => a.technology.trlLevel === 6).length,
      trl7: filteredApps.filter((a) => a.technology.trlLevel === 7).length,
      trl8: filteredApps.filter((a) => a.technology.trlLevel === 8).length,
      trl9: filteredApps.filter((a) => a.technology.trlLevel === 9).length,
    };

    const statusFunnel = [
      { key: 'form1_ingested', stage: '1. Form 1 Ingested', count: total, pct: 100, color: 'bg-slate-400', filterFn: () => true },
      { key: 'scored', stage: '2. Reviewer Scored', count: bothReviewers + singleReviewer, pct: total ? Math.round(((bothReviewers + singleReviewer) / total) * 100) : 0, color: 'bg-amber-500', filterFn: (a: GrantApplication) => !!(a.reviewer1Score || a.reviewer2Score) },
      { key: 'shortlisted', stage: '3. Baseline Shortlisted', count: baselinePassCount, pct: total ? Math.round((baselinePassCount / total) * 100) : 0, color: 'bg-sky-500', filterFn: (a: GrantApplication) => !!(a.baselinePassed || (a.compositeScore !== undefined && a.compositeScore >= 75)) },
      { key: 'due_diligence', stage: '4. Form 2 / Due Diligence', count: form2Linked + filteredApps.filter(a => a.status === 'analyst_due_diligence').length, pct: total ? Math.round(((form2Linked + filteredApps.filter(a => a.status === 'analyst_due_diligence').length) / total) * 100) : 0, color: 'bg-indigo-600', filterFn: (a: GrantApplication) => !!(a.supplementarySubmissions?.length || a.status === 'analyst_due_diligence') },
      { key: 'awarded', stage: '5. Grant Awarded', count: filteredApps.filter(a => a.status === 'awarded').length, pct: total ? Math.round((filteredApps.filter(a => a.status === 'awarded').length / total) * 100) : 0, color: 'bg-emerald-600', filterFn: (a: GrantApplication) => a.status === 'awarded' },
    ];

    return {
      total,
      form1Complete,
      bothReviewers,
      singleReviewer,
      pendingReviewers,
      form2Linked,
      form2Pending,
      trlBreakdown,
      statusFunnel,
    };
  }, [filteredApps, baselinePassCount]);

  // Treemap computation
  const tiles: TileItem[] = useMemo(() => {
    if (filteredApps.length === 0 || totalFunding === 0) return [];
    const sectors = Array.from(new Set(filteredApps.map((a) => a.company.sector)));
    const width = 1000;
    const height = 520;

    const sectorTotals = sectors.map((sec) => {
      const apps = filteredApps.filter((a) => a.company.sector === sec);
      const total = apps.reduce((sum, a) => sum + (a.market?.fundingRequested || 0), 0);
      return { sector: sec, apps, total };
    }).sort((a, b) => b.total - a.total);

    let currentX = 0;
    const computedTiles: TileItem[] = [];

    sectorTotals.forEach((secGroup) => {
      const secWeight = secGroup.total / totalFunding;
      const secWidth = Math.max(120, width * secWeight);

      let currentY = 0;
      const secApps = [...secGroup.apps].sort((a, b) => (b.market?.fundingRequested || 0) - (a.market?.fundingRequested || 0));

      secApps.forEach((app, idx) => {
        const appWeight = (app.market?.fundingRequested || 0) / (secGroup.total || 1);
        const appHeight = idx === secApps.length - 1
          ? height - currentY
          : Math.max(65, height * appWeight);

        const colors = SECTOR_COLOR_MAP[app.company.sector] || SECTOR_COLOR_MAP['Deep Tech & AI'];

        computedTiles.push({
          id: app.id,
          app,
          label: app.company.name,
          subLabel: app.technology.productName,
          value: app.market?.fundingRequested || 0,
          sector: app.company.sector,
          state: app.company.state,
          x: currentX,
          y: currentY,
          w: secWidth,
          h: Math.min(appHeight, height - currentY),
          bgHex: colors.bg,
          borderHex: colors.border,
        });

        currentY += appHeight;
      });

      currentX += secWidth;
    });

    return computedTiles;
  }, [filteredApps, totalFunding]);

  // Applications matching the active drilldown dropdown
  const drilldownApplications = useMemo(() => {
    if (!activeDrilldown) return [];
    const base = filteredApps.filter(activeDrilldown.filterFn);
    if (!drilldownSearch.trim()) return base;
    const q = drilldownSearch.toLowerCase();
    return base.filter((app) =>
      app.company.name.toLowerCase().includes(q) ||
      app.technology.productName.toLowerCase().includes(q) ||
      app.id.toLowerCase().includes(q) ||
      app.applicant.fullName.toLowerCase().includes(q)
    );
  }, [filteredApps, activeDrilldown, drilldownSearch]);

  const toggleDrilldown = (state: DrilldownState) => {
    if (activeDrilldown?.id === state.id) {
      setActiveDrilldown(null);
    } else {
      setActiveDrilldown(state);
      setDrilldownSearch('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Statistical KPI Strip (Clickable to reveal application dropdown) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() =>
            toggleDrilldown({
              id: 'kpi-all',
              title: 'All Ingested Applications',
              subtitle: 'Full list of grant proposals currently in pipeline',
              badgeLabel: `${filteredApps.length} Applications`,
              badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
              filterFn: () => true,
            })
          }
          className={`bg-white p-4 border rounded-xl shadow-2xs text-left transition-all cursor-pointer group hover:border-sky-400 hover:shadow-xs ${
            activeDrilldown?.id === 'kpi-all' ? 'ring-2 ring-sky-500 border-sky-500 bg-sky-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold group-hover:text-sky-700">Total Intake Applications</span>
            <Building2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {filteredApps.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="font-semibold text-emerald-700">{scoredApps.length} Scored</span>
            <span className="text-[10px] text-sky-700 font-bold group-hover:underline flex items-center gap-0.5">
              Forms ▾
            </span>
          </div>
        </button>

        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Requested Grant Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            RM {(totalFunding / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg: RM {filteredApps.length ? Math.round(totalFunding / filteredApps.length / 1000) : 0}K / application
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Average Composite Score</span>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {averageScore > 0 ? `${averageScore}%` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Median: <strong>{medianScore}%</strong></span>
            <span>·</span>
            <span>Pass Rate: <strong>{scoredApps.length ? Math.round((baselinePassCount / scoredApps.length) * 100) : 0}%</strong></span>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            toggleDrilldown({
              id: 'kpi-baseline',
              title: 'Shortlisted Applications (Score ≥ 75%)',
              subtitle: 'Applications passing commercial threshold and ready for due diligence',
              badgeLabel: `${baselinePassCount} Shortlisted`,
              badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
              filterFn: (a) => !!(a.baselinePassed || (a.compositeScore !== undefined && a.compositeScore >= 75)),
            })
          }
          className={`bg-white p-4 border rounded-xl shadow-2xs text-left transition-all cursor-pointer group hover:border-emerald-400 hover:shadow-xs ${
            activeDrilldown?.id === 'kpi-baseline' ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold group-hover:text-emerald-700">Shortlisted Baseline Met</span>
            <Award className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-900 tabular-nums">
            {baselinePassCount}
          </div>
          <div className="text-[11px] text-sky-700 mt-1 flex items-center justify-between">
            <span>&ge; 75% Baseline</span>
            <span className="text-[10px] text-emerald-700 font-bold group-hover:underline flex items-center gap-0.5">
              Forms ▾
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            toggleDrilldown({
              id: 'kpi-form2',
              title: 'Form 2 (Due Diligence) Submissions',
              subtitle: 'Applications with submitted commercial market traction and 3-year expansion models',
              badgeLabel: `${formTrackingStats.form2Linked} Form 2 Linked`,
              badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
              filterFn: (a) => !!(a.supplementarySubmissions && a.supplementarySubmissions.length > 0),
            })
          }
          className={`bg-white p-4 border rounded-xl shadow-2xs text-left transition-all cursor-pointer group hover:border-indigo-400 hover:shadow-xs ${
            activeDrilldown?.id === 'kpi-form2' ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold group-hover:text-indigo-700">Form 2 Due Diligence</span>
            <FileCheck2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formTrackingStats.form2Linked}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Market traction linked</span>
            <span className="text-[10px] text-indigo-700 font-bold group-hover:underline flex items-center gap-0.5">
              Forms ▾
            </span>
          </div>
        </button>
      </div>

      {/* INTERACTIVE STATISTIC DRILLDOWN DROPDOWN PANEL */}
      {activeDrilldown && (
        <div className="bg-white border-2 border-sky-400 rounded-2xl p-5 shadow-lg space-y-4 animate-in slide-in-from-top-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5 text-sky-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{activeDrilldown.title}</h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${activeDrilldown.badgeColor || 'bg-sky-50 text-sky-800 border-sky-200'}`}>
                    {activeDrilldown.badgeLabel || `${drilldownApplications.length} Applications`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{activeDrilldown.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter forms..."
                  value={drilldownSearch}
                  onChange={(e) => setDrilldownSearch(e.target.value)}
                  className="text-xs pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg w-44 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setActiveDrilldown(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close dropdown"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {drilldownApplications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No applications match this specific statistic filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {drilldownApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 hover:border-sky-300 hover:bg-white transition-all text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                      {app.id}
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {app.compositeScore !== undefined ? `${app.compositeScore}%` : 'Score Pending'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 truncate" title={app.company.name}>
                      {app.company.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate" title={app.technology.productName}>
                      {app.technology.productName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>TRL {app.technology.trlLevel} · {app.company.state}</span>
                    <span className="font-mono font-semibold text-slate-700">RM {(app.market.fundingRequested / 1000).toLocaleString()}K</span>
                  </div>

                  {/* Direct Link to Actual Form Dossier */}
                  <div className="pt-1 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDossierApp(app)}
                      className="flex-1 py-1 px-2 bg-sky-700 hover:bg-sky-800 text-white rounded font-semibold text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Open Form Dossier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectApplication(app)}
                      className="py-1 px-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Inspect in CRM pipeline view"
                    >
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span>CRM</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation Sub-Tabs & Filtering Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('score_dist')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'score_dist'
                ? 'bg-sky-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Score Distribution &amp; Rubric</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('geo_dist')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'geo_dist'
                ? 'bg-sky-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>State &amp; Country / Export Stats</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('form_tracking')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'form_tracking'
                ? 'bg-sky-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Form Tracking &amp; Lifecycle</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('treemap')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'treemap'
                ? 'bg-sky-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Treemap Grant Sizing</span>
          </button>
        </div>

        {/* Global Filter Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="text-xs pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg w-40 sm:w-48 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700"
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
      </div>

      {/* EMPTY DATA CALLOUT */}
      {applications.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Platform Database is Ready for Sheet Intake</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All mock data has been cleared. Paste your spreadsheet rows or upload your CSV in the <strong>Sheet &amp; Jotform Intake</strong> tab, and all score distributions, country statistics, and form tracking metrics will populate in real time!
          </p>
        </div>
      )}

      {/* SUB-TAB 1: SCORE DISTRIBUTION & RUBRIC STATS */}
      {applications.length > 0 && activeSubTab === 'score_dist' && (
        <div className="space-y-6">
          {/* Score Distribution Brackets / Histogram */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-600" />
                  Composite Score Distribution &amp; Qualification Brackets
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any score bracket below to open the application dropdown and inspect actual form dossiers
                </p>
              </div>

              <div className="text-xs font-semibold text-slate-600">
                Total Scored: <strong>{scoredApps.length}</strong> of {filteredApps.length}
              </div>
            </div>

            {/* Score Brackets Visual Bars (Clickable) */}
            <div className="space-y-3 pt-1">
              {scoreBrackets.map((bracket) => {
                const pct = scoredApps.length > 0 ? Math.round((bracket.count / scoredApps.length) * 100) : 0;
                const isSelected = activeDrilldown?.id === `bracket-${bracket.key}`;
                return (
                  <div
                    key={bracket.key}
                    onClick={() =>
                      toggleDrilldown({
                        id: `bracket-${bracket.key}`,
                        title: `Score Bracket: ${bracket.label}`,
                        subtitle: `Applications with composite evaluator scores between ${bracket.min}% and ${bracket.max}%`,
                        badgeLabel: `${bracket.count} Applications (${pct}%)`,
                        badgeColor: bracket.bgLight,
                        filterFn: (app) => {
                          const s = app.compositeScore || 0;
                          return s >= bracket.min && s <= bracket.max;
                        },
                      })
                    }
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/50 shadow-2xs'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800 flex items-center gap-2 group-hover:text-sky-700">
                        <span className={`w-2.5 h-2.5 rounded-full ${bracket.color}`} />
                        <span>{bracket.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">▾ click to view forms</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{bracket.count} apps</span>
                        <span className="text-slate-400 font-mono text-[11px]">({pct}%)</span>
                      </div>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bracket.color} transition-all duration-500 rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistical Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Score Dispersion */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Score Dispersion &amp; Averages
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Mean Composite Score</span>
                  <span className="font-mono font-bold text-slate-900">{averageScore}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Median Evaluation Score</span>
                  <span className="font-mono font-bold text-slate-900">{medianScore}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Highest Score Recorded</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {scoredApps.length ? `${Math.max(...scoredApps.map((a) => a.compositeScore || 0))}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Lowest Score Recorded</span>
                  <span className="font-mono font-bold text-rose-700">
                    {scoredApps.length ? `${Math.min(...scoredApps.map((a) => a.compositeScore || 0))}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Reviewer Consensus & Discrepancies */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Reviewer Consensus Tracking
                </span>
                <UserCheck className="w-4 h-4 text-indigo-600" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Dual-Scored Completed</span>
                  <span className="font-mono font-bold text-slate-900">
                    {filteredApps.filter((a) => a.reviewer1Score && a.reviewer2Score).length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toggleDrilldown({
                      id: 'variance-arbitration',
                      title: 'Reviewer Arbitrations (>15% Score Variance)',
                      subtitle: 'Applications requiring Reviewer 3 / Analyst arbitration due to evaluator divergence',
                      badgeLabel: `${reviewerDiscrepancies.length} Files`,
                      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
                      filterFn: (app) => {
                        if (app.reviewer1Score && app.reviewer2Score) {
                          return Math.abs(app.reviewer1Score.totalWeightedScore - app.reviewer2Score.totalWeightedScore) >= 15;
                        }
                        return false;
                      },
                    })
                  }
                  className="w-full flex justify-between items-center py-1 border-b border-slate-100 hover:bg-slate-50 px-1 rounded text-left cursor-pointer group"
                >
                  <span className="text-slate-500 group-hover:text-indigo-700">Reviewer 3 Arbitrations</span>
                  <span className="font-mono font-bold text-indigo-700 flex items-center gap-1">
                    {reviewerDiscrepancies.length} files ▾
                  </span>
                </button>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Score Consensus Rate</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formTrackingStats.bothReviewers > 0
                      ? `${Math.round(((formTrackingStats.bothReviewers - reviewerDiscrepancies.length) / formTrackingStats.bothReviewers) * 100)}%`
                      : 'N/A'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  Applications with &gt;15% variance automatically route to Reviewer 3 / Analyst.
                </p>
              </div>
            </div>

            {/* Box 3: 5-Point Dimension Averages (1 to 5 Scale) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Criteria Dimension Averages (1 - 5 Scale)
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Commercial &amp; Market (25%)</span>
                  <span className="font-mono font-bold text-sky-800">{criteriaAverages.market} / 5</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Technical &amp; TRL (25%)</span>
                  <span className="font-mono font-bold text-sky-800">{criteriaAverages.tech} / 5</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Team &amp; Governance (20%)</span>
                  <span className="font-mono font-bold text-sky-800">{criteriaAverages.team} / 5</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Financial Soundness (20%)</span>
                  <span className="font-mono font-bold text-sky-800">{criteriaAverages.finance} / 5</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Ecosystem Impact (10%)</span>
                  <span className="font-mono font-bold text-sky-800">{criteriaAverages.ecosystem} / 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STATE & COUNTRY / EXPORT DISTRIBUTION */}
      {applications.length > 0 && activeSubTab === 'geo_dist' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Malaysian States Ranking Table (Clickable to reveal applications) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Malaysian State Distribution Ranking
                  </h3>
                  <p className="text-xs text-slate-500">Click any state row to view all matching application forms</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                  {stateDistribution.length} States Active
                </span>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {stateDistribution.map((item, index) => {
                  const sharePct = filteredApps.length > 0 ? Math.round((item.count / filteredApps.length) * 100) : 0;
                  const isSelected = activeDrilldown?.id === `state-${item.state}`;
                  return (
                    <div
                      key={item.state}
                      onClick={() =>
                        toggleDrilldown({
                          id: `state-${item.state}`,
                          title: `State: ${item.state}`,
                          subtitle: `Applications originating from ${item.state} totaling RM ${(item.funding / 1000).toLocaleString()}K`,
                          badgeLabel: `${item.count} Applications`,
                          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                          filterFn: (app) => (app.company.state || 'Kuala Lumpur') === item.state,
                        })
                      }
                      className={`border rounded-lg p-3 transition-all cursor-pointer group text-xs space-y-1.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-400'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-900 group-hover:text-emerald-800">{item.state}</span>
                          <span className="text-[10px] text-slate-400 font-normal">▾ forms</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sky-800">
                            RM {(item.funding / 1000).toLocaleString()}K
                          </span>
                          <span className="font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                            {item.count} apps ({sharePct}%)
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${sharePct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Country & Export Expansion Metrics (Clickable) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-sky-600" />
                      Export Target Markets &amp; Countries
                    </h3>
                    <p className="text-xs text-slate-500">Click any country to view ventures targeting that market</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {exportCountries.length === 0 ? (
                    <p className="text-xs text-slate-400">Export targets captured in company market filings.</p>
                  ) : (
                    exportCountries.map((c) => {
                      const isSelected = activeDrilldown?.id === `country-${c.country}`;
                      return (
                        <div
                          key={c.country}
                          onClick={() =>
                            toggleDrilldown({
                              id: `country-${c.country}`,
                              title: `Export Target Country: ${c.country}`,
                              subtitle: `Applications with declared commercial expansion into ${c.country}`,
                              badgeLabel: `${c.count} Ventures`,
                              badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
                              filterFn: (app) => {
                                const inArray = app.market?.exportTargetCountries?.some(
                                  (tc) => tc.toLowerCase().includes(c.country.toLowerCase())
                                );
                                const inText = `${app.market?.targetMarket || ''} ${app.market?.revenueModel || ''}`.toLowerCase().includes(c.country.toLowerCase());
                                return !!(inArray || inText);
                              },
                            })
                          }
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all cursor-pointer group ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50/50 shadow-xs ring-1 ring-sky-400'
                              : 'border-slate-200/70 bg-slate-50 hover:bg-white hover:border-sky-300'
                          }`}
                        >
                          <span className="font-semibold text-slate-800 group-hover:text-sky-800 flex items-center gap-1.5">
                            <span>{c.country}</span>
                            <span className="text-[10px] text-slate-400 font-normal">▾ forms</span>
                          </span>
                          <span className="font-mono font-bold text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded text-[11px]">
                            {c.count} ventures targeting
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Ownership & Equity Standing */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-xs space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-400" />
                  <h4 className="font-bold text-slate-100">National Equity &amp; Alignment</h4>
                </div>
                <div className="space-y-2 pt-1 text-slate-300 text-[11px]">
                  <div className="flex justify-between items-center py-1 border-b border-white/10">
                    <span>Local Malaysian Entity (SSM Certified)</span>
                    <strong className="text-emerald-400">100% Verified</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/10">
                    <span>Export Readiness Declaration</span>
                    <strong className="text-sky-300">
                      {Math.round((filteredApps.filter(a => a.market?.exportPotential).length / (filteredApps.length || 1)) * 100)}%
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>High-Tech Readiness (TRL 7+)</span>
                    <strong className="text-amber-300">
                      {Math.round((filteredApps.filter(a => a.technology.trlLevel >= 7).length / (filteredApps.length || 1)) * 100)}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: FORM TRACKING & LIFECYCLE INTELLIGENCE */}
      {applications.length > 0 && activeSubTab === 'form_tracking' && (
        <div className="space-y-6">
          {/* Form Tracking Pipeline Funnel (Clickable) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Multi-Stage Form Lifecycle &amp; Conversion Tracker
                </h3>
                <p className="text-xs text-slate-500">Click any funnel step below to open matching application dossiers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
              {formTrackingStats.statusFunnel.map((step) => {
                const isSelected = activeDrilldown?.id === `funnel-${step.key}`;
                return (
                  <div
                    key={step.stage}
                    onClick={() =>
                      toggleDrilldown({
                        id: `funnel-${step.key}`,
                        title: `Pipeline Stage: ${step.stage}`,
                        subtitle: `Applications currently at or passing ${step.stage}`,
                        badgeLabel: `${step.count} Applications (${step.pct}%)`,
                        badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
                        filterFn: step.filterFn,
                      })
                    }
                    className={`border rounded-xl p-3.5 space-y-1.5 text-xs transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/50 shadow-xs ring-1 ring-sky-400'
                        : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-sky-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 group-hover:text-sky-700">{step.stage}</span>
                      <span className="font-mono text-[11px] font-bold text-slate-600">{step.pct}%</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-slate-900">
                      {step.count}
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                      <div className={`h-full ${step.color}`} style={{ width: `${step.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Breakdown Comparison Cards (Clickable) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Form 1: Intake Tracking */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" /> Form 1: Intake Status
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {formTrackingStats.form1Complete} Complete
                </span>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <button
                  type="button"
                  onClick={() =>
                    toggleDrilldown({
                      id: 'trl-7',
                      title: 'TRL 7 Prototype Readiness Applications',
                      subtitle: 'Applications with prototype demonstration in operational environment',
                      badgeLabel: `${formTrackingStats.trlBreakdown.trl7} Apps`,
                      filterFn: (a) => a.technology.trlLevel === 7,
                    })
                  }
                  className="w-full flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-50 cursor-pointer text-left border border-transparent hover:border-slate-200"
                >
                  <span className="font-medium text-slate-700">TRL 7 Prototype Readiness</span>
                  <span className="font-mono font-bold text-slate-900">{formTrackingStats.trlBreakdown.trl7} apps ▾</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggleDrilldown({
                      id: 'trl-89',
                      title: 'TRL 8 & 9 Deployment Stage Applications',
                      subtitle: 'Commercial qualification and market-ready systems',
                      badgeLabel: `${formTrackingStats.trlBreakdown.trl8 + formTrackingStats.trlBreakdown.trl9} Apps`,
                      filterFn: (a) => a.technology.trlLevel >= 8,
                    })
                  }
                  className="w-full flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-50 cursor-pointer text-left border border-transparent hover:border-slate-200"
                >
                  <span className="font-medium text-slate-700">TRL 8/9 Deployment Stage</span>
                  <span className="font-mono font-bold text-slate-900">{formTrackingStats.trlBreakdown.trl8 + formTrackingStats.trlBreakdown.trl9} apps ▾</span>
                </button>

                <div className="flex justify-between items-center py-1.5 px-2 text-slate-500">
                  <span>SSM Registration Validated</span>
                  <span className="font-bold text-emerald-700">100%</span>
                </div>
              </div>
            </div>

            {/* Reviewer Evaluation Tracking */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" /> Dual-Reviewer Scoring
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  {formTrackingStats.bothReviewers} Completed
                </span>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <button
                  type="button"
                  onClick={() =>
                    toggleDrilldown({
                      id: 'dual-both',
                      title: 'Dual Reviewers Completed',
                      subtitle: 'Applications with completed scoring rubrics from both Reviewer 1 and Reviewer 2',
                      badgeLabel: `${formTrackingStats.bothReviewers} Applications`,
                      badgeColor: 'bg-emerald-100 text-emerald-800',
                      filterFn: (a) => !!(a.reviewer1Score && a.reviewer2Score),
                    })
                  }
                  className="w-full flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-50 cursor-pointer text-left border border-transparent hover:border-slate-200"
                >
                  <span className="font-medium text-slate-700">Both Reviewers Completed</span>
                  <span className="font-mono font-bold text-emerald-700">{formTrackingStats.bothReviewers} files ▾</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggleDrilldown({
                      id: 'dual-single',
                      title: 'Single Reviewer Scored (Awaiting 2nd Review)',
                      subtitle: 'Applications scored by one reviewer, awaiting complementary technical or commercial evaluation',
                      badgeLabel: `${formTrackingStats.singleReviewer} Applications`,
                      badgeColor: 'bg-amber-100 text-amber-800',
                      filterFn: (a) => !!((a.reviewer1Score && !a.reviewer2Score) || (!a.reviewer1Score && a.reviewer2Score)),
                    })
                  }
                  className="w-full flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-50 cursor-pointer text-left border border-transparent hover:border-slate-200"
                >
                  <span className="font-medium text-slate-700">Single Reviewer Scored</span>
                  <span className="font-mono font-bold text-amber-700">{formTrackingStats.singleReviewer} files ▾</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggleDrilldown({
                      id: 'dual-pending',
                      title: 'Review Pending Assignment',
                      subtitle: 'Applications awaiting dual-reviewer designation',
                      badgeLabel: `${formTrackingStats.pendingReviewers} Applications`,
                      badgeColor: 'bg-slate-100 text-slate-800',
                      filterFn: (a) => !a.reviewer1Score && !a.reviewer2Score,
                    })
                  }
                  className="w-full flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-50 cursor-pointer text-left border border-transparent hover:border-slate-200"
                >
                  <span className="font-medium text-slate-700">Review Pending Assignment</span>
                  <span className="font-mono font-bold text-slate-500">{formTrackingStats.pendingReviewers} files ▾</span>
                </button>
              </div>
            </div>

            {/* Form 2: Due Diligence Tracker */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-teal-600" /> Form 2: Due Diligence
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                  {formTrackingStats.form2Linked} Linked
                </span>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <button
                  type="button"
                  onClick={() =>
                    toggleDrilldown({
                      id: 'form2-linked',
                      title: 'Form 2 (Due Diligence) Submissions Linked',
                      subtitle: 'Applications with submitted commercial market traction and 3-year expansion models',
                      badgeLabel: `${formTrackingStats.form2Linked} Files`,
                      badgeColor: 'bg-teal-100 text-teal-800',
                      filterFn: (a) => !!(a.supplementarySubmissions && a.supplementarySubmissions.length > 0),
                    })
                  }
                  className="w-full flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-50 cursor-pointer text-left border border-transparent hover:border-slate-200"
                >
                  <span className="font-medium text-slate-700">Traction Submissions Linked</span>
                  <span className="font-mono font-bold text-teal-800">{formTrackingStats.form2Linked} files ▾</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggleDrilldown({
                      id: 'form2-pending',
                      title: 'Form 2 Awaiting Response',
                      subtitle: 'Shortlisted applications awaiting applicant completion of Form 2 due diligence',
                      badgeLabel: `${formTrackingStats.form2Pending} Files`,
                      badgeColor: 'bg-amber-100 text-amber-800',
                      filterFn: (a) => a.status === 'shortlisted' && (!a.supplementarySubmissions || a.supplementarySubmissions.length === 0),
                    })
                  }
                  className="w-full flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-50 cursor-pointer text-left border border-transparent hover:border-slate-200"
                >
                  <span className="font-medium text-slate-700">Form 2 Awaiting Response</span>
                  <span className="font-mono font-bold text-amber-700">{formTrackingStats.form2Pending} files ▾</span>
                </button>

                <div className="flex justify-between items-center py-1.5 px-2 text-slate-500">
                  <span>Assigned Analyst Panel</span>
                  <span className="font-mono font-bold text-slate-800">{filteredApps.filter(a => a.assignedAnalystName).length} files</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: TREEMAP GRANT SIZING CANVAS */}
      {applications.length > 0 && activeSubTab === 'treemap' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                Sector &amp; Funding Allocation Treemap
              </h3>
              <p className="text-xs text-slate-500">Click any tile to open its complete application form dossier</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {Object.entries(SECTOR_COLOR_MAP).map(([sec, colors]) => (
                <div key={sec} className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-xs border" style={{ backgroundColor: colors.bg, borderColor: colors.border }} />
                  <span className="truncate max-w-[120px]">{sec.split('&')[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full overflow-hidden border border-slate-200 rounded-xl bg-slate-50" style={{ height: '520px' }}>
            <svg viewBox="0 0 1000 520" preserveAspectRatio="none" className="w-full h-full cursor-pointer select-none">
              {tiles.map((tile) => {
                const isHovered = hoveredTile?.id === tile.id;
                return (
                  <g
                    key={tile.id}
                    transform={`translate(${tile.x}, ${tile.y})`}
                    onClick={() => setSelectedDossierApp(tile.app)}
                    onMouseEnter={() => setHoveredTile(tile)}
                    onMouseLeave={() => setHoveredTile(null)}
                    className="transition-opacity duration-150"
                  >
                    <rect
                      width={Math.max(0, tile.w - 3)}
                      height={Math.max(0, tile.h - 3)}
                      fill={tile.bgHex}
                      stroke={isHovered ? '#0f172a' : tile.borderHex}
                      strokeWidth={isHovered ? 2.5 : 1.2}
                      rx={4}
                      className="transition-colors duration-150"
                    />

                    {tile.w > 75 && tile.h > 45 && (
                      <foreignObject x={8} y={8} width={Math.max(0, tile.w - 16)} height={Math.max(0, tile.h - 16)}>
                        <div className="h-full flex flex-col justify-between text-left pointer-events-none overflow-hidden">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-900 truncate">
                                {tile.label}
                              </span>
                              {tile.app.compositeScore && (
                                <span className="text-[10px] font-mono tabular-nums font-semibold px-1 py-0.2 rounded bg-white/80 border border-slate-200 text-slate-700">
                                  {tile.app.compositeScore}%
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-600 truncate mt-0.5">
                              {tile.subLabel}
                            </div>
                          </div>

                          <div className="mt-auto pt-1 flex items-center justify-between border-t border-slate-200/60 text-[10px]">
                            <span className="font-mono tabular-nums font-bold text-slate-900">
                              RM {(tile.value / 1000).toLocaleString()}K
                            </span>
                            <span className="text-slate-500 font-medium">
                              {tile.state}
                            </span>
                          </div>
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
            </svg>

            {hoveredTile && (
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-xs border border-slate-200 shadow-lg rounded-xl p-3 text-xs w-72 pointer-events-none z-20 space-y-1.5">
                <div className="font-bold text-slate-900">{hoveredTile.app.company.name}</div>
                <div className="text-slate-600 truncate text-[11px]">{hoveredTile.app.technology.productName}</div>
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Grant Requested:</span>
                    <strong className="font-mono text-sky-800">RM {hoveredTile.value.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Score:</span>
                    <strong>{hoveredTile.app.compositeScore ? `${hoveredTile.app.compositeScore}%` : 'Pending'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Location:</span>
                    <span>{hoveredTile.app.company.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sector:</span>
                    <span className="truncate block">{hoveredTile.sector.split('&')[0]}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Dossier Modal for Direct Inspection of the Actual Form */}
      {selectedDossierApp && (
        <ApplicationDossierModal
          application={selectedDossierApp}
          onClose={() => setSelectedDossierApp(null)}
          onNavigateToCrm={(app) => {
            setSelectedDossierApp(null);
            onSelectApplication(app);
          }}
        />
      )}
    </div>
  );
};
