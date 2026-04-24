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

  // Redirección a la vista SOS
  const handleConfirmSOS = () => {
    navigate('/SOSView');
  };

  return (
    <div className="main-container">
      {/* Barras decorativas de marca */}
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      {/* Cabecera */}
      <Header rolTexto="CLIENTE" />

      {/* Buscador */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <input type="text" placeholder="BUSCAR" />
        </div>
      </div>
      
      {/* Grid de opciones principales */}
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

      {/* --- BOTÓN SOS LATERAL (CENTRO-DERECHA) --- */}
      <div className="sos-sidebar-wrapper">
        {showConfirm && (
          <div className="sos-confirm-tooltip">
            <p className="sos-confirm-text">¿CONFIRMAR EMERGENCIA?</p>
            <div className="sos-confirm-btns">
              <button onClick={handleConfirmSOS} className="sos-confirm-yes">SÍ</button>
              <button onClick={() => setShowConfirm(false)} className="sos-confirm-no">NO</button>
            </div>
          </div>
        )}
        
        <button 
          className={`sos-btn-main ${showConfirm ? 'active' : ''}`}
          onClick={() => setShowConfirm(!showConfirm)}
        >
          <span className="sos-btn-icon">🆘</span>
          <span className="sos-btn-text">SOS</span>
        </button>
      </div>

      {/* Footer con marca de agua */}
      <footer className="footer-watermark">
        <img src="/logo-faded.png" alt="Watermark" className="watermark-img" />
      </footer>
    </div>
  );
};

export default VistaInicioCliente;