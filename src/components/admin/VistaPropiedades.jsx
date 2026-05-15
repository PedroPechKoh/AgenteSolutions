import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import UniversalSearch from "../Shared/UniversalSearch"; 
import Header from "../Shared/Header"; 
import "../../styles/Admin/VistaPropiedades.css";
import { X, CheckCircle, User, AlertTriangle, ListChecks, Clock, CheckCircle2, LayoutDashboard, ChevronLeft } from "lucide-react";

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
  const [globalStats, setGlobalStats] = useState({ sos: 0, todo: 0, progress: 0, done: 0 });
  const [pasoModal, setPasoModal] = useState(1); 
  const [nombreResponsable, setNombreResponsable] = useState("");

  // ESTADOS PARA EDICIÓN
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [propiedadAEditar, setPropiedadAEditar] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editFoto, setEditFoto] = useState(null);
  const [editando, setEditando] = useState(false);
  
  // CONTEXTO DE BÚSQUEDA (desde MainLayoutCliente)
  const outletContext = useOutletContext();
  const searchTerm = outletContext?.searchTerm || "";
  
  // ROLE CHECK
  const user = JSON.parse(localStorage.getItem('agente_session') || '{}')?.userData;
  const isClient = user?.role_id === 3;

  useEffect(() => {
    obtenerPropiedades();
    
    // Escuchar cuando el usuario regrese a esta pestaña para actualizar datos
    window.addEventListener('focus', obtenerPropiedades);
    return () => window.removeEventListener('focus', obtenerPropiedades);
  }, []);

  const obtenerPropiedades = async () => {
    try {
      const token = localStorage.getItem('agente_token'); 

      const [propsRes, statsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/propiedades`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/work-orders/global-stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      setListaPropiedades(propsRes.data);
      setGlobalStats(statsRes.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargando(false);
    }
  };

  // Lógica de filtrado manual combinando categoría y búsqueda del sidebar
  useEffect(() => {
    const termino = searchTerm.toLowerCase();
    
    const filtrados = listaPropiedades.filter((item) => {
      // 1. Filtro por categoría (CASA, MANSION, etc.)
      const coincideCategoria = categoria === "TODAS" || (item.tipo && item.tipo.toUpperCase() === categoria);
      
      // 2. Filtro por búsqueda de texto
      const coincideBusqueda = 
        (item.nombre_propiedad || '').toLowerCase().includes(termino) ||
        (item.address || '').toLowerCase().includes(termino) ||
        (item.curp || '').toLowerCase().includes(termino); // Usamos CURP como folio si aplica

      return coincideCategoria && coincideBusqueda;
    });

    setPropiedadesFiltradas(filtrados);
  }, [searchTerm, listaPropiedades, categoria]);

  const eliminarPropiedad = async (propiedad) => {
    const { id, nombre_propiedad } = propiedad;
    
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar la propiedad "${nombre_propiedad}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('agente_token');
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/propiedades/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setListaPropiedades((prev) => prev.filter((p) => p.id !== id));
        Swal.fire({
          title: '¡Eliminado!',
          text: 'La propiedad ha sido eliminada con éxito.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire('Error', 'Hubo un problema al eliminar la propiedad.', 'error');
      }
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

  const abrirModalEditar = (propiedad) => {
    setPropiedadAEditar(propiedad);
    setEditNombre(propiedad.nombre_propiedad || "");
    setEditFoto(null);
    setMostrarModalEditar(true);
  };

  const handleUpdateProperty = async (e) => {
    e.preventDefault();
    setEditando(true);
    try {
      const token = localStorage.getItem('agente_token');
      const formData = new FormData();
      formData.append('property_name', editNombre);
      if (editFoto) {
        formData.append('facade_photo', editFoto);
      }

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/propiedades/${propiedadAEditar.id}/update`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Actualizar lista local
      setListaPropiedades(prev => prev.map(p => 
        p.id === propiedadAEditar.id 
          ? { ...p, nombre_propiedad: data.property.property_name, foto_url: data.foto_url } 
          : p
      ));

      setMostrarModalEditar(false);
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Hubo un error al actualizar la propiedad.");
    } finally {
      setEditando(false);
    }
  };

  return (
    <div className="main-container bg-light">
      {!isClient && (
        <>
          <div className="top-bar-orange" />
          <div className="top-bar-black" />
          <Header titulo="PROPIEDADES" />
        </>
      )}

      <section className="content-area">
        
        
        {/* --- NUEVO TABLERO COMPACTO PARA PC (Solo Clientes) --- */}
        {isClient && (
          <div className="pc-dashboard-header">
            <div className="pc-dashboard-top-section">
              <div className="pc-title-group">
                <LayoutDashboard size={22} color="#F26522" />
                <h2 className="pc-dashboard-title">Tablero de Control</h2>
              </div>
              <div className="pc-stats-row">
                <div className="pc-stat-item sos">
                  <div className="pc-stat-box"><strong>{globalStats.sos}</strong></div>
                  <span>SOS</span>
                </div>
                <div className="pc-stat-item todo">
                  <div className="pc-stat-box"><strong>{globalStats.todo}</strong></div>
                  <span>POR HACER</span>
                </div>
                <div className="pc-stat-item progress">
                  <div className="pc-stat-box"><strong>{globalStats.progress}</strong></div>
                  <span>PROCESO</span>
                </div>
                <div className="pc-stat-item done">
                  <div className="pc-stat-box"><strong>{globalStats.done}</strong></div>
                  <span>LISTOS</span>
                </div>
              </div>
            </div>
            
            <div className="pc-dashboard-actions">
              <button className="pc-add-btn" onClick={() => navigate("/registro-propiedades")}>
                 <span>+</span> AGREGAR PROPIEDAD
              </button>
            </div>
          </div>
        )}

        {/* Solo para Admin: Buscador y Botón Circular */}
        {!isClient && (
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
        )}

        {!isClient && (
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
        )}

        <div className="properties-grid">
          {cargando ? (
            <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '50px', color: '#666' }}>
              Cargando propiedades... ⏳
            </div>
          ) : propiedadesFiltradas.length > 0 ? (
            propiedadesFiltradas.map((p) => (
              <div key={p.id} className="property-card">
                
                {/* 👇 AQUÍ ESTÁ LA MAGIA LIMPIA 👇 */}
                <img 
                  src={p.foto_url || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1000'} 
                  alt={p.nombre_propiedad || "Propiedad"} 
                  className="property-image" 
                />

                  <div className="property-overlay">
                    <div className="overlay-icon-actions">
                      <button 
                        className="btn-icon-overlay" 
                        title="Editar"
                        onClick={(e) => { e.stopPropagation(); abrirModalEditar(p); }}
                      >
                        ✏️
                      </button>
                      
                      {/* La papelera si la dejamos solo para Admin por seguridad, o tú me dices */}
                      <button 
                        className="btn-icon-overlay" 
                        title="Eliminar"
                        onClick={(e) => { e.stopPropagation(); eliminarPropiedad(p); }}
                      >
                        🗑️
                      </button>
                    </div>

                    <h3 className="property-title-overlay">
                      {p.nombre_propiedad || "Propiedad sin nombre"}
                    </h3>
                    <div className="overlay-actions">
                      {/* BOTÓN 1: DETALLES DE PROPIEDAD */}
                      <button
                        className="btn-overlay secondary"
                        onClick={() => {
                          localStorage.setItem('current_property_id', p.id);
                          localStorage.setItem('current_levantamiento_id', p.id_levantamiento || '');
                          window.dispatchEvent(new Event('sync-agente-ids'));
                          
                          if (isClient) {
                            navigate(`/DetallePropiedad/${p.id}`);
                          } else {
                            navigate(`/detalle-propiedad/${p.id}`);
                          }
                        }}
                      >
                        DETALLES DE PROPIEDAD
                      </button>

                      {/* BOTÓN 2: VER O SOLICITAR LEVANTAMIENTO */}
                      {p.levantamiento_realizado ? (
                        <button 
                          className="btn-overlay primary" 
                          style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none' }}
                          onClick={() => {
                            localStorage.setItem('current_property_id', p.id);
                            window.dispatchEvent(new Event('sync-agente-ids'));
                            
                            if (p.id_levantamiento) {
                              localStorage.setItem('current_levantamiento_id', p.id_levantamiento);
                              navigate(`/detalle-reporte/${p.id_levantamiento}`);
                            } else {
                              // Si no hay servicio pero hay zonas, vamos a ver las zonas
                              navigate(`/RegistroZonas/${encodeURIComponent(p.curp)}`);
                            }
                          }}
                        >
                          VER LEVANTAMIENTO
                        </button>
                      ) : (
                        <button
                          className="btn-overlay primary"
                          onClick={() => abrirModalParaPropiedad(p)}
                        >
                          {p.has_pending_service ? "LEVANTAMIENTO SOLICITADO" : "SOLICITAR LEVANTAMIENTO"}
                        </button>
                      )}

                      {/* BOTÓN 3: REALIZAR MI PROPIO LEVANTAMIENTO / EDITAR */}
                      <button
                        className="btn-overlay primary"
                        style={{ backgroundColor: '#F26522', color: 'white', border: 'none' }}
                        onClick={() => navigate(`/RegistroZonas/${encodeURIComponent(p.curp)}`)} 
                      >
                        {p.levantamiento_realizado ? "✏️ EDITAR LEVANTAMIENTO" : "📸 REALIZAR MI PROPIO LEVANTAMIENTO"}
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

      {/* MODAL DE SOLICITAR LEVANTAMIENTO */}
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
      {/* MODAL DE EDICIÓN DE PROPIEDAD */}
      {mostrarModalEditar && (
        <div
          className="modal-overlay"
          onClick={() => !editando && setMostrarModalEditar(false)}
          style={{
            zIndex: 1100,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
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
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
          >
            <button
              className="close-modal"
              onClick={() => setMostrarModalEditar(false)}
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

            <form onSubmit={handleUpdateProperty}>
              <h2 style={{ marginBottom: '20px', color: '#333', textAlign: 'center' }}>Editar Propiedad</h2>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Nombre de la Propiedad</label>
                <input 
                  type="text" 
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  placeholder="Ej. Casa de la Playa"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    color: '#333'
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Nueva Foto de Fachada</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setEditFoto(e.target.files[0])}
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />
                <small style={{ color: '#888' }}>* Dejar vacío para mantener la foto actual.</small>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModalEditar(false)}
                  disabled={editando}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    backgroundColor: '#f8f9fa',
                    color: '#333',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editando}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#ff6b00',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {editando ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaPropiedades;