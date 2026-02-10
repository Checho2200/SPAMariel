import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import AdminRoute from '../components/layout/AdminRoute';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ConfiguracionPage from '../pages/ConfiguracionPage';
import ClientesPage from '../pages/ClientesPage';
import CitasPage from '../pages/CitasPage';
import ServiciosPage from '../pages/ServiciosPage';
import UsuariosPage from '../pages/UsuariosPage';
import HistorialDiaPage from '../pages/HistorialDiaPage';

/**
 * Layout raíz que provee el AuthContext a todo el árbol de rutas.
 * createBrowserRouter renderiza componentes fuera del árbol de App,
 * por lo que AuthProvider debe vivir aquí dentro.
 */
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

/**
 * Data Router de React Router v7.
 * Estructura:
 * /login          → LoginPage (pública)
 * /*              → ProtectedRoute → MainLayout → páginas internas
 * /usuarios       → ProtectedRoute → AdminRoute → MainLayout → UsuariosPage (solo admin)
 */
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              {
                path: '/',
                element: <DashboardPage />,
              },
              {
                path: '/clientes',
                element: <ClientesPage />,
              },
              {
                path: '/citas',
                element: <CitasPage />,
              },
              {
                path: '/historial-dia',
                element: <HistorialDiaPage />,
              },
              {
                path: '/servicios',
                element: <ServiciosPage />,
              },
              {
                path: '/configuracion',
                element: <ConfiguracionPage />,
              },
              // Rutas de administrador
              {
                element: <AdminRoute />,
                children: [
                  {
                    path: '/usuarios',
                    element: <UsuariosPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/login" replace />,
      },
    ],
  },
]);

export default router;
