import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import UniversalSearch from "../Shared/UniversalSearch";
import "../../styles/Admin/VistaPropiedades.css";
import logo from "../../assets/Logo4.png";
import { X, CheckCircle, User } from "lucide-react";

const TIPOS_PROPIEDAD = [
  { label: "TODAS", icon: "🌐", title: "TODAS" },
  { label: "CASA", icon: "🏠", title: "CASAS REGULARES" },
  { label: "MANSION", icon: "🏰", title: "MANSIONES" },
  { label: "DEPARTAMENTO", icon: "🏢", title: "DEPARTAMENTOS" },
];

const VistaPropiedades = () => {
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState("TODAS");
  const [cargando, setCargando] = useState(true);
  const [listaPropiedades, setListaPropiedades] = useState([]);
  const [propiedadesFiltradas, setPropiedadesFiltradas] = useState([]);

  const [mostrarModalServicio, setMostrarModalServicio] = useState(false);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);
  const [pasoModal, setPasoModal] = useState(1); 
  const [nombreResponsable, setNombreResponsable] = useState("");

  useEffect(() => {
    const obtenerPropiedades = async () => {
      try {
        const { data } = await axios.get(
          "http://127.0.0.1:8000/api/propiedades",
        );
        setListaPropiedades(data);
      } catch (error) {
        console.error("Error al cargar las propiedades:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerPropiedades();
  }, []);

  const eliminarPropiedad = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta propiedad?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/propiedades/${id}`);
      setListaPropiedades((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      alert("Error al eliminar la propiedad.");
    }
  };

  
  const abrirModalParaPropiedad = (propiedad) => {
    setPropiedadSeleccionada(propiedad);
    setPasoModal(1); 
    setNombreResponsable(""); 
    setMostrarModalServicio(true);
  };

  const enviarLevantamiento = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        property_id: propiedadSeleccionada.id,
        title: "Levantamiento Inicial",
        description:
          "Solicitud de visita técnica para registro inicial de la propiedad.",
        priority: "Media",
        supervisor_name:
          nombreResponsable.trim() !== ""
            ? nombreResponsable
            : "El propietario",
      };

      const respuesta = await axios.post(
        "http://127.0.0.1:8000/api/servicios",
        payload,
      );

      if (respuesta.data.success) {
        setPasoModal(2); 
      }
    } catch (error) {
      console.error("Error al reportar:", error);
      alert("Hubo un error al solicitar el servicio.");
    }
  };

  const cerrarModalYRecargar = () => {
    setMostrarModalServicio(false);
    navigate("/levantamientos"); 
  };

  return (
    <div className="main-container-users">
      <div className="top-bar-orange" />
      <div className="top-bar-black" />

      <header
        className="lev-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 40px",
        }}
      >
        <img
          src={logo}
          alt="Agente Solutions"
          className="lev-logo"
          style={{ height: "50px" }}
        />
        <button
          className="lev-btn-add"
          onClick={() => navigate("/registro-propiedades")}
        >
          + NUEVA PROPIEDAD
        </button>
      </header>

      <main className="content-body">
        <UniversalSearch
          type="PROPIEDADES"
          data={listaPropiedades}
          setFilteredData={setPropiedadesFiltradas}
          filtroActual={categoria}
          placeholder="BUSCAR POR DUEÑO, DIRECCIÓN O CURP..."
        />

        <div className="categories-row">
          {TIPOS_PROPIEDAD.map((tipo) => (
            <button
              key={tipo.label}
              className={`cat-btn ${categoria === tipo.label ? "active" : ""}`}
              onClick={() => setCategoria(tipo.label)}
            >
              <span className="btn-icon-small">{tipo.icon}</span> {tipo.title}
            </button>
          ))}
        </div>

        <div className="table-scroll-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>NOMBRE DEL PROPIETARIO</th>
                <th>DIRECCIÓN</th>
                <th>FECHA DE REGISTRO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    Cargando propiedades... ⏳
                  </td>
                </tr>
              ) : propiedadesFiltradas.length > 0 ? (
                propiedadesFiltradas.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td className="bold-text">
                      {p.propietario || "Sin Propietario"}
                    </td>
                    <td>{p.direccion || "Sin dirección registrada"}</td>
                    <td>{p.fecha || "S/N"}</td>
                    <td
                      className="actions-btns"
                      style={{
                        display: "flex",
                        gap: "5px",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <td
                        className="actions-btns"
                        style={{
                          display: "flex",
                          gap: "5px",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <button
    style={{
      backgroundColor: "#2196F3", // Un azul bonito para diferenciarlo
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: "4px",
      fontWeight: "bold",
      cursor: "pointer",
      fontSize: "0.8rem",
    }}
    title="Ver Tablero de la Propiedad"
    onClick={() => navigate(`/propiedad/${p.id}`)} // <--- LA MAGIA ESTÁ AQUÍ
  >
    VER TABLERO
  </button>
                        {p.has_pending_service ? (
                          <button
                            style={{
                              backgroundColor: "#e0e0e0", 
                              color: "#888", 
                              border: "1px solid #ccc",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              fontWeight: "bold",
                              cursor: "not-allowed", 
                              fontSize: "0.8rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                            disabled
                            title="Ya tienes una solicitud pendiente para esta propiedad"
                          >
                            <CheckCircle size={14} /> LEVANTAMIENTO SOLICITADO
                          </button>
                        ) : (
                          <button
                            style={{
                              backgroundColor: "#4CAF50",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                            }}
                            onClick={() => abrirModalParaPropiedad(p)}
                          >
                            SOLICITAR LEVANTAMIENTO
                          </button>
                        )}

                        <button className="btn-orange" title="Editar">
                          ✏️
                        </button>
                        <button
                          className="btn-orange"
                          title="Eliminar"
                          onClick={() => eliminarPropiedad(p.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    No hay propiedades en esta categoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button className="back-arrow-btn" onClick={() => navigate(-1)}>
          ←
        </button>
      </main>

      {/* 👇 MODAL DE SOLICITAR LEVANTAMIENTO 👇 */}
      {mostrarModalServicio && (
        <div
          className="modal-overlay"
          onClick={() =>
            pasoModal === 1
              ? setMostrarModalServicio(false)
              : cerrarModalYRecargar()
          }
          style={{
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "450px",
              width: "100%",
              padding: "30px",
              borderRadius: "12px",
              backgroundColor: "white",
              position: "relative",
            }}
          >
            {pasoModal === 1 && (
              <button
                className="close-modal"
                onClick={() => setMostrarModalServicio(false)}
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={24} color="#666" />
              </button>
            )}

            {/* --- PASO 1: CONFIRMACIÓN Y RESPONSABLE --- */}
            {pasoModal === 1 && (
              <form
                onSubmit={enviarLevantamiento}
                style={{ textAlign: "center" }}
              >
                <h2
                  style={{
                    fontSize: "1.4rem",
                    color: "#333",
                    marginBottom: "15px",
                    lineHeight: "1.4",
                  }}
                >
                  ¿Desea solicitar un levantamiento para esta propiedad?
                </h2>
                <p
                  style={{
                    color: "#666",
                    fontSize: "0.95rem",
                    marginBottom: "25px",
                  }}
                >
                  <strong>Propiedad:</strong> {propiedadSeleccionada?.direccion}
                </p>

                <div
                  style={{
                    textAlign: "left",
                    marginBottom: "25px",
                    backgroundColor: "#f9f9f9",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "1px solid #eee",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "0.9rem",
                      color: "#444",
                      fontWeight: "bold",
                      marginBottom: "10px",
                    }}
                  >
                    <User size={18} /> Asignar Supervisor (Opcional)
                  </label>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#888",
                      marginBottom: "10px",
                      lineHeight: "1.4",
                    }}
                  >
                    Si el dueño no se encontrará en la propiedad, asigne a
                    alguien responsable de vigilar el levantamiento.
                  </p>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez (Conserje)"
                    value={nombreResponsable}
                    onChange={(e) => setNombreResponsable(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      outline: "none",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "15px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setMostrarModalServicio(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      backgroundColor: "white",
                      color: "#555",
                      fontWeight: "bold",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    NO, CANCELAR
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 20px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    SÍ, SOLICITAR
                  </button>
                </div>
              </form>
            )}

            {/* --- PASO 2: ÉXITO --- */}
            {pasoModal === 2 && (
              <div style={{ textAlign: "center", padding: "20px 10px" }}>
                <CheckCircle
                  size={70}
                  color="#4CAF50"
                  style={{ margin: "0 auto 20px auto" }}
                />
                <h2 style={{ color: "#333", marginBottom: "15px" }}>
                  ¡Levantamiento Solicitado!
                </h2>
                <p
                  style={{
                    color: "#666",
                    lineHeight: "1.5",
                    marginBottom: "30px",
                  }}
                >
                  Ha solicitado un levantamiento para esta propiedad. Se le
                  notificará la fecha y hora de visita pronto.
                </p>
                <button
                  onClick={cerrarModalYRecargar}
                  style={{
                    padding: "12px 30px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  ENTENDIDO
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaPropiedades;
