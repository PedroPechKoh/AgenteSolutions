import React, { useState } from 'react';
import { Clock, ChevronRight, ShoppingBag, Sparkles } from 'lucide-react';
import '../../styles/Cliente/Cotizaciones.css';

const CotizacionesPendientes = () => {
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);

  const cotizacionesEstatica = [
    {
      id: 1,
      titulo: 'Mantenimiento de transformadores',
      folio: 'COT-204',
      fecha: '18 Mar 2026',
      total: 4500,
      estado: 'Pendiente de aprobación',
      descripcion: 'Servicio programado para revisión general.',
      vencida: true,
    },
    {
      id: 2,
      titulo: 'Instalación de tablero industrial',
      folio: 'COT-150',
      fecha: '12 Mar 2026',
      total: 12800,
      estado: 'Esperando respuesta',
      descripcion: 'Incluye mano de obra y materiales.',
      vencida: false,
    },
    {
      id: 3,
      titulo: 'Reparación de cortocircuito',
      folio: 'COT-098',
      fecha: '05 Mar 2026',
      total: 3200,
      estado: 'Pendiente de revisión',
      descripcion: 'Cotización en espera para confirmar.',
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  return (
    <div className="quotes-view-container">
      <header className="quotes-main-header cart-header">
        <div className="header-titles">
          <div className="cart-title-row">
            <ShoppingBag size={24} color="#f26624" />
            <div>
              <h2>Carrito de cotizaciones</h2>
              <p>Vista previa estática de las cotizaciones en espera.</p>
            </div>
          </div>
        </div>
        <div className="cart-summary-pill">
          <Sparkles size={16} />
          {cotizacionesEstatica.length} pendientes
        </div>
      </header>

      <div className="quotes-scroll-area cart-list">
        {cotizacionesEstatica.map((cot) => (
          <div key={cot.id} className="quote-card-item cart-card" onClick={() => setCotizacionSeleccionada(cot)}>
            <div className="card-content-left">
              <div className="quote-card-icon cart-icon">
                <Clock size={20} />
              </div>
              <div className="quote-card-info">
                <div className="quote-card-topline">
                  <h4>{cot.titulo}</h4>
                  <span className="quote-status-label">{cot.estado}</span>
                </div>
                <p className="quote-description">{cot.descripcion}</p>
                <div className="quote-meta-row">
                  <span className="quote-meta-pill">{cot.folio}</span>
                  <span className="quote-meta-pill">{cot.fecha}</span>
                </div>
              </div>
            </div>

            <div className="quote-card-right cart-card-actions">
              <div className="quote-total-box">
                <span>Total</span>
                <strong>{formatCurrency(cot.total)}</strong>
              </div>
              <div className="action-buttons-row">
                <button className="btn-preview">Ver detalle</button>
                <button className="btn-disabled">Próximamente</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cotizacionSeleccionada && (
        <div className="modal-overlay" onClick={() => setCotizacionSeleccionada(null)}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className="modal-excel-view">
              <header className="modal-excel-header h-nuevas">
                <div className="header-top-info">
                  <span className="badge-status">EN ESPERA</span>
                  <button className="close-modal-btn" onClick={() => setCotizacionSeleccionada(null)}>&times;</button>
                </div>
                <h3>{cotizacionSeleccionada.titulo}</h3>
              </header>
              <div className="modal-excel-body">
                <div className="modal-detail-box">
                  <h4>Detalles de la cotización</h4>
                  <p>
                    Esta cotización incluye: inspección técnica, sustitución de componentes
                    menores, pruebas de funcionamiento y reporte final con recomendaciones.
                  </p>
                  <div className="detail-summary-row">
                    <div>
                      <strong>Servicio</strong>
                      <p>Revisión de bobinas y estado de aislamiento.</p>
                    </div>
                    <div>
                      <strong>Tiempo estimado</strong>
                      <p>3 días hábiles</p>
                    </div>
                    <div>
                      <strong>Condición</strong>
                      <p>{cotizacionSeleccionada.vencida ? 'Vencida > 15 días' : 'En tiempo de espera'}</p>
                    </div>
                  </div>
                </div>

                <div className="excel-table-container">
                  <div className="excel-table-header">
                    <span>DETALLE</span>
                    <span>VALOR</span>
                  </div>
                  <div className="excel-row">
                    <span>Folio</span>
                    <span>{cotizacionSeleccionada.folio}</span>
                  </div>
                  <div className="excel-row">
                    <span>Fecha</span>
                    <span>{cotizacionSeleccionada.fecha}</span>
                  </div>
                  <div className="excel-row">
                    <span>Importe</span>
                    <span>{formatCurrency(cotizacionSeleccionada.total)}</span>
                  </div>
                  <div className="excel-row">
                    <span>Estado</span>
                    <span>{cotizacionSeleccionada.estado}</span>
                  </div>
                </div>

                <div className="excel-advance-highlight">
                  <span>Esta vista es solo una demostración visual del frontend.</span>
                </div>
                <div className="modal-actions-row">
                  <button className="btn-accept-final">
                    {cotizacionSeleccionada.vencida ? 'Recotizar de nuevo' : 'Aceptar cotización'}
                  </button>
                </div>
                {cotizacionSeleccionada.vencida && (
                  <div className="modal-expired-note">
                    La cotización ya venció los 15 días de espera, el administrador necesita recotizar nuevamente.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CotizacionesPendientes;
