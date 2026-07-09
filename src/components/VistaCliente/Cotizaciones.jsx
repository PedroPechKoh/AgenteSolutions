import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Clock, MessageSquare, 
  ChevronRight, Copy, UploadCloud, ShieldCheck, CreditCard 
} from 'lucide-react';
import '../../styles/Cliente/Cotizaciones.css';

const Cotizaciones = () => {
  const [tabActivo, setTabActivo] = useState('nuevas');
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [pasoPago, setPasoPago] = useState(0); 
  const [motivoFeedback, setMotivoFeedback] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [cotizacionesData, setCotizacionesData] = useState([]);

  useEffect(() => {
    const fetchCotizaciones = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        const res = await axios.get(`${API_URL}/cotizaciones`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(res.data)) {
          setCotizacionesData(res.data);
        } else if (res.data && Array.isArray(res.data.quotes || res.data.data)) {
          setCotizacionesData(res.data.quotes || res.data.data);
        }
        setLoading(false);
      } catch (err) {
        console.warn("Usando datos locales o vacíos por error en red:", err);
        setError(null);
        setLoading(false);
      }
    };
    fetchCotizaciones();
  }, []);

  const cotizacionesFiltradas = cotizacionesData.filter(cot => {
    const statusLower = String(cot.status || cot.estado || '').toLowerCase();
    if (tabActivo === 'nuevas') {
      return statusLower === 'nuevas' || statusLower.includes('pendien') || !statusLower;
    }
    if (tabActivo === 'aceptadas') {
      return statusLower === 'aceptadas' || statusLower.includes('aprob') || statusLower.includes('procesada') || statusLower.includes('pagad');
    }
    if (tabActivo === 'rechazadas') {
      return statusLower === 'rechazadas' || statusLower.includes('rechaz') || statusLower.includes('cancel');
    }
    return false;
  });

  const abrirModal = (cot) => {
    setCotizacionSeleccionada(cot);
    setPasoPago(0);
    setMotivoFeedback(cot.comentarioCliente || '');
  };

  const cerrarModal = () => {
    setCotizacionSeleccionada(null);
    setPasoPago(0);
    setMotivoFeedback('');
  };

  const handleFinalizarPago = () => {
    console.log(`Enviando comprobante para ${cotizacionSeleccionada.id}. Nota: ${motivoFeedback}`);
    alert("Comprobante enviado con éxito.");
    navigate('/'); 
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(amount || 0));
  };

  const getConceptoText = (cot) => {
    if (!cot) return 'Esperando respuesta de Agente Solutions.';
    const raw = cot.concept || cot.concepto;
    if (!raw) return cot.observations || 'Esperando respuesta de Agente Solutions.';
    if (typeof raw === 'string') {
      if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const arr = parsed.conceptos || parsed.servicios || parsed.seccionesLote || [];
            if (Array.isArray(arr) && arr.length > 0) {
              const descs = arr.map(x => x.descripcion || x.titulo || x.desc || 'Servicio').filter(Boolean);
              if (descs.length > 0) return descs.join(', ');
            }
          }
        } catch {
          // ignore parsing error
        }
      }
      return raw;
    }
    if (typeof raw === 'object') {
      const arr = raw.conceptos || raw.servicios || raw.seccionesLote || [];
      if (Array.isArray(arr) && arr.length > 0) {
        const descs = arr.map(x => x.descripcion || x.titulo || x.desc || 'Servicio').filter(Boolean);
        if (descs.length > 0) return descs.join(', ');
      }
      return cot.observations || 'Cotización detallada con servicios y materiales.';
    }
    return cot.observations || 'Esperando respuesta de Agente Solutions.';
  };

  const renderDetalleConceptoModal = (cot) => {
    if (!cot) return null;
    let detalle = cot.concept || cot.concepto;
    if (typeof detalle === 'string' && (detalle.trim().startsWith('{') || detalle.trim().startsWith('['))) {
      try { 
        detalle = JSON.parse(detalle); 
      } catch {
        // ignore parsing error
      }
    }
    if (!detalle || typeof detalle !== 'object') {
      return (
        <div className="excel-row">
          <span>Concepto</span>
          <span>{typeof detalle === 'string' ? detalle : 'Cotización asignada'}</span>
        </div>
      );
    }
    const listaServicios = detalle.conceptos || detalle.servicios || [];
    const listaMateriales = detalle.materiales || [];

    return (
      <div style={{ margin: '15px 0', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
        {listaServicios.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#f26522', fontSize: '0.95rem', fontWeight: 'bold' }}>Servicios / Conceptos</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Descripción</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Cant.</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Precio</th>
                </tr>
              </thead>
              <tbody>
                {listaServicios.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 8px' }}>{s.descripcion || s.desc || 'Servicio'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>{s.cantidad || s.cant || 1}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(s.precio_u || s.precio || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {listaMateriales.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#f26522', fontSize: '0.95rem', fontWeight: 'bold' }}>Materiales Incluidos</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Nombre</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Cant.</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Costo</th>
                </tr>
              </thead>
              <tbody>
                {listaMateriales.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 8px' }}>{m.nombre || m.descripcion || m.desc || 'Material'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>{m.cantidad || m.cant || 1}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(m.costo_u || m.precio || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="quotes-view-container">
      <header className="quotes-main-header">
        <div className="header-titles">
          <h2>Panel de Cotizaciones</h2>
          <p>Agente Solutions - Gestión de Proyectos</p>
        </div>
        <div className="quotes-tabs-row">
          <button className={`tab-btn ${tabActivo === 'nuevas' ? 'active-nuevas' : ''}`} onClick={() => setTabActivo('nuevas')}>NUEVAS</button>
          <button className={`tab-btn ${tabActivo === 'aceptadas' ? 'active-aceptadas' : ''}`} onClick={() => setTabActivo('aceptadas')}>ACEPTADAS</button>
          <button className={`tab-btn ${tabActivo === 'rechazadas' ? 'active-rechazadas' : ''}`} onClick={() => setTabActivo('rechazadas')}>RECHAZADAS</button>
        </div>
      </header>

      {loading ? (
        <div className="empty-state">Cargando cotizaciones...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : (
        <div className="quotes-scroll-area">
          {cotizacionesFiltradas.length > 0 ? (
            cotizacionesFiltradas.map((cot) => (
              <div key={cot.id} className={`quote-card-item card-${cot.estado || 'nuevas'}`} onClick={() => abrirModal(cot)}>
                <div className="quote-card-left">
                  <div className="quote-card-icon">
                    {(cot.estado === 'nuevas' || !cot.estado) && <Clock size={20} />}
                    {cot.estado === 'aceptadas' && <CheckCircle size={20} />}
                    {cot.estado === 'rechazadas' && <XCircle size={20} />}
                  </div>
                  <div className="quote-card-info">
                    <h4>{cot.propiedad_nombre || cot.cliente || 'Cotización pendiente'}</h4>
                    <span>{cot.folio || `#${cot.id}`} • {cot.fecha || 'Sin fecha'}</span>
                    <p>{getConceptoText(cot)}</p>
                  </div>
                </div>
                <div className="quote-card-right">
                  <div className="price-tag-group">
                    <strong>{formatCurrency(cot.total)}</strong>
                    {cot.estado === 'aceptadas' && cot.pagadoPorcentaje === 60 ? (
                      <span className="partial-badge">ANTICIPO 60% PAGADO</span>
                    ) : (
                      <span className="partial-badge">{(cot.estado || 'PENDIENTE').toUpperCase()}</span>
                    )}
                  </div>
                  <ChevronRight size={18} />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No tienes cotizaciones en esta sección.</div>
          )}
        </div>
      )}

      {cotizacionSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            {pasoPago === 0 ? (
              <div className="modal-excel-view">
                <header className={`modal-excel-header h-${cotizacionSeleccionada.estado || 'nuevas'}`}>
                  <div className="header-top-info">
                    <span className="badge-status">{(cotizacionSeleccionada.estado || 'NUEVA').toUpperCase()}</span>
                    <button className="close-modal-btn" onClick={cerrarModal}>&times;</button>
                  </div>
                  <h3>{cotizacionSeleccionada.propiedad_nombre || cotizacionSeleccionada.cliente || 'Cotización pendiente'}</h3>
                </header>
                <div className="modal-excel-body">
                  <div className="excel-table-container">
                    <div className="excel-table-header">
                      <span>DETALLE</span>
                      <span>VALOR</span>
                    </div>
                    <div className="excel-row">
                      <span>Folio</span>
                      <span>{cotizacionSeleccionada.folio || `#${cotizacionSeleccionada.id}`}</span>
                    </div>
                    <div className="excel-row">
                      <span>Fecha</span>
                      <span>{cotizacionSeleccionada.fecha || 'Sin fecha'}</span>
                    </div>
                    <div className="excel-row">
                      <span>Importe Total</span>
                      <span>{formatCurrency(cotizacionSeleccionada.total)}</span>
                    </div>
                    <div className="excel-row">
                      <span>Observaciones</span>
                      <span>{typeof cotizacionSeleccionada.observations === 'object' ? JSON.stringify(cotizacionSeleccionada.observations) : (cotizacionSeleccionada.observations || 'Esperando respuesta de Agente Solutions.')}</span>
                    </div>

                    {(cotizacionSeleccionada.estado === 'nuevas' || !cotizacionSeleccionada.estado) && (
                      <div className="excel-advance-highlight">
                        <span>Anticipo requerido para iniciar (60%)</span>
                        <strong>{formatCurrency(Number(cotizacionSeleccionada.total || 0) * 0.6)}</strong>
                      </div>
                    )}
                    {cotizacionSeleccionada.estado === 'aceptadas' && cotizacionSeleccionada.pagadoPorcentaje === 60 && (
                      <div className="excel-pending-highlight">
                        <span>Monto pendiente por liquidar (40%)</span>
                        <strong>{formatCurrency(Number(cotizacionSeleccionada.total || 0) * 0.4)}</strong>
                      </div>
                    )}
                  </div>

                  {renderDetalleConceptoModal(cotizacionSeleccionada)}

                  <div className="feedback-section" style={{ marginTop: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      <MessageSquare size={14} /> Observaciones / Comentarios:
                    </label>
                    <textarea 
                      className="modal-textarea"
                      value={motivoFeedback} 
                      onChange={(e) => setMotivoFeedback(e.target.value)} 
                      placeholder="Escribe un mensaje para Agente Solutions..." 
                    />
                  </div>

                  <div className="modal-actions-dynamic" style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {(cotizacionSeleccionada.estado === 'nuevas' || !cotizacionSeleccionada.estado) && (
                      <>
                        <button className="btn-reject-final" onClick={cerrarModal}>RECHAZAR</button>
                        <button className="btn-accept-final" onClick={() => setPasoPago(1)}>PAGAR ANTICIPO (60%)</button>
                      </>
                    )}
                    {cotizacionSeleccionada.estado === 'aceptadas' && cotizacionSeleccionada.pagadoPorcentaje === 60 && (
                      <button className="btn-liquidar-final" onClick={() => setPasoPago(1)}>
                        <CreditCard size={18} /> LIQUIDAR RESTANTE (40%)
                      </button>
                    )}
                    {cotizacionSeleccionada.estado === 'rechazadas' && (
                      <div className="status-banner-error" style={{ width: '100%', textAlign: 'center', padding: '10px', background: '#fee2e2', color: '#ef4444', borderRadius: '8px', fontWeight: 'bold' }}>
                        ESTA COTIZACIÓN FUE RECHAZADA
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="finalizar-pago-container">
                <div className="pago-sidebar-info">
                  <h2 className="sidebar-title">Finalizar Pago</h2>
                  <div className="bank-details-box">
                    <div className="detail-item"><label>BANCO</label><strong>BBVA México</strong></div>
                    <div className="detail-item"><label>BENEFICIARIO</label><strong>Agente Solutions S.A. de C.V.</strong></div>
                    <div className="detail-item"><label>CLABE</label><div className="copy-field"><span>012 345 6789 0123 4567</span><Copy size={14} /></div></div>
                  </div>
                  <div className="monto-depositar-card">
                    <div className="monto-labels">
                      <span>Monto a depositar:</span>
                      <small>{cotizacionSeleccionada.pagadoPorcentaje === 60 ? 'Liquidación Final' : 'Anticipo Inicial'}</small>
                    </div>
                    <div className="monto-valor">
                      {cotizacionSeleccionada.pagadoPorcentaje === 60 
                        ? formatCurrency(Number(cotizacionSeleccionada.total || 0) * 0.4) 
                        : formatCurrency(Number(cotizacionSeleccionada.total || 0) * 0.6)}
                    </div>
                  </div>
                </div>
                <div className="pago-upload-content">
                  <div className="step-indicator">PASO 2 DE 2</div>
                  <h3 className="upload-title">Confirmar Comprobante</h3>
                  <div className="upload-dropzone">
                    <UploadCloud size={40} color="#94a3b8" />
                    <p><strong>Sube tu comprobante aquí</strong></p>
                  </div>
                  <div className="security-note"><ShieldCheck size={14} /> Pago seguro por Agente Solutions</div>
                  <button className="btn-enviar-comprobante-final" onClick={handleFinalizarPago}>Enviar Comprobante</button>
                  <button className="btn-back-link" onClick={() => setPasoPago(0)}>Regresar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cotizaciones;