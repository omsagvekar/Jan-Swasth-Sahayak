import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Role = 'admin' | 'minister';
const AUTH_KEY = 'nhfa_auth_role';

const getStoredRole = (): Role | null => {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored === 'admin' || stored === 'minister' ? stored : null;
  } catch {
    return null;
  }
};

interface AuthContextValue {
  role: Role | null;
  isAuthenticated: boolean;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role | null>(() => getStoredRole());

  useEffect(() => {
    const stored = getStoredRole();
    if (stored !== role) {
      setRole(stored);
    }
  }, [role]);

  const login = useCallback((nextRole: Role) => {
    try {
      localStorage.setItem(AUTH_KEY, nextRole);
      setRole(nextRole);
    } catch {
      setRole(nextRole);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore storage failures
    }
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({ role, isAuthenticated: role !== null, login, logout }),
    [role, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
