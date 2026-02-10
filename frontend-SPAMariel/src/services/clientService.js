import api from './api';

// ─── Consultas externas (Decolecta) ───────────────────

/**
 * Consultar DNI en RENIEC
 * @param {string} dni - Número de DNI (8 dígitos)
 */
export const consultarDNI = async (dni) => {
  const { data } = await api.get(`/clients/consulta/dni/${dni}`);
  return data;
};

/**
 * Consultar RUC en SUNAT
 * @param {string} ruc - Número de RUC (11 dígitos)
 */
export const consultarRUC = async (ruc) => {
  const { data } = await api.get(`/clients/consulta/ruc/${ruc}`);
  return data;
};

// ─── CRUD de Clientes ─────────────────────────────────

export const getClients = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const { data } = await api.get('/clients', { params: { page, limit, search } });
  return data;
};

export const getClientById = async (id) => {
  const { data } = await api.get(`/clients/${id}`);
  return data;
};

export const createClient = async (clientData) => {
  const { data } = await api.post('/clients', clientData);
  return data;
};

export const updateClient = async (id, clientData) => {
  const { data } = await api.put(`/clients/${id}`, clientData);
  return data;
};

export const deleteClient = async (id) => {
  const { data } = await api.delete(`/clients/${id}`);
  return data;
};

const clientService = {
  consultarDNI,
  consultarRUC,
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};

export default clientService;
