import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import "../../styles/TecnicoStyles/GaleriaReportes.css";
import { Plus, ChevronLeft, FileText } from 'lucide-react';

import Header from '../Shared/Header';

import { useAuth } from "../../context/AuthContext";

const GaleriaReportes = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const trabajoId = id || location.state?.trabajoId;
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '0 20px' }}>
        
        {/* INFO SECTION (Compacta) */}
        <div style={{ 
          width: '100%', 
          maxWidth: '1200px', 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '10px', 
          marginTop: '15px'
        }}>
          <div className="id-property-tag" style={{ flex: 1, minWidth: '200px', padding: '8px 15px' }}>
            <span>ID TRABAJO:</span>
            <strong>{trabajoId || 'N/A'}</strong>
          </div>
          <div className="id-property-tag" style={{ flex: 1, minWidth: '200px', padding: '8px 15px' }}>
            <span>CLIENTE:</span>
            <strong>{servicio?.propietario || 'Usuario'}</strong>
          </div>
          
          <div className="id-property-tag" style={{ flex: 1, minWidth: '200px', padding: '8px 15px' }}>
            <span>PROPIEDAD:</span>
            <strong>{servicio?.tipoPropiedad || 'N/A'} - {servicio?.identificador_curp || 'S/N'}</strong>
          </div>

          <div className="id-property-tag" style={{ flex: 1, minWidth: '200px', background: '#f0f0f0', padding: '8px 15px' }}>
            <span>TRABAJO:</span>
            <strong style={{ fontSize: '12px', textAlign: 'center' }}>{servicio?.titulo || 'Mantenimiento'}</strong>
          </div>
        </div>

        {/* ACTION BUTTONS (Compactos) */}
        <div style={{ 
          width: '100%', 
          maxWidth: '900px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '15px', 
          marginBottom: '15px' 
        }}>
          <button 
            onClick={() => navigate(`/trabajo-propiedad/${trabajoId}`, { state: { servicio, trabajoId } })}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <ChevronLeft size={20} />
            <span>REGRESAR</span>
          </button>

          {/* BOTÓN REPORTE OFICIAL (Solo para Admin/Supervisor) */}
          {(user?.role_id === 0 || user?.role_id === 1) && (
            <button 
              onClick={() => navigate(`/reporte-trabajo-admin/${trabajoId}`, { 
                state: { 
                  trabajoId, 
                  servicio, 
                  imagenes: reportes.map(r => r.image_url) 
                } 
              })}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#003366', color: 'white', padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,51,102,0.3)' }}
            >
              <FileText size={20} />
              <span>GENERAR REPORTE OFICIAL</span>
            </button>
          )}

          <button
            type="button"
            className="btn-add-photo"
            onClick={() => navigate('/nuevo-reporte', { state: { trabajoId, servicio } })}
            style={{ width: '50px', height: '50px', borderRadius: '50%', padding: 0 }}
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>
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
      
    </>
  );
};

export default GaleriaReportes;