import api from './api';

// ─── CRUD Citas ───────────────────────────────────────

export const getAppointments = async ({ page = 1, limit = 10, search = '', status = '', date = '' } = {}) => {
  const { data } = await api.get('/appointments', { params: { page, limit, search, status, date } });
  return data;
};

export const getAppointmentById = async (id) => {
  const { data } = await api.get(`/appointments/${id}`);
  return data;
};

export const createAppointment = async (payload) => {
  const { data } = await api.post('/appointments', payload);
  return data;
};

export const updateAppointment = async (id, payload) => {
  const { data } = await api.put(`/appointments/${id}`, payload);
  return data;
};

export const updateAppointmentStatus = async (id, status) => {
  const { data } = await api.patch(`/appointments/${id}/status`, { status });
  return data;
};

export const confirmPayment = async (id, paymentMethod) => {
  const { data } = await api.patch(`/appointments/${id}/pay`, { paymentMethod });
  return data;
};

export const deleteAppointment = async (id) => {
  const { data } = await api.delete(`/appointments/${id}`);
  return data;
};

// ─── Calendario ───────────────────────────────────────

export const getCalendarAppointments = async (start, end) => {
  const { data } = await api.get('/appointments/calendar', { params: { start, end } });
  return data;
};

// ─── Helpers (clientes y servicios activos para selects) ──

export const getClientsForSelect = async (search = '') => {
  const { data } = await api.get('/clients', { params: { page: 1, limit: 50, search } });
  return data.data;
};

export const getServicesForSelect = async () => {
  const { data } = await api.get('/services', { params: { page: 1, limit: 100 } });
  return data.data;
};

const appointmentService = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  confirmPayment,
  deleteAppointment,
  getCalendarAppointments,
  getClientsForSelect,
  getServicesForSelect,
};

export default appointmentService;
