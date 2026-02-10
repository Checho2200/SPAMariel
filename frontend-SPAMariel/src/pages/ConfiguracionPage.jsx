import { useState } from 'react';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Breadcrumb from '../components/ui/Breadcrumb';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import SettingsIcon from '@mui/icons-material/Settings';
import PaletteIcon from '@mui/icons-material/Palette';
import BrightnessIcon from '@mui/icons-material/Brightness4';
import CloseIcon from '@mui/icons-material/Close';
import { useThemeContext } from '../context/ThemeContext';

const colorPresets = [
  { name: 'Rosa', value: '#ec4899', preview: '#ec4899' },
  { name: 'Azul', value: '#3b82f6', preview: '#3b82f6' },
  { name: 'Púrpura', value: '#8b5cf6', preview: '#8b5cf6' },
  { name: 'Verde', value: '#10b981', preview: '#10b981' },
  { name: 'Naranja', value: '#f97316', preview: '#f97316' },
  { name: 'Índigo', value: '#6366f1', preview: '#6366f1' },
];

export default function ConfiguracionPage() {
  const [openModal, setOpenModal] = useState(false);
  const { mode, toggleMode, primaryColor, setPrimaryColor, isDark } = useThemeContext();
  const [tempColor, setTempColor] = useState(primaryColor);

  const handleToggleMode = () => {
    toggleMode();
    toast.success(`Modo ${!isDark ? 'oscuro' : 'claro'} activado`);
  };

  const handleOpenModal = () => {
    setTempColor(primaryColor);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleSaveSettings = () => {
    setPrimaryColor(tempColor);
    setOpenModal(false);
    toast.success('Configuración guardada correctamente');
  };

  return (
    <Box>
      <Breadcrumb />
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Configuración
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Personaliza la apariencia de tu sistema
      </Typography>

      <Grid container spacing={3}>
        {/* Tarjeta de Apariencia */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PaletteIcon sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={600}>
                Apariencia
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Modo actual: <strong>{isDark ? 'Oscuro' : 'Claro'}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Color primario:{' '}
              <Chip
                label={colorPresets.find((c) => c.value === primaryColor)?.name || 'Personalizado'}
                size="small"
                sx={{ bgcolor: primaryColor, color: '#fff', fontWeight: 600 }}
              />
            </Typography>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={handleOpenModal}
              fullWidth
            >
              Abrir Configuración de Tema
            </Button>
          </Paper>
        </Grid>

        {/* Otras opciones futuras */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SettingsIcon sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={600}>
                Preferencias
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Más opciones de configuración próximamente...
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal de Configuración */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PaletteIcon sx={{ mr: 1.5 }} />
              <Typography variant="h6" fontWeight={600}>
                Personalizar Tema
              </Typography>
            </Box>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* Modo Oscuro/Claro */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Modo de Visualización
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isDark}
                  onChange={handleToggleMode}
                  icon={<BrightnessIcon />}
                  checkedIcon={<BrightnessIcon />}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BrightnessIcon fontSize="small" />
                  <Typography variant="body2">
                    {isDark ? 'Modo Oscuro' : 'Modo Claro'}
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Selección de Color Primario */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Color Primario
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {colorPresets.map(({ name, value, preview }) => (
                <Grid item xs={6} sm={4} key={value}>
                  <Paper
                    onClick={() => setTempColor(value)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: tempColor === value ? value : 'divider',
                      borderRadius: 2,
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: value,
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: 40,
                        bgcolor: preview,
                        borderRadius: 1,
                        mb: 1,
                      }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {name}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSaveSettings} variant="contained">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
