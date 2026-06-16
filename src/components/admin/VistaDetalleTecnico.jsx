import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft, User, Mail, MapPin, Phone, ShieldCheck, X, Save, 
  Image as ImageIcon, FileText, Camera, BarChart3, Clock
} from 'lucide-react';
import '../../styles/Admin/VistaDetalleCliente.css';
import '../../styles/Admin/VistaDetalleTecnico.css';

const VistaDetalleTecnico = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [tecnico, setTecnico] = useState(location.state?.tecnico || location.state?.u || null);
  const [reportes, setReportes] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Modal para edición de perfil
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: tecnico?.name || tecnico?.nombre || '',
    correo: tecnico?.email || tecnico?.correo || '',
    telefono: tecnico?.phone || tecnico?.telefono || '',
    direccion: tecnico?.address || tecnico?.direccion || '',
    estado: tecnico?.estado || 'Activo',
    password: '',
  });

  // Modal para ver foto completa
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!tecnico) return;

    const cargarDatosAuditoria = async () => {
      try {
        const id = tecnico.id; // user_id del tecnico
        
        // Solo necesitamos Reportes Globales y Cotizaciones (ambos tienen el rastro del tecnico)
        const [resReportes, resCotizaciones] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/reportes-globales`).catch(() => ({ data: [] })),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`).catch(() => ({ data: [] }))
        ]);

        const reportesGlobales = resReportes.data || [];
        const todasCotizaciones = resCotizaciones.data || [];

        // Filtrar reportes creados por este técnico
        const misReportes = reportesGlobales.filter(r => 
          r.technician_id == id || (r.technician && r.technician.id == id)
        );

        // Filtrar cotizaciones generadas por este técnico
        const misCotizaciones = todasCotizaciones.filter(c => 
          c.tecnico_id == id || c.tecnico_user_id == id || (c.created_by_role === 'Técnico' && (c.tecnico_id == id || c.user_id == id))
        );

        setReportes(misReportes);
        setCotizaciones(misCotizaciones);
      } catch (error) {
        console.error('Error al cargar datos de auditoría:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosAuditoria();
  }, [tecnico]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/usuarios/${tecnico.id}`, formData);
      setTecnico({ ...tecnico, ...formData });
      setIsModalOpen(false);
      alert('Técnico actualizado correctamente');
    } catch (error) {
      alert('Error al actualizar: ' + (error.response?.data?.message || error.message));
    }
  };

  if (!tecnico) {
    return <div className="loading-container"><h2>No se encontró información del técnico.</h2></div>;
  }

  // Filtrar solo los reportes que tienen imagen válida para la galería
  const galeriaFotos = reportes.filter(r => r.image_url || r.image_path);

  return (
    <div className="main-container-users bg-light">
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      {/* HEADER DE NAVEGACIÓN */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', background: 'white', borderBottom: '1px solid #ddd' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '8px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <ChevronLeft size={20} /> REGRESAR
        </button>
        <h2 style={{ margin: '0 0 0 20px', color: '#2c3e50', fontSize: '1.4rem' }}>
          Auditoría de Técnico
        </h2>
      </div>

      <div className="detalle-cliente-container" style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
        
        {/* LADO IZQUIERDO: PERFIL */}
        <div className="cliente-sidebar">
          <div className="cliente-profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {tecnico.profile_picture_url ? (
                  <img src={tecnico.profile_picture_url} alt="Perfil" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
                ) : (
                  <User size={60} color="#F26522" />
                )}
              </div>
              <h2 className="cliente-name">{tecnico.nombre || tecnico.name}</h2>
              <span className="cliente-type-badge" style={{background: '#e8f4fd', color: '#3498db'}}>TÉCNICO</span>
            </div>

            <div className="cliente-info-list">
              <div className="info-item">
                <Mail className="info-icon" />
                <div>
                  <span className="info-label">CORREO ELECTRÓNICO</span>
                  <span className="info-value">{tecnico.correo || tecnico.email}</span>
                </div>
              </div>
              <div className="info-item">
                <Phone className="info-icon" />
                <div>
                  <span className="info-label">TELÉFONO</span>
                  <span className="info-value">{tecnico.telefono || tecnico.phone || 'No especificado'}</span>
                </div>
              </div>
              <div className="info-item">
                <MapPin className="info-icon" />
                <div>
                  <span className="info-label">DIRECCIÓN PARTICULAR</span>
                  <span className="info-value">{tecnico.direccion || tecnico.address || 'No especificada'}</span>
                </div>
              </div>
              <div className="info-item">
                <ShieldCheck className="info-icon" />
                <div>
                  <span className="info-label">ID DE SISTEMA</span>
                  <span className="info-value">#{tecnico.id}</span>
                </div>
              </div>
            </div>

            <button className="btn-edit-profile" onClick={() => setIsModalOpen(true)}>
              MODIFICAR PERFIL
            </button>
          </div>
        </div>

        {/* LADO DERECHO: PANEL DE AUDITORÍA */}
        <div className="cliente-content" style={{ padding: '0' }}>
          
          {cargando ? (
            <div className="loading-state">Cargando datos de auditoría...</div>
          ) : (
            <div className="audit-dashboard">
              
              {/* TARJETAS DE KPIs */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-icon orange"><Camera size={26} /></div>
                  <div className="kpi-info">
                    <h4>Fotos Subidas</h4>
                    <p>{galeriaFotos.length}</p>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon blue"><FileText size={26} /></div>
                  <div className="kpi-info">
                    <h4>Cotizaciones Generadas</h4>
                    <p>{cotizaciones.length}</p>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon green"><BarChart3 size={26} /></div>
                  <div className="kpi-info">
                    <h4>Actividad Total</h4>
                    <p>{reportes.length + cotizaciones.length}</p>
                  </div>
                </div>
              </div>

              {/* MURO DE EVIDENCIAS FOTOGRÁFICAS */}
              <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div className="audit-section-header">
                  <ImageIcon className="icon" size={24} />
                  <h3>Muro de Evidencias Fotográficas</h3>
                </div>

                {galeriaFotos.length > 0 ? (
                  <div className="photo-wall">
                    {galeriaFotos.map((foto, index) => (
                      <div key={index} className="photo-item" onClick={() => setSelectedImage(foto)}>
                        <img src={foto.image_url || foto.image_path} alt="Evidencia" />
                        <div className="photo-overlay">
                          <span className="date">{new Date(foto.created_at).toLocaleDateString()}</span>
                          <span className="prop">{foto.property?.property_name || foto.property?.address || 'Sin asignar'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-audit">
                    <Camera size={40} />
                    <p>El técnico no ha subido ninguna fotografía de evidencia al sistema.</p>
                  </div>
                )}
              </div>

              {/* HISTORIAL DE COTIZACIONES */}
              <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div className="audit-section-header">
                  <FileText className="icon" size={24} />
                  <h3>Cotizaciones Creadas por el Técnico</h3>
                </div>

                {cotizaciones.length > 0 ? (
                  <div className="quotes-list">
                    {cotizaciones.map((cot, index) => (
                      <div key={index} className="quote-card">
                        <div className="quote-info">
                          <span className="quote-title">{cot.folio || `Cotización #${cot.id}`}</span>
                          <div className="quote-meta">
                            <span><Clock size={14} style={{verticalAlign:'middle', marginRight:'4px'}}/> {new Date(cot.created_at).toLocaleDateString()}</span>
                            <span>{cot.property?.property_name || cot.property?.address || 'Sin propiedad'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span className={`quote-status ${(cot.status || 'pendiente').toLowerCase()}`}>
                            {cot.status || 'Pendiente'}
                          </span>
                          <button className="quote-action" onClick={() => navigate('/cotizaciones-admin')}>
                            VER TABLA
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-audit">
                    <FileText size={40} />
                    <p>El técnico no ha generado ninguna cotización todavía.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* MODAL EDICIÓN PERFIL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              <X size={24} />
            </button>
            <h2 className="modal-title">Modificar Perfil</h2>
            <div className="modal-form">
              <div className="form-group">
                <label>Nombre Completo</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input type="email" name="correo" value={formData.correo} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select name="estado" value={formData.estado} onChange={handleInputChange}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <button className="btn-save" onClick={handleUpdate}>
                <Save size={18} /> GUARDAR CAMBIOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISOR DE FOTOGRAFÍA */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setSelectedImage(null)}>
              <X size={32} />
            </button>
            <img src={selectedImage.image_url || selectedImage.image_path} alt="Evidencia Ampliada" />
            <div className="image-modal-info">
              <h4>Reporte de Evidencia</h4>
              <p>Fecha: {new Date(selectedImage.created_at).toLocaleString()}</p>
              {selectedImage.property && (
                <p>Propiedad: {selectedImage.property.property_name || selectedImage.property.address}</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VistaDetalleTecnico;