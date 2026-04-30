import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import "../../styles/Cliente/LayoutCliente.css";
import { Settings, User, ArrowLeft, Home, Bell, LayoutGrid, FileText, ChevronLeft, LayoutDashboard } from 'lucide-react';
import logo from "../../assets/Logo4.png";

const MainLayoutCliente = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const userData = JSON.parse(localStorage.getItem('agente_session'))?.userData;
  const userName = userData?.name || "CLIENTE";

  // Intentamos extraer el ID de la propiedad de la URL actual para los botones contextuales
  const matchId = location.pathname.match(/\d+$/);
  const currentId = matchId ? matchId[0] : null;
  
  // Rutas dinámicas basadas en la propiedad actual
  const detailPath = currentId ? `/detalle-reporte/${currentId}` : '/propiedades';
  const tableroPath = currentId ? `/DetallePropiedad/${currentId}` : '/propiedades';


  const navButtons = [
    { label: 'DETALLES PROPIEDAD', path: detailPath, icon: <Home size={18} /> },
    { label: 'VER TABLERO', path: tableroPath, icon: <LayoutDashboard size={18} /> },
    { label: 'SOS', path: '/SOSView', icon: <Bell size={18} /> },
    { label: 'COTIZACIONES', path: '/Cotizaciones', icon: <FileText size={18} /> },
  ];

  return (
    <div className="tt-container">
      <aside className="tt-sidebar">
        <div className="logo-section">
           <img src={logo} alt="Agente Logo" className="main-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/propiedades')} />
        </div>

        {/* Botón Volver */}
        <button className="tt-nav-btn btn-volver-sidebar" onClick={() => navigate(-1)} style={{ marginBottom: '20px', backgroundColor: '#444', color: 'white' }}>
           <ChevronLeft size={18} /> <span>VOLVER</span>
        </button>
        
        <div className="tt-nav">
          {navButtons.map((btn) => (
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

      <main className="tt-main">
        <header className="tt-header">
          <div className="header-left-group" onClick={() => navigate(-1)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowLeft size={35} strokeWidth={3} />
            <h2 className="header-title">{userName?.toUpperCase() || "CLIENTE"}</h2>
          </div>
          
          <div className="header-right-group" style={{ display: 'flex', gap: '15px' }}>
            <Settings size={30} />
            <User size={30} />
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