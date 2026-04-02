import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './Login';
import { fetchStateBudgetData } from './services/dataService';
import type { StateBudgetData } from './types';

const AUTH_KEY = 'nhfa_auth_role';

type Role = 'admin' | 'minister';

const getAuthRole = (): Role | null => {
  try {
    const role = localStorage.getItem(AUTH_KEY) as Role | null;
    return role === 'admin' || role === 'minister' ? role : null;
  } catch {
    return null;
  }
};

const TopNav: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const navigate = useNavigate();
  const handleLogoClick = () => navigate(getAuthRole() === 'admin' ? '/admin/upload' : '/dashboard');

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button type="button" onClick={handleLogoClick} className="flex items-center space-x-3 focus:outline-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <title>Jan Swasthya Sahayak Logo</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9M12 12.75h.008v.008H12v-.008z" />
            </svg>
            <h1 className="text-xl font-bold text-slate-700">Jan Swasthya Sahayak</h1>
          </button>

          <div className="flex items-center space-x-4">
            <p className="text-sm text-slate-500 hidden md:block">National Health Decision Support Platform</p>
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const RequireRole: React.FC<{ allowedRoles: Role[]; children: React.ReactNode }> = ({ allowedRoles, children }) => {
  const role = getAuthRole();
  if (!role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

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
    // Keep details in console for debugging.
    console.error('Dashboard render error:', err);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="max-w-3xl mx-auto bg-white border border-red-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-red-800">Dashboard failed to load</h2>
          <p className="text-sm text-slate-600 mt-2">
            There was an error while rendering the dashboard. Please check your console for more details.
          </p>
          {this.state.errorMessage && (
            <pre className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 overflow-auto">
              {this.state.errorMessage}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

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
        if (cancelled) return;
        setBudgetData(bd);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <TopNav onLogout={logout} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <DashboardErrorBoundary>
          <Dashboard budgetData={budgetData} isLoading={isLoading} error={loadError} />
        </DashboardErrorBoundary>
      </main>
    </div>
  );
};

const AdminUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
    navigate('/login', { replace: true });
  }, [navigate]);

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
      // UI-only placeholder for now (no backend call yet).
      await new Promise((r) => setTimeout(r, 600));
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
      'w-full p-8 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center justify-center text-center';
    if (isDragging) return `${base} border-blue-400 bg-blue-50`;
    return `${base} border-slate-300 bg-white hover:border-slate-400`;
  }, [isDragging]);

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans">
      <TopNav onLogout={logout} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800">Admin Data Pipeline</h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload a new <span className="font-medium">enhanced_healthcare_dataset.csv</span> to refresh the enhanced
            allocation inputs.
          </p>

          <div
            className="mt-6"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const picked = e.dataTransfer.files?.item(0) || null;
              onPickFile(picked);
            }}
          >
            <div className={dropZoneClasses}>
              <div className="text-blue-700 font-semibold">Drag & drop CSV here</div>
              <div className="text-sm text-slate-500 mt-2">or choose a file from your device</div>

              <label className="mt-5 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer shadow-sm">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.item(0) || null)}
                />
                Browse CSV
              </label>

              {file && <div className="mt-3 text-sm text-slate-700">Selected: {file.name}</div>}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleProcess}
              disabled={isProcessing}
              className="px-5 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isProcessing ? 'Processing...' : 'Process Data'}
            </button>

            {status && (
              <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-3 flex-1">
                {status}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const HomeRedirect: React.FC = () => {
  const role = getAuthRole();
  if (role === 'admin') return <Navigate to="/admin/upload" replace />;
  if (role === 'minister') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

const LoginRoute: React.FC = () => {
  const role = getAuthRole();
  if (role === 'admin') return <Navigate to="/admin/upload" replace />;
  if (role === 'minister') return <Navigate to="/dashboard" replace />;
  return <Login />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/dashboard"
          element={
            <RequireRole allowedRoles={['minister', 'admin']}>
              <DashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/upload"
          element={
            <RequireRole allowedRoles={['admin']}>
              <AdminUploadPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;