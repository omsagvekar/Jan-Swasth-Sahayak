import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
// @ts-ignore - d3-geo types not available
import { geoCentroid } from 'd3-geo';
import { feature } from 'topojson-client';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
// @ts-ignore - react-simple-maps types not available
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  ComposableMap,
  Geographies,
  Geography,
  useMapContext,
  ZoomableGroup,
  // @ts-ignore
} from 'react-simple-maps';
import { Rnd } from 'react-rnd';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { type StateBudgetData } from '../types';
import {
  allocateFunds,
  AllocationRow,
  explainAllocation,
  fetchStateHealthInputs,
  type AllocateFundsResponse,
  type ExplainAllocationResponse,
  type StateHealthInput,
} from '../src/services/mlService';

/**
 * State-level features only: we load TopoJSON and pass `topology.objects.states` to `feature()`
 * (the same file also contains `districts`; the default react-simple-maps URL path used the first key alphabetically = districts).
 * Requested URL `substrational/india-map/.../india-states.json` was unavailable (404); this source is verified state-level with `st_nm`.
 */
const INDIA_STATES_TOPOJSON_URL =
  'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@ef25ebc/topojson/india.json';

interface DashboardProps {
  budgetData: StateBudgetData[];
  isLoading: boolean;
  error: string | null;
}

type PreparedGeo = {
  rsmKey: string;
  svgPath: string;
  geometry?: Geometry;
  properties?: Record<string, unknown>;
};

function getLabelFromGeo(geo: PreparedGeo): string {
  const p = geo.properties ?? {};
  const raw = (p.st_nm ?? p.ST_NM ?? p.NAME_1 ?? p.name ?? '') as string;
  return String(raw).trim();
}

const MapStateShape: React.FC<{
  geo: PreparedGeo;
  style: {
    default: React.CSSProperties;
    hover: React.CSSProperties;
    pressed: React.CSSProperties;
  };
  title: string;
  label: string;
  onSelect: (name: string) => void;
}> = ({ geo, style, title, label, onSelect }) => {
  const { projection } = useMapContext();
  let cx = 0;
  let cy = 0;
  try {
    const c = geoCentroid(geo as unknown as Feature);
    const proj = projection(c as [number, number]);
    cx = proj[0];
    cy = proj[1];
  } catch {
    /* skip label if centroid fails */
  }

  return (
    <g className="pointer-events-auto">
      <Geography
        geography={geo}
        style={style}
        title={title}
        onClick={(e: React.MouseEvent<SVGGElement>) => {
          e.preventDefault();
          e.stopPropagation();
          onSelect(label);
        }}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#94a3b8"
        fontSize={10}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label.length > 16 ? `${label.slice(0, 14)}…` : label}
      </text>
    </g>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ budgetData, isLoading, error }) => {
  const [totalNationalFund, setTotalNationalFund] = useState<number>(50000);
  const [allocationResult, setAllocationResult] = useState<AllocateFundsResponse | null>(null);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [healthInputs, setHealthInputs] = useState<StateHealthInput[]>([]);

  const [selectedExplainState, setSelectedExplainState] = useState<string>('');
  const [explainQuestion, setExplainQuestion] = useState<string>('Why did we give this much to this state?');
  const [explainResult, setExplainResult] = useState<ExplainAllocationResponse | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  // AI Chat State
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [selectedMapState, setSelectedMapState] = useState<string | null>(null);
  const [mapPanelEntered, setMapPanelEntered] = useState(false);
  const mapShellRef = useRef<HTMLDivElement>(null);
  const [rndDefault, setRndDefault] = useState({ x: 0, y: 0, width: 384, height: 600 });
  const [rndReady, setRndReady] = useState(false);

  const [statesCollection, setStatesCollection] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(INDIA_STATES_TOPOJSON_URL)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((topo: unknown) => {
        if (cancelled) return;
        const t = topo as { objects: { states: unknown } };
        const fc = feature(topo as never, t.objects.states as never) as unknown as FeatureCollection;
        setStatesCollection(fc);
      })
      .catch(() => setStatesCollection(null));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedMapState) setSelectedExplainState(selectedMapState);
  }, [selectedMapState]);

  useEffect(() => {
    if (!selectedMapState) {
      setMapPanelEntered(false);
      return;
    }
    setMapPanelEntered(false);
    const id = window.setTimeout(() => setMapPanelEntered(true), 30);
    return () => window.clearTimeout(id);
  }, [selectedMapState]);

  useLayoutEffect(() => {
    if (!selectedMapState || !mapShellRef.current) {
      setRndReady(false);
      return;
    }
    const el = mapShellRef.current;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const panelW = 384;
    setRndDefault({
      x: Math.max(8, w - panelW - 8),
      y: 8,
      width: panelW,
      height: Math.max(400, h - 16),
    });
    setRndReady(true);
  }, [selectedMapState]);

  const handleRunAllocation = async () => {
    setAllocationError(null);
    setExplainResult(null);
    setExplainError(null);
    setIsAllocating(true);

    try {
      const inputs = await fetchStateHealthInputs();
      setHealthInputs(inputs.states);

      const result = await allocateFunds({
        total_national_budget: totalNationalFund,
        states: inputs.states.map((state) => ({
          state: state.state,
          population: state.population,
          health_burden_score: state.health_burden_score,
          need_index: state.need_index,
          disease_prevalence_index: state.disease_prevalence_index,
          poverty_rate: state.poverty_rate,
          doctors_per_1000: state.doctors_per_1000,
        })),
      });

      setAllocationResult(result);
      if (result.allocations.length > 0) {
        setSelectedExplainState(result.allocations[0].state);
      }
    } catch (err) {
      setAllocationResult(null);
      setAllocationError(err instanceof Error ? err.message : 'Allocation request failed. Ensure FastAPI backend is running.');
    } finally {
      setIsAllocating(false);
    }
  };

  const handleExplainAllocation = async () => {
    if (!allocationResult) {
      setExplainError('Run AI allocation first.');
      return;
    }

    const targetState = allocationResult.allocations.find((a) => a.state === selectedExplainState);
    const targetStateInput = healthInputs.find((s) => s.state === selectedExplainState);

    if (!targetState || !targetStateInput) {
      setExplainError('Please select a valid state from allocation results.');
      return;
    }

    setExplainError(null);
    setExplainResult(null);
    setIsExplaining(true);

    try {
      const response = await explainAllocation({
        state: targetState.state,
        ml_allocated_budget_cr: targetState.allocated_budget_cr,
        health_burden_score: targetState.health_burden_score,
        need_index: targetStateInput.need_index,
        poverty_rate: targetStateInput.poverty_rate,
        doctors_per_1000: targetStateInput.doctors_per_1000,
        question: explainQuestion.trim() || 'Why this amount?',
      });
      setExplainResult(response);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'Failed to get explanation. Check Ollama server.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleAskAI = async (selectedStateData: AllocationRow | undefined) => {
    if (!selectedStateData) {
      setAiResponse('');
      return;
    }

    const targetStateInput = healthInputs.find((s) => s.state === selectedStateData.state);

    if (!targetStateInput) {
      setAiResponse('Error: Could not find health data for this state.');
      return;
    }

    if (!userQuestion.trim()) {
      setAiResponse('Please enter a question.');
      return;
    }

    setAiResponse('');
    setIsAiLoading(true);

    try {
      const payload = {
        state: selectedStateData.state,
        ml_allocated_budget_cr: selectedStateData.allocated_budget_cr,
        health_burden_score: selectedStateData.health_burden_score,
        need_index: targetStateInput.need_index,
        poverty_rate: targetStateInput.poverty_rate,
        doctors_per_1000: targetStateInput.doctors_per_1000,
        question: userQuestion.trim(),
      };

      const response = await fetch('http://localhost:8000/explain-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as ExplainAllocationResponse;
      setAiResponse(data.explanation);
    } catch (err) {
      setAiResponse(err instanceof Error ? err.message : 'Failed to get AI response. Ensure FastAPI backend is running.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const normalizeStateName = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ');

  const formatCr = (v: number) =>
    Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const allocationByState = useMemo(() => {
    const map = new Map<string, { status: string; predicted_need: number; allocated: number }>();
    if (!allocationResult) return map;

    for (const a of allocationResult.allocations) {
      map.set(normalizeStateName(a.state), {
        status: a.status,
        predicted_need: a.predicted_optimal_required_budget_cr,
        allocated: a.allocated_budget_cr,
      });
    }
    return map;
  }, [allocationResult]);

  const allocationData = useMemo(() => {
    if (!selectedMapState || !allocationResult) return undefined;
    return allocationResult.allocations.find(
      (a) => normalizeStateName(a.state) === normalizeStateName(selectedMapState),
    );
  }, [selectedMapState, allocationResult]);

  const healthData = useMemo(() => {
    if (!selectedMapState) return undefined;
    return healthInputs.find((s) => normalizeStateName(s.state) === normalizeStateName(selectedMapState));
  }, [selectedMapState, healthInputs]);

  /** Chart rows: keys match enhanced CSV field names for Recharts `dataKey`. */
  const historyData = useMemo(() => {
    if (!selectedMapState) return [];
    return budgetData
      .filter((b) => normalizeStateName(b.state) === normalizeStateName(selectedMapState))
      .sort((a, b) => a.year - b.year)
      .map((b) => ({
        year: b.year,
        Allocated_Budget_Cr: b.allocatedBudgetCr,
        Utilized_Budget_Cr: b.utilizedBudgetCr,
      }));
  }, [budgetData, selectedMapState]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
        Loading dashboard data…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border border-red-800/60 bg-red-950/40 p-6 text-center text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="national-fund" className="mb-1 block text-sm font-medium text-slate-400">
              Total National Health Budget (Cr)
            </label>
            <input
              id="national-fund"
              type="number"
              min={1}
              step={100}
              value={totalNationalFund}
              onChange={(e) => setTotalNationalFund(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            />
          </div>
          <button
            type="button"
            onClick={handleRunAllocation}
            disabled={isAllocating || totalNationalFund <= 0}
            className="shrink-0 rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white shadow transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAllocating ? 'Running AI Allocation…' : 'Run AI Allocation'}
          </button>
        </div>

        {allocationResult && (
          <div className="flex flex-wrap items-stretch justify-end gap-4 border-t border-slate-800 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="min-w-[120px]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Treasury budget (Cr)</p>
              <p className="text-lg font-semibold text-white">₹{allocationResult.total_national_budget.toLocaleString()}</p>
            </div>
            <div className="min-w-[120px]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Predicted National Need (Cr)</p>
              <p className="text-lg font-semibold text-white">₹{allocationResult.total_predicted_national_need_cr.toLocaleString()}</p>
            </div>
            <div className="min-w-[120px]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">National reserve fund (Cr)</p>
              <p
                className={`text-lg font-semibold ${
                  allocationResult.national_reserve_fund > 0 ? 'text-emerald-400' : 'text-slate-200'
                }`}
              >
                ₹{allocationResult.national_reserve_fund.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {allocationError && (
        <div className="rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{allocationError}</div>
      )}

      {!allocationResult ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 px-8 py-16 text-center shadow-inner">
          <div className="max-w-md space-y-3">
            <h2 className="text-lg font-semibold text-slate-200">Allocation map &amp; ledger</h2>
            <p className="text-sm leading-relaxed text-slate-400">
              Run AI Allocation to generate the map and ledger.
            </p>
            <p className="text-xs text-slate-500">
              Set the national fund above, then use <span className="font-medium text-emerald-400/90">Run AI Allocation</span> to load state-level
              funding and open the master-detail view.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="col-span-1 flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl h-[80vh]">
            <div className="sticky top-0 z-10 shrink-0 border-b border-slate-800 bg-slate-950 p-4">
              <h2 className="text-sm font-semibold tracking-wide text-slate-200">Allocation Ledger</h2>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {allocationResult.allocations.map((row) => (
                <button
                  key={row.state}
                  type="button"
                  onClick={() => {
                    setSelectedMapState(row.state);
                    setSelectedExplainState(row.state);
                  }}
                  className="w-full cursor-pointer rounded-lg border border-slate-800 bg-slate-800/50 p-3 text-left transition-colors hover:bg-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-white">{row.state}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        row.status === 'Fully Funded'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col gap-0.5 text-[11px] text-slate-400 sm:flex-row sm:justify-between sm:gap-2">
                    <span>Allocated: ₹{formatCr(row.allocated_budget_cr)} Cr</span>
                    <span>Need: ₹{formatCr(row.predicted_optimal_required_budget_cr)} Cr</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div
            ref={mapShellRef}
            className="relative col-span-1 flex h-[80vh] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl lg:col-span-3"
          >
        <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-300 backdrop-blur-md">
          <div className="mb-1 font-semibold uppercase tracking-wide text-slate-400">Legend</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#10b981]" /> Fully funded
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#ef4444]" /> Deficit
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#1e293b] border border-slate-600" /> No data
            </span>
          </div>
        </div>

        <div className="absolute bottom-3 left-4 z-10 text-xs text-slate-500">Scroll to zoom · Drag to pan</div>

        <div className="relative min-h-0 flex-1 [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:max-w-full">
          {!statesCollection ? (
            <div className="flex h-full items-center justify-center text-slate-500">Loading map…</div>
          ) : (
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 1050, center: [80, 22] }}
              className="h-full w-full text-slate-200"
            >
              <ZoomableGroup center={[80, 22]} zoom={1.1} minZoom={0.45} maxZoom={12}>
                <Geographies geography={statesCollection}>
                  {({ geographies }: { geographies: PreparedGeo[] }) =>
                    geographies.map((geo) => {
                      const label = getLabelFromGeo(geo);
                      if (!label) return null;

                      const alloc = allocationByState.get(normalizeStateName(label));
                      const title = alloc
                        ? `${label} | ₹${formatCr(alloc.allocated)} Cr | ${alloc.status}`
                        : `${label} — tap for details`;

                      const base = {
                        default: {
                          fill: '#1e293b',
                          stroke: '#334155',
                          strokeWidth: 0.6,
                          outline: 'none' as const,
                          cursor: 'pointer' as const,
                        },
                        hover: {
                          fill: '#334155',
                          stroke: '#475569',
                          strokeWidth: 0.8,
                          outline: 'none' as const,
                          cursor: 'pointer' as const,
                        },
                        pressed: { outline: 'none' as const, cursor: 'pointer' as const },
                      };
                      const funded = {
                        default: {
                          fill: '#10b981',
                          stroke: '#059669',
                          strokeWidth: 0.8,
                          outline: 'none' as const,
                          cursor: 'pointer' as const,
                        },
                        hover: {
                          fill: '#34d399',
                          stroke: '#10b981',
                          strokeWidth: 1,
                          outline: 'none' as const,
                          cursor: 'pointer' as const,
                        },
                        pressed: { outline: 'none' as const, cursor: 'pointer' as const },
                      };
                      const deficit = {
                        default: {
                          fill: '#ef4444',
                          stroke: '#dc2626',
                          strokeWidth: 0.8,
                          outline: 'none' as const,
                          cursor: 'pointer' as const,
                        },
                        hover: {
                          fill: '#f87171',
                          stroke: '#ef4444',
                          strokeWidth: 1,
                          outline: 'none' as const,
                          cursor: 'pointer' as const,
                        },
                        pressed: { outline: 'none' as const, cursor: 'pointer' as const },
                      };

                      const geoStyle = !alloc ? base : alloc.status === 'Fully Funded' ? funded : deficit;

                      return (
                        <MapStateShape
                          key={geo.rsmKey}
                          geo={geo}
                          style={geoStyle}
                          title={title}
                          label={label}
                          onSelect={(name) => {
                            setSelectedMapState(name);
                            setSelectedExplainState(name);
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          )}
        </div>

        {selectedMapState && rndReady && (
          <Rnd
            key={`${selectedMapState}-${rndDefault.x}-${rndDefault.height}`}
            default={rndDefault}
            minWidth={320}
            minHeight={400}
            maxWidth={920}
            maxHeight={typeof window !== 'undefined' ? window.innerHeight - 24 : 900}
            bounds="parent"
            dragHandleClassName="drag-header"
            enableResizing={{
              top: true,
              right: true,
              bottom: true,
              left: true,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: true,
            }}
            className={`z-50 ${mapPanelEntered ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <div
              className={`flex h-full w-full max-h-full flex-col overflow-hidden border-l border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-xl transition-transform duration-500 ease-out ${
                mapPanelEntered ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="drag-header flex flex-shrink-0 cursor-move items-center justify-between border-b border-slate-700 bg-slate-800/95 px-4 py-3">
                <h2 className="text-lg font-bold text-white">{selectedMapState}</h2>
                <button
                  type="button"
                  onClick={() => setSelectedMapState(null)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-slate-700/80 bg-slate-800/40 px-1 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Allocated</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {allocationData ? `₹${formatCr(allocationData.allocated_budget_cr)} Cr` : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-700/80 bg-slate-800/40 px-1 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Need index</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {healthData != null ? healthData.need_index.toFixed(2) : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-700/80 bg-slate-800/40 px-1 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
                    <div className="mt-1 flex justify-center">
                      {allocationData ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            allocationData.status === 'Fully Funded'
                              ? 'bg-emerald-500/25 text-emerald-300'
                              : 'bg-red-500/25 text-red-300'
                          }`}
                        >
                          {allocationData.status}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Run allocation</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Budget vs. utilization (enhanced dataset, Cr)
                  </p>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={historyData} margin={{ top: 28, right: 8, left: 4, bottom: 4 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                          dataKey="year"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickLine={{ stroke: '#475569' }}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickLine={{ stroke: '#475569' }}
                          tickFormatter={(v) => (typeof v === 'number' ? v.toLocaleString() : String(v))}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          labelStyle={{ color: '#e2e8f0' }}
                          labelFormatter={((y: any) => `Year ${y}`) as any}
                          formatter={((value: any) => {
                            if (value === undefined || value === null) return '';
                            const n = typeof value === 'number' ? value : Number(value);
                            if (!Number.isFinite(n)) return String(value);
                            return `\u20b9${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} Cr`;
                          }) as any}
                        />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}
                        />
                        <Bar
                          dataKey="Allocated_Budget_Cr"
                          name="Allocated (Cr)"
                          fill="#3b82f6"
                          radius={[3, 3, 0, 0]}
                          maxBarSize={28}
                        />
                        <Bar
                          dataKey="Utilized_Budget_Cr"
                          name="Utilized (Cr)"
                          fill="#10b981"
                          radius={[3, 3, 0, 0]}
                          maxBarSize={28}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  {historyData.length === 0 && (
                    <p className="text-center text-xs text-slate-500">No historical rows for this state in the dataset.</p>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 space-y-2 border-t border-slate-700 bg-slate-950/90 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ask the AI</p>
                <textarea
                  value={explainQuestion}
                  onChange={(e) => setExplainQuestion(e.target.value)}
                  rows={2}
                  placeholder="Why did we give this much to this state?"
                  className="w-full rounded-md border border-slate-600 bg-slate-900/80 px-2 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                />
                <button
                  type="button"
                  onClick={handleExplainAllocation}
                  disabled={isExplaining || !allocationResult || !allocationData || !healthData}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isExplaining ? 'Generating…' : 'Ask AI'}
                </button>
                {explainError && <p className="text-xs text-red-400">{explainError}</p>}
                {explainResult && (
                  <div className="max-h-40 overflow-y-auto rounded-md border border-slate-600 bg-slate-900/90 p-2 text-xs leading-relaxed text-slate-300">
                    {explainResult.explanation}
                  </div>
                )}
              </div>
            </div>
          </Rnd>
        )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
