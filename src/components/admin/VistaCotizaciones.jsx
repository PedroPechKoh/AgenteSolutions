import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin/VistaCotizaciones.css';
import logo from "../../assets/Logo4.png";

const VistaCotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [filtro, setFiltro] = useState('Pendiente');
  const [busqueda, setBusqueda] = useState('');
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    try {
      const respuesta = await axios.get('http://127.0.0.1:8000/api/cotizaciones');
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

      {/* MODAL DETALLE */}
      {cotizacionSeleccionada && (
        <div className="modal-fixed-overlay" onClick={() => setCotizacionSeleccionada(null)}>
          {/* Añadí maxHeight y overflow para que si el PDF es largo, el modal no se salga de la pantalla */}
          <div className="modal-box-card" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            
            <div className="modal-header-dark" style={{ flexShrink: 0 }}>
                <span>DETALLE DE COTIZACIÓN {cotizacionSeleccionada.folio}</span>
                <button className="modal-close-icon" onClick={() => setCotizacionSeleccionada(null)}>&times;</button>
            </div>
            
            {/* Contenedor scrolleable interno */}
            <div className="modal-body-content" style={{ overflowY: 'auto', flexGrow: 1 }}>
                
                <div className="modal-info-summary">
                  <p><strong>Cliente:</strong> {cotizacionSeleccionada.cliente}</p>
                  <p><strong>Técnico:</strong> {cotizacionSeleccionada.tecnico}</p>
                  <p><strong>Fecha:</strong> {cotizacionSeleccionada.fecha}</p>
                </div>

                {cotizacionSeleccionada.tipo === 'archivo' ? (
                  
                  /* VISTA DE ARCHIVO (CENTRADA Y AJUSTADA) */
                  <div style={{ position: 'relative', background: '#e0e0e0', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
                    
                    {/* BOTÓN PANTALLA COMPLETA */}
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
                        /* 👇 AQUÍ ES DONDE SUCEDE LA MAGIA DEL PDF 👇 */
                        <iframe 
                          src={cotizacionSeleccionada.archivo_url} 
                          title="Vista previa del documento"
                          style={{ width: '100%', height: '50vh', border: 'none', borderRadius: '4px', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                      ) : (
                        /* IMAGEN CENTRADA */
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
                  
                  /* VISTA MANUAL */
                  <>
                    <table className="modal-items-table">
                      <thead>
                        <tr>
                          <th>Descripción</th>
                          <th style={{ textAlign: 'center' }}>Total Estimado</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{cotizacionSeleccionada.concepto}</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                            ${parseFloat(cotizacionSeleccionada.total).toLocaleString('es-MX')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}

                {/* EL TOTAL SE MUESTRA SIEMPRE ABAJO (A menos que sea archivo sin precio) */}
                <div className="modal-total-section">
                  <h3>TOTAL: ${parseFloat(cotizacionSeleccionada.total).toLocaleString('es-MX')}</h3>
                </div>

            </div>

            <div className="modal-footer-btns" style={{ flexShrink: 0 }}>
                {cotizacionSeleccionada.tipo !== 'archivo' && (
                  <button className="btn-modal-print" onClick={() => window.print()}>🖨️ PDF</button>
                )}
                <button className="btn-modal-close" onClick={() => setCotizacionSeleccionada(null)}>CERRAR</button>
            </div>
          </div>
        </div>
      )}

      <button className="back-arrow-fixed" onClick={() => window.history.back()}>←</button>
    </div>
  );
};

export default VistaCotizaciones;