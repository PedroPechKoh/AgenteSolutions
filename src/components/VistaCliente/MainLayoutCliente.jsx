import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import "../../styles/Cliente/LayoutCliente.css";
import { User, ArrowLeft, Home, Bell, LayoutGrid, FileText, ChevronLeft, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Shared/NotificationBell';
import logo from "../../assets/Logo4.png";

const MainLayoutCliente = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutGlobal } = useAuth();
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  // Safe user name retrieval
  const userName = user?.first_name || user?.name || "Cliente";

  // Recuperamos los IDs guardados para mantener el contexto de la propiedad
  const savedPropertyId = localStorage.getItem('current_property_id');
  const savedLevantamientoId = localStorage.getItem('current_levantamiento_id');
  
  // Rutas dinámicas basadas en el contexto guardado
  const detailPath = savedLevantamientoId ? `/detalle-reporte/${savedLevantamientoId}` : '/propiedades';
  const tableroPath = savedPropertyId ? `/DetallePropiedad/${savedPropertyId}` : '/propiedades';

  // Check if we are in a global route
  const globalRoutes = ['/propiedades', '/levantamientos', '/vista-cotizaciones', '/registro-propiedades'];
  const isGlobalRoute = globalRoutes.includes(location.pathname);

  const globalNavButtons = [
    { label: 'PROPIEDADES', path: '/propiedades', icon: <Home size={18} /> },
    { label: 'LEVANTAMIENTOS', path: '/levantamientos', icon: <LayoutDashboard size={18} /> },
    { label: 'COTIZACIONES', path: '/vista-cotizaciones', icon: <FileText size={18} /> },
  ];

  const propertyNavButtons = [
    { label: 'DETALLES PROPIEDAD', path: detailPath, icon: <Home size={18} /> },
    { label: 'VER TABLERO', path: tableroPath, icon: <LayoutDashboard size={18} /> },
    { label: 'SOS', path: '/SOSView', icon: <Bell size={18} /> },
    { label: 'COTIZACIONES', path: '/vista-cotizaciones', icon: <FileText size={18} /> },
  ];

  const currentNavButtons = isGlobalRoute ? globalNavButtons : propertyNavButtons;

  const isHomeView = location.pathname === '/VistaInicioCliente';

  return (
    <div className="tt-container">
      {!isHomeView && (
        <aside className={`tt-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {isMobileMenuOpen && (
            <button className="btn-close-mobile" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} color="white" />
            </button>
          )}
  
          <div className="logo-section">
             <img src={logo} alt="Agente Logo" className="main-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/propiedades')} />
          </div>
  
          {/* Botón Volver - Solo visible en detalles de propiedad */}
          {!isGlobalRoute && (
            <button className="tt-nav-btn btn-volver-sidebar" onClick={() => navigate(-1)} style={{ marginBottom: '20px', backgroundColor: '#444', color: 'white' }}>
               <ChevronLeft size={18} /> <span>VOLVER</span>
            </button>
          )}
          
          <div className="tt-nav">
            {currentNavButtons.map((btn) => (
              <button 
                key={btn.label}
                className={`tt-nav-btn ${location.pathname === btn.path ? 'active' : ''}`} 
                onClick={() => navigate(btn.path)}
              >
                {btn.icon} <span>{btn.label}</span>
              </button>
            ))}
          </div>
        </aside>
      )}


      <main className="tt-main">
        <header className="tt-header">
          <div className="header-left-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="btn-menu-mobile" onClick={() => setIsMobileMenuOpen(true)} style={{ display: 'none' }}>
              <Menu size={28} />
            </button>
            <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ArrowLeft size={28} strokeWidth={3} className="header-arrow" />
              {!isGlobalRoute && (
                <span className="header-username-text">
                  {userName}
                </span>
              )}
            </div>
          </div>

          {isGlobalRoute && (
            <div className="center-title-section">
               <h2 className="header-welcome-message">
                 Hola {(userName || "Cliente").toUpperCase()}. Gracias por trabajar con nosotros.
               </h2>
            </div>
          )}
          
          <div className="header-right-group">
            <div className="header-actions-wrapper">
               <NotificationBell />
            </div>
            
            <div style={{ position: "relative" }}>
              <button
                className="icon-btn"
                style={{ padding: 0, overflow: "hidden", display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #eee' }}
                onClick={() => setMenuAbierto(!menuAbierto)}
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt="Foto de perfil"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <User size={22} color="#666" />
                )}
              </button>

              {menuAbierto && (
                <div className="profile-dropdown-menu" style={{ position: 'absolute', right: 0, top: '50px', background: 'white', border: '1px solid #ccc', borderRadius: '8px', zIndex: 1000, minWidth: '150px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <button
                    className="dropdown-item"
                    onClick={() => { setMenuAbierto(false); navigate("/mi-perfil"); }}
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '10px 15px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <User size={16} /> Mi Perfil
                  </button>
                  <div className="dropdown-divider" style={{ borderBottom: '1px solid #eee', margin: '5px 0' }}></div>
                  <button
                    className="dropdown-item logout"
                    onClick={() => { logoutGlobal(); navigate("/"); }}
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '10px 15px', cursor: 'pointer', color: 'red', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="tt-orange-bar"></div>

        <div className="tt-body">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default MainLayoutCliente;