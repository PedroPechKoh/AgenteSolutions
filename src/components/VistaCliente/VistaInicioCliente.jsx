// VistaInicioCliente.jsx
import React, { useState } from 'react';
import '../../styles/VistaInicioAdmin.css';
import { useNavigate } from 'react-router-dom';
import Header from '../Shared/Header';

const VistaInicioCliente = () => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const menuItems = [
    { id: 1, title: 'PROPIEDADES', icon: '🏠', path: '/propiedades' },
    { id: 2, title: 'LEVANTAMIENTOS', icon: '📋', path: '/levantamientos' },
    { id: 3, title: 'COTIZACIONES', icon: '🧾', path: '/vista-cotizaciones' },
  ];

  const handleConfirmSOS = () => {
    navigate('/SOSView');
  };

  return (
    <div className="main-container">
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      <Header rolTexto="CLIENTE" />

      <div className="search-section">
        <div className="search-input-wrapper">
          <input type="text" placeholder="BUSCAR" />
        </div>
      </div>
      
      <div className="admin-grid">
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            className="menu-card"
            onClick={() => {
              if (item.path) {
                navigate(item.path);
              }
            }}
          >
            <div className="card-inner">
              <span className="card-icon-large">{item.icon}</span>
              <span className="card-title">{item.title}</span>
            </div>
          </div>
        ))}
      </div>

      {/* --- BOTÓN SOS MEJORADO --- */}
      <div className="sos-container">
        <div className={`sos-confirm-popup ${showConfirm ? 'visible' : ''}`}>
          <p className="sos-confirm-title">⚠️ ¿CONFIRMAR EMERGENCIA?</p>
          <div className="sos-confirm-buttons">
            <button onClick={handleConfirmSOS} className="sos-btn-yes">SÍ, ACTIVAR</button>
            <button onClick={() => setShowConfirm(false)} className="sos-btn-no">CANCELAR</button>
          </div>
        </div>
        
        <button 
          className={`sos-main-button ${showConfirm ? 'active' : ''}`}
          onClick={() => setShowConfirm(!showConfirm)}
        >
          <span className="sos-icon-animated">🆘</span>
          <span className="sos-button-text">SOS</span>
        </button>
      </div>

      <footer className="footer-watermark">
        <img src="/logo-faded.png" alt="Watermark" className="watermark-img" />
      </footer>
    </div>
  );
};

export default VistaInicioCliente;