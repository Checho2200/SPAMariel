import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Guard de ruta para administradores: redirige a / si el usuario no es admin.
 * Requiere que ProtectedRoute esté en el nivel superior.
 */
export default function AdminRoute() {
  const { user } = useAuth();

  // Si no es admin, redirigir al dashboard
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}
