import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../styles/TrabajoPropiedad.css';
import { Search, X, MapPin, Phone, User } from 'lucide-react';

const TrabajoPropiedad = () => {
  const [tabActual, setTabActual] = useState('ASIGNADOS');
  const [showModalFinalizar, setShowModalFinalizar] = useState(false);
  const [showModalCliente, setShowModalCliente] = useState(false);
  const navigate = useNavigate();

  const trabajos = [
    { folio: "1234", desc: "CAMBIO DE FOCOS ...", fecha: "06-02-2026" },
    { folio: "1235", desc: "REPARACIÓN AIRE ...", fecha: "07-02-2026" },
    { folio: "1236", desc: "MANTENIMIENTO ...", fecha: "08-02-2026" },
  ];

  // Datos dummy del cliente
  const datosCliente = {
    nombre: "Juan Pérez",
    recibe: "María García",
    telefono: "999-123-4567",
    ubicacion: "Calle 60 x 57 Centro, Mérida"
  };

  return (
    <>
      <div className="tt-body-inner">
        {/* BUSCADOR */}
        <div className="tt-search-wrapper">
          <input type="text" className="tt-search-input" placeholder="Buscar..." />
          <Search className="search-icon-inside" size={20} />
        </div>

        {/* ID DE PROPIEDAD Y BOTÓN FINALIZAR */}
        <div className="tt-id-actions-row">
          <button className="id-prop-button" onClick={() => setShowModalCliente(true)}>
            <span className="id-label-pill">ID PROPIEDAD:</span>
            <span className="id-value-text">JDJF123</span>
          </button>
          
          <button className="btn-finalizar-main" onClick={() => setShowModalFinalizar(true)}>
            FINALIZAR
          </button>
        </div>

        {/* TABS ACTUALIZADOS */}
        <div className="tt-tabs-outer">
          {['ASIGNADOS', 'GUARDADOS'].map((tab) => (
            <button 
              key={tab}
              className={`tt-tab ${tabActual === tab ? 'active' : 'inactive'}`}
              onClick={() => setTabActual(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TABLA */}
        <div className="tt-table-box">
          <div className="tt-grid-system header-grid">
            <div className="tt-col-header">FOLIO</div>
            <div className="tt-col-header">DESCRIPCIÓN</div>
            <div className="tt-col-header">FECHA</div>
          </div>

          <div className="tt-scroll-area">
            {trabajos.map((item, index) => (
              <motion.div 
                key={index}
                className="tt-row-card"
                onClick={() => navigate('/trabajo-inicio')}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                whileTap={{ scale: 0.98 }} 
              >
                <div className="tt-grid-system">
                  <span className="col-text">{item.folio}</span>
                  <span className="col-text">{item.desc}</span>
                  <span className="col-text">{item.fecha}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <button className="btn-venta-cruzada-footer" onClick={() => navigate('/venta-cruzada')}>
          AGREGAR VENTA CRUZADA
        </button>
      </div>

      {/* MODAL: FINALIZAR (VERIFICACIÓN) */}
      <AnimatePresence>
        {showModalFinalizar && (
          <div className="modal-overlay">
            <motion.div className="modal-content" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <div className="modal-header-orange">¡LISTO!</div>
              <p className="modal-text">Enviado para verificación</p>
              <button className="modal-btn-close" onClick={() => setShowModalFinalizar(false)}>ACEPTAR</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DATOS DEL CLIENTE */}
      <AnimatePresence>
        {showModalCliente && (
          <div className="modal-overlay">
            <motion.div className="modal-content-large" initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }}>
              <div className="modal-close-icon" onClick={() => setShowModalCliente(false)}><X size={24}/></div>
              <h3 className="modal-title-black">Detalles del Cliente</h3>
              <div className="cliente-info-grid">
                <div className="info-item"><User size={18}/> <strong>Cliente:</strong> {datosCliente.nombre}</div>
                <div className="info-item"><User size={18}/> <strong>Recibe:</strong> {datosCliente.recibe}</div>
                <div className="info-item"><Phone size={18}/> <strong>Teléfono:</strong> {datosCliente.telefono}</div>
                <div className="info-item-full"><MapPin size={18}/> <strong>Ubicación GPS:</strong> {datosCliente.ubicacion}</div>
              </div>
              <button className="btn-gps-map">VER EN MAPA</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TrabajoPropiedad;