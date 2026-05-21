import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../Shared/Header';
import { Search, MapPin, Calendar, FileText, ChevronLeft } from 'lucide-react';
import '../../styles/Admin/VistaReportesGlobal.css';

const VistaReportesGlobal = () => {
  const [reportes, setReportes] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReportesYCotizaciones();
  }, []);

  const fetchReportesYCotizaciones = async () => {
    try {
      const [resReportes, resCoti] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/reportes-globales`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`)
      ]);
      setReportes(resReportes.data);
      setCotizaciones(resCoti.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
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
    <div className="main-container" style={{ backgroundColor: '#EEEEEE', minHeight: '100vh' }}>
      <Header titulo="REPORTES" />
      <div className="global-reports-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '10px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <ChevronLeft size={20} />
            <span>REGRESAR</span>
          </button>
          <h2 style={{ margin: 0, color: '#F26522', fontWeight: 900, fontStyle: 'italic', fontSize: '28px' }}>GALERÍA GLOBAL DE REPORTES</h2>
        </div>

        <div className="report-filters">
          <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '600px' }}>
            <Search size={20} style={{ position: 'absolute', left: '15px', top: '10px', color: '#999' }} />
            <input 
              type="text" 
              placeholder="Buscar por técnico, propiedad o descripción..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '45px', width: '100%', fontSize: '15px' }}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '18px', fontWeight: 'bold' }}>Cargando evidencias de los técnicos...</p>
        ) : filteredReportes.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '50px', color: '#666', fontSize: '16px' }}>
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
                const tipo = r.work_order_id || r.workOrder ? 'work_order' : 'servicio';
                
                // Llave compuesta para agrupar por propiedad y por trabajo
                const groupKey = `${propName}|${curp}|${owner}|${trabajoId}|${tipo}|${tituloTrabajo}`;
                
                if (!acc[groupKey]) acc[groupKey] = [];
                acc[groupKey].push(r);
                return acc;
              }, {})
            ).map(([groupKey, reports]) => {
              const [nombre, curp, dueno, trabajoId, tipo, tituloTrabajo] = groupKey.split('|');
              
              return (
                <div key={groupKey} className="property-group-section" style={{ marginBottom: '40px' }}>
                  <div style={{ 
                    background: 'white', 
                    padding: '15px 25px', 
                    borderRadius: '15px', 
                    marginBottom: '20px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '5px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                    borderLeft: '5px solid #F26522',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <MapPin size={20} color="#F26522" style={{ flexShrink: 0 }} />
                      <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: '900', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>{nombre}</span>
                        <span style={{ fontSize: '0.85rem', color: '#F26522', backgroundColor: '#fff2eb', padding: '4px 12px', borderRadius: '20px', border: '1px solid #ffd8c3', fontWeight: 'bold' }}>
                          TRABAJO #{trabajoId} {tituloTrabajo && tituloTrabajo !== 'Mantenimiento' && `– ${tituloTrabajo}`}
                        </span>
                      </h3>
                      <span style={{ marginLeft: '10px', background: '#F26522', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {reports.length} {reports.length === 1 ? 'Foto' : 'Fotos'}
                      </span>
                      
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                                  background: '#1b8a5a', 
                                  color: 'white', 
                                  padding: '8px 15px', 
                                  borderRadius: '20px', 
                                  border: 'none', 
                                  cursor: 'pointer', 
                                  fontWeight: 'bold', 
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  boxShadow: '0 4px 10px rgba(27,138,90,0.2)'
                                }}
                              >
                                <FileText size={14} /> VER COTIZACIÓN
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
                          const prefijo = tipo;
                          const realId = trabajoId;
                          
                          navigate(`/reporte-trabajo-admin/${prefijo}-${realId}`, { 
                            state: { 
                              trabajoId: `${prefijo}-${realId}`, 
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
                          })
                        }}
                        style={{ 
                          marginLeft: 'auto', 
                          background: '#003366', 
                          color: 'white', 
                          padding: '8px 15px', 
                          borderRadius: '20px', 
                          border: 'none', 
                          cursor: 'pointer', 
                          fontWeight: 'bold', 
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 4px 10px rgba(0,51,102,0.2)'
                        }}
                      >
                            <FileText size={14} /> GENERAR REPORTE OFICIAL
                          </button>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '5px', paddingLeft: '30px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        <strong>CURP:</strong> <span style={{ color: '#F26522', fontWeight: 'bold' }}>{curp}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        <strong>DUEÑO:</strong> <span style={{ fontWeight: 'bold', color: '#333' }}>{dueno}</span>
                      </div>
                    </div>
                  </div>

                  <div className="global-gallery-grid">
                    {reports.map(r => (
                      <div key={r.id} className="global-report-card">
                        <img 
                          src={r.image_url || r.image_path} 
                          alt="Reporte" 
                          className="global-report-image" 
                          onClick={() => window.open(r.image_url || r.image_path, '_blank')} 
                          title="Clic para ver tamaño completo"
                        />
                        <div className="global-report-info">
                          
                          <div className="gr-tech-info">
                            {r.technician?.profile_picture ? (
                              <img src={r.technician.profile_picture} className="gr-tech-avatar" alt="Tecnico" />
                            ) : (
                              <div className="gr-tech-avatar" style={{ background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff' }}>
                                {r.technician?.first_name?.charAt(0) || 'T'}
                              </div>
                            )}
                            <span>{r.technician ? `${r.technician.first_name} ${r.technician.last_name}` : 'Técnico Desconocido'}</span>
                          </div>

                          <p className="gr-detail"><FileText size={14} style={{marginRight:'8px', color: '#F26522'}}/> 
                            <strong>Trabajo ID:</strong> &nbsp;{r.work_order_id || r.service_id}
                          </p>
                          <p className="gr-detail"><Calendar size={14} style={{marginRight:'8px', color: '#F26522'}}/> 
                            <strong>Subido:</strong> &nbsp;{new Date(r.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>

                          <div className="gr-desc">
                            "{r.description || 'Sin descripción o comentario adjunto.'}"
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VistaReportesGlobal;
