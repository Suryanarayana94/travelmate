import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, clearToken, getToken, setToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;
    const token = getToken();
    if (!token) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    apiFetch('/auth/me')
      .then((response) => {
        if (active) setUser(response.data.user);
      })
      .catch(() => {
        clearToken();
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setAuthError('');
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: credentials,
      auth: false
    });
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    setAuthError('');
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: payload,
      auth: false
    });
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const updateProfile = useCallback(async (formData) => {
    const response = await apiFetch('/auth/profile', {
      method: 'PUT',
      body: formData,
      isFormData: true
    });
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const refreshMe = useCallback(async () => {
    const response = await apiFetch('/auth/me');
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const changePassword = useCallback(async (payload) => {
    return apiFetch('/auth/password', { method: 'PATCH', body: payload });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateProfile,
      refreshMe,
      changePassword,
      setUser
    }),
    [user, loading, authError, login, register, logout, updateProfile, refreshMe, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
