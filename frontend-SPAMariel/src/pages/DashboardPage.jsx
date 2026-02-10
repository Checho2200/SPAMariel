import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TodayIcon from '@mui/icons-material/Today';
import StarIcon from '@mui/icons-material/Star';
import BarChartIcon from '@mui/icons-material/BarChart';
import toast from 'react-hot-toast';
import Breadcrumb from '../components/ui/Breadcrumb';
import { useAuth } from '../hooks/useAuth';
import { getDashboardStats } from '../services/dashboardService';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value || 0);

const statusColors = {
  pendiente: '#f59e0b',
  confirmada: '#3b82f6',
  'en-progreso': '#8b5cf6',
  completada: '#10b981',
  cancelada: '#ef4444',
  'no-asistio': '#6b7280',
};

const statusLabels = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  'en-progreso': 'En Progreso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  'no-asistio': 'No Asistió',
};

// ─── KPI Card — altura fija para uniformidad ───────────
function KpiCard({ title, value, subtitle, icon: Icon, color, loading }) {
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
        height: 88,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: `0 4px 20px ${color}22` },
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
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {loading ? (
          <>
            <Skeleton width={70} height={28} />
            <Skeleton width={100} height={16} />
          </>
        ) : (
          <>
            <Typography variant="h6" fontWeight={700} noWrap lineHeight={1.2}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.disabled" display="block" noWrap>
                {subtitle}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch {
        toast.error('Error al cargar estadísticas', { id: 'dashboard-stats' });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const maxServiceCount = stats?.topServices?.[0]?.count || 1;
  const maxWeekdayRevenue = stats?.weekdayRevenue
    ? Math.max(...stats.weekdayRevenue.map((d) => d.revenue), 1)
    : 1;

  return (
    <Box>
      <Breadcrumb />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Bienvenido, {user?.name?.split(' ')[0] || 'Usuario'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Resumen del mes en curso
          </Typography>
        </Box>
        {stats && (
          <Chip
            icon={<TodayIcon />}
            label={`${stats.appointments?.today ?? 0} citas hoy`}
            color="primary"
            variant="outlined"
            size="small"
          />
        )}
      </Box>

      {/* ─── KPI Row 1: Métricas principales ────────── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Clientes Totales"
            value={stats?.clients?.total ?? '—'}
            subtitle={`${stats?.clients?.newThisMonth ?? 0} nuevos este mes`}
            icon={PeopleIcon}
            color="#6366f1"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Citas del Mes"
            value={stats?.appointments?.month?.total ?? '—'}
            subtitle={`Semana: ${stats?.appointments?.week?.total ?? 0}`}
            icon={CalendarMonthIcon}
            color="#8b5cf6"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Ingresos Mes"
            value={stats ? formatCurrency(stats.revenue?.month) : '—'}
            subtitle={`Semana: ${stats ? formatCurrency(stats.revenue?.week) : '—'}`}
            icon={TrendingUpIcon}
            color="#10b981"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Completadas"
            value={stats ? `${stats.appointments?.month?.completionRate ?? 0}%` : '—'}
            subtitle={`${stats?.appointments?.month?.completed ?? 0} de ${stats?.appointments?.month?.total ?? 0}`}
            icon={CheckCircleIcon}
            color="#ec4899"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ─── Secciones medias: Top Servicios + Estado + Gráfico ── */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Top Servicios */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <StarIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700}>Top Servicios del Mes</Typography>
            </Box>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={36} sx={{ mb: 0.5 }} />)
            ) : !stats?.topServices?.length ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                Sin datos este mes
              </Typography>
            ) : (
              stats.topServices.map((svc, i) => (
                <Box key={svc.name} sx={{ mb: i < stats.topServices.length - 1 ? 1.5 : 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '55%' }}>
                      {i + 1}. {svc.name}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {svc.count} — {formatCurrency(svc.revenue)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(svc.count / maxServiceCount) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        background: 'linear-gradient(90deg, #6366f1, #ec4899)',
                      },
                    }}
                  />
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        {/* Estado de Citas */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <BarChartIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700}>Estado de Citas</Typography>
            </Box>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={36} sx={{ mb: 0.5 }} />)
            ) : !stats?.statusDistribution || Object.keys(stats.statusDistribution).length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                Sin datos este mes
              </Typography>
            ) : (
              <>
                {Object.entries(stats.statusDistribution).map(([status, count]) => {
                  const total = stats.appointments?.month?.total || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <Box key={status} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColors[status] || '#999' }} />
                          <Typography variant="body2" fontWeight={500}>
                            {statusLabels[status] || status}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600}>{count} ({pct}%)</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: 'action.hover',
                          '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: statusColors[status] || '#999' },
                        }}
                      />
                    </Box>
                  );
                })}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={600}>Total</Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {stats.appointments?.month?.total} citas
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Ingresos por Día */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <BarChartIcon sx={{ color: '#10b981', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700}>Ingresos por Día</Typography>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flex: 1, alignItems: 'flex-end' }}>
                {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} width={32} height={80} />)}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end', justifyContent: 'space-around', flex: 1, minHeight: 160 }}>
                {stats?.weekdayRevenue?.map((d) => {
                  const heightPct = maxWeekdayRevenue > 0 ? (d.revenue / maxWeekdayRevenue) * 100 : 0;
                  return (
                    <Box key={d.day} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.3, fontSize: '0.65rem' }} noWrap>
                        {d.revenue > 0 ? formatCurrency(d.revenue) : '—'}
                      </Typography>
                      <Box
                        sx={{
                          width: '80%',
                          maxWidth: 36,
                          height: `${Math.max(heightPct, 5)}%`,
                          borderRadius: '6px 6px 0 0',
                          background: d.revenue > 0
                            ? 'linear-gradient(180deg, #6366f1, #8b5cf6)'
                            : 'action.hover',
                          transition: 'height 0.4s ease',
                          minHeight: 4,
                        }}
                      />
                      <Typography variant="caption" fontWeight={700} sx={{ mt: 0.3, fontSize: '0.7rem' }}>
                        {d.day}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                        {d.appointments}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ─── Fila de indicadores extra ──────────────── */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, height: 72 }}>
            <CancelIcon sx={{ color: '#ef4444', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {stats ? `${stats.appointments?.month?.cancellationRate ?? 0}%` : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">Cancelaciones del mes</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, height: 72 }}>
            <TodayIcon sx={{ color: '#3b82f6', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {stats?.appointments?.week?.completed ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">Completadas esta semana</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, height: 72 }}>
            <PeopleIcon sx={{ color: '#6366f1', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {stats?.clients?.active ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">Clientes activos</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
