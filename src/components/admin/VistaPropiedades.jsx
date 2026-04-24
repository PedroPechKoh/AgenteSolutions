import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import UniversalSearch from "../Shared/UniversalSearch"; 
import Header from "../Shared/Header"; 
import "../../styles/Admin/VistaPropiedades.css";
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
        const token = localStorage.getItem('agente_token'); 

        const { data } = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/propiedades`,
          {
            headers: {
              'Authorization': `Bearer ${token}` 
            }
          }
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
      const token = localStorage.getItem('agente_token');

      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/propiedades/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
      const token = localStorage.getItem('agente_token');

      const payload = {
        property_id: propiedadSeleccionada.id,
        title: "Levantamiento Inicial",
        description: "Solicitud de visita técnica para registro inicial de la propiedad.",
        priority: "Media",
        supervisor_name: nombreResponsable.trim() !== "" ? nombreResponsable : "El propietario",
      };

      const respuesta = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/servicios`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
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
    <div className="main-container bg-light">
      <div className="top-bar-orange" />
      <div className="top-bar-black" />

      <Header rolTexto="ADMINISTRACIÓN DE PROPIEDADES" />

      <section className="content-area">
        
        {/* ✅ CAMBIO: justifyContent: 'center' para que todo el bloque de botones se centre */}
        <div className="search-header-flex">
          <div className="search-container-center">
            <UniversalSearch
              type="PROPIEDADES"
              data={listaPropiedades}
              setFilteredData={setPropiedadesFiltradas}
              filtroActual={categoria}
              placeholder="PROPIEDADES"
            />
          </div>

          <button
            className="btn-add-circle"
            onClick={() => navigate("/registro-propiedades")}
            title="NUEVA PROPIEDAD"
          >
            +
          </button>
        </div>

        {/* Botones de Categoría */}
        <div className="categories-row-container">
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
        </div>

        <div className="properties-grid">
          {cargando ? (
            <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '50px', color: '#666' }}>
              Cargando propiedades... ⏳
            </div>
          ) : propiedadesFiltradas.length > 0 ? (
            propiedadesFiltradas.map((p) => (
              <div key={p.id} className="property-card">
                <img 
                  src={
                    p.facade_photo_path || 
                    p.facade_photo || 
                    p.property_photo || 
                    p.foto_fachada || 
                    p.foto_propiedad || 
                    p.image_path || 
                    p.picture || 
                    p.foto || 
                    p.imagen || 
                    p.image || 
                    p.photo || 
                    p.fachada || 
                    p.thumbnail || 
                    p.cover || 
                    p.img || 
                    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1000'
                  } 
                  alt="Propiedad" 
                  className="property-image" 
                />

                {/* Overlay de Hover */}
                <div className="property-overlay">
                  <div className="overlay-icon-actions">
                    <button className="btn-icon-overlay" title="Editar">✏️</button>
                    <button 
                      className="btn-icon-overlay" 
                      title="Eliminar"
                      onClick={(e) => { e.stopPropagation(); eliminarPropiedad(p.id); }}
                    >
                      🗑️
                    </button>
                  </div>

                  <h3 className="property-title-overlay">
                    {p.propietario || "Sin Propietario"}
                  </h3>

                  <div className="overlay-actions">
                    <button
                      className="btn-overlay secondary"
                      onClick={() => navigate(`/propiedad/${p.id}`)}
                    >
                      VER TABLERO
                    </button>

                    {p.has_pending_service ? (
                      <button className="btn-overlay outline" disabled>
                        YA SOLICITADO
                      </button>
                    ) : (
                      <button
                        className="btn-overlay primary"
                        onClick={() => abrirModalParaPropiedad(p)}
                      >
                        SOLICITAR VISITA
                      </button>
                    )}

                    <button 
                      className="btn-overlay outline"
                      onClick={() => window.open(`https://www.google.com/maps?q=${p.direccion}`, "_blank")}
                    >
                      🗺️ VER MAPA
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '50px', color: '#666' }}>
              No hay propiedades en esta categoría.
            </div>
          )}
        </div>

      </section>

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