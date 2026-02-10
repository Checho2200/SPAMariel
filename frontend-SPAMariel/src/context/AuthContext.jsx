import { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import { storage } from '../utils/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storage.getUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Al montar, si hay token validamos el perfil contra el backend
  useEffect(() => {
    const token = storage.getToken();
    if (token && !user) {
      setLoading(true);
      authService
        .getProfile()
        .then((profile) => {
          setUser(profile);
          storage.setUser(profile);
        })
        .catch(() => {
          storage.clear();
          setUser(null);
        })
        .finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(credentials);
      const { token, ...userData } = data;
      storage.setToken(token);
      storage.setUser(userData);
      setUser(userData);
      toast.success(`¡Bienvenido, ${userData.name}!`);
      return userData;
    } catch (err) {
      const message =
        err.response?.data?.message || 'Error al iniciar sesión';
      setError(message);
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    storage.clear();
    setUser(null);
    setError(null);
    toast.success('Sesión cerrada correctamente');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      login,
      logout,
      clearError,
    }),
    [user, loading, error, login, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
