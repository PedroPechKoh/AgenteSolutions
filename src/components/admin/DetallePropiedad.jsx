import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Cliente/DetallePr.css';
import Swal from 'sweetalert2';
import { 
  MapPin, User, AlertTriangle, Settings, CheckCircle, 
  X, LayoutDashboard, FileText, Send, Trash2, Clock, Briefcase, MessageSquare,
  CreditCard, Map, ExternalLink, Plus, MessageCircle, Eye  
} from 'lucide-react';

const DetallePropiedad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // --- ESTADOS ---
  const [isModalPerfilOpen, setIsModalPerfilOpen] = useState(false);
  const [isModalCotizarEmergenciaOpen, setIsModalCotizarEmergenciaOpen] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [emergenciaACotizar, setEmergenciaACotizar] = useState(null);
  const [isModalHistorialOpen, setIsModalHistorialOpen] = useState(false);
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState(null);
  
  // Modales de chat y detalle cotización
  const [isModalChatOpen, setIsModalChatOpen] = useState(false);
  const [chatCotizacion, setChatCotizacion] = useState(null);
  const [isModalCotizacionDetailOpen, setIsModalCotizacionDetailOpen] = useState(false);
  const [cotizacionDetail, setCotizacionDetail] = useState(null);

  // DATOS DE LA PROPIEDAD
  const [datosPropiedad, setDatosPropiedad] = useState({
    personaCargo: "Cargando...",
    curp: "...",
    direccion: "Cargando...",
    mapsUrl: "#" 
  });

  const [cotizaciones, setCotizaciones] = useState([]);
  const [sosPendientes, setSosPendientes] = useState([]);
  const [colaTrabajos, setColaTrabajos] = useState([]);
  const [stats, setStats] = useState({
    sos: 0, pendientes: 0, proceso: 0, listos: 0
  });

  // EFECTO DE CARGA
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('agente_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Dashboard data (Propiedad, Stats, Historial)
        const resDash = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/propiedades/${id}/dashboard`, { headers });
        const { propiedad, stats: backStats, historial } = resDash.data;

        setDatosPropiedad({
          personaCargo: propiedad.propietario || "Sin asignar",
          curp: propiedad.custom_curp || propiedad.id,
          direccion: propiedad.address || "Sin dirección",
          mapsUrl: propiedad.coordinates ? `https://maps.google.com/?q=${propiedad.coordinates}` : "#",
          nombre_propiedad: propiedad.nombre_propiedad,
          location: propiedad.location || "Mérida, Yuc."
        });

        setStats(backStats || { sos: 0, pendientes: 0, proceso: 0, listos: 0 });
        
        // Mapear historial
        const histMapeado = (historial || []).map(h => ({
          id: h.id,
          producto: h.title || h.labor || "Trabajo",
          tecnico: h.tecnico_nombre || "Técnico",
          fecha: new Date(h.updated_at || h.fecha).toLocaleDateString(),
          evidencias: h.fotos || []
        }));
        setHistorialFinalizados(histMapeado);

        // 2. Cotizaciones
        const resCot = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones?property_id=${id}`, { headers });
        const cots = resCot.data.filter(c => c.property_id == id || !c.property_id); // Fallback filter
        
        const cotsMapeadas = cots.map(c => ({
          id: c.id,
          fecha: c.fecha || new Date(c.created_at).toLocaleDateString(),
          status: c.estado || "Pendiente",
          producto: c.descripcion || c.folio,
          zona: c.zona || "General",
          comentario: c.observaciones || "",
          esEmergencia: c.is_emergency || false,
          items: c.items || []
        }));
        setCotizaciones(cotsMapeadas);

        // 3. SOS Pendientes (Filtrar de cotizaciones o endpoint específico)
        setSosPendientes(cotsMapeadas.filter(c => c.esEmergencia && c.status === "Pendiente"));

        // 4. Cola de trabajos (Podrían venir de otro lado, por ahora simulamos con cotizaciones aceptadas/asignadas)
        // O si hay un endpoint de /servicios/propiedad/${id}
        const resServ = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios?property_id=${id}`, { headers });
        const servs = resServ.data.filter(s => s.property_id == id);
        
        const colaMapeada = servs.map(s => ({
          id: s.id,
          producto: s.title || s.labor,
          tecnico: s.tecnico_nombre || "Por asignar",
          fecha: s.scheduled_date || "---",
          prioridad: s.priority || "ALTA",
          estado: s.status === "SOS" ? "SOS" : (s.status === "Pendiente" ? "PENDIENTE" : "ESPERANDO")
        }));
        setColaTrabajos(colaMapeada);

      } catch (error) {
        console.error("Error al cargar datos de la propiedad:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAllData();
  }, [id]);


  const [itemsCotizacion, setItemsCotizacion] = useState([
    { id: 1, concepto: "Mano de Obra Emergencia", cantidad: 1, precio: "" },
    { id: 2, concepto: "Materiales e Insumos", cantidad: 1, precio: "" }
  ]);

  const [formPlanificacion, setFormPlanificacion] = useState({ 
    tecnico: "", 
    fecha: "", 
    prioridad: "ALTA",
    descripcionTrabajo: ""
  });

  const obtenerFechaHoy = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  // --- FUNCIONES ---
  const abrirModalCotizar = (sos) => {
    setEmergenciaACotizar(sos);
    setIsModalCotizarEmergenciaOpen(true);
  };

  const calcularTotalCotizacion = () => {
    return itemsCotizacion.reduce((acc, item) => acc + (Number(item.precio || 0) * Number(item.cantidad || 0)), 0);
  };

  const agregarFila = () => {
    const nuevoItem = {
      id: Date.now(),
      concepto: "",
      cantidad: 1,
      precio: ""
    };
    setItemsCotizacion([...itemsCotizacion, nuevoItem]);
  };

  const enviarCotizacionFinal = (e) => {
    e.preventDefault();
    const itemsActuales = itemsCotizacion.map(item => ({...item}));
    const nuevaCot = {
      id: emergenciaACotizar.id,
      fecha: "Hoy",
      status: "ENVIADA", 
      producto: emergenciaACotizar.producto,
      comentario: "Esperando respuesta del cliente...",
      esEmergencia: true,
      items: itemsActuales
    };

    const nuevoTrabajoPendiente = {
        id: nuevaCot.id,
        producto: nuevaCot.producto,
        tecnico: "Por confirmar",
        fecha: "---",
        prioridad: "SOS",
        estado: "ESPERANDO" 
    };

    setCotizaciones([nuevaCot, ...cotizaciones]);
    setColaTrabajos([nuevoTrabajoPendiente, ...colaTrabajos]);
    setSosPendientes(sosPendientes.filter(s => s.id !== emergenciaACotizar.id));
    setIsModalCotizarEmergenciaOpen(false);
    Swal.fire({ icon: 'info', title: 'Presupuesto Enviado', text: 'Pendiente de aprobación.' });
  };

  const asignarTecnicoFinal = (e) => {
    e.preventDefault();
    const nuevoTrabajo = {
      id: Date.now(),
      producto: cotizacionSeleccionada.producto,
      tecnico: formPlanificacion.tecnico,
      fecha: formPlanificacion.fecha,
      prioridad: formPlanificacion.prioridad,
      comentario: cotizacionSeleccionada.comentario,
      descripcion: formPlanificacion.descripcionTrabajo,
      estado: cotizacionSeleccionada.esEmergencia ? "SOS" : "PENDIENTE"
    };

    setCotizaciones(cotizaciones.map(cot => 
      cot.id === cotizacionSeleccionada.id 
      ? { ...cot, status: "ASIGNADO" } 
      : cot
    ));

    setColaTrabajos([nuevoTrabajo, ...colaTrabajos]);
    setCotizacionSeleccionada(null);
    Swal.fire({ icon: 'success', title: 'Técnico Asignado', text: 'Estatus actualizado a ASIGNADO.', timer: 1500, showConfirmButton: false });
  };

  const [historialFinalizados, setHistorialFinalizados] = useState([]);


  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div className="spinner" style={{ border: '8px solid #f3f3f3', borderTop: '8px solid #ff6b00', borderRadius: '50%', width: '60px', height: '60px', animation: 'spin 2s linear infinite' }}></div>
        <p style={{ fontWeight: 'bold', color: '#555' }}>Cargando detalles de la propiedad...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* MAIN CONTENT – SIN SIDEBAR */}
      <main className="main-content" style={{ marginLeft: 0 }}>
        {/* HEADER SUPERIOR REDISEÑADO */}
        <header className="top-bar" style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '12px 30px', background: 'white', borderBottom: '1px solid #e2e8f0', 
          flexWrap: 'wrap' 
        }}>
          {/* Logo + Navegación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <div className="logo-brand" style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
              AGENTE <span className="logo-solutions" style={{ color: '#ff6b00' }}>SOLUTIONS</span>
            </div>
            <nav style={{ display: 'flex', gap: '15px' }}>
              <button className="nav-item active" style={{ 
                background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', 
                gap: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#ff6b00' 
              }}>
                <LayoutDashboard size={18}/> Dashboard
              </button>
              <button className="nav-item" onClick={() => setIsModalPerfilOpen(true)} style={{ 
                background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', 
                gap: '6px', cursor: 'pointer', color: '#333' 
              }}>
                <User size={18}/> Perfil Propiedad
              </button>
            </nav>
          </div>

          {/* Info de la propiedad y usuario */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="prop-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.2rem', margin: 0 }}>
                {datosPropiedad.nombre_propiedad || "Propiedad"} <span style={{ color: '#ff6b00' }}>#{id}</span>
              </h1>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px', color: '#555' }}>
                <MapPin size={14}/> {datosPropiedad.location || "Mérida, Yuc."}
              </p>
            </div>
            <div className="user-badge" onClick={() => setIsModalPerfilOpen(true)} style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' 
            }}>
              <div className="avatar" style={{ 
                background: '#ff6b00', color: 'white', borderRadius: '50%', 
                width: '36px', height: '36px', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', fontWeight: 'bold' 
              }}>
                {datosPropiedad.personaCargo.charAt(0).toUpperCase()}
              </div>
              <span>{datosPropiedad.personaCargo}</span>
            </div>
          </div>
        </header>


        {sosPendientes.length > 0 && (
          <div className="sos-alert-banner">
            <div className="sos-banner-content">
              <div className="icon-pulse"><AlertTriangle size={24} /></div>
              <div>
                <strong>NUEVA EMERGENCIA DETECTADA</strong>
                <p>{sosPendientes[0].producto}</p>
              </div>
            </div>
            <button className="btn-atender-ahora" onClick={() => abrirModalCotizar(sosPendientes[0])}>COTIZAR AHORA</button>
          </div>
        )}

        <div className="management-grid">
          {/* Historial de Servicios (TABLA PRINCIPAL) */}
          <section className="glass-card">
            <div className="card-header-ui"><CheckCircle size={20} className="icon-blue"/> <h2>Historial de Servicios</h2></div>
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Estatus</th>
                    <th>Comentario Cliente</th>
                    <th>Acción Principal</th>
                    <th style={{ textAlign: 'center' }}>Acciones rápidas</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.map(cot => (
                    <tr key={cot.id} className={cot.esEmergencia ? 'row-priority-sos' : ''}>
                      <td><b>{cot.producto}</b> {cot.esEmergencia && <span className="prio-tag">SOS</span>}</td>
                      <td><span className={`status-pill pill-${cot.status.toLowerCase()}`}>{cot.status}</span></td>
                      <td className="comment-cell">
                        <div className="flex-comment"><MessageSquare size={14} className="icon-gray"/><span>{cot.comentario || "Sin observaciones"}</span></div>
                      </td>
                      <td>
                        {cot.status === "ACEPTADA" ? (
                          <button className="btn-planificar" onClick={() => {
                            setCotizacionSeleccionada(cot);
                            setFormPlanificacion({ 
                              tecnico: "", 
                              fecha: cot.esEmergencia ? obtenerFechaHoy() : "", 
                              prioridad: cot.esEmergencia ? "SOS" : "ALTA",
                              descripcionTrabajo: ""
                            });
                          }}><Settings size={14}/> ASIGNAR</button>
                        ) : cot.status === "ASIGNADO" ? (
                           <span className="text-assigned"><CheckCircle size={14}/> EN TABLERO</span>
                        ) : (
                          <span className="text-closed">{cot.status === "ENVIADA" ? "ESPERANDO..." : "CERRADO"}</span>
                        )}
                      </td>
                      {/* NUEVOS BOTONES CON DISEÑO MEJORADO */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setChatCotizacion(cot);
                              setIsModalChatOpen(true);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              border: '1px solid #cbd5e1',
                              background: 'white',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: '#334155',
                              fontWeight: '500'
                            }}
                            title="Ver conversación con el cliente"
                          >
                            <MessageCircle size={15} /> Chat
                          </button>
                          <button
                            onClick={() => {
                              setCotizacionDetail(cot);
                              setIsModalCotizacionDetailOpen(true);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              border: '1px solid #cbd5e1',
                              background: 'white',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: '#334155',
                              fontWeight: '500'
                            }}
                            title="Ver detalle de la cotización"
                          >
                            <Eye size={15} /> Ver cotización
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Formulario Asignación */}
          <div className="form-container-ui">
            {cotizacionSeleccionada ? (
              <section className={`glass-card planning-section ${cotizacionSeleccionada.esEmergencia ? 'border-sos' : ''}`}>
                <div className="card-header-ui">
                  <Briefcase size={20} className={cotizacionSeleccionada.esEmergencia ? 'icon-red' : 'icon-orange'}/>
                  <h2>{cotizacionSeleccionada.esEmergencia ? "ASIGNAR SOS" : "Planificar"}</h2>
                  <button className="btn-close-form" onClick={() => setCotizacionSeleccionada(null)}><X size={16}/></button>
                </div>
                <form className="modern-form" onSubmit={asignarTecnicoFinal}>
                  <div className="input-group">
                    <label>Técnico Responsable</label>
                    <select required value={formPlanificacion.tecnico} onChange={(e) => setFormPlanificacion({...formPlanificacion, tecnico: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      <option value="Mario">Tec. Mario</option>
                      <option value="Jorge">Ing. Jorge</option>
                    </select>
                  </div>
                  <div className="input-row">
                    <div className="input-group">
                      <label>Fecha Inicio</label>
                      <input 
                        type="date" 
                        value={formPlanificacion.fecha} 
                        onChange={(e) => setFormPlanificacion({...formPlanificacion, fecha: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label>Prioridad</label>
                      <select value={formPlanificacion.prioridad} onChange={(e) => setFormPlanificacion({...formPlanificacion, prioridad: e.target.value})}>
                        <option value="SOS">SOS</option>
                        <option value="ALTA">ALTA</option>
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Descripción del trabajo (visible para el técnico)</label>
                    <textarea
                      rows="3"
                      placeholder="Describe detalladamente lo que debe hacer el técnico…"
                      value={formPlanificacion.descripcionTrabajo}
                      onChange={(e) => setFormPlanificacion({ ...formPlanificacion, descripcionTrabajo: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className={cotizacionSeleccionada.esEmergencia ? 'btn-sos-confirm' : 'btn-primary-ui'}>CONFIRMAR ASIGNACIÓN</button>
                </form>
              </section>
            ) : (
              <div className="empty-state-card">
                <Settings size={32} className="icon-ghost"/>
                <p>Selecciona una cotización aceptada para asignar técnico.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tablero Kanban */}
        <section className="kanban-section-full">
          <div className="section-title"><LayoutDashboard size={20}/> <h2>Tablero de Control de Servicios</h2></div>
          <div className="kanban-container-ui">
            {["ESPERANDO", "SOS", "PENDIENTE"].map((estado, idx) => (
              <div key={idx} className={`k-column ${estado === 'SOS' ? 'sos-line' : estado === 'ESPERANDO' ? 'orange-line' : 'yellow-line'}`}>
                <div className={`k-header ${estado === 'SOS' ? 'red-text' : estado === 'ESPERANDO' ? 'orange-text' : ''}`}>
                  {estado === 'SOS' ? 'SOS ACTIVO' : estado === 'ESPERANDO' ? 'POR AUTORIZAR' : 'POR HACER'} 
                  <span>{colaTrabajos.filter(t=>t.estado === estado).length}</span>
                </div>
                <div className="k-body">
                  {colaTrabajos.filter(t => t.estado === estado).map(t => (
                    <div key={t.id} className={`k-card ${estado === 'SOS' ? 'card-sos-active' : estado === 'ESPERANDO' ? 'card-waiting-client' : ''} animate-fade-in`}>
                      <h4>{t.producto}</h4>
                      {t.descripcion && (
                        <p style={{ fontSize: '0.85em', color: '#555', marginTop: '4px', lineHeight: 1.3 }}>
                          {t.descripcion.length > 60 
                            ? t.descripcion.substring(0, 60) + '…' 
                            : t.descripcion}
                        </p>
                      )}
                      <div className="k-footer">
                        <span className={estado === 'SOS' ? 'badge-sos' : estado === 'ESPERANDO' ? 'badge-status-waiting' : 'badge-prio alta'}>
                          {estado === 'PENDIENTE' ? t.tecnico : (estado === 'SOS' ? 'CRÍTICO' : 'ENVIADO')}
                        </span>
                        <span className={estado === 'SOS' ? 'date-text-red' : 'date-text'}><Clock size={12}/> {t.fecha}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="k-column blue-line"><div className="k-header">EN PROCESO <span>0</span></div><div className="k-body"></div></div>
            <div className="k-column green-line"><div className="k-header">FINALIZADO <span>0</span></div><div className="k-body"></div></div>
          </div>
        </section>

        {/* HISTORIAL DE TRABAJOS FINALIZADOS */}
        <section className="history-section-container">
          <div className="card-header-ui">
            <CheckCircle size={20} className="icon-blue"/>
            <h2>Historial de Trabajos Finalizados</h2>
          </div>
          <div className="history-grid-layout">
            {historialFinalizados.map((item) => (
              <div 
                key={item.id} 
                className="history-log-card clickable-card"
                onClick={() => {
                  setTrabajoSeleccionado(item);
                  setIsModalHistorialOpen(true);
                }}
              >
                <div className="log-status"><CheckCircle size={12}/> FINALIZADO</div>
                <div className="log-content">
                  <h4>{item.producto}</h4>
                  <div className="log-meta">
                    <span><User size={14}/> {item.tecnico}</span>
                    <span><Clock size={14}/> {item.fecha}</span>
                  </div>
                </div>
                <div className="photo-grid-report">
                  {item.evidencias.map((img, index) => (
                    <div key={index} className="photo-item">
                      <img src={img} alt="evidencia"/>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* MODAL DE COTIZACIÓN EMERGENCIA */}
      {isModalCotizarEmergenciaOpen && (
        <div className="modal-overlay-ui">
          <div className="modal-card-ui invoice-modal animate-fade-in">
            <div className="modal-header-sos">
              <div className="header-info">
                <div className="icon-circle-white"><FileText size={20} /></div>
                <div><h3>Presupuesto Emergencia</h3><span>ID: #{emergenciaACotizar?.id}</span></div>
              </div>
              <button className="btn-close-modal" onClick={() => setIsModalCotizarEmergenciaOpen(false)}><X size={20}/></button>
            </div>
            <form onSubmit={enviarCotizacionFinal} className="invoice-form">
              <div className="invoice-container">
                <div className="invoice-body-scrollable" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                  {itemsCotizacion.map((item, index) => (
                    <div key={item.id} className="invoice-row animate-fade-in">
                      <div className="col-desc"><input type="text" placeholder="Concepto" value={item.concepto} onChange={(e) => { const n = [...itemsCotizacion]; n[index].concepto = e.target.value; setItemsCotizacion(n); }} required /></div>
                      <div className="col-qty"><input type="number" value={item.cantidad} onChange={(e) => { const n = [...itemsCotizacion]; n[index].cantidad = e.target.value; setItemsCotizacion(n); }} /></div>
                      <div className="col-price"><input type="number" placeholder="0" value={item.precio} onChange={(e) => { const n = [...itemsCotizacion]; n[index].precio = e.target.value; setItemsCotizacion(n); }} required /></div>
                      <div className="col-total">${(Number(item.cantidad) * Number(item.precio)).toLocaleString()}</div>
                      <div className="col-actions">
                        {itemsCotizacion.length > 1 && (
                          <button type="button" className="btn-delete-row" onClick={() => setItemsCotizacion(itemsCotizacion.filter(i => i.id !== item.id))}><Trash2 size={16} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="add-row-container" style={{ margin: '15px 0' }}>
                    <button type="button" className="btn-add-item-orange" onClick={agregarFila} style={{ backgroundColor: '#ff6b00', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '25px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', width: 'fit-content' }}>
                      <Plus size={18} /> Agregar concepto
                    </button>
                  </div>
                </div>
                <div className="invoice-summary">
                  <div className="summary-row">
                    <span>Total</span>
                    <span className="grand-total">${calcularTotalCotizacion().toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="invoice-actions-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalCotizarEmergenciaOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-send-invoice"><Send size={18}/> ENVIAR COTIZACIÓN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Perfil */}
      {isModalPerfilOpen && (
        <div className="modal-overlay-ui" onClick={() => setIsModalPerfilOpen(false)}>
          <div className="modal-card-ui profile-modern animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="header-content">
                <div className="icon-badge-white"><User size={24} /></div>
                <div><h3>Perfil de Propiedad</h3><span>Datos Identificatorios</span></div>
              </div>
              <button className="btn-close-light" onClick={() => setIsModalPerfilOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body modern-body">
              <div className="info-grid">
                <div className="info-item-card"><div className="item-icon"><User size={18} /></div><div className="item-details"><label>Responsable</label><p>{datosPropiedad.personaCargo}</p></div></div>
                <div className="info-item-card"><div className="item-icon"><CreditCard size={18} /></div><div className="item-details"><label>CURP</label><p className="mono-text">{datosPropiedad.curp}</p></div></div>
                <div className="info-item-card full-width"><div className="item-icon"><MapPin size={18} /></div><div className="item-details"><label>Dirección Física</label><p>{datosPropiedad.direccion}</p></div></div>
              </div>
              <div className="modal-footer-actions">
                <a href={datosPropiedad.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-gps-premium"><Map size={18} /><span>Abrir Ubicación en Google Maps</span><ExternalLink size={14} className="icon-ext" /></a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE HISTORIAL */}
      {isModalHistorialOpen && trabajoSeleccionado && (
        <div className="modal-overlay-ui" onClick={() => setIsModalHistorialOpen(false)}>
          <div className="modal-card-ui report-modal animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="header-content">
                <div className="icon-badge-white"><CheckCircle size={22} /></div>
                <div><h3>Detalle del Trabajo</h3><span>{trabajoSeleccionado.producto}</span></div>
              </div>
              <button className="btn-close-light" onClick={() => setIsModalHistorialOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body modern-body">
              <div className="info-grid">
                <div className="info-item-card">
                  <div className="item-icon"><User size={18} /></div>
                  <div className="item-details"><label>Técnico</label><p>{trabajoSeleccionado.tecnico}</p></div>
                </div>
                <div className="info-item-card">
                  <div className="item-icon"><Clock size={18} /></div>
                  <div className="item-details"><label>Fecha</label><p>{trabajoSeleccionado.fecha}</p></div>
                </div>
                <div className="info-item-card full-width">
                  <div className="item-icon"><Briefcase size={18} /></div>
                  <div className="item-details"><label>Servicio</label><p>{trabajoSeleccionado.producto}</p></div>
                </div>
              </div>
              <div style={{ marginTop: "20px" }}>
                <h4 style={{ marginBottom: "10px" }}>Evidencias</h4>
                <div className="photo-grid-report">
                  {trabajoSeleccionado.evidencias.map((img, index) => (
                    <div key={index} className="photo-item"><img src={img} alt="evidencia" /></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHAT */}
      {isModalChatOpen && chatCotizacion && (
        <div className="modal-overlay-ui" onClick={() => setIsModalChatOpen(false)}>
          <div className="modal-card-ui report-modal animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header-premium">
              <div className="header-content">
                <div className="icon-badge-white"><MessageCircle size={22} /></div>
                <div>
                  <h3>Chat con Cliente</h3>
                  <span>Cotización #{chatCotizacion.id} – {chatCotizacion.producto}</span>
                </div>
              </div>
              <button className="btn-close-light" onClick={() => setIsModalChatOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body modern-body" style={{ maxHeight: '400px', overflowY: 'auto', padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85em', color: '#888', marginBottom: '8px' }}>Admin • 10:30 AM</div>
                <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: '16px', display: 'inline-block', maxWidth: '80%', marginBottom: '12px' }}>
                  Hola Alejandra, hemos preparado el presupuesto para la {chatCotizacion.producto.toLowerCase()}. ¿Tienes alguna duda?
                </div>
              </div>
              <div style={{ marginBottom: '16px', textAlign: 'right' }}>
                <div style={{ fontSize: '0.85em', color: '#888', marginBottom: '8px' }}>Cliente • 10:32 AM</div>
                <div style={{ background: '#e0f2fe', padding: '10px 14px', borderRadius: '16px', display: 'inline-block', maxWidth: '80%', marginBottom: '12px' }}>
                  Gracias, lo reviso. ¿Cuánto tiempo tomaría el trabajo?
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85em', color: '#888', marginBottom: '8px' }}>Admin • 10:33 AM</div>
                <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: '16px', display: 'inline-block', maxWidth: '80%', marginBottom: '12px' }}>
                  Aproximadamente 2-3 horas. Podemos agendar para mañana si confirmas hoy.
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85em', color: '#888', marginBottom: '8px' }}>Cliente • 10:35 AM</div>
                <div style={{ background: '#e0f2fe', padding: '10px 14px', borderRadius: '16px', display: 'inline-block', maxWidth: '80%' }}>
                  Perfecto, adelante. Autorizado.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE COTIZACIÓN */}
      {isModalCotizacionDetailOpen && cotizacionDetail && (
        <div className="modal-overlay-ui" onClick={() => setIsModalCotizacionDetailOpen(false)}>
          <div className="modal-card-ui invoice-modal animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="header-content">
                <div className="icon-badge-white"><FileText size={22} /></div>
                <div>
                  <h3>Detalle de Cotización #{cotizacionDetail.id}</h3>
                  <span>{cotizacionDetail.producto}</span>
                </div>
              </div>
              <button className="btn-close-light" onClick={() => setIsModalCotizacionDetailOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body modern-body" style={{ padding: '20px' }}>
              <div className="info-grid">
                <div className="info-item-card">
                  <div className="item-icon"><Briefcase size={18} /></div>
                  <div className="item-details"><label>Estado</label><p>{cotizacionDetail.status}</p></div>
                </div>
                <div className="info-item-card">
                  <div className="item-icon"><Clock size={18} /></div>
                  <div className="item-details"><label>Fecha</label><p>{cotizacionDetail.fecha}</p></div>
                </div>
                <div className="info-item-card full-width">
                  <div className="item-icon"><MessageSquare size={18} /></div>
                  <div className="item-details"><label>Comentario</label><p>{cotizacionDetail.comentario || "Sin comentarios"}</p></div>
                </div>
              </div>

              {cotizacionDetail.items && cotizacionDetail.items.length > 0 ? (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ marginBottom: '10px' }}>Conceptos</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Concepto</th>
                        <th style={{ textAlign: 'center', padding: '8px' }}>Cantidad</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Precio</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cotizacionDetail.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px' }}>{item.concepto}</td>
                          <td style={{ textAlign: 'center', padding: '8px' }}>{item.cantidad}</td>
                          <td style={{ textAlign: 'right', padding: '8px' }}>${Number(item.precio).toLocaleString()}</td>
                          <td style={{ textAlign: 'right', padding: '8px' }}>${(Number(item.cantidad) * Number(item.precio)).toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px' }}>Total</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px' }}>
                          ${cotizacionDetail.items.reduce((acc, item) => acc + (Number(item.cantidad) * Number(item.precio)), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ marginTop: '20px', color: '#888' }}>No se encontró desglose de conceptos para esta cotización.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetallePropiedad;