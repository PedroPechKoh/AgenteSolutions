import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, ShoppingBag, Sparkles, CheckSquare, Square, 
  CreditCard, ShieldCheck, Eye, CheckCircle2, AlertTriangle, 
  RefreshCw, AlertCircle, CalendarX, Lock, Trash2
} from 'lucide-react';
import '../../../styles/AgenteSolutions/Cliente/Cotizaciones.css';

const CotizacionesPendientes = () => {
  const navigate = useNavigate();
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [modalRecotizacionExito, setModalRecotizacionExito] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensajeNotificacion, setMensajeNotificacion] = useState(null);

  // Helper para calcular la vigencia de 15 días desde la fecha de registro
  const calcularCaducidad = (fechaStr, vencidaExplicit) => {
    if (vencidaExplicit) {
      return { vencida: true, diasRestantes: 0, diasTranscurridos: 18 };
    }
    if (!fechaStr) {
      return { vencida: false, diasRestantes: 15, diasTranscurridos: 0 };
    }

    let fechaDoc = new Date(fechaStr);
    if (isNaN(fechaDoc.getTime())) {
      if (fechaStr.includes('05 Mar') || fechaStr.includes('febrero')) {
        return { vencida: true, diasRestantes: 0, diasTranscurridos: 20 };
      }
      return { vencida: false, diasRestantes: 15, diasTranscurridos: 0 };
    }

    const hoy = new Date();
    const diffTime = hoy - fechaDoc;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diasRestantes = 15 - diffDays;
    
    return {
      vencida: diffDays > 15,
      diasRestantes: Math.max(0, diasRestantes),
      diasTranscurridos: Math.max(0, diffDays)
    };
  };

  // Inicialización limpia sin datos estáticos de ejemplo
  const [cotizaciones, setCotizaciones] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const fetchCotizaciones = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        
        // Cargar cotizaciones mandadas al carrito localmente
        const guardadasLocales = JSON.parse(localStorage.getItem('carrito_cotizaciones') || '[]');

        let data = [];
        try {
          const res = await axios.get(`${API_URL}/cotizaciones`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (Array.isArray(res.data)) {
            data = res.data;
          } else if (res.data && Array.isArray(res.data.quotes || res.data.data)) {
            data = res.data.quotes || res.data.data;
          }
        } catch (apiErr) {
          console.warn("Utilizando cotizaciones guardadas en localStorage para el carrito:", apiErr);
        }

        const pendientesAPI = data.filter(cot => {
          const st = String(cot.status || cot.estado || '').toLowerCase();
          return !st.includes('aceptad') && !st.includes('aprob') && !st.includes('rechaz') && !st.includes('cancel');
        });

        let mapeadas = [];
        if (pendientesAPI.length > 0) {
          mapeadas = pendientesAPI.map(item => {
            const caducidad = calcularCaducidad(item.created_at || item.fecha, item.vencida);
            return {
              id: item.id,
              titulo: item.concept || item.concepto || item.titulo || `Cotización #${item.id}`,
              folio: item.folio || `COT-${item.id}`,
              fecha: item.created_at ? new Date(item.created_at).toLocaleDateString('es-MX') : 'Fecha reciente',
              total: Number(item.total_amount || item.monto || item.total || 0),
              estado: caducidad.vencida ? 'Caducada (> 15 días)' : (item.status || item.estado || 'Pendiente'),
              descripcion: item.observations || item.descripcion || 'Servicio registrado en espera.',
              vencida: caducidad.vencida,
              diasRestantes: caducidad.diasRestantes
            };
          });
        }

        const mapa = new Map();

        mapeadas.forEach(item => {
          mapa.set(String(item.id), item);
        });

        guardadasLocales.forEach(item => {
          const cad = calcularCaducidad(item.fecha, item.vencida);
          const esRecotizando = item.estado === 'Pendiente de recotización' || item.recotizacionSolicitada;
          mapa.set(String(item.id), {
            ...item,
            vencida: cad.vencida,
            diasRestantes: cad.diasRestantes,
            estado: esRecotizando ? 'Pendiente de recotización' : (cad.vencida ? 'Caducada (> 15 días)' : (item.estado || 'Pendiente de aprobación')),
            recotizacionSolicitada: esRecotizando
          });
        });

        const listaFinal = Array.from(mapa.values());
        setCotizaciones(listaFinal);
        const vigentesIds = listaFinal.filter(c => !c.vencida).map(c => c.id);
        setSelectedIds(vigentesIds);

      } catch (err) {
        console.warn("Error cargando carrito:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCotizaciones();
  }, []);

  // Eliminar servicio del carrito
  const handleEliminarDelCarrito = (cot, e) => {
    if (e) e.stopPropagation();
    if (!cot) return;

    if (window.confirm(`¿Deseas quitar la cotización "${cot.titulo || cot.folio}" del carrito?`)) {
      const guardadas = JSON.parse(localStorage.getItem('carrito_cotizaciones') || '[]');
      const filtradas = guardadas.filter(item => String(item.id) !== String(cot.id) && String(item.folio) !== String(cot.folio));
      localStorage.setItem('carrito_cotizaciones', JSON.stringify(filtradas));

      const listaActualizada = cotizaciones.filter(c => String(c.id) !== String(cot.id));
      setCotizaciones(listaActualizada);
      setSelectedIds(selectedIds.filter(id => String(id) !== String(cot.id)));
    }
  };

  // Manejador de selección de cotizaciones con validación de caducidad
  const handleToggleSelect = (cot, e) => {
    if (e) e.stopPropagation();
    
    // Si la cotización está vencida, no se puede seleccionar para la sumatoria
    if (cot.vencida) {
      mostrarNotificacion(`La cotización "${cot.titulo}" está caducada (excedió los 15 días). Debes solicitar recotizar para actualizar su monto y agregarla a tu cuenta.`);
      return;
    }

    setSelectedIds(prev => 
      prev.includes(cot.id) ? prev.filter(item => item !== cot.id) : [...prev, cot.id]
    );
  };

  const handleToggleAll = () => {
    const vigentes = cotizaciones.filter(c => !c.vencida);
    const vigentesIds = vigentes.map(c => c.id);

    // Si todas las vigentes están seleccionadas, deseleccionar todas
    const todasVigentesSeleccionadas = vigentesIds.every(id => selectedIds.includes(id));

    if (todasVigentesSeleccionadas) {
      setSelectedIds([]);
    } else {
      setSelectedIds(vigentesIds);
    }
  };

  const mostrarNotificacion = (msg) => {
    setMensajeNotificacion(msg);
    setTimeout(() => {
      setMensajeNotificacion(null);
    }, 5000);
  };

  const handleSolicitarRecotizacion = (cot, e) => {
    if (e) e.stopPropagation();
    if (!cot) return;

    // 1. Notificación local para el Administrador / Root
    const notificacionesAdmin = JSON.parse(localStorage.getItem('notificaciones_admin') || '[]');
    const nuevaNotif = {
      id: Date.now(),
      type: 'solicitud_recotizacion',
      title: `🔄 Solicitud de Recotización - ${cot.folio || `#${cot.id}`}`,
      titulo: `Solicitud de Recotización - ${cot.folio || `#${cot.id}`}`,
      message: `El cliente solicitó recotizar el servicio "${cot.titulo || cot.concepto || ''}" (${cot.folio || cot.id}) por caducidad.`,
      mensaje: `El cliente solicitó recotizar el servicio "${cot.titulo || cot.concepto || ''}" (${cot.folio || cot.id}) por caducidad.`,
      cotizacionOriginal: { ...cot, isDerived: true },
      fecha: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
      created_at: new Date().toISOString(),
      read_at: null,
      leida: false,
      data: {
        type: 'solicitud_recotizacion',
        quote_id: cot.id,
        cotizacion_id: cot.id,
        url: '/vista-cotizaciones?filtro=Recotizaciones'
      }
    };
    localStorage.setItem('notificaciones_admin', JSON.stringify([nuevaNotif, ...notificacionesAdmin]));
    window.dispatchEvent(new Event('notif_update'));
    window.dispatchEvent(new Event('storage'));

    // 2. Enviar notificaciones y petición al backend API (Laravel)
    try {
      const token = localStorage.getItem('agente_token') || localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Notificar al backend Laravel sobre la recotización para el usuario Root / Admin
      axios.post(`${API_URL}/notifications/send-to-admin`, {
        title: `🔄 Solicitud de Recotización - ${cot.folio || `#${cot.id}`}`,
        message: `El cliente solicitó recotizar el servicio "${cot.titulo || cot.concepto || ''}" (${cot.folio || cot.id}) por estar vencida.`,
        type: "solicitud_recotizacion",
        quote_id: cot.id,
        data: {
          type: 'solicitud_recotizacion',
          quote_id: cot.id,
          cotizacion_id: cot.id,
          url: '/vista-cotizaciones?filtro=Recotizaciones'
        }
      }, { headers }).catch(err => console.warn("Notificación a admin en API backend guardada:", err));

      // Petición al endpoint de recotización
      axios.post(`${API_URL}/cotizaciones/${cot.id}/recotizar`, {
        cotizacion_id: cot.id,
        motivo: 'Caducada (> 15 días)'
      }, { headers }).catch(err => console.warn("Petición de recotización guardada localmente:", err));
    } catch {
      // ignore
    }

    // 3. Actualizar estado de la cotización localmente
    setCotizaciones(prev => prev.map(c => {
      if (String(c.id) === String(cot.id) || String(c.folio) === String(cot.folio)) {
        return {
          ...c,
          estado: 'Pendiente de recotización',
          recotizacionSolicitada: true
        };
      }
      return c;
    }));

    const guardadas = JSON.parse(localStorage.getItem('carrito_cotizaciones') || '[]');
    const actualizadas = guardadas.map(item => {
      if (String(item.id) === String(cot.id) || String(item.folio) === String(cot.folio)) {
        return {
          ...item,
          estado: 'Pendiente de recotización',
          recotizacionSolicitada: true
        };
      }
      return item;
    });
    localStorage.setItem('carrito_cotizaciones', JSON.stringify(actualizadas));

    // 4. Mostrar Modal de Aviso / Confirmación
    setModalRecotizacionExito(cot);
    mostrarNotificacion(`Solicitud enviada para ${cot.folio || cot.titulo}. Estado cambiado a "Pendiente de recotización".`);
  };

  // Filtrado de seleccionadas (solo permite vigentes)
  const cotizacionesSeleccionadas = cotizaciones.filter(c => !c.vencida && selectedIds.includes(c.id));
  const totalAcumulado = cotizacionesSeleccionadas.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  const cotizacionesVigentes = cotizaciones.filter(c => !c.vencida);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const handleProcederPago = () => {
    if (cotizacionesSeleccionadas.length === 0) {
      alert("Por favor selecciona al menos una cotización vigente para proceder al pago.");
      return;
    }
    navigate('/vista-cotizaciones', { 
      state: { 
        cotizacionesAPagar: cotizacionesSeleccionadas,
        totalAcumulado 
      } 
    });
  };

  return (
    <div className="quotes-view-container cart-page-container">
      {/* Toast de Notificación o Alerta de Caducidad */}
      {mensajeNotificacion && (
        <div className="cart-toast-alert">
          <AlertCircle size={20} className="toast-icon" />
          <span>{mensajeNotificacion}</span>
          <button className="toast-close-btn" onClick={() => setMensajeNotificacion(null)}>&times;</button>
        </div>
      )}

      {/* Encabezado Principal */}
      <header className="quotes-main-header cart-header">
        <div className="header-titles">
          <div className="cart-title-row">
            <div className="cart-icon-badge">
              <ShoppingBag size={28} color="#f26624" />
            </div>
            <div>
              <h2>Carrito de Cotizaciones y Servicios</h2>
              <p>Selecciona tus servicios vigentes (hasta 15 días). Si una cotización caduca, solicita recotizar para sumarla.</p>
            </div>
          </div>
        </div>
        <div className="cart-summary-pill">
          <Sparkles size={16} />
          {cotizaciones.length} servicios registrados
        </div>
      </header>

      {/* Grid Principal: Lista + Resumen Lateral */}
      <div className="cart-main-grid">
        {/* Columna Izquierda: Lista de Cotizaciones */}
        <div className="cart-items-column">
          {/* Barra de Selección Masiva */}
          <div className="cart-selection-bar">
            <div className="select-all-toggle" onClick={handleToggleAll}>
              {selectedIds.length === cotizacionesVigentes.length && cotizacionesVigentes.length > 0 ? (
                <CheckSquare size={22} className="checkbox-icon checked" />
              ) : (
                <Square size={22} className="checkbox-icon" />
              )}
              <span className="select-all-text">
                Seleccionar vigentes ({selectedIds.length}/{cotizacionesVigentes.length})
              </span>
            </div>
            {selectedIds.length > 0 && (
              <span className="selected-count-badge">
                {selectedIds.length} {selectedIds.length === 1 ? 'servicio sumado' : 'servicios sumados'}
              </span>
            )}
          </div>

          {/* Lista de Tarjetas de Cotización */}
          <div className="quotes-scroll-area cart-list-wrapper">
            {cotizaciones.length === 0 ? (
              <div className="empty-cart-state">
                <ShoppingBag size={48} color="#94a3b8" />
                <p>No tienes cotizaciones o servicios en espera por el momento.</p>
              </div>
            ) : (
              cotizaciones.map((cot) => {
                const esPendienteRecotizacion = cot.estado === 'Pendiente de recotización' || cot.recotizacionSolicitada;
                const isSelected = !cot.vencida && !esPendienteRecotizacion && selectedIds.includes(cot.id);
                return (
                  <div 
                    key={cot.id} 
                    className={`quote-card-item cart-card-row ${isSelected ? 'selected-row' : ''} ${cot.vencida && !esPendienteRecotizacion ? 'expired-card-row' : ''} ${esPendienteRecotizacion ? 'pending-requote-card-row' : ''}`}
                    onClick={() => handleToggleSelect(cot)}
                  >
                    {/* Cabecera de la Tarjeta */}
                    <div className="cart-card-header">
                      <div className="cart-card-title-group">
                        <div 
                          className={`cart-checkbox-wrapper ${cot.vencida || esPendienteRecotizacion ? 'disabled-checkbox' : ''}`} 
                          onClick={(e) => handleToggleSelect(cot, e)}
                          title={esPendienteRecotizacion ? 'Recotización en proceso' : cot.vencida ? 'Cotización caducada. Solicita recotizar' : 'Marcar para sumar al total'}
                        >
                          {esPendienteRecotizacion ? (
                            <div className="pending-requote-lock-box" title="Recotización pendiente">
                              <RefreshCw size={18} className="lock-icon spin-slow" color="#d97706" />
                            </div>
                          ) : cot.vencida ? (
                            <div className="expired-lock-box">
                              <Lock size={18} className="lock-icon" />
                            </div>
                          ) : isSelected ? (
                            <CheckSquare size={22} className="checkbox-icon checked" />
                          ) : (
                            <Square size={22} className="checkbox-icon" />
                          )}
                        </div>

                        <div className="cart-card-title-info">
                          <h4>{cot.titulo}</h4>
                          {esPendienteRecotizacion ? (
                            <span className="quote-status-label status-pending-requote">
                              <Clock size={13} style={{ marginRight: '4px' }} /> Pendiente de recotización
                            </span>
                          ) : cot.vencida ? (
                            <span className="quote-status-label status-expired">
                              Caducada (&gt; 15 días)
                            </span>
                          ) : (
                            <span className="quote-status-label status-valid">
                              Vence en {cot.diasRestantes} días
                            </span>
                          )}
                        </div>
                      </div>

                      <button 
                        className="btn-remove-icon"
                        title="Quitar del carrito"
                        onClick={(e) => handleEliminarDelCarrito(cot, e)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Cuerpo de la Tarjeta */}
                    <div className="cart-card-body">
                      <div className="cart-card-body-left">
                        <div className={`quote-card-icon cart-icon ${esPendienteRecotizacion ? 'pending-icon-box' : cot.vencida ? 'expired-icon-box' : ''}`}>
                          {esPendienteRecotizacion ? <RefreshCw size={20} color="#d97706" /> : cot.vencida ? <CalendarX size={20} color="#dc2626" /> : <Clock size={20} />}
                        </div>
                        <div className="quote-card-details">
                          <p className="quote-description">{cot.descripcion}</p>
                          
                          {/* Avisos de Estado */}
                          {esPendienteRecotizacion ? (
                            <div className="expired-alert-banner pending-requote-banner">
                              <RefreshCw size={15} className="alert-icon" />
                              <span>Solicitud de recotización enviada. En espera de actualización de costos por el administrador.</span>
                            </div>
                          ) : cot.vencida ? (
                            <div className="expired-alert-banner">
                              <AlertTriangle size={15} className="alert-icon" />
                              <span>Cotización vencida. Debes recotizar para poder sumarla a tu cuenta.</span>
                            </div>
                          ) : null}

                          <div className="quote-meta-row">
                            <span className="quote-meta-pill">Folio: <strong>{cot.folio}</strong></span>
                            <span className="quote-meta-pill">Registro: {cot.fecha}</span>
                            <span className="quote-meta-pill validity-pill">
                              Vigencia: {esPendienteRecotizacion ? 'En Recotización' : cot.vencida ? 'Expirada' : `${cot.diasRestantes}/15 días restantes`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Importe Total */}
                      <div className={`quote-total-box ${esPendienteRecotizacion ? 'pending-total-box' : cot.vencida ? 'expired-total-box' : ''}`}>
                        <span className="total-box-label">{esPendienteRecotizacion ? 'Monto en actualización' : cot.vencida ? 'Sujeto a recotización' : 'Importe total'}</span>
                        <strong className={`total-box-amount ${cot.vencida && !esPendienteRecotizacion ? 'strike-price' : ''}`}>
                          {formatCurrency(cot.total)}
                        </strong>
                      </div>
                    </div>

                    {/* Acciones de la Tarjeta en el Pie */}
                    <div className="cart-card-actions-row">
                      {esPendienteRecotizacion ? (
                        <button className="btn-requote-sent-disabled" disabled title="La solicitud ya fue enviada al administrador">
                          <CheckCircle2 size={14} /> Solicitud de recotización enviada
                        </button>
                      ) : cot.vencida ? (
                        <button 
                          className="btn-requote-action"
                          onClick={(e) => handleSolicitarRecotizacion(cot, e)}
                        >
                          <RefreshCw size={14} /> Solicitar Recotización
                        </button>
                      ) : null}
                      <button 
                        className="btn-preview" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCotizacionSeleccionada(cot);
                        }}
                      >
                        <Eye size={14} /> Ver detalle
                      </button>
                      <button 
                        className="btn-remove-cart-text"
                        title="Quitar del carrito"
                        onClick={(e) => handleEliminarDelCarrito(cot, e)}
                      >
                        <Trash2 size={14} /> Quitar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Resumen Acumulado (Estilo Shein / Temu) */}
        <div className="cart-summary-column">
          <div className="order-summary-card">
            <div className="summary-card-header">
              <h3>Resumen del Carrito</h3>
              <span className="summary-items-count">
                {cotizacionesSeleccionadas.length} vigentes sumados
              </span>
            </div>

            <div className="summary-divider"></div>

            {/* Desglose Rápido de Ítems Seleccionados */}
            <div className="selected-items-breakdown">
              <h4>Servicios incluidos en la suma:</h4>
              {cotizacionesSeleccionadas.length === 0 ? (
                <p className="no-selection-msg">Selecciona al menos una cotización vigente para calcular el total.</p>
              ) : (
                <ul className="breakdown-list">
                  {cotizacionesSeleccionadas.map((item) => (
                    <li key={item.id} className="breakdown-item">
                      <div className="breakdown-item-info">
                        <CheckCircle2 size={15} className="item-check-icon" />
                        <span className="item-title">{item.titulo}</span>
                      </div>
                      <span className="item-price">{formatCurrency(item.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="summary-divider"></div>

            {/* Fila de Total Acumulado */}
            <div className="total-accumulated-box">
              <div className="total-label-group">
                <span>Total Acumulado</span>
                <small>Cotizaciones vigentes</small>
              </div>
              <div className="total-amount-highlight">
                {formatCurrency(totalAcumulado)}
              </div>
            </div>

            {/* Botón de Acción Principal */}
            <button 
              className={`btn-proceed-checkout ${cotizacionesSeleccionadas.length === 0 ? 'disabled' : ''}`}
              onClick={handleProcederPago}
              disabled={cotizacionesSeleccionadas.length === 0}
            >
              <CreditCard size={20} />
              <span>Aceptar y Pagar Seleccionados ({cotizacionesSeleccionadas.length})</span>
            </button>

            {/* Nota de Seguridad */}
            <div className="cart-security-badge">
              <ShieldCheck size={18} color="#16a34a" />
              <span>Garantía de 15 días de vigencia en todas tus cotizaciones.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Cotización */}
      {cotizacionSeleccionada && (
        <div className="modal-overlay" onClick={() => setCotizacionSeleccionada(null)}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className="modal-excel-view">
              <header className={`modal-excel-header ${cotizacionSeleccionada.vencida ? 'h-rechazadas' : 'h-nuevas'}`}>
                <div className="header-top-info">
                  <span className={`badge-status ${cotizacionSeleccionada.vencida ? 'badge-expired' : ''}`}>
                    {cotizacionSeleccionada.vencida ? 'CADUCADA (> 15 DÍAS)' : 'VIGENTE EN ESPERA'}
                  </span>
                  <button className="close-modal-btn" onClick={() => setCotizacionSeleccionada(null)}>&times;</button>
                </div>
                <h3>{cotizacionSeleccionada.titulo}</h3>
              </header>

              <div className="modal-excel-body">
                {cotizacionSeleccionada.vencida ? (
                  <div className="modal-expired-banner-alert">
                    <AlertTriangle size={24} />
                    <div>
                      <strong>Cotización vencida (Límite 15 días de caducidad)</strong>
                      <p>Esta cotización excedió el tiempo reglamentario. Para que puedas agregarla a la suma de tu cuenta y autorizar el pago, solicita una recotización al administrador.</p>
                    </div>
                  </div>
                ) : null}

                <div className="modal-detail-box">
                  <h4>Detalles del servicio cotizado</h4>
                  <p>{cotizacionSeleccionada.descripcion}</p>
                  <div className="detail-summary-row">
                    <div>
                      <strong>Folio</strong>
                      <p>{cotizacionSeleccionada.folio}</p>
                    </div>
                    <div>
                      <strong>Fecha de registro</strong>
                      <p>{cotizacionSeleccionada.fecha}</p>
                    </div>
                    <div>
                      <strong>Condición de vigencia</strong>
                      <p>{cotizacionSeleccionada.vencida ? 'Expiró (> 15 días)' : `Válida (${cotizacionSeleccionada.diasRestantes} días restantes)`}</p>
                    </div>
                  </div>
                </div>

                <div className="excel-table-container">
                  <div className="excel-table-header">
                    <span>CONCEPTO</span>
                    <span>IMPORTE</span>
                  </div>
                  <div className="excel-row">
                    <span>{cotizacionSeleccionada.titulo}</span>
                    <span>{formatCurrency(cotizacionSeleccionada.total)}</span>
                  </div>
                </div>

                <div className="excel-advance-highlight">
                  <span>{cotizacionSeleccionada.vencida ? 'Monto sujeto a actualización por recotización.' : 'Monto acumulable en el carrito de compras.'}</span>
                  <strong>{formatCurrency(cotizacionSeleccionada.total)} MXN</strong>
                </div>
                
                <div className="modal-actions-row">
                  {cotizacionSeleccionada.vencida ? (
                    <button 
                      className="btn-requote-final"
                      onClick={(e) => {
                        handleSolicitarRecotizacion(cotizacionSeleccionada, e);
                        setCotizacionSeleccionada(null);
                      }}
                    >
                      <RefreshCw size={16} style={{ marginRight: '6px' }} />
                      Solicitar Recotización al Administrador
                    </button>
                  ) : (
                    <button 
                      className="btn-accept-final"
                      onClick={() => {
                        if (!selectedIds.includes(cotizacionSeleccionada.id)) {
                          setSelectedIds(prev => [...prev, cotizacionSeleccionada.id]);
                        }
                        setCotizacionSeleccionada(null);
                      }}
                    >
                      Agregar / Mantener en la Selección
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Recotización Enviada */}
      {modalRecotizacionExito && (
        <div className="modal-overlay" onClick={() => setModalRecotizacionExito(null)}>
          <div className="modal-content-wrapper modal-requote-success" onClick={(e) => e.stopPropagation()}>
            <div className="modal-requote-body">
              <div className="requote-success-icon-badge">
                <RefreshCw size={36} color="#f26624" />
              </div>
              <h3>¡Solicitud de Recotización Enviada!</h3>
              <p className="requote-success-msg">
                Se ha enviado la solicitud de recotización para <strong>{modalRecotizacionExito.titulo}</strong> ({modalRecotizacionExito.folio || `#${modalRecotizacionExito.id}`}) al Administrador.
              </p>
              
              <div className="requote-status-box">
                <div className="status-box-row">
                  <span>Nuevo Estado de la Cotización:</span>
                  <span className="quote-status-label status-pending-requote">
                    <Clock size={13} style={{ marginRight: '4px' }} /> Pendiente de recotización
                  </span>
                </div>
                <p className="status-box-note">
                  El Administrador ha recibido la notificación con el contenido precargado para actualizar los precios. En cuanto los precios sean actualizados, la cotización pasará nuevamente a estar vigente para autorizar tu pago.
                </p>
              </div>

              <div className="requote-modal-actions">
                <button 
                  className="btn-accept-final btn-requote-confirm-ok" 
                  onClick={() => setModalRecotizacionExito(null)}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CotizacionesPendientes;
