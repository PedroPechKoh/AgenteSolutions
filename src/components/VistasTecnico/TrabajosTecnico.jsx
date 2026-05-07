import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import "../../styles/TecnicoStyles/TrabajosTecnico.css";
import { 
  Search, Package, Wrench, CheckCircle2, Lock, Settings, 
  Calendar, Clock, MapPin, AlertTriangle, ChevronRight 
} from 'lucide-react';
import Header from "../Shared/Header";

const TrabajosTecnico = () => {
  const [tabActual, setTabActual] = useState('ASIGNADOS');
  const [mostrarModalChecklist, setMostrarModalChecklist] = useState(false);
  
  // Estado para controlar si el material fue recibido
  const [materialRecibido, setMaterialRecibido] = useState(false);
  
  // Estado para los items individuales del checklist
  const [itemsCheck, setItemsCheck] = useState({
    materiales: [false, false, false, false],
    equipo: [false, false, false, false],
    herramientas: [false, false, false, false]
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
      if (res.data && res.data.length > 0) {
        // Intentamos buscar uno de "materiales", si no, agarramos el primero disponible ("Checklist asigando")
        const template = res.data.find(t => 
          t.name.toLowerCase().includes('material') || 
          t.name.toLowerCase().includes('recepción')
        ) || res.data[0];

        if (template) {
          const content = typeof template.content === 'string' ? JSON.parse(template.content) : template.content;
          setChecklistDinamico(content);
          
          // Inicializar itemsCheck según el contenido del template
          setItemsCheck({
            materiales: new Array(content.materiales?.length || content.material?.length || 0).fill(false),
            equipo: new Array(content.equipo?.length || 0).fill(false),
            herramientas: new Array(content.herramientas?.length || 0).fill(false)
          });
        }
      }
    } catch (error) {
      console.error("Error al obtener templates:", error);
    }
  };

  const checklistGeneral = {
    materiales: ["Foco LED 12W", "Cable Calibre 12 (5m)", "Cinta de aislar", "Socket cerámico"],
    equipo: ["Multímetro", "Escalera de tijera", "Taladro inalámbrico", "Kit de desarmadores"],
    herramientas: []
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

  const agruparServicios = (items) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const grupos = {
      'ATRASADOS': [],
      'HOY': [],
      'MAÑANA': [],
      'ESTA SEMANA': [],
      'PRÓXIMOS': []
    };

    items.forEach(s => {
      const fechaServicio = new Date(s.scheduled_start || s.created_at);
      fechaServicio.setHours(0, 0, 0, 0);

      if (fechaServicio.getTime() < hoy.getTime()) {
        grupos['ATRASADOS'].push(s);
      } else if (fechaServicio.getTime() === hoy.getTime()) {
        grupos['HOY'].push(s);
      } else if (fechaServicio.getTime() === manana.getTime()) {
        grupos['MAÑANA'].push(s);
      } else {
        const diff = (fechaServicio.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
        if (diff <= 7) grupos['ESTA SEMANA'].push(s);
        else grupos['PRÓXIMOS'].push(s);
      }
    });

    return Object.entries(grupos).filter(([_, val]) => val.length > 0);
  };

  const serviciosAgrupados = agruparServicios(serviciosFiltrados);

  const toggleItem = (tipo, index) => {
    const nuevosItems = { ...itemsCheck };
    nuevosItems[tipo][index] = !nuevosItems[tipo][index];
    setItemsCheck(nuevosItems);
  };

  const todoMarcado = [
    ...itemsCheck.materiales, 
    ...itemsCheck.equipo, 
    ...itemsCheck.herramientas
  ].every(item => item === true);

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

      <div className={`tt-board-container ${!materialRecibido ? 'table-locked' : ''}`}>
        <div className="tt-scroll-area">
          {serviciosAgrupados.length > 0 ? (
            serviciosAgrupados.map(([nombreGrupo, items], gIndex) => (
              <div key={nombreGrupo} className={`tt-date-group ${nombreGrupo === 'ATRASADOS' ? 'is-overdue' : ''}`}>
                <div className="tt-group-header">
                  {nombreGrupo === 'ATRASADOS' ? <AlertTriangle size={16} /> : <Calendar size={16} />}
                  <span>{nombreGrupo}</span>
                  <span className="tt-group-count">{items.length}</span>
                </div>
                
                <div className="tt-cards-grid">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="tt-card-wrapper"
                    >
                      <button 
                        type="button"
                        className={`tt-task-card ${item.priority === 'Urgente' ? 'is-sos' : ''}`}
                        onClick={() => {
                          if (materialRecibido) {
                            if (item.custom_checklist) navigate(`/Checklist/${item.id}`);
                            else navigate(`/trabajo-propiedad/${item.id}`);
                          }
                        }}
                        disabled={!materialRecibido}
                      >
                        {/* Columna 1: Folio y SOS */}
                        <div className="tt-col tt-col-folio">
                          <span className="tt-folio-badge">#{item.id}</span>
                          {item.priority === 'Urgente' && (
                            <span className="tt-sos-tag"><AlertTriangle size={12}/> SOS</span>
                          )}
                        </div>
                        
                        {/* Columna 2: Propiedad */}
                        <div className="tt-col tt-col-main">
                          <h4 className="tt-property-title">{item.property_name || "Sin Nombre"}</h4>
                        </div>

                        {/* Columna 3: Zona y Hora */}
                        <div className="tt-col tt-col-info">
                          <div className="tt-info-row">
                            <MapPin size={12} />
                            <span>{item.zone || 'General'}</span>
                          </div>
                          <div className="tt-info-row">
                            <Clock size={12} />
                            <span>{new Date(item.scheduled_start || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        {/* Columna 4: Fecha */}
                        <div className="tt-col tt-col-date">
                           <span className="tt-date-text">
                             {new Date(item.scheduled_start || item.created_at).toLocaleDateString()}
                           </span>
                        </div>

                        {/* Columna 5: Flecha */}
                        <div className="tt-col tt-col-arrow">
                           <ChevronRight size={18} className="tt-arrow-icon" />
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state-msg">
              <CheckCircle2 size={40} style={{ opacity: 0.3, marginBottom: '15px' }} />
              <p>No hay trabajos pendientes en esta sección.</p>
            </div>
          )}
        </div>
      </div>
        {!materialRecibido && (
          <div className="lock-overlay-msg">Debe confirmar recepción de material para desbloquear</div>
        )}

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
                    {(checklistARenderizar.materiales || checklistARenderizar.material || []).map((m, i) => (
                      <label key={i} className={`check-item ${itemsCheck.materiales[i] ? 'checked' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={itemsCheck.materiales[i]} 
                          onChange={() => toggleItem('materiales', i)}
                        />
                        <span>{typeof m === 'string' ? m : m.nombre || m.task || m.concepto}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="checklist-section">
                  <h4><Wrench size={14} /> Equipo</h4>
                  <div className="items-check-grid">
                    {(checklistARenderizar.equipo || []).map((e, i) => (
                      <label key={i} className={`check-item ${itemsCheck.equipo[i] ? 'checked' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={itemsCheck.equipo[i]} 
                          onChange={() => toggleItem('equipo', i)}
                        />
                        <span>{typeof e === 'string' ? e : e.nombre || e.task || e.concepto}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {checklistARenderizar.herramientas && checklistARenderizar.herramientas.length > 0 && (
                  <div className="checklist-section">
                    <h4><Settings size={14} /> Herramientas</h4>
                    <div className="items-check-grid">
                      {checklistARenderizar.herramientas.map((h, i) => (
                        <label key={i} className={`check-item ${itemsCheck.herramientas[i] ? 'checked' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={itemsCheck.herramientas[i]} 
                            onChange={() => toggleItem('herramientas', i)}
                          />
                          <span>{typeof h === 'string' ? h : h.nombre || h.task || h.concepto}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
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