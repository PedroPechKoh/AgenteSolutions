import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../Shared/Header';
import { Search, MapPin, Calendar, FileText } from 'lucide-react';
import '../../styles/Admin/VistaReportesGlobal.css';

const VistaReportesGlobal = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReportes();
  }, []);

  const fetchReportes = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/reportes-globales`);
      setReportes(res.data);
    } catch (error) {
      console.error("Error fetching global reports", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReportes = reportes.filter(r => {
    const techName = r.technician ? `${r.technician.first_name} ${r.technician.last_name}`.toLowerCase() : '';
    const propName = r.service?.property?.custom_curp?.toLowerCase() || '';
    const desc = r.description?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return techName.includes(search) || propName.includes(search) || desc.includes(search);
  });

  return (
    <div className="main-container" style={{ backgroundColor: '#EEEEEE', minHeight: '100vh' }}>
      <Header rolTexto="ADMINISTRADOR" />
      <div className="global-reports-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ margin: 0, color: '#F26522', fontWeight: 900, fontStyle: 'italic', fontSize: '28px' }}>GALERÍA GLOBAL DE REPORTES</h2>
          <button 
            onClick={() => navigate('/inicio-admin')} 
            style={{ padding: '10px 25px', borderRadius: '25px', border: 'none', background: '#000', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            REGRESAR AL MENÚ
          </button>
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
          <div className="global-gallery-grid">
            {filteredReportes.map(r => (
              <div key={r.id} className="global-report-card">
                <img 
                  src={r.image_url} 
                  alt="Reporte" 
                  className="global-report-image" 
                  onClick={() => window.open(r.image_url, '_blank')} 
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

                  <p className="gr-detail"><MapPin size={14} style={{marginRight:'8px', color: '#F26522'}}/> 
                    <strong>Propiedad:</strong> &nbsp;{r.service?.property?.custom_curp || 'N/A'}
                  </p>
                  <p className="gr-detail"><FileText size={14} style={{marginRight:'8px', color: '#F26522'}}/> 
                    <strong>Trabajo ID:</strong> &nbsp;{r.service_id}
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
        )}
      </div>
    </div>
  );
};

export default VistaReportesGlobal;
