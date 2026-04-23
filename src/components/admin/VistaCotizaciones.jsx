import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin/VistaCotizaciones.css';
import '../../styles/VistaCotizacionPrint.css'; // Importamos el CSS de impresión
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
    } catch {
      alert("Error al procesar la cotización.");
    } finally {
      setProcesando(false);
    }
  };

  // Función para calcular IVA (16%) y Subtotal dinámicamente
  const calcularValores = (total) => {
    const t = parseFloat(total) || 0;
    const subtotal = t / 1.16;
    const iva = t - subtotal;
    return {
      subtotal: subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      iva: iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      total: t.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    };
  };

  return (
    <div className="cotiz-page">
      <div className="top-bar-orange no-print"></div>
      <div className="top-bar-black no-print"></div>

      <header className="cotiz-header no-print">
        <img src={logo} alt="Logo" className="logo-top-left" />
      </header>

      <main className="cotiz-main-content no-print">
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
                <tr><td colSpan="4" className="no-data">No se encontraron resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL CON FORMATO DE IMPRESIÓN DINÁMICO */}
      {cotizacionSeleccionada && (
        <div className="modal-fixed-overlay" onClick={() => setCotizacionSeleccionada(null)}>
          <div className="modal-box-card" style={{ maxHeight: '95vh', width: '90%', maxWidth: '1000px', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            
            <div className="modal-header-dark no-print">
                <span>DETALLE DE COTIZACIÓN {cotizacionSeleccionada.folio}</span>
                <button className="modal-close-icon" onClick={() => { setCotizacionSeleccionada(null); setRechazando(false); setMotivoRechazo(''); }}>&times;</button>
            </div>
            
            <div className="modal-body-content" style={{ overflowY: 'auto', flexGrow: 1, padding: '0' }}>
                
                {cotizacionSeleccionada.tipo === 'archivo' ? (
                  <div className="no-print" style={{ padding: '20px' }}>
                     {/* Vista de archivo anterior mantenida para PDFs externos */}
                     {cotizacionSeleccionada.archivo_url && (
                        <button onClick={() => verPantallaCompleta(cotizacionSeleccionada.archivo_url)} className="btn-view-detail">⛶ Ver Pantalla Completa</button>
                     )}
                     <iframe src={cotizacionSeleccionada.archivo_url} style={{ width: '100%', height: '60vh', border: 'none' }} />
                  </div>
                ) : (
                  /* --- FORMATO DE IMPRESIÓN INTEGRADO --- */
                  <div className="cotizacion-container">
                    <div className="header">
                      <div className="header-left">
                        <img src={logo} alt="logo" className="logo" />
                        <div className="info-cliente">
                          <p>ATENCION A:</p>
                          <h2>{cotizacionSeleccionada.cliente.toUpperCase()}</h2>
                          <p>LOCACION:</p>
                          <h3>{cotizacionSeleccionada.locacion || 'MÉRIDA, YUCATÁN'}</h3>
                        </div>
                      </div>
                      <div className="header-right">
                        <div className="fecha-box">
                          <span>FECHA DE COTIZACIÓN</span>
                          <p>{cotizacionSeleccionada.fecha || new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="linea"></div>

                    <div className="tabla-container">
                      <table className="tabla">
                        <thead>
                          <tr>
                            <th>NO</th>
                            <th>CONCEPTO</th>
                            <th>CANT</th>
                            <th>U/S</th>
                            <th>PRECIO/U</th>
                            <th>PRECIO</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>1</td>
                            <td style={{ textAlign: 'left' }}>{cotizacionSeleccionada.concepto}</td>
                            <td>1</td>
                            <td>S</td>
                            <td>${parseFloat(cotizacionSeleccionada.total / 1.16).toLocaleString('es-MX')}</td>
                            <td>${parseFloat(cotizacionSeleccionada.total / 1.16).toLocaleString('es-MX')}</td>
                          </tr>

                          {/* FILAS DE TOTALES DINÁMICOS */}
                          <tr className="totales">
                            <td colSpan="4" style={{ border: 'none' }}></td>
                            <td className="label">SUBTOTAL</td>
                            <td className="subtotal">${calcularValores(cotizacionSeleccionada.total).subtotal}</td>
                          </tr>
                          <tr className="totales">
                            <td colSpan="4" style={{ border: 'none' }}></td>
                            <td className="label">IVA (16%)</td>
                            <td>${calcularValores(cotizacionSeleccionada.total).iva}</td>
                          </tr>
                          <tr className="totales total-final">
                            <td colSpan="4" style={{ border: 'none' }}></td>
                            <td className="label">TOTAL</td>
                            <td>${calcularValores(cotizacionSeleccionada.total).total}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="notas">
                      <ul>
                        <li>EN CASO DE NO REQUERIR FACTURA EL PRECIO DE LOS EQUIPOS ES MAS IVA, MANO DE OBRA SIN IVA.</li>
                        <li>EL CLIENTE PROPORCIONARÁ FACILIDADES PARA EL CUMPLIMIENTO DE LOS TRABAJOS</li>
                        <li>SE REQUIERE UN 70% DE ANTICIPO PARA INICIAR EL SERVICIO</li>
                        <li>LA PRESENTE COTIZACIÓN TIENE UNA VIGENCIA DE 15 DIAS</li>
                      </ul>
                    </div>

                    <div className="fiscales">
                      <h3>DATOS FISCALES</h3>
                      <p><strong>JORGE ERNESTO VALLARTA SOSA</strong></p>
                      <p><strong>RFC:</strong> VASJ820324779 | <strong>TEL:</strong> 9992426030</p>
                      <p><strong>DIRECCIÓN:</strong> CALLE 23 No. 137 POR 20A XCANATUN. MERIDA, YUCATAN</p>
                      <p>Vallofacturas@gmail.com</p>
                    </div>
                  </div>
                )}

                {/* Sección de rechazo (Solo visible en pantalla, no en impresión) */}
                {rechazando && (
                  <div className="no-print" style={{ padding: '15px', background: '#ffebee' }}>
                    <label style={{ fontWeight: 'bold', color: '#b71c1c' }}>Motivo del rechazo:</label>
                    <textarea
                      style={{ width: '100%', padding: '10px', marginTop: '10px' }}
                      rows="3"
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                    />
                  </div>
                )}
            </div>

            <div className="modal-footer-btns no-print" style={{ padding: '15px', borderTop: '1px solid #ddd' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {esCliente && cotizacionSeleccionada.estado === 'Pendiente' && !rechazando && (
                    <>
                      <button className="btn-modal-print" style={{ background: '#2e7d32', color: 'white' }} onClick={() => procesarCotizacion('Aprobado')} disabled={procesando}>✓ ACEPTAR</button>
                      <button className="btn-modal-print" style={{ background: '#c62828', color: 'white' }} onClick={() => setRechazando(true)}>✕ RECHAZAR</button>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {cotizacionSeleccionada.tipo !== 'archivo' && (
                    <button className="btn-modal-print" onClick={() => window.print()}>🖨️ IMPRIMIR / PDF</button>
                  )}
                  <button className="btn-modal-close" onClick={() => { setCotizacionSeleccionada(null); setRechazando(false); setMotivoRechazo(''); }}>CERRAR</button>
                </div>
            </div>
          </div>
        </div>
      )}

      <button className="back-arrow-fixed no-print" onClick={() => window.history.back()}>←</button>
    </div>
  );
};

export default VistaCotizaciones;