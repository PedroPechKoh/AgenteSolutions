import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import "../../styles/TecnicoStyles/GaleriaReportes.css";
import { Plus, ChevronLeft } from 'lucide-react';
import Header from '../Shared/Header';

const GaleriaReportes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const trabajoId = location.state?.trabajoId;
  const servicio = location.state?.servicio;

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trabajoId) {
      setLoading(false);
      return;
    }
    const fetchReportes = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios/${trabajoId}/reportes`);
        setReportes(response.data);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReportes();
  }, [trabajoId]);

  return (
    <>
      <Header />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* BOTONES DE ACCIÓN Y ETIQUETAS */}
        <div style={{ width: '95%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '30px' }}>
          
          <button 
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}
          >
            <ChevronLeft size={20} />
            <span>REGRESAR</span>
          </button>

          {/* INFO CARD */}
          <div style={{ 
            flex: 1, 
            margin: '0 15px', 
            background: '#f8f9fa', 
            padding: '15px 20px', 
            borderRadius: '20px',
            border: '1px solid #eee',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#999' }}>WKF-ORD-{trabajoId || 'N/A'}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: '900', color: '#F26522' }}>{servicio?.propietario || 'CLIENTE'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '900', color: '#333', textTransform: 'uppercase' }}>
                {servicio?.titulo || 'Mantenimiento General'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                📍 {servicio?.tipoPropiedad || 'Propiedad'} - {servicio?.identificador_curp || 'S/N'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-add-photo"
            onClick={() => navigate('/nuevo-reporte', { state: { trabajoId, servicio } })}
            style={{ flexShrink: 0 }}
          >
            <Plus size={26} strokeWidth={3} />
          </button>
        </div>

      <div className="galeria-body" style={{ width: '100%', marginTop: '0' }}>

        {loading ? (
          <p style={{ textAlign: 'center', marginTop: '50px' }}>Cargando reportes...</p>
        ) : reportes.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>No hay reportes para este trabajo. Haz clic en el botón '+' para agregar uno.</p>
        ) : (
        <div className="gallery-grid">
          {reportes.map((reporte) => (
            <div key={reporte.id} className="gallery-card">
              
              <div className="card-image-container">
                <img 
                  src={reporte.image_url} 
                  alt={`Reporte ${reporte.id}`} 
                  loading="lazy"
                />
              </div>

              <div className="card-footer">
                <span className="footer-title">{reporte.technician?.name || 'TÉCNICO'}</span>

                <button
                  type="button"
                  className="btn-footer-ver"
                  onClick={() => navigate(`/reporte-individual/${reporte.id}`, { state: { reporte } })}
                >
                  VER
                </button>
              </div>

            </div>
          ))}
        </div>
        )}

      </div>
      </div>
    </>
  );
};

export default GaleriaReportes;