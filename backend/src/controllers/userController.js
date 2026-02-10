const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { logAction } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');

// @desc    Get all users (paginated)
// @route   GET /api/users?page=1&limit=10&search=
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const result = await paginate(User, {
    query: req.query,
    searchFields: ['name', 'email'],
    select: '-password',
  });
  res.json(result);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validación
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Por favor complete todos los campos requeridos');
  }

  // Verificar si el usuario ya existe
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('El correo electrónico ya está registrado');
  }

  // Crear usuario
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user',
  });

  if (user) {
    // Audit Log
    logAction({ ...req, user: req.user }, 'USER_CREATE', `Admin ${req.user.email} created user ${user.email}`);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } else {
    res.status(400);
    throw new Error('Datos de usuario inválidos');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }

  const { name, email, role, password } = req.body;

  // Validación
  if (!name || !email) {
    res.status(400);
    throw new Error('Nombre y correo son requeridos');
  }

  // Verificar si el nuevo email ya existe (excepto en el mismo usuario)
  if (email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error('El correo electrónico ya está en uso');
    }
  }

  // Actualizar campos
  user.name = name;
  user.email = email;
  user.role = role || user.role;

  // Actualizar contraseña solo si se proporciona
  if (password) {
    user.password = password;
  }

  const updatedUser = await user.save();

  // Audit Log
  logAction({ ...req, user: req.user }, 'USER_UPDATE', `Admin ${req.user.email} updated user ${updatedUser.email}`);

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }

  // Evitar que un admin se elimine a sí mismo
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('No puedes eliminar tu propia cuenta');
  }

  await User.findByIdAndDelete(req.params.id);

  // Audit Log
  logAction({ ...req, user: req.user }, 'USER_DELETE', `Admin ${req.user.email} deleted user ${user.email}`);

  res.json({ message: 'Usuario eliminado correctamente' });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
