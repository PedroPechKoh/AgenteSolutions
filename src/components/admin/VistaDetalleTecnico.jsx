import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  User,
  Mail,
  MapPin,
  Plus,
  ArrowRight,
  Home,
  ShieldCheck,
  X,
  Save,
  Phone,
  Lock,
  CheckCircle,
  Briefcase,
  Clipboard,
  FileText,
} from "lucide-react";
import "../../styles/Admin/VistaDetalleCliente.css"; // O creas un CSS nuevo si quieres

const VistaDetalleTecnico = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser?.rol === "admin";

  // Datos del técnico recibidos por state
  const [tecnico, setTecnico] = useState(
    location.state?.tecnico || location.state?.u || null
  );
  const [trabajos, setTrabajos] = useState([]);
  const [levantamientos, setLevantamientos] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: tecnico?.name || tecnico?.nombre || "",
    correo: tecnico?.email || tecnico?.correo || "",
    telefono: tecnico?.phone || tecnico?.telefono || "",
    direccion: tecnico?.address || tecnico?.direccion || "",
    estado: tecnico?.estado || "Activo",
    password: "",
  });

  // Cargar los tres listados al montar
  useEffect(() => {
    if (!tecnico) return;

    const cargarDatosTecnico = async () => {
      try {
        const id = tecnico.id;
        // Ajusta estas URLs según tu API real
        const [resTrabajos, resLevantamientos, resCotizaciones] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/tecnicos/${id}/trabajos`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/tecnicos/${id}/levantamientos`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/tecnicos/${id}/cotizaciones`),
        ]);
        setTrabajos(resTrabajos.data);
        setLevantamientos(resLevantamientos.data);
        setCotizaciones(resCotizaciones.data);
      } catch (error) {
        console.error("Error al cargar datos del técnico:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatosTecnico();
  }, [tecnico]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
// Puedes inicializarlo con 'trabajos' para que la primera esté abierta por defecto
const [seccionAbierta, setSeccionAbierta] = useState("trabajos");

const toggleSeccion = (seccion) => {
  setSeccionAbierta(seccionAbierta === seccion ? null : seccion);
};
  const guardarCambios = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: tecnico.id,
        first_name: formData.nombre.split(" ")[0] || "",
        last_name: formData.nombre.split(" ").slice(1).join(" ") || "",
        email: formData.correo,
        phone_number: formData.telefono,
        address: formData.direccion,
        is_active: formData.estado === "Activo" ? 1 : 0,
      };
      if (formData.password) payload.password = formData.password;

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/usuarios/update-profile`,
        payload
      );
      setTecnico({ ...tecnico, ...formData });
      setIsModalOpen(false);
      alert(data.message || "¡Perfil actualizado con éxito!");
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      alert("No se pudieron guardar los cambios: " + (error.response?.data?.message || error.message));
    }
  };

  if (!tecnico) return <div className="text-center p-10">Cargando expediente...</div>;

  return (
    <div className="detalle-cliente-container">
      <header className="detalle-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} /> REGRESAR
        </button>
        <div className="header-title">
          <h1>Expediente del Técnico</h1>
        </div>
      </header>

      <div className="detalle-main-wrapper">
        <aside className="cliente-data-card">
          <div className="avatar-header-section">
            <div className="avatar-container-large">
              {tecnico.profile_picture_url || tecnico.profile_picture ? (
                <img
                  src={tecnico.profile_picture_url || tecnico.profile_picture}
                  alt="Perfil"
                  className="perfil-photo-circle-large"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/150?text=User";
                  }}
                />
              ) : (
                <User size={50} />
              )}
            </div>
            <h2>{tecnico.name || tecnico.nombre}</h2>
            <span className="badge-role-center">{tecnico.rol}</span>
          </div>

          <div className="dossier-info-list">
            <div className="info-row-stack">
              <Mail size={18} className="icon-orange" />
              <div>
                <label>CORREO ELECTRÓNICO</label>
                <p>{tecnico.email || tecnico.correo}</p>
              </div>
            </div>
            <div className="info-row-stack">
              <Phone size={18} className="icon-orange" />
              <div>
                <label>TELÉFONO</label>
                <p>{tecnico.phone || tecnico.telefono || "Sin registrar"}</p>
              </div>
            </div>
            <div className="info-row-stack">
              <MapPin size={18} className="icon-orange" />
              <div>
                <label>DIRECCIÓN PARTICULAR</label>
                <p>{tecnico.address || tecnico.direccion || "No especificada"}</p>
              </div>
            </div>
            <div className="info-row-stack">
              <ShieldCheck size={18} className="icon-orange" />
              <div>
                <label>ID DE EXPEDIENTE</label>
                <p>#{String(tecnico.id).replace(/[^\d]/g, "")}</p>
              </div>
            </div>
          </div>

          <button
            className="btn-editar-perfil-new"
            onClick={() => setIsModalOpen(true)}
          >
            MODIFICAR PERFIL
          </button>
        </aside>

       <main className="propiedades-section">
  {/* SECCIÓN TRABAJOS REALIZADOS */}
  <div className={`accordion-item ${seccionAbierta === "trabajos" ? "is-open" : ""}`}>
    <div className="section-header clickable" onClick={() => toggleSeccion("trabajos")}>
      <h3>
        <Briefcase size={22} /> TRABAJOS REALIZADOS
      </h3>
      <ChevronLeft className="arrow-icon" size={20} />
    </div>
    <div className="accordion-content">
      <div className="propiedades-list">
        {cargando ? (
          <p className="text-center p-5">Cargando trabajos... ⏳</p>
        ) : trabajos.length > 0 ? (
          trabajos.map((trabajo) => (
            <div key={trabajo.id} className="propiedad-item-card">
              <div className="prop-details">
                <h4>{trabajo.titulo || trabajo.descripcion || "Trabajo #" + trabajo.id}</h4>
                <p className="prop-address-text">{trabajo.direccion || trabajo.ubicacion}</p>
                <div className="prop-meta">
                  <span className="badge-tipo">{trabajo.estado}</span>
                  <span className="equipos-count">{trabajo.fecha}</span>
                </div>
              </div>
              <button className="btn-ver-propiedad" onClick={() => navigate(`/detalle-trabajo/${trabajo.id}`)}>
                Ver detalles <ArrowRight size={18} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-center p-5">Sin trabajos registrados</p>
        )}
      </div>
    </div>
  </div>

  {/* SECCIÓN LEVANTAMIENTOS REALIZADOS */}
  <div className={`accordion-item ${seccionAbierta === "levantamientos" ? "is-open" : ""}`}>
    <div className="section-header clickable" onClick={() => toggleSeccion("levantamientos")}>
      <h3>
        <Clipboard size={22} /> LEVANTAMIENTOS REALIZADOS
      </h3>
      <ChevronLeft className="arrow-icon" size={20} />
    </div>
    <div className="accordion-content">
      <div className="propiedades-list">
        {cargando ? null : levantamientos.length > 0 ? (
          levantamientos.map((lev) => (
            <div key={lev.id} className="propiedad-item-card">
              <div className="prop-details">
                <h4>{lev.nombre || "Levantamiento #" + lev.id}</h4>
                <p className="prop-address-text">{lev.direccion}</p>
                <div className="prop-meta">
                  <span className="badge-tipo">{lev.tipo}</span>
                  <span className="equipos-count">{lev.fecha}</span>
                </div>
              </div>
              <button className="btn-ver-propiedad" onClick={() => navigate(`/detalle-levantamiento/${lev.id}`)}>
                Ver detalles <ArrowRight size={18} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-center p-5">Sin levantamientos registrados</p>
        )}
      </div>
    </div>
  </div>

  {/* SECCIÓN COTIZACIONES REALIZADAS */}
  <div className={`accordion-item ${seccionAbierta === "cotizaciones" ? "is-open" : ""}`}>
    <div className="section-header clickable" onClick={() => toggleSeccion("cotizaciones")}>
      <h3>
        <FileText size={22} /> COTIZACIONES REALIZADAS
      </h3>
      <ChevronLeft className="arrow-icon" size={20} />
    </div>
    <div className="accordion-content">
      <div className="propiedades-list">
        {cargando ? null : cotizaciones.length > 0 ? (
          cotizaciones.map((cot) => (
            <div key={cot.id} className="propiedad-item-card">
              <div className="prop-details">
                <h4>Cotización #{cot.folio}</h4>
                <p className="prop-address-text">{cot.cliente}</p>
                <div className="prop-meta">
                  <span className="badge-tipo">{cot.estado}</span>
                  <span className="equipos-count">${parseFloat(cot.total).toLocaleString()}</span>
                </div>
              </div>
              <button className="btn-ver-propiedad" onClick={() => navigate(`/detalle-cotizacion/${cot.id}`)}>
                Ver detalles <ArrowRight size={18} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-center p-5">Sin cotizaciones realizadas</p>
        )}
      </div>
    </div>
  </div>
</main>

        {/* MODAL DE EDICIÓN (igual que antes) */}
        {isModalOpen && (
          <div className="modal-overlay-new">
            <div className="modal-card-new">
              <div className="modal-header-new">
                <div className="header-icon-box">
                  <User size={24} />
                </div>
                <div>
                  <h3>Editar Perfil</h3>
                  <p>Actualizando información de {tecnico.nombre || tecnico.name}</p>
                </div>
                <button className="btn-close-new" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={guardarCambios} className="modal-body-new">
                <div className="input-grid-new">
                  <div className="input-box-new">
                    <label><User size={14} /> Nombre Completo</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                  </div>
                  <div className="input-box-new">
                    <label><Mail size={14} /> Correo Electrónico</label>
                    <input type="email" name="correo" value={formData.correo} onChange={handleInputChange} required />
                  </div>
                  <div className="input-box-new">
                    <label><Phone size={14} /> Número de Teléfono</label>
                    <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} />
                  </div>
                  <div className="input-box-new">
                    <label><Lock size={14} /> Nueva Contraseña</label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="En blanco para no cambiar" />
                  </div>
                  <div className="input-box-new full-width">
                    <label><MapPin size={14} /> Dirección Particular</label>
                    <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} placeholder="Ej. Calle 23 #137, Col. Xcanatun..." />
                  </div>
                  <div className="input-box-new full-width">
                    <label><CheckCircle size={14} /> Estatus del Técnico</label>
                    <select name="estado" value={formData.estado} onChange={handleInputChange}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="modal-actions-new">
                  <button type="button" className="btn-secondary-new" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary-new"><Save size={18} /> Guardar Cambios</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VistaDetalleTecnico;