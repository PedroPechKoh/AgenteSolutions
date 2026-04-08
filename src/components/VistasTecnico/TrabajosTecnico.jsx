import React, { useState } from 'react'; // Eliminado useEffect para evitar el error
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../styles/TrabajosTecnico.css';
import { Search, Package, Wrench, CheckCircle2, Lock } from 'lucide-react';

const TrabajosTecnico = () => {
  const [tabActual, setTabActual] = useState('ASIGNADOS');
  const [mostrarModalChecklist, setMostrarModalChecklist] = useState(false);
  
  // Estado para controlar si el material fue recibido
  const [materialRecibido, setMaterialRecibido] = useState(false);
  
  // Estado para los items individuales del checklist
  const [itemsCheck, setItemsCheck] = useState({
    materiales: [false, false, false, false],
    equipo: [false, false, false, false]
  });

  const navigate = useNavigate();

  const trabajos = [
    { folio: "1234", id: "JDJF123", fecha: "06-02-2026" },
    { folio: "1234", id: "JDJF123", fecha: "06-02-2026" },
    { folio: "1234", id: "JDJF123", fecha: "06-02-2026" },
  ];

  const checklistGeneral = {
    materiales: ["Foco LED 12W", "Cable Calibre 12 (5m)", "Cinta de aislar", "Socket cerámico"],
    equipo: ["Multímetro", "Escalera de tijera", "Taladro inalámbrico", "Kit de desarmadores"]
  };

  const toggleItem = (tipo, index) => {
    const nuevosItems = { ...itemsCheck };
    nuevosItems[tipo][index] = !nuevosItems[tipo][index];
    setItemsCheck(nuevosItems);
  };

  const todoMarcado = [...itemsCheck.materiales, ...itemsCheck.equipo].every(item => item === true);

  const confirmarRecepcion = () => {
    setMaterialRecibido(true);
    setMostrarModalChecklist(false);
  };

  return (
    <div className="tt-body">
      <div className="tt-search-row">
        <div className="tt-search-wrapper">
          <input type="text" className="tt-search-input" placeholder="Buscar..." />
          <Search className="search-icon-inside" size={22} />
        </div>
        
        <button 
          className={`btn-open-checklist ${materialRecibido ? 'recibido' : 'pendiente'}`}
          onClick={() => setMostrarModalChecklist(true)}
        >
          {materialRecibido ? <CheckCircle2 size={20} /> : <Package size={20} />}
          <span>{materialRecibido ? "MATERIAL LISTO" : "LISTA DE RUTA"}</span>
        </button>
      </div>

      <div className="tt-tabs-header-container" style={{ width: '85%', maxWidth: '1100px', margin: '0 auto' }}>
        <h3 className="section-title-visitas">
          TRABAJOS {!materialRecibido && <span className="lock-text"><Lock size={14}/> Bloqueado</span>}
        </h3>
        <div className="tt-tabs-outer">
          {['ASIGNADOS', 'EN PROCESO', 'FINALIZADOS'].map((tab) => (
            <button 
              key={tab}
              className={`tt-tab ${tabActual === tab ? 'active' : 'inactive'}`}
              onClick={() => setTabActual(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className={`tt-table-box ${!materialRecibido ? 'table-locked' : ''}`}>
        <div className="tt-grid-system header-grid">
          <div className="tt-col-header">FOLIO</div>
          <div className="tt-col-header">ID PROPIEDAD</div>
          <div className="tt-col-header">FECHA</div>
        </div>

        <div className="tt-scroll-area">
          {trabajos.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <button 
                type="button"
                className="tt-row-button" 
                onClick={() => materialRecibido && navigate('/trabajo-propiedad')}
                disabled={!materialRecibido}
              >
                <div className="tt-grid-system">
                  <span className="col-text">{item.folio}</span>
                  <span className="col-text">{item.id}</span>
                  <span className="col-text">{item.fecha}</span>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
        {!materialRecibido && (
          <div className="lock-overlay-msg">Debe confirmar recepción de material para desbloquear</div>
        )}
      </div>

      <AnimatePresence>
        {mostrarModalChecklist && (
          <div className="tt-modal-overlay">
            <motion.div 
              className="tt-modal-content"
              initial={{ scale: 0.9, opacity: 0 }} // Usamos motion aquí
              animate={{ scale: 1, opacity: 1 }}   // Usamos motion aquí
              exit={{ scale: 0.9, opacity: 0 }}    // Usamos motion aquí
            >
              <div className="tt-modal-header">
                <h3>📦 CONFIRMACIÓN DE MATERIAL</h3>
                {!materialRecibido && <span className="pills-alert">Obligatorio</span>}
              </div>
              
              <div className="tt-modal-body">
                <p className="modal-instruction">Marque los elementos que ya tiene en su unidad:</p>
                
                <div className="checklist-section">
                  <h4><Package size={14} /> Materiales</h4>
                  <div className="items-check-grid">
                    {checklistGeneral.materiales.map((m, i) => (
                      <label key={i} className={`check-item ${itemsCheck.materiales[i] ? 'checked' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={itemsCheck.materiales[i]} 
                          onChange={() => toggleItem('materiales', i)}
                        />
                        <span>{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="checklist-section">
                  <h4><Wrench size={14} /> Equipo</h4>
                  <div className="items-check-grid">
                    {checklistGeneral.equipo.map((e, i) => (
                      <label key={i} className={`check-item ${itemsCheck.equipo[i] ? 'checked' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={itemsCheck.equipo[i]} 
                          onChange={() => toggleItem('equipo', i)}
                        />
                        <span>{e}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="tt-modal-footer">
                <button 
                  className={`btn-confirmar ${todoMarcado ? 'ready' : 'disabled'}`}
                  disabled={!todoMarcado}
                  onClick={confirmarRecepcion}
                >
                  {todoMarcado ? "CONFIRMAR Y DESBLOQUEAR" : "FALTA MARCAR MATERIAL"}
                </button>
                <button className="btn-cancelar-modal" onClick={() => setMostrarModalChecklist(false)}>
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrabajosTecnico;