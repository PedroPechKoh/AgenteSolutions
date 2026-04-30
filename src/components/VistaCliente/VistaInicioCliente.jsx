import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Cliente/VistaInicioCliente.css';

const VistaInicioCliente = () => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 1, title: 'PROPIEDADES', icon: '🏠',  path: '/propiedades' },
    { id: 2, title: 'LEVANTAMIENTOS', icon: '📋', path: '/levantamientos-cliente' },
    { id: 3, title: 'COTIZACIONES', icon: '🧾' , path: '/Cotizaciones'},
  ];

  return (
    <div className="inicio-cliente-wrap">
      <div className="inicio-grid">
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            className="inicio-card"
            onClick={() => navigate(item.path)}
          >
            <span className="inicio-card-icon">{item.icon}</span>
            <span className="inicio-card-title">{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VistaInicioCliente;