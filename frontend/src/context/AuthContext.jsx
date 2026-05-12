import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

/**
 * Permissions map for frontend sidebar rendering.
 * Must match backend middleware/rbac.js permissions.
 */
const ROLE_PERMISSIONS = {
  admin:        ['dashboard','patients','appointments','records','prescriptions','lab','billing','inventory','staff','access-control','reports','settings'],
  doctor:       ['dashboard','patients','appointments','records','prescriptions','lab','reports','settings'],
  nurse:        ['dashboard','patients','appointments','records','lab','inventory','settings'],
  receptionist: ['dashboard','patients','appointments','billing','settings'],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('medbook_token');
    const saved = localStorage.getItem('medbook_user');
    if (token && saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setPermissions(ROLE_PERMISSIONS[parsed.role] || []);
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('medbook_token', data.token);
    localStorage.setItem('medbook_user', JSON.stringify(data.user));
    setUser(data.user);
    setPermissions(ROLE_PERMISSIONS[data.user.role] || []);
    return data.user;
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('medbook_token');
    localStorage.removeItem('medbook_user');
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (page) => permissions.includes(page);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, permissions, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
