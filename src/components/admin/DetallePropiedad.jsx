import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Cliente/DetallePr.css';
import Swal from 'sweetalert2';
import { 
  MapPin, User, AlertTriangle, Settings, CheckCircle, 
  X, LayoutDashboard, FileText, Send, Trash2, Clock, Briefcase, MessageSquare,
  CreditCard, Map, ExternalLink, Plus, MessageCircle, Eye, Loader2, ImageIcon
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
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  // DATOS DE LA PROPIEDAD
  const [datosPropiedad, setDatosPropiedad] = useState({
    personaCargo: "Cargando...",
    curp: "...",
    direccion: "Cargando...",
    mapsUrl: "#",
    nombre_propiedad: "",
    location: ""
  });

  const [cotizaciones, setCotizaciones] = useState([]);
  const [sosPendientes, setSosPendientes] = useState([]);
  const [colaTrabajos, setColaTrabajos] = useState([]);
  const [stats, setStats] = useState({
    sos: 0, pendientes: 0, proceso: 0, listos: 0
  });

  const [listaTecnicos, setListaTecnicos] = useState([]);
  const [historialFinalizados, setHistorialFinalizados] = useState([]);
  const [reportesDetallados, setReportesDetallados] = useState([]);
  const [cargandoReportes, setCargandoReportes] = useState(false);

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

  // EFECTO DE CARGA
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('agente_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // 0. Cargar lista de técnicos reales
        let tecs = [];
        try {
          const resTecs = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/usuarios/tecnicos`, { headers });
          tecs = resTecs.data || [];
          setListaTecnicos(tecs);
        } catch (err) {
          console.warn("Error cargando técnicos:", err);
        }

        // 1. Dashboard data (Propiedad, Stats, Historial)
        let resDash;
        try {
          resDash = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/propiedades/${id}/dashboard`, { headers });
        } catch (err) {
          console.warn("Dashboard fail, falling back to base property data");
          resDash = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/propiedades/${id}`, { headers });
        }

        const { propiedad, stats: backStats, historial } = resDash.data;

        setDatosPropiedad({
          personaCargo: propiedad.propietario || "Sin asignar",
          curp: propiedad.custom_curp || propiedad.id,
          direccion: propiedad.address || "Sin dirección",
          mapsUrl: propiedad.coordinates ? `https://maps.google.com/?q=${propiedad.coordinates}` : "#",
          nombre_propiedad: propiedad.nombre_propiedad || propiedad.property_name || "Propiedad",
          location: propiedad.location || propiedad.state || "Mérida, Yuc."
        });

        setStats(backStats || { sos: 0, pendientes: 0, proceso: 0, listos: 0 });
        
        // Mapear historial inicial del dashboard
        const histMapeado = (historial || []).map(h => ({
          id: h.id,
          producto: h.title || h.labor || h.type || "Trabajo",
          tecnico: h.tecnico_nombre || "Técnico",
          fecha: h.updated_at ? new Date(h.updated_at).toLocaleDateString() : (h.fecha ? new Date(h.fecha).toLocaleDateString() : "---"),
          evidencias: h.fotos || []
        }));

        // 2. Cotizaciones
        let cots = [];
        try {
          const resCot = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`, { headers });
          cots = resCot.data.filter(c => String(c.property_id) === String(id));
        } catch (err) {
          console.warn("Error cargando cotizaciones:", err);
        }

        const cotsMapeadas = cots.map(c => {
          let itemsParsed = c.items || [];
          if (typeof c.concept === 'string' && c.concept.startsWith('[')) {
            try { itemsParsed = JSON.parse(c.concept); } catch(e){}
          }
          return {
            id: c.id,
            fecha: c.fecha || (c.created_at ? new Date(c.created_at).toLocaleDateString() : "---"),
            status: c.status || c.estado || "Pendiente",
            producto: c.concept && typeof c.concept === 'string' && !c.concept.startsWith('[') ? c.concept : (c.type || c.descripcion || c.folio || "Cotización"),
            zona: c.zona || "General",
            comentario: c.observations || c.observaciones || "",
            esEmergencia: c.is_emergency || c.type === 'SOS' || false,
            items: itemsParsed,
            raw: c
          };
        });
        setCotizaciones(cotsMapeadas);

        // 3. SOS Pendientes
        setSosPendientes(cotsMapeadas.filter(c => c.esEmergencia && (c.status === "Pendiente" || c.status === "Pendiente de Admin")));

        // 4. Cola de trabajos (servicios y work_orders)
        const mapEstado = (status, priority, type) => {
          const s = String(status || '').toUpperCase();
          const p = String(priority || '').toUpperCase();
          const t = String(type || '').toUpperCase();
          if (s === 'SOS' || p === 'URGENTE' || p === 'SOS' || t === 'SOS') {
            if (s !== 'COMPLETED' && s !== 'FINALIZADO' && s !== 'LISTO') {
              return 'SOS';
            }
          }
          if (s === 'POR ASIGNAR' || s === 'ESPERANDO' || s === 'POR AUTORIZAR' || s === 'PENDIENTE') return 'ESPERANDO';
          if (s === 'PROGRAMADO' || s === 'POR HACER' || s === 'ASIGNADO') return 'PENDIENTE';
          if (s === 'EN PROCESO' || s === 'PROCESO') return 'EN PROCESO';
          if (s === 'COMPLETED' || s === 'FINALIZADO' || s === 'LISTO') return 'FINALIZADO';
          return 'ESPERANDO';
        };

        let servs = [];
        try {
          const resServ = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios`, { headers });
          servs = resServ.data.filter(s => String(s.property_id) === String(id));
        } catch (err) {
          console.warn("Error cargando servicios:", err);
        }

        let wos = [];
        try {
          const resWo = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/work-orders/all`, { headers });
          wos = resWo.data.filter(w => String(w.property_id) === String(id));
        } catch (err) {
          console.warn("Error cargando work orders:", err);
        }

        const servsMapeados = servs.map(s => ({
          id: `serv-${s.id}`,
          realId: s.id,
          tipo_registro: 'servicio',
          producto: s.title || s.labor || s.description || "Servicio Mantenimiento",
          tecnico: s.tecnico_nombre || s.assigned_to || "Por asignar",
          fecha: s.fecha_programada ? new Date(s.fecha_programada).toLocaleDateString() : (s.scheduled_date || "---"),
          prioridad: s.prioridad || s.priority || "ALTA",
          descripcion: s.description || s.descripcion || "",
          estado: mapEstado(s.status, s.priority, s.service_type),
          evidencias: s.evidence_path ? [s.evidence_path] : []
        }));

        const wosMapeados = wos.map(w => ({
          id: `wo-${w.id}`,
          realId: w.id,
          tipo_registro: 'work_order',
          producto: (w.type || "Trabajo") + " - " + (w.zone || "General"),
          tecnico: w.tecnico ? `${w.tecnico.first_name} ${w.tecnico.last_name}` : "Por asignar",
          fecha: w.scheduled_at ? new Date(w.scheduled_at).toLocaleDateString() : (w.created_at ? new Date(w.created_at).toLocaleDateString() : "---"),
          prioridad: w.priority || "ALTA",
          descripcion: w.description || "",
          estado: mapEstado(w.status, w.priority, w.type),
          evidencias: [w.evidence_path, w.evidence_path_2].filter(Boolean)
        }));

        const allTrabajos = [...servsMapeados, ...wosMapeados];
        setColaTrabajos(allTrabajos);

        const finalizados = allTrabajos.filter(t => t.estado === 'FINALIZADO').map(t => ({
          id: t.realId,
          tipo_registro: t.tipo_registro,
          producto: t.producto,
          tecnico: t.tecnico,
          fecha: t.fecha,
          evidencias: t.evidencias || []
        }));

        setHistorialFinalizados(finalizados.length > 0 ? finalizados : histMapeado);

      } catch (error) {
        console.error("Error general al cargar datos de la propiedad:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAllData();
  }, [id]);

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

  const enviarCotizacionFinal = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('agente_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const itemsActuales = itemsCotizacion.map(item => ({...item}));
      const totalCalculado = calcularTotalCotizacion();

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${emergenciaACotizar.id}/update`, {
        type: 'manual',
        concept: JSON.stringify(itemsActuales),
        estimated_amount: totalCalculado,
        observations: "Presupuesto de emergencia generado por administración."
      }, { headers });

      const nuevaCot = {
        id: emergenciaACotizar.id,
        fecha: "Hoy",
        status: "ENVIADA", 
        producto: emergenciaACotizar.producto,
        comentario: "Esperando respuesta del cliente...",
        esEmergencia: true,
        items: itemsActuales,
        raw: emergenciaACotizar.raw
      };

      const nuevoTrabajoPendiente = {
          id: `cot-${nuevaCot.id}`,
          realId: nuevaCot.id,
          tipo_registro: 'cotizacion',
          producto: nuevaCot.producto,
          tecnico: "Por confirmar",
          fecha: "---",
          prioridad: "SOS",
          estado: "ESPERANDO" 
      };

      setCotizaciones(cotizaciones.map(c => c.id === emergenciaACotizar.id ? nuevaCot : c));
      setColaTrabajos([nuevoTrabajoPendiente, ...colaTrabajos]);
      setSosPendientes(sosPendientes.filter(s => s.id !== emergenciaACotizar.id));
      setIsModalCotizarEmergenciaOpen(false);
      Swal.fire({ icon: 'info', title: 'Presupuesto Enviado', text: 'Pendiente de aprobación por el cliente.' });
    } catch (error) {
      console.error("Error al enviar presupuesto:", error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al enviar el presupuesto.' });
    }
  };

  const asignarTecnicoFinal = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('agente_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const tecnicoSeleccionadoObj = listaTecnicos.find(t => String(t.id) === String(formPlanificacion.tecnico));
      const nombreTecnico = tecnicoSeleccionadoObj ? `${tecnicoSeleccionadoObj.first_name} ${tecnicoSeleccionadoObj.last_name}` : "Técnico Asignado";

      let realServiceId = null;

      if (cotizacionSeleccionada.raw?.service_id) {
        realServiceId = cotizacionSeleccionada.raw.service_id;
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/servicios/${realServiceId}/asignar-trabajo`, {
          tecnico_id: formPlanificacion.tecnico,
          scheduled_start: formPlanificacion.fecha,
          description: formPlanificacion.descripcionTrabajo
        }, { headers });
      } else if (cotizacionSeleccionada.raw?.work_order_id) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/${cotizacionSeleccionada.raw.work_order_id}/assign`, {
          tecnico_id: formPlanificacion.tecnico,
          scheduled_at: formPlanificacion.fecha,
          description: formPlanificacion.descripcionTrabajo
        }, { headers });
      } else {
        // Crear nuevo servicio si no existe
        const resNew = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/servicios`, {
          property_id: id,
          title: cotizacionSeleccionada.producto,
          description: formPlanificacion.descripcionTrabajo || cotizacionSeleccionada.comentario,
          technician_id: formPlanificacion.tecnico,
          scheduled_start: formPlanificacion.fecha,
          priority: formPlanificacion.prioridad === 'SOS' ? 'Urgente' : 'Media'
        }, { headers });
        realServiceId = resNew.data?.service?.id;
      }

      // Actualizar estatus de cotización a ASIGNADO
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacionSeleccionada.id}/status`, {
        status: 'ASIGNADO'
      }, { headers });

      const nuevoTrabajo = {
        id: realServiceId ? `serv-${realServiceId}` : `wo-${Date.now()}`,
        realId: realServiceId || Date.now(),
        tipo_registro: realServiceId ? 'servicio' : 'work_order',
        producto: cotizacionSeleccionada.producto,
        tecnico: nombreTecnico,
        fecha: formPlanificacion.fecha,
        prioridad: formPlanificacion.prioridad,
        comentario: cotizacionSeleccionada.comentario,
        descripcion: formPlanificacion.descripcionTrabajo,
        estado: formPlanificacion.prioridad === 'SOS' ? "SOS" : "PENDIENTE"
      };

      setCotizaciones(cotizaciones.map(cot => 
        cot.id === cotizacionSeleccionada.id 
        ? { ...cot, status: "ASIGNADO" } 
        : cot
      ));

      setColaTrabajos([nuevoTrabajo, ...colaTrabajos]);
      setCotizacionSeleccionada(null);
      Swal.fire({ icon: 'success', title: 'Técnico Asignado', text: 'Técnico asignado y estatus actualizado correctamente.', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error("Error al asignar técnico:", error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al asignar el técnico.' });
    }
  };

  const fetchDetalleTrabajo = async (item) => {
    setTrabajoSeleccionado(item);
    setIsModalHistorialOpen(true);
    setReportesDetallados([]);
    setCargandoReportes(true);

    try {
      const token = localStorage.getItem('agente_token');
      const prefix = item.tipo_registro === 'work_order' ? 'work_order-' : '';
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios/${prefix}${item.id}/reportes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setReportesDetallados(res.data || []);
    } catch (error) {
      console.error("Error al cargar la bitácora del trabajo:", error);
    } finally {
      setCargandoReportes(false);
    }
  };

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
        <header className="top-bar">

          {/* Logo + Navegación */}
          <div className="top-bar-left">

            <div className="logo-brand">
              AGENTE <span className="logo-solutions">SOLUTIONS</span>
            </div>

            <nav className="top-nav">

              <button className="nav-item active">
                <LayoutDashboard size={18}/> Dashboard
              </button>

              <button className="nav-item" onClick={() => setIsModalPerfilOpen(true)}>
                <User size={18}/> Perfil Propiedad
              </button>

            </nav>
          </div>

          {/* Info de la propiedad y usuario */}
          <div className="top-bar-right">
            <div className="prop-info">

              <h1 style={{ fontSize: '1.2rem', margin: 0 }}>
                {datosPropiedad.nombre_propiedad || "Propiedad"} <span style={{ color: '#ff6b00' }}>#{id}</span>
              </h1>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px', color: '#555' }}>
                <MapPin size={14}/> {datosPropiedad.location || "Mérida, Yuc."}
              </p>
            </div>
            <div className="user-badge" onClick={() => setIsModalPerfilOpen(true)}>
              <div className="avatar">
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
            <div className="card-header-ui"><CheckCircle size={20} className="icon-blue"/> <h2>Historial de Solicitudes y Cotizaciones</h2></div>
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Servicio / Concepto</th>
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
                        {cot.status === "ACEPTADA" || cot.status === "Aprobado" || cot.status === "Pendiente" ? (
                          <button className="btn-planificar" onClick={() => {
                            setCotizacionSeleccionada(cot);
                            setFormPlanificacion({ 
                              tecnico: "", 
                              fecha: cot.esEmergencia ? obtenerFechaHoy() : "", 
                              prioridad: cot.esEmergencia ? "SOS" : "ALTA",
                              descripcionTrabajo: ""
                            });
                          }}><Settings size={14}/> ASIGNAR</button>
                        ) : cot.status === "ASIGNADO" || cot.status === "Programado" ? (
                           <span className="text-assigned"><CheckCircle size={14}/> EN TABLERO</span>
                        ) : (
                          <span className="text-closed">{cot.status === "ENVIADA" ? "ESPERANDO..." : "CERRADO"}</span>
                        )}
                      </td>
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
                  <h2>{cotizacionSeleccionada.esEmergencia ? "ASIGNAR SOS" : "Planificar Trabajo"}</h2>
                  <button className="btn-close-form" onClick={() => setCotizacionSeleccionada(null)}><X size={16}/></button>
                </div>
                <form className="modern-form" onSubmit={asignarTecnicoFinal}>
                  <div className="input-group">
                    <label>Técnico Responsable</label>
                    <select required value={formPlanificacion.tecnico} onChange={(e) => setFormPlanificacion({...formPlanificacion, tecnico: e.target.value})}>
                      <option value="">Seleccionar técnico...</option>
                      {listaTecnicos.map(t => (
                        <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                      ))}
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
                        <option value="MEDIA">MEDIA</option>
                        <option value="BAJA">BAJA</option>
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
                <p>Selecciona una solicitud o cotización para asignar técnico.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tablero Kanban */}
        <section className="kanban-section-full">
          <div className="section-title"><LayoutDashboard size={20}/> <h2>Tablero de Control de Servicios</h2></div>
          <div className="kanban-container-ui">
            {["ESPERANDO", "SOS", "PENDIENTE", "EN PROCESO", "FINALIZADO"].map((estado, idx) => (
              <div key={idx} className={`k-column ${estado === 'SOS' ? 'sos-line' : estado === 'ESPERANDO' ? 'orange-line' : estado === 'PENDIENTE' ? 'yellow-line' : estado === 'EN PROCESO' ? 'blue-line' : 'green-line'}`}>
                <div className={`k-header ${estado === 'SOS' ? 'red-text' : estado === 'ESPERANDO' ? 'orange-text' : ''}`}>
                  {estado === 'SOS' ? 'SOS ACTIVO' : estado === 'ESPERANDO' ? 'POR AUTORIZAR' : estado === 'PENDIENTE' ? 'POR HACER' : estado} 
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
                          {t.tecnico || 'Sin Técnico'}
                        </span>
                        <span className={estado === 'SOS' ? 'date-text-red' : 'date-text'}><Clock size={12}/> {t.fecha}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
                onClick={() => fetchDetalleTrabajo(item)}
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
                  {item.evidencias && item.evidencias.map((img, index) => (
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

      {/* MODAL DETALLE HISTORIAL (BITÁCORA) */}
      {isModalHistorialOpen && trabajoSeleccionado && (
        <div className="modal-overlay-ui" onClick={() => setIsModalHistorialOpen(false)}>
          <div className="modal-card-ui report-modal animate-fade-in" onClick={e => e.stopPropagation()} style={{ width: '850px', maxWidth: '95vw' }}>
            <div className="modal-header-premium" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
              <div className="header-content">
                <div className="icon-badge-white"><Briefcase size={22} /></div>
                <div>
                  <h3 style={{ color: 'white' }}>Bitácora de Servicio</h3>
                  <span style={{ color: '#cbd5e1' }}>{trabajoSeleccionado.producto} • Finalizado el {trabajoSeleccionado.fecha}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {(JSON.parse(localStorage.getItem('agente_session') || '{}')?.userData?.role_id !== 3) && (
                  <button 
                    className="btn-primary-ui" 
                    onClick={() => navigate(`/reporte-detallado/${trabajoSeleccionado.id}`)}
                    style={{ background: '#3b82f6', boxShadow: '0 4px 0 #2563eb', padding: '8px 20px', fontSize: '12px' }}
                  >
                    <FileText size={16} /> GENERAR REPORTE OFICIAL
                  </button>
                )}
                <button className="btn-close-light" onClick={() => setIsModalHistorialOpen(false)}><X size={20}/></button>
              </div>
            </div>

            <div className="modal-body modern-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              
              <div className="info-grid" style={{ marginBottom: '30px' }}>
                <div className="info-item-card">
                  <div className="item-icon"><User size={18} /></div>
                  <div className="item-details"><label>Técnico Responsable</label><p>{trabajoSeleccionado.tecnico}</p></div>
                </div>
                <div className="info-item-card">
                  <div className="item-icon"><Clock size={18} /></div>
                  <div className="item-details"><label>ID de Servicio</label><p>#{trabajoSeleccionado.id}</p></div>
                </div>
                <div className="info-item-card">
                  <div className="item-icon"><MapPin size={18} /></div>
                  <div className="item-details"><label>Propiedad</label><p>{datosPropiedad.nombre_propiedad}</p></div>
                </div>
              </div>

              <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1e293b' }}>
                <ImageIcon size={20} /> PASOS REALIZADOS EN EL TRABAJO
              </h4>

              {cargandoReportes ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Loader2 className="animate-spin" size={40} color="#f26624" />
                  <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Cargando bitácora...</p>
                </div>
              ) : reportesDetallados.length > 0 ? (
                <div className="work-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {reportesDetallados.map((rep, idx) => (
                    <div key={rep.id} className="timeline-step" style={{ display: 'flex', gap: '20px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '15px', borderLeft: '5px solid #f26624' }}>
                      <div className="step-number" style={{ background: '#1e293b', color: 'white', minWidth: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                         <span style={{ margin: 'auto' }}>{idx + 1}</span>
                      </div>
                      <div className="step-content" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{rep.title || `Avance ${idx + 1}`}</h5>
                          <span style={{ fontSize: '12px', color: '#64748b' }}><Clock size={12}/> {new Date(rep.created_at).toLocaleString()}</span>
                        </div>
                        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.5, marginBottom: '15px' }}>{rep.description}</p>
                        
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {rep.image_path && (
                            <img 
                              src={rep.image_path} 
                              alt="evidencia" 
                              onClick={() => setImagenAmpliada(rep.image_path)}
                              style={{ width: '150px', height: '110px', objectFit: 'cover', borderRadius: '10px', cursor: 'pointer', border: '2px solid #e2e8f0' }} 
                            />
                          )}
                          {rep.galleries && rep.galleries.map((gal, gIdx) => (
                            <img 
                              key={gIdx}
                              src={gal.image_path} 
                              alt="extra" 
                              onClick={() => setImagenAmpliada(gal.image_path)}
                              style={{ width: '150px', height: '110px', objectFit: 'cover', borderRadius: '10px', cursor: 'pointer', border: '2px solid #e2e8f0' }} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', background: '#f1f5f9', borderRadius: '15px' }}>
                  <p style={{ margin: 0, color: '#64748b', fontStyle: 'italic' }}>El técnico no registró pasos detallados para este servicio.</p>
                </div>
              )}
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
                  Hola, hemos preparado el presupuesto para la {chatCotizacion.producto.toLowerCase()}. ¿Tienes alguna duda?
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

      {/* LIGHTBOX PARA IMAGEN AMPLIADA */}
      {imagenAmpliada && (
        <div 
          onClick={() => setImagenAmpliada(null)}
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, 
            display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' 
          }}
        >
          <img 
            src={imagenAmpliada} 
            alt="Zoom" 
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} 
          />
          <button 
             onClick={() => setImagenAmpliada(null)} 
             style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
             <X size={40} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DetallePropiedad;