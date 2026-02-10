import api from './api';

/**
 * Servicio de autenticación - consume los endpoints del backend
 */
const authService = {
  /**
   * POST /auth/login
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ _id, name, email, role, token }>}
   */
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  /**
   * GET /auth/profile
   * @returns {Promise<{ _id, name, email, role }>}
   */
  getProfile: async () => {
    const { data } = await api.get('/auth/profile');
    return data;
  },
};

export default authService;
