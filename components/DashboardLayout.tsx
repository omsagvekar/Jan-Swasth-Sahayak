import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Settings, LayoutDashboard, Layers, LogOut, SlidersHorizontal, MessageSquare } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Compare States', to: '/compare', icon: Layers },
  { label: 'Policy Simulator', to: '/simulator', icon: SlidersHorizontal },
  { label: 'National AI Chat', to: '/chat', icon: MessageSquare },
];

const DashboardLayout: React.FC = () => {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-24 xl:w-72 border-r border-slate-700 bg-slate-950/95 backdrop-blur-xl shadow-inner">
          <div className="flex h-full flex-col justify-between py-6 px-3 xl:px-5">
            <div className="space-y-8">
              <div className="flex flex-col items-center xl:flex-row xl:items-center xl:gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-800 border border-slate-700 shadow-lg">
                  <LayoutDashboard className="h-7 w-7 text-cyan-400" />
                </div>
                <div className="hidden xl:block">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Jan Swasthya</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">Sahayak</p>
                </div>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-3xl px-3 py-3 text-sm font-medium transition ${
                          isActive
                            ? 'bg-slate-800 text-white shadow-lg shadow-cyan-500/10'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="h-5 w-5" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </NavLink>
                  );
                })}

                {role === 'admin' && (
                  <NavLink
                    to="/admin/upload"
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-3xl px-3 py-3 text-sm font-medium transition ${
                        isActive
                          ? 'bg-slate-800 text-white shadow-lg shadow-cyan-500/10'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Settings className="h-5 w-5" />
                    <span className="hidden xl:inline">Data Management</span>
                  </NavLink>
                )}
              </nav>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Role</p>
                <p className="mt-2 text-sm font-semibold text-slate-50">{role === 'admin' ? 'Administrator' : 'Minister'}</p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-3xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b border-slate-700 bg-slate-950/95 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">War Room</p>
                <h1 className="text-2xl font-semibold text-slate-100">Command Center</h1>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
