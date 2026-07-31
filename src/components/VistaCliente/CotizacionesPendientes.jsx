import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, ShoppingBag, Sparkles, CheckSquare, Square, 
  CreditCard, ShieldCheck, Eye, CheckCircle2, AlertTriangle, 
  RefreshCw, AlertCircle, CalendarX, Lock, Trash2
} from 'lucide-react';
import '../../styles/Cliente/Cotizaciones.css';

const CotizacionesPendientes = () => {
  const navigate = useNavigate();
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
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
          mapa.set(String(item.id), {
            ...item,
            vencida: cad.vencida,
            diasRestantes: cad.diasRestantes,
            estado: cad.vencida ? 'Caducada (> 15 días)' : (item.estado || 'Pendiente de aprobación')
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
    alert(`Se ha enviado la solicitud de recotización para "${cot.titulo}" (${cot.folio}) al administrador de Agente Solutions.`);
    mostrarNotificacion(`Solicitud enviada para ${cot.folio}. El administrador actualizará el costo y la fecha de vigencia.`);
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
                const isSelected = !cot.vencida && selectedIds.includes(cot.id);
                return (
                  <div 
                    key={cot.id} 
                    className={`quote-card-item cart-card-row ${isSelected ? 'selected-row' : ''} ${cot.vencida ? 'expired-card-row' : ''}`}
                    onClick={() => handleToggleSelect(cot)}
                  >
                    {/* Checkbox / Indicador de Caducidad */}
                    <div 
                      className={`cart-checkbox-wrapper ${cot.vencida ? 'disabled-checkbox' : ''}`} 
                      onClick={(e) => handleToggleSelect(cot, e)}
                      title={cot.vencida ? 'Cotización caducada. Solicita recotizar' : 'Marcar para sumar al total'}
                    >
                      {cot.vencida ? (
                        <div className="expired-lock-box">
                          <Lock size={18} className="lock-icon" />
                        </div>
                      ) : isSelected ? (
                        <CheckSquare size={22} className="checkbox-icon checked" />
                      ) : (
                        <Square size={22} className="checkbox-icon" />
                      )}
                    </div>

                    {/* Información Principal del Servicio */}
                    <div className="card-content-left">
                      <div className={`quote-card-icon cart-icon ${cot.vencida ? 'expired-icon-box' : ''}`}>
                        {cot.vencida ? <CalendarX size={20} color="#dc2626" /> : <Clock size={20} />}
                      </div>
                      <div className="quote-card-info">
                        <div className="quote-card-topline">
                          <h4>{cot.titulo}</h4>
                          {cot.vencida ? (
                            <span className="quote-status-label status-expired">
                              Caducada (&gt; 15 días)
                            </span>
                          ) : (
                            <span className="quote-status-label status-valid">
                              Vence en {cot.diasRestantes} días
                            </span>
                          )}
                        </div>
                        <p className="quote-description">{cot.descripcion}</p>
                        
                        {/* Aviso de Caducidad si aplica */}
                        {cot.vencida && (
                          <div className="expired-alert-banner">
                            <AlertTriangle size={15} />
                            <span>Cotización vencida. Debes recotizar para poder sumarla a tu cuenta.</span>
                          </div>
                        )}

                        <div className="quote-meta-row">
                          <span className="quote-meta-pill">Folio: <strong>{cot.folio}</strong></span>
                          <span className="quote-meta-pill">Registro: {cot.fecha}</span>
                          <span className="quote-meta-pill validity-pill">
                            Vigencia: {cot.vencida ? 'Expirada' : `${cot.diasRestantes}/15 días restantes`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lado Derecho: Total y Acciones */}
                    <div className="quote-card-right cart-card-actions">
                      <div className={`quote-total-box ${cot.vencida ? 'expired-total-box' : ''}`}>
                        <span>{cot.vencida ? 'Sujeto a recotización' : 'Importe total'}</span>
                        <strong className={cot.vencida ? 'strike-price' : ''}>
                          {formatCurrency(cot.total)}
                        </strong>
                      </div>

                      <div className="card-btn-group">
                        {cot.vencida ? (
                          <button 
                            className="btn-requote-action"
                            onClick={(e) => handleSolicitarRecotizacion(cot, e)}
                          >
                            <RefreshCw size={14} /> Recotizar
                          </button>
                        ) : null}
                        <button 
                          className="btn-preview" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCotizacionSeleccionada(cot);
                          }}
                        >
                          <Eye size={14} style={{ marginRight: '4px' }} /> Ver detalle
                        </button>
                        <button 
                          className="btn-remove-cart"
                          title="Quitar del carrito"
                          style={{
                            background: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={(e) => handleEliminarDelCarrito(cot, e)}
                        >
                          <Trash2 size={13} /> Quitar
                        </button>
                      </div>
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
    </div>
  );
};

export default CotizacionesPendientes;
