import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, CheckCircle2, ListTodo, Timer, AlertCircle, 
  FileText, History, ChevronDown, ChevronUp, X, 
  User, Eye, MapPin, Tag, PlusCircle, 
  Home, Wrench, MessageSquare, Camera, ImageIcon,
  ChevronLeft, ArrowLeft, Loader2, Clock, Briefcase
} from 'lucide-react';
import '../../styles/Cliente/DetallePropiedad.css';

const VistaDetallePropiedad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // --- ESTADOS DE DATOS (Backend) ---
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE UI (Modales y Toggles) ---
  const [mostrarHistorial, setMostrarHistorial] = useState(true);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [mostrarPerfilPropiedad, setMostrarPerfilPropiedad] = useState(false);
  const [mostrarModalServicio, setMostrarModalServicio] = useState(false);
  
  // --- ESTADOS FORMULARIO NUEVO SERVICIO ---
  const [zonasDisponibles, setZonasDisponibles] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [loadingZonas, setLoadingZonas] = useState(false);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  
  // Añadimos 'tipo' al estado inicial
  const [nuevoServicio, setNuevoServicio] = useState({
    tipo: '', zona: '', area_id: '', equipo: '', descripcion: '', fotos: [] 
  });
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const cameraRef = React.useRef(null);
  const galleryRef = React.useRef(null);
  const [reportesDetallados, setReportesDetallados] = useState([]);
  const [cargandoReportes, setCargandoReportes] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  const fetchDetalleTrabajo = async (item) => {
    setReporteSeleccionado(item);
    setReportesDetallados([]);
    setCargandoReportes(true);

    try {
      const token = localStorage.getItem('agente_token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios/${item.id}/reportes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setReportesDetallados(res.data || []);
    } catch (error) {
      console.error("Error al cargar la bitácora del trabajo:", error);
    } finally {
      setCargandoReportes(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('agente_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

       const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/propiedades/${id}/dashboard`, { headers });
      
      // Mapeamos el historial para que coincida con el componente visual
      if (response.data.historial) {
        response.data.historial = response.data.historial.map(h => ({
          id: h.id,
          producto: h.title || h.labor || "Trabajo Finalizado",
          tecnico: h.tecnico_nombre || "Técnico",
          fecha: new Date(h.updated_at || h.fecha).toLocaleDateString(),
          evidencias: h.fotos || []
        }));
      }

      setData(response.data);
      
      // Sincronizamos el contexto del sidebar por si acaso
      localStorage.setItem('current_property_id', id);
      if (response.data.id_levantamiento) {
        localStorage.setItem('current_levantamiento_id', response.data.id_levantamiento);
      } else {
        localStorage.removeItem('current_levantamiento_id');
      }
      
      // DISPARAMOS EVENTO PARA QUE EL SIDEBAR SE ENTERE DEL CAMBIO
      window.dispatchEvent(new Event('sync-agente-ids'));
      
      // Fetch real zones for this property
      setLoadingZonas(true);
      const areasRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/properties/${id}/areas`, { headers });
      setZonasDisponibles(areasRes.data || []);
    } catch (error) {
      console.error("Error cargando el dashboard o zonas:", error);
    } finally {
      setLoading(false);
      setLoadingZonas(false);
    }
  };

  useEffect(() => {
    if (id) fetchDashboardData();
  }, [id]);

  const handleSubmitServicio = async (e) => {
    e.preventDefault();
    // Validamos que el tipo, la zona y la descripción no estén vacíos
    if (!nuevoServicio.tipo || !nuevoServicio.area_id || !nuevoServicio.descripcion) {
      alert("Por favor completa los campos obligatorios (Tipo, Zona y Descripción).");
      return;
    }

    setLoadingSubmit(true);
    try {
      const token = localStorage.getItem('agente_token');
      const formData = new FormData();
      
      formData.append('property_id', id);
      formData.append('type', nuevoServicio.tipo); // Nuevo campo
      formData.append('zone', nuevoServicio.zona);
      formData.append('equipment', nuevoServicio.equipo || '');
      
      // Combinar descripción con equipo si existe
      const descFinal = nuevoServicio.equipo 
        ? `${nuevoServicio.descripcion}\n\n[EQUIPO AFECTADO]: ${nuevoServicio.equipo}`
        : nuevoServicio.descripcion;
      
      formData.append('description', descFinal);
      
      // Agregamos las fotos dinámicamente (evidence_1 y evidence_2)
      nuevoServicio.fotos.forEach((foto, index) => {
        formData.append(`evidence_${index + 1}`, foto);
      });

      // Petición POST a la nueva ruta de work-orders
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/work-orders/cliente`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.data.success) {
        alert("✅ Reporte levantado con éxito. Un técnico revisará tu solicitud pronto.");
        setMostrarModalServicio(false);
        setNuevoServicio({ tipo: '', zona: '', area_id: '', equipo: '', descripcion: '', fotos: [] });
        fetchDashboardData(); // Recargar datos para ver el nuevo servicio en stats
      }
    } catch (error) {
      console.error("Error enviando servicio:", error);
      alert("❌ Error al enviar el reporte. Por favor, intenta de nuevo.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const nuevasFotos = [...nuevoServicio.fotos, ...files].slice(0, 2);
    setNuevoServicio({ ...nuevoServicio, fotos: nuevasFotos });
  };

  const removeFoto = (index) => {
    const nuevasFotos = nuevoServicio.fotos.filter((_, i) => i !== index);
    setNuevoServicio({ ...nuevoServicio, fotos: nuevasFotos });
  };

  // Manejador del select de zonas en el modal
  const handleZonaChange = async (areaId) => {
    if (areaId === 'otro') {
      setNuevoServicio({ 
        ...nuevoServicio, 
        area_id: 'otro', 
        zona: 'Otro', 
        equipo: '' 
      });
      setEquiposDisponibles([]);
      return;
    }

    let selectedArea = zonasDisponibles.find(z => z.id === parseInt(areaId));
    if (!selectedArea) {
      for (const zona of zonasDisponibles) {
        const sub = (zona.sub_areas || zona.subAreas || []).find(s => s.id === parseInt(areaId));
        if (sub) {
          selectedArea = { ...sub, name: `${zona.name} - ${sub.name}` };
          break;
        }
      }
    }

    setNuevoServicio({ 
      ...nuevoServicio, 
      area_id: areaId, 
      zona: selectedArea ? selectedArea.name : '', 
      equipo: '' 
    });
    
    if (areaId) {
      setLoadingEquipos(true);
      try {
        const token = localStorage.getItem('agente_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/areas/${areaId}/components`, { headers });
        setEquiposDisponibles(res.data || []);
      } catch (error) {
        console.error("Error cargando equipos:", error);
        setEquiposDisponibles([]);
      } finally {
        setLoadingEquipos(false);
      }
    } else {
      setEquiposDisponibles([]);
    }
  };

  const selectPhotoSource = (source) => {
    if (source === 'camera') {
      cameraRef.current.click();
    } else {
      galleryRef.current.click();
    }
    setIsPhotoMenuOpen(false);
  };

  // --- RENDERIZADO CONDICIONAL MIENTRAS CARGA ---
  if (loading) return <div className="loading" style={{textAlign: 'center', padding: '50px'}}>Cargando Tablero...</div>;
  if (!data) return <div className="error" style={{textAlign: 'center', padding: '50px'}}>No se encontró la información de la propiedad.</div>;

  // Extraemos la información del JSON que mandó Laravel
  const { propiedad, stats, historial, cotizaciones_pendientes, avance_obra } = data;

  return (
    <div className="view-container">
      <div className="main-layout-detail">
        {/* ==========================================
            COLUMNA IZQUIERDA (Info + Historial)
            ========================================== */}
        <div className="left-column">
          <div className="property-id-header">
            <button className="btn-id-profile" onClick={() => setMostrarPerfilPropiedad(true)}>
              <Tag size={16} /> ID REGISTRO: <strong>{propiedad.custom_curp || propiedad.id}</strong>
            </button>
          </div>

          <div className="hero-section-compact">
            <img 
              src={propiedad.facade_photo_path ? propiedad.facade_photo_path : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1000'} 
              alt="Propiedad" 
              className="hero-img" 
            />
          </div>

          <div className="info-card-premium historial-section">
            <div className="card-header-clean historial-trigger" onClick={() => setMostrarHistorial(!mostrarHistorial)}>
              <div className="header-title-flex">
                <History size={20} className="icon-orange" />
                <h3>Historial de Trabajos</h3>
              </div>
              {mostrarHistorial ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {mostrarHistorial && (
              <div className="historial-list-container">
                {historial && historial.length > 0 ? (
                  historial.map((trabajo) => (
                    <div key={trabajo.id} className="historial-card-item" onClick={() => fetchDetalleTrabajo(trabajo)}>
                      <div className="h-card-left">
                        <span className="h-card-date">{trabajo.fecha}</span>
                        <h4 className="h-card-title">{trabajo.producto}</h4>
                        <span className="h-card-tech">Por: <strong>{trabajo.tecnico}</strong></span>
                      </div>
                      <div className="h-card-right">
                        <div className="h-card-photos-stack">
                          {trabajo.evidencias && trabajo.evidencias.length > 0 ? (
                            <img src={trabajo.evidencias[0]} alt="evidencia" className="stack-img img-0" />
                          ) : (
                            <div style={{width: '40px', height: '40px', background: '#ccc', borderRadius: '8px'}}></div>
                          )}
                        </div>
                        <Eye size={18} className="view-icon" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{padding: '20px', textAlign: 'center', color: '#666'}}>No hay historial de trabajos aún.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ==========================================
            COLUMNA DERECHA (Tablero + Acciones)
            ========================================== */}
        <div className="right-column">
          <div className="action-header-right" style={{ display: 'flex', gap: '10px', flexDirection: window.innerWidth <= 768 ? 'column' : 'row' }}>
            <button className="btn-add-service-full" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={() => setMostrarModalServicio(true)}>
              <PlusCircle size={20} /> AGREGAR SERVICIO
            </button>
            <button 
              className="btn-add-service-full" 
              style={{ flex: 1, backgroundColor: '#444', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }} 
              onClick={() => {
                const levantamientoId = localStorage.getItem('current_levantamiento_id');
                const path = levantamientoId ? `/detalle-reporte/${levantamientoId}` : `/detalle-reporte/prop_${id}`;
                navigate(path);
              }}
            >
              <FileText size={20} /> VER LEVANTAMIENTO
            </button>
          </div>

          <div className="info-card-premium sticky-card">
            <div className="card-header-clean">
              <Layout size={20} className="icon-orange" />
              <h3>Tablero de Control</h3>
            </div>
            
            <div className="jira-stats-grid quad">
              <div className="stat-box sos-urgent-stat" onClick={() => navigate('/SOSView')}>
                <AlertCircle size={24} />
                <span className="stat-number">{stats.sos || 0}</span>
                <span className="stat-label">SOS</span>
              </div>
              <div className="stat-box todo">
                <ListTodo size={24} />
                <span className="stat-number">{stats.pendientes || 0}</span>
                <span className="stat-label">POR HACER</span>
              </div>
              <div className="stat-box in-progress">
                <Timer size={24} />
                <span className="stat-number">{stats.proceso || 0}</span>
                <span className="stat-label">PROCESO</span>
              </div>
              <div className="stat-box done">
                <CheckCircle2 size={24} />
                <span className="stat-number">{stats.listos || 0}</span>
                <span className="stat-label">LISTOS</span>
              </div>
            </div>

            <div className="tablero-actions-center">
              <button className="btn-orange-small" onClick={() => navigate('/Tablero')}>
                Ver tablero detallado
              </button>
            </div>
            
            <div className="sprint-footer">
              <div className="sprint-progress-meta">
                <span>Avance de Obra</span>
                <span>{avance_obra || 0}%</span>
              </div>
              <div className="sprint-progress-bar">
                <div className="sprint-progress-fill" style={{ width: `${avance_obra || 0}%` }}></div>
              </div>
            </div>
            
            <div className="quote-section-link" onClick={() => navigate('/cotizacion1')}>
              <div className="quote-content">
                <FileText size={20} />
                <span>Ver Cotizaciones Pendientes</span>
              </div>
              <div className="quote-badge-large">{cotizaciones_pendientes || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          MODAL 1: DETALLE DE TRABAJO (BITÁCORA)
          ========================================== */}
      {reporteSeleccionado && (
        <div className="modal-overlay" onClick={() => setReporteSeleccionado(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '800px', maxWidth: '95vw' }}>
            <button className="close-modal" onClick={() => setReporteSeleccionado(null)}><X /></button>
            <div className="modal-header" style={{ borderBottom: '2px solid #f26624', paddingBottom: '15px' }}>
              <div className="modal-tag" style={{ background: '#f26624' }}>BITÁCORA DE TRABAJO</div>
              <h2>{reporteSeleccionado.producto}</h2>
              <p className="modal-subtitle">
                Finalizado el {reporteSeleccionado.fecha} | Técnico: {reporteSeleccionado.tecnico}
              </p>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px 0' }}>
              
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#333' }}>
                <ImageIcon size={20} /> PASOS REALIZADOS
              </h4>

              {cargandoReportes ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Loader2 className="animate-spin" size={40} color="#f26624" />
                  <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Cargando bitácora...</p>
                </div>
              ) : reportesDetallados.length > 0 ? (
                <div className="client-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  {reportesDetallados.map((rep, idx) => (
                    <div key={rep.id} className="timeline-step" style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '15px', borderLeft: '4px solid #f26624' }}>
                      <div className="step-num-pill" style={{ background: '#333', color: 'white', minWidth: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                         {idx + 1}
                      </div>
                      <div className="step-info" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{rep.title || `Avance ${idx + 1}`}</h5>
                          <span style={{ fontSize: '11px', color: '#888' }}><Clock size={12}/> {new Date(rep.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p style={{ color: '#555', fontSize: '13px', lineHeight: 1.4, marginBottom: '10px' }}>{rep.description}</p>
                        
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {rep.image_path && (
                            <img 
                              src={rep.image_path} 
                              alt="evidencia" 
                              onClick={() => setImagenAmpliada(rep.image_path)}
                              style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} 
                            />
                          )}
                          {rep.galleries && rep.galleries.map((gal, gIdx) => (
                            <img 
                              key={gIdx}
                              src={gal.image_path} 
                              alt="extra" 
                              onClick={() => setImagenAmpliada(gal.image_path)}
                              style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', background: '#eee', borderRadius: '15px' }}>
                  <p style={{ margin: 0, color: '#666', fontStyle: 'italic' }}>No hay detalles específicos registrados para este trabajo.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-close" onClick={() => setReporteSeleccionado(null)} style={{ background: '#333' }}>Cerrar Historial</button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PARA IMAGEN AMPLIADA */}
      {imagenAmpliada && (
        <div 
          onClick={() => setImagenAmpliada(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
        >
          <img src={imagenAmpliada} alt="Zoom" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '10px' }} />
          <button 
             onClick={() => setImagenAmpliada(null)} 
             style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
             <X size={40} />
          </button>
        </div>
      )}

      {/* ==========================================
          MODAL 2: AGREGAR SERVICIO
          ========================================== */}
      {mostrarModalServicio && (
        <div className="modal-overlay" onClick={() => setMostrarModalServicio(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setMostrarModalServicio(false)}><X /></button>
            <div className="modal-header">
              <div className="modal-tag">NUEVA SOLICITUD</div>
              <h2>Reportar Problema</h2>
            </div>
            <form className="modal-body service-form" onSubmit={handleSubmitServicio}>
              
              {/* NUEVO CAMPO: TIPO DE SERVICIO */}
              <div className="form-group">
                <label><FileText size={16}/> Tipo de Servicio *</label>
                <select 
                  required 
                  value={nuevoServicio.tipo}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, tipo: e.target.value})}
                >
                  <option value="">Selecciona el tipo...</option>
                  <option value="Mantenimiento">Mantenimiento Preventivo</option>
                  <option value="Problema">Problema / Reparación</option>
                </select>
              </div>

              <div className="form-group">
                <label><Home size={16}/> Zona de la propiedad *</label>
                <select 
                  required 
                  value={nuevoServicio.area_id}
                  onChange={(e) => handleZonaChange(e.target.value)}
                  disabled={loadingZonas}
                >
                  <option value="">{loadingZonas ? "Cargando zonas..." : "Seleccionar zona..."}</option>
                  {zonasDisponibles.map(zona => (
                    <React.Fragment key={`zona-${zona.id}`}>
                      <option value={zona.id}>{zona.name}</option>
                      {(zona.sub_areas || zona.subAreas || []).map(sub => (
                        <option key={`sub-${sub.id}`} value={sub.id}>
                          &nbsp;&nbsp;&nbsp;{zona.name} - {sub.name}
                        </option>
                      ))}
                    </React.Fragment>
                  ))}
                  <option value="otro">Otro (No está en la lista)</option>
                </select>
              </div>
              <div className="form-group">
                <label><Wrench size={16}/> Equipo afectado (Opcional)</label>
                <select 
                  value={nuevoServicio.equipo}
                  disabled={!nuevoServicio.area_id || loadingEquipos}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, equipo: e.target.value})}
                >
                  <option value="">
                    {!nuevoServicio.area_id ? "Primero selecciona una zona" : (loadingEquipos ? "Cargando equipos..." : "Seleccionar equipo...")}
                  </option>
                  {Object.entries(equiposDisponibles).map(([seccion, items]) => (
                    <optgroup key={seccion} label={seccion.toUpperCase()}>
                      {items.map((item) => (
                        <option key={item.id} value={`${item.sub_category} ${item.brand ? `(${item.brand})` : ''}`}>
                          {item.sub_category} {item.brand ? `(${item.brand})` : ''} {item.model_or_color ? `- ${item.model_or_color}` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="otro">Otro (No está en la lista)</option>
                </select>
              </div>
              <div className="form-group">
                <label><MessageSquare size={16}/> Descripción *</label>
                <textarea required rows="4" placeholder="Describe el problema..." value={nuevoServicio.descripcion} onChange={(e) => setNuevoServicio({...nuevoServicio, descripcion: e.target.value})}></textarea>
              </div>

              <div className="form-group">
                <label><Camera size={16}/> Evidencia Visual (Máx 2 fotos)</label>
                
                <input type="file" ref={cameraRef} hidden accept="image/*" capture="environment" onChange={handleFileSelect} />
                <input type="file" ref={galleryRef} hidden accept="image/*" multiple onChange={handleFileSelect} />

                <div className="fotos-preview-container" style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {nuevoServicio.fotos.map((foto, idx) => (
                    <div key={idx} className="foto-preview-wrapper" style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img 
                        src={URL.createObjectURL(foto)} 
                        alt="preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', border: '2px solid #f26624' }} 
                      />
                      <button 
                        type="button"
                        onClick={() => removeFoto(idx)}
                        style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#e63946', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {nuevoServicio.fotos.length < 2 && (
                    <button 
                      type="button" 
                      className="btn-add-foto-placeholder"
                      onClick={() => setIsPhotoMenuOpen(true)}
                      style={{ width: '80px', height: '80px', border: '2px dashed #ccc', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f9f9f9', color: '#666' }}
                    >
                      <PlusCircle size={24} />
                      <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>AÑADIR</span>
                    </button>
                  )}
                </div>
                
                <small style={{ color: '#666', fontSize: '11px', marginTop: '8px', display: 'block' }}>
                  * Puedes subir hasta 2 imágenes como evidencia del problema.
                </small>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-modal-close" disabled={loadingSubmit}>
                  {loadingSubmit ? "Enviando..." : "Levantar Reporte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: PERFIL DE LA PROPIEDAD
          ========================================== */}
      {mostrarPerfilPropiedad && (
        <div className="modal-overlay" onClick={() => setMostrarPerfilPropiedad(false)}>
          <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setMostrarPerfilPropiedad(false)}><X /></button>
            <div className="modal-header-profile">
              <Tag size={28} className="icon-orange" />
              <div>
                <h2>Perfil de la Propiedad</h2>
                <p className="id-badge-text">ID Registro: {propiedad.id}</p>
              </div>
            </div>
            <div className="modal-body detailed-info">
              <div className="profile-data-group">
                <User size={20} className="icon-gray" />
                <div>
                  <span className="profile-label">CLIENTE ASOCIADO</span>
                  <span className="profile-value">{propiedad.client_id || 'Sin asignar'}</span>
                </div>
              </div>
              <div className="profile-data-group">
                <FileText size={20} className="icon-gray" />
                <div>
                  <span className="profile-label">CURP INMUEBLE</span>
                  <span className="profile-value highlight-curp">{propiedad.custom_curp || 'S/N'}</span>
                </div>
              </div>
              <div className="profile-data-group">
                <Home size={20} className="icon-gray" />
                <div>
                  <span className="profile-label">DIRECCIÓN</span>
                  <span className="profile-value">{propiedad.address}</span>
                </div>
              </div>
              <div className="profile-data-group">
                <MapPin size={20} className="icon-gray" />
                <div>
                  <span className="profile-label">UBICACIÓN GPS</span>
                  <a 
                    href={`https://maps.google.com/?q=${propiedad.coordinates}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="gps-link-container"
                  >
                    <span className="profile-value gps-text">{propiedad.coordinates || 'Sin coordenadas'}</span>
                    <Eye size={16} className="icon-blue" />
                  </a>
                </div>
              </div>
            </div>
            <div className="modal-footer">
               <button className="btn-orange-full" onClick={() => setMostrarPerfilPropiedad(false)}>
                 Cerrar Detalles
               </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL DE SELECCIÓN DE FOTO */}
      {isPhotoMenuOpen && (
        <div className="modal-overlay" onClick={() => setIsPhotoMenuOpen(false)} style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: '350px', padding: '0', backgroundColor: '#fff' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
              <h3 style={{ margin: 0, color: '#f26624' }}>Seleccionar Origen</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button 
                type="button"
                onClick={() => selectPhotoSource('camera')}
                style={{ background: 'transparent', border: 'none', padding: '15px', color: '#333', borderBottom: '1px solid #eee', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <Camera size={20} /> Tomar Foto
              </button>
              <button 
                type="button"
                onClick={() => selectPhotoSource('gallery')}
                style={{ background: 'transparent', border: 'none', padding: '15px', color: '#333', borderBottom: '1px solid #eee', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <ImageIcon size={20} /> Elegir de la Galería
              </button>
              <button 
                type="button"
                onClick={() => setIsPhotoMenuOpen(false)}
                style={{ background: 'transparent', border: 'none', padding: '15px', color: '#666', fontSize: '1rem', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaDetallePropiedad;