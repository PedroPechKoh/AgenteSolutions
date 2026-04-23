import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../Shared/Header'; 
import UniversalSearch from '../Shared/UniversalSearch'; 
import '../../styles/Admin/VistaCotizaciones.css';

const VistaCotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cotizacionesFiltradas, setCotizacionesFiltradas] = useState([]); 
  const [cargando, setCargando] = useState(true);

  const [filtro, setFiltro] = useState('Pendiente');
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
    } catch {}
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
    } catch {
      alert("Error al procesar la cotización.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="main-container bg-light">
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      <Header rolTexto="COTIZACIONES" />

      <section className="content-area">
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          
          <div className="cotiz-tabs-row" style={{ margin: 0 }}>
            <button className={`cotiz-tab-btn ${filtro === 'Pendiente' ? 'active' : ''}`} onClick={() => setFiltro('Pendiente')}>📩 NUEVAS</button>
            <button className={`cotiz-tab-btn ${filtro === 'Aprobado' ? 'active' : ''}`} onClick={() => setFiltro('Aprobado')}>✅ APROBADAS</button>
            <button className={`cotiz-tab-btn ${filtro === 'Rechazado' ? 'active' : ''}`} onClick={() => setFiltro('Rechazado')}>❌ RECHAZADAS</button>
          </div>

          <div style={{ width: '100%', maxWidth: '900px' }}>
            <UniversalSearch
              type="COTIZACIONES"
              data={cotizaciones}
              setFilteredData={setCotizacionesFiltradas}
              filtroActual={filtro}
              placeholder="BUSCAR CLIENTE O FOLIO..."
            />
          </div>

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
              ) : cotizacionesFiltradas.length > 0 ? (
                cotizacionesFiltradas.map((c) => (
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
      </section>

      {/* ✅ MODAL DE DETALLES */}
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
                  <>
                    <table className="modal-items-table">
                      <thead>
                        <tr>
                          <th>Descripción del Servicio</th>
                          <th style={{ textAlign: 'center' }}>Total Estimado</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            {(() => {
                              try {
                                const detalle = typeof cotizacionSeleccionada.concepto === 'string' 
                                                ? JSON.parse(cotizacionSeleccionada.concepto) 
                                                : cotizacionSeleccionada.concepto;
                                
                                if (!detalle || typeof detalle !== 'object' || !detalle.conceptos) {
                                  return <span>{String(cotizacionSeleccionada.concepto)}</span>;
                                }

                                return (
                                  <div style={{ textAlign: 'left', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                    
                                    {detalle.conceptos && detalle.conceptos.length > 0 && detalle.conceptos.some(c => c.descripcion) && (
                                      <div style={{ marginBottom: '10px' }}>
                                        <strong style={{ color: '#FF6600' }}>Conceptos / Mano de Obra:</strong>
                                        <ul style={{ margin: '5px 0', paddingLeft: '20px', color: '#444' }}>
                                          {detalle.conceptos.filter(c => c.descripcion).map((item, idx) => (
                                            <li key={idx}>
                                              {item.descripcion} (Cant: {item.cantidad}) - ${item.precio_u} c/u
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {detalle.materiales && detalle.materiales.length > 0 && detalle.materiales.some(m => m.nombre) && (
                                      <div style={{ marginBottom: '10px' }}>
                                        <strong style={{ color: '#FF6600' }}>Materiales:</strong>
                                        <ul style={{ margin: '5px 0', paddingLeft: '20px', color: '#444' }}>
                                          {detalle.materiales.filter(m => m.nombre).map((item, idx) => (
                                            <li key={idx}>
                                              {item.nombre} (Cant: {item.cantidad}) - ${item.costo_u} c/u
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {detalle.herramientas_especiales && detalle.herramientas_especiales.length > 0 && detalle.herramientas_especiales.some(h => h.nombre) && (
                                      <div>
                                        <strong style={{ color: '#FF6600' }}>Herramientas Especiales:</strong>
                                        <ul style={{ margin: '5px 0', paddingLeft: '20px', color: '#444' }}>
                                          {detalle.herramientas_especiales.filter(h => h.nombre).map((item, idx) => (
                                            <li key={idx}>
                                              {item.nombre} (Cant: {item.cantidad})
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                  </div>
                                );
                              } catch (e) {
                                return <span>{String(cotizacionSeleccionada.concepto)}</span>;
                              }
                            })()}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', verticalAlign: 'top', paddingTop: '15px' }}>
                            ${parseFloat(cotizacionSeleccionada.total).toLocaleString('es-MX')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </>
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
                    <button className="btn-modal-print" onClick={() => window.print()}>🖨️ PDF</button>
                  )}
                  <button className="btn-modal-close" onClick={() => { setCotizacionSeleccionada(null); setRechazando(false); setMotivoRechazo(''); }}>CERRAR</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaCotizaciones;