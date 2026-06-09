import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, PlusCircle, Trash2, Layout, Image as ImageIcon, Link as LinkIcon, MoveVertical } from 'lucide-react';
import Header from "./Shared/Header";
import "../styles/CustomizeLogin.css";

const ICONS_LIST = [
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Twitter', label: 'Twitter/X' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'Youtube', label: 'YouTube' },
  { value: 'Phone', label: 'Teléfono' },
  { value: 'Mail', label: 'Correo' },
  { value: 'Globe', label: 'Página Web' },
  { value: 'MapPin', label: 'Ubicación' },
];

const CustomizeLogin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fondo'); // 'fondo', 'logo', 'sidebar'
  
  // -- ESTADOS TAB: FONDO --
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [imageToDelete, setImageToDelete] = useState(false);
  
  // -- ESTADOS TAB: LOGO --
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [logoToDelete, setLogoToDelete] = useState(false);

  // -- ESTADOS TAB: SIDEBAR --
  const [sidebarLinks, setSidebarLinks] = useState([]);

  // -- ESTADOS GLOBALES --
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCurrentSettings = async () => {
      try {
        // Fetch fondo y logo
        const responseSettings = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/login-settings`);
        if (responseSettings.data.success) {
          if (responseSettings.data.settings.imageUrl) setPreviewUrl(responseSettings.data.settings.imageUrl);
          if (responseSettings.data.settings.colorHex) setSelectedColor(responseSettings.data.settings.colorHex);
          if (responseSettings.data.settings.appLogo) setLogoPreviewUrl(responseSettings.data.settings.appLogo);
        }

        // Fetch sidebar links
        const responseSidebar = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/sidebar-links`);
        if (responseSidebar.data.success) {
          setSidebarLinks(responseSidebar.data.links || []);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchCurrentSettings();
  }, []);

  // -- HANDLERS FONDO --
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImageToDelete(false);
      setStatusMessage("");
    }
  };
  const handleDeleteImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageToDelete(true);
    setStatusMessage("");
  };

  // -- HANDLERS LOGO --
  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
      setLogoToDelete(false);
      setStatusMessage("");
    }
  };
  const handleDeleteLogo = () => {
    setSelectedLogoFile(null);
    setLogoPreviewUrl(null);
    setLogoToDelete(true);
    setStatusMessage("");
  };

  // -- HANDLERS SIDEBAR --
  const addSidebarLink = () => {
    setSidebarLinks([...sidebarLinks, { id: Date.now(), icon: 'Globe', label: '', url: '' }]);
  };
  
  const updateSidebarLink = (id, field, value) => {
    setSidebarLinks(sidebarLinks.map(link => link.id === id ? { ...link, [field]: value } : link));
  };
  
  const removeSidebarLink = (id) => {
    setSidebarLinks(sidebarLinks.filter(link => link.id !== id));
  };

  const moveLink = (index, direction) => {
    if (index + direction < 0 || index + direction >= sidebarLinks.length) return;
    const newLinks = [...sidebarLinks];
    const temp = newLinks[index];
    newLinks[index] = newLinks[index + direction];
    newLinks[index + direction] = temp;
    setSidebarLinks(newLinks);
  };

  // -- GUARDAR TODO --
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage("");

    try {
      // 1. Guardar Color
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/login-background/color`, { color_hex: selectedColor });

      // 2. Guardar Imagen de Fondo
      if (imageToDelete) {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/login-background/image`);
        setImageToDelete(false);
      } else if (selectedFile) {
        const formData = new FormData();
        formData.append("background_image", selectedFile);
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/login-background/image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSelectedFile(null);
      }

      // 3. Guardar Logo
      if (logoToDelete) {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/app-logo`);
        setLogoToDelete(false);
      } else if (selectedLogoFile) {
        const formDataLogo = new FormData();
        formDataLogo.append("app_logo", selectedLogoFile);
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/app-logo`, formDataLogo, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSelectedLogoFile(null);
      }

      // 4. Guardar Sidebar Links
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/sidebar-links`, { links: sidebarLinks });

      setStatusMessage("¡Éxito! Todos los cambios han sido guardados.");
      
      // Emitir evento para que Header y Sidebar recarguen su configuración sin tener que recargar la página entera
      window.dispatchEvent(new Event('settings-updated'));
      
    } catch (error) {
      console.error("Save error:", error);
      setStatusMessage("Error al guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="main-container">
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      <div className="content-wrapper">
        <Header titulo="CONFIGURACIÓN GLOBAL" />

        <div className="customize-wrapper">
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '5px', 
              background: '#F26522', color: 'white', padding: '8px 25px', 
              borderRadius: '25px', border: 'none', cursor: 'pointer', 
              fontWeight: 'bold', fontSize: '0.9rem', alignSelf: 'flex-start',
              marginBottom: '15px'
            }}
          >
            <ChevronLeft size={18} />
            <span>VOLVER AL PANEL</span>
          </button>

          <h2 className="customize-title">APARIENCIA Y NAVEGACIÓN</h2>

          {/* TABS MENU */}
          <div className="tabs-container">
            <button className={`tab-button ${activeTab === 'fondo' ? 'active' : ''}`} onClick={() => setActiveTab('fondo')}>
              <Layout size={18} /> Fondo de Inicio
            </button>
            <button className={`tab-button ${activeTab === 'logo' ? 'active' : ''}`} onClick={() => setActiveTab('logo')}>
              <ImageIcon size={18} /> Logotipo
            </button>
            <button className={`tab-button ${activeTab === 'sidebar' ? 'active' : ''}`} onClick={() => setActiveTab('sidebar')}>
              <LinkIcon size={18} /> Botones del Sidebar
            </button>
          </div>

          <div className="customize-card">
            
            {/* PESTAÑA 1: FONDO DE INICIO */}
            {activeTab === 'fondo' && (
              <div className="customize-grid">
                <div>
                  <span className="customize-section-title">1. IMAGEN DE FONDO</span>
                  <div className="preview-box" style={{ backgroundColor: selectedColor }}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ color: "#fff", textShadow: "1px 1px 3px rgba(0,0,0,0.8)", fontWeight: "bold" }}>Vista previa del color</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <label className="btn-choose-file">
                      📂 ELEGIR FOTO
                      <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} style={{ display: "none" }} />
                    </label>
                    {(previewUrl || selectedFile) && (
                      <button type="button" onClick={handleDeleteImage} className="btn-delete-file" title="Eliminar imagen">🗑️</button>
                    )}
                  </div>
                </div>

                <div>
                  <span className="customize-section-title">2. COLOR PREDETERMINADO</span>
                  <div className="color-picker-container">
                    <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="color-picker-input" />
                    <div>
                      <div style={{ fontWeight: "900", fontSize: "1.3rem", color: "#000000" }}>
                        {selectedColor.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <p className="color-note">
                    <strong>Nota:</strong> Este color será el fondo de tu sistema de inicio de sesión.<br />
                    Si subes una imagen, el color quedará oculto detrás de la foto, pero se mostrará unos milisegundos mientras la foto carga.
                  </p>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: LOGOTIPO */}
            {activeTab === 'logo' && (
              <div className="customize-grid">
                <div>
                  <span className="customize-section-title">LOGO PRINCIPAL DE LA PLATAFORMA</span>
                  <p className="color-note" style={{ marginBottom: '15px' }}>
                    Aparecerá en el encabezado de los paneles y en la pantalla de inicio de sesión.
                    Se recomienda un formato PNG con fondo transparente (máx 2MB).
                  </p>
                  
                  <div className="preview-box" style={{ backgroundColor: '#ffffff', border: '1px dashed #ccc' }}>
                    {logoPreviewUrl ? (
                      <img src={logoPreviewUrl} alt="Logo Preview" style={{ width: "auto", height: "80%", maxWidth: "80%", objectFit: "contain" }} />
                    ) : (
                      <span style={{ color: "#aaa", fontWeight: "bold" }}>No se ha subido ningún logo</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <label className="btn-choose-file" style={{ backgroundColor: '#007bff' }}>
                      📂 ELEGIR LOGO
                      <input type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" onChange={handleLogoFileChange} style={{ display: "none" }} />
                    </label>
                    {(logoPreviewUrl || selectedLogoFile) && (
                      <button type="button" onClick={handleDeleteLogo} className="btn-delete-file" title="Eliminar Logo">🗑️</button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: SIDEBAR (REDES SOCIALES) */}
            {activeTab === 'sidebar' && (
              <div>
                <span className="customize-section-title">BOTONES DE CONTACTO PARA EL CLIENTE</span>
                <p className="color-note">
                  Agrega botones de redes sociales, página web o métodos de contacto que aparecerán en la barra lateral del cliente.
                </p>
                
                <div className="sidebar-links-list">
                  {sidebarLinks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#999', fontStyle: 'italic', background: 'white', borderRadius: '10px' }}>
                      Aún no has agregado ningún botón. Haz clic en "Añadir Enlace" para empezar.
                    </div>
                  ) : (
                    sidebarLinks.map((link, index) => (
                      <div key={link.id} className="sidebar-link-item">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <button onClick={() => moveLink(index, -1)} disabled={index === 0} style={{ cursor: index === 0 ? 'not-allowed' : 'pointer', background: 'none', border: 'none', opacity: index === 0 ? 0.3 : 1 }}>▲</button>
                          <button onClick={() => moveLink(index, 1)} disabled={index === sidebarLinks.length - 1} style={{ cursor: index === sidebarLinks.length - 1 ? 'not-allowed' : 'pointer', background: 'none', border: 'none', opacity: index === sidebarLinks.length - 1 ? 0.3 : 1 }}>▼</button>
                        </div>
                        
                        <select 
                          className="sidebar-link-icon-select"
                          value={link.icon}
                          onChange={(e) => updateSidebarLink(link.id, 'icon', e.target.value)}
                        >
                          {ICONS_LIST.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        
                        <input 
                          type="text" 
                          placeholder="Etiqueta (ej. Mi Facebook)" 
                          className="sidebar-link-input"
                          value={link.label}
                          onChange={(e) => updateSidebarLink(link.id, 'label', e.target.value)}
                        />
                        
                        <input 
                          type="url" 
                          placeholder="URL (ej. https://facebook.com/pagina)" 
                          className="sidebar-link-input"
                          value={link.url}
                          onChange={(e) => updateSidebarLink(link.id, 'url', e.target.value)}
                        />
                        
                        <button onClick={() => removeSidebarLink(link.id)} className="btn-delete-file" style={{ padding: '8px' }} title="Borrar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                <button type="button" className="btn-add-link" onClick={addSidebarLink}>
                  <PlusCircle size={18} /> AÑADIR NUEVO BOTÓN
                </button>
              </div>
            )}

            {/* BARRA DE GUARDAR GENERAL */}
            <div style={{ borderTop: "2px solid #ccc", paddingTop: "20px", marginTop: "20px" }}>
              <button onClick={handleSaveChanges} disabled={isSaving} className="btn-save-all">
                {isSaving ? "GUARDANDO TODOS LOS CAMBIOS..." : "💾 GUARDAR TODA LA CONFIGURACIÓN"}
              </button>
            </div>

            {statusMessage && (
              <p style={{
                marginTop: "15px", fontWeight: "bold", padding: "10px", borderRadius: "10px",
                textAlign: "center", fontSize: "1rem", color: "white",
                backgroundColor: statusMessage.includes("Error") ? "#ff4444" : "#4CAF50"
              }}>
                {statusMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizeLogin;
