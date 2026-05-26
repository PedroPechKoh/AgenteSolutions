import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Header from "../Shared/Header";
import ModalCrearCotizacion from "../Shared/ModalCrearCotizacion";
import "../../styles/TecnicoStyles/TrabajoPropiedad.css";
import { 
  MapPin, Phone, User, Wrench, Clock, 
  ChevronLeft, Navigation, CheckCircle2, AlertCircle,
  FileText, ArrowRight, Package, Lock, Camera, Layout,
  X, Maximize2, ChevronRight, AlertTriangle, Zap,
  Plus, Trash2, Upload, Calculator
} from 'lucide-react';
import { useAuth } from "../../context/AuthContext";

const TrabajoPropiedad = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModalFinalizar, setShowModalFinalizar] = useState(false);
  const [showModalMateriales, setShowModalMateriales] = useState(false);
  const [materialesConfirmados, setMaterialesConfirmados] = useState(false);
  const [itemsCheck, setItemsCheck] = useState({ materiales: [], equipo: [], herramientas: [] });
  const [hasReports, setHasReports] = useState(false);

  // --- ESTADOS PARA CONSULTA DE LEVANTAMIENTO ---
  const [modalSurveyVisible, setModalSurveyVisible] = useState(false);
  const [surveyData, setSurveyData] = useState([]);
  const [cargandoSurvey, setCargandoSurvey] = useState(false);
  const [areaActivaSurvey, setAreaActivaSurvey] = useState(null);
  const [verEvidencias, setVerEvidencias] = useState(false);
  const [imagenExpandida, setImagenExpandida] = useState(null);

  // --- ESTADOS PARA COTIZACIÓN ---
  const [showModalCotizacion, setShowModalCotizacion] = useState(false);
  const [cotizacionExistente, setCotizacionExistente] = useState(null);

  useEffect(() => {
    fetchJobDetails();
    checkExistingQuote();
  }, [id]);

  const checkExistingQuote = async () => {
    try {
      const realId = id.includes('-') ? id.split('-')[1] : id;
      const isWorkOrder = id.includes('work_order');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`);
      const allQuotes = res.data.data || res.data;
      const found = allQuotes.find(q => 
        (isWorkOrder && q.work_order_id === parseInt(realId)) || 
        (!isWorkOrder && q.service_id === parseInt(realId))
      );
      if (found) {
        setCotizacionExistente(found);
      }
    } catch (error) {
      console.error("Error al buscar cotización previa:", error);
    }
  };

  useEffect(() => {
    if (data) {
      const realId = id.includes('-') ? id.split('-')[1] : id;
      const confirmado = localStorage.getItem(`materiales_confirmados_${realId}`) === 'true';
      setMaterialesConfirmados(confirmado);

      const cl = data.custom_checklist 
        ? (typeof data.custom_checklist === 'string' ? JSON.parse(data.custom_checklist) : data.custom_checklist)
        : { materiales: [], equipo: [], herramientas: [] };
      
      const mats = cl.materiales || cl.material || [];
      const eqs = cl.equipo || [];
      const hers = cl.herramientas || [];

      setItemsCheck({
        materiales: new Array(mats.length).fill(confirmado),
        equipo: new Array(eqs.length).fill(confirmado),
        herramientas: new Array(hers.length).fill(confirmado)
      });
    }
  }, [data, id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios/${id}`);
      setData(res.data.data || res.data);
      try {
        const reportsRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios/${id}/reportes`);
        if (reportsRes.data && reportsRes.data.length > 0) {
          setHasReports(true);
        }
      } catch (err) {
        console.error("Error checking reports:", err);
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirCotizacion = () => {
    setShowModalCotizacion(true);
  };

  const handleFinalizar = async () => {
    const confirmacion = window.confirm(`¿Estás seguro que deseas finalizar este reporte en la propiedad ${data?.propiedad_nombre}?`);
    if (!confirmacion) return;

    try {
      const realId = id.includes('-') ? id.split('-')[1] : id;
      
      // Cambiar estado a Listo
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/${realId}/status`, {
        status: 'Listo'
      });

      // Enviar notificación al Admin
      try {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/notifications/send-to-admin`, {
          title: "Trabajo Finalizado",
          message: `El Técnico ${user?.name || ''} finalizó el trabajo en la propiedad ${data?.propiedad_nombre || ''}.`,
          type: "work_order_finished",
          work_order_id: realId
        });
      } catch (notifError) {
        console.warn("No se pudo enviar la notificación o el backend ya se encarga de esto:", notifError);
      }

      setShowModalFinalizar(true);
    } catch (error) {
      console.error("Error finalizing job:", error);
      alert("Hubo un error al finalizar el trabajo. Por favor intenta de nuevo.");
    }
  };

  const abrirSurvey = async () => {
    if (!data?.property_id) return alert("Esta orden no tiene propiedad asociada.");
    
    setCargandoSurvey(true);
    setModalSurveyVisible(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/propiedades/${data.property_id}/survey`);
      
      let rawSurvey = response.data;
      
      const normalizeStr = (str) => {
        if (!str) return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      };
      
      const rawZone = data?.zone || (data?.titulo?.includes(" - ") ? data.titulo.split(" - ")[1] : null);
      
      if (rawZone && normalizeStr(rawZone) !== 'general') {
        const targetZone = normalizeStr(rawZone);
        
        let filteredSurvey = [];
        for (let area of rawSurvey) {
          const areaNameNorm = normalizeStr(area.name);
          if (areaNameNorm === targetZone) {
            filteredSurvey.push(area);
            continue;
          }
          const matchingSubareas = (area.subareas || []).filter(sub => normalizeStr(sub.name) === targetZone);
          if (matchingSubareas.length > 0) {
            filteredSurvey.push({
              ...area,
              subareas: matchingSubareas
            });
          }
        }
        
        if (filteredSurvey.length === 0) {
          for (let area of rawSurvey) {
            const areaNameNorm = normalizeStr(area.name);
            if (areaNameNorm.includes(targetZone) || targetZone.includes(areaNameNorm)) {
              filteredSurvey.push(area);
              continue;
            }
            const matchingSubareas = (area.subareas || []).filter(sub => {
              const subNameNorm = normalizeStr(sub.name);
              return subNameNorm.includes(targetZone) || targetZone.includes(subNameNorm);
            });
            if (matchingSubareas.length > 0) {
              filteredSurvey.push({
                ...area,
                subareas: matchingSubareas
              });
            }
          }
        }
        
        if (filteredSurvey.length > 0) {
          rawSurvey = filteredSurvey;
        }
      }

      setSurveyData(rawSurvey);
      if (rawSurvey.length > 0) {
        setAreaActivaSurvey(rawSurvey[0].id);
      }
    } catch (error) {
      console.error("Error cargando inventario:", error);
      alert("No se pudo cargar el inventario de la propiedad.");
    } finally {
      setCargandoSurvey(false);
    }
  };

  const toggleItem = (tipo, index) => {
    const nuevos = { ...itemsCheck };
    nuevos[tipo][index] = !nuevos[tipo][index];
    setItemsCheck(nuevos);
  };

  const todoMarcado = () => {
    return [...itemsCheck.materiales, ...itemsCheck.equipo, ...itemsCheck.herramientas].every(v => v === true);
  };

  const confirmarMateriales = () => {
    const realId = id.includes('-') ? id.split('-')[1] : id;
    localStorage.setItem(`materiales_confirmados_${realId}`, 'true');
    setMaterialesConfirmados(true);
    setShowModalMateriales(false);
  };

  const openInGoogleMaps = () => {
    if (data?.coordenadas) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${data.coordenadas}`, '_blank');
    }
  };

  const checklistObj = data?.custom_checklist 
    ? (typeof data.custom_checklist === 'string' ? JSON.parse(data.custom_checklist) : data.custom_checklist)
    : null;

  if (loading) {
    return (
      <div className="tp-loading-container">
        <div className="tp-loader"></div>
        <p>Cargando detalles del trabajo...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="tp-error-container">
        <AlertCircle size={48} color="#f26624" />
        <h2>No se encontró el trabajo</h2>
        <button onClick={() => navigate('/trabajos-tecnico')}>VOLVER AL LISTADO</button>
      </div>
    );
  }

  return (
    <div className="tp-page-wrapper">
      <Header />
      
      <div className="tp-content-body">
        <div className="tp-navigation-bar">
          <button 
            onClick={() => navigate('/trabajos-tecnico')} 
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '8px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            <ChevronLeft size={20} />
            <span>REGRESAR</span>
          </button>
          <div className="tp-status-pill" data-status={data.estado}>
            {data.estado}
          </div>
        </div>

        <section className="tp-property-hero">
          <div className="tp-hero-overlay"></div>
          {data.foto_fachada && (
            <img src={data.foto_fachada} alt="Fachada" className="tp-hero-bg" />
          )}
          
          <div className="tp-hero-content">
            <div className="tp-hero-text">
              <span className="tp-id-badge">{data.identificador_curp}</span>
              <h1 className="tp-property-name">{data.propiedad_nombre}</h1>
              <div className="tp-property-address">
                <MapPin size={16} />
                <p>{data.direccion}</p>
              </div>
            </div>
            
            <div className="tp-hero-actions">
              <button className="tp-action-btn maps" onClick={openInGoogleMaps}>
                <Navigation size={18} />
                <span>GPS</span>
              </button>
              <button className="tp-action-btn call" onClick={() => window.open(`tel:${data.telefono_cliente || ''}`)}>
                <Phone size={18} />
                <span>Llamar</span>
              </button>
            </div>
          </div>
        </section>

        <div className="tp-main-grid">
          <div className="tp-details-column">
            <motion.div 
              className="tp-card tp-work-description-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="tp-card-header">
                <FileText size={20} />
                <h3>CONSISTE EN:</h3>
              </div>
              <div className="tp-work-description-v2">
                {(() => {
                  if (!data.descripcion) return <p className="tp-empty-desc">Sin descripción detallada.</p>;
                  
                  if (data.descripcion.includes('[EQUIPO AFECTADO]:')) {
                    const parts = data.descripcion.split('[EQUIPO AFECTADO]:');
                    const problema = parts[0].trim();
                    const equipo = parts[1].trim();

                    return (
                      <div className="tp-description-grid">
                        <div className="tp-desc-item">
                          <div className="tp-desc-icon problem">
                            <AlertTriangle size={20} />
                          </div>
                          <div className="tp-desc-text">
                            <label>TIPO DE FALLA / PROBLEMA</label>
                            <strong>{problema || 'No especificado'}</strong>
                          </div>
                        </div>

                        <div className="tp-desc-item">
                          <div className="tp-desc-icon equipment">
                            <Zap size={20} />
                          </div>
                          <div className="tp-desc-text">
                            <label>EQUIPO O COMPONENTE AFECTADO</label>
                            <strong>{equipo || 'No especificado'}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="tp-desc-fallback">
                      <div className="tp-desc-icon general">
                        <FileText size={20} />
                      </div>
                      <div className="tp-desc-text">
                        <label>DETALLES DEL SERVICIO</label>
                        <p style={{ whiteSpace: 'pre-line' }}>{data.descripcion}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="tp-work-meta">
                <div className="tp-meta-item">
                  <Clock size={16} />
                  <span>Programado: {data.fecha_programada || 'Pendiente'}</span>
                </div>
                <div className="tp-meta-item">
                  <Wrench size={16} />
                  <span>Título: {data.titulo}</span>
                </div>
              </div>
            </motion.div>

            {checklistObj && (
              <motion.div 
                className="tp-card tp-materials-preview-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="tp-card-header">
                  <Package size={20} />
                  <h3>MATERIALES Y EQUIPO</h3>
                </div>
                <div className="tp-materials-summary">
                  <div className="tp-mat-tag">{(checklistObj.materiales || checklistObj.material || []).length} Materiales</div>
                  <div className="tp-mat-tag">{(checklistObj.equipo || []).length} Equipos</div>
                  <div className="tp-mat-tag">{(checklistObj.herramientas || []).length} Herramientas</div>
                </div>
              </motion.div>
            )}

            <motion.div 
              className="tp-card tp-client-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="tp-card-header">
                <User size={20} />
                <h3>DATOS DEL CLIENTE</h3>
              </div>
              <div className="tp-client-info">
                <p><strong>Nombre:</strong> {data.propietario}</p>
                <p><strong>Teléfono:</strong> {data.telefono_cliente || 'No registrado'}</p>
                <p><strong>Tipo:</strong> {data.tipoPropiedad}</p>
              </div>
            </motion.div>

            <motion.div 
              className="tp-card tp-team-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="tp-card-header">
                <User size={20} />
                <h3>EQUIPO DE TRABAJO</h3>
              </div>
              <div className="tp-team-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {(data?.technicians || []).map((tech, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#e2e2e2', padding: '10px', borderRadius: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#d1d1d1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {tech.picture ? <img src={tech.picture} alt={tech.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <User size={24} color="#000" />}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{tech.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>ID: {tech.id} | ÁREA: {tech.role || 'TÉCNICO'}</p>
                    </div>
                  </div>
                ))}
                {(data?.technicians || []).length === 0 && <p style={{color: '#000'}}>No hay equipo asignado.</p>}
              </div>
            </motion.div>
          </div>

          <div className="tp-actions-column">
            <motion.div 
              className="tp-card tp-flow-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3>ACCIONES DE FLUJO</h3>
              <p className="tp-flow-instruction">¿Listo para comenzar o terminar?</p>
              
              <div className="tp-flow-buttons">
                <button className="tp-btn-consult variant-orange" onClick={() => setVerEvidencias(true)}>
                  <Camera size={18} />
                  <span>VER EVIDENCIAS Y PROCESO</span>
                </button>

                <button className="tp-btn-consult variant-dark" onClick={abrirSurvey}>
                  <Layout size={18} />
                  <span>CONSULTAR LEVANTAMIENTO</span>
                </button>

                <button className="tp-btn-consult variant-quote" onClick={handleAbrirCotizacion}>
                  <Calculator size={18} />
                  <span>{cotizacionExistente ? 'CONSULTAR COTIZACIÓN' : 'COTIZAR TRABAJO'}</span>
                </button>

                <div className="tp-divider-mini"></div>

                <button 
                  className={`tp-btn-checklist-trigger ${materialesConfirmados ? 'confirmed' : 'pending'}`}
                  onClick={() => setShowModalMateriales(true)}
                >
                  <Package size={20} />
                  <span>{materialesConfirmados ? "MATERIALES LISTOS" : "CONFIRMAR MATERIALES"}</span>
                </button>

                <button 
                  className={`tp-btn-primary ${!materialesConfirmados ? 'locked' : ''}`} 
                  onClick={() => {
                    if (materialesConfirmados) {
                      navigate(hasReports ? `/galeria-reportes/${id}` : `/nuevo-reporte`, { state: { trabajoId: id, servicio: data } });
                    }
                  }}
                  disabled={!materialesConfirmados}
                  style={hasReports ? { background: '#3b82f6', borderColor: '#3b82f6' } : {}}
                >
                  
                  {!materialesConfirmados && <Lock size={18} />}
                  <span>{hasReports ? 'CONTINUAR REPORTE' : 'INICIAR REPORTE'}</span>
                  <ArrowRight size={18} />
                </button>

                {data.estado !== 'Listo' && data.estado !== 'Finalizado' && (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: '10px' }}>
                    <button 
                      className={`tp-btn-secondary ${!hasReports ? 'locked' : ''}`}
                      onClick={handleFinalizar}
                      disabled={!hasReports}
                      style={{ 
                        background: hasReports ? '#22c55e' : '#374151', 
                        borderColor: hasReports ? '#22c55e' : '#374151',
                        color: hasReports ? '#ffffff' : '#9ca3af',
                        cursor: hasReports ? 'pointer' : 'not-allowed',
                        width: '100%'
                      }}
                    >
                      {!hasReports ? <Lock size={18} /> : <CheckCircle2 size={18} />}
                      <span>{user?.role_id === 2 ? 'FINALIZAR TRABAJO' : 'MARCAR COMO LISTO (ADMIN)'}</span>
                    </button>
                    
                    {!hasReports && (
                      <p className="tp-lock-msg" style={{ marginTop: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
                        Debe levantar al menos un reporte para finalizar
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {!materialesConfirmados && (
                <p className="tp-lock-msg">Debe confirmar materiales para iniciar</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModalMateriales && (
          <div className="tp-modal-overlay">
            <motion.div 
              className="tp-modal-content-checklist"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <div className="tp-modal-header-check">
                <Package size={24} color="#f26624" />
                <h2>Lista de Ruta / Materiales</h2>
                <button className="tp-close-modal-btn" onClick={() => setShowModalMateriales(false)}>×</button>
              </div>

              <div className="tp-modal-scroll-body">
                {(checklistObj?.materiales || checklistObj?.material || []).length > 0 && (
                  <div className="tp-check-section">
                    <h4>Materiales</h4>
                    <div className="tp-check-grid">
                      {(checklistObj.materiales || checklistObj.material).map((m, i) => (
                        <label key={i} className={`tp-check-label ${itemsCheck.materiales[i] ? 'checked' : ''}`}>
                          <input type="checkbox" checked={itemsCheck.materiales[i]} onChange={() => toggleItem('materiales', i)} />
                          <span>{typeof m === 'string' ? m : m.nombre || m.task || m.concepto}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {(checklistObj?.equipo || []).length > 0 && (
                  <div className="tp-check-section">
                    <h4>Equipo</h4>
                    <div className="tp-check-grid">
                      {checklistObj.equipo.map((e, i) => (
                        <label key={i} className={`tp-check-label ${itemsCheck.equipo[i] ? 'checked' : ''}`}>
                          <input type="checkbox" checked={itemsCheck.equipo[i]} onChange={() => toggleItem('equipo', i)} />
                          <span>{typeof e === 'string' ? e : e.nombre || e.task || e.concepto}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {(checklistObj?.herramientas || []).length > 0 && (
                  <div className="tp-check-section">
                    <h4>Herramientas</h4>
                    <div className="tp-check-grid">
                      {checklistObj.herramientas.map((h, i) => (
                        <label key={i} className={`tp-check-label ${itemsCheck.herramientas[i] ? 'checked' : ''}`}>
                          <input type="checkbox" checked={itemsCheck.herramientas[i]} onChange={() => toggleItem('herramientas', i)} />
                          <span>{typeof h === 'string' ? h : h.nombre || h.task || h.concepto}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="tp-modal-footer-check">
                <button 
                  className={`tp-btn-confirm-check ${todoMarcado() ? 'ready' : 'disabled'}`}
                  disabled={!todoMarcado() && (checklistObj?.materiales || checklistObj?.material || checklistObj?.equipo || checklistObj?.herramientas)}
                  onClick={confirmarMateriales}
                >
                  {todoMarcado() ? "CONFIRMAR Y DESBLOQUEAR" : "FALTA MARCAR ITEMS"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalSurveyVisible && (
          <div className="tp-modal-overlay survey-theme">
            <motion.div 
              className="tp-modal-survey-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="tp-survey-header">
                <div className="tp-survey-header-info">
                  <Layout size={24} color="#F26522" />
                  <div>
                    <h3>INVENTARIO TÉCNICO {data?.zone ? ` - ZONA: ${data.zone.toUpperCase()}` : ''}</h3>
                    <p>{data.propiedad_nombre}</p>
                  </div>
                </div>
                <button className="tp-close-survey-btn" onClick={() => setModalSurveyVisible(false)}>✕</button>
              </div>

              <div className="tp-survey-body">
                {cargandoSurvey ? (
                  <div className="tp-survey-loading">Cargando inventario...</div>
                ) : (
                  <div className="tp-survey-content-layout">
                    <aside className="tp-survey-sidebar">
                      {(surveyData || []).map(area => (
                        <button 
                          key={area.id} 
                          className={`tp-area-nav-item ${areaActivaSurvey === area.id ? 'active' : ''}`}
                          onClick={() => setAreaActivaSurvey(area.id)}
                        >
                          {area.name}
                        </button>
                      ))}
                    </aside>

                    <main className="tp-survey-main">
                      {surveyData && surveyData.find(a => a.id === areaActivaSurvey) ? (
                        (() => {
                          const area = surveyData.find(a => a.id === areaActivaSurvey);
                          return (
                            <div className="tp-area-details">
                              <div className="tp-area-banner">
                                <img src={area.photo || '/placeholder-area.jpg'} alt={area.name || 'Área'} />
                                <h2>{area.name || 'Sin nombre'}</h2>
                              </div>
                              <div className="tp-categories-stack">
                                {area.subareas && area.subareas.length > 0 ? (
                                  area.subareas.map(sub => (
                                    <div key={sub.id} className="tp-subarea-section" style={{ marginBottom: '25px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                                      <h3 style={{ color: '#F26522', fontWeight: '800', fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                                        <span style={{ width: '4px', height: '18px', background: '#F26522', borderRadius: '2px', display: 'inline-block' }}></span>
                                        {sub.name}
                                      </h3>
                                      {Object.entries(sub.categories || {}).length === 0 ? (
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', paddingLeft: '12px' }}>No hay elementos registrados en esta zona.</p>
                                      ) : (
                                        Object.entries(sub.categories || {}).map(([catName, items]) => (
                                          <div key={catName} className="tp-category-group" style={{ paddingLeft: '12px', marginTop: '10px' }}>
                                            <h4 style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>{catName}</h4>
                                            <div className="tp-items-grid">
                                              {items.map(item => (
                                                <div key={item.id} className="tp-tech-item">
                                                  <img src={item.image_path || '/placeholder-item.jpg'} onClick={() => setImagenExpandida(item.image_path)} alt={item.sub_category} />
                                                  <div className="tp-tech-item-info">
                                                    <strong>{item.sub_category}</strong>
                                                    <div className="tp-specs">
                                                      <span>M: {item.brand || '---'}</span>
                                                      <span>MOD: {item.model_or_color || '---'}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  Object.entries(area.categories || {}).map(([catName, items]) => (
                                    <div key={catName} className="tp-category-group">
                                      <h4>{catName.toUpperCase()}</h4>
                                      <div className="tp-items-grid">
                                        {items.map(item => (
                                          <div key={item.id} className="tp-tech-item">
                                            <img src={item.image_path || '/placeholder-item.jpg'} onClick={() => setImagenExpandida(item.image_path)} alt={item.sub_category} />
                                            <div className="tp-tech-item-info">
                                              <strong>{item.sub_category}</strong>
                                              <div className="tp-specs">
                                                <span>M: {item.brand || '---'}</span>
                                                <span>MOD: {item.model_or_color || '---'}</span>
                                              </div>
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
                        <div className="tp-select-area">Selecciona un área</div>
                      )}
                    </main>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {verEvidencias && (
          <div className="tp-modal-overlay">
            <motion.div 
              className="tp-modal-content evidencias-theme"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <div className="tp-modal-header-check">
                <Camera size={24} color="#f26624" />
                <h2>Evidencias del Servicio</h2>
                <button className="tp-close-modal-btn" onClick={() => setVerEvidencias(false)}>×</button>
              </div>
              <div className="tp-evidencias-scroll">
                {data.evidencias && data.evidencias.length > 0 ? (
                  <div className="tp-evidencias-grid">
                    {data.evidencias.map((img, i) => (
                      <div key={i} className="tp-evidencia-card" onClick={() => setImagenExpandida(img)}>
                        <img src={img} alt={`Evidencia ${i}`} />
                        <div className="tp-zoom-overlay-icon"><Maximize2 size={20} /></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="tp-empty-evidencias">No hay evidencias enviadas para este reporte.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {imagenExpandida && (
          <div className="tp-zoom-full-overlay" onClick={() => setImagenExpandida(null)}>
            <motion.img 
              src={imagenExpandida} 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
            />
            <button className="tp-close-zoom" onClick={() => setImagenExpandida(null)}><X size={32}/></button>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModalFinalizar && (
          <div className="tp-modal-overlay">
            <motion.div 
              className="tp-modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="tp-success-icon">
                <CheckCircle2 size={64} color="#f26624" />
              </div>
              <h2>¡TRABAJO FINALIZADO!</h2>
              <p>Se ha enviado para verificación del administrador.</p>
              <button onClick={() => navigate('/trabajos-tecnico')}>VOLVER AL TABLERO</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showModalCotizacion && (
        <ModalCrearCotizacion
          workOrderId={id.includes('work_order') ? id.split('-')[1] : null}
          serviceId={!id.includes('work_order') ? (id.includes('-') ? id.split('-')[1] : id) : null}
          cotizacionExistente={cotizacionExistente}
          onClose={() => setShowModalCotizacion(false)}
          onSuccess={(data) => {
            setCotizacionExistente(data.cotizacion || data);
            checkExistingQuote();
          }}
        />
      )}
    </div>
  );
};

export default TrabajoPropiedad;
