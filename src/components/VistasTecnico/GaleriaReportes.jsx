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
      <div style={{ padding: '20px 50px', display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <ChevronLeft size={20} />
          <span>REGRESAR</span>
        </button>
        <button
          type="button"
          className="btn-add-photo"
          onClick={() => navigate('/nuevo-reporte', { state: { trabajoId } })}
        >
          <Plus size={26} strokeWidth={3} />
        </button>
      </div>

      <div className="galeria-body" style={{ marginTop: '0' }}>

        {/* ID PROPIEDAD */}
        <div className="id-property-tag">
          <span>TRABAJO ID:</span>
          <strong>{trabajoId || 'N/A'}</strong>
        </div>

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
    </>
  );
};

export default GaleriaReportes;