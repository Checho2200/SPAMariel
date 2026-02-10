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
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import toast from 'react-hot-toast';
import Breadcrumb from '../components/ui/Breadcrumb';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import clientService from '../services/clientService';
import { getClientHistory } from '../services/dashboardService';

export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [formData, setFormData] = useState({
    documentType: 'DNI',
    documentNumber: '',
    firstName: '',
    lastName: '',
    secondLastName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    client: null,
    loading: false,
  });

  // Historial de cliente
  const [historyDialog, setHistoryDialog] = useState({ open: false, loading: false, data: null });

  // Paginación y búsqueda
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const result = await clientService.getClients({ page: page + 1, limit: rowsPerPage });
      setClients(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar clientes', { id: 'fetch-clients' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Filtrado local en tiempo real
  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const s = search.toLowerCase();
    return clients.filter((c) =>
      `${c.firstName || ''} ${c.lastName || ''} ${c.secondLastName || ''}`.toLowerCase().includes(s) ||
      (c.documentNumber || '').includes(s) ||
      (c.email || '').toLowerCase().includes(s) ||
      (c.phone || '').includes(s)
    );
  }, [clients, search]);

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (e) => setSearch(e.target.value);

  // ─── Consulta RENIEC/SUNAT ───────────────────────────
  const handleConsulta = async () => {
    const { documentType, documentNumber } = formData;

    if (documentType === 'DNI' && documentNumber.length !== 8) {
      toast.error('El DNI debe tener 8 dígitos');
      return;
    }

    if (documentType === 'RUC' && documentNumber.length !== 11) {
      toast.error('El RUC debe tener 11 dígitos');
      return;
    }

    try {
      setConsultaLoading(true);

      if (documentType === 'DNI') {
        const data = await clientService.consultarDNI(documentNumber);
        setFormData((prev) => ({
          ...prev,
          firstName: data.firstName,
          lastName: data.lastName,
          secondLastName: data.secondLastName || '',
        }));
        toast.success('Datos encontrados en RENIEC');
      } else if (documentType === 'RUC') {
        const data = await clientService.consultarRUC(documentNumber);
        setFormData((prev) => ({
          ...prev,
          firstName: data.razonSocial,
          lastName: '',
          secondLastName: '',
          address: data.direccion || '',
        }));
        toast.success('Datos encontrados en SUNAT');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se encontraron datos');
    } finally {
      setConsultaLoading(false);
    }
  };

  // ─── Dialog handlers ─────────────────────────────────
  const handleOpenCreate = () => {
    setEditMode(false);
    setCurrentClient(null);
    setFormData({
      documentType: 'DNI',
      documentNumber: '',
      firstName: '',
      lastName: '',
      secondLastName: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (client) => {
    setEditMode(true);
    setCurrentClient(client);
    setFormData({
      documentType: client.documentType,
      documentNumber: client.documentNumber,
      firstName: client.firstName,
      lastName: client.lastName,
      secondLastName: client.secondLastName || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentClient(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.documentNumber || !formData.firstName || !formData.lastName) {
      toast.error('Documento, nombre y apellido son obligatorios');
      return;
    }

    try {
      setFormLoading(true);

      if (editMode) {
        const updated = await clientService.updateClient(currentClient._id, formData);
        setClients((prev) =>
          prev.map((c) => (c._id === currentClient._id ? updated : c))
        );
        toast.success('Cliente actualizado correctamente');
      } else {
        const created = await clientService.createClient(formData);
        setClients((prev) => [created, ...prev]);
        setTotal((prev) => prev + 1);
        toast.success('Cliente creado correctamente', { icon: '👤' });
      }

      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar cliente');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete handlers ─────────────────────────────────
  const handleDelete = (client) => {
    setDeleteDialog({ open: true, client, loading: false });
  };

  const handleConfirmDelete = async () => {
    const client = deleteDialog.client;
    if (!client) return;

    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await clientService.deleteClient(client._id);
      setClients((prev) => prev.filter((c) => c._id !== client._id));
      setTotal((prev) => prev - 1);
      toast.success('Cliente eliminado correctamente');
      setDeleteDialog({ open: false, client: null, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar cliente');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, client: null, loading: false });
  };

  // ─── Historial de cliente ────────────────────────────
  const handleOpenHistory = async (client) => {
    try {
      setHistoryDialog({ open: true, loading: true, data: null });
      const result = await getClientHistory(client._id);
      setHistoryDialog({ open: true, loading: false, data: result });
    } catch {
      toast.error('Error al cargar historial del cliente', { id: 'client-history' });
      setHistoryDialog({ open: false, loading: false, data: null });
    }
  };

  const handleCloseHistory = () => {
    setHistoryDialog({ open: false, loading: false, data: null });
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value || 0);

  const statusLabels = {
    pendiente: 'Pendiente', confirmada: 'Confirmada', 'en-progreso': 'En Progreso',
    completada: 'Completada', cancelada: 'Cancelada', 'no-asistio': 'No Asistió',
  };

  const statusChipColors = {
    pendiente: 'warning', confirmada: 'info', 'en-progreso': 'secondary',
    completada: 'success', cancelada: 'error', 'no-asistio': 'default',
  };

  return (
    <Box>
      <Breadcrumb />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar clientes..."
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
          Agregar Cliente
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : clients.length === 0 ? (
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
          <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Box sx={{ color: 'text.secondary', mb: 1 }}>
            No hay clientes registrados
          </Box>
          <Box sx={{ color: 'text.disabled', fontSize: '0.875rem' }}>
            Haz clic en &quot;Agregar Cliente&quot; para comenzar
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
                <TableCell><strong>Documento</strong></TableCell>
                <TableCell><strong>Nombre Completo</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell><strong>Correo</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client._id} hover>
                  <TableCell>
                    <Chip
                      label={client.documentType}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    {client.documentNumber}
                  </TableCell>
                  <TableCell>
                    {client.firstName} {client.lastName} {client.secondLastName}
                  </TableCell>
                  <TableCell>{client.phone || '—'}</TableCell>
                  <TableCell>{client.email || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={client.isActive ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={client.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Historial">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenHistory(client)}
                        color="secondary"
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(client)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(client)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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

      {/* Dialog Crear/Editar Cliente */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {/* Tipo de documento + Número + Botón consulta */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                select
                label="Tipo"
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                sx={{ minWidth: 100 }}
                disabled={editMode}
              >
                <MenuItem value="DNI">DNI</MenuItem>
                <MenuItem value="RUC">RUC</MenuItem>
                <MenuItem value="CE">CE</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Número de Documento"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const max = formData.documentType === 'DNI' ? 8 : formData.documentType === 'RUC' ? 11 : 12;
                  if (val.length <= max) handleInputChange({ target: { name: 'documentNumber', value: val } });
                }}
                required
                disabled={editMode}
                slotProps={{
                  htmlInput: {
                    maxLength: formData.documentType === 'DNI' ? 8 : formData.documentType === 'RUC' ? 11 : 12,
                    inputMode: 'numeric',
                  },
                  input: {
                    endAdornment: !editMode && (formData.documentType === 'DNI' || formData.documentType === 'RUC') ? (
                      <InputAdornment position="end">
                        <Tooltip title={`Consultar ${formData.documentType === 'DNI' ? 'RENIEC' : 'SUNAT'}`}>
                          <span>
                            <IconButton
                              onClick={handleConsulta}
                              disabled={consultaLoading || !formData.documentNumber}
                              edge="end"
                              color="primary"
                            >
                              {consultaLoading ? (
                                <CircularProgress size={20} />
                              ) : (
                                <SearchIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
            </Box>

            <TextField
              fullWidth
              label={formData.documentType === 'RUC' ? 'Razón Social' : 'Nombres'}
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />

            {formData.documentType !== 'RUC' && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Apellido Paterno"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Apellido Materno"
                  name="secondLastName"
                  value={formData.secondLastName}
                  onChange={handleInputChange}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Teléfono"
                name="phone"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 9) handleInputChange({ target: { name: 'phone', value: val } });
                }}
                slotProps={{
                  htmlInput: { maxLength: 9, inputMode: 'numeric' },
                }}
              />
              <TextField
                fullWidth
                label="Correo Electrónico"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </Box>

            <TextField
              fullWidth
              label="Dirección"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Notas"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              multiline
              rows={2}
            />
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
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar a ${deleteDialog.client?.firstName} ${deleteDialog.client?.lastName}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleteDialog.loading}
      />

      {/* Dialog Historial de Cliente */}
      <Dialog
        open={historyDialog.open}
        onClose={handleCloseHistory}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="secondary" />
            Historial — {historyDialog.data?.client?.firstName} {historyDialog.data?.client?.lastName}
          </Box>
          <IconButton onClick={handleCloseHistory} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {historyDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : historyDialog.data ? (
            <>
              {/* Stats del cliente */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Chip label={`${historyDialog.data.stats.totalVisits} visitas totales`} color="primary" />
                <Chip label={`${historyDialog.data.stats.completedVisits} completadas`} color="success" />
                <Chip label={`Total gastado: ${formatCurrency(historyDialog.data.stats.totalSpent)}`} color="secondary" />
                {historyDialog.data.stats.cancelledCount > 0 && (
                  <Chip label={`${historyDialog.data.stats.cancelledCount} canceladas`} color="error" variant="outlined" />
                )}
                {historyDialog.data.stats.noShowCount > 0 && (
                  <Chip label={`${historyDialog.data.stats.noShowCount} no asistió`} color="default" variant="outlined" />
                )}
              </Box>

              {/* Servicios favoritos */}
              {historyDialog.data.topServices?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                    Servicios más utilizados
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {historyDialog.data.topServices.map((s) => (
                      <Chip
                        key={s.name}
                        label={`${s.name} (${s.count})`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Tabla de citas */}
              {historyDialog.data.appointments?.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  Este cliente no tiene citas registradas
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Fecha</strong></TableCell>
                        <TableCell><strong>Hora</strong></TableCell>
                        <TableCell><strong>Servicio</strong></TableCell>
                        <TableCell><strong>Precio</strong></TableCell>
                        <TableCell><strong>Estado</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historyDialog.data.appointments.map((apt) => (
                        <TableRow key={apt._id} hover>
                          <TableCell>
                            {apt.date ? new Date(apt.date).toLocaleDateString('es-PE') : '—'}
                          </TableCell>
                          <TableCell>{apt.startTime} - {apt.endTime}</TableCell>
                          <TableCell>{apt.service?.name || '—'}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>
                            {formatCurrency(apt.price)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={statusLabels[apt.status] || apt.status}
                              size="small"
                              color={statusChipColors[apt.status] || 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistory}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
