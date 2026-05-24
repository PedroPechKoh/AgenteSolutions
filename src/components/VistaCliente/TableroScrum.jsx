import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Clock, CheckCircle2, X, UserCircle, Calendar, 
  ArrowLeft, Camera, Layout, FileText, Maximize2, AlertTriangle, ChevronLeft, Timer 
} from 'lucide-react';
import '../../styles/Cliente/TableroScrum.css';

const TableroScrum = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [tareasData, setTareasData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [verBitacora, setVerBitacora] = useState(false);
  const [imagenExpandida, setImagenExpandida] = useState(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [tabActiva, setTabActiva] = useState('sos'); // Estado para pestañas en móvil

  const columnasConfig = [
    { id: 'sos', titulo: 'SOS', color: '#e63946', icon: <AlertTriangle size={20} /> },
    { id: 'todo', titulo: 'POR HACER', color: '#333', icon: <FileText size={20} /> },
    { id: 'progress', titulo: 'EN PROCESO', color: '#f26522', icon: <Timer size={20} /> },
    { id: 'done', titulo: 'FINALIZADOS', color: '#1b8a5a', icon: <CheckCircle2 size={20} /> },
    { id: 'rejected', titulo: 'CANCELADOS', color: '#dc2626', icon: <X size={20} /> }
  ];

  // --- MAPEO DE DATOS (Mismo que en Laravel) ---
  const transformarTareas = useCallback((data) => {
    return data.map(item => {
      let estado = 'todo';
      if (item.status === 'Listo' || item.status === 'Finalizado') estado = 'done';
      else if (item.status === 'Rechazado' || item.status === 'Cancelado') estado = 'rejected';
      else if (item.priority === 'Urgente' && item.status !== 'Listo') estado = 'sos';
      else if (item.status === 'En Proceso') estado = 'progress';
      
      return {
        dbId: item.id, // ID real de la base de datos
        titulo: `${item.zone} - ${item.equipment || 'General'}`,
        prioridad: item.priority === 'Urgente' ? 'SOS' : 'Normal',
        fechaFin: new Date(item.updated_at).toLocaleDateString(),
        tecnico: item.tecnico_nombre || 'Pendiente de asignar',
        fechaInicio: new Date(item.created_at).toLocaleDateString(),
        estado: estado,
        descripcion: item.description,
        scheduledAt: item.scheduled_at,
        evidencias: item.evidence_path ? [`http://127.0.0.1:8000/storage/${item.evidence_path}`] : []
      };
    });
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/propiedades/${id}/work-orders`);
      setTareasData(transformarTareas(response.data));
    } catch (error) {
      console.error("Error cargando órdenes:", error);
    } finally {
      setLoading(false);
    }
  }, [id, transformarTareas]);

  useEffect(() => {
    if (id) fetchOrders();
  }, [id, fetchOrders]);

  // Guardar el ID de la propiedad en localStorage para que MainLayoutCliente tenga contexto
  useEffect(() => {
    if (id) {
      localStorage.setItem('current_property_id', id);
      window.dispatchEvent(new Event('sync-agente-ids'));
    }
  }, [id]);

  // --- ACCIONES ---
  const abrirModal = (tarea) => {
    setTareaSeleccionada(tarea);
    setVerBitacora(false);
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
      await fetchOrders(); // Recarga los datos
      cerrarModal();
    } catch (error) {
      alert("No se pudo actualizar el estado del servicio.");
    } finally {
      setProcesandoAccion(false);
    }
  };

  if (loading) return <div className="loading-screen">Cargando Tablero Técnico...</div>;

  const renderColumna = (colId, titulo, clase) => (
    <div className={`scrum-column ${clase}`}>
      <div className="column-header">
        <span className="column-title-text">{titulo}</span>
        <span className="column-badge">{tareasData.filter(t => t.estado === colId).length}</span>
      </div>
      <div className="cards-container">
        {tareasData.filter(t => t.estado === colId).map(tarea => (
          <div key={tarea.dbId} className="card-wrapper">
            <button 
              className={`task-card-premium ${
                tarea.estado === 'sos' ? 'is-sos' : 
                tarea.estado === 'progress' ? 'is-active' : 
                tarea.estado === 'done' ? 'is-done' : 
                tarea.estado === 'rejected' ? 'is-rejected' : ''
              }`}
              onClick={() => abrirModal(tarea)}
            >
              <h5 className="task-title-card">
                {tarea.estado === 'sos' && <AlertTriangle size={14} className="sos-icon-inline" />}
                {tarea.titulo}
              </h5>
              <div className="card-status-row">
                {tarea.estado === 'done' ? (
                  <div className="status-pill-done">
                    <CheckCircle2 size={12} /> <span>Finalizado</span>
                  </div>
                ) : tarea.estado === 'rejected' ? (
                  <div className="status-pill-rejected" style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <X size={12} /> <span>Cancelado</span>
                  </div>
                ) : (
                  <span className={`priority-tag ${tarea.prioridad.toLowerCase()}`}>
                    {tarea.prioridad.toUpperCase()}
                  </span>
                )}
                <span className="date-tag"><Clock size={12}/> {tarea.fechaFin}</span>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="scrum-container">
      {/* HEADER DE NAVEGACIÓN */}
      <header className="scrum-header">
        <button className="btn-back-dashboard" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} /> VOLVER A LA PROPIEDAD
        </button>
        <h2>Tablero de Gestión de Servicios</h2>
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
            {renderColumna(col.id, col.titulo === 'SOS' ? 'SOS ACEPTADOS' : col.titulo, `col-${col.id}`)}
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
                  {verBitacora ? 'BITÁCORA TÉCNICA' : 'VISTA DE TAREA'}
               </div>
               <button 
                 onClick={cerrarModal}
                 style={{
                   background: 'rgba(255,255,255,0.25)',
                   border: '2px solid rgba(255,255,255,0.6)',
                   color: 'white',
                   cursor: 'pointer',
                   borderRadius: '50%',
                   width: '36px',
                   height: '36px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   flexShrink: 0,
                   fontSize: '18px',
                   fontWeight: 'bold',
                   lineHeight: 1
                 }}
               >
                 ×
               </button>
            </div>

            <div className="modal-inner-scroll">
                {!verBitacora ? (
                  <div className="task-details-view">
                    <span className="wkf-id">WKF-ORD-{tareaSeleccionada.dbId}</span>
                    <h3 className="task-main-heading">{tareaSeleccionada.titulo}</h3>
                    <p className="task-long-desc">{tareaSeleccionada.descripcion}</p>
                    
                    <div className="info-box-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="info-item">
                        <UserCircle size={20} />
                        <div><label>Técnico</label><strong>{tareaSeleccionada.tecnico}</strong></div>
                      </div>
                      <div className="info-item">
                        <Calendar size={20} />
                        <div><label>Fecha Reporte</label><strong>{tareaSeleccionada.fechaInicio}</strong></div>
                      </div>
                      <div className="info-item">
                        <Timer size={20} />
                        <div>
                          <label>Visita Programada</label>
                          <strong>{tareaSeleccionada.scheduledAt ? new Date(tareaSeleccionada.scheduledAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : 'Por programar'}</strong>
                        </div>
                      </div>
                      <div className="info-item">
                        <CheckCircle2 size={20} />
                        <div>
                          <label>Trabajo Finalizado</label>
                          <strong>{tareaSeleccionada.estado === 'done' ? tareaSeleccionada.fechaFin : 'Pendiente'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* El cliente solo puede VER el estado, no cambiarlo */}
                    <button className="view-bitacora-btn" onClick={() => setVerBitacora(true)}>
                      Ver Bitácora Técnica
                    </button>
                  </div>
                ) : (
                  <div className="bitacora-view">
                    <div className="bitacora-section">
                      <h6 className="section-label"><Layout size={14} /> PROGRESO TÉCNICO</h6>
                      <div className="checklist-minimal">
                        <div className="check-row done"><CheckCircle2 size={16}/> Registro de incidencia</div>
                        <div className={`check-row ${tareaSeleccionada.estado === 'progress' ? 'current' : tareaSeleccionada.estado === 'done' ? 'done' : ''}`}>
                          {tareaSeleccionada.estado === 'done' ? <CheckCircle2 size={16}/> : <Clock size={16}/>} 
                          Ejecución técnica
                        </div>
                      </div>
                    </div>
                    <div className="media-area">
                      <h6 className="section-label"><Camera size={14} /> EVIDENCIA DE CAMPO</h6>
                      <div className="evidence-grid">
                        {tareaSeleccionada.evidencias.map((img, i) => (
                          <div key={i} className="evidence-card" onClick={() => setImagenExpandida(img)}>
                            <img src={img} alt="Evidencia" />
                            <div className="evidence-overlay"><Maximize2 size={16} /></div>
                          </div>
                        ))}
                      </div>
                    </div>
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

      <style>{`
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
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default TableroScrum;