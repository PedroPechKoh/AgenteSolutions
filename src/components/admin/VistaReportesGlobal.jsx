import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../Shared/Header';
import { Search, MapPin, Calendar, FileText, ChevronLeft, Plus, Edit, Trash2, X, Upload, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import '../../styles/Admin/VistaReportesGlobal.css';

const STAGES = [
  {
    key: 'ANTES',
    title: '1. ANTES DE INICIAR',
    tag: '[ANTES]',
    required: true,
    badgeColor: '#e11d48',
    placeholder: 'Escribe la descripción de las condiciones iniciales...'
  },
  {
    key: 'DURANTE',
    title: '2. DURANTE EL PROCESO',
    tag: '[DURANTE]',
    required: true,
    badgeColor: '#ea580c',
    placeholder: 'Escribe la descripción del avance o procedimiento en proceso...'
  },
  {
    key: 'DESPUES',
    title: '3. DESPUÉS DE FINALIZAR',
    tag: '[DESPUÉS]',
    required: true,
    badgeColor: '#16a34a',
    placeholder: 'Escribe la descripción del resultado final tras concluir...'
  },
  {
    key: 'EXTRA',
    title: '4. ADICIONAL / EXTRA',
    tag: '[EXTRA]',
    required: false,
    badgeColor: '#64748b',
    placeholder: 'Observaciones o evidencia adicional (opcional)...'
  }
];

const VistaReportesGlobal = () => {
  const [reportes, setReportes] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedTrabajoId, setSelectedTrabajoId] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [formData, setFormData] = useState({ description: '', image: null });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  useEffect(() => {
    fetchReportesYCotizaciones();
  }, []);

  const fetchReportesYCotizaciones = async () => {
    try {
      const [resReportes, resCoti] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/reportes-globales`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`)
      ]);
      setReportes(resReportes.data || []);
      setCotizaciones(resCoti.data || []);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, report = null, trabajoId = null, tipo = null, stage = null) => {
    setModalMode(mode);
    setSelectedStage(stage);
    
    let cleanDesc = '';
    if (mode === 'edit' && report) {
      cleanDesc = (report.description || '').replace(/\[(ANTES|DURANTE|DESPUÉS|DESPUES|EXTRA)\]/gi, '').trim();
    }

    setFormData({ description: cleanDesc, image: null });
    setPreviewImage(mode === 'edit' ? (report?.image_url || report?.image_path) : null);
    setSelectedReportId(report ? report.id : null);
    setSelectedTrabajoId(trabajoId);
    setSelectedTipo(tipo);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ description: '', image: null });
    setPreviewImage(null);
    setSelectedStage(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!formData.description.trim() && modalMode === 'add') {
      Swal.fire('Atención', 'Debes ingresar una descripción obligatoria.', 'warning');
      return;
    }
    if (!formData.image && !previewImage && modalMode === 'add') {
      Swal.fire('Atención', 'Debes seleccionar una imagen para la evidencia.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const data = new FormData();

    const tagStr = selectedStage ? selectedStage.tag : '[REPORTE]';
    const cleanUserDesc = formData.description.replace(/\[(ANTES|DURANTE|DESPUÉS|DESPUES|EXTRA)\]/gi, '').trim();
    const finalDesc = `${tagStr} ${cleanUserDesc}`;

    data.append('description', finalDesc);
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      if (modalMode === 'add') {
        const url = `${import.meta.env.VITE_API_BASE_URL}/servicios/${selectedTipo}-${selectedTrabajoId}/reportes`;
        await axios.post(url, data, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('agente_token')}` }
        });
        Swal.fire('Éxito', 'Evidencia añadida correctamente', 'success');
      } else {
        const url = `${import.meta.env.VITE_API_BASE_URL}/reportes/${selectedReportId}`;
        data.append('_method', 'PUT');
        await axios.post(url, data, { 
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('agente_token')}` }
        });
        Swal.fire('Éxito', 'Evidencia actualizada correctamente', 'success');
      }
      closeModal();
      fetchReportesYCotizaciones();
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire('Error', 'Hubo un problema al guardar la evidencia.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar evidencia?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/reportes/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('agente_token')}` }
        });
        Swal.fire('Eliminado', 'La evidencia ha sido eliminada.', 'success');
        fetchReportesYCotizaciones();
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar la evidencia.', 'error');
      }
    }
  };

  const getReportForStage = (groupReports, stage) => {
    if (!groupReports || groupReports.length === 0) return null;

    const foundByTag = groupReports.find(r => {
      const desc = (r.description || '').toUpperCase();
      return desc.includes(stage.tag) || (stage.key === 'DESPUES' && desc.includes('[DESPUES]'));
    });

    if (foundByTag) return foundByTag;

    const stageIdx = STAGES.findIndex(s => s.key === stage.key);
    if (stageIdx !== -1 && groupReports[stageIdx]) {
      return groupReports[stageIdx];
    }

    return null;
  };

  const filteredReportes = reportes.filter(r => {
    const techName = r.technician ? `${r.technician.first_name} ${r.technician.last_name}`.toLowerCase() : '';
    const prop = r.service?.property || r.work_order?.property || r.workOrder?.property;
    const propName = prop?.property_name?.toLowerCase() || '';
    const curp = prop?.custom_curp?.toLowerCase() || '';
    const desc = r.description?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return techName.includes(search) || propName.includes(search) || curp.includes(search) || desc.includes(search);
  });

  return (
    <div className="main-container" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Header titulo="REPORTES" />
      <div className="global-reports-container">
        
        {/* TITULO Y BOTÓN REGRESAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F26522', color: 'white', padding: '10px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(242, 101, 34, 0.25)' }}
          >
            <ChevronLeft size={20} />
            <span>REGRESAR</span>
          </button>
          <h2 style={{ margin: 0, color: '#F26522', fontWeight: 900, fontStyle: 'italic', fontSize: '28px' }}>GALERÍA GLOBAL DE REPORTES</h2>
        </div>

        {/* BUSCADOR */}
        <div className="report-filters" style={{ marginBottom: '30px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '600px' }}>
            <Search size={20} style={{ position: 'absolute', left: '15px', top: '12px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Buscar por técnico, propiedad o descripción..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '45px', width: '100%', fontSize: '15px', borderRadius: '25px', border: '1.5px solid #cbd5e1', padding: '10px 15px 10px 45px' }}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '18px', fontWeight: 'bold' }}>Cargando evidencias de los trabajos...</p>
        ) : filteredReportes.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '50px', color: '#64748b', fontSize: '16px' }}>
            {searchTerm ? 'No se encontraron coincidencias para tu búsqueda.' : 'Aún no hay reportes subidos por los técnicos.'}
          </p>
        ) : (
          <div className="global-gallery-grouped">
            {Object.entries(
              filteredReportes.reduce((acc, r) => {
                const prop = r.service?.property || r.work_order?.property || r.workOrder?.property;
                const propName = prop?.property_name || 'PROPIEDAD SIN NOMBRE';
                const curp = prop?.custom_curp || 'SIN CURP';
                const owner = prop?.client?.name || 'Usuario';
                
                const isService = !!r.service?.property;
                const serviceData = isService ? r.service : (r.work_order || r.workOrder || r.service);
                const tituloTrabajo = serviceData?.title || serviceData?.type || r.title || 'Mantenimiento';
                const trabajoId = r.service_id || r.work_order_id || r.id || 'general';
                const tipo = (r.work_order_id || r.workOrder) ? 'work_order' : 'servicio';
                
                const groupKey = `${propName}|${curp}|${owner}|${trabajoId}|${tipo}|${tituloTrabajo}`;
                
                if (!acc[groupKey]) acc[groupKey] = [];
                acc[groupKey].push(r);
                return acc;
              }, {})
            ).map(([groupKey, reports]) => {
              const [nombre, curp, dueno, trabajoId, tipo, tituloTrabajo] = groupKey.split('|');
              
              return (
                <div key={groupKey} className="property-group-section" style={{ marginBottom: '40px', background: '#ffffff', borderRadius: '22px', padding: '24px', boxShadow: '0 8px 25px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                  
                  {/* ENCABEZADO DEL GRUPO DE TRABAJO */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid #f1f5f9'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <MapPin size={22} color="#F26522" />
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '900', textTransform: 'uppercase' }}>
                          {nombre}
                        </h3>
                        <span style={{ fontSize: '0.82rem', color: '#F26522', backgroundColor: '#fff7ed', padding: '4px 12px', borderRadius: '14px', border: '1px solid #ffedd5', fontWeight: '800' }}>
                          TRABAJO #{trabajoId} – {tituloTrabajo}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', marginTop: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                        <span><strong>CURP:</strong> <strong style={{ color: '#F26522' }}>{curp}</strong></span>
                        <span><strong>DUEÑO:</strong> <strong>{dueno}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {(() => {
                        const cotizacionAsociada = cotizaciones.find(c => 
                          (tipo === 'work_order' && c.work_order_id === parseInt(trabajoId)) || 
                          (tipo === 'servicio' && c.service_id === parseInt(trabajoId))
                        );
                        
                        if (cotizacionAsociada) {
                          return (
                            <button 
                              onClick={() => {
                                localStorage.setItem('cotizacion_para_imprimir', JSON.stringify(cotizacionAsociada));
                                navigate('/imprimir-cotizacion');
                              }}
                              style={{ 
                                background: '#16a34a', 
                                color: 'white', 
                                padding: '8px 16px', 
                                borderRadius: '20px', 
                                border: 'none', 
                                cursor: 'pointer', 
                                fontWeight: 'bold', 
                                fontSize: '0.78rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <FileText size={15} /> VER COTIZACIÓN
                            </button>
                          );
                        }
                        return null;
                      })()}

                      <button 
                        onClick={() => {
                          const firstReport = reports[0];
                          const isService = tipo === 'servicio';
                          const serviceData = isService ? firstReport.service : (firstReport.work_order || firstReport.workOrder || firstReport.service);
                          const prop = serviceData?.property;
                          
                          navigate(`/reporte-trabajo-admin/${tipo}-${trabajoId}`, { 
                            state: { 
                              trabajoId: `${tipo}-${trabajoId}`, 
                              servicio: {
                                cliente_nombre: dueno,
                                cliente_email: prop?.client?.email || '',
                                cliente_telefono: prop?.client?.phone || '',
                                direccion: prop?.address || serviceData?.address || '',
                                propiedad_nombre: nombre,
                                tipoPropiedad: prop?.type || serviceData?.tipoPropiedad || 'CASA',
                                identificador_curp: curp,
                                titulo: tituloTrabajo,
                                descripcion: serviceData?.description
                              }, 
                              imagenes: reports.map(r => r.image_url || r.image_path).filter(Boolean) 
                            } 
                          });
                        }}
                        style={{ 
                          background: '#0f172a', 
                          color: 'white', 
                          padding: '8px 16px', 
                          borderRadius: '20px', 
                          border: 'none', 
                          cursor: 'pointer', 
                          fontWeight: 'bold', 
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FileText size={15} /> REPORTE OFICIAL
                      </button>
                    </div>
                  </div>

                  {/* GRID DE LAS 4 ETAPAS ESTRUCTURADAS (ANTES, DURANTE, DESPUÉS, EXTRA) */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
                    gap: '20px' 
                  }}>
                    {STAGES.map(stage => {
                      const r = getReportForStage(reports, stage);
                      const cleanDesc = r ? (r.description || '').replace(/\[(ANTES|DURANTE|DESPUÉS|DESPUES|EXTRA)\]/gi, '').trim() : '';

                      return (
                        <div 
                          key={stage.key}
                          style={{
                            background: r ? '#ffffff' : '#fafafa',
                            borderRadius: '16px',
                            border: r ? '1.5px solid #e2e8f0' : '2px dashed #cbd5e1',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justify: 'space-between',
                            boxShadow: r ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
                            position: 'relative'
                          }}
                        >
                          <div>
                            {/* BADGE DE ETAPA */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <span style={{ 
                                background: stage.badgeColor, 
                                color: 'white', 
                                padding: '4px 10px', 
                                borderRadius: '10px', 
                                fontSize: '0.72rem', 
                                fontWeight: '800' 
                              }}>
                                {stage.title}
                              </span>

                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: '800',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                background: r ? '#dcfce7' : (stage.required ? '#fee2e2' : '#f1f5f9'),
                                color: r ? '#15803d' : (stage.required ? '#b91c1c' : '#475569')
                              }}>
                                {r ? '✅ REGISTRADO' : (stage.required ? '⚠️ REQUERIDO' : '🔵 OPCIONAL')}
                              </span>
                            </div>

                            {/* CONTENIDO DE LA TARJETA */}
                            {r ? (
                              <>
                                <div style={{ position: 'relative', width: '100%', height: '170px', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', backgroundColor: '#0f172a' }}>
                                  <img 
                                    src={r.image_url || r.image_path} 
                                    alt={stage.title} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                    onClick={() => setZoomImage(r.image_url || r.image_path)}
                                  />
                                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 10 }}>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', r, trabajoId, tipo, stage); }} 
                                      style={{ background: 'white', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} 
                                      title="Editar evidencia"
                                    >
                                      <Edit size={14} color="#0f172a" />
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleDeleteReport(r.id); }} 
                                      style={{ background: 'white', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} 
                                      title="Eliminar evidencia"
                                    >
                                      <Trash2 size={14} color="#dc2626" />
                                    </button>
                                  </div>
                                </div>

                                <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                                    {r.technician?.first_name?.charAt(0) || 'T'}
                                  </div>
                                  <span>{r.technician ? `${r.technician.first_name} ${r.technician.last_name}` : 'Técnico'}</span>
                                </div>

                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#0f172a', fontWeight: '600', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                                  "{cleanDesc || 'Sin descripción.'}"
                                </p>
                              </>
                            ) : (
                              <div 
                                onClick={() => handleOpenModal('add', null, trabajoId, tipo, stage)}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: '210px',
                                  cursor: 'pointer',
                                  color: '#64748b',
                                  textAlign: 'center',
                                  gap: '8px'
                                }}
                              >
                                <Plus size={36} color="#F26522" />
                                <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>AÑADIR EVIDENCIA</strong>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tap para subir foto y descripción</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL PARA AGREGAR O EDITAR EVIDENCIA POR EL ROOT/ADMIN */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '28px', borderRadius: '20px', width: '100%', maxWidth: '520px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={24} />
            </button>
            
            <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: '800' }}>
              {modalMode === 'add' ? <Plus size={24} color="#F26522" /> : <Edit size={24} color="#F26522" />}
              {modalMode === 'add' ? `AÑADIR EVIDENCIA (${selectedStage?.title || ''})` : `EDITAR EVIDENCIA (${selectedStage?.title || ''})`}
            </h3>
            
            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '800', color: '#1e293b', fontSize: '0.85rem' }}>
                  Descripción Obligatoria <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={selectedStage?.placeholder || "Escribe la descripción de lo realizado..."}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', minHeight: '100px', resize: 'vertical', fontSize: '0.88rem', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '800', color: '#1e293b', fontSize: '0.85rem' }}>
                  Fotografía de Evidencia {modalMode === 'add' && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="report-image-upload"
                />
                <label 
                  htmlFor="report-image-upload" 
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    padding: '14px', border: '2px dashed #F26522', borderRadius: '12px', 
                    cursor: 'pointer', color: '#F26522', fontWeight: 'bold', textAlign: 'center', background: '#fff7ed'
                  }}
                >
                  <Upload size={20} />
                  {formData.image ? 'Cambiar Imagen Seleccionada' : (modalMode === 'edit' ? 'Subir Nueva Foto (Opcional)' : 'Seleccionar Fotografía')}
                </label>

                {previewImage && (
                  <div style={{ marginTop: '14px', textAlign: 'center' }}>
                    <img src={previewImage} alt="Vista previa" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '12px', border: '1px solid #cbd5e1', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  CANCELAR
                </button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '12px', background: '#F26522', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, textTransform: 'uppercase' }}>
                  {isSubmitting ? 'GUARDANDO...' : 'GUARDAR EVIDENCIA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ZOOM */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <img src={zoomImage} alt="Ampliada" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '16px', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setZoomImage(null)} style={{ position: 'absolute', top: '20px', right: '25px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={36}/></button>
        </div>
      )}
    </div>
  );
};

export default VistaReportesGlobal;
