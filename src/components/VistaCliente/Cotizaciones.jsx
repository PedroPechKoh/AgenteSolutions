import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Clock, MessageSquare, 
  ChevronRight, Copy, UploadCloud, ShieldCheck, Percent, CreditCard 
} from 'lucide-react';
import '../../styles/Cliente/Cotizaciones.css';

const Cotizaciones = () => {
  const [tabActivo, setTabActivo] = useState('nuevas');
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [pasoPago, setPasoPago] = useState(0); 
  const [motivoFeedback, setMotivoFeedback] = useState(''); 
  const navigate = useNavigate();

  // Datos maestros con estados y porcentajes de pago
  const [cotizacionesData] = useState([
    { 
      id: 'COT-204', 
      cliente: 'Residencial del Parque', 
      fecha: '18 Mar 2026', 
      total: 4500.00, 
      estado: 'nuevas',
      pagadoPorcentaje: 0,
      conceptos: [
        { desc: 'Mantenimiento de transformadores', cant: 1, precio: 3000, subtotal: 3000 },
        { desc: 'Cableado de alta tensión', cant: 5, precio: 300, subtotal: 1500 },
      ]
    },
    { 
      id: 'COT-150', 
      cliente: 'Hotel Mérida Central', 
      fecha: '12 Mar 2026', 
      total: 12800.00, 
      estado: 'aceptadas',
      pagadoPorcentaje: 60, 
      conceptos: [{ desc: 'Instalación de tablero industrial', cant: 1, precio: 12800, subtotal: 12800 }],
      comentarioCliente: 'Anticipo del 60% recibido. Pendiente liquidación.'
    },
    { 
      id: 'COT-098', 
      cliente: 'Plaza Altabrisa', 
      fecha: '05 Mar 2026', 
      total: 3200.00, 
      estado: 'rechazadas',
      pagadoPorcentaje: 0,
      conceptos: [{ desc: 'Reparación de cortocircuito', cant: 1, precio: 3200, subtotal: 3200 }],
      comentarioCliente: 'Presupuesto fuera de rango.'
    }
  ]);

  const cotizacionesFiltradas = cotizacionesData.filter(cot => cot.estado === tabActivo);

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
    // Al usar motivoFeedback aquí, el error de ESLint desaparece
    console.log(`Enviando comprobante para ${cotizacionSeleccionada.id}. Nota: ${motivoFeedback}`);
    alert("Comprobante enviado con éxito.");
    navigate('/'); 
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
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

      <div className="quotes-scroll-area">
        {cotizacionesFiltradas.length > 0 ? (
          cotizacionesFiltradas.map((cot) => (
            <div key={cot.id} className={`quote-card-item card-${cot.estado}`} onClick={() => abrirModal(cot)}>
              <div className="quote-card-left">
                <div className="quote-card-icon">
                  {cot.estado === 'nuevas' && <Clock size={20} />}
                  {cot.estado === 'aceptadas' && <CheckCircle size={20} />}
                  {cot.estado === 'rechazadas' && <XCircle size={20} />}
                </div>
                <div className="quote-card-info">
                  <h4>{cot.cliente}</h4>
                  <span>{cot.id} • {cot.fecha}</span>
                </div>
              </div>
              <div className="quote-card-right">
                <div className="price-tag-group">
                  <strong>{formatCurrency(cot.total)}</strong>
                  {cot.estado === 'aceptadas' && cot.pagadoPorcentaje === 60 && <span className="partial-badge">ANTICIPO 60% PAGADO</span>}
                </div>
                <ChevronRight size={18} />
              </div>
            </div>
          ))
        ) : <div className="empty-state">No hay registros aquí.</div>}
      </div>

      {cotizacionSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content-wrapper" onClick={e => e.stopPropagation()}>
            
            {pasoPago === 0 ? (
              <div className="modal-excel-view">
                <header className={`modal-excel-header h-${cotizacionSeleccionada.estado}`}>
                  <div className="header-top-info">
                    <span className="badge-status">{cotizacionSeleccionada.estado.toUpperCase()}</span>
                    <button className="close-modal-btn" onClick={cerrarModal}>&times;</button>
                  </div>
                  <h3>{cotizacionSeleccionada.cliente}</h3>
                </header>
                <div className="modal-excel-body">
                  <div className="excel-table-container">
                    <div className="excel-table-header">
                      <span>DESCRIPCIÓN</span><span>CANT.</span><span>UNITARIO</span><span>SUBTOTAL</span>
                    </div>
                    {cotizacionSeleccionada.conceptos.map((item, i) => (
                      <div key={i} className="excel-row">
                        <span>{item.desc}</span><span>{item.cant}</span><span>{formatCurrency(item.precio)}</span><span>{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                    <div className="excel-total-row">
                      <span>TOTAL DEL SERVICIO</span><strong>{formatCurrency(cotizacionSeleccionada.total)}</strong>
                    </div>
                    
                    {cotizacionSeleccionada.estado === 'nuevas' && (
                      <div className="excel-advance-highlight">
                        <span>Anticipo requerido para iniciar (60%)</span>
                        <strong>{formatCurrency(cotizacionSeleccionada.total * 0.6)}</strong>
                      </div>
                    )}
                    {cotizacionSeleccionada.estado === 'aceptadas' && cotizacionSeleccionada.pagadoPorcentaje === 60 && (
                      <div className="excel-pending-highlight">
                        <span>Monto pendiente por liquidar (40%)</span>
                        <strong>{formatCurrency(cotizacionSeleccionada.total * 0.4)}</strong>
                      </div>
                    )}
                  </div>

                  <div className="feedback-section">
                    <label><MessageSquare size={14} /> Observaciones / Comentarios:</label>
                    <textarea 
                      className="modal-textarea"
                      value={motivoFeedback} 
                      onChange={(e) => setMotivoFeedback(e.target.value)} 
                      placeholder="Escribe un mensaje para Agente Solutions..." 
                    />
                  </div>

                  <div className="modal-actions-dynamic">
                    {cotizacionSeleccionada.estado === 'nuevas' && (
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
                      <div className="status-banner-error">ESTA COTIZACIÓN FUE RECHAZADA</div>
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
                        ? formatCurrency(cotizacionSeleccionada.total * 0.4) 
                        : formatCurrency(cotizacionSeleccionada.total * 0.6)}
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