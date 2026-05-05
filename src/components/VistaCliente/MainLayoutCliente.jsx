import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import "../../styles/Cliente/LayoutCliente.css";
import { Settings, User, ArrowLeft, Home, Bell, LayoutGrid, FileText, ChevronLeft, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Shared/NotificationBell';
import logo from "../../assets/Logo4.png";

const MainLayoutCliente = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutGlobal } = useAuth();
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const userName = user?.first_name || user?.name || "CLIENTE";

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
    { label: 'PROPIEDADES', path: '/propiedades', icon: <Home size={18} /> },
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
        <header className="tt-header" style={{ padding: '0 30px', height: '70px' }}>
          <div className="header-left-group" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <ArrowLeft size={28} strokeWidth={3} className="header-arrow" />
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#000', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {isGlobalRoute ? 'AGENTE SOLUTIONS' : userName}
              </h2>
            </div>
          </div>

          {!isGlobalRoute && (
            <div className="center-title-section" style={{ flexGrow: 1, textAlign: 'center', display: 'none' }}>
               <h2 className="header-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#666' }}>
                 Dashboard de Propiedad
               </h2>
            </div>
          )}
          
          <div className="header-right-group" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '15px', background: '#f5f5f5', padding: '5px 15px', borderRadius: '30px', border: '1px solid #eee' }}>
              <Settings size={22} className="icon-gray" style={{ cursor: 'pointer' }} onClick={() => navigate('/ajustes')} />
              <NotificationBell />
            </div>
            
            <div style={{ position: "relative" }}>
              <button
                className="icon-btn"
                style={{ padding: 0, overflow: "hidden", display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', height: '45px', borderRadius: '50%', border: '2px solid #F26522', boxShadow: '0 2px 10px rgba(242, 101, 34, 0.2)' }}
                onClick={() => setMenuAbierto(!menuAbierto)}
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt="Foto de perfil"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <User size={24} color="#F26522" />
                )}
              </button>

              {menuAbierto && (
                <div className="profile-dropdown-menu" style={{ position: 'absolute', right: 0, top: '55px', background: 'white', border: '1px solid #ccc', borderRadius: '12px', zIndex: 1000, minWidth: '180px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  <div style={{ padding: '15px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{userName}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>{user?.email}</p>
                  </div>
                  <button
                    className="dropdown-item"
                    onClick={() => { setMenuAbierto(false); navigate("/mi-perfil"); }}
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '12px 15px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <User size={16} /> Mi Perfil
                  </button>
                  <button
                    className="dropdown-item logout"
                    onClick={() => { logoutGlobal(); navigate("/"); }}
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '12px 15px', cursor: 'pointer', color: 'red', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid #eee' }}
                  >
                    <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="tt-orange-bar" style={{ height: '4px' }}></div>

        <div className="tt-body">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default MainLayoutCliente;