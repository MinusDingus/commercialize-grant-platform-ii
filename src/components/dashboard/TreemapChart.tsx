import React, { useState, useMemo } from 'react';
import { GrantApplication, IndustrySector } from '../../types/grant';
import { Layers, MapPin, Building2, TrendingUp, Info } from 'lucide-react';

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
  colorClass: string;
  bgHex: string;
  borderHex: string;
}

const SECTOR_COLOR_MAP: Record<IndustrySector, { bg: string; border: string; badge: string; text: string }> = {
  'AgriTech & Food Security': {
    bg: '#ecfdf5',
    border: '#10b981',
    badge: '#059669',
    text: '#064e3b',
  },
  'Deep Tech & AI': {
    bg: '#eef2ff',
    border: '#6366f1',
    badge: '#4f46e5',
    text: '#312e81',
  },
  'Clean Energy & Mobility': {
    bg: '#f0fdfa',
    border: '#14b8a6',
    badge: '#0d9488',
    text: '#134e4a',
  },
  'Digital Health & Biotech': {
    bg: '#fff1f2',
    border: '#f43f5e',
    badge: '#e11d48',
    text: '#881337',
  },
  'Smart Manufacturing & IoT': {
    bg: '#fffbeb',
    border: '#f59e0b',
    badge: '#d97706',
    text: '#78350f',
  },
  'Creative Multimedia & FinTech': {
    bg: '#f0f9ff',
    border: '#0284c7',
    badge: '#0369a1',
    text: '#0c4a6e',
  },
};

export const TreemapChart: React.FC<TreemapProps> = ({
  applications,
  onSelectApplication,
}) => {
  const [hoveredTile, setHoveredTile] = useState<TileItem | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedTurnoverTier, setSelectedTurnoverTier] = useState<string>('all');

  // Filter applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSector = selectedSector === 'all' || app.company.sector === selectedSector;
      const matchTurnover = selectedTurnoverTier === 'all' || app.company.turnoverTier === selectedTurnoverTier;
      return matchSector && matchTurnover;
    });
  }, [applications, selectedSector, selectedTurnoverTier]);

  // Aggregate metrics
  const totalFunding = useMemo(() => {
    return filteredApps.reduce((acc, curr) => acc + curr.market.fundingRequested, 0);
  }, [filteredApps]);

  const avgTRL = useMemo(() => {
    if (filteredApps.length === 0) return 0;
    const sum = filteredApps.reduce((acc, curr) => acc + curr.technology.trlLevel, 0);
    return (sum / filteredApps.length).toFixed(1);
  }, [filteredApps]);

  // Calculate Treemap layout (squarified partition)
  const tiles: TileItem[] = useMemo(() => {
    if (filteredApps.length === 0 || totalFunding === 0) return [];

    // Group by sector
    const sectors = Array.from(new Set(filteredApps.map((a) => a.company.sector)));
    const width = 1000;
    const height = 520;

    // Calculate total funding per sector
    const sectorTotals = sectors.map((sec) => {
      const apps = filteredApps.filter((a) => a.company.sector === sec);
      const total = apps.reduce((sum, a) => sum + a.market.fundingRequested, 0);
      return { sector: sec, apps, total };
    }).sort((a, b) => b.total - a.total);

    // Slice horizontal/vertical columns proportional to sector total
    let currentX = 0;
    const computedTiles: TileItem[] = [];

    sectorTotals.forEach((secGroup) => {
      const secWeight = secGroup.total / totalFunding;
      const secWidth = Math.max(120, width * secWeight);

      // Now layout apps vertically inside this sector column
      let currentY = 0;
      const secApps = [...secGroup.apps].sort((a, b) => b.market.fundingRequested - a.market.fundingRequested);

      secApps.forEach((app, idx) => {
        const appWeight = app.market.fundingRequested / secGroup.total;
        const appHeight = idx === secApps.length - 1
          ? height - currentY // fill remainder
          : Math.max(70, height * appWeight);

        const colors = SECTOR_COLOR_MAP[app.company.sector] || SECTOR_COLOR_MAP['Deep Tech & AI'];

        computedTiles.push({
          id: app.id,
          app,
          label: app.company.name,
          subLabel: app.technology.productName,
          value: app.market.fundingRequested,
          sector: app.company.sector,
          state: app.company.state,
          x: currentX,
          y: currentY,
          w: secWidth,
          h: Math.min(appHeight, height - currentY),
          colorClass: '',
          bgHex: colors.bg,
          borderHex: colors.border,
        });

        currentY += appHeight;
      });

      currentX += secWidth;
    });

    return computedTiles;
  }, [filteredApps, totalFunding]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Funding Requested</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            RM {(totalFunding / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-slate-500 mt-1">Across {filteredApps.length} active applications</div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Average Readiness</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            TRL {avgTRL}
          </div>
          <div className="text-xs text-slate-500 mt-1">Target range: TRL 6 – 9</div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Shortlisted / In Diligence</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {filteredApps.filter((a) => a.status === 'shortlisted' || a.status === 'analyst_due_diligence' || a.status === 'awarded').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Surpassed baseline review</div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Geographic Footprint</span>
            <MapPin className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {new Set(filteredApps.map((a) => a.company.state)).size} States
          </div>
          <div className="text-xs text-slate-500 mt-1">Peninsular & East Malaysia</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Industry Sector:</span>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-3 py-1.5 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Sectors ({applications.length})</option>
            <option value="AgriTech & Food Security">AgriTech & Food Security</option>
            <option value="Deep Tech & AI">Deep Tech & AI</option>
            <option value="Clean Energy & Mobility">Clean Energy & Mobility</option>
            <option value="Digital Health & Biotech">Digital Health & Biotech</option>
            <option value="Smart Manufacturing & IoT">Smart Manufacturing & IoT</option>
            <option value="Creative Multimedia & FinTech">Creative Multimedia & FinTech</option>
          </select>

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-2">Turnover Tier:</span>
          <select
            value={selectedTurnoverTier}
            onChange={(e) => setSelectedTurnoverTier(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-3 py-1.5 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Turnover Tiers</option>
            <option value="< RM500K">&lt; RM 500K (Early Stage)</option>
            <option value="RM500K - RM2M">RM 500K - RM 2M (Scaling)</option>
            <option value="RM2M - RM5M">RM 2M - RM 5M (Growth)</option>
            <option value="> RM5M">&gt; RM 5M (Mature SME)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span>Tile area is proportional to Requested Grant Amount</span>
        </div>
      </div>

      {/* Main Treemap Canvas */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Application Distribution Treemap</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any tile to inspect company profile, TRL readiness, reviewer scorecard, and due diligence status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {Object.entries(SECTOR_COLOR_MAP).map(([sec, colors]) => (
              <div key={sec} className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-sm border" style={{ backgroundColor: colors.bg, borderColor: colors.border }} />
                <span className="truncate max-w-[130px]">{sec.split('&')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Treemap SVG Canvas */}
        <div className="relative w-full overflow-hidden border border-slate-200 rounded-md bg-slate-50" style={{ height: '520px' }}>
          {tiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
              <p>No applications match current filter criteria.</p>
            </div>
          ) : (
            <svg
              viewBox="0 0 1000 520"
              preserveAspectRatio="none"
              className="w-full h-full cursor-pointer select-none"
            >
              {tiles.map((tile) => {
                const isHovered = hoveredTile?.id === tile.id;
                return (
                  <g
                    key={tile.id}
                    transform={`translate(${tile.x}, ${tile.y})`}
                    onClick={() => onSelectApplication(tile.app)}
                    onMouseEnter={() => setHoveredTile(tile)}
                    onMouseLeave={() => setHoveredTile(null)}
                    className="transition-opacity duration-150"
                  >
                    {/* Background rectangle */}
                    <rect
                      width={Math.max(0, tile.w - 3)}
                      height={Math.max(0, tile.h - 3)}
                      fill={tile.bgHex}
                      stroke={isHovered ? '#0f172a' : tile.borderHex}
                      strokeWidth={isHovered ? 2.5 : 1.2}
                      rx={4}
                      className="transition-colors duration-150"
                    />

                    {/* Top Content (Company & Sector) */}
                    {tile.w > 80 && tile.h > 45 && (
                      <foreignObject
                        x={8}
                        y={8}
                        width={Math.max(0, tile.w - 19)}
                        height={Math.max(0, tile.h - 16)}
                      >
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
                              {tile.state} · TRL {tile.app.technology.trlLevel}
                            </span>
                          </div>
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* Floating Hover Details Card */}
          {hoveredTile && (
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-lg p-3 text-xs w-72 pointer-events-none z-20">
              <div className="font-bold text-slate-900">{hoveredTile.app.company.name}</div>
              <div className="text-slate-600 truncate mt-0.5">{hoveredTile.app.technology.productName}</div>
              <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Requested Grant:</span>
                  <span className="font-mono tabular-nums font-bold text-sky-700">
                    RM {hoveredTile.value.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Readiness:</span>
                  <span className="font-semibold text-slate-800">TRL {hoveredTile.app.technology.trlLevel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Annual Turnover:</span>
                  <span className="font-mono tabular-nums text-slate-800">
                    RM {hoveredTile.app.company.annualTurnover.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Location:</span>
                  <span className="text-slate-800">{hoveredTile.app.company.state}</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">
                Status: <span className="capitalize font-semibold text-slate-700">{hoveredTile.app.status.replace('_', ' ')}</span>
                {hoveredTile.app.compositeScore && (
                  <span> · Composite Score: <strong>{hoveredTile.app.compositeScore}%</strong></span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
