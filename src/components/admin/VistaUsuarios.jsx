import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";
import UniversalSearch from "../Shared/UniversalSearch"; 
import Header from "../Shared/Header"; 
import RegisterModal from "../Register";
import "../../styles/Admin/VistaUsuarios.css";

const MAPA_ROLES = { 0: "ROOT", 1: "ADMIN", 2: "TECNICO", 3: "CLIENTE", 4: "AUTONOMO EMP.", 5: "AUTONOMO PER." };

const CATEGORIAS = [
  { label: "TODOS", icon: "👥" },
  { label: "CLIENTES", icon: "👤" },
  { label: "TECNICOS", icon: "🛠️" },
  { label: "ADMINS", icon: "💼" },
  { label: "AUTONOMOS", icon: "🏢" },
  { label: "ROOTS", icon: "🔑" },
];

const VistaUsuarios = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filtro, setFiltro] = useState("TODOS");
  const [cargando, setCargando] = useState(true);
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  const isRoot = user?.role_id === 0;

  const obtenerUsuarios = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/usuarios`);
      const isPersonal = user?.role_id === 5;
      const isEmpresa  = user?.role_id === 4;
      const formateados = data
        .filter(u => {
          if (isRoot) return true;
          if (isPersonal) return u.role_id === 2; // Autónomo Personal solo ve Técnicos
          if (isEmpresa) return u.role_id === 2 || u.role_id === 3; // Autónomo Empresa ve Clientes y Técnicos
          if (user?.role_id === 1) return u.role_id !== 0 && u.role_id !== 4 && u.role_id !== 5;
          return true;
        })
        .map((u) => ({
          id: u.id,
          nombre: `${u.first_name} ${u.last_name || ""}`.trim(),
          correo: u.email,
          rol: MAPA_ROLES[u.role_id] || "DESCONOCIDO",
          role_id: u.role_id,
          approval_status: u.approval_status,
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

  useEffect(() => {
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
  console.error("Error al procesar la solicitud:", error);
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
  console.error(error);
  alert("Hubo un problema al eliminar el usuario.");
}
  };

  return (
    <div className="main-container-users bg-light">
      <div className="top-bar-orange" />
      <div className="top-bar-black" />

      <Header titulo="USUARIOS" />
      
      {/* BOTÓN REGRESAR */}
      <div style={{ padding: '0 10px', marginTop: '10px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '8px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
        >
          <ChevronLeft size={18} />
          <span>REGRESAR</span>
        </button>
      </div>

      {/* 🔥 QUITAMOS overflowX:hidden */}
      <section className="content-area" style={{ padding: '10px' }}>
        
        <div className="filter-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '10px', 
          marginBottom: '20px' 
        }}>
          
          {CATEGORIAS.filter((cat) => {
            if (!isRoot && cat.label === "ROOTS") return false;
            if (!isRoot && user?.role_id !== 1 && (cat.label === "ADMINS" || cat.label === "AUTONOMOS")) return false;
            if (user?.role_id === 5 && cat.label === "CLIENTES") return false; // Autónomo Personal no tiene clientes
            return true;
          }).map((cat) => (
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
            onClick={() => navigate("/map")}
            style={{ backgroundColor: "#fff4e6", border: "1px solid #FF6600", margin: 0, width: "100%" }}
          >
            <span className="icon-box">🗺️</span> VER MAPA
          </div>

          {user?.role_id !== 5 && (
            <div 
              className="filter-item" 
              onClick={() => setShowRegisterModal(true)}
              style={{ backgroundColor: "#fff4e6", border: "1px solid #FF6600", margin: 0, width: "100%" }}
            >
              <span className="icon-box">📝</span> REGISTRAR
            </div>
          )}
        </div>

        <UniversalSearch 
          type="USUARIOS"
          data={listaUsuarios} 
          setFilteredData={setUsuariosFiltrados}
          filtroActual={filtro}
          placeholder="BUSCAR..."
        />

        <RegisterModal 
          isOpen={showRegisterModal} 
          onClose={() => setShowRegisterModal(false)} 
          onSuccess={obtenerUsuarios} 
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
                    
                    <td data-label="Foto">
                      <div className="avatar-circle">
                        {u.profile_picture_url ? (
                          <img src={u.profile_picture_url} alt="Perfil" className="perfil-photo" />
                        ) : "👤"}
                      </div>
                    </td>

                    <td 
                      data-label="Nombre"
                      className={u.rol === "CLIENTE" || u.rol === "TECNICO" ? "clickable-name" : ""} 
                      onClick={() => {
                        if (u.rol === "CLIENTE") {
                          navigate("/detalle-cliente", { state: { cliente: u } });
                        } if (u.rol === "TECNICO") {
                          navigate("/detalle-tecnico", { state: { tecnico: u } });
                        }
                      }}
                    >
                      {u.nombre} {u.bloqueado && <span className="blocked-tag">BLOQUEADO</span>}
                    </td>

                    <td data-label="Correo">{u.correo}</td>

                    <td data-label="Rol">
                      {u.role_id === 0 ? (
                        <span className="badge-rol root">ROOT</span>
                      ) : isRoot ? (
                        <select 
                          className={`badge-rol select-rol-inline`}
                          style={{ backgroundColor: u.role_id === 4 || u.role_id === 5 ? '#f26522' : '#3b82f6', color: '#fff', fontWeight: 'bold' }}
                          value={u.role_id}
                          onChange={(e) => cambiarRol(u.id, parseInt(e.target.value), u.nombre)}
                        >
                          <option value="1">ADMIN (GLOBAL)</option>
                          <option value="7">ADMIN. PROPIEDADES</option>
                          <option value="2">TÉCNICO</option>
                          <option value="3">CLIENTE</option>
                          <option value="4">AUT. EMPRESARIAL ($999)</option>
                          <option value="5">AUT. PERSONAL ($499)</option>
                        </select>
                      ) : u.role_id === 4 ? (
                        <span className="badge-rol autonomo">AUT. EMPRESARIAL</span>
                      ) : u.role_id === 5 ? (
                        <span className="badge-rol autonomo">AUT. PERSONAL</span>
                      ) : (
                        <select 
                          className={`badge-rol ${typeof u.rol === 'string' ? u.rol.toLowerCase() : ''} select-rol-inline`}
                          value={u.role_id}
                          onChange={(e) => cambiarRol(u.id, parseInt(e.target.value), u.nombre)}
                        >
                          <option value="1">ADMIN (GLOBAL)</option>
                          <option value="7">ADMIN. PROPIEDADES</option>
                          <option value="2">TÉCNICO</option>
                          <option value="3">CLIENTE</option>
                        </select>
                      )}
                    </td>

                    <td data-label="Estado">
                      {u.approval_status === 'deleted_by_user' ? (
                        <span style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #F87171', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          🔴 Eliminado por Usuario
                        </span>
                      ) : (
                        <>
                          <span className={`status-dot ${u.bloqueado ? "status-off" : "status-on"}`} />
                          {u.bloqueado ? "Inactivo" : u.estado}
                        </>
                      )}
                    </td>

                    <td data-label="Acciones" className="actions-cell">
                      {u.role_id === 0 || ((u.role_id === 4 || u.role_id === 5) && !isRoot) ? (
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🔒 Protegido
                        </span>
                      ) : (
                        <>
                          <button 
                            className={`btn-table-oval ${u.bloqueado ? "is-blocked" : "is-unblocked"}`} 
                            onClick={() => toggleBloqueo(u.id, u.role_id, u.bloqueado)}
                          >
                            {u.bloqueado ? "🔓 OK" : "🔒 Bloq"}
                          </button>

                          <button 
                            className="btn-table-oval-small delete-oval" 
                            onClick={() => eliminarUsuario(u.id, u.role_id)}
                            title="Eliminar usuario"
                          >
                            🗑️
                          </button>
                        </>
                      )}
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