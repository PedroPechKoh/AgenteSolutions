import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../styles/TecnicoStyles/GaleriaReportes.css";
import logo from "../../assets/Logo4.png";
import { Settings, User, ArrowLeft, ClipboardList, FileText, Wrench, Plus } from 'lucide-react';

const GaleriaReportes = () => {
  const [navActivo, setNavActivo] = useState('TRABAJOS');
  const navigate = useNavigate();

  // Datos de ejemplo para las tarjetas
  const reportes = [
    { id: 1, img: "https://cdn-es.checklistfacil.com/estrategias-de-mantenimiento.webp", titulo: "REPORTE" },
    { id: 2, img: "https://todoferreteria.com.mx/wp-content/uploads/2022/12/plomero-entrada-01.png", titulo: "REPORTE" },
    { id: 3, img: "https://alfaservicioscr.com/wp-content/uploads/2024/07/Mantenimiento-electrico.webp", titulo: "REPORTE" },
  ];

  return (
    <div className="tt-container">
      {/* SIDEBAR */}
      <aside className="tt-sidebar">
        <div className="logo-section">
          <img src={logo} alt="Logo" className="main-logo" />
        </div>
        <div className="tt-nav">
          <button className={`tt-nav-btn ${navActivo === 'TRABAJOS' ? 'active' : ''}`} onClick={() => setNavActivo('TRABAJOS')}>
            <Wrench size={18} /> <span>TRABAJOS</span>
          </button>
          <button className={`tt-nav-btn ${navActivo === 'LEVANTAMIENTO' ? 'active' : ''}`} onClick={() => setNavActivo('LEVANTAMIENTO')}>
            <ClipboardList size={18} /> <span>LEVANTAMIENTO</span>
          </button>
          <button className={`tt-nav-btn ${navActivo === 'COTIZACIONES' ? 'active' : ''}`} onClick={() => setNavActivo('COTIZACIONES')}>
            <FileText size={18} /> <span>COTIZACIONES</span>
          </button>
        </div>
      </aside>

      <main className="tt-main">
        {/* HEADER */}
        <header className="tt-header">
          <div className="header-left" onClick={() => navigate(-1)}>
            <ArrowLeft size={35} strokeWidth={3} />
            <h2 className="header-title">MARIO</h2>
          </div>
          
          <h2 className="header-title">GALERIA</h2>

          <div className="header-right">
            <button className="btn-add-photo" onClick={() => navigate('/nuevo-reporte')}>
              <Plus size={30} strokeWidth={4} />
            </button>
            <Settings size={30} />
            <User size={30} />
          </div>
        </header>

        <div className="tt-orange-bar"></div>

        <div className="galeria-body">
          {/* Subheader con ID PROPIEDAD */}
          <div className="id-property-tag">
            <span>ID PROPIEDAD:</span>
            <strong>JDJF123</strong>
          </div>

          {/* Cuadrícula de Reportes */}
          <div className="gallery-grid">
            {reportes.map((reporte) => (
              <div key={reporte.id} className="gallery-card">
                <div className="card-image-container">
                  <img src={reporte.img} alt="Reporte" />
                </div>
                <div className="card-footer">
                  <span className="footer-title">{reporte.titulo}</span>
                  <button className="btn-footer-ver" onClick={() => navigate('/reporte-individual')}>
  VER
</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Barra de scroll lateral estética (como en tu imagen) */}
        <div className="side-scroll-bar"></div>
      </main>
    </div>
  );
};

export default GaleriaReportes;