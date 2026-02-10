import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import Typography from '@mui/material/Typography';
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
import Autocomplete from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import toast from 'react-hot-toast';
import Breadcrumb from '../components/ui/Breadcrumb';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import appointmentService from '../services/appointmentService';

// ─── Constantes ────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente', color: 'warning' },
  { value: 'confirmada', label: 'Confirmada', color: 'info' },
  { value: 'en-progreso', label: 'En Progreso', color: 'secondary' },
  { value: 'completada', label: 'Completada', color: 'success' },
  { value: 'cancelada', label: 'Cancelada', color: 'error' },
  { value: 'no-asistio', label: 'No Asistió', color: 'default' },
];

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'transferencia', label: 'Transferencia' },
];

const getStatusChip = (status) => {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || {};
  return <Chip label={opt.label || status} size="small" color={opt.color || 'default'} />;
};

const formatDate = (dateStr) => {
  // Tomar solo YYYY-MM-DD para evitar desfase por timezone
  const d = typeof dateStr === 'string' ? dateStr.split('T')[0] : new Date(dateStr).toISOString().split('T')[0];
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

// Helper: calcular hora fin (igual que backend)
const calcEndTime = (startTime, durationMinutes) => {
  if (!startTime || !durationMinutes) return '';
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const endM = (totalMin % 60).toString().padStart(2, '0');
  return `${endH}:${endM}`;
};

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

// ════════════════════════════════════════════════════════
//  LISTA DE CITAS
// ════════════════════════════════════════════════════════
function ListaCitas({ onOpenCreate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [editDialog, setEditDialog] = useState(false);
  const [current, setCurrent] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Selects data
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientSearchTimeout, setClientSearchTimeout] = useState(null);

  const [formData, setFormData] = useState({
    client: null,
    service: '',
    date: '',
    startTime: '',
    notes: '',
    status: 'pendiente',
  });

  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null, loading: false });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await appointmentService.getAppointments({ page: page + 1, limit: rowsPerPage });
      setItems(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar citas', { id: 'fetch-appointments' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Re-fetch cuando se crea una cita desde el calendario
  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('appointment-created', handler);
    return () => window.removeEventListener('appointment-created', handler);
  }, [fetchData]);

  // Filtrado local en tiempo real
  const filteredItems = useMemo(() => {
    let result = items;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((item) =>
        `${item.client?.firstName || ''} ${item.client?.lastName || ''}`.toLowerCase().includes(s) ||
        (item.service?.name || '').toLowerCase().includes(s) ||
        (item.client?.documentNumber || '').includes(s)
      );
    }
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }
    return result;
  }, [items, search, statusFilter]);

  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);

  // ─── Load selects ────────────────────────────────────
  const loadSelects = async () => {
    try {
      const [c, s] = await Promise.all([
        appointmentService.getClientsForSelect(),
        appointmentService.getServicesForSelect(),
      ]);
      setClients(c);
      setServices(s);
    } catch {
      toast.error('Error al cargar datos');
    }
  };

  const handleClientSearch = (value) => {
    setClientSearch(value);
    if (clientSearchTimeout) clearTimeout(clientSearchTimeout);
    setClientSearchTimeout(setTimeout(async () => {
      if (value.length >= 2) {
        try {
          const c = await appointmentService.getClientsForSelect(value);
          setClients(c);
        } catch { /* ignore */ }
      }
    }, 300));
  };

  // ─── Edit dialog ─────────────────────────────────────
  const handleOpenEdit = async (item) => {
    await loadSelects();
    setCurrent(item);
    const clientObj = item.client ? { _id: item.client._id, firstName: item.client.firstName, lastName: item.client.lastName, documentNumber: item.client.documentNumber } : null;
    setFormData({
      client: clientObj,
      service: item.service?._id || '',
      date: item.date ? (typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0]) : '',
      startTime: item.startTime || '',
      notes: item.notes || '',
      status: item.status,
    });
    setEditDialog(true);
  };

  const handleCloseEdit = () => { setEditDialog(false); setCurrent(null); };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!formData.client || !formData.service || !formData.date || !formData.startTime) {
      toast.error('Cliente, servicio, fecha y hora son obligatorios');
      return;
    }
    try {
      setFormLoading(true);
      const payload = {
        client: formData.client._id,
        service: formData.service,
        date: formData.date,
        startTime: formData.startTime,
        notes: formData.notes,
        status: formData.status,
      };
      const updated = await appointmentService.updateAppointment(current._id, payload);
      setItems((prev) => prev.map((i) => (i._id === current._id ? updated : i)));
      toast.success('Cita actualizada');
      handleCloseEdit();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Status change ───────────────────────────────────
  const handleStatusChange = async (item, newStatus) => {
    try {
      const updated = await appointmentService.updateAppointmentStatus(item._id, newStatus);
      setItems((prev) => prev.map((i) => (i._id === item._id ? updated : i)));
      toast.success(`Estado cambiado a: ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
    }
  };

  // ─── Delete ──────────────────────────────────────────
  const handleDelete = (item) => setDeleteDialog({ open: true, item, loading: false });

  const handleConfirmDelete = async () => {
    const item = deleteDialog.item;
    if (!item) return;
    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await appointmentService.deleteAppointment(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      setTotal((prev) => prev - 1);
      toast.success('Cita eliminada');
      setDeleteDialog({ open: false, item: null, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar por cliente..."
            value={search}
            onChange={handleSearchChange}
            sx={{ width: 250 }}
            slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>) } }}
          />
          <TextField
            size="small"
            select
            label="Estado"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </TextField>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onOpenCreate}>
          Nueva Cita
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CalendarMonthIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Box sx={{ color: 'text.secondary' }}>No hay citas registradas</Box>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Hora</strong></TableCell>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell><strong>Servicio</strong></TableCell>
                <TableCell><strong>Precio</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>{item.startTime} - {item.endTime}</TableCell>
                  <TableCell>{item.client?.firstName} {item.client?.lastName}</TableCell>
                  <TableCell>
                    <Chip label={item.service?.name || '—'} size="small" variant="outlined" color="primary" />
                  </TableCell>
                  <TableCell>S/ {item.price?.toFixed(2)}</TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={item.status}
                      onChange={(e) => handleStatusChange(item, e.target.value)}
                      variant="standard"
                      sx={{ minWidth: 120 }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </TextField>
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

      {/* Dialog Editar Cita */}
      <Dialog open={editDialog} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Cita</DialogTitle>
        <form onSubmit={handleSubmitEdit}>
          <DialogContent>
            <Autocomplete
              options={clients}
              value={formData.client}
              onChange={(_e, val) => setFormData({ ...formData, client: val })}
              onInputChange={(_e, val) => handleClientSearch(val)}
              getOptionLabel={(opt) => opt ? `${opt.firstName} ${opt.lastName} - ${opt.documentNumber}` : ''}
              isOptionEqualToValue={(opt, val) => opt._id === val?._id}
              renderInput={(params) => <TextField {...params} label="Cliente" required sx={{ mb: 2 }} />}
            />

            <TextField
              fullWidth
              select
              label="Servicio"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              required
              sx={{ mb: 2 }}
            >
              {services.map((s) => (
                <MenuItem key={s._id} value={s._id}>{s.name} ({s.duration} min - S/ {s.price?.toFixed(2)})</MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField fullWidth label="Fecha" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required slotProps={{ inputLabel: { shrink: true } }} />
              <TextField fullWidth label="Hora inicio" type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required slotProps={{ inputLabel: { shrink: true } }} />
            </Box>

            {formData.startTime && formData.service && (() => {
              const sel = services.find((s) => s._id === formData.service);
              if (!sel) return null;
              const end = calcEndTime(formData.startTime, sel.duration);
              return (
                <Typography variant="body2" sx={{ mb: 2, px: 1, py: 0.5, bgcolor: 'action.hover', borderRadius: 1, display: 'inline-block' }}>
                  ⏱️ Duración: <strong>{sel.duration} min</strong> &mdash; Hora fin: <strong>{end}</strong>
                </Typography>
              );
            })()}

            <TextField
              fullWidth
              select
              label="Estado"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              sx={{ mb: 2 }}
            >
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>

            <TextField fullWidth label="Notas" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} multiline rows={2} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEdit} disabled={formLoading}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={formLoading}>
              {formLoading ? <CircularProgress size={24} /> : 'Actualizar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Cita"
        message={`¿Eliminar la cita de ${deleteDialog.item?.client?.firstName || ''} ${deleteDialog.item?.client?.lastName || ''}? No se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleteDialog.loading}
      />
    </Box>
  );
}

// ════════════════════════════════════════════════════════
//  PENDIENTES DE PAGO
// ════════════════════════════════════════════════════════
function PendientesPago() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [payDialog, setPayDialog] = useState({ open: false, item: null, loading: false, method: '' });

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      // Traemos citas pendientes (no pagadas)
      const result = await appointmentService.getAppointments({ page: 1, limit: 200, status: 'pendiente' });
      // Filtrar solo las no pagadas del lado cliente (por si hay residuos)
      setItems(result.data.filter((i) => !i.isPaid));
    } catch {
      toast.error('Error al cargar pendientes de pago', { id: 'fetch-pending-pay' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  useEffect(() => {
    const handler = () => fetchPending();
    window.addEventListener('appointment-created', handler);
    return () => window.removeEventListener('appointment-created', handler);
  }, [fetchPending]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter((item) =>
      `${item.client?.firstName || ''} ${item.client?.lastName || ''}`.toLowerCase().includes(s) ||
      (item.service?.name || '').toLowerCase().includes(s) ||
      (item.client?.documentNumber || '').includes(s)
    );
  }, [items, search]);

  const handleOpenPay = (item) => {
    setPayDialog({ open: true, item, loading: false, method: 'efectivo' });
  };

  const handleConfirmPay = async () => {
    const { item, method } = payDialog;
    if (!item || !method) return;
    try {
      setPayDialog((prev) => ({ ...prev, loading: true }));
      await appointmentService.confirmPayment(item._id, method);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      toast.success('Pago confirmado — cita visible en calendario', { icon: '✅' });
      setPayDialog({ open: false, item: null, loading: false, method: '' });
      window.dispatchEvent(new Event('appointment-paid'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al confirmar pago');
      setPayDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar por cliente o servicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 300 }}
          slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>) } }}
        />
        <Chip
          icon={<PaymentIcon />}
          label={`${items.length} pendiente${items.length !== 1 ? 's' : ''} de pago`}
          color="warning"
          variant="outlined"
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography color="text.secondary">Todas las citas están pagadas</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Hora</strong></TableCell>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell><strong>Servicio</strong></TableCell>
                <TableCell><strong>Precio</strong></TableCell>
                <TableCell align="center"><strong>Pago</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>{item.startTime} - {item.endTime}</TableCell>
                  <TableCell>{item.client?.firstName} {item.client?.lastName}</TableCell>
                  <TableCell>
                    <Chip label={item.service?.name || '—'} size="small" variant="outlined" color="primary" />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700}>S/ {item.price?.toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<PaymentIcon />}
                      onClick={() => handleOpenPay(item)}
                    >
                      Pagar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Confirmar Pago */}
      <Dialog open={payDialog.open} onClose={() => setPayDialog({ open: false, item: null, loading: false, method: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Pago</DialogTitle>
        <DialogContent>
          {payDialog.item && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Cliente</Typography>
                <Typography fontWeight={600}>
                  {payDialog.item.client?.firstName} {payDialog.item.client?.lastName}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Servicio</Typography>
                <Typography fontWeight={600}>{payDialog.item.service?.name}</Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">Monto a pagar</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  S/ {payDialog.item.price?.toFixed(2)}
                </Typography>
              </Box>
              <TextField
                fullWidth
                select
                label="Método de Pago"
                value={payDialog.method}
                onChange={(e) => setPayDialog((prev) => ({ ...prev, method: e.target.value }))}
                required
              >
                {PAYMENT_METHODS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialog({ open: false, item: null, loading: false, method: '' })} disabled={payDialog.loading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmPay}
            disabled={payDialog.loading || !payDialog.method}
          >
            {payDialog.loading ? <CircularProgress size={24} /> : 'Confirmar Pago'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ════════════════════════════════════════════════════════
//  CALENDARIO / HORARIO
// ════════════════════════════════════════════════════════
function Calendario({ onOpenCreate }) {
  const calendarRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [detailDialog, setDetailDialog] = useState({ open: false, event: null });

  // Función de event source — FullCalendar la llama automáticamente cuando cambian las fechas
  const fetchEvents = useCallback((fetchInfo, successCallback, failureCallback) => {
    setLoading(true);
    const start = fetchInfo.startStr.split('T')[0];
    const end = fetchInfo.endStr.split('T')[0];
    appointmentService.getCalendarAppointments(start, end)
      .then((data) => {
        successCallback(data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error('Error al cargar calendario');
        failureCallback(err);
        setLoading(false);
      });
  }, []);

  // Re-fetch cuando se crea o paga una cita
  useEffect(() => {
    const handler = () => {
      const api = calendarRef.current?.getApi();
      if (api) api.refetchEvents();
    };
    window.addEventListener('appointment-created', handler);
    window.addEventListener('appointment-paid', handler);
    return () => {
      window.removeEventListener('appointment-created', handler);
      window.removeEventListener('appointment-paid', handler);
    };
  }, []);

  const handleEventClick = (info) => {
    const ext = info.event.extendedProps;
    setDetailDialog({
      open: true,
      event: {
        id: info.event.id,
        title: info.event.title,
        start: info.event.startStr,
        end: info.event.endStr,
        ...ext,
      },
    });
  };

  const handleDateClick = (info) => {
    onOpenCreate(info.dateStr, info.date);
  };

  return (
    <Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          '& .fc': { fontFamily: 'inherit' },
          '& .fc-toolbar-title': { fontSize: '1.2rem', fontWeight: 600 },
          '& .fc-button': {
            textTransform: 'capitalize',
            fontSize: '0.8rem',
          },
          '& .fc-timegrid-slot': { height: '48px' },
          '& .fc-event': {
            cursor: 'pointer',
            borderRadius: '4px',
            fontSize: '0.75rem',
          },
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locales={[esLocale]}
          locale="es"
          firstDay={1}
          slotMinTime="08:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          height="auto"
          events={fetchEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          selectable={true}
          nowIndicator={true}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
        />
      </Paper>

      {/* Dialog Detalle de Evento */}
      <Dialog open={detailDialog.open} onClose={() => setDetailDialog({ open: false, event: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Detalle de Cita</DialogTitle>
        <DialogContent>
          {detailDialog.event && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
              <Box><strong>Cliente:</strong> {detailDialog.event.clientName}</Box>
              <Box><strong>Servicio:</strong> {detailDialog.event.serviceName}</Box>
              <Box><strong>Duración:</strong> {detailDialog.event.duration} min</Box>
              <Box><strong>Horario:</strong> {detailDialog.event.start?.split('T')[1]?.substring(0, 5)} - {detailDialog.event.end?.split('T')[1]?.substring(0, 5)}</Box>
              <Box><strong>Teléfono:</strong> {detailDialog.event.phone || '—'}</Box>
              <Box><strong>Estado:</strong> {getStatusChip(detailDialog.event.status)}</Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog({ open: false, event: null })}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL CON TABS
// ════════════════════════════════════════════════════════
export default function CitasPage() {
  const [tab, setTab] = useState(0);

  // ─── Dialog Crear Cita (global, compartido entre tabs) ──
  const [createDialog, setCreateDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [clientSearchTimeout, setClientSearchTimeout] = useState(null);
  const [formData, setFormData] = useState({
    client: null,
    service: '',
    date: '',
    startTime: '',
    notes: '',
  });

  const loadSelects = async () => {
    try {
      const [c, s] = await Promise.all([
        appointmentService.getClientsForSelect(),
        appointmentService.getServicesForSelect(),
      ]);
      setClients(c);
      setServices(s);
    } catch {
      toast.error('Error al cargar datos');
    }
  };

  const handleClientSearch = (value) => {
    if (clientSearchTimeout) clearTimeout(clientSearchTimeout);
    setClientSearchTimeout(setTimeout(async () => {
      if (value.length >= 2) {
        try {
          const c = await appointmentService.getClientsForSelect(value);
          setClients(c);
        } catch { /* ignore */ }
      }
    }, 300));
  };

  const handleOpenCreate = async (dateStr, dateObj) => {
    await loadSelects();
    let date = '';
    let startTime = '';

    if (dateStr) {
      if (dateStr.includes('T')) {
        // Viene del timeGrid con hora
        date = dateStr.split('T')[0];
        startTime = dateStr.split('T')[1]?.substring(0, 5) || '';
      } else {
        date = dateStr;
      }
    }

    setFormData({ client: null, service: '', date, startTime, notes: '' });
    setCreateDialog(true);
  };

  const handleCloseCreate = () => { setCreateDialog(false); };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!formData.client || !formData.service || !formData.date || !formData.startTime) {
      toast.error('Cliente, servicio, fecha y hora son obligatorios');
      return;
    }
    try {
      setFormLoading(true);
      await appointmentService.createAppointment({
        client: formData.client._id,
        service: formData.service,
        date: formData.date,
        startTime: formData.startTime,
        notes: formData.notes,
      });
      toast.success('Cita creada correctamente', { icon: '📅' });
      handleCloseCreate();
      // Trigger re-fetch — con key change
      window.dispatchEvent(new Event('appointment-created'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear cita');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box>
      <Breadcrumb />

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 2 }}>
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<CalendarMonthIcon />} iconPosition="start" label="Horario" />
          <Tab icon={<ListAltIcon />} iconPosition="start" label="Gestión de Citas" />
          <Tab icon={<PaymentIcon />} iconPosition="start" label="Pagos" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tab} index={0}>
            <Calendario onOpenCreate={handleOpenCreate} />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <ListaCitas onOpenCreate={() => handleOpenCreate()} />
          </TabPanel>
          <TabPanel value={tab} index={2}>
            <PendientesPago />
          </TabPanel>
        </Box>
      </Paper>

      {/* Dialog Crear Cita (Global) */}
      <Dialog open={createDialog} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Cita</DialogTitle>
        <form onSubmit={handleSubmitCreate}>
          <DialogContent>
            <Autocomplete
              options={clients}
              value={formData.client}
              onChange={(_e, val) => setFormData({ ...formData, client: val })}
              onInputChange={(_e, val) => handleClientSearch(val)}
              getOptionLabel={(opt) => opt ? `${opt.firstName} ${opt.lastName} - ${opt.documentNumber}` : ''}
              isOptionEqualToValue={(opt, val) => opt._id === val?._id}
              renderInput={(params) => <TextField {...params} label="Cliente" required sx={{ mb: 2 }} />}
            />

            <TextField
              fullWidth
              select
              label="Servicio"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              required
              sx={{ mb: 2 }}
            >
              {services.map((s) => (
                <MenuItem key={s._id} value={s._id}>{s.name} ({s.duration} min - S/ {s.price?.toFixed(2)})</MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField fullWidth label="Fecha" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required slotProps={{ inputLabel: { shrink: true } }} />
              <TextField fullWidth label="Hora inicio" type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required slotProps={{ inputLabel: { shrink: true } }} />
            </Box>

            {formData.startTime && formData.service && (() => {
              const sel = services.find((s) => s._id === formData.service);
              if (!sel) return null;
              const end = calcEndTime(formData.startTime, sel.duration);
              return (
                <Typography variant="body2" sx={{ mb: 2, px: 1, py: 0.5, bgcolor: 'action.hover', borderRadius: 1, display: 'inline-block' }}>
                  ⏱️ Duración: <strong>{sel.duration} min</strong> &mdash; Hora fin: <strong>{end}</strong>
                </Typography>
              );
            })()}

            <TextField fullWidth label="Notas" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} multiline rows={2} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreate} disabled={formLoading}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={formLoading}>
              {formLoading ? <CircularProgress size={24} /> : 'Crear Cita'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
