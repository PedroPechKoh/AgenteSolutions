import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, CheckCircle2, ListTodo, Timer, AlertCircle, 
  FileText, History, ChevronDown, ChevronUp, X, 
  User, Eye, MapPin, Tag, PlusCircle, 
  Home, Wrench, MessageSquare, Camera 
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
  const equiposPorZona = {
    sala: ['Aire Acondicionado', 'Smart TV', 'Lámpara de pie'],
    cocina: ['Refrigerador', 'Estufa', 'Microondas', 'Lavavajillas'],
    recamara: ['Aire Acondicionado', 'Ventilador de techo'],
    jardin: ['Bomba de piscina', 'Sistema de riego', 'Iluminación exterior']
  };
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [nuevoServicio, setNuevoServicio] = useState({
    zona: '', equipo: '', descripcion: '', foto: null
  });

  // --- EFECTO DE CARGA INICIAL ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('agente_token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/propiedades/${id}/dashboard`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setData(response.data);

      } catch (error) {
        console.error("Error cargando el dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDashboardData();
  }, [id]);

  // Manejador del select de zonas en el modal
  const handleZonaChange = (zona) => {
    setNuevoServicio({ ...nuevoServicio, zona, equipo: '' }); 
    setEquiposDisponibles(equiposPorZona[zona] || []);
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
            {/* ✅ CORRECCIÓN CLAVE: Usamos la URL de Cloudinary directamente, sin 'http://127.0.0.1...' */}
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
                    <div key={trabajo.id} className="historial-card-item" onClick={() => setReporteSeleccionado(trabajo)}>
                      <div className="h-card-left">
                        <span className="h-card-date">{new Date(trabajo.updated_at).toLocaleDateString()}</span>
                        <h4 className="h-card-title">{trabajo.title || 'Trabajo Finalizado'}</h4>
                        <span className="h-card-tech">Por: <strong>{trabajo.tecnico_nombre || 'Técnico'}</strong></span>
                      </div>
                      <div className="h-card-right">
                        <div className="h-card-photos-stack">
                          {trabajo.fotos && trabajo.fotos.length > 0 ? (
                            <img src={trabajo.fotos[0]} alt="evidencia" className="stack-img img-0" />
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
          <div className="action-header-right">
            <button className="btn-add-service-full" onClick={() => setMostrarModalServicio(true)}>
              <PlusCircle size={20} /> AGREGAR SERVICIO
            </button>
          </div>

          <div className="info-card-premium sticky-card">
            <div className="card-header-clean">
              <Layout size={20} className="icon-orange" />
              <h3>Tablero de Control</h3>
            </div>
            
            <div className="jira-stats-grid quad">
              <div className="stat-box sos-urgent-stat" onClick={() => navigate('/sos')}>
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
          MODAL 1: DETALLE DE TRABAJO (HISTORIAL)
          ========================================== */}
      {reporteSeleccionado && (
        <div className="modal-overlay" onClick={() => setReporteSeleccionado(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setReporteSeleccionado(null)}><X /></button>
            <div className="modal-header">
              <div className="modal-tag">TRABAJO FINALIZADO</div>
              <h2>{reporteSeleccionado.title || reporteSeleccionado.labor}</h2>
              <p className="modal-subtitle">
                {new Date(reporteSeleccionado.updated_at || reporteSeleccionado.fecha).toLocaleDateString()} | Técnico: {reporteSeleccionado.tecnico_nombre || reporteSeleccionado.tecnico}
              </p>
            </div>
            <div className="modal-body">
              <p>{reporteSeleccionado.description || reporteSeleccionado.descripcion}</p>
              <div className="evidence-container" style={{ marginTop: '15px' }}>
                <h4>Evidencia:</h4>
                {reporteSeleccionado.fotos && reporteSeleccionado.fotos.map((f, i) => (
                  <img key={i} src={f} alt="foto" style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} />
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-close" onClick={() => setReporteSeleccionado(null)}>Cerrar Reporte</button>
            </div>
          </div>
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
            <form className="modal-body service-form" onSubmit={(e) => { e.preventDefault(); setMostrarModalServicio(false); }}>
              <div className="form-group">
                <label><Home size={16}/> Zona de la propiedad *</label>
                <select 
                  required 
                  value={nuevoServicio.zona}
                  onChange={(e) => handleZonaChange(e.target.value)}
                >
                  <option value="">Seleccionar zona...</option>
                  <option value="sala">Sala</option>
                  <option value="cocina">Cocina</option>
                  <option value="recamara">Recámara</option>
                  <option value="jardin">Jardín</option>
                </select>
              </div>
              <div className="form-group">
                <label><Wrench size={16}/> Equipo afectado (Opcional)</label>
                <select 
                  value={nuevoServicio.equipo}
                  disabled={!nuevoServicio.zona}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, equipo: e.target.value})}
                >
                  <option value="">{nuevoServicio.zona ? "Seleccionar equipo..." : "Primero selecciona una zona"}</option>
                  {equiposDisponibles.map((item, index) => (
                    <option key={index} value={item.toLowerCase().replace(/\s+/g, '-')}>
                      {item}
                    </option>
                  ))}
                  <option value="otro">Otro (No está en la lista)</option>
                </select>
              </div>
              <div className="form-group">
                <label><MessageSquare size={16}/> Descripción *</label>
                <textarea required rows="4" placeholder="Describe el problema..." onChange={(e) => setNuevoServicio({...nuevoServicio, descripcion: e.target.value})}></textarea>
              </div>

              <div className="form-group">
                <label><Camera size={16}/> Evidencia Visual (Cámara o Galería)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="file-input-custom"
                  onChange={(e) => setNuevoServicio({...nuevoServicio, foto: e.target.files[0]})}
                  style={{ marginTop: '5px', width: '100%' }}
                />
                <small style={{ color: '#666', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  * En móvil, puedes tomar una foto o elegir una de tu álbum.
                </small>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-modal-close">Levantar Reporte</button>
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
    </div>
  );
};

export default VistaDetallePropiedad;