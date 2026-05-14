import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Header from "../Shared/Header";
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
  const [tabCotizacion, setTabCotizacion] = useState('manual'); // 'manual' o 'archivo'
  const [filasConceptos, setFilasConceptos] = useState([{ id: Date.now(), desc: '', cant: 1, precio: 0 }]);
  const [filasMateriales, setFilasMateriales] = useState([{ id: Date.now() + 1, desc: '', cant: 1, precio: 0 }]);
  const [observacionesCotizacion, setObservacionesCotizacion] = useState('');
  const [archivoCotizacion, setArchivoCotizacion] = useState(null);
  const [cotizacionExistente, setCotizacionExistente] = useState(null);
  const [modoConsulta, setModoConsulta] = useState(false);
  const [enviandoCotizacion, setEnviandoCotizacion] = useState(false);
  const [cotizacionEnviada, setCotizacionEnviada] = useState(false);

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
    if (cotizacionExistente) {
      setModoConsulta(true);
      // Usamos los nombres en inglés que vienen del controlador actualizado
      if (cotizacionExistente.type === 'manual') {
        const parsed = typeof cotizacionExistente.concept === 'string' ? JSON.parse(cotizacionExistente.concept) : cotizacionExistente.concept;
        setFilasConceptos(parsed.servicios.map((s, i) => ({ id: i, desc: s.descripcion, cant: s.cantidad, precio: s.precio })));
        setFilasMateriales(parsed.materiales.map((m, i) => ({ id: i + 1000, desc: m.descripcion, cant: m.cantidad, precio: m.precio })));
        setObservacionesCotizacion(cotizacionExistente.observations || '');
        setTabCotizacion('manual');
      } else {
        setTabCotizacion('archivo');
      }
    } else {
      setModoConsulta(false);
      setFilasConceptos([{ id: Date.now(), desc: '', cant: 1, precio: 0 }]);
      setFilasMateriales([{ id: Date.now() + 1, desc: '', cant: 1, precio: 0 }]);
      setObservacionesCotizacion('');
    }
    setShowModalCotizacion(true);
  };

  const handleFinalizar = async () => {
    try {
      const realId = id.includes('-') ? id.split('-')[1] : id;
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/${realId}/status`, {
        status: 'Listo'
      });
      setShowModalFinalizar(true);
    } catch (error) {
      console.error("Error finalizing job:", error);
    }
  };

  const abrirSurvey = async () => {
    if (!data?.property_id) return alert("Esta orden no tiene propiedad asociada.");
    
    setCargandoSurvey(true);
    setModalSurveyVisible(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/propiedades/${data.property_id}/survey`);
      setSurveyData(response.data);
      if (response.data.length > 0) {
        setAreaActivaSurvey(response.data[0].id);
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

  const addFila = (setter) => setter(prev => [...prev, { id: Date.now(), desc: '', cant: 1, precio: 0 }]);
  const removeFila = (setter, id) => setter(prev => prev.filter(f => f.id !== id));
  const updateFila = (setter, id, field, value) => {
    setter(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const calcularTotal = () => {
    const totalConceptos = filasConceptos.reduce((acc, f) => acc + (Number(f.cant) * Number(f.precio)), 0);
    const totalMateriales = filasMateriales.reduce((acc, f) => acc + (Number(f.cant) * Number(f.precio)), 0);
    return totalConceptos + totalMateriales;
  };

  const enviarCotizacion = async () => {
    try {
      setEnviandoCotizacion(true);
      const realId = id.includes('-') ? id.split('-')[1] : id;
      const isWorkOrder = id.includes('work_order');

      const formData = new FormData();
      formData.append('type', tabCotizacion);
      
      if (isWorkOrder) {
        formData.append('work_order_id', realId);
      } else {
        formData.append('service_id', realId);
      }

      if (tabCotizacion === 'manual') {
        const conceptData = {
          servicios: filasConceptos.map(f => ({ descripcion: f.desc, cantidad: f.cant, precio: f.precio })),
          materiales: filasMateriales.map(f => ({ descripcion: f.desc, cantidad: f.cant, precio: f.precio }))
        };
        formData.append('concept', JSON.stringify(conceptData));
        formData.append('estimated_amount', calcularTotal());
        formData.append('observations', observacionesCotizacion);
      } else {
        if (!archivoCotizacion) return alert("Por favor seleccione un archivo.");
        formData.append('file', archivoCotizacion);
      }

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 201) {
        setCotizacionEnviada(true);
        setTimeout(() => {
          setShowModalCotizacion(false);
          setCotizacionEnviada(false);
          setFilasConceptos([{ id: Date.now(), desc: '', cant: 1, precio: 0 }]);
          setFilasMateriales([{ id: Date.now() + 1, desc: '', cant: 1, precio: 0 }]);
          setArchivoCotizacion(null);
        }, 2000);
      }
    } catch (error) {
      console.error("Error enviando cotización:", error);
      const msg = error.response?.data?.error || error.message || "Error desconocido";
      alert("Hubo un error al enviar la cotización: " + msg);
    } finally {
      setEnviandoCotizacion(false);
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

                {/* BOTÓN FINALIZAR (Visible para Admin y Técnico) */}
                <button 
                  className="tp-btn-secondary"
                  onClick={handleFinalizar}
                  style={{ background: '#22c55e', marginTop: '10px' }}
                >
                  <CheckCircle2 size={18} />
                  <span>{user?.role_id === 2 ? 'FINALIZAR TRABAJO' : 'MARCAR COMO LISTO (ADMIN)'}</span>
                </button>
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
                    <h3>INVENTARIO TÉCNICO</h3>
                    <p>{data.propiedad_nombre}</p>
                  </div>
                </div>
                <button className="tp-close-survey-btn" onClick={() => setModalSurveyVisible(false)}><X size={24}/></button>
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
                                {Object.entries(area.categories || {}).map(([catName, items]) => (
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
                                ))}
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

      <AnimatePresence>
        {showModalCotizacion && (
          <div className="tp-modal-overlay">
            <motion.div 
              className="tp-modal-quotation-card"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <div className="tp-modal-q-header">
                <div className="tp-q-header-title">
                  <Calculator size={24} color="#f26624" />
                  <h2>{modoConsulta ? 'DETALLE DE COTIZACIÓN' : 'NUEVA COTIZACIÓN'} - {data?.propiedad_nombre || 'S/N'}</h2>
                </div>
                <button className="tp-close-modal-btn" onClick={() => setShowModalCotizacion(false)}><X size={24}/></button>
              </div>

              {!modoConsulta && (
                <div className="tp-modal-q-tabs">
                  <button 
                    className={`tp-q-tab ${tabCotizacion === 'manual' ? 'active' : ''}`}
                    onClick={() => setTabCotizacion('manual')}
                  >
                    <FileText size={18} />
                    <span>Registro Manual</span>
                  </button>
                  <button 
                    className={`tp-q-tab ${tabCotizacion === 'archivo' ? 'active' : ''}`}
                    onClick={() => setTabCotizacion('archivo')}
                  >
                    <Upload size={18} />
                    <span>Cargar Archivo</span>
                  </button>
                </div>
              )}

              <div className="tp-modal-q-body">
                {tabCotizacion === 'manual' ? (
                  <div className="tp-q-manual-form">
                    <div className="tp-q-section">
                      <div className="tp-q-section-header">
                        <h3>1. CONCEPTOS DE SERVICIO</h3>
                        <div className="tp-q-line"></div>
                      </div>
                      <div className="tp-q-table-header">
                        <span className="col-desc">DESCRIPCIÓN</span>
                        <span className="col-cant">CANT.</span>
                        <span className="col-price">PRECIO U.</span>
                        <span className="col-sub">SUBTOTAL</span>
                        <span className="col-actions"></span>
                      </div>
                      <div className="tp-q-rows-container">
                        {filasConceptos.map(f => (
                          <div key={f.id} className="tp-q-row">
                            <input 
                              type="text" 
                              className="tp-q-input desc" 
                              placeholder="Ej: Instalación de luminarias"
                              value={f.desc}
                              onChange={(e) => updateFila(setFilasConceptos, f.id, 'desc', e.target.value)}
                              readOnly={modoConsulta}
                            />
                            <input 
                              type="number" 
                              className="tp-q-input cant" 
                              value={f.cant}
                              onChange={(e) => updateFila(setFilasConceptos, f.id, 'cant', e.target.value)}
                              readOnly={modoConsulta}
                            />
                            <div className="tp-q-price-wrapper">
                              <span>$</span>
                              <input 
                                type="number" 
                                className="tp-q-input" 
                                value={f.precio}
                                onChange={(e) => updateFila(setFilasConceptos, f.id, 'precio', e.target.value)}
                                readOnly={modoConsulta}
                              />
                            </div>
                            <span className="tp-q-subtotal">${(f.cant * f.precio).toLocaleString()}</span>
                            {!modoConsulta && (
                              <button className="tp-q-btn-del" onClick={() => removeFila(setFilasConceptos, f.id)}><X size={16}/></button>
                            )}
                          </div>
                        ))}
                      </div>
                      {!modoConsulta && (
                        <button className="tp-q-btn-add" onClick={() => addFila(setFilasConceptos)}>
                          <Plus size={16} />
                          <span>Agregar Concepto</span>
                        </button>
                      )}
                    </div>

                    <div className="tp-q-section">
                      <div className="tp-q-section-header">
                        <h3>2. MATERIALES</h3>
                        <div className="tp-q-line"></div>
                      </div>
                      
                      <div className="tp-q-table-header">
                        <span className="col-desc">MATERIAL</span>
                        <span className="col-cant">CANT.</span>
                        <span className="col-price">COSTO U.</span>
                        <span className="col-sub">SUBTOTAL</span>
                        <span className="col-actions"></span>
                      </div>

                      <div className="tp-q-rows-container">
                        {filasMateriales.map(f => (
                          <div key={f.id} className="tp-q-row">
                            <input 
                              type="text" 
                              className="tp-q-input desc" 
                              placeholder="Ej: Cable UTP"
                              value={f.desc}
                              onChange={(e) => updateFila(setFilasMateriales, f.id, 'desc', e.target.value)}
                            />
                            <input 
                              type="number" 
                              className="tp-q-input cant" 
                              value={f.cant}
                              onChange={(e) => updateFila(setFilasMateriales, f.id, 'cant', e.target.value)}
                            />
                            <div className="tp-q-price-wrapper">
                              <span>$</span>
                              <input 
                                type="number" 
                                className="tp-q-input price" 
                                value={f.precio}
                                onChange={(e) => updateFila(setFilasMateriales, f.id, 'precio', e.target.value)}
                              />
                            </div>
                            <span className="tp-q-subtotal">${(f.cant * f.precio).toLocaleString()}</span>
                            <button className="tp-q-btn-del" onClick={() => removeFila(setFilasMateriales, f.id)}><Trash2 size={16}/></button>
                          </div>
                        ))}
                      </div>
                      <button className="tp-q-btn-add" onClick={() => addFila(setFilasMateriales)}>
                        <Plus size={16} />
                        <span>Agregar Material</span>
                      </button>
                    </div>

                    {/* SECCIÓN 3: OBSERVACIONES */}
                    <div className="tp-q-section">
                      <div className="tp-q-section-header">
                        <h3>3. OBSERVACIONES ADICIONALES</h3>
                        <div className="tp-q-line"></div>
                      </div>
                      <textarea 
                        className="tp-q-textarea"
                        placeholder="Notas internas..."
                        value={observacionesCotizacion}
                        onChange={(e) => setObservacionesCotizacion(e.target.value)}
                        readOnly={modoConsulta}
                      ></textarea>
                    </div>
                  </div>
                ) : (
                  <div className="tp-q-file-upload">
                    {modoConsulta ? (
                      <div className="tp-q-view-file">
                        <FileText size={48} color="#f26624" />
                        <p>Esta cotización fue cargada como archivo.</p>
                        <a href={cotizacionExistente.archivo_url} target="_blank" rel="noreferrer" className="tp-q-btn-view">VER ARCHIVO</a>
                      </div>
                    ) : (
                      <div className="tp-upload-area" onClick={() => document.getElementById('q-file-input').click()}>
                        <Upload size={48} color="#f26624" />
                        <p>{archivoCotizacion ? archivoCotizacion.name : "Haga clic para seleccionar el archivo de cotización (PDF/Imagen)"}</p>
                        <input 
                          id="q-file-input" 
                          type="file" 
                          hidden 
                          onChange={(e) => setArchivoCotizacion(e.target.files[0])}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="tp-modal-q-footer">
                <div className="tp-q-total-card">
                  <span className="tp-q-total-label">TOTAL ESTIMADO:</span>
                  <span className="tp-q-total-amount">${Number(calcularTotal()).toLocaleString()}</span>
                </div>
                <div className="tp-q-footer-actions">
                  {modoConsulta ? (
                    <button className="tp-q-btn-cancel-new" onClick={() => setShowModalCotizacion(false)}>CERRAR</button>
                  ) : (
                    <>
                      <button className="tp-q-btn-cancel-new" onClick={() => setShowModalCotizacion(false)}>CANCELAR</button>
                      <button 
                        className={`tp-q-btn-save-new ${enviandoCotizacion ? 'loading' : ''}`}
                        onClick={enviarCotizacion}
                        disabled={enviandoCotizacion || cotizacionEnviada}
                      >
                        {enviandoCotizacion ? "ENVIANDO..." : cotizacionEnviada ? "¡ENVIADO!" : "GUARDAR COTIZACIÓN"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrabajoPropiedad;
