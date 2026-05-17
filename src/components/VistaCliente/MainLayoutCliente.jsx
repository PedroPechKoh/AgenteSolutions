import React from 'react';
import { useNavigate, Outlet, useLocation, useParams } from 'react-router-dom';
import "../../styles/Cliente/LayoutCliente.css";
import { User, ArrowLeft, Home, Bell, LayoutGrid, FileText, ChevronLeft, LayoutDashboard, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Shared/NotificationBell';
import logo from "../../assets/Logo4.png";

const MainLayoutCliente = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutGlobal } = useAuth();
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const userName = user?.first_name || user?.name || "Cliente";
  
  const { id: urlPropertyId } = useParams();
  
  // Estados para mantener los IDs sincronizados
  const [currentPropertyId, setCurrentPropertyId] = React.useState(localStorage.getItem('current_property_id'));
  const [currentLevantamientoId, setCurrentLevantamientoId] = React.useState(localStorage.getItem('current_levantamiento_id'));

  // Sincronizar cada vez que cambia la ruta O cuando se dispara el evento personalizado
  React.useEffect(() => {
    const syncIds = () => {
      const pId = localStorage.getItem('current_property_id');
      const lId = localStorage.getItem('current_levantamiento_id');
      
      // Si la URL tiene un ID de propiedad y es diferente al guardado, limpiamos el levantamiento 
      // para evitar "fantasmas" de la propiedad anterior mientras carga la nueva.
      if (urlPropertyId && urlPropertyId !== pId) {
        setCurrentLevantamientoId(null);
      } else {
        setCurrentLevantamientoId(lId);
      }
      
      setCurrentPropertyId(pId);
    };

    syncIds(); // Al montar y cambiar ruta
    
    window.addEventListener('sync-agente-ids', syncIds);
    return () => window.removeEventListener('sync-agente-ids', syncIds);
  }, [location.pathname, urlPropertyId]);
  
  // Priorizar el ID de la URL si estamos en un detalle y limpiar el prefijo 'prop_' si existe
  const cleanId = (id) => id ? id.toString().replace('prop_', '') : null;
  const effectivePropertyId = cleanId(urlPropertyId) || cleanId(currentPropertyId);

  // Rutas dinámicas basadas en el contexto sincronizado
  const detailPath = currentLevantamientoId ? `/detalle-reporte/${currentLevantamientoId}` : (effectivePropertyId ? `/detalle-reporte/prop_${effectivePropertyId}` : '/propiedades');
  const tableroPath = effectivePropertyId ? `/DetallePropiedad/${effectivePropertyId}` : '/propiedades';

  // Check if we are in a global route
  const globalRoutes = ['/propiedades', '/levantamientos', '/vista-cotizaciones', '/registro-propiedades'];
  const isGlobalRoute = globalRoutes.includes(location.pathname);

  const globalNavButtons = [
    { label: 'PROPIEDADES', path: '/propiedades', icon: <Home size={18} /> },
    { label: 'LEVANTAMIENTOS', path: '/levantamientos', icon: <LayoutDashboard size={18} /> },
    { label: 'COTIZACIONES', path: '/vista-cotizaciones', icon: <FileText size={18} /> },
  ];

  const propertyNavButtons = [
    { label: 'DETALLES PROPIEDAD', path: tableroPath, icon: <Home size={18} /> },
    { label: 'VER LEVANTAMIENTO', path: detailPath, icon: <FileText size={18} /> },
    { label: 'SOS', path: '/SOSView', icon: <Bell size={18} /> },
    { label: 'COTIZACIONES', path: '/vista-cotizaciones', icon: <FileText size={18} /> },
  ];

  const currentNavButtons = isGlobalRoute ? globalNavButtons : propertyNavButtons;

  const isHomeView = location.pathname === '/VistaInicioCliente';

  return (
    <div className="tt-container">
      {!isHomeView && (
        <>
          {isMobileMenuOpen && (
            <div 
              className="sidebar-backdrop" 
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
            />
          )}
          <aside className={`tt-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {isMobileMenuOpen && (
            <button className="btn-close-mobile" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} color="white" />
            </button>
          )}
  
          <div className="logo-section">
             <img src={logo} alt="Agente Logo" className="main-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/propiedades')} />
          </div>

          <div className="sidebar-search-wrapper">
            <div className="sidebar-search-input-container">
              <Search size={16} className="sidebar-search-icon" />
              <input 
                type="text" 
                placeholder="BUSCAR..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sidebar-search-input"
              />
            </div>
          </div>
  
          
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
        </>
      )}


      <main className="tt-main">
        <header className="tt-header">
          <div className="header-left-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="btn-menu-mobile" onClick={() => setIsMobileMenuOpen(true)} style={{ display: 'none' }}>
              <Menu size={28} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {!isGlobalRoute && (
                <button 
                  onClick={() => navigate('/propiedades')} 
                  className="btn-regresar-header-naranja"
                  style={{
                    backgroundColor: '#f26624',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(242, 102, 36, 0.2)'
                  }}
                >
                  <ArrowLeft size={16} /> REGRESAR
                </button>
              )}
              {!isGlobalRoute && (
                <span className="header-username-text" style={{ cursor: 'default' }}>
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
          {children || <Outlet context={{ searchTerm, setSearchTerm }} />}
        </div>
      </main>
    </div>
  );
};

export default MainLayoutCliente;