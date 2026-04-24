import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, type Role } from './auth/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, role, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/admin/upload' : '/dashboard'} replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const u = username.trim().toLowerCase();
    const p = password;

    let nextRole: Role | null = null;
    if (u === 'admin' && p === 'admin') nextRole = 'admin';
    if (u === 'minister' && p === 'minister') nextRole = 'minister';

    if (!nextRole) {
      setError('Invalid credentials. Use admin/admin or minister/minister.');
      setIsSubmitting(false);
      return;
    }

    login(nextRole);
    navigate(nextRole === 'admin' ? '/admin/upload' : '/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-700 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold text-white">Jan Swasthya Sahayak</h1>
          <p className="text-sm text-slate-400">National Health Decision Support Platform</p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="admin or minister"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="admin or minister"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="rounded-3xl border border-red-600 bg-red-950/90 px-4 py-3 text-sm text-red-200">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Login'}
          </button>

          <div className="text-xs text-slate-500 pt-2">
            Demo credentials: <span className="font-semibold text-slate-200">admin/admin</span> and{' '}
            <span className="font-semibold text-slate-200">minister/minister</span>.
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

