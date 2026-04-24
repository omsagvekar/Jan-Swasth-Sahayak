import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './Login';
import DashboardLayout from './components/DashboardLayout';
import StateWarRoom from './components/StateWarRoom';
import CompareStates from './components/CompareStates';
import PolicySimulator from './components/PolicySimulator';
import { fetchStateBudgetData } from './services/dataService';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import type { StateBudgetData } from './types';

class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown dashboard rendering error';
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(err: unknown) {
    console.error('Dashboard render error:', err);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-600 bg-slate-900/95 p-6 shadow-lg shadow-red-900/20">
          <h2 className="text-lg font-semibold text-red-300">Dashboard failed to load</h2>
          <p className="mt-2 text-sm text-slate-400">
            There was an error while rendering the dashboard. Please check your console for more details.
          </p>
          {this.state.errorMessage && (
            <pre className="mt-4 overflow-auto rounded-2xl border border-red-700 bg-slate-950 p-4 text-xs text-red-200">
              {this.state.errorMessage}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

const DashboardPage: React.FC = () => {
  const [budgetData, setBudgetData] = useState<StateBudgetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const bd = await fetchStateBudgetData();
        if (!cancelled) {
          setBudgetData(bd);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Dashboard</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">National Allocation Overview</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-400">
            Premium state budget insights and funding triggers for the national health mission.
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-700 bg-slate-800/95 p-6 shadow-lg shadow-slate-950/20">
        <DashboardErrorBoundary>
          <Dashboard budgetData={budgetData} isLoading={isLoading} error={loadError} />
        </DashboardErrorBoundary>
      </div>
    </div>
  );
};

const AdminUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onPickFile = (picked: File | null) => {
    if (!picked) return;
    const nameLower = picked.name.toLowerCase();
    if (!nameLower.endsWith('.csv')) {
      setStatus('Please upload a .csv file.');
      setFile(null);
      return;
    }
    setFile(picked);
    setStatus(`Selected: ${picked.name}`);
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setStatus(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (!file) {
        setStatus('Please upload enhanced_healthcare_dataset.csv first.');
        return;
      }
      setStatus('File queued for processing. (UI placeholder)');
    } finally {
      setIsProcessing(false);
    }
  };

  const dropZoneClasses = useMemo(() => {
    const base =
      'w-full p-8 border-2 border-dashed rounded-3xl transition-colors flex flex-col items-center justify-center text-center';
    if (isDragging) return `${base} border-cyan-400 bg-cyan-950/10`;
    return `${base} border-slate-700 bg-slate-950/70 hover:border-slate-500`;
  }, [isDragging]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Data Management</p>
          <h2 className="text-3xl font-semibold text-white">Admin file upload</h2>
          <p className="max-w-2xl text-sm text-slate-400">
            Upload your enhanced healthcare dataset here to keep allocation inputs aligned with the latest policy model.
          </p>
        </div>

        <div
          className="mt-8"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const picked = event.dataTransfer.files?.item(0) || null;
            onPickFile(picked);
          }}
        >
          <div className={dropZoneClasses}>
            <div className="text-cyan-300 font-semibold">Drag & drop CSV here</div>
            <div className="text-sm text-slate-400 mt-2">or choose a file from your device</div>

            <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => onPickFile(event.target.files?.item(0) || null)}
              />
              Browse CSV
            </label>

            {file && <div className="mt-3 text-sm text-slate-200">Selected: {file.name}</div>}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">{status ?? 'Upload the enhanced dataset to continue.'}</div>
          <button
            type="button"
            onClick={handleProcess}
            disabled={isProcessing}
            className="inline-flex items-center justify-center rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Start Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="compare" element={<CompareStates />} />
              <Route path="simulator" element={<PolicySimulator />} />
              <Route path="state/:id" element={<StateWarRoom />} />
              <Route path="admin/upload" element={<ProtectedRoute allowedRoles={['admin']}><AdminUploadPage /></ProtectedRoute>} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
