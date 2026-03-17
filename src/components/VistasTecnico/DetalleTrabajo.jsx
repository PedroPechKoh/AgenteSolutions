import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../styles/TecnicoStyles/DetalleTrabajo.css";
import logo from "../../assets/Logo4.png";
import { Settings, User, ArrowLeft, ClipboardList, FileText, Wrench, Image as ImageIcon } from 'lucide-react';

const DetalleTrabajo = () => {
  const [navActivo, setNavActivo] = useState('TRABAJOS');
  const navigate = useNavigate();

  return (
    <div className="tt-container">
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
        <header className="tt-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '50px', cursor: 'pointer' }}
            onClick={() => navigate(-1)}>
            <ArrowLeft size={35} strokeWidth={3} />
            <h2 className="header-title">MARIO</h2>
          </div>
          <h2 className="header-title">DETALLES</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Settings size={30} />
            <User size={30} />
          </div>
        </header>

        <div className="tt-orange-bar"></div>

        <div className="details-body">
          <div className="details-card">
            
            <div className="details-top-row">
              <div className="info-pill">
                <span className="pill-label">FOLIO</span>
                <span className="pill-value">1234</span>
              </div>
              <div className="info-pill">
                <span className="pill-label">ID PROPIEDAD:</span>
                <span className="pill-value">JDJF123</span>
              </div>
            </div>

            <div className="details-middle-grid">
              <div className="desc-box">
                <span className="box-label">DESCRIPCIÓN</span>
                <div className="custom-scrollbar-content"></div>
              </div>

              <div className="photo-placeholder">
                <ImageIcon size={60} strokeWidth={1.5} />
              </div>

              {/* Título de equipo ahora está fuera del contenedor gris para poder subirlo */}
              <div className="team-section">
                <div className="team-header-pill">EQUIPO DE TRABAJO</div>
                <div className="team-container">
                  <div className="team-list">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="team-member-card">
                        <div className="member-avatar"><User size={20} /></div>
                        <div className="member-info">
                          <p>ID: 12345</p>
                          <p>ÁREA: ELECTRICISTA</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

           {/* Fila Inferior: Reportes y Fechas */}
<div className="details-bottom-grid">
  <div className="reports-box">
    <div className="reports-column">
       <span className="box-label-reports">REPORTES</span>
       <button 
  className="btn-ver-mas" 
  onClick={() => navigate('/galeria-reportes')}
>
  VER MAS
</button>
    </div>
    <div className="photo-placeholder-small">
      <ImageIcon size={50} strokeWidth={1.5} />
    </div>
  </div>

  <div className="dates-and-action">
    {/* ... resto del código de fechas y botones que ya tienes ... */}
    <div className="dates-row">
      <div className="date-pill">
        <span className="date-label">FECHA DE INICIO</span>
        <span className="date-value">12-02-2026</span>
      </div>
      <div className="date-pill">
        <span className="date-label">FECHA DE VENCIMIENTO</span>
        <span className="date-value">12-02-2026</span>
      </div>
    </div>
    
    <div className="action-buttons-container">
      <button className="btn-guardar">GUARDAR</button>
      <button className="btn-finalizar">FINALIZAR</button>
    </div>
  </div>
</div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DetalleTrabajo;