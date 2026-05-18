import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Cliente/DetallePr.css';
import Swal from 'sweetalert2';
import { 
  MapPin, User, AlertTriangle, Settings, CheckCircle, 
  X, LayoutDashboard, FileText, Send, Trash2, Clock, Briefcase, MessageSquare,
  CreditCard, Map, ExternalLink, Plus, MessageCircle, Eye, Loader2, ImageIcon, ArrowLeft
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
  const [reportesPropiedad, setReportesPropiedad] = useState([]);

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

        // 5. Reportes de la propiedad (Work Reports en proceso/general)
        let reps = [];
        try {
          const resRep = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/reportes-globales`, { headers });
          const filtrados = resRep.data.filter(r => {
            const propId = r.service?.property_id || r.work_order?.property_id || r.workOrder?.property_id || r.property_id;
            return String(propId) === String(id);
          });

          // AGRUPAR POR TRABAJO (service_id o work_order_id)
          const agrupadora = {};
          filtrados.forEach(r => {
            const tipo = r.work_order_id || r.workOrder ? 'work_order' : 'servicio';
            const trabajoId = r.service_id || r.work_order_id || r.id;
            const key = `${tipo}-${trabajoId}`;

            if (!agrupadora[key]) {
              agrupadora[key] = { 
                ...r, 
                avances_count: 1, 
                todas_fotos: [r.image_url || r.image_path || r.foto || r.photo].filter(Boolean) 
              };
            } else {
              agrupadora[key].avances_count += 1;
              const img = r.image_url || r.image_path || r.foto || r.photo;
              if (img && !agrupadora[key].todas_fotos.includes(img)) {
                agrupadora[key].todas_fotos.push(img);
              }
            }
          });

          reps = Object.values(agrupadora);
        } catch (err) {
          console.warn("Error cargando reportes globales:", err);
        }
        setReportesPropiedad(reps);

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
            <button 
              onClick={() => navigate(-1)} 
              className="btn-back-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                marginRight: '15px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
            >
              <ArrowLeft size={16} /> Regresar
            </button>

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

        <div className="management-section-full" style={{ width: '100%', marginBottom: '30px' }}>
          {/* Historial de Servicios (TABLA PRINCIPAL COMPLETA) */}
          <section className="glass-card" style={{ width: '100%' }}>
            <div className="card-header-ui"><CheckCircle size={20} className="icon-blue"/> <h2>Historial de Solicitudes y Cotizaciones</h2></div>
            <div className="table-wrapper">
              <table className="modern-table" style={{ width: '100%' }}>
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

        {/* REPORTES REALIZADOS EN LA PROPIEDAD */}
        <section className="reports-section-container" style={{ marginTop: '40px', marginBottom: '40px' }}>
          <div className="card-header-ui" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <FileText size={20} className="icon-orange" style={{ color: '#f26624' }} />
            <h2 style={{ fontSize: '1.3rem', color: '#1e293b', margin: 0, fontWeight: 'bold' }}>Reportes realizados en la propiedad</h2>
          </div>

          {reportesPropiedad.length > 0 ? (
            <div className="reports-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '25px' 
            }}>
              {reportesPropiedad.map((rep) => {
                const techObj = rep.technician || {};
                const techName = techObj.first_name ? `${techObj.first_name} ${techObj.last_name}` : "Técnico";
                const techInitial = techObj.first_name ? techObj.first_name.charAt(0).toUpperCase() : "T";
                const imgUrl = rep.todas_fotos ? rep.todas_fotos[0] : (rep.image_url || rep.image_path || rep.foto || rep.photo || null);
                const trabajoId = rep.service_id || rep.work_order_id || rep.id;
                const fechaFormat = rep.created_at ? new Date(rep.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "---";

                return (
                  <div 
                    key={rep.id} 
                    className="report-card-modern"
                    onClick={() => {
                      const tipoRegistro = rep.work_order_id || rep.workOrder ? 'work_order' : 'servicio';
                      const realId = rep.service_id || rep.work_order_id || rep.id;
                      const producto = rep.service?.title || rep.workOrder?.type || rep.title || "Reporte de Trabajo";
                      const tecnico = rep.technician ? `${rep.technician.first_name} ${rep.technician.last_name}` : "Técnico";
                      const fecha = rep.service?.scheduled_start ? new Date(rep.service.scheduled_start).toLocaleDateString() : (rep.workOrder?.scheduled_at ? new Date(rep.workOrder.scheduled_at).toLocaleDateString() : (rep.created_at ? new Date(rep.created_at).toLocaleDateString() : "---"));
                      fetchDetalleTrabajo({
                        id: realId,
                        realId: realId,
                        tipo_registro: tipoRegistro,
                        producto: producto,
                        tecnico: tecnico,
                        fecha: fecha,
                        evidencias: rep.todas_fotos || [rep.image_url || rep.image_path || rep.foto || rep.photo].filter(Boolean)
                      });
                    }}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.06)'; }}
                  >
                    {imgUrl ? (
                      <div 
                        className="report-img-wrapper" 
                        style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden', backgroundColor: '#f8fafc' }}
                      >
                        <img 
                          src={imgUrl} 
                          alt="Reporte evidencia" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        />
                        <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#f26624', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          <CheckCircle size={12} /> {rep.avances_count || 1} Avance{rep.avances_count > 1 ? 's' : ''}
                        </div>
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)' }}>
                          <Briefcase size={12} /> Abrir Bitácora
                        </div>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '220px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <ImageIcon size={40} />
                      </div>
                    )}

                    <div className="report-card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {/* Técnico info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#f26624', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', border: '1px solid #e2e8f0' }}>
                          {techInitial}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: '#f26624', fontWeight: '700' }}>{techName}</h4>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Técnico de Campo</span>
                        </div>
                      </div>

                      {/* Meta info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.85rem' }}>
                          <FileText size={16} style={{ color: '#f26624' }} />
                          <span><b>Trabajo ID:</b> {trabajoId}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.85rem' }}>
                          <Clock size={16} style={{ color: '#f26624' }} />
                          <span><b>Subido:</b> {fechaFormat}</span>
                        </div>
                      </div>

                      {/* Botón Ver Bitácora */}
                      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8fafc', color: '#334155', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s ease' }}>
                        <Briefcase size={16} style={{ color: '#f26624' }} /> Ver Bitácora de Servicio
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-reports-card" style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <FileText size={48} style={{ color: '#cbd5e1', margin: '0 auto 15px auto' }} />
              <h3 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '1.2rem' }}>Sin reportes en proceso</h3>
              <p style={{ margin: 0, color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>Aún no se han registrado reportes de avance o de proceso para los trabajos activos en esta propiedad.</p>
            </div>
          )}
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
                          {(rep.image_url || rep.image_path) && (
                            <img 
                              src={rep.image_url || rep.image_path} 
                              alt="evidencia" 
                              onClick={() => setImagenAmpliada(rep.image_url || rep.image_path)}
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

      {/* MODAL PLANIFICAR TRABAJO / ASIGNAR TÉCNICO */}
      {cotizacionSeleccionada && (
        <div className="modal-overlay-ui" onClick={() => setCotizacionSeleccionada(null)}>
          <div className="modal-card-ui planning-modal animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', width: '90%', padding: '25px', borderRadius: '20px', background: 'white' }}>
            <div className="modal-header-premium" style={{ background: cotizacionSeleccionada.esEmergencia ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #f26624 0%, #ff8c52 100%)', padding: '20px', borderRadius: '15px 15px 0 0', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="icon-badge-white" style={{ background: 'white', color: cotizacionSeleccionada.esEmergencia ? '#ef4444' : '#f26624', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>{cotizacionSeleccionada.esEmergencia ? "ASIGNAR SOS" : "Planificar Trabajo"}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>{cotizacionSeleccionada.producto}</span>
                </div>
              </div>
              <button className="btn-close-light" onClick={() => setCotizacionSeleccionada(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20}/></button>
            </div>
            <form className="modern-form" onSubmit={asignarTecnicoFinal} style={{ padding: '20px 0 0 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label style={{ fontWeight: 'bold', color: '#334155', marginBottom: '8px', display: 'block' }}>Técnico Responsable</label>
                <select required value={formPlanificacion.tecnico} onChange={(e) => setFormPlanificacion({...formPlanificacion, tecnico: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}>
                  <option value="">Seleccionar técnico...</option>
                  {listaTecnicos.map(t => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="input-row" style={{ display: 'flex', gap: '15px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label style={{ fontWeight: 'bold', color: '#334155', marginBottom: '8px', display: 'block' }}>Fecha Inicio</label>
                  <input 
                    type="date" 
                    value={formPlanificacion.fecha} 
                    onChange={(e) => setFormPlanificacion({...formPlanificacion, fecha: e.target.value})} 
                    required 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label style={{ fontWeight: 'bold', color: '#334155', marginBottom: '8px', display: 'block' }}>Prioridad</label>
                  <select value={formPlanificacion.prioridad} onChange={(e) => setFormPlanificacion({...formPlanificacion, prioridad: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}>
                    <option value="SOS">SOS</option>
                    <option value="ALTA">ALTA</option>
                    <option value="MEDIA">MEDIA</option>
                    <option value="BAJA">BAJA</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label style={{ fontWeight: 'bold', color: '#334155', marginBottom: '8px', display: 'block' }}>Descripción del trabajo (visible para el técnico)</label>
                <textarea
                  rows="3"
                  placeholder="Describe detalladamente lo que debe hacer el técnico…"
                  value={formPlanificacion.descripcionTrabajo}
                  onChange={(e) => setFormPlanificacion({ ...formPlanificacion, descripcionTrabajo: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setCotizacionSeleccionada(null)} style={{ padding: '12px 24px', borderRadius: '25px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: '25px', border: 'none', background: cotizacionSeleccionada.esEmergencia ? '#ef4444' : '#f26624', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(242,102,36,0.3)' }}>CONFIRMAR ASIGNACIÓN</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetallePropiedad;