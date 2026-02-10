import api from './api';

// ─── Dashboard KPIs ───────────────────────────────────

export const getDashboardStats = async () => {
  const { data } = await api.get('/dashboard/stats');
  return data;
};

// ─── Resumen del día ──────────────────────────────────

export const getTodaySummary = async () => {
  const { data } = await api.get('/dashboard/today');
  return data;
};

// ─── Historial de un cliente ──────────────────────────

export const getClientHistory = async (clientId) => {
  const { data } = await api.get(`/dashboard/client-history/${clientId}`);
  return data;
};

const dashboardService = {
  getDashboardStats,
  getTodaySummary,
  getClientHistory,
};

export default dashboardService;
