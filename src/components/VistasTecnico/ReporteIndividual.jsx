import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../styles/TecnicoStyles/ReporteIndividual.css";
import logo from "../../assets/Logo4.png";;
import { Settings, User, ArrowLeft, ClipboardList, FileText, Wrench, Image as ImageIcon } from 'lucide-react';

const ReporteIndividual = () => {
  const [navActivo, setNavActivo] = useState('TRABAJOS');
  const navigate = useNavigate();

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
          <div className="header-left" onClick={() => navigate(-1)} style={{cursor: 'pointer'}}>
            <ArrowLeft size={35} strokeWidth={3} />
            <h2 className="header-title">MARIO</h2>
          </div>
          <h2 className="header-title">DETALLES</h2>
          <div className="header-right">
            <Settings size={30} />
            <User size={30} />
          </div>
        </header>

        <div className="tt-orange-bar"></div>

        <div className="report-detail-body">
          {/* Contenedor Principal Gris Oscuro */}
          <div className="report-main-card">
            
            {/* Contenedor Interior Gris Claro */}
            <div className="report-inner-content">
              <h3 className="report-label">REPORTE</h3>
              
              <div className="report-flex-container">
                {/* Cuadro de Imagen a la Izquierda */}
                <div className="report-image-box">
                  <ImageIcon size={100} strokeWidth={1} color="#333" />
                </div>

                {/* Cuadro de Información a la Derecha */}
                <div className="report-info-box">
                  {/* Aquí iría el texto o inputs del reporte */}
                </div>
              </div>

              {/* Botón Guardar Centrado */}
              <div className="report-footer">
                <button className="btn-guardar-reporte" onClick={() => navigate(-1)}>GUARDAR</button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ReporteIndividual;