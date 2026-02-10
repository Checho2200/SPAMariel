import api from './api';

// Obtener todos los usuarios (paginado)
export const getUsers = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const { data } = await api.get('/users', { params: { page, limit, search } });
  return data;
};

// Obtener usuario por ID
export const getUserById = async (id) => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

// Crear nuevo usuario
export const createUser = async (userData) => {
  const { data } = await api.post('/users', userData);
  return data;
};

// Actualizar usuario
export const updateUser = async (id, userData) => {
  const { data } = await api.put(`/users/${id}`, userData);
  return data;
};

// Eliminar usuario
export const deleteUser = async (id) => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};

const userService = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

export default userService;
