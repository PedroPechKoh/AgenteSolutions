import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, CheckCircle2, ListTodo, Timer, AlertCircle, 
  FileText, History, ChevronDown, ChevronUp, X, 
  Calendar, User, Eye, MapPin, Tag, PlusCircle, 
  Home, Wrench, MessageSquare 
} from 'lucide-react';
import '../../styles/Admin/DetallePropiedad.css';

const VistaDetallePropiedad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const equiposPorZona = {
  sala: ['Aire Acondicionado', 'Smart TV', 'Lámpara de pie'],
  cocina: ['Refrigerador', 'Estufa', 'Microondas', 'Lavavajillas'],
  recamara: ['Aire Acondicionado', 'Ventilador de techo'],
  jardin: ['Bomba de piscina', 'Sistema de riego', 'Iluminación exterior']
};
// ... dentro del componente
const [equiposDisponibles, setEquiposDisponibles] = useState([]);

// Manejador para cuando cambie la zona
const handleZonaChange = (zona) => {
  setNuevoServicio({ ...nuevoServicio, zona, equipo: '' }); // Resetear equipo al cambiar zona
  setEquiposDisponibles(equiposPorZona[zona] || []);
};
  // --- ESTADOS ---
  const [mostrarHistorial, setMostrarHistorial] = useState(true);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [mostrarPerfilPropiedad, setMostrarPerfilPropiedad] = useState(false);
  const [mostrarModalServicio, setMostrarModalServicio] = useState(false);
  const [nuevoServicio, setNuevoServicio] = useState({
    zona: '',
    equipo: '',
    descripcion: ''
  });

  // --- DATOS ---
  const propiedad = {
   id: id || '101',
  propietario: 'JOSE ALCOCER',
  curp: 'ABCDE123456HDFR01',
  direccion: 'Calle 20 x 15 Col. Centro',
  ubicacion: 'Mérida, Yuc.',
  // Coordenadas para el enlace (Latitud, Longitud)
  coords: '20.9673,-89.6237', 
  tareas: { listas: 8, enProceso: 3, pendientes: 5 },
  alertas: { sos: 2, cotizaciones: 4 },
  img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1000'
  };

  const historialTrabajos = [
    { 
      id: 1, fecha: '12/03/2026', tecnico: 'Mario', labor: 'Limpieza de Cisterna', 
      descripcion: 'Se realizó vaciado completo, tallado de paredes y desinfección profunda.',
      fotos: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400'] 
    },
    { 
      id: 2, fecha: '05/03/2026', tecnico: 'Mario', labor: 'Revisión de Fugas', 
      descripcion: 'Detección de filtración en tubería principal de 1/2 pulgada.',
      fotos: ['https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=400'] 
    },
  ];

  return (
    <div className="view-container">
      <div className="main-layout-detail">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="left-column">
          <div className="property-id-header">
            <button className="btn-id-profile" onClick={() => setMostrarPerfilPropiedad(true)}>
              <Tag size={16} /> ID REGISTRO: <strong>{propiedad.id}</strong>
            </button>
          </div>

          <div className="hero-section-compact">
            <img src={propiedad.img} alt="Propiedad" className="hero-img" />
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
                {historialTrabajos.map((trabajo) => (
                  <div key={trabajo.id} className="historial-card-item" onClick={() => setReporteSeleccionado(trabajo)}>
                    <div className="h-card-left">
                      <span className="h-card-date">{trabajo.fecha}</span>
                      <h4 className="h-card-title">{trabajo.labor}</h4>
                      <span className="h-card-tech">Por: <strong>{trabajo.tecnico}</strong></span>
                    </div>
                    <div className="h-card-right">
                      <div className="h-card-photos-stack">
                        {trabajo.fotos.slice(0, 1).map((foto, i) => (
                          <img key={i} src={foto} alt="evidencia" className="stack-img img-0" />
                        ))}
                      </div>
                      <Eye size={18} className="view-icon" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA */}
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
                <span className="stat-number">{propiedad.alertas.sos}</span>
                <span className="stat-label">SOS</span>
              </div>
              <div className="stat-box todo">
                <ListTodo size={24} />
                <span className="stat-number">{propiedad.tareas.pendientes}</span>
                <span className="stat-label">POR HACER</span>
              </div>
              <div className="stat-box in-progress">
                <Timer size={24} />
                <span className="stat-number">{propiedad.tareas.enProceso}</span>
                <span className="stat-label">PROCESO</span>
              </div>
              <div className="stat-box done">
                <CheckCircle2 size={24} />
                <span className="stat-number">{propiedad.tareas.listas}</span>
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
                <span>50%</span>
              </div>
              <div className="sprint-progress-bar">
                <div className="sprint-progress-fill" style={{ width: `50%` }}></div>
              </div>
            </div>
            
            <div className="quote-section-link" onClick={() => navigate('/cotizacion1')}>
              <div className="quote-content">
                <FileText size={20} />
                <span>Ver Cotizaciones Pendientes</span>
              </div>
              <div className="quote-badge-large">{propiedad.alertas.cotizaciones}</div>
            </div>
          </div>
        </div>
      </div>



      {/* MODAL 1: DETALLE DE TRABAJO (Resuelve error reporteSeleccionado) */}
      {reporteSeleccionado && (
        <div className="modal-overlay" onClick={() => setReporteSeleccionado(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setReporteSeleccionado(null)}><X /></button>
            <div className="modal-header">
              <div className="modal-tag">TRABAJO FINALIZADO</div>
              <h2>{reporteSeleccionado.labor}</h2>
              <p className="modal-subtitle">{reporteSeleccionado.fecha} | Técnico: {reporteSeleccionado.tecnico}</p>
            </div>
            <div className="modal-body">
              <p>{reporteSeleccionado.descripcion}</p>
              <div className="evidence-container" style={{ marginTop: '15px' }}>
                <h4>Evidencia:</h4>
                {reporteSeleccionado.fotos.map((f, i) => (
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

      {/* MODAL 2: AGREGAR SERVICIO */}
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
    disabled={!nuevoServicio.zona} // Deshabilitado si no hay zona
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
              <div className="modal-footer">
                <button type="submit" className="btn-modal-close">Levantar Reporte</button>
              </div>
            </form>
          </div>
        </div>
      )}

   
{/* MODAL: PERFIL PROPIEDAD */}
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
        {/* PROPIETARIO */}
        <div className="profile-data-group">
          <User size={20} className="icon-gray" />
          <div>
            <span className="profile-label">PROPIETARIO LEGAL</span>
            <span className="profile-value">{propiedad.propietario}</span>
          </div>
        </div>

        {/* CURP */}
        <div className="profile-data-group">
          <FileText size={20} className="icon-gray" />
          <div>
            <span className="profile-label">CURP INMUEBLE</span>
            <span className="profile-value highlight-curp">{propiedad.curp}</span>
          </div>
        </div>

        {/* DIRECCIÓN */}
        <div className="profile-data-group">
          <Home size={20} className="icon-gray" />
          <div>
            <span className="profile-label">DIRECCIÓN</span>
            <span className="profile-value">{propiedad.direccion}, {propiedad.ubicacion}</span>
          </div>
        </div>

        {/* UBICACIÓN GPS (CON ENLACE A GOOGLE MAPS) */}
        <div className="profile-data-group">
          <MapPin size={20} className="icon-gray" />
          <div>
            <span className="profile-label">UBICACIÓN GPS</span>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${propiedad.coords}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="gps-link-container"
            >
              <span className="profile-value gps-text">{propiedad.coords}</span>
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