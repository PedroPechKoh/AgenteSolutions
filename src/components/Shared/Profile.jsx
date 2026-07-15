import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/Logo3.png"; 
import "../../styles/Profile.css"; 

const ESPECIALIDADES_CATALOGO = [
  { id: 1, name: "Electricidad", icon: "⚡" },
  { id: 2, name: "Plomería", icon: "🚰" },
  { id: 3, name: "Aire Acondicionado (HVAC)", icon: "❄️" },
  { id: 4, name: "Pintura e Impermeabilización", icon: "🎨" },
  { id: 5, name: "Albañilería y Remodelación", icon: "🧱" },
  { id: 6, name: "Carpintería y Muebles", icon: "🪚" },
  { id: 7, name: "Cerrajería y Seguridad", icon: "🔑" },
  { id: 8, name: "Limpieza y Mantenimiento", icon: "🧹" },
  { id: 9, name: "Multi-técnico / General", icon: "🧰" },
  { id: 10, name: "Electrodomésticos y Equipos", icon: "🔌" },
  { id: 11, name: "Jardinería y Exteriores", icon: "🪴" },
  { id: 12, name: "Redes y CCTV", icon: "🖥️" }
];

const Profile = () => {
  const { user, loginGlobal, logoutGlobal } = useAuth();
  const navigate = useNavigate();

  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const uploadTargetRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmEmail !== user?.email) {
      setDeleteError("El correo no coincide con tu usuario.");
      return;
    }
    setDeletingAccount(true);
    setDeleteError('');
    try {
      const token = localStorage.getItem("agente_token");
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/users/delete-my-account`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      logoutGlobal();
      navigate('/login');
    } catch (error) {
      console.error("Error al eliminar cuenta:", error);
      setDeleteError(error.response?.data?.error || "No se pudo eliminar tu cuenta. Por favor contacta a soporte.");
      setDeletingAccount(false);
    }
  };

  const openPhotoMenu = (type) => {
    uploadTargetRef.current = type;
    setIsPhotoMenuOpen(true);
  };

  const selectPhotoSource = (source) => {
    if (source === 'camera') {
      cameraRef.current.click();
    } else {
      galleryRef.current.click();
    }
    setIsPhotoMenuOpen(false);
  };
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    birth_date: ''
  });

  useEffect(() => {
    if (user?.role_id === 2 && user?.id) {
      const fetchMySpecialties = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/users/u_${user.id}/specialties`);
          if (res.data?.success && res.data?.specialties) {
            const specsArray = res.data.specialties;
            const specsNames = specsArray.map(s => typeof s === 'string' ? s : s.name);
            setSelectedSpecialties(specsNames);
            if (loginGlobal && JSON.stringify(user.specialties || []) !== JSON.stringify(specsArray)) {
              loginGlobal({ ...user, specialties: specsArray });
            }
          }
        } catch (err) {
          console.error("Error cargando especialidades del técnico:", err);
        }
      };
      fetchMySpecialties();
    }
  }, [user?.id, user?.role_id]);

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
    if (user?.role_id === 2) {
      const specs = (user?.specialties && user.specialties.length > 0)
        ? user.specialties.map(s => typeof s === 'string' ? s : s.name)
        : (selectedSpecialties.length > 0 ? selectedSpecialties : ["Electricidad"]);
      setSelectedSpecialties(specs);
    }
    setIsModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault(); 
    try {
      const token = localStorage.getItem('agente_token');
      
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/usuarios/update-profile`, {
        user_id: user.id,
        ...formData
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let updatedSpecs = user?.specialties || [];
      if (user?.role_id === 2) {
        const specRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/users/u_${user.id}/specialties`, {
          specialties: selectedSpecialties
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (specRes.data?.specialties) {
          updatedSpecs = specRes.data.specialties;
        }
      }

      console.log("Perfil actualizado:", res.data);
      
      loginGlobal({
        ...user,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        birth_date: formData.birth_date,
        specialties: updatedSpecs
      });

      setIsModalOpen(false);
      alert("¡Datos actualizados con éxito!");
    } catch (error) {
      console.error("Error en handleSaveProfile:", error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Hubo un error al actualizar los datos.";
      alert(errorMsg);
    }
  };

  // --- MAGIA DE CLOUDINARY ---
  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!user?.id) return alert("Error: La sesión no tiene el ID.");

    if (file.size > 10 * 1024 * 1024) {
      return alert("La imagen es muy pesada. Por favor elige una menor a 10MB.");
    }

    const uploadData = new FormData();
    uploadData.append('image', file); 
    uploadData.append('type', type); 

    try {
      setIsUploading(true);
      const token = localStorage.getItem('agente_token'); 

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload-profile-picture`, uploadData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        }
      });

      const nuevaUrlNube = res.data.url;

      loginGlobal({
        ...user, 
        [type]: nuevaUrlNube
      });

      alert(`¡${type === 'profile_picture' ? 'Foto de perfil' : 'Portada'} actualizada con éxito!`);

    } catch (error) {
      console.error("Error en handleFileUpload:", error);
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
          
          <div 
            className="profile-banner" 
            style={{ backgroundImage: user?.cover_picture ? `url(${user.cover_picture})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center'}}
            onClick={() => openPhotoMenu('cover_picture')}
          >
            <div className="banner-overlay"></div>
            <div className="banner-hover-overlay">
              <Camera size={48} color="white" />
              <span>Cambiar Portada</span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); navigate(-1); }}
              style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '8px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
            >
              <ChevronLeft size={18} />
              <span>REGRESAR</span>
            </button>
            
            <div className="banner-logo-wrapper" onClick={(e) => e.stopPropagation()}>
              <img src={logo} alt="Agente Solutions" className="banner-logo" />
            </div>
            
          </div>

          <div className="profile-content">
            <div className="profile-header-info">
              <div className="profile-header-left">
                <div className="avatar-section">
                  <div className="avatar-wrapper" onClick={() => openPhotoMenu('profile_picture')}>
                    {user?.profile_picture ? (
                      <img src={user.profile_picture} alt="Avatar" className="profile-avatar" />
                    ) : (
                      <div className="profile-avatar-placeholder">
                        {user?.first_name ? user.first_name.charAt(0).toUpperCase() : (user?.name ? user.name.charAt(0).toUpperCase() : '👤')}
                      </div>
                    )}
                    <div className="avatar-hover-overlay"><Camera size={40} color="white" /></div>
                  </div>
                  <input type="file" ref={cameraRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, uploadTargetRef.current)} accept="image/*" capture="environment" />
                  <input type="file" ref={galleryRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, uploadTargetRef.current)} accept="image/*" />
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
                <div className="data-grid-item"><label>Miembro desde</label><p>{formatearFecha(user?.created_at)}</p></div>
              </div>

              {user?.role_id === 2 && (() => {
                const displaySpecs = (user?.specialties && user.specialties.length > 0)
                  ? user.specialties
                  : (selectedSpecialties.length > 0 ? selectedSpecialties : null);
                return (
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <h4 style={{ color: '#ff6600', marginBottom: '10px', fontSize: '0.9rem', textTransform: 'uppercase' }}>🛠️ Especialidades Registradas</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {displaySpecs ? (
                        displaySpecs.map((s, idx) => {
                          const specName = typeof s === 'string' ? s : s.name;
                          const specObj = ESPECIALIDADES_CATALOGO.find(item => item.name === specName) || (typeof s === 'object' ? s : null);
                          const icon = specObj ? (specObj.icon || '⚡') : '⚡';
                          return (
                            <span key={idx} style={{ padding: '6px 14px', borderRadius: '20px', background: '#FFF3E6', border: '1.5px solid #FF6600', color: '#D94E00', fontSize: '0.85rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              {icon} {specName}
                            </span>
                          );
                        })
                      ) : (
                        <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.85rem' }}>No has seleccionado especialidades. HAZ CLIC EN EDITAR DATOS para agregar.</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {user?.role_id !== 0 && (
                <div style={{ marginTop: '35px', paddingTop: '25px', paddingBottom: '30px', borderTop: '1px solid #EEEEEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <h4 style={{ color: '#EF4444', margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 'bold' }}>¿Deseas eliminar tu cuenta?</h4>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem', lineHeight: '1.4' }}>Al eliminar tu cuenta se desactivará tu perfil y dejarás de tener acceso al sistema.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmEmail('');
                      setDeleteError('');
                      setIsDeleteModalOpen(true);
                    }}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '8px',
                      border: '1.5px solid #EF4444',
                      background: '#FEF2F2',
                      color: '#EF4444',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    🗑️ Eliminar mi Cuenta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', borderTop: '6px solid #EF4444' }}>
            <button className="btn-close-modal" onClick={() => setIsDeleteModalOpen(false)}>&times;</button>
            <h3 className="modal-title" style={{ color: '#EF4444', borderBottom: '2px solid #FEF2F2' }}>⚠️ Eliminar Cuenta</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem', lineHeight: '1.5' }}>
                Estás a punto de solicitar la eliminación y desactivación de tu cuenta en <strong>Agente Solutions</strong>. 
                Dejarás de tener acceso inmediato al sistema y tus propiedades/datos dejarán de estar visibles al público.
              </p>
              <div style={{ background: '#FFF7ED', border: '1px solid #FDBA74', padding: '12px', borderRadius: '8px' }}>
                <p style={{ margin: 0, color: '#9A3412', fontSize: '0.82rem' }}>
                  💡 <em>Si en el futuro deseas recuperar tu acceso, historial o solicitar el respaldo de tus datos, deberás comunicarte con nuestro equipo de Soporte Técnico.</em>
                </p>
              </div>
              <div style={{ marginTop: '5px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                  Para confirmar, escribe tu correo electrónico (<strong>{user?.email}</strong>):
                </label>
                <input
                  type="text"
                  placeholder={user?.email || 'Escribe tu correo...'}
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.95rem',
                    color: '#0F172A',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {deleteError && (
                <div style={{ color: '#EF4444', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {deleteError}
                </div>
              )}
              <div className="modal-actions" style={{ marginTop: '10px', paddingTop: '15px' }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deletingAccount}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteAccount}
                  disabled={deletingAccount || deleteConfirmEmail !== user?.email}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: (deleteConfirmEmail === user?.email && !deletingAccount) ? '#EF4444' : '#E2E8F0',
                    color: (deleteConfirmEmail === user?.email && !deletingAccount) ? '#FFFFFF' : '#94A3B8',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    cursor: (deleteConfirmEmail === user?.email && !deletingAccount) ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                >
                  {deletingAccount ? 'Eliminando...' : 'Sí, Eliminar mi Cuenta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPhotoMenuOpen && (
        <div className="modal-overlay" onClick={() => setIsPhotoMenuOpen(false)}>
          <div className="modal-content photo-menu-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ color: '#ff6600', borderBottom: '2px solid #EEEEEE' }}>Actualizar Foto</h3>
            <div className="photo-menu-actions">
              <button className="btn-menu-action" onClick={() => selectPhotoSource('camera')}>
                📷 Tomar Foto
              </button>
              <button className="btn-menu-action" onClick={() => selectPhotoSource('gallery')}>
                🖼️ Elegir de la Galería
              </button>
              <button className="btn-menu-action btn-menu-cancel" onClick={() => setIsPhotoMenuOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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

            {user?.role_id === 2 && (
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label style={{ color: '#ff6600', fontWeight: 'bold' }}>🛠️ Editar Mis Especialidades:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '160px', overflowY: 'auto', padding: '10px', background: '#F0F2F5', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                  {ESPECIALIDADES_CATALOGO.map(spec => {
                    const isSelected = selectedSpecialties.includes(spec.name);
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedSpecialties.length > 1) {
                              setSelectedSpecialties(prev => prev.filter(s => s !== spec.name));
                            }
                          } else {
                            setSelectedSpecialties(prev => [...prev, spec.name]);
                          }
                        }}
                        style={{
                          padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                          border: isSelected ? '1.5px solid #FF6600' : '1px solid #CBD5E1',
                          background: isSelected ? 'linear-gradient(135deg, #FF6600 0%, #d94e00 100%)' : '#FFFFFF',
                          color: isSelected ? '#FFFFFF' : '#334155',
                          fontWeight: isSelected ? 'bold' : '600', fontSize: '0.8rem',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          boxShadow: isSelected ? '0 2px 6px rgba(255,102,0,0.3)' : '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      >
                        <span>{spec.icon}</span> <span>{spec.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                {user?.role_id !== 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setDeleteConfirmEmail('');
                      setDeleteError('');
                      setIsDeleteModalOpen(true);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #EF4444',
                      background: 'transparent',
                      color: '#EF4444',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Eliminar Cuenta
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Guardar Cambios</button>
              </div>
            </div>
          </form>
        </div>
      </div>
      )}

    </div>
  );
};

export default Profile;