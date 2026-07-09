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
    },
    {
      id: 2,
      titulo: 'Instalación de tablero industrial',
      folio: 'COT-150',
      fecha: '12 Mar 2026',
      total: 12800,
      estado: 'Esperando respuesta',
      descripcion: 'Incluye mano de obra y materiales.',
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
            <h2>Carrito de cotizaciones</h2>
          </div>
          <p>Vista previa estática de las cotizaciones en espera.</p>
        </div>
        <div className="cart-summary-pill">
          <Sparkles size={16} />
          3 pendientes
        </div>
      </header>

      <div className="quotes-scroll-area cart-list">
        {cotizacionesEstatica.map((cot) => (
          <div key={cot.id} className="quote-card-item cart-card" onClick={() => setCotizacionSeleccionada(cot)}>
            <div className="quote-card-left">
              <div className="quote-card-icon cart-icon">
                <Clock size={20} />
              </div>
              <div className="quote-card-info">
                <h4>{cot.titulo}</h4>
                <span>{cot.folio} • {cot.fecha}</span>
                <p>{cot.descripcion}</p>
              </div>
            </div>
            <div className="quote-card-right">
              <div className="price-tag-group">
                <strong>{formatCurrency(cot.total)}</strong>
                <span className="partial-badge">{cot.estado}</span>
              </div>
              <ChevronRight size={18} />
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CotizacionesPendientes;
