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

    const coincideBusqueda =
      c.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.folio.includes(busqueda);

    return coincideFiltro && coincideBusqueda;
  });

  const verPantallaCompleta = (url) => {
    window.open(url, '_blank');
  };

  const procesarCotizacion = async (status) => {
    if (status === 'Rechazado' && !motivoRechazo.trim()) {
      alert("Ingresa el motivo del rechazo.");
      return;
    }

    setProcesando(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacionSeleccionada.id}/status`, {
        status,
        rejection_reason: motivoRechazo
      });

      alert(`Cotización ${status.toLowerCase()} correctamente.`);
      setCotizacionSeleccionada(null);
      setRechazando(false);
      setMotivoRechazo('');
      cargarCotizaciones();

    } catch (error) {
      console.error(error);
      alert("Error al procesar.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="cotiz-page">
<div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
  <button onClick={() => setFiltro('Pendiente')}>
    📩 NUEVAS
  </button>

  <button onClick={() => setFiltro('Aprobado')}>
    ✅ APROBADAS
  </button>

  <button onClick={() => setFiltro('Rechazado')}>
    ❌ RECHAZADAS
  </button>
</div>
      <main className="cotiz-main-content">

        <input
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {cargando ? (
              <tr><td colSpan="4">Cargando...</td></tr>
            ) : filtradas.map((c) => (
              <tr key={c.id}>
                <td>{c.folio}</td>
                <td>{c.cliente}</td>
                <td>${parseFloat(c.total).toLocaleString('es-MX')}</td>
                <td>
                  <button onClick={() => setCotizacionSeleccionada(c)}>
                    VER
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </main>

      {/* MODAL */}
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

                /* 🔥 DISEÑO PROFESIONAL */
                <div className="printable-quote">

                  {/* HEADER */}
                  <div className="quote-header">
                    <div>
                      <img src={logo} className="quote-logo" />
                      <h2>AGENTE SOLUTIONS</h2>
                      <p>Soluciones tecnológicas</p>
                    </div>

                    <div>
                      <h1>COTIZACIÓN</h1>
                      <h3>#{cotizacionSeleccionada.folio}</h3>
                    </div>
                  </div>

                  <div className="quote-divider"></div>

                  {/* INFO */}
                  <div className="quote-info">
                    <p><strong>Cliente:</strong> {cotizacionSeleccionada.cliente}</p>
                    <p><strong>Técnico:</strong> {cotizacionSeleccionada.tecnico}</p>
                    <p><strong>Fecha:</strong> {cotizacionSeleccionada.fecha}</p>
                  </div>

                  {/* TABLA */}
                  <table className="quote-table">
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{cotizacionSeleccionada.concepto}</td>
                        <td>${parseFloat(cotizacionSeleccionada.total).toLocaleString('es-MX')}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* TOTAL */}
                  <div className="quote-total-box">
                    TOTAL: ${parseFloat(cotizacionSeleccionada.total).toLocaleString('es-MX')}
                  </div>

                  {/* OBSERVACIONES */}
                  {cotizacionSeleccionada.observaciones && (
                    <div className="quote-notes">
                      <h4>Observaciones</h4>
                      <p>{cotizacionSeleccionada.observaciones}</p>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* FOOTER */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>

              <div>
                {esCliente && cotizacionSeleccionada.estado === 'Pendiente' && !rechazando && (
                  <>
                    <button disabled={procesando} onClick={() => procesarCotizacion('Aprobado')}>
                      ✓ ACEPTAR
                    </button>

                    <button onClick={() => setRechazando(true)}>
                      ✕ RECHAZAR
                    </button>
                  </>
                )}

                {rechazando && (
                  <>
                    <textarea
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                    />

                    <button onClick={() => procesarCotizacion('Rechazado')}>
                      CONFIRMAR
                    </button>

                    <button onClick={() => setRechazando(false)}>
                      CANCELAR
                    </button>
                  </>
                )}
              </div>

              <div>
                <button onClick={() => window.print()}>PDF</button>
                <button onClick={() => setCotizacionSeleccionada(null)}>Cerrar</button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default VistaCotizaciones;