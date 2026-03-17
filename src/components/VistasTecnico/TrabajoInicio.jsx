import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../../styles/TecnicoStyles/TrabajoInicio.css';
import logo from "../../assets/Logo4.png";
import { ArrowLeft, Settings, User, Wrench, ClipboardList, FileText } from 'lucide-react';

const TrabajoInicio = () => {
  const [navActivo, setNavActivo] = useState('TRABAJOS');
  const navigate = useNavigate();
  
  const { id } = useParams();
  const [servicio, setServicio] = useState(null);

  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:8000/api/servicios/${id}`)
        .then(response => {
          setServicio(response.data);
        })
        .catch(error => console.error("Error trayendo el detalle del trabajo:", error));
    }
  }, [id]);

  const formatFecha = (fecha) => {
    if (!fecha) return 'Pendiente';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX');
  };

  if (!servicio) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}><h2>Cargando detalles del trabajo...</h2></div>;
  }

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
        <header className="tt-header">
          <div 
            style={{display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer'}} 
            onClick={() => navigate(-1)} 
          >
            <div className="tt-back-circle">
              <ArrowLeft size={25} strokeWidth={3} color="black" />
            </div>
            <h2 style={{fontStyle: 'italic', fontWeight: 900, fontSize: '30px', margin: 0}}>MARIO</h2>
          </div>
          <h2 style={{fontStyle: 'italic', fontWeight: 900, fontSize: '30px', margin: 0}}>DETALLES</h2>
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <Settings size={30} />
            <User size={30} />
          </div>
        </header>

        <div className="tt-orange-bar"></div>

        <div className="tt-body">
          <div className="tt-main-card">
            <div className="tt-top-info-group">
              {servicio.property?.client?.name && (
                <div className="tt-bubble-info">
                  <span>PROPIEDAD DE:</span>
                  <strong>{servicio.property.client.name}</strong>
                </div>
              )}
              <div className="tt-bubble-info"><span>FOLIO</span><strong>{servicio.id}</strong></div>
              <div className="tt-bubble-info"><span>ID PROPIEDAD:</span><strong>{servicio.property?.custom_curp || servicio.property_id || 'Sin ID'}</strong></div>
              <div className="tt-bubble-info"><span>FECHA REGISTRO</span><strong>{formatFecha(servicio.created_at)}</strong></div>
            </div>

            <div className="tt-detail-layout">
              <div className="tt-detail-left">
                <div className="tt-label-pill">DESCRIPCIÓN</div>
                <div className="tt-description-box" style={{ padding: '15px' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>{servicio.description}</p>
                </div>
                <div className="tt-dates-container">
                  <div className="tt-bubble-info"><span>FECHA DE INICIO</span><strong>{formatFecha(servicio.scheduled_start)}</strong></div>
                  <div className="tt-bubble-info"><span>FECHA DE VENCIMIENTO</span><strong>{formatFecha(servicio.scheduled_end)}</strong></div>
                </div>
              </div>

              <div className="tt-detail-right">
                <div className="tt-label-pill">EQUIPO DE TRABAJO</div>
                <div className="tt-team-container">
                  <div className="tt-team-scroll">
                      <div className="tt-member-card">
                        <div className="tt-member-avatar"><User size={20} /></div>
                        <div className="tt-member-data">
                          <p>ID TÉCNICO: {servicio.assigned_to}</p>
                          <p>AREA: TÉCNICO</p>
                        </div>
                      </div>
                  </div>
                  <div className="tt-custom-scrollbar"></div>
                </div>
              </div>
            </div>

            <div className="tt-footer-actions">
              <button 
                className="tt-btn-action orange" 
                onClick={() => navigate(`/checklist/${servicio.id}`)} 
              >
                INICIAR
              </button>
              <button className="tt-btn-action purple">AGENDAR</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrabajoInicio;