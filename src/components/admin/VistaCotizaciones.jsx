import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import "../../styles/Admin/VistaCotizaciones.css";
import Header from "../Shared/Header";
import AssignWorkModal from "./AssignWorkModal";
import { 
  Plus, Search, Filter, Calendar, 
  ArrowUpDown, FileText, Upload, 
  MoreVertical, Eye, CheckCircle, 
  XCircle, Clock, ChevronDown, ChevronLeft,
  User, Wrench, Truck, Layout, Home, Phone, MapPin
} from 'lucide-react';
import CreateQuotationModal from "./CreateQuotationModal";
import UniversalSearch from "../Shared/UniversalSearch";
import Pago from "../VistaCliente/Pago";
import mpLogo from "../../assets/Mercado-Pago.png";

const VistaCotizaciones = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [cotizacionParaAsignar, setCotizacionParaAsignar] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [filtro, setFiltro] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);

  const [esCliente, setEsCliente] = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);
  const [rechazando, setRechazando] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [imagenModal, setImagenModal] = useState(null);

  // --- NUEVOS ESTADOS ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ordenMonto, setOrdenMonto] = useState(null); // 'asc' | 'desc' | null
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'manual' | 'archivo'
  const [filtroOrigen, setFiltroOrigen] = useState('todos'); // 'todos' | 'admin' | 'tecnicos' | 'proveedores'
  const [cotizacionesFiltradas, setCotizacionesFiltradas] = useState([]);
  const [esTecnico, setEsTecnico] = useState(false);
  
  const [mensajeChat, setMensajeChat] = useState('');
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);

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

  useEffect(() => {
    if (cotizaciones && cotizaciones.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const quoteIdParam = searchParams.get('quote_id') || searchParams.get('quoteId');
      const paymentStatus = searchParams.get('payment_status');
      const collectionStatus = searchParams.get('collection_status') || searchParams.get('status');
      const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
      const stageParam = searchParams.get('stage') || 'full';

      if (paymentStatus) {
        if (paymentStatus === 'success' && quoteIdParam) {
          if (collectionStatus === 'rejected' || collectionStatus === 'cancelled') {
            alert('La transacción fue cancelada o rechazada. No se ha cobrado ningún monto.');
          } else {
            axios.post(`${import.meta.env.VITE_API_BASE_URL}/mercadopago/verify`, { 
              quote_id: quoteIdParam,
              payment_id: paymentId,
              stage: stageParam
            })
              .then(res => {
                if (res.data.status === 'success') {
                  cargarCotizaciones();
                  setFiltro('Pagadas');
                  alert('¡Tu pago fue validado y procesado con éxito a través de MercadoPago!');
                } else {
                  alert('El pago no se detectó o está en proceso de validación. Si lo completaste, se actualizará en breve.');
                }
              }).catch(err => {
                console.error(err);
              });
          }
        } else if (paymentStatus === 'failure') {
          alert('El pago no pudo ser procesado o fue cancelado.');
        } else if (paymentStatus === 'pending') {
          alert('Tu pago está en proceso. Te notificaremos en cuanto MercadoPago o el banco lo apruebe.');
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (quoteIdParam && !paymentStatus) {
        const found = cotizaciones.find(c => String(c.id) === String(quoteIdParam));
        if (found) {
          const statusLower = String(found.status || '').toLowerCase();
          if (statusLower.includes('rechazad')) {
            setFiltro('Rechazadas');
          } else if (statusLower.includes('pagad') || statusLower.includes('pago en revisión')) {
            setFiltro('Pagadas');
          } else if (statusLower.includes('aprobad') || statusLower === 'procesada por admin' || statusLower.includes('aceptad') || statusLower.includes('validado')) {
            setFiltro('Por Pagar');
          } else {
            setFiltro('Todas');
          }
          setCotizacionSeleccionada(found);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [cotizaciones]);

  const cargarCotizaciones = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('agente_session') || '{}');
      const userId = session?.userData?.id;
      const roleId = session?.userData?.role_id;

      const respuesta = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`);
      let data = respuesta.data;

      // FILTRO PARA TÉCNICOS: Solo ver sus propuestas al Admin
      if (roleId === 2) {
        data = data.filter(c => 
          (c.tecnico_user_id == userId || c.tecnico_id == userId || c.user_id == userId || c.tecnico === session?.userData?.name) 
          && c.created_by_role === 'Técnico'
        );
      }

      setCotizaciones(data);

      // Sincronizar cotizacionSeleccionada si está abierta
      setCotizacionSeleccionada(prev => {
        if (!prev) return null;
        const updated = data.find(c => c.id === prev.id);
        return updated || prev;
      });
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error);
    } finally {
      setCargando(false);
    }
  };

  const calcularMontoFinalNum = (cot) => {
    if (!cot || cot.type === 'archivo') return 0;
    let subtotalItems = 0;
    try {
      const rawConcept = cot.concept || cot.concepto;
      const detalle = typeof rawConcept === 'string' ? JSON.parse(rawConcept) : rawConcept;
      if (detalle && typeof detalle === 'object') {
        const listado = detalle.conceptos || detalle.servicios || [];
        listado.forEach(c => subtotalItems += (parseFloat(c.precio_u || c.precio || 0) * parseFloat(c.cantidad || 1)));
        if (detalle.materiales) {
          detalle.materiales.forEach(m => subtotalItems += (parseFloat(m.costo_u || m.precio || 0) * parseFloat(m.cantidad || 1)));
        }
      }
    } catch(e) {}
    let base = subtotalItems > 0 ? subtotalItems : parseFloat(cot.total || 0);
    if (esCliente && base > 0) {
      const iva = base * 0.16;
      const subConIva = base + iva;
      const comisionMP = (subConIva * 0.0349 + 4) * 1.16;
      return subConIva + comisionMP;
    }
    return base;
  };

  const filtradas = cotizaciones.filter(c => {
    const searchParams = new URLSearchParams(location.search);
    const filterPropId = searchParams.get('propertyId');
    const coincidePropiedad = !filterPropId || 
                              String(c.property_id) === String(filterPropId) || 
                              String(c.propiedad_id) === String(filterPropId) || 
                              String(c.propertyId) === String(filterPropId);

    const coincideFiltro = 
      filtro === 'Todas' ||
      (filtro === 'Por Pagar' && (
        c.status?.toLowerCase().includes('aprobad') || c.status === 'Procesada por Admin' || c.status?.toLowerCase() === 'aceptado' || c.status?.toLowerCase() === 'aceptada' || c.status === 'Validado' || (c.cash_requested && !c.cash_confirmed) || c.status?.toLowerCase().includes('efectivo solicitado')
      )) ||
      (filtro === 'Rechazadas' && c.status?.toLowerCase().includes('rechazad')) ||
      (filtro === 'Pagadas' && !c.status?.toLowerCase().includes('efectivo solicitado') && !(c.cash_requested && !c.cash_confirmed) && (c.status?.toLowerCase().includes('pago') || c.status?.toLowerCase().includes('pagad')));

    const coincideBusqueda = (c.cliente?.toLowerCase() || "").includes(busqueda?.toLowerCase() || "") || 
                             (c.folio?.toString() || "").includes(busqueda || "");

    const correspondeAlCliente = !esCliente || c.cliente_user_id === usuarioId;

    const coincideTipo = 
      filtroTipo === 'todos' || 
      (filtroTipo === 'manual' && c.type !== 'archivo') || 
      (filtroTipo === 'archivo' && c.type === 'archivo');

    return coincideFiltro && coincideBusqueda && correspondeAlCliente && coincideTipo && coincidePropiedad;
  }).sort((a, b) => {
    if (!ordenMonto) return 0;
    const valA = calcularMontoFinalNum(a);
    const valB = calcularMontoFinalNum(b);
    return ordenMonto === 'asc' ? valA - valB : valB - valA;
  });


  const verPantallaCompleta = (url) => {
    if (!url) return;
    if (url.toLowerCase().endsWith('.pdf')) {
      window.open(url, '_blank');
    } else {
      setImagenModal(url);
    }
  };

  const procesarCotizacion = async (nuevoEstado) => {
    try {
      setProcesando(true);
      const payload = { status: nuevoEstado };
      if (nuevoEstado === 'Rechazado') {
        payload.rejection_reason = motivoRechazo;
      }
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacionSeleccionada.id}/status`, payload);
      setCotizacionSeleccionada(null);
      setRechazando(false);
      setMotivoRechazo('');
      cargarCotizaciones();
    } catch (error) {
      console.error('Error actualizando cotización:', error);
    } finally {
      setProcesando(false);
    }
  };

  const handleValidarPago = async () => {
    try {
      setProcesando(true);
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacionSeleccionada.id}/validar-pago`);
      setCotizacionSeleccionada(prev => ({ ...prev, status: 'Pagado' }));
      cargarCotizaciones();
      alert("¡Pago validado y servicio programado!");
    } catch (error) {
      console.error('Error validando pago:', error);
      alert('Hubo un error al validar el pago.');
    } finally {
      setProcesando(false);
    }
  };

  const enviarMensajeChat = async () => {
    if (!mensajeChat.trim()) return;
    setEnviandoMensaje(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacionSeleccionada.id}/chat`, {
        message: mensajeChat
      });
      // Actualizamos el chat history localmente
      setCotizacionSeleccionada(prev => ({
        ...prev,
        chat_history: res.data.chat_history
      }));
      setMensajeChat('');
    } catch (e) {
      alert('Error al enviar el mensaje');
    } finally {
      setEnviandoMensaje(false);
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
        
        // ── Factor de precio para el Cliente ──────────────────────────────────
        // El Admin ingresa precios base (sin IVA ni comisión MP).
        // Para que al Cliente le cuadre la suma de ítems exactamente con el total visible
        // calculamos el factor en base a la misma fórmula fiscal del sistema:
        let priceFactor = 1;
        if (esCliente) {
          let subtotalBase = 0;
          (detalle.conceptos || detalle.servicios || []).forEach(c => {
            subtotalBase += parseFloat(c.precio_u || c.precio || 0) * parseFloat(c.cantidad || 1);
          });
          (detalle.materiales || []).forEach(m => {
            subtotalBase += parseFloat(m.costo_u || m.precio || 0) * parseFloat(m.cantidad || 1);
          });
          if (subtotalBase > 0) {
            const ivaCalc = subtotalBase * 0.16;
            const subtotalConIva = subtotalBase + ivaCalc;
            const comisionMP = (subtotalConIva * 0.0349 + 4) * 1.16;
            const totalConTodo = subtotalConIva + comisionMP;
            priceFactor = totalConTodo / subtotalBase;
          }
        }

        const fmtPrecio = (rawPrice) => {
          const precioAjustado = parseFloat(rawPrice || 0) * priceFactor;
          return `$${precioAjustado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };

        return (
          <div className="detalle-parseado">
            {/* Conceptos / Servicios */}
            {(detalle.conceptos || detalle.servicios) && (detalle.conceptos || detalle.servicios).some(c => c.descripcion || c.precio_u || c.precio) && (
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
                    {(detalle.conceptos || detalle.servicios).filter(c => c.descripcion || c.precio_u || c.precio).map((c, i) => (
                      <tr key={i}>
                        <td>{c.descripcion}</td>
                        <td style={{ textAlign: 'center' }}>{c.cantidad || 1}</td>
                        <td style={{ textAlign: 'center' }}>{fmtPrecio(c.precio_u || c.precio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Materiales */}
            {detalle.materiales && detalle.materiales.some(m => m.nombre || m.descripcion || m.costo_u || m.precio) && (
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
                    {detalle.materiales.filter(m => m.nombre || m.descripcion || m.costo_u || m.precio).map((m, i) => (
                      <tr key={i}>
                        <td>{m.nombre || m.descripcion}</td>
                        <td style={{ textAlign: 'center' }}>{m.cantidad || 1}</td>
                        <td style={{ textAlign: 'center' }}>{fmtPrecio(m.costo_u || m.precio)}</td>
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
              ${calcularMontoFinalNum(cotizacionSeleccionada).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        
        <div className="cotiz-header-actions" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'stretch', width: '100%' }}>
          
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                if (esTecnico) {
                  navigate('/trabajos-tecnico');
                  return;
                }
                const pId = new URLSearchParams(window.location.search).get('propertyId');
                if (pId) {
                  window.location.href = `/DetallePropiedad/${pId}`;
                } else {
                  window.location.href = '/propiedades';
                }
              }} 
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '8px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
            >
              <ChevronLeft size={18} />
              <span>REGRESAR</span>
            </button>

            {!esCliente && (
              <button className="btn-new-cotiz-v2" onClick={() => setShowCreateModal(true)}>
                <Plus size={18} />
                <span>NUEVA COTIZACIÓN</span>
              </button>
            )}
          </div>

          <div className="search-wrapper-full" style={{ width: '100%' }}>
            <UniversalSearch 
              data={(() => {
                const searchParams = new URLSearchParams(location.search);
                const filterPropId = searchParams.get('propertyId');
                if (!filterPropId) return cotizaciones;
                return cotizaciones.filter(c => String(c.property_id) === String(filterPropId) || String(c.propiedad_id) === String(filterPropId) || String(c.propertyId) === String(filterPropId));
              })()}
              setFilteredData={setCotizacionesFiltradas}
              placeholder="Buscar por folio, cliente, propiedad, técnico, dirección o teléfono..."
              filtroActual={filtro}
              type="COTIZACIONES"
            />
          </div>
        </div>

        <div className="cotiz-filters-row">
          <div className="cotiz-tabs-pills">
            <button className={`cotiz-pill ${filtro === 'Todas' ? 'active' : ''}`} onClick={() => setFiltro('Todas')}>
              <Clock size={16} /> TODAS
            </button>
            <button className={`cotiz-pill ${filtro === 'Por Pagar' ? 'active' : ''}`} onClick={() => setFiltro('Por Pagar')}>
              <Clock size={16} /> POR PAGAR
            </button>
            <button className={`cotiz-pill ${filtro === 'Rechazadas' ? 'active' : ''}`} onClick={() => setFiltro('Rechazadas')}>
              <XCircle size={16} /> RECHAZADAS
            </button>
            <button className={`cotiz-pill ${filtro === 'Pagadas' ? 'active' : ''}`} onClick={() => setFiltro('Pagadas')} style={{ background: filtro === 'Pagadas' ? '#e8f5e9' : 'transparent', color: filtro === 'Pagadas' ? '#1b8a5a' : '#64748b', borderColor: filtro === 'Pagadas' ? '#c8e6c9' : '#e2e8f0' }}>
              <CheckCircle size={16} /> PAGADAS
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
        <td className="bold-folio" data-label="FOLIO">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            <span>{c.folio}</span>
            {(() => {
              const statusLower = String(c.status || '').toLowerCase();
              if ((c.cash_requested && !c.cash_confirmed) || statusLower.includes('efectivo solicitado')) {
                return <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', border: '1px solid #f59e0b', fontSize: '0.65rem', fontWeight: 'bold' }}>💵 EFECTIVO PENDIENTE</span>;
              }
              if (c.cash_confirmed || statusLower.includes('pagado (efectivo)') || statusLower.includes('anticipo pagado')) {
                if (statusLower.includes('anticipo') || c.cash_amount_type === 'advance') {
                  return <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#047857', border: '1px solid #10b981', fontSize: '0.65rem', fontWeight: '800' }}>💵 ANTICIPO 60% (EFECTIVO)</span>;
                }
                return <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#047857', border: '1px solid #10b981', fontSize: '0.65rem', fontWeight: '800' }}>💵 PAGADA EN EFECTIVO</span>;
              }
              if (statusLower.includes('rechazad')) {
                return <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#fee2e2', color: '#ef4444', fontSize: '0.65rem', fontWeight: 'bold' }}>RECHAZADA</span>;
              }
              if (statusLower.includes('pagad') || statusLower.includes('pago en revisión')) {
                return <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#16a34a', fontSize: '0.65rem', fontWeight: 'bold' }}>PAGADA</span>;
              }
              if (statusLower.includes('aprobad') || statusLower === 'procesada por admin' || statusLower.includes('aceptad') || statusLower.includes('validado')) {
                return <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#fef3c7', color: '#d97706', fontSize: '0.65rem', fontWeight: 'bold' }}>POR PAGAR</span>;
              }
              return <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0284c7', fontSize: '0.65rem', fontWeight: 'bold' }}>PENDIENTE</span>;
            })()}
            {c.propiedad_nombre && c.propiedad_nombre !== 'N/A' && (
              <span style={{ fontSize: '0.78rem', color: '#f26624', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Home size={12} /> {c.propiedad_nombre}
              </span>
            )}
          </div>
        </td>
        <td className="cotiz-date" data-label="FECHA">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: '#666' }}>
            <Calendar size={14} />
            {c.created_at ? new Date(c.created_at).toLocaleDateString('es-MX') : c.fecha || '---'}
          </div>
        </td>
        {!esCliente && (
          <td className="cliente-name" data-label="CLIENTE">
            <div className="cliente-info-wrapper">
              <div style={{ fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                <span>{c.cliente}</span>
                {(c.cliente_telefono || c.telefono_cliente || c.telefono) && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: '#f26624', background: 'rgba(242,102,36,0.08)', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(242,102,36,0.15)', fontWeight: '600' }}>
                    <Phone size={10} /> {c.cliente_telefono || c.telefono_cliente || c.telefono}
                  </span>
                )}
              </div>
              {c.created_by_role === 'Técnico' ? (
                <div className="origin-tag-mini">
                  <Wrench size={10} /> TÉCNICO: {c.tecnico}
                </div>
              ) : (
                <div className="origin-tag-mini admin">
                  <User size={10} /> ADMINISTRATIVO
                </div>
              )}
            </div>
          </td>
        )}
        <td className="monto-final" data-label="TOTAL">
          {c.type === 'archivo' ? 'Ver Archivo' : `$${calcularMontoFinalNum(c).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                
                {cotizacionSeleccionada.created_by_role === 'Técnico' && !esCliente && (
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #f26624', marginBottom: '15px' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', fontWeight: '600' }}>
                      🛠️ Propuesta técnica enviada al Administrador
                    </p>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '20px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {cotizacionSeleccionada.foto_fachada && (
                    <div style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '8px', 
                      overflow: 'hidden', 
                      border: '1px solid #cbd5e1', 
                      flexShrink: 0 
                    }}>
                      <img 
                        src={cotizacionSeleccionada.foto_fachada} 
                        alt="Fachada de la propiedad" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <User size={16} color="#64748b" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.92rem', color: '#334155' }}>
                        <strong>Cliente / Dueño:</strong> {cotizacionSeleccionada.cliente}
                      </span>
                      {(cotizacionSeleccionada.cliente_telefono || cotizacionSeleccionada.telefono_cliente || cotizacionSeleccionada.telefono) && (
                        <span style={{ fontSize: '0.8rem', color: '#f26624', background: 'rgba(242,102,36,0.08)', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(242,102,36,0.15)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                          <Phone size={11} /> {cotizacionSeleccionada.cliente_telefono || cotizacionSeleccionada.telefono_cliente || cotizacionSeleccionada.telefono}
                        </span>
                      )}
                    </div>
                    {cotizacionSeleccionada.propiedad_nombre && cotizacionSeleccionada.propiedad_nombre !== 'N/A' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Home size={16} color="#64748b" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.92rem', color: '#334155' }}>
                          <strong>Propiedad:</strong> {cotizacionSeleccionada.propiedad_nombre}
                        </span>
                      </div>
                    )}
                    {cotizacionSeleccionada.propiedad_direccion && cotizacionSeleccionada.propiedad_direccion !== 'N/A' && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <MapPin size={16} color="#64748b" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.88rem', color: '#475569' }}>
                          <strong>Dirección:</strong> {cotizacionSeleccionada.propiedad_direccion}
                        </span>
                      </div>
                    )}
                    {cotizacionSeleccionada.tecnico && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Wrench size={16} color="#64748b" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.92rem', color: '#334155' }}>
                          <strong>Técnico Responsable:</strong> {cotizacionSeleccionada.tecnico}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#64748b', marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                      <span>📅 <strong>Fecha de Creación:</strong> {cotizacionSeleccionada.fecha}</span>
                    </div>
                  </div>
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
                          style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }} 
                          onClick={() => verPantallaCompleta(cotizacionSeleccionada.archivo_url)}
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

                {cotizacionSeleccionada.status === 'Rechazado' && !esCliente && (
                    <div style={{ marginTop: '20px', padding: '15px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #ef4444', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 10px 0', color: '#ef4444', fontWeight: 'bold' }}>❌ ESTA COTIZACIÓN HA SIDO RECHAZADA / CANCELADA</p>
                      <button 
                        onClick={() => navigate(`/tablero-servicios?jobId=${cotizacionSeleccionada.work_order_id || cotizacionSeleccionada.service_id}`)}
                        style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
                      >
                        <Layout size={18} /> IR AL TABLERO PARA CANCELAR TRABAJO
                      </button>
                    </div>
                  )}

                {(() => {
                  let subtotalItems = 0;
                  try {
                    const rawConcept = cotizacionSeleccionada.concept || cotizacionSeleccionada.concepto;
                    const detalle = typeof rawConcept === 'string' ? JSON.parse(rawConcept) : rawConcept;
                    if (detalle && typeof detalle === 'object') {
                      const listado = detalle.conceptos || detalle.servicios || [];
                      listado.forEach(c => subtotalItems += (parseFloat(c.precio_u || c.precio || 0) * parseFloat(c.cantidad || 1)));
                      if (detalle.materiales) {
                        detalle.materiales.forEach(m => subtotalItems += (parseFloat(m.costo_u || m.precio || 0) * parseFloat(m.cantidad || 1)));
                      }
                    }
                  } catch(e) {}
                  
                  const iva = subtotalItems * 0.16;
                  const subtotalConIva = subtotalItems + iva;
                  const comisionMP = (subtotalConIva * 0.0349 + 4) * 1.16;
                  const totalCalc = subtotalItems > 0 ? (subtotalConIva + comisionMP) : parseFloat(cotizacionSeleccionada.total || 0);

                  return (
                    <div className="modal-total-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '15px', background: '#f8fafc', borderTop: '2px solid #e2e8f0', marginTop: '20px' }}>
                      {subtotalItems > 0 ? (
                        <>
                          {!esCliente && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '300px', marginBottom: '8px', color: '#64748b' }}>
                              <span>Subtotal:</span>
                              <span style={{ fontWeight: 'bold' }}>${subtotalItems.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {!esCliente && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '300px', marginBottom: '8px', color: '#64748b' }}>
                              <span>IVA (16%):</span>
                              <span style={{ fontWeight: 'bold' }}>${iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {!esCliente && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '300px', marginBottom: '12px', color: '#009ee3', alignItems: 'center' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <img src={mpLogo} alt="MP" style={{ height: '14px', objectFit: 'contain' }} /> Comisión (T. Oficial):
                              </span>
                              <span style={{ fontWeight: 'bold' }}>${comisionMP.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          <h3 style={{ margin: 0, paddingTop: '10px', borderTop: '2px solid #cbd5e1', width: '100%', maxWidth: '300px', textAlign: 'right', fontSize: '1.4rem' }}>
                            TOTAL: ${totalCalc.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h3>
                        </>
                      ) : (
                        <h3 style={{ margin: 0, fontSize: '1.4rem' }}>TOTAL: ${totalCalc.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                      )}
                    </div>
                  );
                })()}

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
                
                {cotizacionSeleccionada.evidence_photo_path && (
                  <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', marginTop: '15px', borderLeft: '4px solid #3b82f6' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#1e40af' }}>📷 Evidencia Fotográfica:</h4>
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={cotizacionSeleccionada.evidence_photo_path} 
                        alt="Evidencia" 
                        style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', cursor: 'pointer', objectFit: 'contain' }} 
                        onClick={() => verPantallaCompleta(cotizacionSeleccionada.evidence_photo_path)}
                      />
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '5px 0 0 0' }}>Click para ampliar</p>
                    </div>
                  </div>
                )}

                {cotizacionSeleccionada.payment_receipt_path && (
                  <div style={{ padding: '15px', background: '#fffbeb', borderRadius: '8px', marginTop: '15px', borderLeft: '4px solid #fbbf24' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#b45309' }}>🧾 Comprobante de Pago ({cotizacionSeleccionada.payment_status || 'En Revisión'}):</h4>
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={cotizacionSeleccionada.payment_receipt_path} 
                        alt="Comprobante de Pago" 
                        style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', cursor: 'pointer', objectFit: 'contain' }} 
                        onClick={() => verPantallaCompleta(cotizacionSeleccionada.payment_receipt_path)}
                      />
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '5px 0 10px 0' }}>Click para ampliar</p>
                      
                      {!esCliente && (cotizacionSeleccionada.status === 'Pago en Revisión' || cotizacionSeleccionada.payment_status === 'Pago en Revisión') && (
                        <button 
                          onClick={handleValidarPago}
                          disabled={procesando}
                          style={{ 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                            color: 'white', border: 'none', padding: '12px 25px', borderRadius: '25px', 
                            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', 
                            margin: '10px auto 0', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' 
                          }}
                        >
                          <CheckCircle size={20} /> 
                          {procesando ? 'VALIDANDO...' : 'VALIDAR PAGO'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* --- SECCIÓN DE CHAT DE NEGOCIACIÓN --- */}
                <div style={{ padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '15px' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    💬 Conversación de la Cotización
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '15px', paddingRight: '5px' }}>
                    {cotizacionSeleccionada.chat_history && cotizacionSeleccionada.chat_history.length > 0 ? (
                      cotizacionSeleccionada.chat_history.map((msg, index) => {
                        const esMio = msg.sender_id === usuarioId;
                        const bgColor = esMio ? '#e0f2fe' : '#f1f5f9';
                        const align = esMio ? 'flex-end' : 'flex-start';
                        const textAlign = esMio ? 'right' : 'left';
                        const colorName = msg.sender_role === 'Cliente' ? '#0ea5e9' : (msg.sender_role === 'Admin' ? '#16a34a' : '#f59e0b');

                        return (
                          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: align, width: '100%' }}>
                            <span style={{ fontSize: '0.7rem', color: colorName, fontWeight: 'bold', marginBottom: '2px' }}>
                              {msg.sender_name} ({msg.sender_role})
                            </span>
                            <div style={{ background: bgColor, padding: '10px 14px', borderRadius: '12px', maxWidth: '85%', color: '#334155', fontSize: '0.9rem', textAlign: textAlign, borderBottomRightRadius: esMio ? '2px' : '12px', borderBottomLeftRadius: !esMio ? '2px' : '12px' }}>
                              {msg.message}
                            </div>
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>
                              {new Date(msg.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: '20px 0' }}>No hay mensajes en esta cotización.</p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Escribe un mensaje para negociar o aclarar dudas..." 
                      style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
                      value={mensajeChat}
                      onChange={e => setMensajeChat(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') enviarMensajeChat(); }}
                      disabled={enviandoMensaje}
                    />
                    <button 
                      style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', opacity: enviandoMensaje || !mensajeChat.trim() ? 0.5 : 1 }}
                      onClick={enviarMensajeChat}
                      disabled={enviandoMensaje || !mensajeChat.trim()}
                    >
                      {enviandoMensaje ? '...' : 'ENVIAR'}
                    </button>
                  </div>
                </div>

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

                  {/* Banner Pagado por MercadoPago */}
                  {cotizacionSeleccionada.status === 'Pagado' && !cotizacionSeleccionada.cash_confirmed && (() => {
                    const pd = cotizacionSeleccionada.mp_payment_data;
                    const formatDate = (dateStr) => {
                      if (!dateStr) return '—';
                      try {
                        return new Date(dateStr).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
                      } catch { return dateStr; }
                    };
                    return (
                      <div style={{ width: '100%', marginBottom: '20px', marginTop: '15px', border: '2px solid #4caf50', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ background: 'linear-gradient(135deg, #1b8a5a, #2e7d32)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                            <CheckCircle size={22} />
                            <span>✅ Cotización Pagada</span>
                          </div>
                          <img src={mpLogo} alt="MercadoPago" style={{ height: '28px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                        </div>
                        <div style={{ background: '#f0faf4', padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.85rem', color: '#333' }}>
                          {pd?.mp_payment_id && (
                            <div>
                              <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '2px' }}>🔖 N° de Operación</div>
                              <div style={{ fontWeight: 'bold', color: '#1b8a5a', fontFamily: 'monospace' }}>#{pd.mp_payment_id}</div>
                            </div>
                          )}
                          {pd?.amount && (
                            <div>
                              <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '2px' }}>💰 Monto Pagado</div>
                              <div style={{ fontWeight: 'bold', color: '#1b8a5a' }}>${Number(pd.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {pd.currency || 'MXN'}</div>
                            </div>
                          )}
                          {pd?.payment_type && (
                            <div>
                              <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '2px' }}>💳 Método</div>
                              <div style={{ fontWeight: '600', color: '#333' }}>{pd.payment_type}{pd.payment_method ? ` (${pd.payment_method})` : ''}{pd.last_four_digits ? ` **** ${pd.last_four_digits}` : ''}</div>
                            </div>
                          )}
                          {pd?.payer_email && (
                            <div>
                              <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '2px' }}>📧 Correo</div>
                              <div style={{ fontWeight: '600', wordBreak: 'break-all', color: '#333' }}>{pd.payer_email}</div>
                            </div>
                          )}
                          {pd?.date_approved && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '2px' }}>📅 Fecha y Hora de Pago</div>
                              <div style={{ fontWeight: '600', color: '#333' }}>{formatDate(pd.date_approved)}</div>
                            </div>
                          )}
                          {!pd && (
                            <div style={{ gridColumn: '1 / -1', color: '#555', textAlign: 'center', padding: '8px 0' }}>
                              ✅ Pago confirmado por MercadoPago
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Banner: Comprobante de Pago en Efectivo Confirmado */}
                  {(cotizacionSeleccionada.cash_confirmed || String(cotizacionSeleccionada.status || '').toLowerCase().includes('efectivo') || String(cotizacionSeleccionada.status || '').toLowerCase().includes('anticipo pagado')) && (() => {
                    const formatDate = (dateStr) => {
                      if (!dateStr) return '—';
                      try {
                        return new Date(dateStr).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
                      } catch { return dateStr; }
                    };
                    const statusStr = String(cotizacionSeleccionada.status || '').toLowerCase();
                    const esAnticipo = cotizacionSeleccionada.cash_amount_type === 'advance' || statusStr.includes('anticipo');
                    const labelTipo = esAnticipo ? 'Anticipo del 60% Pagado en Efectivo' : 'Cotización Pagada al 100% en Efectivo';
                    const monto = esAnticipo
                      ? (parseFloat(cotizacionSeleccionada.advance_amount) || (calcularMontoFinalNum(cotizacionSeleccionada) * 0.60))
                      : calcularMontoFinalNum(cotizacionSeleccionada);
                    const autorizador = esCliente ? 'Jorge Ernesto Vallarta (Jefe General)' : (cotizacionSeleccionada.cash_confirmed_by_name || 'Administración');
                    const fechaConfirmacion = cotizacionSeleccionada.cash_confirmed_at || cotizacionSeleccionada.advance_paid_at || cotizacionSeleccionada.remaining_paid_at || cotizacionSeleccionada.updated_at;

                    return (
                      <div style={{ width: '100%', marginBottom: '20px', marginTop: '15px', border: '2px solid #059669', borderRadius: '14px', overflow: 'hidden' }}>
                        <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontWeight: '800', fontSize: '1.05rem' }}>
                            <CheckCircle size={24} />
                            <span>💵 {labelTipo}</span>
                          </div>
                          <span style={{ background: '#ecfdf5', color: '#047857', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>PAGO EN EFECTIVO</span>
                        </div>
                        <div style={{ background: '#f0faf4', padding: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', fontSize: '0.88rem', color: '#333' }}>
                          <div>
                            <div style={{ color: '#047857', fontSize: '0.78rem', fontWeight: '700', marginBottom: '2px' }}>💰 MONTO RECIBIDO EN EFECTIVO</div>
                            <div style={{ fontWeight: '800', color: '#065f46', fontSize: '1.25rem' }}>${monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</div>
                          </div>
                          <div>
                            <div style={{ color: '#047857', fontSize: '0.78rem', fontWeight: '700', marginBottom: '2px' }}>👤 AUTORIZADO Y RECIBIDO POR</div>
                            <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '1.05rem' }}>{autorizador}</div>
                          </div>
                          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #d1fae5', paddingTop: '10px' }}>
                            <div style={{ color: '#047857', fontSize: '0.78rem', fontWeight: '700', marginBottom: '2px' }}>📅 FECHA Y HORA DE REGISTRO / AUTORIZACIÓN</div>
                            <div style={{ fontWeight: '700', color: '#334155' }}>{formatDate(fechaConfirmacion)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sección: Saldo Pendiente del 40% */}
                  {((cotizacionSeleccionada.advance_paid || String(cotizacionSeleccionada.status || '').toLowerCase().includes('anticipo') || cotizacionSeleccionada.cash_amount_type === 'advance') && !cotizacionSeleccionada.remaining_paid && !(cotizacionSeleccionada.cash_requested && !cotizacionSeleccionada.cash_confirmed && cotizacionSeleccionada.cash_amount_type === 'remaining')) && (() => {
                    const montoRestante = parseFloat(cotizacionSeleccionada.remaining_amount) || (calcularMontoFinalNum(cotizacionSeleccionada) * 0.40);
                    return (
                      <div style={{ width: '100%', marginBottom: '20px', border: '2px solid #ea580c', borderRadius: '14px', overflow: 'hidden' }}>
                        <div style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '1rem' }}>
                            <span>⏳ SALDO RESTANTE DEL 40% PENDIENTE</span>
                          </div>
                          <span style={{ background: '#fff7ed', color: '#c2410c', padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800' }}>AL FINALIZAR</span>
                        </div>
                        <div style={{ background: '#fffbeb', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                          <div>
                            <div style={{ color: '#9a3412', fontSize: '0.82rem', fontWeight: '700' }}>MONTO A LIQUIDAR AL CONCLUIR EL TRABAJO:</div>
                            <div style={{ color: '#c2410c', fontSize: '1.3rem', fontWeight: '800' }}>${montoRestante.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</div>
                          </div>
                          {esCliente ? (
                            <button
                              onClick={() => setShowPagoModal(true)}
                              style={{ background: '#ea580c', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 10px rgba(234, 88, 12, 0.3)' }}
                            >
                              💳 Liquidar Saldo (40%)
                            </button>
                          ) : !esTecnico ? (
                            <button
                              onClick={async () => {
                                if (!window.confirm(`¿Confirmas que ya recibiste el pago en efectivo del saldo restante por $${montoRestante.toFixed(2)} MXN?`)) return;
                                try {
                                  setProcesando(true);
                                  await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacionSeleccionada.id}/confirmar-efectivo-restante`);
                                  cargarCotizaciones();
                                  setCotizacionSeleccionada(null);
                                  alert('¡Cobro del 40% en efectivo confirmado exitosamente!');
                                } catch (e) {
                                  alert('Error al confirmar el cobro en efectivo.');
                                } finally {
                                  setProcesando(false);
                                }
                              }}
                              disabled={procesando}
                              style={{ background: '#16a34a', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '0.95rem' }}
                            >
                              ✅ Confirmar Cobro 40% en Efectivo
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Banner: Pago en Efectivo Solicitado — Visible para Admin y Cliente */}
                  {((cotizacionSeleccionada.cash_requested && !cotizacionSeleccionada.cash_confirmed) || String(cotizacionSeleccionada.status || '').toLowerCase().includes('efectivo solicitado')) && (() => {
                    const amountLabel = cotizacionSeleccionada.cash_amount_type === 'advance' ? 'Anticipo (60%)' : cotizacionSeleccionada.cash_amount_type === 'remaining' ? 'Saldo Restante (40%)' : 'Total (100%)';
                    const timingLabel = cotizacionSeleccionada.cash_timing === 'immediate' ? 'de forma INMEDIATA' : 'AL FINALIZAR EL TRABAJO';
                    
                    const calcularMontoEfectivoBanner = (cot) => {
                      if (!cot) return 0;
                      let subtotalItems = 0;
                      try {
                        const rawConcept = cot.concept || cot.concepto;
                        const detalle = typeof rawConcept === 'string' ? JSON.parse(rawConcept) : rawConcept;
                        if (detalle && typeof detalle === 'object') {
                          const listado = detalle.conceptos || detalle.servicios || [];
                          listado.forEach(c => subtotalItems += (parseFloat(c.precio_u || c.precio || 0) * parseFloat(c.cantidad || 1)));
                          if (detalle.materiales) {
                            detalle.materiales.forEach(m => subtotalItems += (parseFloat(m.costo_u || m.precio || 0) * parseFloat(m.cantidad || 1)));
                          }
                        }
                      } catch(e) {}
                      let base = subtotalItems > 0 ? subtotalItems : parseFloat(cot.total || cot.estimated_amount || 0);
                      if (base > 0) return base * 1.16;
                      return 0;
                    };

                    const monto = cotizacionSeleccionada.cash_amount_type === 'advance'
                      ? (parseFloat(cotizacionSeleccionada.advance_amount) || (calcularMontoEfectivoBanner(cotizacionSeleccionada) * 0.60))
                      : cotizacionSeleccionada.cash_amount_type === 'remaining'
                      ? (parseFloat(cotizacionSeleccionada.remaining_amount) || (calcularMontoEfectivoBanner(cotizacionSeleccionada) * 0.40))
                      : calcularMontoEfectivoBanner(cotizacionSeleccionada);

                    if (!esCliente && !esTecnico) {
                      return (
                        <div style={{ width: '100%', marginBottom: '20px', marginTop: '15px', border: '2px solid #f59e0b', borderRadius: '12px', overflow: 'hidden' }}>
                          <div style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.4rem' }}>💵</span>
                            <div style={{ color: 'white' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>Solicitud de Pago en Efectivo</div>
                              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>El cliente desea pagar el {amountLabel} {timingLabel}</div>
                            </div>
                          </div>
                          <div style={{ background: '#fffbeb', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <div style={{ fontSize: '0.8rem', color: '#78350f', marginBottom: '2px' }}>Monto en efectivo a recibir:</div>
                              <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: '#92400e' }}>${monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>
                            <button
                              onClick={async () => {
                                if (!window.confirm('¿Confirmas que ya recibiste el pago en efectivo del cliente?')) return;
                                try {
                                  setProcesando(true);
                                  await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacionSeleccionada.id}/confirmar-efectivo`);
                                  cargarCotizaciones();
                                  setCotizacionSeleccionada(null);
                                  alert('¡Pago en efectivo confirmado exitosamente!');
                                } catch (e) {
                                  alert('Error al confirmar el pago en efectivo.');
                                } finally {
                                  setProcesando(false);
                                }
                              }}
                              disabled={procesando}
                              style={{ background: '#16a34a', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
                            >
                              ✅ Confirmar Recepción de Efectivo
                            </button>
                          </div>
                        </div>
                      );
                    } else if (esCliente) {
                      return (
                        <div style={{ width: '100%', marginBottom: '20px', marginTop: '15px', border: '2px solid #10b981', borderRadius: '12px', overflow: 'hidden' }}>
                          <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
                            <span style={{ fontSize: '1.5rem' }}>💵</span>
                            <div>
                              <div style={{ fontWeight: '800', fontSize: '1.05rem' }}>Solicitud de Pago en Efectivo Registrada</div>
                              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Acordaste pagar el {amountLabel} {timingLabel}</div>
                            </div>
                          </div>
                          <div style={{ background: '#ecfdf5', padding: '16px 18px', color: '#065f46', fontSize: '0.9rem', lineHeight: '1.5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              Monto a entregar presencialmente: <strong style={{ fontSize: '1.1rem', color: '#047857' }}>${monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                              <div style={{ fontSize: '0.82rem', marginTop: '4px', color: '#065f46' }}>Tu pago está pendiente de validación por el administrador una vez entregado.</div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

            </div>
            <div className="modal-footer-btns" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* ROW 1: Botones Naranjas Arriba */}
                  <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
                    {!esCliente && !esTecnico && cotizacionSeleccionada.created_by_role === 'Técnico' && (
                      <button 
                        className="btn-modal-print" 
                        style={{ background: '#F26522', color: 'white', fontWeight: 'bold', flex: 1, textAlign: 'center', minWidth: '200px' }} 
                        onClick={() => {
                          setCotizacionParaAsignar(cotizacionSeleccionada);
                          setCotizacionSeleccionada(null);
                          setShowCreateModal(true);
                        }}
                      >
                        🛠️ GENERAR COTIZACIÓN A CLIENTE
                      </button>
                    )}

                    {(() => {
                      if (esCliente || esTecnico) return null;
                      const cotHija = cotizaciones.find(c => String(c.parent_id) === String(cotizacionSeleccionada.id));
                      if (cotHija) {
                        return (
                          <button 
                            className="btn-modal-print" 
                            style={{ background: '#3b82f6', color: 'white', fontWeight: 'bold', flex: 1, textAlign: 'center', minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                            onClick={() => {
                              setCotizacionSeleccionada(cotHija);
                            }}
                          >
                            👁️ VER COTIZACIÓN NUEVA O ACTUALIZADA
                          </button>
                        );
                      } else {
                        return (
                          <button 
                            className="btn-modal-print" 
                            style={{ background: '#3b82f6', color: 'white', fontWeight: 'bold', flex: 1, textAlign: 'center', minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                            onClick={() => {
                              setCotizacionParaAsignar({ ...cotizacionSeleccionada, isDerived: true });
                              setCotizacionSeleccionada(null);
                              setShowCreateModal(true);
                            }}
                          >
                            ➕ GENERAR COTIZACIÓN DERIVADA
                          </button>
                        );
                      }
                    })()}

                    {cotizacionSeleccionada.type !== 'archivo' && (
                      <button className="btn-modal-print" style={{ background: '#F26522', color: 'white', border: 'none', flex: 1, textAlign: 'center', fontWeight: 'bold', minWidth: '150px' }} onClick={handleImprimirPDF}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        VER PDF
                      </button>
                    )}
                    </div>


                  {/* ROW: Validación de Pago (Solo Admin) */}
                  {!esCliente && !esTecnico && cotizacionSeleccionada.status === 'Pago en Revisión' && (
                    <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap', marginTop: '10px' }}>
                      {cotizacionSeleccionada.payment_receipt_path && (
                        <button 
                          className="btn-modal-print" 
                          style={{ background: '#334155', color: 'white', flex: 1, textAlign: 'center', minWidth: '150px' }} 
                          onClick={() => verPantallaCompleta(cotizacionSeleccionada.payment_receipt_path)}
                        >
                          👁️ VER COMPROBANTE
                        </button>
                      )}
                      <button 
                        className="btn-modal-print" 
                        style={{ background: '#1b8a5a', color: 'white', flex: 1, textAlign: 'center', minWidth: '150px', fontWeight: 'bold' }} 
                        onClick={handleValidarPago}
                        disabled={procesando}
                      >
                        ✅ VALIDAR PAGO
                      </button>
                    </div>
                  )}

                  {/* END ROW 1 */}

                  {/* Si está aprobada/aceptada, mostrar botón de pagar gigante */}
                  {esCliente && (cotizacionSeleccionada.status === 'Aprobado' || cotizacionSeleccionada.status === 'Aceptada') && (
                    <button 
                      className="btn-modal-print" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#009ee3', color: 'white', width: '100%', textAlign: 'center', fontWeight: 'bold', padding: '15px', fontSize: '1.1rem', marginBottom: '10px' }} 
                      onClick={() => setShowPagoModal(true)}
                    >
                      PAGAR CON <img src={mpLogo} alt="MercadoPago" style={{ height: '24px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                    </button>
                  )}

                  {/* Si está pendiente, mostrar Aceptar/Rechazar */}
                  {(esCliente || (!esCliente && !esTecnico && cotizacionSeleccionada.created_by_role === 'Técnico')) && 
                    (cotizacionSeleccionada.status === 'Pendiente' || cotizacionSeleccionada.status === 'En proceso' || cotizacionSeleccionada.status?.includes('Admin') || cotizacionSeleccionada.status === 'Rechazado') && 
                    !rechazando && (
                    <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
                      {cotizacionSeleccionada.status !== 'Rechazado' && (
                        <button 
                          className="btn-modal-print" 
                          style={{ background: '#c62828', color: 'white', flex: 1, textAlign: 'center', minWidth: '150px' }} 
                          onClick={() => setRechazando(true)}
                        >
                          ✕ RECHAZAR
                        </button>
                      )}
                      
                      {(cotizacionSeleccionada.status !== 'Rechazado' || esCliente) && (
                        <button 
                          className="btn-modal-print" 
                          style={{ background: '#2e7d32', color: 'white', flex: 1, textAlign: 'center', minWidth: '150px' }} 
                          onClick={() => {
                            if (cotizacionSeleccionada.status === 'Rechazado') {
                              if (window.confirm('¿Deseas aceptar esta cotización que habías rechazado?')) {
                                procesarCotizacion('Aprobado');
                              }
                            } else {
                              procesarCotizacion('Aprobado');
                            }
                          }}
                          disabled={procesando}
                        >
                          ✓ ACEPTAR COTIZACIÓN
                        </button>
                      )}
                    </div>
                  )}

                  {(esCliente || (!esCliente && !esTecnico && cotizacionSeleccionada.created_by_role === 'Técnico')) && rechazando && (
                    <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
                      <button 
                        className="btn-modal-print" 
                        style={{ background: '#757575', color: 'white', flex: 1, textAlign: 'center', minWidth: '150px' }} 
                        onClick={() => { setRechazando(false); setMotivoRechazo(''); }}
                      >
                        CANCELAR
                      </button>
                      <button 
                        className="btn-modal-print" 
                        style={{ 
                          background: '#c62828', 
                          color: 'white', 
                          flex: 1, 
                          textAlign: 'center', 
                          minWidth: '150px',
                          opacity: (procesando || !motivoRechazo.trim()) ? 0.5 : 1,
                          cursor: (procesando || !motivoRechazo.trim()) ? 'not-allowed' : 'pointer'
                        }} 
                        onClick={() => procesarCotizacion('Rechazado')}
                        disabled={procesando || !motivoRechazo.trim()}
                      >
                        CONFIRMAR RECHAZO
                      </button>
                    </div>
                  )}

                  <button className="btn-modal-close" style={{ width: '100%', textAlign: 'center', marginTop: '5px' }} onClick={() => { setCotizacionSeleccionada(null); setRechazando(false); setMotivoRechazo(''); }}>CERRAR</button>
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

      {showPagoModal && cotizacionSeleccionada && (
        <Pago 
          cotizacion={cotizacionSeleccionada} 
          onClose={async () => {
            setShowPagoModal(false);
            cargarCotizaciones();
            try {
              const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacionSeleccionada.id}`);
              if (res.data) setCotizacionSeleccionada(res.data);
            } catch(e) {}
          }} 
        />
      )}

      {imagenModal && (
        <div 
          className="modal-fixed-overlay" 
          onClick={() => setImagenModal(null)}
          style={{ zIndex: 200000, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.95)' }}
        >
          <div 
            style={{ position: 'relative', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }} 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setImagenModal(null)}
              style={{
                position: 'absolute', top: '-40px', right: '0px',
                background: 'transparent', color: 'white', border: 'none',
                fontSize: '2.5rem', cursor: 'pointer', outline: 'none'
              }}
            >
              &times;
            </button>
            <img 
              src={imagenModal} 
              alt="Ampliada" 
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' }} 
            />
            <button 
              onClick={() => window.open(imagenModal, '_blank')}
              style={{
                marginTop: '15px',
                background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '25px', padding: '8px 25px', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '0.85rem', transition: 'background 0.3s',
                backdropFilter: 'blur(10px)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              Abrir en pestaña nueva ↗
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaCotizaciones;