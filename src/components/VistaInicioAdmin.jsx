import React from 'react';
import '../styles/VistaInicioAdmin.css';
import { useNavigate } from 'react-router-dom';
import Header from './Shared/Header'; 

const VistaInicioAdmin = () => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 1, title: 'USUARIOS', icon: '👤',  path: '/usuarios'}, 
    { id: 2, title: 'PROPIEDADES', icon: '🏠',  path: '/propiedades' },
    { id: 3, title: 'DASHBOARD', icon: '📊',  path: '/dashboard'},
    { id: 4, title: 'LEVANTAMIENTOS', icon: '📋', path: '/levantamientos' },
    { id: 5, title: 'COTIZACIONES', icon: '🧾' , path: '/vista-cotizaciones'},
    { id: 6, title: 'PRODUCTOS', icon: '📦', path: '/vista-producto' },
    { id: 7, title: 'BODEGA', icon: '🏭', path: '/bodeguero' },
    { id: 8, title: 'PERSONALIZAR', icon: '🎨', path: '/customize-login' },
    
   
  ];

  return (
    <div className="main-container">
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      <Header rolTexto="ADMINISTRADOR" />


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