import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export default function LoginForm({ onSubmit, loading }) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', password: '' },
  });

  return (
    <Fade in timeout={300}>
      <Paper
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 420,
          mx: 'auto',
          p: 4,
          borderRadius: 2,
          bgcolor: 'white',
          border: '1px solid',
          borderColor: 'rgba(236,72,153,0.1)',
        }}
      >
        {/* Encabezado */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: 'rgba(236,72,153,0.08)',
              mb: 2,
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 32, color: '#ec4899' }} />
          </Box>
          <Typography
            variant="h5"
            fontWeight={600}
            sx={{ color: '#1f2937', mb: 0.5 }}
          >
            Iniciar Sesión
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#6b7280' }}
          >
            Ingresa tus credenciales para acceder al sistema
          </Typography>
        </Box>

        {/* Email */}
        <TextField
          fullWidth
          label="Correo Electrónico"
          type="email"
          autoComplete="email"
          autoFocus
          error={!!errors.email}
          helperText={errors.email?.message}
          sx={{ mb: 2 }}
          {...register('email', {
            required: 'El correo es obligatorio',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Correo no válido',
            },
          })}
        />

        {/* Password */}
        <TextField
          fullWidth
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          error={!!errors.password}
          helperText={errors.password?.message}
          sx={{ mb: 3 }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    sx={{ color: '#6b7280' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          {...register('password', {
            required: 'La contraseña es obligatoria',
            minLength: {
              value: 6,
              message: 'Mínimo 6 caracteres',
            },
          })}
        />

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            py: 1.5,
            borderRadius: 1,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            bgcolor: '#ec4899',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            '&:hover': {
              bgcolor: '#db2777',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            },
            '&:disabled': {
              bgcolor: '#fda4af',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: '#fff' }} />
          ) : (
            'Iniciar Sesión'
          )}
        </Button>
      </Paper>
    </Fade>
  );
}
