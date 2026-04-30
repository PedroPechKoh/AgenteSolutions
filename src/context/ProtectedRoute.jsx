import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext'; 

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role_id)) {
    return <h1>Acceso Denegado. No tienes permisos para ver esta sección.</h1>; 
  }

  return children ? children : <Outlet />;
};


export default ProtectedRoute;