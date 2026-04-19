import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, X } from 'lucide-react'; 
import axios from 'axios';
import Header from './Header'; 
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/Logo3.png"; 
import "../../styles/Profile.css"; 

const Profile = () => {
  const { user, loginGlobal } = useAuth();
  const navigate = useNavigate();

  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    birth_date: ''
  });

  const obtenerNombreRol = (roleId) => {
    switch(roleId) {
      case 0: return 'Usuario Root';
      case 1: return 'Administrador';
      case 2: return 'Técnico';
      case 3: return 'Cliente';
      default: return 'Usuario';
    }
  };

  const formatearFecha = (fechaDb) => {
    if (!fechaDb) return 'No registrada'; 
    const fecha = new Date(fechaDb);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const openModal = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
      birth_date: user?.birth_date || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault(); 
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/usuarios/update-profile`, {
        id: `u_${user.id}`,
        ...formData
      });

      loginGlobal({
        ...user,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        birth_date: formData.birth_date
      });

      setIsModalOpen(false);
      alert("¡Datos actualizados con éxito!");
    } catch (error) {
      console.error(error);
      alert("Hubo un error al actualizar los datos.");
    }
  };

  // --- MAGIA DE CLOUDINARY (VERSIÓN FINAL) ---
  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!user?.id) return alert("Error: La sesión no tiene el ID.");

    // Límite ajustado a 10MB (Límite del plan gratuito de Cloudinary)
    if (file.size > 10 * 1024 * 1024) {
      return alert("La imagen es muy pesada. Por favor elige una menor a 10MB.");
    }

    const uploadData = new FormData();
    uploadData.append('image', file); 
    uploadData.append('type', type); 

    try {
      setIsUploading(true);
      
      // Leemos exactamente tu token personalizado de Railway
      const token = localStorage.getItem('agente_token'); 

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload-profile-picture`, uploadData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        }
      });

      // Extraemos la URL de la nube
      const nuevaUrlNube = res.data.url;

      // Actualizamos el estado global para que el cambio sea instantáneo en pantalla
      loginGlobal({
        ...user, 
        [type]: nuevaUrlNube
      });

      alert(`¡${type === 'profile_picture' ? 'Foto de perfil' : 'Portada'} actualizada con éxito!`);

    } catch (error) {
      console.error("Error al subir a Cloudinary:", error);
      alert("Error al subir la imagen. Revisa la consola.");
    } finally {
      setIsUploading(false);
    }
  };

  const nombreCompleto = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || 'Cargando nombre...';

  return (
    <div className="main-container">
      <div className="profile-page-scrollable-content">
        <div className="profile-card full-screen-card">
          
          <div className="profile-banner" style={{ backgroundImage: user?.cover_picture ? `url(${user.cover_picture})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center'}}>
            <div className="banner-overlay"></div>
            <button className="back-oval-btn" onClick={() => navigate(-1)}>
              <X size={20} className="close-icon" />
              <span className="back-text">Regresar</span>
            </button>
            <div className="banner-logo-wrapper"><img src={logo} alt="Agente Solutions" className="banner-logo" /></div>
            
            <button className="btn-edit-cover" onClick={() => coverInputRef.current.click()} disabled={isUploading}>
               <Camera size={20} /> {isUploading ? 'Subiendo...' : 'Cambiar Portada'}
            </button>
            <input type="file" ref={coverInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'cover_picture')} accept="image/*" />
          </div>

          <div className="profile-content">
            <div className="profile-header-info">
              <div className="profile-header-left">
                <div className="avatar-section">
                  <div className="avatar-wrapper" onClick={() => profileInputRef.current.click()}>
                    {user?.profile_picture ? (
                      <img src={user.profile_picture} alt="Avatar" className="profile-avatar" />
                    ) : (
                      <div className="profile-avatar-placeholder">
                        {user?.first_name ? user.first_name.charAt(0).toUpperCase() : (user?.name ? user.name.charAt(0).toUpperCase() : '👤')}
                      </div>
                    )}
                    <div className="avatar-hover-overlay"><Camera size={40} color="white" /></div>
                  </div>
                  <input type="file" ref={profileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'profile_picture')} accept="image/*" />
                </div>
                
                <div className="user-info-section">
                  <h2>{nombreCompleto}</h2>
                  <span className="role-badge">{obtenerNombreRol(user?.role_id)}</span>
                </div>
              </div>

              <div className="profile-actions-section">
                <button className="btn-edit-profile" onClick={openModal}>EDITAR DATOS</button>
              </div>
            </div>

            <div className="about-section">
              <h3>Datos del Usuario</h3>
              <div className="about-grid">
                <div className="data-group"><label>Nombre Completo</label><p>{nombreCompleto}</p></div>
                <div className="data-group"><label>Rol en sistema</label><p className="highlight-orange">{obtenerNombreRol(user?.role_id)}</p></div>
                <div className="data-group"><label>Correo Electrónico</label><p>{user?.email || 'No registrado'}</p></div>
                <div className="data-group"><label>Teléfono</label><p>{user?.phone_number || 'No registrado'}</p></div>
                <div className="data-group"><label>Fecha de Nacimiento</label><p>{formatearFecha(user?.birth_date)}</p></div>
                <div className="data-group"><label>Miembro desde</label><p>{formatearFecha(user?.created_at)}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

     {isModalOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
            &times;
          </button>
          
          <h3 className="modal-title">Editar Perfil</h3>
          
          <form onSubmit={handleSaveProfile} className="edit-profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre(s)</label>
                <input type="text" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Apellidos</label>
                <input type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Teléfono Celular</label>
                <input type="tel" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Fecha de Nacimiento</label>
                <input type="date" value={formData.birth_date} onChange={(e) => setFormData({...formData, birth_date: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label>Correo Electrónico</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              
              <button type="submit" className="btn-save">Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>
      )}

    </div>
  );
};

export default Profile;