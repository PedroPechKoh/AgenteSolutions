import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../styles/TecnicoStyles/Checklist.css";
import logo from "../../assets/Logo4.png";
import { ArrowLeft, Settings, User, Wrench, ClipboardList, FileText } from 'lucide-react';

const CheckList = () => {
  const navigate = useNavigate();
  const [navActivo] = useState('TRABAJOS');
  
  // 1. EL ESTADO DEBE COINCIDIR CON LAS LLAVES DEL OBJETO ABAJO
  const [seccionActiva, setSeccionActiva] = useState('HERRAMIENTAS');

  // 2. DATOS DE EJEMPLO INTEGRADOS
  const [items, setItems] = useState({
    HERRAMIENTAS: [
      { id: 'h1', nombre: "MULTÍMETRO DIGITAL", completado: false },
      { id: 'h2', nombre: "JUEGO DE DESTORNILLADORES", completado: false },
      { id: 'h3', nombre: "PINZAS DE PUNTA Y CORTE", completado: false }
    ],
    EQUIPO: [ // Esta es la llave para "EQUIPO DE TRABAJO"
      { id: 'e1', nombre: "CASCO DIELECTRICO", completado: false },
      { id: 'e2', nombre: "GUANTES DE SEGURIDAD", completado: false },
      { id: 'e3', nombre: "CHALECO REFLEJANTE", completado: false }
    ],
    MATERIAL: [
      { id: 'm1', nombre: "CABLE CALIBRE 12", completado: false },
      { id: 'm2', nombre: "CINTA AISLANTE", completado: false },
      { id: 'm3', nombre: "CONECTORES", completado: false }
    ]
  });

  const handleToggle = (id) => {
    const nuevosItems = { ...items };
    nuevosItems[seccionActiva] = nuevosItems[seccionActiva].map(item => 
      item.id === id ? { ...item, completado: !item.completado } : item
    );
    setItems(nuevosItems);
  };

  return (
    <div className="tt-container">
      <aside className="tt-sidebar">
        <div className="logo-section"><img src={logo} alt="Logo" className="main-logo" /></div>
        <div className="tt-nav">
          <button className={`tt-nav-btn ${navActivo === 'TRABAJOS' ? 'active' : ''}`}><Wrench size={18} /> <span>TRABAJOS</span></button>
          <button className="tt-nav-btn"><ClipboardList size={18} /> <span>LEVANTAMIENTO</span></button>
          <button className="tt-nav-btn"><FileText size={18} /> <span>COTIZACIONES</span></button>
        </div>
      </aside>

      <main className="tt-main">
        <header className="tt-header">
          <div className="tt-header-left" onClick={() => navigate(-1)}>
            <div className="tt-back-circle"><ArrowLeft size={25} strokeWidth={3} color="black" /></div>
            <h2 className="tt-user-name">MARIO</h2>
          </div>
          <h2 className="tt-page-title">CHECK LIST</h2>
          <div className="tt-header-icons"><Settings size={30} /><User size={30} /></div>
        </header>

        <div className="tt-orange-bar"></div>

        <div className="cl-body">
          {/* NAVEGACIÓN DE PESTAÑAS (TABS) */}
          <div className="cl-tabs-container">
            <button 
              className={`cl-tab ${seccionActiva === 'HERRAMIENTAS' ? 'active' : ''}`}
              onClick={() => setSeccionActiva('HERRAMIENTAS')}
            >
              HERRAMIENTAS
            </button>
            <button 
              className={`cl-tab ${seccionActiva === 'EQUIPO' ? 'active' : ''}`}
              onClick={() => setSeccionActiva('EQUIPO')}
            >
              EQUIPO DE TRABAJO
            </button>
            <button 
              className={`cl-tab ${seccionActiva === 'MATERIAL' ? 'active' : ''}`}
              onClick={() => setSeccionActiva('MATERIAL')}
            >
              MATERIAL
            </button>
          </div>

          <div className="cl-main-card">
            <div className="cl-list-wrapper">
              <div className="cl-scroll-area">
                {items[seccionActiva].map((item) => (
                  <div 
                    key={item.id} 
                    className={`cl-item-row ${item.completado ? 'item-checked' : ''}`}
                    onClick={() => handleToggle(item.id)}
                  >
                    <div className="cl-check-box">
                      <input type="checkbox" className="cl-native-check" checked={item.completado} readOnly />
                    </div>
                    <div className="cl-item-text">{item.nombre}</div>
                  </div>
                ))}
              </div>
              <div className="cl-black-bar"></div>
            </div>
          </div>

          <div className="cl-footer">
            <button className="cl-btn-siguiente" onClick={() => navigate('/detalleTrabajo')}>SIGUIENTE</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckList;