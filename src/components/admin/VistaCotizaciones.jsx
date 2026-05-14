import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../../styles/Admin/VistaCotizaciones.css";
import Header from "../Shared/Header";
import AssignWorkModal from "./AssignWorkModal";
import { 
  Plus, Search, Filter, Calendar, 
  ArrowUpDown, FileText, Upload, 
  MoreVertical, Eye, CheckCircle, 
  XCircle, Clock, ChevronDown, ChevronLeft,
  User, Wrench, Truck, Layout
} from 'lucide-react';
import CreateQuotationModal from "./CreateQuotationModal";
import UniversalSearch from "../Shared/UniversalSearch";

const VistaCotizaciones = () => {
  const navigate = useNavigate();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [cotizacionParaAsignar, setCotizacionParaAsignar] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [filtro, setFiltro] = useState('Pendiente');
  const [busqueda, setBusqueda] = useState('');
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);

  const [esCliente, setEsCliente] = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);
  const [rechazando, setRechazando] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);

  // --- NUEVOS ESTADOS ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ordenMonto, setOrdenMonto] = useState(null); // 'asc' | 'desc' | null
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'manual' | 'archivo'
  const [filtroOrigen, setFiltroOrigen] = useState('todos'); // 'todos' | 'admin' | 'tecnicos' | 'proveedores'
  const [cotizacionesFiltradas, setCotizacionesFiltradas] = useState([]);
  const [esTecnico, setEsTecnico] = useState(false);

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('agente_session') || '{}');
      if (session?.userData) {
        setUsuarioId(session.userData.id || null);
        if (session.userData.role_id === 3) {
          setEsCliente(true);
        }
        if (session.userData.role_id === 2) {
          setEsTecnico(true);
        }
      }
    } catch(e) {}
    cargarCotizaciones();
  }, []);

 

  const cargarCotizaciones = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('agente_session') || '{}');
      const userId = session?.userData?.id;
      const roleId = session?.userData?.role_id;

      const respuesta = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`);
      let data = respuesta.data;

      // FILTRO PARA TÉCNICOS: Solo ver sus propias propuestas al Admin
      if (roleId === 2) {
        data = data.filter(c => 
          c.created_by_role === 'Técnico' && 
          (c.tecnico_user_id === userId || c.user_id === userId)
        );
      }

      setCotizaciones(data);
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error);
    } finally {
      setCargando(false);
    }
  };

  const filtradas = cotizaciones.filter(c => {
    const coincideFiltro = 
      (filtro === 'Pendiente' && (c.status === 'Pendiente' || c.status === 'En proceso' || c.status?.includes('Admin'))) ||
      (filtro === 'Aprobado' && (c.status === 'Aprobado' || c.status === 'Procesada por Admin')) ||
      (filtro === 'Rechazado' && c.status === 'Rechazado');

    const coincideBusqueda = (c.cliente?.toLowerCase() || "").includes(busqueda?.toLowerCase() || "") || 
                             (c.folio?.toString() || "").includes(busqueda || "");

    const correspondeAlCliente = !esCliente || c.cliente_user_id === usuarioId;

    const coincideTipo = 
      filtroTipo === 'todos' || 
      (filtroTipo === 'manual' && c.type !== 'archivo') || 
      (filtroTipo === 'archivo' && c.type === 'archivo');

    return coincideFiltro && coincideBusqueda && correspondeAlCliente && coincideTipo;
  }).sort((a, b) => {
    if (!ordenMonto) return 0;
    const valA = parseFloat(a.total) || 0;
    const valB = parseFloat(b.total) || 0;
    return ordenMonto === 'asc' ? valA - valB : valB - valA;
  });


  const verPantallaCompleta = (url) => {
    window.open(url, '_blank');
  };

  const procesarCotizacion = async (status) => {
    if (status === 'Rechazado' && !motivoRechazo.trim()) {
      alert("Por favor, ingresa el motivo del rechazo.");
      return;
    }

    setProcesando(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacionSeleccionada.id}/status`, {
        status,
        rejection_reason: motivoRechazo
      });
      alert(`Cotización ${status.toLowerCase()} exitosamente.`);
      setCotizacionSeleccionada(null);
      setRechazando(false);
      setMotivoRechazo('');
      cargarCotizaciones();
    } catch (error) {
      alert("Error al procesar la cotización.");
    } finally {
      setProcesando(false);
    }
  };

  const handleImprimirPDF = () => {
    // Guardamos los datos temporalmente
    localStorage.setItem('cotizacion_para_imprimir', JSON.stringify(cotizacionSeleccionada));
    
    // Abrimos la vista en una NUEVA PESTAÑA
    window.open('/imprimir-cotizacion', '_blank'); 
  };

  const renderConceptoDetalle = (conceptoStr) => {
    try {
      const detalle = typeof conceptoStr === 'string' ? JSON.parse(conceptoStr) : conceptoStr;
      
      if (detalle && typeof detalle === 'object' && (detalle.conceptos || detalle.materiales || detalle.herramientas_basicas)) {
        return (
          <div className="detalle-parseado">
            {/* Conceptos / Servicios */}
            {(detalle.conceptos || detalle.servicios) && (detalle.conceptos || detalle.servicios).some(c => c.descripcion) && (
              <div className="detalle-seccion">
                <h4 style={{ color: '#ff8800', borderBottom: '1px solid #ff8800', paddingBottom: '5px' }}>Servicios / Conceptos</h4>
                <table className="modal-items-table">
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th style={{ textAlign: 'center' }}>Cant.</th>
                      <th style={{ textAlign: 'center' }}>Precio U.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detalle.conceptos || detalle.servicios).filter(c => c.descripcion).map((c, i) => (
                      <tr key={i}>
                        <td>{c.descripcion}</td>
                        <td style={{ textAlign: 'center' }}>{c.cantidad || 1}</td>
                        <td style={{ textAlign: 'center' }}>${parseFloat(c.precio_u || c.precio || 0).toLocaleString('es-MX')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Materiales */}
            {detalle.materiales && detalle.materiales.some(m => m.nombre || m.descripcion) && (
              <div className="detalle-seccion" style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#ff8800', borderBottom: '1px solid #ff8800', paddingBottom: '5px' }}>Materiales</h4>
                <table className="modal-items-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th style={{ textAlign: 'center' }}>Cant.</th>
                      <th style={{ textAlign: 'center' }}>Costo U.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.materiales.filter(m => m.nombre || m.descripcion).map((m, i) => (
                      <tr key={i}>
                        <td>{m.nombre || m.descripcion}</td>
                        <td style={{ textAlign: 'center' }}>{m.cantidad || 1}</td>
                        <td style={{ textAlign: 'center' }}>${parseFloat(m.costo_u || m.precio || 0).toLocaleString('es-MX')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }
    } catch (e) {
      console.log("No es un JSON de detalle, se muestra como texto.");
    }

    // Fallback: Mostrar como antes si no es el JSON esperado
    return (
      <table className="modal-items-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th style={{ textAlign: 'center' }}>Total Estimado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{conceptoStr}</td>
            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
              ${parseFloat(cotizacionSeleccionada.total).toLocaleString('es-MX')}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <div className="cotiz-page">
      
      {/* 👇 AQUÍ ESTÁ EL NUEVO HEADER GLOBAL 👇 */}
      {!esCliente && <Header titulo="COTIZACIONES" />}


      {/* 👆 Se eliminaron los div de las barras manuales y el tag <header> 👆 */}

      <main className="cotiz-main-content" style={esCliente ? { padding: '20px 0', width: '100%', maxWidth: '1000px', margin: '0 auto' } : {}}>
        
        <div className="cotiz-header-actions" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start' }}>
          
          <button 
            onClick={() => navigate(-1)} 
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '8px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            <ChevronLeft size={18} />
            <span>REGRESAR</span>
          </button>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
            <UniversalSearch 
              data={cotizaciones}
              setFilteredData={setCotizacionesFiltradas}
              placeholder="Buscar por cliente, folio o monto..."
              filtroActual={filtro}
              type="COTIZACIONES"
            />
            
            {!esCliente && (
              <button className="btn-new-cotiz-v2" onClick={() => setShowCreateModal(true)}>
                <Plus size={18} />
                <span>NUEVA COTIZACIÓN</span>
              </button>
            )}
          </div>
        </div>

        <div className="cotiz-filters-row">
          <div className="cotiz-tabs-pills">
            <button className={`cotiz-pill ${filtro === 'Pendiente' ? 'active' : ''}`} onClick={() => setFiltro('Pendiente')}>
              <Clock size={16} /> NUEVAS
            </button>
            <button className={`cotiz-pill ${filtro === 'Aprobado' ? 'active' : ''}`} onClick={() => setFiltro('Aprobado')}>
              <CheckCircle size={16} /> APROBADAS
            </button>
            <button className={`cotiz-pill ${filtro === 'Rechazado' ? 'active' : ''}`} onClick={() => setFiltro('Rechazado')}>
              <XCircle size={16} /> RECHAZADAS
            </button>
          </div>

          {!esCliente && !esTecnico && (
            <div className="cotiz-tabs-pills origin-pills">
              <button className={`cotiz-pill mini ${filtroOrigen === 'todos' ? 'active' : ''}`} onClick={() => setFiltroOrigen('todos')}>TODOS</button>
              <button className={`cotiz-pill mini ${filtroOrigen === 'admin' ? 'active' : ''}`} onClick={() => setFiltroOrigen('admin')}>
                 <User size={14} /> ADMIN
              </button>
              <button className={`cotiz-pill mini ${filtroOrigen === 'tecnicos' ? 'active' : ''}`} onClick={() => setFiltroOrigen('tecnicos')}>
                 <Wrench size={14} /> TÉCNICOS
              </button>
              <button className={`cotiz-pill mini ${filtroOrigen === 'proveedores' ? 'active' : ''}`} onClick={() => setFiltroOrigen('proveedores')}>
                 <Truck size={14} /> PROVEEDORES
              </button>
            </div>
          )}

          <div className="cotiz-advanced-filters">
            <div className="filter-group">
              <Filter size={14} />
              <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="todos">Todos los tipos</option>
                <option value="manual">Manual</option>
                <option value="archivo">Archivo</option>
              </select>
            </div>
            
            <button 
              className={`sort-btn ${ordenMonto ? 'active' : ''}`} 
              onClick={() => setOrdenMonto(prev => prev === 'asc' ? 'desc' : (prev === 'desc' ? null : 'asc'))}
            >
              <ArrowUpDown size={14} />
              Monto {ordenMonto === 'asc' ? '(Min-Max)' : (ordenMonto === 'desc' ? '(Max-Min)' : '')}
            </button>
          </div>
        </div>

        <div className="cotiz-table-container" style={esCliente ? { width: '100%' } : {}}>
          <table className="cotiz-data-table">
            <thead>
              <tr>
                <th>FOLIO</th>
                <th>FECHA</th>
                {!esCliente && <th>CLIENTE</th>}
                <th>TOTAL</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
  {cargando ? (
    <tr><td colSpan="4" className="no-data">Cargando cotizaciones...</td></tr>
  ) : cotizacionesFiltradas.length > 0 ? (
    cotizacionesFiltradas
      .filter(c => {
        const coincideTipo = 
          filtroTipo === 'todos' || 
          (filtroTipo === 'manual' && c.type !== 'archivo') || 
          (filtroTipo === 'archivo' && c.type === 'archivo');
          
        const coincideOrigen = 
          filtroOrigen === 'todos' ||
          (filtroOrigen === 'admin' && (c.created_by_role === 'Admin' || (!c.created_by_role && !c.tecnico))) ||
          (filtroOrigen === 'tecnicos' && c.created_by_role === 'Técnico') ||
          (filtroOrigen === 'proveedores' && c.created_by_role === 'Proveedor');

        return coincideTipo && coincideOrigen;
      })
      .sort((a, b) => {
        if (!ordenMonto) return 0;
        const valA = parseFloat(a.total) || 0;
        const valB = parseFloat(b.total) || 0;
        return ordenMonto === 'asc' ? valA - valB : valB - valA;
      })
      .map((c) => (
      <tr key={c.id} style={c.status === 'Rechazado' ? { backgroundColor: '#fff5f5', borderLeft: '4px solid #ef4444' } : {}}>
        <td className="bold-folio" data-label="FOLIO">#{c.folio}</td>
        <td className="cotiz-date" data-label="FECHA">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: '#666' }}>
            <Calendar size={14} />
            {c.created_at ? new Date(c.created_at).toLocaleDateString('es-MX') : c.fecha || '---'}
          </div>
        </td>
        {!esCliente && (
          <td className="cliente-name" data-label="CLIENTE">
            <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{c.cliente}</div>
            {c.created_by_role === 'Técnico' ? (
              <div className="origin-tag-mini">
                <Wrench size={10} /> TÉCNICO: {c.tecnico}
              </div>
            ) : (
              <div className="origin-tag-mini admin">
                <User size={10} /> ADMINISTRATIVO
              </div>
            )}
          </td>
        )}
        <td className="monto-final" data-label="TOTAL">
          {c.type === 'archivo' ? 'Ver Archivo' : `$${parseFloat(c.total).toLocaleString('es-MX')}`}
        </td>
        <td data-label="ACCIONES">
          <div className="cotiz-actions-cell">
            <button className="btn-view-detail" onClick={() => setCotizacionSeleccionada(c)} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.9rem)' }}>
              👁️ VER
            </button>
            {/* Botón para editar si está rechazada */}
            {!esCliente && c.status === 'Rechazado' && (
              <button 
                className="btn-view-detail" 
                style={{ background: '#3b82f6', color: 'white', border: 'none' }}
                onClick={() => {
                  setCotizacionParaAsignar(c); 
                  setShowCreateModal(true);
                }}
              >
                ✏️ RE-EDITAR
              </button>
            )}
            {/* Solo mostrar acciones de asignación si es admin y está aprobada */}
            {!esCliente && !esTecnico && filtro === 'Aprobado' && (
              c.tecnico ? (
                // Mostrar cuando YA está asignado
                <>
                  <span style={{ fontWeight: 'bold', color: '#2e7d32', margin: '0 2px', fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)' }}>✓ Asignado</span>
                  <button
                    className="btn-view-detail"
                    style={{ background: '#fb8c00', fontSize: 'clamp(0.7rem, 2vw, 0.9rem)' }}
                    onClick={() => {
                      setCotizacionParaAsignar(c);
                      setShowAssignModal(true);
                    }}
                  >
                    🔄
                  </button>
                </>
              ) : (
                // Mostrar cuando NO está asignado
                <button
                  className="btn-view-detail"
                  style={{ background: '#2e7d32', fontSize: 'clamp(0.7rem, 2vw, 0.9rem)' }}
                  onClick={() => {
                    setCotizacionParaAsignar(c);
                    setShowAssignModal(true);
                  }}
                >
                  🛠️
                </button>
              )
            )}
          </div>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="4" className="no-data">No se encontraron resultados</td>
    </tr>
  )}
</tbody>
          </table>
        </div>
      </main>

      {cotizacionSeleccionada && (
        <div className="modal-fixed-overlay" onClick={() => setCotizacionSeleccionada(null)}>
          
          <div className="modal-box-card" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            
            <div className="modal-header-dark" style={{ flexShrink: 0 }}>
                <span>DETALLE DE COTIZACIÓN {cotizacionSeleccionada.folio}</span>
                <button className="modal-close-icon" onClick={() => { setCotizacionSeleccionada(null); setRechazando(false); setMotivoRechazo(''); }}>&times;</button>
            </div>
            
            <div className="modal-body-content" style={{ overflowY: 'auto', flexGrow: 1 }}>
                
                <div className="modal-info-summary">
                  {cotizacionSeleccionada.tecnico && (
                    <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #f26624', marginBottom: '10px' }}>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', fontWeight: '500' }}>
                        🛠️ {cotizacionSeleccionada.created_by_role === 'Técnico' ? 'Propuesta técnica enviada al Administrador' : 'Cotización oficial para el Cliente'}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                        Propiedad: {cotizacionSeleccionada.propiedad_nombre || 'Sin nombre'}
                      </p>
                    </div>
                  )}
                  <p><strong>Cliente:</strong> {cotizacionSeleccionada.cliente}</p>
                  {cotizacionSeleccionada.tecnico && <p><strong>Técnico:</strong> {cotizacionSeleccionada.tecnico}</p>}
                  <p><strong>Fecha:</strong> {cotizacionSeleccionada.fecha}</p>
                </div>

                {cotizacionSeleccionada.type === 'archivo' ? (
                  
                  <div style={{ position: 'relative', background: '#e0e0e0', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
                    
                    {cotizacionSeleccionada.archivo_url && (
                      <button 
                        onClick={() => verPantallaCompleta(cotizacionSeleccionada.archivo_url)}
                        title="Ver en pantalla completa"
                        style={{
                          position: 'absolute', top: '25px', right: '25px',
                          background: 'rgba(34, 34, 34, 0.8)', color: 'white', border: 'none',
                          borderRadius: '8px', padding: '10px 14px', cursor: 'pointer',
                          fontSize: '1.2rem', transition: 'background 0.3s', zIndex: 10
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(34, 34, 34, 0.8)'}
                      >
                        ⛶
                      </button>
                    )}

                    {cotizacionSeleccionada.archivo_url ? (
                      cotizacionSeleccionada.archivo_url.endsWith('.pdf') ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', padding: '40px 0' }}>
                          <span style={{ fontSize: '5rem', marginBottom: '15px' }}>📄</span>
                          <p style={{ fontWeight: 'bold', color: '#555', marginBottom: '20px', textAlign: 'center', fontSize: '1.2rem' }}>Documento PDF Adjunto</p>
                          <button 
                            onClick={() => verPantallaCompleta(cotizacionSeleccionada.archivo_url)}
                            style={{ background: '#ff8800', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(255, 136, 0, 0.3)' }}
                          >
                            ABRIR PDF
                          </button>
                        </div>
                      ) : (
                        <img 
                          src={cotizacionSeleccionada.archivo_url} 
                          alt="Cotización" 
                          style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                        />
                      )
                    ) : (
                      <p style={{ color: 'red', padding: '30px' }}>El archivo no se encuentra disponible.</p>
                    )}
                  </div>

                ) : (
                  renderConceptoDetalle(cotizacionSeleccionada.concept)
                )}

                {cotizacionSeleccionada.status === 'Aprobado' && !esCliente && (
                    <div style={{ marginTop: '20px', padding: '15px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #16a34a', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 10px 0', color: '#16a34a', fontWeight: 'bold' }}>✅ ESTA COTIZACIÓN HA SIDO APROBADA</p>
                      <button 
                        onClick={() => navigate(`/tablero-servicios?jobId=${cotizacionSeleccionada.work_order_id || cotizacionSeleccionada.service_id}`)}
                        style={{ background: '#16a34a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
                      >
                        <Layout size={18} /> IR AL TABLERO DE TRABAJO
                      </button>
                    </div>
                  )}

                <div className="modal-total-section">
                  <h3>TOTAL: ${parseFloat(cotizacionSeleccionada.total).toLocaleString('es-MX')}</h3>
                </div>

                {cotizacionSeleccionada.observations && (
                  <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px', marginTop: '15px', borderLeft: '4px solid #ff8800' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#333' }}>Mensajes al Cliente:</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', whiteSpace: 'pre-wrap' }}>
                      {cotizacionSeleccionada.observations}
                    </p>
                  </div>
                )}

                {!esCliente && cotizacionSeleccionada.internal_observations && (
                  <div style={{ padding: '15px', background: '#fff9c4', borderRadius: '8px', marginTop: '15px', borderLeft: '4px solid #fbc02d' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#f57f17' }}>Comentarios Internos:</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#5d4037', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                      {cotizacionSeleccionada.internal_observations}
                    </p>
                  </div>
                )}
                
                {rechazando && (
                  <div style={{ padding: '15px', background: '#ffebee', borderRadius: '8px', marginTop: '15px' }}>
                    <label style={{ fontWeight: 'bold', color: '#b71c1c', display: 'block', marginBottom: '8px' }}>
                      Motivo del rechazo:
                    </label>
                    <textarea 
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ffcdd2', outline: 'none' }}
                      rows="3"
                      placeholder="Escribe por qué rechazas la cotización..."
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                    />
                  </div>
                )}

            </div>

            <div className="modal-footer-btns" style={{ flexShrink: 0, justifyContent: 'space-between', display: 'flex' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* BOTÓN PARA QUE EL ADMIN GENERE COTIZACIÓN A CLIENTE BASADA EN LA DEL TÉCNICO */}
                  {!esCliente && !esTecnico && cotizacionSeleccionada.created_by_role === 'Técnico' && (
                    <button 
                      className="btn-modal-print" 
                      style={{ background: '#F26522', color: 'white', fontWeight: 'bold' }} 
                      onClick={() => {
                        setCotizacionParaAsignar(cotizacionSeleccionada);
                        setCotizacionSeleccionada(null);
                        setShowCreateModal(true);
                      }}
                    >
                      🛠️ GENERAR COTIZACIÓN A CLIENTE
                    </button>
                  )}

                  {esCliente && cotizacionSeleccionada.status === 'Pendiente' && !rechazando && (
                    <>
                      <button 
                        className="btn-modal-print" 
                        style={{ background: '#2e7d32', color: 'white' }} 
                        onClick={() => procesarCotizacion('Aprobado')}
                        disabled={procesando}
                      >
                        ✓ ACEPTAR COTIZACIÓN
                      </button>
                      <button 
                        className="btn-modal-print" 
                        style={{ background: '#c62828', color: 'white' }} 
                        onClick={() => setRechazando(true)}
                      >
                        ✕ RECHAZAR
                      </button>
                    </>
                  )}
                  {esCliente && rechazando && (
                    <>
                      <button 
                        className="btn-modal-print" 
                        style={{ background: '#c62828', color: 'white' }} 
                        onClick={() => procesarCotizacion('Rechazado')}
                        disabled={procesando}
                      >
                        CONFIRMAR RECHAZO
                      </button>
                      <button 
                        className="btn-modal-print" 
                        style={{ background: '#757575', color: 'white' }} 
                        onClick={() => { setRechazando(false); setMotivoRechazo(''); }}
                      >
                        CANCELAR
                      </button>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {cotizacionSeleccionada.type !== 'archivo' && (
                    <button className="btn-modal-print" onClick={handleImprimirPDF}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      VER PDF
                    </button>
                  )}
                  <button className="btn-modal-close" onClick={() => { setCotizacionSeleccionada(null); setRechazando(false); setMotivoRechazo(''); }}>CERRAR</button>
                </div>
            </div>
          </div>
        </div>
      )}


      {showAssignModal && cotizacionParaAsignar && (
        <AssignWorkModal 
          cotizacion={cotizacionParaAsignar} 
          onClose={() => {
            setShowAssignModal(false);
            setCotizacionParaAsignar(null);
          }}
          onAssign={() => {
            setShowAssignModal(false);
            setCotizacionParaAsignar(null);
            cargarCotizaciones();
          }}
        />
      )}

      {showCreateModal && (
        <CreateQuotationModal 
          prefillData={cotizacionParaAsignar} // Pasamos la cotización de técnico si existe
          onClose={() => {
            setShowCreateModal(false);
            setCotizacionParaAsignar(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setCotizacionParaAsignar(null);
            cargarCotizaciones();
          }}
        />
      )}
    </div>
  );
};

export default VistaCotizaciones;