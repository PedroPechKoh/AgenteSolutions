import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home } from 'lucide-react'; // ✅ Importamos el ícono de la casita
import logo from '../../assets/Logo3.png'; 
import NotificationBell from '../Shared/NotificationBell'; 

const Header = ({ rolTexto = "USUARIO" }) => {
  const { user, logoutGlobal } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleCerrarSesion = () => {
    logoutGlobal();
    navigate("/");
  };

  // ✅ Función para regresar al panel correcto según el tipo de usuario
  const irAlInicio = () => {
    if (!user) return;
    switch (Number(user.role_id)) {
      case 0: navigate('/VistaRoot'); break;
      case 1: navigate('/VistaAdmin'); break;
      case 2: navigate('/VistaTecnico'); break;
      case 3: navigate('/VistaInicioCliente'); break;
      default: navigate('/'); break;
    }
  };

  return (
    <header className="header-content">
      
      {/* SECCIÓN IZQUIERDA: Logo y Casita */}
      <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <img src={logo} alt="Logo" className="main-logo" />
        
        {/* NUEVO BOTÓN DE INICIO (Solo ícono, grande y visible) */}
        <button 
          onClick={irAlInicio}
          title="Ir al Inicio"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '5px',
            color: '#FF6600', // Color naranja para que resalte
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease-in-out' // Pequeña animación
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Home size={34} strokeWidth={2.5} />
        </button>
      </div>

      {/* SECCIÓN CENTRAL: Título */}
      <div className="center-title-section">
        <h1 className="welcome-title">
          BIENVENIDO {(user?.first_name || user?.name) ? (user.first_name || user.name).toUpperCase() : rolTexto}
        </h1>
      </div>

      {/* SECCIÓN DERECHA: Notificaciones y Perfil */}
      <div className="user-controls" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        
        <NotificationBell />

        <div style={{ position: "relative" }}>
          <button
            className="icon-btn"
            style={{ padding: 0, overflow: "hidden", display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%' }}
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Foto de perfil"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: '1.5rem' }}>👤</span>
            )}
          </button>

          {menuAbierto && (
            <div className="profile-dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => navigate("/mi-perfil")}
              >
                👤 Mi Perfil
              </button>
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item logout"
                onClick={handleCerrarSesion}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;