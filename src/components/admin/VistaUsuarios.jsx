import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import UniversalSearch from "../Shared/UniversalSearch"; // Ruta ajustada a tu estructura
import "../../styles/Admin/VistaUsuarios.css";
import logo from "../../assets/Logo4.png";
import { X } from "lucide-react";

const MAPA_ROLES = { 0: "ROOT", 1: "ADMIN", 2: "TECNICO", 3: "CLIENTE" };

const CATEGORIAS = [
  { label: "TODOS", icon: "👥" },
  { label: "CLIENTES", icon: "👤" },
  { label: "TECNICOS", icon: "🛠️" },
  { label: "ADMINS", icon: "💼" },
  { label: "ROOTS", icon: "🔑" },
];

const VistaUsuarios = () => {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState("TODOS");
  const [cargando, setCargando] = useState(true);
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);

  // 1. CARGA DE DATOS
  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const { data } = await axios.get("http://127.0.0.1:8000/api/usuarios");
        const formateados = data.map((u) => ({
          id: u.id,
          nombre: `${u.first_name} ${u.last_name || ""}`.trim(),
          correo: u.email,
          rol: MAPA_ROLES[u.role_id] || "DESCONOCIDO",
          estado: u.is_active ? "Activo" : "Inactivo",
          bloqueado: u.is_active === 0,
          profile_picture_url: u.profile_picture_url,
          telefono: u.phone_number || "",
        }));
        setListaUsuarios(formateados);
      } catch (error) {
        console.error("Error al cargar los usuarios:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerUsuarios();
  }, []);

  // 2. ACCIONES (BLOQUEO Y ELIMINACIÓN)
  const toggleBloqueo = async (id, rolActual, estaBloqueado) => {
    if (rolActual === 'ROOT') return alert("⚠️ SEGURIDAD: No puedes bloquear al ROOT.");
    const accion = estaBloqueado ? "desbloquear" : "bloquear";
    
    if (!window.confirm(`¿Estás seguro de que deseas ${accion} a este usuario?`)) return;

    try {
      await axios.put(`http://127.0.0.1:8000/api/usuarios/${id}/toggle-bloqueo`);
      setListaUsuarios(prev => prev.map(u => u.id === id ? { 
        ...u, bloqueado: !u.bloqueado, estado: !u.bloqueado ? 'Inactivo' : 'Activo' 
      } : u));
    } catch (error) {
      alert(error.response?.data?.error || "Error al procesar la solicitud.");
    }
  };

  const eliminarUsuario = async (id, rolActual) => {
    if (rolActual === "ROOT") return alert("⚠️ SEGURIDAD: No puedes eliminar al ROOT.");
    if (!window.confirm("¿Deseas eliminar este usuario? Esta acción es irreversible.")) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/api/usuarios/${id}`);
      setListaUsuarios(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      alert("Hubo un problema al eliminar el usuario.");
    }
  };

  return (
    <div className="main-container bg-light">
      <div className="top-bar-orange" /><div className="top-bar-black" />

      <header className="header-admin">
        <img src={logo} alt="Logo" className="logo-small" />
        <div className="header-right">
          <button className="back-oval-btn" onClick={() => navigate(-1)}>
            <X size={20} className="close-icon" />
            <span className="back-text">Regresar</span>
          </button>
        </div>
      </header>

      <section className="content-area">
        {/* FILTROS POR ROL */}
        <div className="filter-grid">
          {CATEGORIAS.map((cat) => (
            <div 
              key={cat.label} 
              className={`filter-item ${filtro === cat.label ? "active" : ""}`} 
              onClick={() => setFiltro(cat.label)}
            >
              <span className="icon-box">{cat.icon}</span> {cat.label}
            </div>
          ))}
        </div>

        {/* BUSCADOR UNIVERSAL REUTILIZABLE */}
        <UniversalSearch 
          type="USUARIOS"
          data={listaUsuarios} 
          setFilteredData={setUsuariosFiltrados}
          filtroActual={filtro}
          placeholder="BUSCAR POR NOMBRE, CORREO, ROL O TELÉFONO..."
        />

        {/* TABLA DE USUARIOS */}
        <div className="table-wrapper-scroll">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Photo</th><th>NOMBRE</th><th>CORREO</th><th>ROL</th><th>ESTADO</th><th className="text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="6" className="text-center">Cargando usuarios... ⏳</td></tr>
              ) : usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id} className={u.bloqueado ? "user-row-blocked" : ""}>
                    <td className="text-center">
                      <div className="avatar-circle">
                        {u.profile_picture_url ? (
                          <img src={u.profile_picture_url} alt="Perfil" className="perfil-photo" />
                        ) : <span>👤</span>}
                      </div>
                    </td>
                    <td 
                      className={u.rol === "CLIENTE" ? "clickable-name" : ""} 
                      onClick={() => u.rol === "CLIENTE" && navigate("/detalle-cliente", { state: { cliente: u } })}
                    >
                      {u.nombre} {u.bloqueado && <span className="blocked-tag">BLOQUEADO</span>}
                    </td>
                    <td>{u.correo}</td>
                    <td><span className={`badge-rol ${u.rol.toLowerCase()}`}>{u.rol}</span></td>
                    <td>
                      <span className={`status-dot ${u.bloqueado ? "status-off" : "status-on"}`} />
                      {u.bloqueado ? "Acceso Restringido" : u.estado}
                    </td>
                    <td className="actions-cell">
                      <button 
                        className={`btn-table-oval ${u.bloqueado ? "is-blocked" : "is-unblocked"}`} 
                        onClick={() => toggleBloqueo(u.id, u.rol, u.bloqueado)}
                      >
                        <span className="oval-icon">{u.bloqueado ? "🔓" : "🔒"}</span>
                        <span className="oval-text">{u.bloqueado ? "Desbloquear" : "Bloquear"}</span>
                      </button>
                      <button className="btn-table-oval-small delete-oval" onClick={() => eliminarUsuario(u.id, u.rol)}>🗑️</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center">No se encontraron usuarios.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default VistaUsuarios;