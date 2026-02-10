import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SpaIcon from '@mui/icons-material/Spa';
import CategoryIcon from '@mui/icons-material/Category';
import toast from 'react-hot-toast';
import Breadcrumb from '../components/ui/Breadcrumb';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import serviceService from '../services/serviceService';

// ════════════════════════════════════════════════════════
//  Tab Panel
// ════════════════════════════════════════════════════════
function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

// ════════════════════════════════════════════════════════
//  TIPOS DE SERVICIO
// ════════════════════════════════════════════════════════
function TiposDeServicio() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [current, setCurrent] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null, loading: false });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await serviceService.getServiceTypes({ page: page + 1, limit: rowsPerPage });
      setItems(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar tipos de servicio', { id: 'fetch-service-types' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtrado local en tiempo real
  const filteredItems = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter((i) =>
      (i.name || '').toLowerCase().includes(s) ||
      (i.description || '').toLowerCase().includes(s)
    );
  }, [items, search]);

  const handleSearchChange = (e) => setSearch(e.target.value);

  // ─── Dialog ──────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditMode(false);
    setCurrent(null);
    setFormData({ name: '', description: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setCurrent(item);
    setFormData({ name: item.name, description: item.description || '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => { setOpenDialog(false); setCurrent(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) { toast.error('El nombre es obligatorio'); return; }
    try {
      setFormLoading(true);
      if (editMode) {
        const updated = await serviceService.updateServiceType(current._id, formData);
        setItems((prev) => prev.map((i) => (i._id === current._id ? updated : i)));
        toast.success('Tipo actualizado');
      } else {
        const created = await serviceService.createServiceType(formData);
        setItems((prev) => [created, ...prev]);
        setTotal((prev) => prev + 1);
        toast.success('Tipo creado');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────
  const handleDelete = (item) => setDeleteDialog({ open: true, item, loading: false });

  const handleConfirmDelete = async () => {
    const item = deleteDialog.item;
    if (!item) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await serviceService.deleteServiceType(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      setTotal((prev) => prev - 1);
      toast.success('Tipo eliminado');
      setDeleteDialog({ open: false, item: null, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          size="small"
          placeholder="Buscar tipos..."
          value={search}
          onChange={handleSearchChange}
          sx={{ width: 300 }}
          slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>) } }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Agregar Tipo
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CategoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Box sx={{ color: 'text.secondary' }}>No hay tipos de servicio registrados</Box>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.description || '—'}</TableCell>
                  <TableCell>
                    <Chip label={item.isActive ? 'Activo' : 'Inactivo'} size="small" color={item.isActive ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleOpenEdit(item)} color="primary"><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" onClick={() => handleDelete(item)} color="error"><DeleteIcon fontSize="small" /></IconButton>
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
            onPageChange={(_e, np) => setPage(np)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
          />
        </TableContainer>
      )}

      {/* Dialog Crear/Editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Editar Tipo de Servicio' : 'Nuevo Tipo de Servicio'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField fullWidth label="Nombre" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Descripción" name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} multiline rows={2} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={formLoading}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={formLoading}>
              {formLoading ? <CircularProgress size={24} /> : editMode ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Tipo de Servicio"
        message={`¿Eliminar "${deleteDialog.item?.name}"? No se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleteDialog.loading}
      />
    </Box>
  );
}

// ════════════════════════════════════════════════════════
//  SERVICIOS
// ════════════════════════════════════════════════════════
function Servicios() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [serviceTypes, setServiceTypes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [current, setCurrent] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', serviceType: '', duration: '', price: '' });

  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null, loading: false });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await serviceService.getServices({ page: page + 1, limit: rowsPerPage });
      setItems(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar servicios', { id: 'fetch-services' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtrado local en tiempo real
  const filteredItems = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter((i) =>
      (i.name || '').toLowerCase().includes(s) ||
      (i.serviceType?.name || '').toLowerCase().includes(s) ||
      (i.description || '').toLowerCase().includes(s)
    );
  }, [items, search]);

  // Cargar tipos activos para el select
  const loadServiceTypes = async () => {
    try {
      const types = await serviceService.getActiveServiceTypes();
      setServiceTypes(types);
    } catch {
      toast.error('Error al cargar tipos de servicio', { id: 'fetch-service-types-select' });
    }
  };

  const handleSearchChange = (e) => setSearch(e.target.value);

  // ─── Dialog ──────────────────────────────────────────
  const handleOpenCreate = async () => {
    await loadServiceTypes();
    setEditMode(false);
    setCurrent(null);
    setFormData({ name: '', description: '', serviceType: '', duration: '', price: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = async (item) => {
    await loadServiceTypes();
    setEditMode(true);
    setCurrent(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      serviceType: item.serviceType?._id || '',
      duration: item.duration,
      price: item.price,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => { setOpenDialog(false); setCurrent(null); };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.serviceType || !formData.duration || formData.price === '') {
      toast.error('Nombre, tipo, duración y precio son obligatorios');
      return;
    }

    const payload = {
      ...formData,
      duration: Number(formData.duration),
      price: Number(formData.price),
    };

    try {
      setFormLoading(true);
      if (editMode) {
        const updated = await serviceService.updateService(current._id, payload);
        setItems((prev) => prev.map((i) => (i._id === current._id ? updated : i)));
        toast.success('Servicio actualizado');
      } else {
        const created = await serviceService.createService(payload);
        setItems((prev) => [created, ...prev]);
        setTotal((prev) => prev + 1);
        toast.success('Servicio creado');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────
  const handleDelete = (item) => setDeleteDialog({ open: true, item, loading: false });

  const handleConfirmDelete = async () => {
    const item = deleteDialog.item;
    if (!item) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await serviceService.deleteService(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      setTotal((prev) => prev - 1);
      toast.success('Servicio eliminado');
      setDeleteDialog({ open: false, item: null, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          size="small"
          placeholder="Buscar servicios..."
          value={search}
          onChange={handleSearchChange}
          sx={{ width: 300 }}
          slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>) } }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Agregar Servicio
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <SpaIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Box sx={{ color: 'text.secondary' }}>No hay servicios registrados</Box>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Duración</strong></TableCell>
                <TableCell><strong>Precio</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Chip label={item.serviceType?.name || '—'} size="small" variant="outlined" color="primary" />
                  </TableCell>
                  <TableCell>{formatDuration(item.duration)}</TableCell>
                  <TableCell>S/ {item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip label={item.isActive ? 'Activo' : 'Inactivo'} size="small" color={item.isActive ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleOpenEdit(item)} color="primary"><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" onClick={() => handleDelete(item)} color="error"><DeleteIcon fontSize="small" /></IconButton>
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
            onPageChange={(_e, np) => setPage(np)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
          />
        </TableContainer>
      )}

      {/* Dialog Crear/Editar Servicio */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField fullWidth label="Nombre" name="name" value={formData.name} onChange={handleInputChange} required sx={{ mb: 2 }} />

            <TextField
              fullWidth
              select
              label="Tipo de Servicio"
              name="serviceType"
              value={formData.serviceType}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            >
              {serviceTypes.map((t) => (
                <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Duración (min)"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleInputChange}
                required
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <TextField
                fullWidth
                label="Precio (S/)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                required
                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              />
            </Box>

            <TextField fullWidth label="Descripción" name="description" value={formData.description} onChange={handleInputChange} multiline rows={2} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={formLoading}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={formLoading}>
              {formLoading ? <CircularProgress size={24} /> : editMode ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Servicio"
        message={`¿Eliminar "${deleteDialog.item?.name}"? No se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleteDialog.loading}
      />
    </Box>
  );
}

// ════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL CON TABS
// ════════════════════════════════════════════════════════
export default function ServiciosPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Breadcrumb />

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 2 }}>
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<SpaIcon />} iconPosition="start" label="Servicios" />
          <Tab icon={<CategoryIcon />} iconPosition="start" label="Tipos de Servicio" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tab} index={0}>
            <Servicios />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <TiposDeServicio />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
