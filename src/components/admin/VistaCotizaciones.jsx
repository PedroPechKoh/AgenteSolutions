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
    } catch (error) {
      console.error(error);
    }
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
      console.error(error);
      alert("Error al procesar la cotización.");
    } finally {
      setProcesando(false);
    }
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
                <tr><td colSpan="4" className="no-data">Cargando...</td></tr>
              ) : filtradas.map((c) => (
                <tr key={c.id}>
                  <td>{c.folio}</td>
                  <td>{c.cliente}</td>
                  <td>${parseFloat(c.total).toLocaleString('es-MX')}</td>
                  <td>
                    <button onClick={() => setCotizacionSeleccionada(c)}>
                      👁️ VER
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {cotizacionSeleccionada && (
        <div className="modal-fixed-overlay">
          <div className="modal-box-card">

            <div className="modal-body-content">

              {cotizacionSeleccionada.tipo === 'archivo' ? (
                <>
                  <button onClick={() => verPantallaCompleta(cotizacionSeleccionada.archivo_url)}>
                    ⛶ Pantalla completa
                  </button>

                  <iframe 
                    src={cotizacionSeleccionada.archivo_url} 
                    style={{ width: '100%', height: '400px' }}
                  />
                </>
              ) : (

                <div className="printable-quote">

                  <div className="quote-header">
                    <div>
                      <img src={logo} className="quote-logo" />
                      <h2>AGENTE SOLUTIONS</h2>
                    </div>

                    <div>
                      <h1>COTIZACIÓN</h1>
                      <p>{cotizacionSeleccionada.folio}</p>
                    </div>
                  </div>

                  <p>Cliente: {cotizacionSeleccionada.cliente}</p>

                  <table className="quote-table">
                    <tbody>
                      <tr>
                        <td>{cotizacionSeleccionada.concepto}</td>
                        <td>${cotizacionSeleccionada.total}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h2>Total: ${cotizacionSeleccionada.total}</h2>

                </div>
              )}

            </div>

          <div className="modal-footer-btns" style={{ display: 'flex', justifyContent: 'space-between' }}>
  
  {/* IZQUIERDA (CLIENTE) */}
  <div style={{ display: 'flex', gap: '10px' }}>
    
    {esCliente && cotizacionSeleccionada.estado === 'Pendiente' && !rechazando && (
      <>
        <button 
          disabled={procesando}
          onClick={() => procesarCotizacion('Aprobado')}
          style={{ background: '#2e7d32', color: 'white' }}
        >
          ✓ ACEPTAR
        </button>

        <button 
          onClick={() => setRechazando(true)}
          style={{ background: '#c62828', color: 'white' }}
        >
          ✕ RECHAZAR
        </button>
      </>
    )}

    {rechazando && (
      <>
        <textarea
          placeholder="Motivo del rechazo..."
          value={motivoRechazo}
          onChange={(e) => setMotivoRechazo(e.target.value)}
          style={{ padding: '8px', borderRadius: '6px' }}
        />

        <button 
          disabled={procesando}
          onClick={() => procesarCotizacion('Rechazado')}
          style={{ background: '#c62828', color: 'white' }}
        >
          CONFIRMAR
        </button>

        <button 
          onClick={() => {
            setRechazando(false);
            setMotivoRechazo('');
          }}
        >
          CANCELAR
        </button>
      </>
    )}

  </div>

  {/* DERECHA */}
  <div style={{ display: 'flex', gap: '10px' }}>
    <button onClick={() => window.print()}>
      🖨️ PDF
    </button>

    <button onClick={() => setCotizacionSeleccionada(null)}>
      CERRAR
    </button>
  </div>

</div>

          </div>
        </div>
      )}

    </div>
  );
};

export default VistaCotizaciones;