import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import LoginForm from '../components/ui/LoginForm';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import { useAuth } from '../hooks/useAuth';
import SpaIcon from '@mui/icons-material/Spa';

export default function LoginPage() {
  const { login, loading, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Limpiar errores al desmontar
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
      navigate('/', { replace: true });
    } catch {
      // El error ya se maneja en el contexto
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        px: 2,
      }}
    >
      <AnimatedBackground />

      {/* Branding corporativo */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 1.5,
          mb: 4,
          borderRadius: 2,
          bgcolor: 'white',
          border: '1px solid',
          borderColor: 'rgba(236,72,153,0.15)',
        }}
      >
        <SpaIcon sx={{ fontSize: 32, color: '#ec4899' }} />
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ color: '#1f2937', letterSpacing: '-0.01em' }}
        >
          SPA Mariel
        </Typography>
      </Paper>

      <LoginForm onSubmit={handleLogin} loading={loading} />

      {/* Footer */}
      <Typography
        variant="caption"
        sx={{ mt: 4, color: 'rgba(31,41,55,0.5)' }}
      >
        © {new Date().getFullYear()} SPA Mariel — Sistema de Gestión
      </Typography>
    </Box>
  );
}
