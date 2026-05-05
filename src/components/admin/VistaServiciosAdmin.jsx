import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Clock, CheckCircle2, X, UserCircle, Calendar, 
  ArrowLeft, Camera, Layout, FileText, Maximize2, AlertTriangle, ChevronLeft, Timer 
} from 'lucide-react';
import Header from '../Shared/Header';
import '../styles/Cliente/TableroScrum.css'; // Reutilizamos estilos

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

  // --- MAPEO DE DATOS ---
  const transformarTareas = useCallback((data) => {
    return data.map(item => {
      let estado = 'todo';
      if (item.status === 'Listo' || item.status === 'Finalizado') estado = 'done';
      else if (item.priority === 'Urgente' && item.status !== 'Listo') estado = 'sos';
      else if (item.status === 'En Proceso') estado = 'progress';
      
      return {
        dbId: item.id,
        titulo: `${item.zone} - ${item.equipment || 'General'}`,
        propiedad: item.property ? (item.property.nombre_propiedad || item.property.address) : 'Sin Propiedad',
        prioridad: item.priority === 'Urgente' ? 'SOS' : 'Normal',
        fechaFin: new Date(item.updated_at).toLocaleDateString(),
        tecnico: item.tecnico_nombre || 'Pendiente de asignar',
        fechaInicio: new Date(item.created_at).toLocaleDateString(),
        estado: estado,
        descripcion: item.description,
        evidencias: [item.evidence_path, item.evidence_path_2].filter(p => p)
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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
      await fetchOrders();
      cerrarModal();
    } catch (error) {
      alert("No se pudo actualizar el estado del servicio.");
    } finally {
      setProcesandoAccion(false);
    }
  };

  if (loading) return <div className="loading-screen">Cargando Tablero de Servicios...</div>;

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
                tarea.estado === 'done' ? 'is-done' : ''
              }`}
              onClick={() => abrirModal(tarea)}
            >
              <div className="prop-badge-card">{tarea.propiedad}</div>
              <h5 className="task-title-card">
                {tarea.estado === 'sos' && <AlertTriangle size={14} className="sos-icon-inline" />}
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
                <span className="date-tag"><Clock size={12}/> {tarea.fechaFin}</span>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="scrum-container admin-theme">
      <Header rolTexto="ADMINISTRADOR" />
      
      <header className="scrum-header" style={{ marginTop: '20px' }}>
        <button className="btn-back-dashboard" onClick={() => navigate('/VistaRoot')}>
          <ChevronLeft size={20} /> VOLVER AL INICIO
        </button>
        <h2 style={{ fontStyle: 'italic', fontWeight: '900' }}>GESTIÓN GLOBAL DE SERVICIOS</h2>
      </header>

      <div className="scrum-board-layout quad-layout">
        {renderColumna('sos', 'SOS / PRIORITARIOS', 'col-sos')}
        {renderColumna('todo', 'POR HACER', 'col-todo')}
        {renderColumna('progress', 'EN PROCESO', 'col-progress')}
        {renderColumna('done', 'FINALIZADOS', 'col-done')}
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
                      <div className="info-item">
                        <UserCircle size={20} />
                        <div><label>Técnico Asignado</label><strong>{tareaSeleccionada.tecnico}</strong></div>
                      </div>
                      <div className="info-item">
                        <Calendar size={20} />
                        <div><label>Fecha Reporte</label><strong>{tareaSeleccionada.fechaInicio}</strong></div>
                      </div>
                    </div>

                    <div className="modal-action-buttons">
                      {tareaSeleccionada.estado === 'todo' || tareaSeleccionada.estado === 'sos' ? (
                        <button className="btn-start-task" disabled={procesandoAccion} onClick={() => cambiarEstadoTarea('En Proceso')}>
                          <Timer size={18} /> {procesandoAccion ? 'Actualizando...' : 'INICIAR TRABAJO'}
                        </button>
                      ) : tareaSeleccionada.estado === 'progress' ? (
                        <button className="btn-complete-task" disabled={procesandoAccion} onClick={() => cambiarEstadoTarea('Listo')}>
                          <CheckCircle2 size={18} /> {procesandoAccion ? 'Finalizando...' : 'MARCAR COMO LISTO'}
                        </button>
                      ) : null}
                    </div>

                    <button className="view-bitacora-btn" onClick={() => setVerBitacora(true)}>
                      Ver Evidencias y Proceso
                    </button>
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

      {imagenExpandida && (
        <div className="zoom-overlay" onClick={() => setImagenExpandida(null)}>
          <button className="zoom-close-fixed" onClick={() => setImagenExpandida(null)}><X size={32} /></button>
          <div className="zoom-content" onClick={e => e.stopPropagation()}>
            <img src={imagenExpandida} className="image-zoomed" alt="Zoom" />
          </div>
        </div>
      )}
      
      <style>{`
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
      `}</style>
    </div>
  );
};

export default VistaServiciosAdmin;
