import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import toast from 'react-hot-toast';
import Breadcrumb from '../components/ui/Breadcrumb';
import { getTodaySummary } from '../services/dashboardService';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value || 0);

const statusColors = {
  pendiente: 'warning',
  confirmada: 'info',
  'en-progreso': 'secondary',
  completada: 'success',
  cancelada: 'error',
  'no-asistio': 'default',
};

const statusLabels = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  'en-progreso': 'En Progreso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  'no-asistio': 'No Asistió',
};

function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}15`,
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 26, color }} />
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function HistorialDiaPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getTodaySummary();
        setData(result);
      } catch {
        toast.error('Error al cargar historial del día', { id: 'today-summary' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAppointments = useMemo(() => {
    if (!data?.appointments) return [];
    if (!search) return data.appointments;
    const s = search.toLowerCase();
    return data.appointments.filter((a) => {
      const clientName = `${a.client?.firstName || ''} ${a.client?.lastName || ''}`.toLowerCase();
      const serviceName = (a.service?.name || '').toLowerCase();
      return clientName.includes(s) || serviceName.includes(s) || (a.client?.documentNumber || '').includes(s);
    });
  }, [data, search]);

  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Box>
      <Breadcrumb />
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Historial del Día
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textTransform: 'capitalize' }}>
        {today}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* ─── Resumen Cards ──────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <SummaryCard
                title="Total Citas"
                value={data?.summary?.totalAppointments ?? 0}
                icon={EventAvailableIcon}
                color="#8b5cf6"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <SummaryCard
                title="Clientes Únicos"
                value={data?.summary?.uniqueClients ?? 0}
                icon={PeopleIcon}
                color="#6366f1"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <SummaryCard
                title="Ingresos del Día"
                value={formatCurrency(data?.summary?.totalRevenue)}
                icon={AttachMoneyIcon}
                color="#10b981"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <SummaryCard
                title="Completadas"
                value={data?.summary?.completed ?? 0}
                icon={CheckCircleIcon}
                color="#10b981"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <SummaryCard
                title="Pendientes"
                value={(data?.summary?.pending ?? 0) + (data?.summary?.inProgress ?? 0)}
                icon={PendingIcon}
                color="#f59e0b"
              />
            </Grid>
          </Grid>

          {/* ─── Buscador ───────────────────────────── */}
          <Box sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Buscar por cliente o servicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 320 }}
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
          </Box>

          {/* ─── Tabla de citas del día ─────────────── */}
          {data?.appointments?.length === 0 ? (
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
              <PlayCircleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">
                No hay citas programadas para hoy
              </Typography>
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
                    <TableCell><strong>Hora</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Documento</strong></TableCell>
                    <TableCell><strong>Servicio</strong></TableCell>
                    <TableCell><strong>Precio</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAppointments.map((apt) => (
                    <TableRow key={apt._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {apt.startTime} - {apt.endTime}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {apt.client?.firstName} {apt.client?.lastName}
                      </TableCell>
                      <TableCell>
                        {apt.client?.documentNumber || '—'}
                      </TableCell>
                      <TableCell>
                        {apt.service?.name || '—'}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600} color="success.main">
                          {formatCurrency(apt.price)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[apt.status] || apt.status}
                          size="small"
                          color={statusColors[apt.status] || 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Fila de totales */}
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" fontWeight={700}>
                        TOTAL DEL DÍA — {filteredAppointments.length} citas
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="success.main">
                        {formatCurrency(
                          filteredAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0)
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
}
