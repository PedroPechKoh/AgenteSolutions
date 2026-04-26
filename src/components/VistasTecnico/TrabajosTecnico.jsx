import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import "../../styles/TecnicoStyles/TrabajosTecnico.css";
import { Search, Package, Wrench, CheckCircle2, Lock } from 'lucide-react';
import Header from "../Shared/Header";

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

  const { user } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [checklistDinamico, setChecklistDinamico] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar estado de material desde localStorage (específico por usuario)
    if (user?.id) {
      const status = localStorage.getItem(`materialRecibido_${user.id}`);
      if (status === 'true') setMaterialRecibido(true);
      fetchServicios();
      fetchChecklistTemplate();
    }
  }, [user]);

  const fetchServicios = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/tecnico/${user.id}/servicios`);
      setServicios(res.data);
    } catch (error) {
      console.error("Error al obtener trabajos:", error);
    }
  };

  const fetchChecklistTemplate = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/checklist-templates`);
      // Buscamos un template que se llame "Confirmación de Material" o similar
      const template = res.data.find(t => t.name.toLowerCase().includes('material') || t.name.toLowerCase().includes('recepción'));
      if (template) {
        setChecklistDinamico(template.content);
        // Inicializar itemsCheck según el contenido del template
        setItemsCheck({
          materiales: new Array(template.content.materiales?.length || 0).fill(false),
          equipo: new Array(template.content.equipo?.length || 0).fill(false)
        });
      }
    } catch (error) {
      console.error("Error al obtener templates:", error);
    }
  };

  // Usar el dinámico si existe, si no el hardcoded
  const checklistARenderizar = checklistDinamico || checklistGeneral;

  // Filtrar servicios por tab
  const serviciosFiltrados = servicios.filter(s => {
    const status = s.status?.toLowerCase();
    if (tabActual === 'ASIGNADOS') return status !== 'completed' && status !== 'finalizado' && status !== 'in_progress';
    if (tabActual === 'EN PROCESO') return status === 'in_progress';
    if (tabActual === 'FINALIZADOS') return status === 'completed' || status === 'finalizado';
    return true;
  });

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
    if (user?.id) {
      localStorage.setItem(`materialRecibido_${user.id}`, 'true');
    }
    setMostrarModalChecklist(false);
  };

  return (
    <>
    <Header />
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
          {serviciosFiltrados.length > 0 ? (
            serviciosFiltrados.map((item, index) => (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <button 
                  type="button"
                  className="tt-row-button" 
                  onClick={() => {
                    if (materialRecibido) {
                      // Si el servicio tiene un checklist personalizado, vamos allá
                      if (item.custom_checklist) {
                        navigate(`/Checklist/${item.id}`);
                      } else {
                        navigate(`/trabajo-propiedad/${item.id}`);
                      }
                    }
                  }}
                  disabled={!materialRecibido}
                >
                  <div className="tt-grid-system">
                    <span className="col-text">{item.id}</span>
                    <span className="col-text">{item.property_name || "Sin Nombre"}</span>
                    <span className="col-text">{new Date(item.scheduled_start || item.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
              </motion.div>
            ))
          ) : (
            <div className="empty-state-msg">No hay trabajos en esta sección.</div>
          )}
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
                    {checklistARenderizar.materiales.map((m, i) => (
                      <label key={i} className={`check-item ${itemsCheck.materiales[i] ? 'checked' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={itemsCheck.materiales[i]} 
                          onChange={() => toggleItem('materiales', i)}
                        />
                        <span>{typeof m === 'string' ? m : m.nombre || m.task}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="checklist-section">
                  <h4><Wrench size={14} /> Equipo</h4>
                  <div className="items-check-grid">
                    {checklistARenderizar.equipo.map((e, i) => (
                      <label key={i} className={`check-item ${itemsCheck.equipo[i] ? 'checked' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={itemsCheck.equipo[i]} 
                          onChange={() => toggleItem('equipo', i)}
                        />
                        <span>{typeof e === 'string' ? e : e.nombre || e.task}</span>
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
    </>
  );
};

export default TrabajosTecnico;