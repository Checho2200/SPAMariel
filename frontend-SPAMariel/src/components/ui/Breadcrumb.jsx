import { Link as RouterLink, useLocation } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import Box from '@mui/material/Box';

const pathNameMap = {
  '/': 'Dashboard',
  '/clientes': 'Clientes',
  '/citas': 'Citas',
  '/servicios': 'Servicios',
  '/usuarios': 'Usuarios',
  '/configuracion': 'Configuración',
};

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Si estamos en el dashboard raíz, no mostrar breadcrumb
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 1 }}
      >
        {/* Icono Home sin texto */}
        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          color="inherit"
          sx={{
            display: 'flex',
            alignItems: 'center',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <HomeIcon fontSize="small" />
        </Link>

        {/* Páginas intermedias y actual */}
        {pathnames.map((value, index) => {

          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = pathNameMap[to] || value;

          return isLast ? (
            <Typography
              key={to}
              sx={{ color: 'text.primary', fontWeight: 600 }}
            >
              {label}
            </Typography>
          ) : (
            <Link
              key={to}
              component={RouterLink}
              to={to}
              underline="hover"
              color="inherit"
              sx={{ '&:hover': { color: 'primary.main' } }}
            >
              {label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
