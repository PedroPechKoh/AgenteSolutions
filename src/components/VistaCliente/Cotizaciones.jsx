import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import axios from 'axios';
import '../../styles/Cliente/Cotizaciones.css';

const Cotizaciones = () => {
  const [cotizacionesData, setCotizacionesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCotizaciones = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`);
        const quotes = Array.isArray(response.data) ? response.data : [];
        setCotizacionesData(quotes);
      } catch (err) {
        console.error('Error cargando cotizaciones:', err);
        setError('No se pudieron cargar tus cotizaciones en este momento.');
      } finally {
        setLoading(false);
      }
    };

    fetchCotizaciones();
  }, []);

  const isPendingQuote = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    return !['aprobado', 'rechazado', 'aceptado', 'cancelado', 'cancelada'].includes(normalized);
  };

  const cotizacionesFiltradas = cotizacionesData.filter((cot) => isPendingQuote(cot.status));

  const abrirModal = (cot) => {
    setCotizacionSeleccionada(cot);
  };

  const cerrarModal = () => {
    setCotizacionSeleccionada(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(amount || 0));
  };

  return (
    <div className="quotes-view-container">
      <header className="quotes-main-header">
        <div className="header-titles">
          <h2>Cotizaciones pendientes</h2>
          <p>Estas son tus solicitudes que aún no fueron aceptadas ni rechazadas.</p>
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
              <div key={cot.id} className="quote-card-item card-nuevas" onClick={() => abrirModal(cot)}>
                <div className="quote-card-left">
                  <div className="quote-card-icon">
                    <Clock size={20} />
                  </div>
                  <div className="quote-card-info">
                    <h4>{cot.propiedad_nombre || cot.cliente || 'Cotización pendiente'}</h4>
                    <span>{cot.folio || `#${cot.id}`} • {cot.fecha || 'Sin fecha'}</span>
                    <p>{cot.concept || cot.observations || 'Esperando respuesta de Agente Solutions.'}</p>
                  </div>
                </div>
                <div className="quote-card-right">
                  <div className="price-tag-group">
                    <strong>{formatCurrency(cot.total)}</strong>
                    <span className="partial-badge">PENDIENTE</span>
                  </div>
                  <ChevronRight size={18} />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No tienes cotizaciones pendientes por el momento.</div>
          )}
        </div>
      )}

      {cotizacionSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className="modal-excel-view">
              <header className="modal-excel-header h-nuevas">
                <div className="header-top-info">
                  <span className="badge-status">PENDIENTE</span>
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
                    <span>Importe</span>
                    <span>{formatCurrency(cotizacionSeleccionada.total)}</span>
                  </div>
                  <div className="excel-row">
                    <span>Observaciones</span>
                    <span>{cotizacionSeleccionada.observations || 'Esperando respuesta de Agente Solutions.'}</span>
                  </div>
                </div>

                <div className="excel-advance-highlight">
                  <span>Tu cotización sigue pendiente de aprobación o rechazo.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cotizaciones;