import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home } from 'lucide-react'; // Importamos el ícono de casita
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

  // Función para determinar la ruta de inicio según el rol
  const irAlInicio = () => {
    if (!user) return;
    switch (user.role_id) {
      case 0: navigate('/VistaRoot'); break; // Root
      case 1: navigate('/VistaAdmin'); break; // Admin
      case 2: navigate('/VistaTecnico'); break; // Técnico
      case 3: navigate('/VistaCliente'); break; // Cliente
      default: navigate('/'); break;
    }
  };

  return (
    <header className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', position: 'relative' }}>
      
      {/* SECCIÓN IZQUIERDA: Logo y Botón de Inicio */}
      <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <img src={logo} alt="Logo" className="main-logo" style={{ height: '50px' }} />
        
        {/* NUEVO BOTÓN DE INICIO */}
        <button 
          onClick={irAlInicio}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f0f0f0',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            color: '#333',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
        >
          <Home size={18} />
        </button>
      </div>

      {/* SECCIÓN CENTRAL: Foto de Perfil + Título */}
      <div className="center-title-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
        
        {/* BOTÓN DE PERFIL (Movido al centro) */}
        <div style={{ position: "relative", marginBottom: '5px' }}>
          <button
            className="icon-btn"
            style={{ 
              padding: 0, 
              overflow: "hidden", 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '50px', // Un poco más grande para que destaque en el centro
              height: '50px', 
              borderRadius: '50%',
              border: '2px solid #FF6600', // Un borde naranja para que resalte
              cursor: 'pointer',
              backgroundColor: '#eee'
            }}
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

          {/* Menú Desplegable del Perfil */}
          {menuAbierto && (
            <div 
              className="profile-dropdown-menu" 
              style={{ 
                position: 'absolute', 
                top: '60px', 
                left: '50%', 
                transform: 'translateX(-50%)', // Centra el menú debajo de la foto
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '8px',
                padding: '10px',
                zIndex: 1000,
                minWidth: '150px'
              }}
            >
              <button
                className="dropdown-item"
                onClick={() => navigate("/mi-perfil")}
                style={{ width: '100%', padding: '10px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                👤 Mi Perfil
              </button>
              <div style={{ height: '1px', backgroundColor: '#eee', margin: '5px 0' }}></div>
              <button
                className="dropdown-item logout"
                onClick={handleCerrarSesion}
                style={{ width: '100%', padding: '10px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          )}
        </div>

        {/* Título de Bienvenida */}
        <h1 className="welcome-title" style={{ margin: 0, fontSize: '1.8rem', textAlign: 'center' }}>
          BIENVENIDO {(user?.first_name || user?.name) ? (user.first_name || user.name).toUpperCase() : rolTexto}
        </h1>
      </div>

      {/* SECCIÓN DERECHA: Notificaciones */}
      <div className="user-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <NotificationBell />
      </div>

    </header>
  );
};

export default Header;