import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Role = 'admin' | 'minister';

const AUTH_KEY = 'nhfa_auth_role';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const u = username.trim().toLowerCase();
    const p = password;

    let role: Role | null = null;
    if (u === 'admin' && p === 'admin') role = 'admin';
    if (u === 'minister' && p === 'minister') role = 'minister';

    if (!role) {
      setError('Invalid credentials. Use admin/admin or minister/minister.');
      return;
    }

    try {
      localStorage.setItem(AUTH_KEY, role);
      setIsSubmitting(true);
      navigate(role === 'admin' ? '/admin/upload' : '/dashboard', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800">Jan Swasthya Sahayak</h1>
          <p className="text-sm text-slate-500 mt-1">National Health Fund Allocation Optimizer</p>
        </div>

        <form className="p-6 space-y-4" onSubmit={handleLogin}>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              placeholder="admin or minister"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              placeholder="admin or minister"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>

          <div className="text-xs text-slate-500 pt-1">
            Demo credentials: <span className="font-medium">admin/admin</span> and <span className="font-medium">minister/minister</span>.
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

