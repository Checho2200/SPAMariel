import api from './api';

// ─── Tipos de Servicio ────────────────────────────────

export const getServiceTypes = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const { data } = await api.get('/service-types', { params: { page, limit, search } });
  return data;
};

export const getActiveServiceTypes = async () => {
  const { data } = await api.get('/service-types/active');
  return data;
};

export const createServiceType = async (payload) => {
  const { data } = await api.post('/service-types', payload);
  return data;
};

export const updateServiceType = async (id, payload) => {
  const { data } = await api.put(`/service-types/${id}`, payload);
  return data;
};

export const deleteServiceType = async (id) => {
  const { data } = await api.delete(`/service-types/${id}`);
  return data;
};

// ─── Servicios ────────────────────────────────────────

export const getServices = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const { data } = await api.get('/services', { params: { page, limit, search } });
  return data;
};

export const createService = async (payload) => {
  const { data } = await api.post('/services', payload);
  return data;
};

export const updateService = async (id, payload) => {
  const { data } = await api.put(`/services/${id}`, payload);
  return data;
};

export const deleteService = async (id) => {
  const { data } = await api.delete(`/services/${id}`);
  return data;
};

const serviceService = {
  getServiceTypes,
  getActiveServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  getServices,
  createService,
  updateService,
  deleteService,
};

export default serviceService;
