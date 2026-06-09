import React from 'react';
import { useNavigate, Outlet, useLocation, useParams } from 'react-router-dom';
import "../../styles/Cliente/LayoutCliente.css";
import { User, ArrowLeft, Home, Bell, LayoutGrid, FileText, ChevronLeft, LayoutDashboard, Menu, X, Search, Facebook, Instagram, Twitter, Youtube, Phone, Mail, Globe, MapPin, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Shared/NotificationBell';
import defaultLogo from "../../assets/Logo4.png";
import axios from "axios";

const MainLayoutCliente = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutGlobal } = useAuth();
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const fullName = `${user?.first_name || user?.name || 'Cliente'} ${user?.last_name || ''}`.trim();
  
  const [appLogo, setAppLogo] = React.useState(defaultLogo);
  const [sidebarLinks, setSidebarLinks] = React.useState([]);

  const { id: urlPropertyId } = useParams();
  
  // Estados para mantener los IDs sincronizados
  const [currentPropertyId, setCurrentPropertyId] = React.useState(localStorage.getItem('current_property_id'));
  const [currentLevantamientoId, setCurrentLevantamientoId] = React.useState(localStorage.getItem('current_levantamiento_id'));

  const fetchDynamicSettings = async () => {
    try {
      const resSettings = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/login-settings`);
      if (resSettings.data.success && resSettings.data.settings.appLogo) {
        setAppLogo(resSettings.data.settings.appLogo);
      }
      
      const resLinks = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/sidebar-links`);
      if (resLinks.data.success && resLinks.data.links) {
        setSidebarLinks(resLinks.data.links);
      }
    } catch (error) {
      console.error("Error fetching dynamic sidebar settings", error);
    }
  };

  React.useEffect(() => {
    fetchDynamicSettings();
    window.addEventListener('settings-updated', fetchDynamicSettings);
    return () => window.removeEventListener('settings-updated', fetchDynamicSettings);
  }, []);

  // Sincronizar cada vez que cambia la ruta O cuando se dispara el evento personalizado
  React.useEffect(() => {
    const syncIds = () => {
      const pId = localStorage.getItem('current_property_id');
      const lId = localStorage.getItem('current_levantamiento_id');
      
      if (urlPropertyId && urlPropertyId !== pId) {
        setCurrentLevantamientoId(null);
      } else {
        setCurrentLevantamientoId(lId);
      }
      setCurrentPropertyId(pId);
    };

    syncIds();
    window.addEventListener('sync-agente-ids', syncIds);
    return () => window.removeEventListener('sync-agente-ids', syncIds);
  }, [location.pathname, urlPropertyId]);
  
  const cleanId = (id) => id ? id.toString().replace('prop_', '') : null;
  const isReportRoute = location.pathname.includes('/detalle-reporte');
  const effectivePropertyId = isReportRoute ? cleanId(currentPropertyId) : (cleanId(urlPropertyId) || cleanId(currentPropertyId));
  const tableroPath = effectivePropertyId ? `/DetallePropiedad/${effectivePropertyId}` : '/propiedades';
  
  const globalRoutes = ['/propiedades', '/levantamientos', '/vista-cotizaciones', '/registro-propiedades'];
  const isGlobalRoute = globalRoutes.includes(location.pathname);
  const isHomeView = location.pathname === '/VistaInicioCliente';

  const getIconComponent = (iconName) => {
    switch(iconName) {
      case 'Facebook': return <Facebook size={18} />;
      case 'Instagram': return <Instagram size={18} />;
      case 'Twitter': return <Twitter size={18} />;
      case 'TikTok': return <Globe size={18} />; // Alternativa si no existe logo de Tiktok
      case 'Youtube': return <Youtube size={18} />;
      case 'Phone': return <Phone size={18} />;
      case 'Mail': return <Mail size={18} />;
      case 'Globe': return <Globe size={18} />;
      case 'MapPin': return <MapPin size={18} />;
      default: return <LinkIcon size={18} />;
    }
  };

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
             <img src={appLogo} alt="Agente Logo" className="main-logo" style={{ cursor: 'pointer', objectFit: 'contain' }} onClick={() => navigate('/propiedades')} />
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
            {sidebarLinks.map((link) => (
              <button 
                key={link.id}
                className="tt-nav-btn" 
                onClick={() => window.open(link.url, '_blank')}
              >
                {getIconComponent(link.icon)} <span>{link.label}</span>
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
            </div>
          </div>

          {isGlobalRoute && (
            <div className="center-title-section">
               <h2 className="header-welcome-message">
                 Hola {(user?.first_name || user?.name || "Cliente").toUpperCase()}. Gracias por trabajar con nosotros.
               </h2>
            </div>
          )}
          
          <div className="header-right-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="header-actions-wrapper">
               <NotificationBell />
            </div>
            
            <div className="user-profile-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!isGlobalRoute && (
                <span className="header-username-text" style={{ cursor: 'default', fontWeight: 'bold', fontSize: '0.95rem', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                  {fullName}
                </span>
              )}
              <div style={{ position: "relative" }}>
                <button
                  className="icon-btn"
                  style={{ padding: 0, overflow: "hidden", display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #f26624' }}
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
                <>
                  <div 
                    className="profile-backdrop" 
                    onClick={() => setMenuAbierto(false)} 
                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999 }} 
                  />
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
                </>
              )}
            </div>
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