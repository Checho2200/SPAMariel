import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import toast from 'react-hot-toast';
import Breadcrumb from '../components/ui/Breadcrumb';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import userService from '../services/userService';

export default function UsuariosPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // Estado para el diálogo de confirmación de eliminación
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    user: null,
    loading: false,
  });

  // Paginación y búsqueda
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await userService.getUsers({ page: page + 1, limit: rowsPerPage });
      setUsers(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar usuarios', { id: 'fetch-users' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  // Cargar usuarios al montar
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtrado local en tiempo real
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter((u) =>
      (u.name || '').toLowerCase().includes(s) ||
      (u.email || '').toLowerCase().includes(s) ||
      (u.role || '').toLowerCase().includes(s)
    );
  }, [users, search]);

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (e) => setSearch(e.target.value);

  const handleOpenCreate = () => {
    setEditMode(false);
    setCurrentUser(null);
    setFormData({ name: '', email: '', password: '', role: 'user' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (user) => {
    setEditMode(true);
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUser(null);
    setFormData({ name: '', email: '', password: '', role: 'user' });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación
    if (!formData.name || !formData.email) {
      toast.error('Nombre y correo son obligatorios');
      return;
    }

    if (!editMode && !formData.password) {
      toast.error('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    try {
      setFormLoading(true);

      if (editMode) {
        // Actualizar
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // No enviar password vacío
        }
        const updated = await userService.updateUser(currentUser._id, updateData);
        setUsers((prev) =>
          prev.map((u) => (u._id === currentUser._id ? updated : u))
        );
        toast.success('Usuario actualizado correctamente');
      } else {
        // Crear
        const created = await userService.createUser(formData);
        setUsers((prev) => [created, ...prev]);
        setTotal((prev) => prev + 1);
        toast.success('Usuario creado correctamente', { icon: '👤' });
      }

      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar usuario');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (user) => {
    setDeleteDialog({ open: true, user, loading: false });
  };

  const handleConfirmDelete = async () => {
    const user = deleteDialog.user;
    if (!user) return;

    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await userService.deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      setTotal((prev) => prev - 1);
      toast.success('Usuario eliminado correctamente');
      setDeleteDialog({ open: false, user: null, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar usuario');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, user: null, loading: false });
  };

  return (
    <Box>
      <Breadcrumb />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar usuarios..."
          value={search}
          onChange={handleSearchChange}
          sx={{ width: 300 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Agregar Usuario
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Box sx={{ color: 'text.secondary' }}>
            No hay usuarios registrados
          </Box>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider' }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Correo</strong></TableCell>
                <TableCell><strong>Rol</strong></TableCell>
                <TableCell><strong>Fecha de Registro</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role === 'admin' ? 'Admin' : 'Usuario'}
                      size="small"
                      color={user.role === 'admin' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEdit(user)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(user)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </TableContainer>
      )}

      {/* Dialog Crear/Editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Nombre Completo"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Correo Electrónico"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={editMode ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required={!editMode}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Rol"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            >
              <MenuItem value="user">Usuario</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={formLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formLoading}
            >
              {formLoading ? (
                <CircularProgress size={24} />
              ) : editMode ? (
                'Actualizar'
              ) : (
                'Crear'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog Confirmar Eliminación */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar a ${deleteDialog.user?.name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmColor="error"
        loading={deleteDialog.loading}
      />
    </Box>
  );
}
