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
        } catch(e) {}
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
      try { detalle = JSON.parse(detalle); } catch(e) {}
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
                    <p>{getConceptoText(cot)}</p>
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
                    <span>{typeof cotizacionSeleccionada.observations === 'object' ? JSON.stringify(cotizacionSeleccionada.observations) : (cotizacionSeleccionada.observations || 'Esperando respuesta de Agente Solutions.')}</span>
                  </div>
                </div>

                {renderDetalleConceptoModal(cotizacionSeleccionada)}

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