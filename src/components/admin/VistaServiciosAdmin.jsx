import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Clock, CheckCircle2, X, UserCircle, Calendar, 
  ArrowLeft, Camera, Layout, FileText, Maximize2, AlertTriangle, ChevronLeft, Timer, Settings
} from 'lucide-react';
import Header from '../Shared/Header';
import ModalAsignarChecklist from './ModalAsignarChecklist';
import ModalCrearCotizacion from '../Shared/ModalCrearCotizacion';
import UniversalSearch from '../Shared/UniversalSearch';
import '../../styles/Cliente/TableroScrum.css'; // Reutilizamos estilos

const VistaServiciosAdmin = () => {
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [tareasData, setTareasData] = useState([]);
  const [tareasFiltradas, setTareasFiltradas] = useState([]); // Buscador reactivo
  const [seccionTab, setSeccionTab] = useState('activos'); // 'activos' o 'finalizados'
  const [modalVisible, setModalVisible] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [verBitacora, setVerBitacora] = useState(false);
  const [imagenExpandida, setImagenExpandida] = useState(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [tecnicos, setTecnicos] = useState([]);
  const [modalChecklistVisible, setModalChecklistVisible] = useState(false);
  const [tecnicosEquipo, setTecnicosEquipo] = useState([]);
  const [editandoCita, setEditandoCita] = useState(false);
  const [tabActiva, setTabActiva] = useState('sos'); // Estado para pestañas en móvil
  const [showModalCotizacion, setShowModalCotizacion] = useState(false);
  const [cotizacionesData, setCotizacionesData] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState('todas');
  const [activeBatchTab, setActiveBatchTab] = useState(0);
  
  const columnasConfig = [
    { id: 'sos', titulo: 'SOS / PRIORITARIOS', color: '#e63946', icon: <AlertTriangle size={20} /> },
    { id: 'unassigned', titulo: 'POR ASIGNAR', color: '#8b5cf6', icon: <UserCircle size={20} /> },
    { id: 'todo', titulo: 'POR HACER', color: '#333', icon: <FileText size={20} /> },
    { id: 'progress', titulo: 'EN PROCESO', color: '#f26522', icon: <Timer size={20} /> },
    { id: 'done', titulo: 'FINALIZADOS', color: '#1b8a5a', icon: <CheckCircle2 size={20} /> },
    { id: 'rejected', titulo: 'RECHAZADOS', color: '#dc2626', icon: <X size={20} /> }
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
      const hasTechnician = item.tecnico_id || (item.technicians && item.technicians.length > 0);

      if (item.status === 'Listo' || item.status === 'Finalizado') {
        estado = 'done';
      } else if (item.status === 'Rechazado') {
        estado = 'rejected';
      } else if (item.status === 'En Proceso') {
        estado = 'progress';
      } else if (item.priority === 'Urgente') {
        estado = 'sos';
      } else if (!hasTechnician) {
        estado = 'unassigned';
      }
      
      return {
        dbId: item.id,
        titulo: `${item.zone} - ${item.equipment || 'General'}`,
        propiedad: item.property ? (item.property.nombre_propiedad || item.property.address) : 'Sin Propiedad',
        cliente: item.property?.client?.name || 'Desconocido',
        prioridad: item.priority === 'Urgente' ? 'SOS' : 'Normal',
        fechaFin: new Date(item.updated_at).toLocaleDateString(),
        fechaSolicitud: new Date(item.created_at).toLocaleDateString(),
        fechaSolucion: ['Listo', 'Finalizado'].includes(item.status) ? new Date(item.updated_at).toLocaleDateString() : 'Pendiente',
        tecnico: item.tecnico ? `${item.tecnico.first_name} ${item.tecnico.last_name}` : (item.technicians?.length ? item.technicians.map(t=>t.name || t.first_name).join(', ') : 'Pendiente de asignar'),
        tecnicoId: item.tecnico_id,
        tecnicosIds: item.technicians ? item.technicians.map(t => t.id) : [],
        propertyId: item.property_id,
        fechaInicio: new Date(item.created_at).toLocaleDateString(),
        estado: estado,
        descripcion: item.description,
        evidencias: [item.evidence_path, item.evidence_path_2].filter(p => p),
        custom_checklist: item.custom_checklist,
        batch_id: item.batch_id,
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

  const fetchCotizaciones = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`);
      setCotizacionesData(response.data);
    } catch (error) {
      console.error("Error cargando cotizaciones:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchTecnicos();
    fetchCotizaciones();
  }, [fetchOrders]);

  // --- AUTO-OPEN MODAL IF jobId IN URL ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('jobId');
    if (jobId && tareasData.length > 0) {
      const tarea = tareasData.find(t => t.dbId === parseInt(jobId));
      if (tarea) {
        const esActivo = ['sos', 'unassigned', 'todo', 'progress'].includes(tarea.estado);
        setSeccionTab(esActivo ? 'activos' : 'finalizados');
        setTabActiva(tarea.estado); // Cambiamos a la pestaña correcta (SOS, Unassigned, Todo, etc.)
        abrirModal(tarea);
        // Limpiamos la URL para no re-abrir al recargar
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [tareasData]);

  // --- ACCIONES ---
  const abrirModal = (tarea) => {
    setTareaSeleccionada(tarea);
    setActiveBatchTab(0);
    setVerBitacora(false);
    setEditandoCita(false);
    
    // Si es un lote, tomar los técnicos de la primera tarea como base para mostrar en la UI
    const baseTask = tarea.isBatch ? tarea.batchTasks[0] : tarea;
    setTecnicosEquipo(baseTask.tecnicosIds || (baseTask.tecnicoId ? [baseTask.tecnicoId] : []));
    
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setTareaSeleccionada(null);
  };

  const cambiarEstadoTarea = async (nuevoEstadoLaravel, targetDbId = null) => {
    setProcesandoAccion(true);
    const dbId = targetDbId || tareaSeleccionada.dbId;
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/${dbId}/status`, {
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

  const toggleTecnicoEquipo = async (id, targetDbId = null) => {
    const isSelected = tecnicosEquipo.includes(id);
    const newEquipo = isSelected 
      ? tecnicosEquipo.filter(tid => tid !== id) 
      : [...tecnicosEquipo, id];
      
    setTecnicosEquipo(newEquipo);
    setProcesandoAccion(true);
    const dbId = targetDbId || tareaSeleccionada.dbId;
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/${dbId}/assign`, {
        tecnicos_ids: newEquipo
      });
      await fetchOrders();
    } catch (e) {
      alert("Error al actualizar el equipo de trabajo.");
      setTecnicosEquipo(tecnicosEquipo); // revert
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleAssignBatch = async () => {
    if (!window.confirm("¿Estás seguro de que deseas asignar este mismo equipo de trabajo a TODAS las solicitudes de este lote?")) return;
    
    setProcesandoAccion(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/batch/${tareaSeleccionada.batch_id}/assign`, {
        tecnicos_ids: tecnicosEquipo
      });
      alert("Equipo asignado a todo el lote correctamente.");
      await fetchOrders();
    } catch (e) {
      console.error(e);
      alert("Error al asignar equipo al lote completo.");
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleSaveSchedule = async (newDate, newTime, targetDbId = null) => {
    if (!newDate || !newTime) return alert("Por favor selecciona tanto la fecha como la hora de visita.");
    
    // Combinar fecha y hora para el backend
    const scheduledAt = `${newDate} ${newTime}`;
    const dbId = targetDbId || tareaSeleccionada.dbId;
    
    setProcesandoAccion(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/${dbId}/assign`, {
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

  const cambiarSeccionTab = (nuevaSeccion) => {
    setSeccionTab(nuevaSeccion);
    if (nuevaSeccion === 'activos') {
      setTabActiva('sos');
    } else {
      setTabActiva('done');
    }
  };

  const tareasAgrupadas = useMemo(() => {
    const agrupadas = [];
    const mapLotes = new Map();

    tareasFiltradas.forEach(tarea => {
      if (!tarea.batch_id) {
        agrupadas.push({ ...tarea, isBatch: false });
      } else {
        if (!mapLotes.has(tarea.batch_id)) {
          mapLotes.set(tarea.batch_id, {
            ...tarea,
            isBatch: true,
            batchTasks: [tarea],
            dbId: `batch_${tarea.batch_id}`,
            titulo: `📦 TRABAJOS MÚLTIPLES (${tarea.batch_id})`
          });
          agrupadas.push(mapLotes.get(tarea.batch_id));
        } else {
          mapLotes.get(tarea.batch_id).batchTasks.push(tarea);
        }
      }
    });

    // Evaluar estados globales de los lotes y calcular el progreso
    agrupadas.forEach(item => {
      if (item.isBatch) {
        let hasSos = false;
        let hasUnassigned = false;
        let hasTodo = false;
        let hasProgress = false;
        let listos = 0;

        item.batchTasks.forEach(bt => {
          if (bt.estado === 'sos') hasSos = true;
          else if (bt.estado === 'unassigned') hasUnassigned = true;
          else if (bt.estado === 'todo') hasTodo = true;
          else if (bt.estado === 'progress') hasProgress = true;
          else if (bt.estado === 'done') listos++;
        });

        // La peor prioridad dicta la columna del Kanban
        if (hasSos) item.estado = 'sos';
        else if (hasUnassigned) item.estado = 'unassigned';
        else if (hasTodo) item.estado = 'todo';
        else if (hasProgress) item.estado = 'progress';
        else if (listos === item.batchTasks.length) item.estado = 'done';
        else item.estado = 'todo'; // Por si acaso hay mezclados pero no en los anteriores

        item.batchProgressText = `Trabajos listos: ${listos}/${item.batchTasks.length}`;
        item.listosCount = listos;
        item.totalCount = item.batchTasks.length;
      }
    });

    return agrupadas;
  }, [tareasFiltradas]);

  const renderColumna = (colId, titulo, clase) => {
    let tareasFiltradasCol = tareasAgrupadas.filter(t => t.estado === colId);

    if (colId === 'todo' && filtroFecha !== 'todas') {
      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);
      const finSemana = new Date(hoy);
      finSemana.setDate(finSemana.getDate() + 7);

      tareasFiltradasCol = tareasFiltradasCol.filter(t => {
        if (filtroFecha === 'sin_fecha') return !t.scheduledAt;
        if (!t.scheduledAt) return false;

        const d = new Date(t.scheduledAt);
        d.setHours(0,0,0,0);

        if (filtroFecha === 'hoy') return d.getTime() === hoy.getTime();
        if (filtroFecha === 'manana') return d.getTime() === manana.getTime();
        if (filtroFecha === 'semana') return d >= hoy && d <= finSemana;
        if (filtroFecha === 'atrasados') return d < hoy && !['done', 'rejected'].includes(t.estado);
        return true;
      });
    }
    
    return (
      <div className={`scrum-column ${clase}`}>
        <div className="column-header" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span className="column-title-text">{titulo}</span>
            <span className="column-badge">{tareasFiltradasCol.length}</span>
          </div>
          {colId === 'todo' && (
            <select 
              value={filtroFecha} 
              onChange={(e) => setFiltroFecha(e.target.value)}
              style={{ border: '1px solid #cbd5e1', background: 'white', outline: 'none', fontSize: '0.75rem', fontWeight: 'bold', color: '#f26522', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', width: '100%' }}
            >
              <option value="todas">Todas las fechas</option>
              <option value="hoy">Solo Hoy</option>
              <option value="manana">Mañana</option>
              <option value="semana">Próximos 7 días</option>
              <option value="atrasados">Atrasados</option>
              <option value="sin_fecha">Sin programar</option>
            </select>
          )}
        </div>
        <div className="cards-container">
          {tareasFiltradasCol.length > 0 ? (
            tareasFiltradasCol.map(tarea => (
              <div key={tarea.dbId} className="card-wrapper">
                <button 
                  className={`task-card-premium ${
                    tarea.isOverdue ? 'is-overdue' : ''
                  } ${
                    tarea.estado === 'sos' ? 'is-sos' : 
                    tarea.estado === 'unassigned' ? 'is-unassigned' :
                    tarea.estado === 'progress' ? (tarea.prioridad === 'SOS' ? 'is-sos is-active' : 'is-active') : 
                    tarea.estado === 'done' ? 'is-done' : ''
                  }`}
                  onClick={() => abrirModal(tarea)}
                >
                  <div className="prop-badge-card" style={{ whiteSpace: 'normal', marginBottom: '5px', lineHeight: '1.4' }}>
                    <div style={{ color: '#F26522', fontWeight: 'bold' }}>{tarea.cliente}</div>
                    <div style={{ color: '#555', fontSize: '0.75rem' }}>{tarea.propiedad}</div>
                  </div>
                  <h5 className="task-title-card" style={{ whiteSpace: 'normal', lineHeight: '1.3' }}>
                    {(tarea.estado === 'sos' || (tarea.estado === 'progress' && tarea.prioridad === 'SOS')) && <AlertTriangle size={14} className="sos-icon-inline" />}
                    {tarea.titulo}
                  </h5>
                  {tarea.isBatch ? (
                    <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px', border: '1px solid #7dd3fc', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '14px' }}>📦</span> LISTADO MÚLTIPLE
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#0369a1' }}>
                        {tarea.batchProgressText}
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const loteMatch = tarea.descripcion ? tarea.descripcion.match(/\[LOTE-[A-Z0-9]+\] \(\d+\/\d+\)/) : null;
                      if (loteMatch) {
                        return (
                          <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '10px', border: '1px solid #7dd3fc', width: 'fit-content' }}>
                            <span style={{ fontSize: '12px' }}>📦</span> LISTADO MULTIPLE: {loteMatch[0]}
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                  <div style={{ fontSize: '0.7rem', color: '#777', textAlign: 'left', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div><strong>Solicitado:</strong> {tarea.fechaSolicitud}</div>
                    {!tarea.isBatch && <div><strong>Solucionado:</strong> {tarea.fechaSolucion}</div>}
                  </div>
                  <div className="card-status-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {tarea.estado === 'done' ? (
                      <div className="status-pill-done">
                        <CheckCircle2 size={12} /> <span>Finalizado</span>
                      </div>
                    ) : (
                      <span className={`priority-tag ${tarea.prioridad.toLowerCase()}`}>
                        {tarea.prioridad.toUpperCase()}
                      </span>
                    )}
                    {(() => {
                      const coti = cotizacionesData.find(q => q.work_order_id === tarea.dbId || q.service_id === tarea.dbId);
                      if (!coti) return null;
                      const badgeText = coti.created_by_role === 'Admin' ? 'CA' : 'CT';
                      const bgColor = coti.created_by_role === 'Admin' ? '#1b8a5a' : '#333';
                      return (
                        <span style={{ background: bgColor, color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' }} title={coti.created_by_role === 'Admin' ? 'Cotización realizada por el Admin' : 'Cotización realizada por el Técnico'}>
                          {badgeText}
                        </span>
                      );
                    })()}
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

      {/* Buscador Universal */}
      <div className="search-bar-admin-wrapper" style={{ marginBottom: '20px', padding: '0 5px' }}>
        <UniversalSearch 
          data={tareasData}
          setFilteredData={setTareasFiltradas}
          placeholder="BUSCAR POR FOLIO, CLIENTE, PROPIEDAD O DESCRIPCIÓN DE SERVICIO..."
          type="TECNICO_TABLERO"
        />
      </div>

      {/* Pestañas Principales (Activos vs Finalizados/Rechazados) */}
      <div className="main-tabs-container">
        <button 
          className={`main-tab-btn ${seccionTab === 'activos' ? 'active' : ''}`}
          onClick={() => cambiarSeccionTab('activos')}
        >
          <span className="main-tab-icon">⚡</span>
          <span className="main-tab-text">Servicios Activos</span>
          <span className="main-tab-count">
            {tareasFiltradas.filter(t => ['sos', 'unassigned', 'todo', 'progress'].includes(t.estado)).length}
          </span>
        </button>
        <button 
          className={`main-tab-btn ${seccionTab === 'finalizados' ? 'active' : ''}`}
          onClick={() => cambiarSeccionTab('finalizados')}
        >
          <span className="main-tab-icon">📋</span>
          <span className="main-tab-text">Finalizados y Rechazados</span>
          <span className="main-tab-count">
            {tareasFiltradas.filter(t => ['done', 'rejected'].includes(t.estado)).length}
          </span>
        </button>
      </div>

      {(() => {
        const columnasMostrar = seccionTab === 'activos'
          ? columnasConfig.filter(col => ['sos', 'unassigned', 'todo', 'progress'].includes(col.id))
          : columnasConfig.filter(col => ['done', 'rejected'].includes(col.id));

        return (
          <>
            {/* Tabs para Móvil */}
            <div className="scrum-tabs-mobile">
              {columnasMostrar.map(col => (
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

            <div 
              className="scrum-board-layout" 
              style={{ 
                display: 'grid',
                gridTemplateColumns: seccionTab === 'activos' ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
                gap: '14px',
                width: '100%',
                alignItems: 'start'
              }}
            >
              {columnasMostrar.map(col => (
                <div key={col.id} className={`column-wrapper-responsive ${tabActiva === col.id ? 'show-mobile' : 'hide-mobile'}`}>
                  {renderColumna(col.id, col.titulo, `col-${col.id}`)}
                </div>
              ))}
            </div>
          </>
        );
      })()}

      {modalVisible && tareaSeleccionada && (
        (() => {
          const activeTask = tareaSeleccionada.isBatch ? tareaSeleccionada.batchTasks[activeBatchTab] : tareaSeleccionada;
          return (
        <div className="modal-view-overlay" onClick={cerrarModal}>
          <div className="modal-card-container" onClick={e => e.stopPropagation()}>
            <div className={`modal-top-indicator ${verBitacora ? 'is-bitacora' : activeTask.estado}`}>
               <div className="indicator-content">
                  {verBitacora && <ArrowLeft size={18} className="nav-back-icon" onClick={() => setVerBitacora(false)} />}
                  <span className="dot-blink"></span>
                  {verBitacora ? 'DETALLES TÉCNICOS' : (tareaSeleccionada.isBatch ? 'ORDEN DE TRABAJO (LOTE)' : 'ORDEN DE TRABAJO')}
               </div>
               <button className="close-modal-btn" onClick={cerrarModal}><span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>✕</span></button>
            </div>

            {tareaSeleccionada.isBatch && !verBitacora && (
              <div style={{ display: 'flex', overflowX: 'auto', background: '#f5f5f5', padding: '10px 10px 0 10px', borderBottom: '1px solid #ddd' }}>
                {tareaSeleccionada.batchTasks.map((t, index) => (
                  <button
                    key={t.dbId}
                    onClick={() => {
                       setActiveBatchTab(index);
                       setTecnicosEquipo(t.tecnicosIds || (t.tecnicoId ? [t.tecnicoId] : []));
                    }}
                    style={{
                      padding: '8px 16px',
                      background: activeBatchTab === index ? 'white' : 'transparent',
                      border: '1px solid',
                      borderColor: activeBatchTab === index ? '#ddd #ddd transparent #ddd' : 'transparent',
                      borderTopLeftRadius: '8px',
                      borderTopRightRadius: '8px',
                      fontWeight: activeBatchTab === index ? 'bold' : 'normal',
                      color: activeBatchTab === index ? '#F26522' : '#666',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      marginBottom: '-1px',
                      position: 'relative',
                      zIndex: activeBatchTab === index ? 1 : 0
                    }}
                  >
                    Servicio {index + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="modal-inner-scroll">
                {!verBitacora ? (
                  <div className="task-details-view">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '12px', background: '#f5f5f5', padding: '6px 12px', borderRadius: '8px', width: 'fit-content', border: '1px solid #eee' }}>
                      <Calendar size={14} />
                      <span>FECHA REPORTE: {activeTask.fechaInicio}</span>
                    </div>
                    
                    <div style={{ color: '#F26522', fontWeight: 'bold', marginBottom: '5px' }}>{activeTask.propiedad}</div>
                    <span className="wkf-id">WKF-ORD-{activeTask.dbId}</span>
                    <h3 className="task-main-heading" style={{ marginTop: '5px' }}>{activeTask.descripcion}</h3>
                    <p className="task-long-desc">{activeTask.titulo}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '15px 0' }}>
                      <button className="modal-action-btn variant-orange" onClick={() => setVerBitacora(true)}>
                        <Camera size={18} /> Ver Evidencias y Proceso
                      </button>

                      <button className="modal-action-btn variant-dark" onClick={abrirSurvey}>
                        <Layout size={18} /> CONSULTAR LEVANTAMIENTO DE LA PROPIEDAD
                      </button>
                    </div>
                    


                    <div style={{ marginTop: '15px', background: '#fcfcfc', padding: '15px', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: '800', color: '#888', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                        <Settings size={14}/> EQUIPO DE TRABAJO (Selecciona uno o más)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                        {tecnicos.map(t => {
                          const isSelected = tecnicosEquipo.includes(t.id);
                          return (
                            <div 
                              key={t.id} 
                              onClick={() => toggleTecnicoEquipo(t.id)}
                              style={{
                                background: isSelected ? '#fff9f5' : 'white',
                                border: `1px solid ${isSelected ? '#F26522' : '#eee'}`,
                                borderRadius: '10px', padding: '6px', cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative'
                              }}
                            >
                              {t.profile_picture_url ? (
                                <img 
                                  src={t.profile_picture_url} 
                                  alt="Técnico" 
                                  style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}
                                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <div className="tech-avatar-fallback" style={{ display: t.profile_picture_url ? 'none' : 'flex', background: '#f5f5f5', color: '#999', fontSize: '0.8rem', width: '38px', height: '38px', borderRadius: '50%', alignItems: 'center', justifyContent: 'center' }}>
                                {t.first_name?.charAt(0)}{t.last_name?.charAt(0)}
                              </div>
                              <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#666', textAlign: 'center' }}>{t.first_name} {t.last_name?.charAt(0)}.</span>
                              {isSelected && <div style={{ position: 'absolute', top: '-5px', right: '-5px', color: '#F26522', background: 'white', borderRadius: '50%' }}><CheckCircle2 size={16} /></div>}
                            </div>
                          );
                        })}
                      </div>

                      {tareaSeleccionada.batch_id && tecnicosEquipo.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <button 
                            className="modal-action-btn"
                            onClick={handleAssignBatch}
                            disabled={procesandoAccion}
                            style={{ background: '#0284c7', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', width: '100%', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            <span style={{ fontSize: '16px' }}>📦</span> ASIGNAR EQUIPO A TODO EL LOTE MÚLTIPLE
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="ts-schedule-block" style={{ marginTop: '15px' }}>

                      {/* PROGRAMAR VISITA Y BOTONES INFERIORES */}
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
                                defaultValue={activeTask.scheduledAt ? new Date(activeTask.scheduledAt).toISOString().split('T')[0] : ''}
                                id="input-date-visit"
                                onClick={(e) => !e.target.disabled && e.target.showPicker()}
                                disabled={activeTask.scheduledAt && !editandoCita}
                                style={{ 
                                  width: '100%', padding: '12px 10px 12px 30px', 
                                  border: '1px solid #ccc', borderRadius: '10px', 
                                  outline: 'none', background: (activeTask.scheduledAt && !editandoCita) ? '#f0f0f0' : 'white', fontSize: '0.85rem',
                                  color: '#333', fontWeight: '600', display: 'block', cursor: (activeTask.scheduledAt && !editandoCita) ? 'default' : 'pointer'
                                }}
                              />
                            </div>
                            <div className="input-with-icon" style={{ flex: 0.9, position: 'relative' }}>
                              <Clock size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#F26522', pointerEvents: 'none', zIndex: 1 }} />
                              <input 
                                type="time" 
                                id="input-time-visit"
                                defaultValue={activeTask.scheduledAt ? new Date(activeTask.scheduledAt).toISOString().split('T')[1].substring(0,5) : ''}
                                onClick={(e) => !e.target.disabled && e.target.showPicker()}
                                disabled={activeTask.scheduledAt && !editandoCita}
                                style={{ 
                                  width: '100%', padding: '12px 10px 12px 30px', 
                                  border: '1px solid #ccc', borderRadius: '10px', 
                                  outline: 'none', background: (activeTask.scheduledAt && !editandoCita) ? '#f0f0f0' : 'white', fontSize: '0.85rem',
                                  color: '#333', fontWeight: '600', display: 'block', cursor: (activeTask.scheduledAt && !editandoCita) ? 'default' : 'pointer'
                                }}
                              />
                            </div>
                          </div>
                          
                          {activeTask.scheduledAt && !editandoCita ? (
                            <button 
                              className="modal-action-btn"
                              onClick={() => setEditandoCita(true)}
                              style={{ background: '#333', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', width: '100%', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' }}
                            >
                              <Calendar size={16} /> REPROGRAMAR VISITA
                            </button>
                          ) : (
                            <button 
                              className="modal-action-btn"
                              onClick={() => handleSaveSchedule(document.getElementById('input-date-visit').value, document.getElementById('input-time-visit').value, activeTask.dbId)}
                              disabled={procesandoAccion}
                              style={{ background: '#F26522', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', width: '100%', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' }}
                            >
                              {procesandoAccion ? 'GUARDANDO...' : 'GUARDAR Y NOTIFICAR'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="checklist-container" style={{ marginTop: '20px', background: 'white', border: '1px solid #eee', borderRadius: '12px', padding: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#555', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle2 size={16} color="#1b8a5a"/> LISTA DE TAREAS / MATERIALES
                        </label>
                        <button className="modal-action-btn variant-orange" onClick={() => setModalChecklistVisible(true)} style={{ background: '#333', padding: '5px 10px', fontSize: '0.7rem' }}>
                          {activeTask.custom_checklist ? 'EDITAR' : 'ASIGNAR'}
                        </button>
                      </div>
                      
                      <div className="checklist-items" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activeTask.custom_checklist && activeTask.custom_checklist.length > 0 ? (
                          activeTask.custom_checklist.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px', background: item.is_completed ? '#f0fdf4' : '#fcfcfc', border: `1px solid ${item.is_completed ? '#bbf7d0' : '#eee'}`, borderRadius: '8px' }}>
                              <div style={{ color: item.is_completed ? '#1b8a5a' : '#ccc', marginTop: '2px' }}>
                                {item.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: item.is_completed ? '#1b8a5a' : '#333', textDecoration: item.is_completed ? 'line-through' : 'none' }}>
                                  {item.text}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '0.8rem', fontStyle: 'italic', background: '#fafafa', borderRadius: '8px' }}>
                            Aún no se ha añadido ninguna lista de tareas.
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                      {(() => {
                        const cotizacionAsociada = cotizacionesData.find(q => q.work_order_id === activeTask.dbId || q.service_id === activeTask.dbId);
                        
                        return (
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button className="modal-action-btn variant-dark" onClick={() => setShowModalCotizacion(true)} style={{ background: '#1b8a5a', color: 'white', flex: 1, minWidth: '160px' }}>
                              <FileText size={18} /> {cotizacionAsociada ? 'EDITAR COTIZACIÓN' : 'REALIZAR COTIZACIÓN'}
                            </button>
                            
                            {cotizacionAsociada && (
                              <button 
                                className="modal-action-btn variant-orange" 
                                onClick={() => navigate(`/vista-cotizaciones?quoteId=${cotizacionAsociada.id}`)}
                                style={{ background: '#F26522', color: 'white', flex: 1, minWidth: '160px' }}
                              >
                                <FileText size={18} /> VER COTIZACIÓN
                              </button>
                            )}
                            
                            {cotizacionAsociada && cotizacionAsociada.parent_id && (
                              <button 
                                className="modal-action-btn variant-dark" 
                                onClick={() => {
                                  const borrador = cotizacionesData.find(q => q.id === cotizacionAsociada.parent_id);
                                  if (borrador) {
                                    localStorage.setItem('cotizacion_para_imprimir', JSON.stringify(borrador));
                                    window.open('/imprimir-cotizacion', '_blank');
                                  }
                                }} 
                                style={{ background: '#6c757d', color: 'white', flex: 1, minWidth: '160px' }}
                              >
                                <FileText size={18} /> VER BORRADOR TÉCNICO
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="modal-main-action-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activeTask.estado === 'todo' || activeTask.estado === 'unassigned' || activeTask.estado === 'sos' ? (
                        <button className="modal-action-btn variant-black" disabled={procesandoAccion} onClick={() => cambiarEstadoTarea('En Proceso', activeTask.dbId)}>
                          <Timer size={18} /> {procesandoAccion ? 'Actualizando...' : 'INICIAR TRABAJO'}
                        </button>
                      ) : activeTask.estado === 'progress' ? (
                        <button className="modal-action-btn variant-green" disabled={procesandoAccion} onClick={() => cambiarEstadoTarea('Listo', activeTask.dbId)}>
                          <CheckCircle2 size={18} /> {procesandoAccion ? 'Finalizando...' : 'MARCAR COMO LISTO'}
                        </button>
                      ) : null}

                      {activeTask.estado !== 'rejected' && (
                        <button 
                          className="modal-action-btn" 
                          disabled={procesandoAccion} 
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de que deseas cancelar este servicio? Se moverá al apartado de rechazados.')) {
                              cambiarEstadoTarea('Rechazado', activeTask.dbId);
                            }
                          }}
                          style={{ background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          <X size={18} /> {procesandoAccion ? 'Cancelando...' : 'CANCELAR SERVICIO'}
                        </button>
                      )}

                      {activeTask.estado === 'done' && (
                        <button 
                          className="modal-action-btn variant-orange" 
                          onClick={() => navigate(`/galeria-reportes/${activeTask.dbId}`, { state: { trabajoId: activeTask.dbId, servicio: activeTask } })}
                          style={{ background: '#f26624', marginTop: '10px' }}
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
                        <div className={`check-row ${activeTask.estado === 'progress' ? 'current' : activeTask.estado === 'done' ? 'done' : ''}`}>
                          {activeTask.estado === 'done' ? <CheckCircle2 size={16}/> : <Clock size={16}/>} 
                          Ejecución en sitio
                        </div>
                      </div>
                    </div>
                    <div className="media-area">
                      <h6 className="section-label"><Camera size={14} /> EVIDENCIAS ENVIADAS</h6>
                      <div className="evidence-grid">
                        {activeTask.evidencias.map((img, i) => (
                          <div key={i} className="evidence-card" onClick={() => setImagenExpandida(img)}>
                            <img src={img} alt="Evidencia" />
                            <div className="evidence-overlay"><Maximize2 size={16} /></div>
                          </div>
                        ))}
                      </div>
                      {activeTask.evidencias.length === 0 && <p style={{ color: '#999', fontSize: '0.9rem' }}>No hay evidencias adjuntas.</p>}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
          );
        })()
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
              <button className="close-survey-btn" onClick={() => setModalSurveyVisible(false)}>✕</button>
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
                              {area.subareas && area.subareas.length > 0 ? (
                                area.subareas.map(sub => (
                                  <div key={sub.id} className="subarea-section-admin" style={{ marginBottom: '30px', borderBottom: '1px solid #ddd', paddingBottom: '20px' }}>
                                    <h3 style={{ color: '#F26522', fontWeight: '800', fontSize: '1.25rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                                      <span style={{ width: '4px', height: '20px', background: '#F26522', borderRadius: '2px', display: 'inline-block' }}></span>
                                      {sub.name}
                                    </h3>
                                    {Object.entries(sub.categories || {}).length === 0 ? (
                                      <p style={{ color: '#777', fontSize: '0.85rem', fontStyle: 'italic', paddingLeft: '12px' }}>No hay elementos registrados en esta zona.</p>
                                    ) : (
                                      Object.entries(sub.categories || {}).map(([catName, items]) => (
                                        <div key={catName} className="category-group" style={{ paddingLeft: '12px', marginTop: '10px' }}>
                                          <h4 className="category-heading" style={{ fontSize: '0.95rem', color: '#555', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>{catName}</h4>
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
                                                        <img key={idx} src={img.image_path || img} onClick={() => setImagenExpandida(img.image_path || img)} alt="Gallery" />
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
                                ))
                              ) : (
                                Object.entries(area.categories).length === 0 ? (
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
                                                    <img key={idx} src={img.image_path || img} onClick={() => setImagenExpandida(img.image_path || img)} alt="Gallery" />
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                )
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
        .main-tabs-container {
          display: flex;
          gap: 15px;
          margin: 15px 5px 25px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
          overflow-x: auto;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        .main-tabs-container::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }
        .main-tab-btn {
          background: none;
          border: none;
          padding: 10px 20px;
          font-size: 1rem;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          transition: all 0.3s ease;
          border-radius: 10px;
          flex-shrink: 0;
          white-space: nowrap;
          outline: none;
        }
        .main-tab-btn:focus-visible {
          outline: 2px solid #F26522;
          outline-offset: 2px;
        }
        .main-tab-btn:hover {
          color: #1e293b;
          background: rgba(0, 0, 0, 0.02);
        }
        .main-tab-btn.active {
          color: #F26522;
          background: rgba(242, 101, 34, 0.05);
        }
        .main-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -12px;
          left: 0;
          right: 0;
          height: 3px;
          background: #F26522;
          border-radius: 3px;
        }
        .main-tab-icon {
          font-size: 1.1rem;
        }
        .main-tab-text {
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .main-tab-count {
          background: #e2e8f0;
          color: #475569;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 800;
          transition: all 0.3s ease;
        }
        .main-tab-btn.active .main-tab-count {
          background: #F26522;
          color: white;
        }

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
          background: #f1f5f9;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: #334155 !important;
        }
        .close-survey-btn:hover { background: #e2e8f0; color: #ef4444 !important; transform: rotate(90deg); }
        
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
          user-select: none;
          -webkit-user-select: none;
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
          .main-tabs-container {
            gap: 10px;
            margin: 10px 2px 15px;
            padding-bottom: 6px;
          }
          .main-tab-btn {
            padding: 8px 14px;
            font-size: 0.85rem;
            gap: 6px;
          }
          .main-tab-btn.active::after {
            bottom: -8px;
          }
          .main-tab-icon {
            font-size: 1rem;
          }
          
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
      
      {showModalCotizacion && tareaSeleccionada && (
        <ModalCrearCotizacion
          workOrderId={tareaSeleccionada.dbId}
          cotizacionExistente={cotizacionesData.find(q => q.work_order_id === tareaSeleccionada.dbId || q.service_id === tareaSeleccionada.dbId)}
          isAdmin={true}
          onClose={() => setShowModalCotizacion(false)}
          onSuccess={() => {
            fetchCotizaciones();
            alert("Cotización gestionada con éxito");
          }}
        />
      )}
    </div>
  );
};

export default VistaServiciosAdmin;
