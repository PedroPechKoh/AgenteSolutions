import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import UniversalSearch from "../Shared/UniversalSearch"; 
import Header from "../Shared/Header"; 
import "../../styles/Admin/VistaUsuarios.css";

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

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/usuarios`);
        const formateados = data.map((u) => ({
          id: u.id,
          nombre: `${u.first_name} ${u.last_name || ""}`.trim(),
          correo: u.email,
          rol: MAPA_ROLES[u.role_id] || "DESCONOCIDO",
          role_id: u.role_id,
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

  const cambiarRol = async (id, nuevoRolId, nombreUsuario) => {
    if (!window.confirm(`¿Estás seguro de cambiar el tipo de usuario de ${nombreUsuario}?`)) {
      setListaUsuarios([...listaUsuarios]);
      return;
    }
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/usuarios/${id}/rol`, {
        role_id: Number(nuevoRolId) 
      });
      const nuevoRolStr = MAPA_ROLES[nuevoRolId];
      setListaUsuarios(prev => prev.map(u => 
        u.id === id ? { ...u, rol: nuevoRolStr, role_id: Number(nuevoRolId) } : u
      ));
      alert("¡Rol actualizado correctamente!");
    } catch (error) {
      alert(error.response?.data?.message || "Error al actualizar el rol.");
    }
  };

  const toggleBloqueo = async (id, role_id, estaBloqueado) => {
    if (role_id === 0) return alert("⚠️ SEGURIDAD: No puedes bloquear al ROOT.");
    const accion = estaBloqueado ? "desbloquear" : "bloquear";
    if (!window.confirm(`¿Estás seguro de que deseas ${accion} a este usuario?`)) return;

    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/usuarios/${id}/toggle-bloqueo`);
      setListaUsuarios(prev => prev.map(u => u.id === id ? { 
        ...u, bloqueado: !u.bloqueado, estado: !u.bloqueado ? 'Inactivo' : 'Activo' 
      } : u));
    } catch (error) {
      alert("Error al procesar la solicitud.");
    }
  };

  const eliminarUsuario = async (id, role_id) => {
    if (role_id === 0) return alert("⚠️ SEGURIDAD: No puedes eliminar al ROOT.");
    if (!window.confirm("¿Deseas eliminar este usuario? Esta acción es irreversible.")) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/usuarios/${id}`);
      setListaUsuarios(prev => prev.filter(u => u.id !== id));
    } catch () {
      alert("Hubo un problema al eliminar el usuario.");
    }
  };

  return (
    <div className="main-container bg-light">
      <div className="top-bar-orange" />
      <div className="top-bar-black" />

      <Header rolTexto="ADMINISTRACIÓN DE USUARIOS" />

      {/* 🔥 QUITAMOS overflowX:hidden */}
      <section className="content-area" style={{ padding: '10px' }}>
        
        <div className="filter-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '10px', 
          marginBottom: '20px' 
        }}>
          
          {CATEGORIAS.map((cat) => (
            <div 
              key={cat.label} 
              className={`filter-item ${filtro === cat.label ? "active" : ""}`} 
              onClick={() => setFiltro(cat.label)}
              style={{ margin: 0, width: '100%' }}
            >
              <span className="icon-box">{cat.icon}</span> {cat.label}
            </div>
          ))}

          <div 
            className="filter-item" 
            onClick={() => navigate('/map')}
            style={{ backgroundColor: '#fff4e6', border: '1px solid #FF6600' }}
          >
            🗺️ VER MAPA
          </div>

          <div 
            className="filter-item" 
            onClick={() => navigate('/registro')}
            style={{ backgroundColor: '#fff4e6', border: '1px solid #FF6600' }}
          >
            📝 REGISTRAR
          </div>
        </div>

        <UniversalSearch 
          type="USUARIOS"
          data={listaUsuarios} 
          setFilteredData={setUsuariosFiltrados}
          filtroActual={filtro}
          placeholder="BUSCAR..."
        />

        {/* 🔥 CONTENEDOR LIMPIO */}
        <div className="table-wrapper-scroll">
          
          {/* 🔥 TABLA SIN estilos inline */}
          <table className="modern-table">
            <thead>
              <tr>
                <th>PHOTO</th>
                <th>NOMBRE</th>
                <th>CORREO</th>
                <th>ROL</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="6">Cargando usuarios... ⏳</td></tr>
              ) : usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id} className={u.bloqueado ? "user-row-blocked" : ""}>
                    
                    <td>
                      <div className="avatar-circle">
                        {u.profile_picture_url ? (
                          <img src={u.profile_picture_url} alt="Perfil" className="perfil-photo" />
                        ) : "👤"}
                      </div>
                    </td>

                    <td 
                      className={u.rol === "CLIENTE" ? "clickable-name" : ""} 
                      onClick={() => u.rol === "CLIENTE" && navigate("/detalle-cliente", { state: { cliente: u } })}
                    >
                      {u.nombre} {u.bloqueado && <span className="blocked-tag">BLOQUEADO</span>}
                    </td>

                    <td>{u.correo}</td>

                    <td>
                      {u.role_id === 0 ? (
                        <span className="badge-rol root">ROOT</span>
                      ) : (
                        <select 
                          className={`badge-rol ${u.rol.toLowerCase()} select-rol-inline`}
                          value={u.role_id}
                          onChange={(e) => cambiarRol(u.id, parseInt(e.target.value), u.nombre)}
                        >
                          <option value="1">ADMIN</option>
                          <option value="2">TECNICO</option>
                          <option value="3">CLIENTE</option>
                        </select>
                      )}
                    </td>

                    <td>
                      <span className={`status-dot ${u.bloqueado ? "status-off" : "status-on"}`} />
                      {u.bloqueado ? "Inactivo" : u.estado}
                    </td>

                    <td className="actions-cell">
                      <button 
                        className={`btn-table-oval ${u.bloqueado ? "is-blocked" : "is-unblocked"}`} 
                        onClick={() => toggleBloqueo(u.id, u.role_id, u.bloqueado)}
                      >
                        {u.bloqueado ? "🔓 OK" : "🔒 Bloq"}
                      </button>

                      <button 
                        className="btn-table-oval-small delete-oval" 
                        onClick={() => eliminarUsuario(u.id, u.role_id)}
                      >
                        🗑️
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr><td colSpan="6">No se encontraron usuarios.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default VistaUsuarios;