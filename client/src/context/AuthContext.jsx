import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, usersService } from '../services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuth = useCallback(async () => {
    try {
      setLoading(true);
      const sessionUser = await authService.getSession();
      setUser(sessionUser);
    } catch (err) {
      console.warn('No active session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setUser(res.user);
    return res.user;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = async (updates) => {
    const updated = await usersService.updateProfile(updates);
    setUser(updated);
    return updated;
  };

  // Helper for dev testing: quickly switch current role
  const switchRole = async (newRole) => {
    if (!user) return;
    const updated = await usersService.updateProfile({ role: newRole });
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateUser,
        switchRole,
        refreshUser: initAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
