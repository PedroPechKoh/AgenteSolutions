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

  // Función para redirigir a la vista de SOS
  const handleConfirmSOS = () => {
    navigate('/SOSView');
  };

  return (
    <div className="main-container">
      {/* Barras superiores de diseño */}
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      {/* Componente Header */}
      <Header rolTexto="CLIENTE" />

      {/* Sección de Búsqueda */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <input type="text" placeholder="BUSCAR" />
        </div>
      </div>
      
      {/* Cuadrícula de Menú Principal */}
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

      {/* --- SECCIÓN DEL BOTÓN SOS FLOTANTE --- */}
      <div className="sos-fixed-container">
        {showConfirm && (
          <div className="sos-confirm-bubble">
            <p>¿Necesitas asistencia inmediata?</p>
            <div className="sos-confirm-buttons">
              <button 
                onClick={handleConfirmSOS} 
                className="btn-confirm-yes"
              >
                SÍ
              </button>
              <button 
                onClick={() => setShowConfirm(false)} 
                className="btn-confirm-no"
              >
                NO
              </button>
            </div>
          </div>
        )}
        
        <button 
          className={`btn-sos-float ${showConfirm ? 'active' : ''}`}
          onClick={() => setShowConfirm(!showConfirm)}
          title="Botón de Emergencia"
        >
          <span className="sos-icon">🆘</span>
          <span className="sos-text">SOS</span>
        </button>
      </div>

      {/* Marca de agua / Footer */}
      <footer className="footer-watermark">
        <img src="/logo-faded.png" alt="Watermark" className="watermark-img" />
      </footer>
    </div>
  );
};

export default VistaInicioCliente;