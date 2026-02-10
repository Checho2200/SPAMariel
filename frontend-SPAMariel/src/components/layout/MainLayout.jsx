import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SpaIcon from '@mui/icons-material/Spa';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import HistoryIcon from '@mui/icons-material/History';
import { useAuth } from '../../hooks/useAuth';

const drawerWidth = 240;

// ─── Mixins ────────────────────────────────────────────
const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

// ─── Styled Components ─────────────────────────────────
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      },
    },
  ],
}));

// ─── Menú de navegación ────────────────────────────────
const secondaryItems = [
  { text: 'Configuración', icon: <SettingsIcon />, path: '/configuracion' },
];

export default function MainLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // Menú principal - filtrado por rol
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
    { text: 'Servicios', icon: <SpaIcon />, path: '/servicios' },
    { text: 'Citas', icon: <CalendarMonthIcon />, path: '/citas' },
    { text: 'Historial del Día', icon: <HistoryIcon />, path: '/historial-dia' },
    // Solo admins pueden ver Usuarios
    ...(user?.role === 'admin' ? [{ text: 'Usuarios', icon: <ManageAccountsIcon />, path: '/usuarios' }] : []),
  ];

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  const renderListItem = ({ text, icon, path }) => (
    <ListItem key={text} disablePadding sx={{ display: 'block' }}>
      <Tooltip title={!open ? text : ''} placement="right" arrow>
        <ListItemButton
          onClick={() => handleNavigate(path)}
          selected={isActive(path)}
          sx={[
            {
              minHeight: 48,
              px: 2.5,
              borderRadius: 0,
              mx: 0,
              mb: 0.5,
              position: 'relative',
              borderLeft: '3px solid transparent',
            },
            open ? { justifyContent: 'initial' } : { justifyContent: 'center' },
            isActive(path) && {
              backgroundColor: 'action.selected',
              borderLeftColor: 'primary.main',
              '& .MuiListItemIcon-root': { color: 'primary.main' },
              '& .MuiListItemText-primary': {
                color: 'primary.main',
                fontWeight: 700,
              },
            },
          ]}
        >
          <ListItemIcon
            sx={[
              { minWidth: 0, justifyContent: 'center' },
              open ? { mr: 3 } : { mr: 'auto' },
            ]}
          >
            {icon}
          </ListItemIcon>
          <ListItemText
            primary={text}
            sx={[open ? { opacity: 1 } : { opacity: 0 }]}
          />
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* ─── AppBar ──────────────────────────── */}
      <AppBar position="fixed" open={open} elevation={1} color="inherit">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menú"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[{ marginRight: 5 }, open && { display: 'none' }]}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap fontWeight={700} sx={{ flexGrow: 1 }}>
            SPA Mariel
          </Typography>

          {/* Info de usuario */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'primary.main',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ─── Drawer ──────────────────────────── */}
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />

        {/* Logo */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 0.5,
            px: 0.5,
            transition: 'all 0.3s ease',
          }}
        >
          <Box
            component="img"
            src="/MarielBeautySPA.png"
            alt="Mariel Beauty SPA"
            sx={{
              width: open ? 200 : 40,
              height: 'auto',
              objectFit: 'contain',
              transition: 'width 0.3s ease',
              borderRadius: 1,
            }}
          />
        </Box>
        <Divider />

        {/* Menú principal */}
        <List sx={{ flexGrow: 1, pt: 1 }}>
          {menuItems.map(renderListItem)}
        </List>

        <Divider />

        {/* Menú secundario */}
        <List>
          {secondaryItems.map(renderListItem)}

          {/* Logout */}
          <ListItem disablePadding sx={{ display: 'block' }}>
            <Tooltip title={!open ? 'Cerrar sesión' : ''} placement="right" arrow>
              <ListItemButton
                onClick={handleLogout}
                sx={[
                  {
                    minHeight: 48,
                    px: 2.5,
                    borderRadius: 0,
                    mx: 0,
                    mb: 0.5,
                    borderLeft: '3px solid transparent',
                    '&:hover': {
                      backgroundColor: 'error.lighter',
                      borderLeftColor: 'error.main',
                      '& .MuiListItemIcon-root': { color: 'error.main' },
                      '& .MuiListItemText-primary': { color: 'error.main' },
                    },
                  },
                  open ? { justifyContent: 'initial' } : { justifyContent: 'center' },
                ]}
              >
                <ListItemIcon
                  sx={[
                    { minWidth: 0, justifyContent: 'center' },
                    open ? { mr: 3 } : { mr: 'auto' },
                  ]}
                >
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Cerrar sesión"
                  sx={[open ? { opacity: 1 } : { opacity: 0 }]}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Drawer>

      {/* ─── Contenido principal ─────────────── */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        <Outlet />
      </Box>
    </Box>
  );
}
