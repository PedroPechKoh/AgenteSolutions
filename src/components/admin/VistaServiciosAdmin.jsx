import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Clock, CheckCircle2, X, UserCircle, Calendar, 
  ArrowLeft, Camera, Layout, FileText, Maximize2, AlertTriangle, ChevronLeft, Timer 
} from 'lucide-react';
import Header from '../Shared/Header';
import ModalAsignarChecklist from './ModalAsignarChecklist';
import '../../styles/Cliente/TableroScrum.css'; // Reutilizamos estilos

const VistaServiciosAdmin = () => {
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [tareasData, setTareasData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [verBitacora, setVerBitacora] = useState(false);
  const [imagenExpandida, setImagenExpandida] = useState(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [tecnicos, setTecnicos] = useState([]);
  const [mostrandoSelectorTecnico, setMostrandoSelectorTecnico] = useState(false);
  const [modalChecklistVisible, setModalChecklistVisible] = useState(false);
  const [editandoCita, setEditandoCita] = useState(false);
  const [tabActiva, setTabActiva] = useState('sos'); // Estado para pestañas en móvil
  
  const columnasConfig = [
    { id: 'sos', titulo: 'SOS', color: '#e63946', icon: <AlertTriangle size={20} /> },
    { id: 'todo', titulo: 'POR HACER', color: '#333', icon: <FileText size={20} /> },
    { id: 'progress', titulo: 'EN PROCESO', color: '#f26522', icon: <Timer size={20} /> },
    { id: 'done', titulo: 'FINALIZADOS', color: '#1b8a5a', icon: <CheckCircle2 size={20} /> }
  ];
  
  // --- ESTADOS PARA INVENTARIO ---
  const [modalSurveyVisible, setModalSurveyVisible] = useState(false);
  const [surveyData, setSurveyData] = useState([]);
  const [cargandoSurvey, setCargandoSurvey] = useState(false);
  const [areaActivaSurvey, setAreaActivaSurvey] = useState(null);

  // --- MAPEO DE DATOS ---
  const transformarTareas = useCallback((data) => {
    return data.map(item => {
      let estado = 'todo';
      if (item.status === 'Listo' || item.status === 'Finalizado') {
        estado = 'done';
      } else if (item.status === 'En Proceso') {
        estado = 'progress';
      } else if (item.priority === 'Urgente') {
        estado = 'sos';
      }
      
      return {
        dbId: item.id,
        titulo: `${item.zone} - ${item.equipment || 'General'}`,
        propiedad: item.property ? (item.property.nombre_propiedad || item.property.address) : 'Sin Propiedad',
        prioridad: item.priority === 'Urgente' ? 'SOS' : 'Normal',
        fechaFin: new Date(item.updated_at).toLocaleDateString(),
        tecnico: item.tecnico ? `${item.tecnico.first_name} ${item.tecnico.last_name}` : 'Pendiente de asignar',
        tecnicoId: item.tecnico_id,
        propertyId: item.property_id,
        fechaInicio: new Date(item.created_at).toLocaleDateString(),
        estado: estado,
        descripcion: item.description,
        evidencias: [item.evidence_path, item.evidence_path_2].filter(p => p),
        custom_checklist: item.custom_checklist,
        scheduledAt: item.scheduled_at,
        isOverdue: (item.scheduled_at && !['Listo', 'Finalizado'].includes(item.status)) 
                   ? new Date(item.scheduled_at) < new Date() 
                   : false
      };
    });
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/work-orders/all`);
      setTareasData(transformarTareas(response.data));
    } catch (error) {
      console.error("Error cargando todas las órdenes:", error);
    } finally {
      setLoading(false);
    }
  }, [transformarTareas]);

  const fetchTecnicos = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/usuarios/tecnicos`);
      setTecnicos(response.data);
    } catch (error) {
      console.error("Error cargando técnicos:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchTecnicos();
  }, [fetchOrders]);

  // --- AUTO-OPEN MODAL IF jobId IN URL ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('jobId');
    if (jobId && tareasData.length > 0) {
      const tarea = tareasData.find(t => t.dbId === parseInt(jobId));
      if (tarea) {
        setTabActiva(tarea.estado); // Cambiamos a la pestaña correcta (SOS, Todo, etc.)
        abrirModal(tarea);
        // Limpiamos la URL para no re-abrir al recargar
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [tareasData]);

  // --- ACCIONES ---
  const abrirModal = (tarea) => {
    setTareaSeleccionada(tarea);
    setVerBitacora(false);
    setMostrandoSelectorTecnico(false);
    setEditandoCita(false);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setTareaSeleccionada(null);
  };

  const cambiarEstadoTarea = async (nuevoEstadoLaravel) => {
    setProcesandoAccion(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/${tareaSeleccionada.dbId}/status`, {
        status: nuevoEstadoLaravel
      });
      await fetchOrders();
      cerrarModal();
    } catch (error) {
      alert("No se pudo actualizar el estado del servicio.");
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleAssignTecnico = async (tecnicoId) => {
    setProcesandoAccion(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/${tareaSeleccionada.dbId}/assign`, {
        tecnico_id: tecnicoId
      });
      await fetchOrders();
      setMostrandoSelectorTecnico(false);
      // Actualizamos la tarea seleccionada localmente para no cerrar el modal si no es necesario
      const updatedTask = tareasData.find(t => t.dbId === tareaSeleccionada.dbId);
      if (updatedTask) setTareaSeleccionada(updatedTask);
      alert("Técnico asignado con éxito");
    } catch (error) {
      alert("Error al asignar técnico.");
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleSaveSchedule = async (newDate, newTime) => {
    if (!newDate || !newTime) return alert("Por favor selecciona tanto la fecha como la hora de visita.");
    
    // Combinar fecha y hora para el backend
    const scheduledAt = `${newDate} ${newTime}`;
    
    setProcesandoAccion(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/${tareaSeleccionada.dbId}/assign`, {
        scheduled_at: scheduledAt
      });
      alert("Cita programada y cliente notificado correctamente.");
      fetchOrders();
      setTareaSeleccionada(prev => ({ ...prev, scheduledAt: scheduledAt }));
      setEditandoCita(false);
    } catch (error) {
      console.error(error);
      alert("Error al programar la cita.");
    } finally {
      setProcesandoAccion(false);
    }
  };

  const abrirSurvey = async () => {
    if (!tareaSeleccionada.propertyId) return alert("Esta orden no tiene propiedad asociada.");
    
    setCargandoSurvey(true);
    setModalSurveyVisible(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/propiedades/${tareaSeleccionada.propertyId}/survey`);
      setSurveyData(response.data);
      if (response.data.length > 0) {
        // Intentar activar el área que coincida con la zona de la tarea
        const matchingArea = response.data.find(a => a.name.toLowerCase().includes(tareaSeleccionada.titulo.split(' - ')[0].toLowerCase()));
        setAreaActivaSurvey(matchingArea ? matchingArea.id : response.data[0].id);
      }
    } catch (error) {
      console.error("Error cargando inventario:", error);
      alert("No se pudo cargar el inventario de la propiedad.");
    } finally {
      setCargandoSurvey(false);
    }
  };

  if (loading) return <div className="loading-screen">Cargando Tablero de Servicios...</div>;

  const renderColumna = (colId, titulo, clase) => {
    const tareasFiltradas = tareasData.filter(t => t.estado === colId);
    
    return (
      <div className={`scrum-column ${clase}`}>
        <div className="column-header">
          <span className="column-title-text">{titulo}</span>
          <span className="column-badge">{tareasFiltradas.length}</span>
        </div>
        <div className="cards-container">
          {tareasFiltradas.length > 0 ? (
            tareasFiltradas.map(tarea => (
              <div key={tarea.dbId} className="card-wrapper">
                <button 
                  className={`task-card-premium ${
                    tarea.isOverdue ? 'is-overdue' : ''
                  } ${
                    tarea.estado === 'sos' ? 'is-sos' : 
                    tarea.estado === 'progress' ? (tarea.prioridad === 'SOS' ? 'is-sos is-active' : 'is-active') : 
                    tarea.estado === 'done' ? 'is-done' : ''
                  }`}
                  onClick={() => abrirModal(tarea)}
                >
                  <div className="prop-badge-card">{tarea.propiedad}</div>
                  <h5 className="task-title-card">
                    {(tarea.estado === 'sos' || (tarea.estado === 'progress' && tarea.prioridad === 'SOS')) && <AlertTriangle size={14} className="sos-icon-inline" />}
                    {tarea.titulo}
                  </h5>
                  <div className="card-status-row">
                    {tarea.estado === 'done' ? (
                      <div className="status-pill-done">
                        <CheckCircle2 size={12} /> <span>Finalizado</span>
                      </div>
                    ) : (
                      <span className={`priority-tag ${tarea.prioridad.toLowerCase()}`}>
                        {tarea.prioridad.toUpperCase()}
                      </span>
                    )}
                    <span className={`date-tag ${tarea.isOverdue ? 'is-overdue' : ''}`}>
                      {tarea.isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
                      {tarea.isOverdue ? 'ATRASADO - ' : ''} {tarea.fechaFin}
                    </span>
                  </div>
                </button>
              </div>
            ))
          ) : (
            <div className="empty-column-message" style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: '#999', 
              fontSize: '0.9rem',
              fontStyle: 'italic',
              background: 'rgba(255,255,255,0.5)',
              borderRadius: '15px',
              margin: '10px',
              border: '1px dashed #ccc'
            }}>
              <p>No hay servicios en {titulo.toLowerCase()}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="scrum-container admin-theme">
      <Header titulo="SERVICIOS" />
      
      <header className="scrum-header-admin">
        <button 
          className="btn-back-dashboard" 
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '8px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
        >
          <ChevronLeft size={20} /> REGRESAR
        </button>
        <h2 style={{ fontStyle: 'italic', fontWeight: '900', margin: 0 }}>GESTIÓN GLOBAL DE SERVICIOS</h2>
      </header>

      {/* Tabs para Móvil */}
      <div className="scrum-tabs-mobile">
        {columnasConfig.map(col => (
          <button 
            key={col.id}
            className={`tab-btn ${tabActiva === col.id ? 'active' : ''}`}
            onClick={() => setTabActiva(col.id)}
            style={{ color: tabActiva === col.id ? col.color : '#999' }}
          >
            {col.icon}
            <span>{col.titulo}</span>
            {tabActiva === col.id && <div className="active-line" style={{ background: col.color }}></div>}
          </button>
        ))}
      </div>

      <div className="scrum-board-layout quad-layout">
        {columnasConfig.map(col => (
          <div key={col.id} className={`column-wrapper-responsive ${tabActiva === col.id ? 'show-mobile' : 'hide-mobile'}`}>
            {renderColumna(col.id, col.titulo === 'SOS' ? 'SOS / PRIORITARIOS' : col.titulo, `col-${col.id}`)}
          </div>
        ))}
      </div>

      {modalVisible && tareaSeleccionada && (
        <div className="modal-view-overlay" onClick={cerrarModal}>
          <div className="modal-card-container" onClick={e => e.stopPropagation()}>
            <div className={`modal-top-indicator ${verBitacora ? 'is-bitacora' : tareaSeleccionada.estado}`}>
               <div className="indicator-content">
                  {verBitacora && <ArrowLeft size={18} className="nav-back-icon" onClick={() => setVerBitacora(false)} />}
                  <span className="dot-blink"></span>
                  {verBitacora ? 'DETALLES TÉCNICOS' : 'ORDEN DE TRABAJO'}
               </div>
               <button className="close-modal-btn" onClick={cerrarModal}><X size={18}/></button>
            </div>

            <div className="modal-inner-scroll">
                {!verBitacora ? (
                  <div className="task-details-view">
                    <div style={{ color: '#F26522', fontWeight: 'bold', marginBottom: '5px' }}>{tareaSeleccionada.propiedad}</div>
                    <span className="wkf-id">WKF-ORD-{tareaSeleccionada.dbId}</span>
                    <h3 className="task-main-heading">{tareaSeleccionada.titulo}</h3>
                    <p className="task-long-desc">{tareaSeleccionada.descripcion}</p>
                    
                    <div className="info-box-grid">
                      <div className="info-item clickable-info" onClick={() => setMostrandoSelectorTecnico(!mostrandoSelectorTecnico)}>
                        <UserCircle size={20} />
                        <div>
                          <label>Técnico Asignado</label>
                          <strong className={tareaSeleccionada.tecnico === 'Pendiente de asignar' ? 'pending-text' : ''}>
                            {tareaSeleccionada.tecnico}
                          </strong>
                          {tareaSeleccionada.tecnico === 'Pendiente de asignar' && <span className="assign-hint">(Click para asignar)</span>}
                        </div>
                      </div>

                      {mostrandoSelectorTecnico && (
                        <div className="tecnico-selector-dropdown">
                          <h6>Seleccionar Técnico:</h6>
                          <div className="tecnicos-list-mini">
                            {tecnicos.map(tec => (
                              <button 
                                key={tec.id} 
                                className={`tec-option-btn ${tareaSeleccionada.tecnicoId === tec.id ? 'selected' : ''}`}
                                onClick={() => handleAssignTecnico(tec.id)}
                                disabled={procesandoAccion}
                              >
                                {tec.first_name} {tec.last_name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="info-item">
                        <Calendar size={20} />
                        <div><label>Fecha Reporte</label><strong>{tareaSeleccionada.fechaInicio}</strong></div>
                      </div>

                      <div className="info-item" style={{ 
                        gridColumn: 'span 2', 
                        background: '#fff9f0', 
                        padding: '15px', 
                        borderRadius: '12px', 
                        border: '1px dashed #F26522',
                        marginTop: '10px'
                      }}>
                        <Calendar size={20} color="#F26522" />
                        <div style={{ flex: 1 }}>
                          <label style={{ color: '#F26522', fontWeight: '900', fontSize: '0.75rem' }}>
                            PROGRAMAR VISITA (NOTIFICA AL CLIENTE)
                          </label>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                            <div className="input-with-icon" style={{ flex: 1.1, position: 'relative' }}>
                              <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#F26522', pointerEvents: 'none', zIndex: 1 }} />
                              <input 
                                type="date" 
                                defaultValue={tareaSeleccionada.scheduledAt ? new Date(tareaSeleccionada.scheduledAt).toISOString().split('T')[0] : ''}
                                id="input-date-visit"
                                onClick={(e) => !e.target.disabled && e.target.showPicker()}
                                disabled={tareaSeleccionada.scheduledAt && !editandoCita}
                                style={{ 
                                  width: '100%', padding: '12px 10px 12px 30px', 
                                  border: '1px solid #ccc', borderRadius: '10px', 
                                  outline: 'none', background: (tareaSeleccionada.scheduledAt && !editandoCita) ? '#f0f0f0' : 'white', fontSize: '0.85rem',
                                  color: '#333', fontWeight: '600', display: 'block', cursor: (tareaSeleccionada.scheduledAt && !editandoCita) ? 'default' : 'pointer'
                                }}
                              />
                            </div>
                            <div className="input-with-icon" style={{ flex: 0.7, position: 'relative' }}>
                              <Timer size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#F26522', pointerEvents: 'none', zIndex: 1 }} />
                              <input 
                                type="time" 
                                defaultValue={tareaSeleccionada.scheduledAt ? new Date(tareaSeleccionada.scheduledAt).toTimeString().slice(0, 5) : ''}
                                id="input-time-visit"
                                onClick={(e) => !e.target.disabled && e.target.showPicker()}
                                disabled={tareaSeleccionada.scheduledAt && !editandoCita}
                                style={{ 
                                  width: '100%', padding: '12px 10px 12px 30px', 
                                  border: '1px solid #ccc', borderRadius: '10px', 
                                  outline: 'none', background: (tareaSeleccionada.scheduledAt && !editandoCita) ? '#f0f0f0' : 'white', fontSize: '0.85rem',
                                  color: '#333', fontWeight: '600', display: 'block', cursor: (tareaSeleccionada.scheduledAt && !editandoCita) ? 'default' : 'pointer'
                                }}
                              />
                            </div>
                            <button 
                              onClick={() => {
                                if (tareaSeleccionada.scheduledAt && !editandoCita) {
                                  setEditandoCita(true);
                                } else {
                                  const d = document.getElementById('input-date-visit').value;
                                  const t = document.getElementById('input-time-visit').value;
                                  handleSaveSchedule(d, t);
                                }
                              }}
                              disabled={procesandoAccion}
                              style={{ 
                                background: (tareaSeleccionada.scheduledAt && !editandoCita) ? '#333' : '#F26522', 
                                color: 'white', border: 'none', 
                                borderRadius: '10px', padding: '10px 8px', fontWeight: '900', 
                                cursor: 'pointer', fontSize: '0.65rem',
                                flex: '0 0 auto',
                                width: '90px'
                              }}
                            >
                              {procesandoAccion ? '...' : (
                                !tareaSeleccionada.scheduledAt ? 'PROGRAMAR' : (
                                  editandoCita ? 'CONFIRMAR' : 'REPROGRAMAR'
                                )
                              )}
                            </button>
                          </div>
                          {tareaSeleccionada.scheduledAt && (
                            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <CheckCircle2 size={12} color="#2e7d32" /> Cita actual: {new Date(tareaSeleccionada.scheduledAt).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button className="modal-action-btn variant-orange" onClick={() => setVerBitacora(true)}>
                      <Camera size={18} /> Ver Evidencias y Proceso
                    </button>

                    <button className="modal-action-btn variant-dark" onClick={abrirSurvey}>
                      <Layout size={18} /> CONSULTAR LEVANTAMIENTO DE LA PROPIEDAD
                    </button>

                    <button className="modal-action-btn variant-orange" onClick={() => setModalChecklistVisible(true)} style={{ background: '#333' }}>
                      <CheckCircle2 size={18} /> {tareaSeleccionada.custom_checklist ? 'EDITAR CHECKLIST' : 'ASIGNAR CHECKLIST'}
                    </button>

                    <div className="modal-main-action-wrapper">
                      {tareaSeleccionada.estado === 'todo' || tareaSeleccionada.estado === 'sos' ? (
                        <button className="modal-action-btn variant-black" disabled={procesandoAccion} onClick={() => cambiarEstadoTarea('En Proceso')}>
                          <Timer size={18} /> {procesandoAccion ? 'Actualizando...' : 'INICIAR TRABAJO'}
                        </button>
                      ) : tareaSeleccionada.estado === 'progress' ? (
                        <button className="modal-action-btn variant-green" disabled={procesandoAccion} onClick={() => cambiarEstadoTarea('Listo')}>
                          <CheckCircle2 size={18} /> {procesandoAccion ? 'Finalizando...' : 'MARCAR COMO LISTO'}
                        </button>
                      ) : null}

                      {tareaSeleccionada.estado === 'done' && (
                        <button 
                          className="modal-action-btn variant-orange" 
                          onClick={() => navigate(`/galeria-reportes/${tareaSeleccionada.dbId}`, { state: { trabajoId: tareaSeleccionada.dbId, servicio: tareaSeleccionada } })}
                          style={{ background: '#f26624', marginTop: '20px' }}
                        >
                          <Camera size={18} /> CONSULTAR REPORTE DE TRABAJO
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bitacora-view">
                    <div className="bitacora-section">
                      <h6 className="section-label"><Layout size={14} /> ESTATUS ACTUAL</h6>
                      <div className="checklist-minimal">
                        <div className="check-row done"><CheckCircle2 size={16}/> Registro de solicitud</div>
                        <div className={`check-row ${tareaSeleccionada.estado === 'progress' ? 'current' : tareaSeleccionada.estado === 'done' ? 'done' : ''}`}>
                          {tareaSeleccionada.estado === 'done' ? <CheckCircle2 size={16}/> : <Clock size={16}/>} 
                          Ejecución en sitio
                        </div>
                      </div>
                    </div>
                    <div className="media-area">
                      <h6 className="section-label"><Camera size={14} /> EVIDENCIAS ENVIADAS</h6>
                      <div className="evidence-grid">
                        {tareaSeleccionada.evidencias.map((img, i) => (
                          <div key={i} className="evidence-card" onClick={() => setImagenExpandida(img)}>
                            <img src={img} alt="Evidencia" />
                            <div className="evidence-overlay"><Maximize2 size={16} /></div>
                          </div>
                        ))}
                      </div>
                      {tareaSeleccionada.evidencias.length === 0 && <p style={{ color: '#999', fontSize: '0.9rem' }}>No hay evidencias adjuntas.</p>}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {modalSurveyVisible && (
        <div className="modal-survey-overlay" onClick={() => setModalSurveyVisible(false)}>
          <div className="modal-survey-card" onClick={e => e.stopPropagation()}>
            <div className="survey-header">
              <div className="survey-header-info">
                <FileText size={24} color="#F26522" />
                <div>
                  <h3>INVENTARIO TÉCNICO</h3>
                  <p>{tareaSeleccionada?.propiedad}</p>
                </div>
              </div>
              <button className="close-survey-btn" onClick={() => setModalSurveyVisible(false)}><X size={24}/></button>
            </div>

            <div className="survey-body">
              {cargandoSurvey ? (
                <div className="survey-loading"><div className="spinner"></div> Cargando inventario detallado...</div>
              ) : (
                <div className="survey-content-layout">
                  <aside className="survey-sidebar-areas">
                    <h6 className="sidebar-label">ÁREAS / HABITACIONES</h6>
                    {surveyData.map(area => (
                      <button 
                        key={area.id} 
                        className={`area-nav-item ${areaActivaSurvey === area.id ? 'active' : ''}`}
                        onClick={() => setAreaActivaSurvey(area.id)}
                      >
                        <div className="area-nav-dot"></div>
                        <span>{area.name}</span>
                        <div className="area-nav-count">{Object.values(area.categories).reduce((acc, cat) => acc + cat.length, 0)}</div>
                      </button>
                    ))}
                  </aside>

                  <main className="survey-main-view">
                    {surveyData.find(a => a.id === areaActivaSurvey) ? (
                      (() => {
                        const area = surveyData.find(a => a.id === areaActivaSurvey);
                        return (
                          <div className="area-details-container">
                            <div className="area-header-banner">
                              <img src={area.photo || '/placeholder-area.jpg'} alt={area.name} className="area-banner-img" />
                              <div className="area-banner-overlay">
                                <h2>{area.name}</h2>
                              </div>
                            </div>

                            <div className="categories-stack">
                              {Object.entries(area.categories).length === 0 ? (
                                <p className="no-items-msg">No hay elementos registrados en esta área.</p>
                              ) : (
                                Object.entries(area.categories).map(([catName, items]) => (
                                  <div key={catName} className="category-group">
                                    <h4 className="category-heading">{catName.toUpperCase()}</h4>
                                    <div className="items-grid-detailed">
                                      {items.map(item => (
                                        <div key={item.id} className="tech-item-card">
                                          <div className="item-photo-box" onClick={() => setImagenExpandida(item.image_path)}>
                                            <img src={item.image_path || '/placeholder-item.jpg'} alt={item.sub_category} />
                                            <div className="photo-zoom-hint"><Maximize2 size={14}/></div>
                                          </div>
                                          <div className="item-tech-info">
                                            <div className="item-row-main">
                                              <span className="item-subcat">{item.sub_category}</span>
                                              <span className={`item-status-tag ${item.status.toLowerCase()}`}>{item.status}</span>
                                            </div>
                                            <div className="item-specs-grid">
                                              <div className="spec"><label>MARCA:</label> <span>{item.brand || '---'}</span></div>
                                              <div className="spec"><label>MODELO:</label> <span>{item.model_or_color || '---'}</span></div>
                                              <div className="spec"><label>S/N:</label> <span className="serial-num">{item.serial_number || '---'}</span></div>
                                            </div>
                                            {item.observations && <p className="item-obs">"{item.observations}"</p>}
                                            {item.galleries && item.galleries.length > 0 && (
                                              <div className="mini-gallery">
                                                {item.galleries.map((img, idx) => (
                                                  <img key={idx} src={img} onClick={() => setImagenExpandida(img)} alt="Gallery" />
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="select-area-msg">Selecciona un área para ver sus componentes técnicos.</div>
                    )}
                  </main>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {imagenExpandida && (
        <div className="zoom-overlay" onClick={() => setImagenExpandida(null)}>
          <button className="zoom-close-fixed" onClick={() => setImagenExpandida(null)}><X size={32} /></button>
          <div className="zoom-content" onClick={e => e.stopPropagation()}>
            <img src={imagenExpandida} className="image-zoomed" alt="Zoom" />
          </div>
        </div>
      )}

      {modalChecklistVisible && tareaSeleccionada && (
        <ModalAsignarChecklist 
          workOrder={tareaSeleccionada}
          onClose={() => setModalChecklistVisible(false)}
          onAssign={() => {
            setModalChecklistVisible(false);
            fetchOrders();
            // Actualizar la tarea seleccionada para reflejar el nuevo técnico
            setTimeout(() => {
               const updated = tareasData.find(t => t.dbId === tareaSeleccionada.dbId);
               if (updated) setTareaSeleccionada(updated);
            }, 500);
          }}
        />
      )}
      
      <style>{`
        .zoom-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.92);
          backdrop-filter: blur(5px);
          z-index: 99999; /* Super superior */
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: zoom-out;
        }
        .zoom-content {
          max-width: 90%;
          max-height: 90%;
          position: relative;
        }
        .image-zoomed {
          max-width: 100%;
          max-height: 90vh;
          border-radius: 12px;
          box-shadow: 0 0 50px rgba(0,0,0,0.5);
          border: 3px solid white;
        }
        .zoom-close-fixed {
          position: absolute;
          top: 30px; right: 30px;
          background: #F26522;
          color: white;
          border: none;
          width: 50px; height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 100000;
          transition: all 0.2s;
        }
        .zoom-close-fixed:hover { transform: scale(1.1); }

        .prop-badge-card {
          font-size: 0.65rem;
          color: #F26522;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 4px;
          text-align: left;
          border-bottom: 1px solid #eee;
          padding-bottom: 2px;
        }
        .admin-theme {
          background-color: #f4f4f4;
          min-height: 100vh;
        }
        .clickable-info {
          cursor: pointer;
          transition: background 0.2s;
        }
        .clickable-info:hover {
          background: #f0f0f0;
          border-radius: 8px;
        }
        .pending-text {
          color: #e63946;
        }
        .assign-hint {
          font-size: 0.7rem;
          color: #666;
          display: block;
          margin-top: 2px;
          font-style: italic;
        }

        /* --- STYLES FOR CONSISTENT BUTTONS --- */
        .modal-action-btn {
          width: 100%;
          margin-top: 12px;
          padding: 15px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .modal-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        .variant-orange { background: #F26522; color: white; }
        .variant-dark { background: #333; color: white; }
        .variant-black { background: #000; color: white; }
        .variant-green { background: #1b8a5a; color: white; }

        .modal-main-action-wrapper {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed #eee;
        }
        .tecnico-selector-dropdown {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 12px;
          margin-top: -10px;
          margin-bottom: 15px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          animation: slideDown 0.2s ease-out;
        }
        .tecnicos-list-mini {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 150px;
          overflow-y: auto;
          margin-top: 8px;
        }
        .tecnico-selector-dropdown h6 {
          color: #333;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .tec-option-btn {
          padding: 8px 12px;
          border: 1px solid #eee;
          background: #fdfdfd;
          border-radius: 8px;
          text-align: left;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          color: #444;
          font-weight: 600;
        }
        .tec-option-btn:hover {
          background: #f26522;
          color: white;
          background: #F26522;
          color: white;
          border-color: #F26522;
        }
        .tec-option-btn.selected {
          background: #f0f0f0;
          border-color: #F26522;
          color: #F26522;
        }

        .modal-survey-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-survey-card {
          width: 100%;
          max-width: 1100px;
          height: 90vh;
          background: #fff; /* Aseguramos fondo blanco */
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          color: #333; /* Texto oscuro por defecto */
        }
        .survey-header {
          padding: 20px 30px;
          background: white;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .survey-header-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .survey-header-info h3 { margin: 0; font-size: 1.3rem; font-weight: 900; color: #1a1a1a; }
        .survey-header-info p { margin: 2px 0 0 0; color: #666; font-size: 0.9rem; }
        .close-survey-btn {
          background: #f0f0f0;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: #333;
        }
        .close-survey-btn:hover { background: #e0e0e0; transform: rotate(90deg); }
        
        .survey-body { flex: 1; overflow: hidden; }
        .survey-content-layout { display: flex; height: 100%; }
        
        .survey-sidebar-areas {
          width: 280px;
          background: white;
          border-right: 1px solid #eee;
          padding: 20px;
          overflow-y: auto;
        }
        .sidebar-label {
          font-size: 0.75rem;
          color: #999;
          font-weight: 700;
          margin-bottom: 15px;
          letter-spacing: 1px;
        }
        .area-nav-item {
          width: 100%;
          padding: 12px 15px;
          margin-bottom: 8px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .area-nav-item span { color: #555; font-weight: 600; }
        .area-nav-item:hover { background: #fdf2f0; color: #F26522; }
        .area-nav-item.active {
          background: #fff5f0;
          border-color: #F26522;
          color: #F26522;
          font-weight: bold;
        }
        .area-nav-item.active span { color: #F26522; }
        .area-nav-dot { width: 8px; height: 8px; border-radius: 50%; background: #ccc; transition: all 0.2s; }
        .area-nav-item.active .area-nav-dot { background: #F26522; box-shadow: 0 0 8px rgba(242, 101, 34, 0.5); }
        .area-nav-count { margin-left: auto; font-size: 0.75rem; background: #eee; padding: 2px 8px; border-radius: 10px; color: #666; }
        .area-nav-item.active .area-nav-count { background: #F26522; color: white; }

        .survey-main-view { flex: 1; overflow-y: auto; background: #f8f9fa; padding: 30px; }
        .area-header-banner {
          position: relative;
          height: 180px;
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 30px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .area-banner-img { width: 100%; height: 100%; object-fit: cover; }
        .area-banner-overlay {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 25px;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
          color: white;
        }
        .area-banner-overlay h2 { margin: 0; font-size: 1.8rem; font-weight: 900; }

        .category-group { margin-bottom: 40px; }
        .category-heading {
          font-size: 0.9rem;
          font-weight: 900;
          color: #333;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .category-heading::after { content: ""; flex: 1; height: 1px; background: #ddd; }
        
        .items-grid-detailed {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        .tech-item-card {
          background: white;
          border-radius: 16px;
          padding: 15px;
          display: flex;
          gap: 15px;
          border: 1px solid #eee;
          transition: all 0.2s;
        }
        .tech-item-card:hover { border-color: #F26522; transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        
        .item-photo-box {
          width: 100px;
          height: 100px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
        }
        .item-photo-box img { width: 100%; height: 100%; object-fit: cover; }
        .photo-zoom-hint {
          position: absolute;
          bottom: 5px; right: 5px;
          background: rgba(0,0,0,0.6);
          color: white;
          width: 22px; height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .item-tech-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .item-row-main { display: flex; justify-content: space-between; align-items: flex-start; }
        .item-subcat { font-weight: 800; font-size: 1rem; color: #1a1a1a; }
        .item-status-tag { font-size: 0.7rem; font-weight: bold; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }
        .item-status-tag.bueno { background: #e6f7ed; color: #1b8a5a; }
        .item-status-tag.regular { background: #fff8e6; color: #b7791f; }
        .item-status-tag.malo { background: #ffebeb; color: #e53e3e; }
        
        .item-specs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4px;
          background: #f9f9f9;
          padding: 8px;
          border-radius: 8px;
        }
        .spec { font-size: 0.75rem; display: flex; gap: 5px; }
        .spec label { font-weight: 800; color: #777; }
        .spec span { color: #1a1a1a; font-weight: 600; }
        .serial-num { font-family: monospace; color: #F26522 !important; }
        
        .item-obs { font-size: 0.8rem; color: #555; font-style: italic; margin: 4px 0; line-height: 1.4; }
        
        .mini-gallery { display: flex; gap: 5px; margin-top: 5px; }
        .mini-gallery img {
          width: 35px; height: 35px;
          border-radius: 4px;
          object-fit: cover;
          cursor: pointer;
          border: 1px solid #eee;
        }

        .no-items-msg, .select-area-msg {
          text-align: center; padding: 50px; color: #999; font-style: italic;
        }
        .survey-loading {
          height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; color: #666;
        }
        .spinner {
          width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #F26522; border-radius: 50%; animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* --- STYLES FOR MOBILE TABS --- */
        .scrum-tabs-mobile {
          display: none;
          background: white;
          padding: 10px 5px;
          margin: 10px 0;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          justify-content: space-around;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .tab-btn {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 8px 5px;
          cursor: pointer;
          position: relative;
          flex: 1;
        }
        .tab-btn span {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .active-line {
          position: absolute;
          bottom: -5px;
          height: 3px;
          width: 25px;
          border-radius: 10px;
        }

        @media (max-width: 768px) {
          .scrum-tabs-mobile { display: flex; }
          .scrum-board-layout { 
            display: block !important; 
            padding: 0 10px;
          }
          .column-wrapper-responsive.hide-mobile { display: none; }
          .column-wrapper-responsive.show-mobile { display: block; animation: fadeIn 0.3s ease; }
          .scrum-column { width: 100% !important; margin: 0 !important; }
          .column-header { display: none; } /* Ocultamos el header original porque ya está en el tab */
          .scrum-header h2 { font-size: 1.2rem; }

          /* Responsive para el Modal de Inventario */
          .survey-content-layout { flex-direction: column; }
          .survey-sidebar-areas { width: 100%; border-right: none; border-bottom: 1px solid #eee; padding: 15px; display: flex; flex-wrap: wrap; gap: 10px; }
          .area-nav-item { width: auto; margin-bottom: 0; padding: 8px 12px; }
          .survey-main-view { padding: 15px; }
          .modal-survey-card { height: 95vh; border-radius: 16px; }
          .items-grid-detailed { grid-template-columns: 1fr; }
          .survey-header { padding: 15px; }
          .survey-header-info h3 { font-size: 1.1rem; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default VistaServiciosAdmin;
