import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import "../../styles/TecnicoStyles/DetalleTrabajo.css";
import { User, Image as ImageIcon, CheckCircle } from 'lucide-react';

const DetalleTrabajo = () => {
  const navigate = useNavigate();
  
  // ESTADO PARA EL MODAL
  const [mostrarModal, setMostrarModal] = useState(false);

  const equipo = [
    { id: '12345', area: 'ELECTRICISTA' },
    { id: '54321', area: 'PLOMERO' },
    { id: '67890', area: 'TÉCNICO HVAC' },
  ];

  // FUNCIÓN AL DAR CLIC EN GUARDAR
  const manejarGuardar = () => {
    setMostrarModal(true);
    // Se cierra solo después de 2.5 segundos
    setTimeout(() => {
      setMostrarModal(false);
    }, 2500);
  };

  return (
    <>
      <div className="details-body">
        <div className="details-card">

          {/* FILA SUPERIOR */}
          <div className="details-top-row">
            <div className="info-pill">
              <span className="pill-label">FOLIO</span>
              <span className="pill-value">1234</span>
            </div>

            <div className="info-pill">
              <span className="pill-label">ID PROPIEDAD</span>
              <span className="pill-value">JDJF123</span>
            </div>
          </div>

          {/* GRID CENTRAL */}
          <div className="details-middle-grid">
            <div className="desc-box">
              <span className="box-label">DESCRIPCIÓN</span>
              <div className="custom-scrollbar-content">
                {/* Contenido dinámico aquí */}
              </div>
            </div>

            <div className="photo-placeholder">
              <ImageIcon size={60} strokeWidth={1.5} />
            </div>

            <div className="team-section">
              <div className="team-header-pill">EQUIPO DE TRABAJO</div>
              <div className="team-container">
                <div className="team-list">
                  {equipo.map((member) => (
                    <div key={member.id} className="team-member-card">
                      <div className="member-avatar">
                        <User size={20} />
                      </div>
                      <div className="member-info">
                        <p>ID: {member.id}</p>
                        <p>ÁREA: {member.area}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* GRID INFERIOR */}
          <div className="details-bottom-grid">
            <div className="reports-box">
              <div className="reports-column">
                <span className="box-label-reports">REPORTES</span>
                <button
                  type="button"
                  className="btn-ver-mas"
                  onClick={() => navigate('/galeria-reportes')}
                >
                  VER MÁS
                </button>
              </div>
              <div className="photo-placeholder-small">
                <ImageIcon size={50} strokeWidth={1.5} />
              </div>
            </div>

            <div className="dates-and-action">
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
                <button 
                  type="button" 
                  className="btn-guardar"
                  onClick={manejarGuardar}
                >
                  GUARDAR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      <AnimatePresence>
        {mostrarModal && (
          <div className="modal-overlay-save">
            <motion.div 
              className="modal-content-save"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <CheckCircle size={50} color="#E68A4B" />
              <h3>¡LISTO!</h3>
              <p>Cambios guardados correctamente</p>
              <button 
                className="btn-aceptar-modal" 
                onClick={() => setMostrarModal(false)}
              >
                ACEPTAR
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DetalleTrabajo;