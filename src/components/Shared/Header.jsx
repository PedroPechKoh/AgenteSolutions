import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo3.png'; 
import NotificationBell from '../Shared/NotificationBell'; 

const Header = ({ rolTexto = "USUARIO" }) => {
  const { user, logoutGlobal } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleCerrarSesion = () => {
    logoutGlobal();
    navigate("/");
  };

  return (
    <header className="header-content">
      <div className="logo-section">
        <img src={logo} alt="Logo" className="main-logo" />
      </div>

      <div className="center-title-section">
        <h1 className="welcome-title">BIENVENIDO</h1>
        <h2 className="welcome-subtitle">
          {user?.name ? user.name.toUpperCase() : rolTexto}
        </h2>
      </div>

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