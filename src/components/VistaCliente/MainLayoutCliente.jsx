import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import "../../styles/Cliente/LayoutCliente.css";
import { Settings, User, ArrowLeft, Home, Bell, LayoutGrid, FileText } from 'lucide-react';

const MainLayoutCliente = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navButtons = [
    { label: 'PROPIEDADES', path: '/inicio', icon: <Home size={18} /> },
    { label: 'SOS', path: '/sos', icon: <Bell size={18} /> },
    { label: 'COTIZACIONES', path: '/vista-cotizaciones', icon: <FileText size={18} /> },

  ];

  return (
    <div className="tt-container">
      <aside className="tt-sidebar">
        <div className="logo-section">
        </div>
        
        <div className="tt-nav">
          {navButtons.map((btn) => (
            <button 
              key={btn.path}
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
            <h2 className="header-title">JOSE</h2>
          </div>
          
          <div className="header-right-group" style={{ display: 'flex', gap: '15px' }}>
            <Settings size={30} />
            <User size={30} />
          </div>
        </header>
        
        <div className="tt-orange-bar"></div>

        <div className="tt-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayoutCliente;