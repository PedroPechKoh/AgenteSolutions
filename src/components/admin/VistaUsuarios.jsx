import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import UniversalSearch from "../Shared/UniversalSearch"; 
import Header from "../Shared/Header"; // ✅ IMPORTAMOS EL NUEVO HEADER
import "../../styles/Admin/VistaUsuarios.css";

// CONFIGURACIÓN DE ROLES SEGÚN TU BASE DE DATOS
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

  // CARGA DE DATOS
  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/usuarios`);
        const formateados = data.map((u) => ({
          id: u.id,
          nombre: `${u.first_name} ${u.last_name || ""}`.trim(),
          correo: u.email,
          rol: MAPA_ROLES[u.role_id] || "DESCONOCIDO",
          role_id: u.role_id, // Importante guardar el ID numérico
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

  // ACCIÓN: CAMBIAR ROL
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
      setUsuariosFiltrados(prev => prev.map(u => 
        u.id === id ? { ...u, rol: nuevoRolStr, role_id: Number(nuevoRolId) } : u
      ));
      
      alert("¡Rol actualizado correctamente!");
    } catch (error) {
      console.error("Error completo:", error.response?.data);
      alert(error.response?.data?.message || "Error al actualizar el rol.");
      setListaUsuarios([...listaUsuarios]);
    }
  };

  // ACCIONES DE BLOQUEO Y ELIMINACIÓN
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
    } catch (error) {
      alert("Hubo un problema al eliminar el usuario.");
    }
  };

  return (
    <div className="main-container bg-light">
      <div className="top-bar-orange" /><div className="top-bar-black" />

      {/* ✅ AQUÍ INTEGRAMOS EL NUEVO HEADER GENERAL */}
      <Header rolTexto="ADMINISTRACIÓN DE USUARIOS" />

      <section className="content-area">
        
        {/* ✅ FILTROS Y NUEVOS BOTONES (MAPA Y REGISTRO) */}
        <div className="filter-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          
          {/* Botones de Filtro Originales */}
          {CATEGORIAS.map((cat) => (
            <div 
              key={cat.label} 
              className={`filter-item ${filtro === cat.label ? "active" : ""}`} 
              onClick={() => setFiltro(cat.label)}
            >
              <span className="icon-box">{cat.icon}</span> {cat.label}
            </div>
          ))}

          {/* Separador Visual (Opcional, para dividir filtros de acciones) */}
          <div style={{ width: '2px', height: '30px', backgroundColor: '#ccc', margin: '0 10px' }}></div>

          {/* NUEVO BOTÓN: MAPA */}
          <div 
            className="filter-item" 
            onClick={() => navigate('/map')}
            style={{ backgroundColor: '#fff4e6', border: '1px solid #FF6600' }} // Un ligero tono para diferenciarlos de los filtros
          >
            <span className="icon-box">🗺️</span> VER MAPA
          </div>

          {/* NUEVO BOTÓN: REGISTRO PRIVADO */}
          <div 
            className="filter-item" 
            onClick={() => navigate('/registro')}
            style={{ backgroundColor: '#fff4e6', border: '1px solid #FF6600' }}
          >
            <span className="icon-box">📝</span> REGISTRAR USUARIO
          </div>

        </div>

        <UniversalSearch 
          type="USUARIOS"
          data={listaUsuarios} 
          setFilteredData={setUsuariosFiltrados}
          filtroActual={filtro}
          placeholder="BUSCAR POR NOMBRE, CORREO, ROL O TELÉFONO..."
        />

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
                    <td>
                      {u.role_id === 0 ? (
                        <span className="badge-rol root text-center block">ROOT</span>
                      ) : (
                        <select 
                          className={`badge-rol ${u.rol.toLowerCase()} border-none outline-none cursor-pointer text-center select-rol-inline`}
                          value={u.role_id}
                          onChange={(e) => cambiarRol(u.id, parseInt(e.target.value), u.nombre)}
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                        >
                          <option value="1" className="text-black bg-white">ADMIN</option>
                          <option value="2" className="text-black bg-white">TECNICO</option>
                          <option value="3" className="text-black bg-white">CLIENTE</option>
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
                        <span className="oval-icon">{u.bloqueado ? "🔓" : "🔒"}</span>
                        <span className="oval-text">{u.bloqueado ? "Desbloquear" : "Bloquear"}</span>
                      </button>
                      <button className="btn-table-oval-small delete-oval" onClick={() => eliminarUsuario(u.id, u.role_id)}>🗑️</button>
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