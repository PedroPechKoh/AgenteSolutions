import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../../styles/Admin/VistaCotizaciones.css";
import logo from "../../assets/Logo4.png"; 

const VistaCotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [filtro, setFiltro] = useState('Pendiente');
  const [busqueda, setBusqueda] = useState('');
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);

  const [esCliente, setEsCliente] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('agente_session') || '{}');
      if (session?.userData?.role_id === 3) {
        setEsCliente(true);
      }
    } catch(e) {}
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    try {
      const respuesta = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`);
      setCotizaciones(respuesta.data);
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error);
    } finally {
      setCargando(false);
    }
  };

  const filtradas = cotizaciones.filter(c => {
    const coincideFiltro = 
      (filtro === 'Pendiente' && (c.estado === 'Pendiente' || c.estado === 'En proceso')) ||
      (filtro === 'Aprobado' && c.estado === 'Aprobado') ||
      (filtro === 'Rechazado' && c.estado === 'Rechazado');

    const coincideBusqueda = c.cliente.toLowerCase().includes(busqueda.toLowerCase()) || 
                             c.folio.includes(busqueda);
    return coincideFiltro && coincideBusqueda;
  });

  const verPantallaCompleta = (url) => {
    window.open(url, '_blank');
  };

  const procesarCotizacion = async (status) => {
    if (status === 'Rechazado' && !motivoRechazo.trim()) {
      alert("Por favor, ingresa el motivo del rechazo.");
      return;
    }

    setProcesando(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacionSeleccionada.id}/status`, {
        status,
        rejection_reason: motivoRechazo
      });
      alert(`Cotización ${status.toLowerCase()} exitosamente.`);
      setCotizacionSeleccionada(null);
      setRechazando(false);
      setMotivoRechazo('');
      cargarCotizaciones();
    } catch (error) {
      alert("Error al procesar la cotización.");
    } finally {
      setProcesando(false);
    }
  };

  // 👇 ESTA ES LA FUNCIÓN VITAL QUE TE FALTABA 👇
  const handleImprimirPDF = () => {
    // Guardamos los datos temporalmente
    localStorage.setItem('cotizacion_para_imprimir', JSON.stringify(cotizacionSeleccionada));
    
    // Abrimos la vista en una NUEVA PESTAÑA
    window.open('/imprimir-cotizacion', '_blank'); 
  };
  // 👆 👆 👆

  const renderConceptoDetalle = (conceptoStr) => {
    try {
      const detalle = typeof conceptoStr === 'string' ? JSON.parse(conceptoStr) : conceptoStr;
      
      if (detalle && typeof detalle === 'object' && (detalle.conceptos || detalle.materiales || detalle.herramientas_basicas)) {
        return (
          <div className="detalle-parseado">
            {/* Conceptos / Servicios */}
            {detalle.conceptos && detalle.conceptos.some(c => c.descripcion) && (
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
                    {detalle.conceptos.filter(c => c.descripcion).map((c, i) => (
                      <tr key={i}>
                        <td>{c.descripcion}</td>
                        <td style={{ textAlign: 'center' }}>{c.cantidad || 1}</td>
                        <td style={{ textAlign: 'center' }}>${parseFloat(c.precio_u || 0).toLocaleString('es-MX')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Materiales */}
            {detalle.materiales && detalle.materiales.some(m => m.nombre) && (
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
                    {detalle.materiales.filter(m => m.nombre).map((m, i) => (
                      <tr key={i}>
                        <td>{m.nombre}</td>
                        <td style={{ textAlign: 'center' }}>{m.cantidad || 1}</td>
                        <td style={{ textAlign: 'center' }}>${parseFloat(m.costo_u || 0).toLocaleString('es-MX')}</td>
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
              ${parseFloat(cotizacionSeleccionada.total).toLocaleString('es-MX')}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <div className="cotiz-page">
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      <header className="cotiz-header">
        <img src={logo} alt="Logo" className="logo-top-left" />
      </header>

      <main className="cotiz-main-content">
        <div className="cotiz-search-wrapper">
          <div className="cotiz-search-bar">
            <input 
              type="text" 
              placeholder="BUSCAR CLIENTE O FOLIO..." 
              className="cotiz-input-field"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <span className="cotiz-search-icon">🔍</span>
          </div>
        </div>

        <div className="cotiz-tabs-row">
          <button className={`cotiz-tab-btn ${filtro === 'Pendiente' ? 'active' : ''}`} onClick={() => setFiltro('Pendiente')}>📩 NUEVAS</button>
          <button className={`cotiz-tab-btn ${filtro === 'Aprobado' ? 'active' : ''}`} onClick={() => setFiltro('Aprobado')}>✅ APROBADAS</button>
          <button className={`cotiz-tab-btn ${filtro === 'Rechazado' ? 'active' : ''}`} onClick={() => setFiltro('Rechazado')}>❌ RECHAZADAS</button>
        </div>

        <div className="cotiz-table-container">
          <table className="cotiz-data-table">
            <thead>
              <tr>
                <th>FOLIO</th>
                <th>CLIENTE</th>
                <th>TOTAL</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="4" className="no-data">Cargando cotizaciones...</td></tr>
              ) : filtradas.length > 0 ? (
                filtradas.map((c) => (
                  <tr key={c.id}>
                    <td className="bold-folio">{c.folio}</td>
                    <td className="cliente-name">{c.cliente}</td>
                    <td className="monto-final">
                      {c.tipo === 'archivo' ? 'Ver Archivo' : `$${parseFloat(c.total).toLocaleString('es-MX')}`}
                    </td>
                    <td>
                      <button className="btn-view-detail" onClick={() => setCotizacionSeleccionada(c)}>
                        👁️ VER DETALLE
                      </button>
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
                
                <div className="modal-info-summary">
                  <p><strong>Cliente:</strong> {cotizacionSeleccionada.cliente}</p>
                  <p><strong>Técnico:</strong> {cotizacionSeleccionada.tecnico}</p>
                  <p><strong>Fecha:</strong> {cotizacionSeleccionada.fecha}</p>
                </div>

                {cotizacionSeleccionada.tipo === 'archivo' ? (
                  
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
                        <iframe 
                          src={cotizacionSeleccionada.archivo_url} 
                          title="Vista previa del documento"
                          style={{ width: '100%', height: '50vh', border: 'none', borderRadius: '4px', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                      ) : (
                        <img 
                          src={cotizacionSeleccionada.archivo_url} 
                          alt="Cotización" 
                          style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                        />
                      )
                    ) : (
                      <p style={{ color: 'red', padding: '30px' }}>El archivo no se encuentra disponible.</p>
                    )}
                  </div>

                ) : (
                  renderConceptoDetalle(cotizacionSeleccionada.concepto)
                )}

                <div className="modal-total-section">
                  <h3>TOTAL: ${parseFloat(cotizacionSeleccionada.total).toLocaleString('es-MX')}</h3>
                </div>

                {cotizacionSeleccionada.observaciones && (
                  <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px', marginTop: '15px', borderLeft: '4px solid #ff8800' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#333' }}>Mensajes / Observaciones:</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', whiteSpace: 'pre-wrap' }}>
                      {cotizacionSeleccionada.observaciones}
                    </p>
                  </div>
                )}
                
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

            </div>

            <div className="modal-footer-btns" style={{ flexShrink: 0, justifyContent: 'space-between', display: 'flex' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {esCliente && cotizacionSeleccionada.estado === 'Pendiente' && !rechazando && (
                    <>
                      <button 
                        className="btn-modal-print" 
                        style={{ background: '#2e7d32', color: 'white' }} 
                        onClick={() => procesarCotizacion('Aprobado')}
                        disabled={procesando}
                      >
                        ✓ ACEPTAR COTIZACIÓN
                      </button>
                      <button 
                        className="btn-modal-print" 
                        style={{ background: '#c62828', color: 'white' }} 
                        onClick={() => setRechazando(true)}
                      >
                        ✕ RECHAZAR
                      </button>
                    </>
                  )}
                  {esCliente && rechazando && (
                    <>
                      <button 
                        className="btn-modal-print" 
                        style={{ background: '#c62828', color: 'white' }} 
                        onClick={() => procesarCotizacion('Rechazado')}
                        disabled={procesando}
                      >
                        CONFIRMAR RECHAZO
                      </button>
                      <button 
                        className="btn-modal-print" 
                        style={{ background: '#757575', color: 'white' }} 
                        onClick={() => { setRechazando(false); setMotivoRechazo(''); }}
                      >
                        CANCELAR
                      </button>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {cotizacionSeleccionada.tipo !== 'archivo' && (
                    <button className="btn-modal-print" onClick={handleImprimirPDF}>🖨️ VER PDF</button>
                  )}
                  <button className="btn-modal-close" onClick={() => { setCotizacionSeleccionada(null); setRechazando(false); setMotivoRechazo(''); }}>CERRAR</button>
                </div>
            </div>
          </div>
        </div>
      )}

      <button className="back-arrow-fixed" onClick={() => window.history.back()}>←</button>
    </div>
  );
};

export default VistaCotizaciones;