import React from 'react';
import '../styles/VistaInicioAdmin.css';
import { useNavigate } from 'react-router-dom';
// 👇 1. Importamos tu nueva pieza de Lego
import Header from './Shared/Header'; 

const VistaInicioAdmin = () => {
  const navigate = useNavigate();
  // (Ya no necesitamos useAuth ni useState aquí, ¡el Header se encarga de todo!)

  const menuItems = [
    { id: 1, title: 'USUARIOS', icon: '👤' },
    { id: 2, title: 'PROPIEDADES', icon: '🏠' },
    { id: 3, title: 'DASHBOARD', icon: '📊' },
    { id: 4, title: 'LEVANTAMIENTOS', icon: '📋', path: '/registro-propiedades' },
    { id: 5, title: 'COTIZACIONES', icon: '🧾' },
    { id: 6, title: 'NOTIFICACIONES', icon: '🔔' },
    { id: 7, title: 'PRODUCTOS', icon: '📦' },
  ];

  return (
    <div className="main-container">
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      {/* 👇 2. ¡BOOM! Toda tu barra superior, foto, y menú en una sola línea */}
      <Header rolTexto="ADMINISTRADOR" />

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

      <footer className="footer-watermark">
        <img src="/logo-faded.png" alt="Watermark" className="watermark-img" />
      </footer>
    </div>
  );
};

export default VistaInicioAdmin;