import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import "../../styles/TecnicoStyles/TrabajoInicio.css";
import { User } from 'lucide-react';

const TrabajoInicio = () => {
  const navigate = useNavigate();

    const { id } = useParams();

  const trabajo = {
    folio: "1234",
    propiedadId: "JDJF123",
    fecha: "06-02-2026",
    fechaInicio: "12-02-2026",
    fechaVencimiento: "12-02-2026",
    descripcion: "Sin descripción disponible."
  };

  const equipo = [
    { id: "12345", area: "ELECTRICISTA" },
    { id: "67890", area: "PLOMERO" },
    { id: "54321", area: "TÉCNICO HVAC" },
    { id: "11223", area: "PINTOR" },
  ];

  return (
    <div className="tt-body-full">
      <div className="tt-main-card-large">
        
        {/* BURBUJAS SUPERIORES - SIN LOGO AQUÍ */}
        <div className="tt-top-info-group">
          <div className="tt-bubble-info">
            <span>FOLIO</span>
            <strong>{trabajo.folio}</strong>
          </div>
          <div className="tt-bubble-info">
            <span>ID PROPIEDAD</span>
            <strong>{trabajo.propiedadId}</strong>
          </div>
          <div className="tt-bubble-info">
            <span>FECHA</span>
            <strong>{trabajo.fecha}</strong>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="tt-detail-layout">
          
          {/* IZQUIERDA */}
          <div className="tt-detail-left">
            <div className="tt-label-pill">DESCRIPCIÓN</div>
            <div className="tt-description-box">
              <p>{trabajo.descripcion}</p>
            </div>

            <div className="tt-dates-row">
              <div className="tt-bubble-info white-bg">
                <span>FECHA DE INICIO</span>
                <strong>{trabajo.fechaInicio}</strong>
              </div>
              <div className="tt-bubble-info white-bg">
                <span>FECHA DE VENCIMIENTO</span>
                <strong>{trabajo.fechaVencimiento}</strong>
              </div>
            </div>
          </div>

          {/* DERECHA */}
          <div className="tt-detail-right">
            <div className="tt-label-pill">EQUIPO DE TRABAJO</div>
            <div className="tt-team-container">
              <div className="tt-team-scroll">
                {equipo.map((miembro, index) => (
                  <div key={index} className="tt-member-card">
                    <div className="tt-member-avatar">
                      <User size={22} color="#000" />
                    </div>
                    <div className="tt-member-data">
                      <p>ID: {miembro.id}</p>
                      <p>ÁREA: {miembro.area}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Línea negra sólida de scroll */}
              <div className="tt-black-scroll-line"></div>
            </div>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="tt-footer-actions">
          <button className="tt-btn-action orange" onClick={() => navigate('/Checklist/' + id)}>
            INICIAR
          </button>
          <button className="tt-btn-action purple" onClick={() => navigate('/agendar')}>
            AGENDAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrabajoInicio;