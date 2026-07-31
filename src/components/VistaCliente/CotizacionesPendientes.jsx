import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, ShoppingBag, Sparkles, CheckSquare, Square, 
  CreditCard, ShieldCheck, Info, ChevronRight, Eye, CheckCircle2
} from 'lucide-react';
import '../../styles/Cliente/Cotizaciones.css';

const CotizacionesPendientes = () => {
  const navigate = useNavigate();
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lista base estática por si la API aún no tiene datos o está fuera de línea
  const cotizacionesIniciales = [
    {
      id: 1,
      titulo: 'Mantenimiento de transformadores',
      folio: 'COT-204',
      fecha: '18 Mar 2026',
      total: 4500,
      estado: 'Pendiente de aprobación',
      descripcion: 'Servicio programado para revisión general de aislamiento y aceite.',
      vencida: false,
    },
    {
      id: 2,
      titulo: 'Instalación de tablero industrial',
      folio: 'COT-150',
      fecha: '12 Mar 2026',
      total: 12800,
      estado: 'Esperando respuesta',
      descripcion: 'Incluye mano de obra calificada, cableado y materiales de grado industrial.',
      vencida: false,
    },
    {
      id: 3,
      titulo: 'Reparación de cortocircuito',
      folio: 'COT-098',
      fecha: '05 Mar 2026',
      total: 3200,
      estado: 'Pendiente de revisión',
      descripcion: 'Cotización en espera para confirmación de diagnóstico en sitio.',
      vencida: false,
    },
    {
      id: 4,
      titulo: 'Sistema de Tierra Física y Pararrayos',
      folio: 'COT-310',
      fecha: '22 Mar 2026',
      total: 8900,
      estado: 'Pendiente de aprobación',
      descripcion: 'Medición de resistividad de terreno y colocación de varillas de cobre.',
      vencida: false,
    }
  ];

  const [cotizaciones, setCotizaciones] = useState(cotizacionesIniciales);
  // Inicialmente seleccionamos todas las cotizaciones como en Shein/Temu al abrir el carrito
  const [selectedIds, setSelectedIds] = useState([1, 2, 3, 4]);

  useEffect(() => {
    const fetchCotizaciones = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        
        const res = await axios.get(`${API_URL}/cotizaciones`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let data = [];
        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (res.data && Array.isArray(res.data.quotes || res.data.data)) {
          data = res.data.quotes || res.data.data;
        }

        // Filtrar cotizaciones que están en estado pendiente o en espera (no aceptadas ni rechazadas)
        const pendientesAPI = data.filter(cot => {
          const st = String(cot.status || cot.estado || '').toLowerCase();
          return !st.includes('aceptad') && !st.includes('aprob') && !st.includes('rechaz') && !st.includes('cancel');
        });

        if (pendientesAPI.length > 0) {
          const mapeadas = pendientesAPI.map(item => ({
            id: item.id,
            titulo: item.concept || item.concepto || item.titulo || `Cotización #${item.id}`,
            folio: item.folio || `COT-${item.id}`,
            fecha: item.created_at ? new Date(item.created_at).toLocaleDateString('es-MX') : 'Fecha reciente',
            total: Number(item.total_amount || item.monto || item.total || 0),
            estado: item.status || item.estado || 'Pendiente de aprobación',
            descripcion: item.observations || item.descripcion || 'Servicio registrado en espera.',
            vencida: false
          }));
          setCotizaciones(mapeadas);
          setSelectedIds(mapeadas.map(c => c.id));
        }
      } catch (err) {
        console.warn("Utilizando datos locales para el carrito de cotizaciones en espera:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCotizaciones();
  }, []);

  // Manejadores de selección de cotizaciones
  const handleToggleSelect = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedIds.length === cotizaciones.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cotizaciones.map(c => c.id));
    }
  };

  // Cálculo del total acumulado estilo Shein / Temu
  const cotizacionesSeleccionadas = cotizaciones.filter(c => selectedIds.includes(c.id));
  const totalAcumulado = cotizacionesSeleccionadas.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const handleProcederPago = () => {
    if (cotizacionesSeleccionadas.length === 0) {
      alert("Por favor selecciona al menos un servicio para proceder al pago.");
      return;
    }
    // Redireccionar al flujo de pago pasando las cotizaciones seleccionadas
    navigate('/vista-cotizaciones', { 
      state: { 
        cotizacionesAPagar: cotizacionesSeleccionadas,
        totalAcumulado 
      } 
    });
  };

  return (
    <div className="quotes-view-container cart-page-container">
      {/* Encabezado Principal */}
      <header className="quotes-main-header cart-header">
        <div className="header-titles">
          <div className="cart-title-row">
            <div className="cart-icon-badge">
              <ShoppingBag size={28} color="#f26624" />
            </div>
            <div>
              <h2>Carrito de Cotizaciones y Servicios</h2>
              <p>Selecciona los servicios en espera para acumular la suma y proceder al pago.</p>
            </div>
          </div>
        </div>
        <div className="cart-summary-pill">
          <Sparkles size={16} />
          {cotizaciones.length} servicios en espera
        </div>
      </header>

      {/* Grid Principal: Lista + Resumen Lateral */}
      <div className="cart-main-grid">
        {/* Columna Izquierda: Lista de Cotizaciones */}
        <div className="cart-items-column">
          {/* Barra de Selección Masiva */}
          <div className="cart-selection-bar">
            <div className="select-all-toggle" onClick={handleToggleAll}>
              {selectedIds.length === cotizaciones.length && cotizaciones.length > 0 ? (
                <CheckSquare size={22} className="checkbox-icon checked" />
              ) : (
                <Square size={22} className="checkbox-icon" />
              )}
              <span className="select-all-text">
                Seleccionar todos ({selectedIds.length}/{cotizaciones.length})
              </span>
            </div>
            {selectedIds.length > 0 && (
              <span className="selected-count-badge">
                {selectedIds.length} {selectedIds.length === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}
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
                const isSelected = selectedIds.includes(cot.id);
                return (
                  <div 
                    key={cot.id} 
                    className={`quote-card-item cart-card-row ${isSelected ? 'selected-row' : ''}`}
                    onClick={() => handleToggleSelect(cot.id)}
                  >
                    {/* Checkbox de Selección */}
                    <div 
                      className="cart-checkbox-wrapper" 
                      onClick={(e) => handleToggleSelect(cot.id, e)}
                    >
                      {isSelected ? (
                        <CheckSquare size={22} className="checkbox-icon checked" />
                      ) : (
                        <Square size={22} className="checkbox-icon" />
                      )}
                    </div>

                    {/* Información Principal del Servicio */}
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
                          <span className="quote-meta-pill">Folio: <strong>{cot.folio}</strong></span>
                          <span className="quote-meta-pill">{cot.fecha}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lado Derecho: Total e Inspección */}
                    <div className="quote-card-right cart-card-actions">
                      <div className="quote-total-box">
                        <span>Importe total</span>
                        <strong>{formatCurrency(cot.total)}</strong>
                      </div>
                      <button 
                        className="btn-preview" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCotizacionSeleccionada(cot);
                        }}
                      >
                        <Eye size={15} style={{ marginRight: '4px' }} /> Ver detalle
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
                {cotizacionesSeleccionadas.length} ítems
              </span>
            </div>

            <div className="summary-divider"></div>

            {/* Desglose Rápido de Ítems Seleccionados */}
            <div className="selected-items-breakdown">
              <h4>Servicios incluidos:</h4>
              {cotizacionesSeleccionadas.length === 0 ? (
                <p className="no-selection-msg">Marca al menos un servicio para ver el desglose y calcular el total.</p>
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
                <small>IVA incluido (si aplica)</small>
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
              <span>Pagos procesados de forma 100% segura con Agente Solutions.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Cotización */}
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
                      <strong>Estado actual</strong>
                      <p>{cotizacionSeleccionada.estado}</p>
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
                  <span>Monto acumulable en el carrito de compras.</span>
                  <strong>{formatCurrency(cotizacionSeleccionada.total)} MXN</strong>
                </div>
                
                <div className="modal-actions-row">
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
