import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/Admin/VistaLevantamientos.css";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import Header from "../Shared/Header";

const VistaLevantamientos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClient = user?.role_id === 3;

  const [tabActual, setTabActual] = useState("PENDIENTES");
  const [busqueda, setBusqueda] = useState("");

  // ESTADOS PARA DATOS REALES
  const [servicios, setServicios] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ESTADOS PARA ASIGNACIÓN
  const [mostrarAsignar, setMostrarAsignar] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [datosAsignacion, setDatosAsignacion] = useState({
    tecnico_id: "",
    fecha: "",
    hora: "",
  });

  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  const abrirDatePicker = () => {
    if (dateInputRef.current && dateInputRef.current.showPicker) {
      dateInputRef.current.showPicker();
    } else {
      dateInputRef.current.click();
    }
  };

  const abrirTimePicker = () => {
    if (timeInputRef.current && timeInputRef.current.showPicker) {
      timeInputRef.current.showPicker();
    } else {
      timeInputRef.current.click();
    }
  };

  //Modales del Cliente
  const [modalClientePaso, setModalClientePaso] = useState(0);
  const [motivoReprogramar, setMotivoReprogramar] = useState("");
  const [fechaSugerida, setFechaSugerida] = useState("");

  // 1. CARGAR SERVICIOS Y TÉCNICOS AL INICIAR
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Solo cargamos los técnicos si NO es cliente (para ahorrar datos)
        const peticiones = [axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios`)];
        if (!isClient) {
          peticiones.push(
            axios.get(`${import.meta.env.VITE_API_BASE_URL}/usuarios/tecnicos`),
          );
        }

        const respuestas = await Promise.all(peticiones);
        setServicios(respuestas[0].data);

        if (!isClient) {
          setTecnicos(respuestas[1].data);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [isClient]);

  // 2. FILTRADO LÓGICO
  const filtrados = servicios.filter((s) => {
    const coincideTab =
      tabActual === "REALIZADOS"
        ? (s.status === "Finalizado" || s.status === "completed")
        : (s.status !== "Finalizado" && s.status !== "completed");
    const coincideBusqueda =
      s.title?.toLowerCase().includes(busqueda?.toLowerCase() || "") ||
      s.id?.toString().includes(busqueda || "");
    return coincideTab && coincideBusqueda;
  });


  const abrirAsignacion = (servicio) => {
    setServicioSeleccionado(servicio);
    setMostrarAsignar(true);
  };

  // 3. ENVIAR ASIGNACIÓN A LARAVEL
  const manejarConfirmarAgenda = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        tecnico_id: datosAsignacion.tecnico_id,
        scheduled_start: `${datosAsignacion.fecha} ${datosAsignacion.hora}:00`,
      };

      const respuesta = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/servicios/${servicioSeleccionado.id}/asignar`,
        payload,
      );

      if (respuesta.data.success) {
        alert("¡Visita técnica programada con éxito!");
        setMostrarAsignar(false);

        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios`);
        setServicios(data);
      }
    } catch (error) {
      console.error("Error completo:", error.response);
      alert("Error al asignar técnico. Revisa la consola.");
    }
  };

  /// Funciones para Solicitar reagendar cita

  // --- LÓGICA DEL CLIENTE ---
  const abrirDetallesCliente = (servicio) => {
    setServicioSeleccionado(servicio);
    setModalClientePaso(1); // Abre en la pantalla de confirmación
    setMotivoReprogramar("");
    setFechaSugerida("");
  };

  const confirmarCitaCliente = async () => {
    try {
      // Aquí llamaremos a Laravel para cambiar el estatus a "Confirmado"
      const respuesta = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/servicios/${servicioSeleccionado.id}/confirmar-cliente`,
      );
      if (respuesta.data.success) {
        alert("¡Cita confirmada! El técnico ha sido notificado.");
        setModalClientePaso(0);
        // Recargar tabla
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios`);
        setServicios(data);
      }
    } catch (error) {
      alert("Error al confirmar la cita.");
    }
  };

  const enviarReprogramacion = async (e) => {
    e.preventDefault();
    try {
      // Enviamos la sugerencia al Admin
      const payload = {
        fecha_sugerida: fechaSugerida,
        motivo: motivoReprogramar,
      };
      const respuesta = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/servicios/${servicioSeleccionado.id}/solicitar-reprogramacion`,
        payload,
      );

      if (respuesta.data.success) {
        alert("Solicitud enviada. El administrador revisará tu nueva fecha.");
        setModalClientePaso(0);
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios`);
        setServicios(data);
      }
    } catch (error) {
      alert("Error al solicitar reprogramación.");
    }
  };

  return (
    <div className="lev-main-page">
      <Header />



      <main className="lev-container">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          <button
            className="lev-btn-add"
            onClick={() => navigate("/assign-service")}
          >
            {isClient ? "+ PEDIR SERVICIO" : "+ NUEVO LEVANTAMIENTO"}
          </button>
        </div>
        <div className="lev-search-box">
          <input
            type="text"
            placeholder="BUSCAR POR TÍTULO O ID..."
            className="lev-input-search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="lev-search-icon">🔍</span>
        </div>

        <div className="lev-tabs">
          <button
            className={`lev-tab ${tabActual === "PENDIENTES" ? "active" : ""}`}
            onClick={() => setTabActual("PENDIENTES")}
          >
            📋 VISITAS PENDIENTES
          </button>
          <button
            className={`lev-tab ${tabActual === "REALIZADOS" ? "active" : ""}`}
            onClick={() => setTabActual("REALIZADOS")}
          >
            ✅ LEVANTAMIENTOS FINALIZADOS
          </button>
        </div>

        <div className="lev-table-wrapper">
          <table className="lev-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>TÍTULO / PROPIEDAD</th>
                <th>PRIORIDAD</th>
                {tabActual === "PENDIENTES" ? (
                  <th>ESTADO</th>
                ) : (
                  <th>TÉCNICO</th>
                )}
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    Cargando levantamientos...
                  </td>
                </tr>
              ) : filtrados.length > 0 ? (
                filtrados.map((s) => (
                  <tr key={s.id}>
                    <td style={{ color: '#333', fontWeight: '900' }}>#{s.id || "0"}</td>
                    <td className="lev-bold">{s.title === "Levantamiento Inicial" && s.cliente_nombre ? `Levantamiento de ${s.cliente_nombre}` : s.title}</td>
                    <td>
                      <span
                        className={`prio-${s.priority?.toLowerCase()}`}
                        style={{ color: "#333" }}
                      >
                        {s.priority || "N/A"}
                      </span>
                    </td>
                    <td>
                      {tabActual === 'PENDIENTES' ? (
                      <span 
                        className={s.assigned_to && s.status !== 'Reprogramación Solicitada' ? "status-assigned" : "status-pending"}
                        style={{
                          backgroundColor: s.status === 'Reprogramación Solicitada' ? '#FF9800' : 
                                           s.status === 'Visita Confirmada' ? '#2196F3' : '',
                          color: (s.status === 'Reprogramación Solicitada' || s.status === 'Visita Confirmada') ? 'white' : '',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          fontSize: '0.85rem'
                        }}
                      >
                        {s.status === 'Reprogramación Solicitada' ? "⏳ Pide Reprogramar" :
                         s.status === 'Visita Confirmada' ? "✅ Confirmada" :
                         s.assigned_to ? "📅 Programado" : "⚠️ Por Asignar"}
                      </span>
                    ) : s.tecnico_nombre} 
                  </td>
                    <td>
                      {tabActual === 'REALIZADOS' ? (
                      <button 
                        className="lev-btn-action btn-reporte"
                        onClick={() => navigate(`/detalle-reporte/${s.id}`)}
                      >
                        👁️ Ver Reporte
                      </button>
                    ) : isClient ? (
                        <button 
                          className="lev-btn-action btn-assign" 
                          style={{ 
                            backgroundColor: s.status === 'Reprogramación Solicitada' ? '#FF9800' : 
                                             s.status === 'Visita Confirmada' ? '#2196F3' :
                                             s.assigned_to ? '#4CAF50' : '#888', 
                            border: 'none', color: 'white' 
                          }}
                          onClick={() => {
                            if (s.assigned_to && s.status !== 'Reprogramación Solicitada' && s.status !== 'Visita Confirmada') {
                              abrirDetallesCliente(s);
                            }
                          }}
                          disabled={!s.assigned_to || s.status === 'Reprogramación Solicitada' || s.status === 'Visita Confirmada'}
                        >
                          {s.status === 'Reprogramación Solicitada' ? '⏳ Reprogramando' :
                           s.status === 'Visita Confirmada' ? '✅ Cita Confirmada' :
                           s.assigned_to ? '👁️ Ver Detalles' : '⏳ En revisión'}
                        </button>
                    ) : (
                        <button
                          className="lev-btn-action btn-assign"
                          onClick={() => abrirAsignacion(s)}
                        >
                          📅 Programar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      padding: "40px",
                      color: "#999",
                      textAlign: "center",
                    }}
                  >
                    {isClient
                      ? "Aún no has solicitado ningún levantamiento."
                      : "No hay servicios registrados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {mostrarAsignar && !isClient && (
        <div
          className="lev-modal-overlay"
          onClick={() => setMostrarAsignar(false)}
        >
          <div
            className="lev-modal-form asignar-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lev-modal-header orange">
              <h3>AGENDAR VISITA TÉCNICA</h3>
              <button
                className="close-x"
                onClick={() => setMostrarAsignar(false)}
              >
                &times;
              </button>
            </div>

            <div className="lev-modal-body">
              <p className="asignar-subtitle">
                Servicio: <strong>{servicioSeleccionado?.title}</strong>
              </p>
              <form className="lev-form-grid" onSubmit={manejarConfirmarAgenda}>
                <div className="lev-field full-width">
                  <label>Seleccionar Técnico Responsable</label>
                  <select
                    className="lev-input-style"
                    required
                    value={datosAsignacion.tecnico_id}
                    onChange={(e) =>
                      setDatosAsignacion({
                        ...datosAsignacion,
                        tecnico_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Seleccione un técnico...</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lev-field">
                  <label>Fecha de Visita</label>
                  <div className="lev-input-wrapper">
                    <input
                      type="date"
                      className="lev-input-style"
                      required
                      ref={dateInputRef}
                      value={datosAsignacion.fecha}
                      onChange={(e) =>
                        setDatosAsignacion({
                          ...datosAsignacion,
                          fecha: e.target.value,
                        })
                      }
                      onClick={abrirDatePicker}
                    />
                    <svg
                      className="lev-input-icon"
                      viewBox="0 0 24 24"
                      onClick={abrirDatePicker}
                    >
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                    </svg>
                  </div>
                </div>

                <div className="lev-field">
                  <label>Horario Sugerido</label>
                  <div className="lev-input-wrapper">
                    <input
                      type="time"
                      className="lev-input-style"
                      required
                      ref={timeInputRef}
                      value={datosAsignacion.hora}
                      onChange={(e) =>
                        setDatosAsignacion({
                          ...datosAsignacion,
                          hora: e.target.value,
                        })
                      }
                      onClick={abrirTimePicker}
                    />
                    <svg
                      className="lev-input-icon"
                      viewBox="0 0 24 24"
                      onClick={abrirTimePicker}
                    >
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                    </svg>
                  </div>
                </div>

                <div className="lev-footer-form">
                  <button
                    type="button"
                    className="lev-btn-cancel"
                    onClick={() => setMostrarAsignar(false)}
                  >
                    CANCELAR
                  </button>
                  <button type="submit" className="lev-btn-save orange-btn">
                    CONFIRMAR AGENDA
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {modalClientePaso > 0 && isClient && (
        <div className="lev-modal-overlay" onClick={() => setModalClientePaso(0)} style={{ zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="lev-modal-form asignar-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', padding: '30px', textAlign: 'center' }}>
            
            {modalClientePaso === 1 && (
              <>
                <h2 style={{ color: '#F26522', marginBottom: '15px' }}>¡Visita Programada!</h2>
                <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
                  <p style={{ fontSize: '1.1rem', color: '#333', marginBottom: '10px' }}>
                    Enhorabuena, el técnico <strong>{servicioSeleccionado?.tecnico_nombre}</strong> te visitará:
                  </p>
                  <p style={{ fontSize: '1.2rem', color: '#4CAF50', fontWeight: 'bold', textAlign: 'center', padding: '10px 0' }}>
                    📅 {servicioSeleccionado?.fecha_programada}
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={confirmarCitaCliente} style={{ padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                    ✅ CONFIRMAR FECHA
                  </button>
                  <button onClick={() => setModalClientePaso(2)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'white', color: '#555', cursor: 'pointer', fontSize: '0.9rem' }}>
                    ¿Te surgió un inconveniente? Reprograma aquí
                  </button>
                </div>
              </>
            )}

            {modalClientePaso === 2 && (
              <form onSubmit={enviarReprogramacion} style={{ textAlign: 'left' }}>
                <h2 style={{ color: '#333', marginBottom: '15px', textAlign: 'center' }}>Reprogramar Visita</h2>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>
                  Por favor, indícanos la nueva fecha y hora en la que deseas que se realice el levantamiento.
                </p>

                <div className="lev-field full-width" style={{ marginBottom: '15px' }}>
                  <label>Fecha y Hora sugerida *</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={fechaSugerida}
                    onChange={(e) => setFechaSugerida(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>

                <div className="lev-field full-width" style={{ marginBottom: '20px' }}>
                  <label>Motivo del cambio o comentario (Opcional)</label>
                  <textarea 
                    rows="3"
                    value={motivoReprogramar}
                    onChange={(e) => setMotivoReprogramar(e.target.value)}
                    placeholder="Ej. Tuve una emergencia familiar..."
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setModalClientePaso(1)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'white', cursor: 'pointer' }}>
                    VOLVER
                  </button>
                  <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#F26522', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                    ENVIAR SOLICITUD
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default VistaLevantamientos;
