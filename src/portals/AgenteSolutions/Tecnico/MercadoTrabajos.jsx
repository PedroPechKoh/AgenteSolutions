import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import Header from '../../../components/Shared/Header';
import { MapPin, DollarSign, Clock, Send } from 'lucide-react';
import '../../../styles/AgenteSolutions/Tecnico/MercadoTrabajos.css';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 150px)',
  borderRadius: '12px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
};

const defaultCenter = { lat: 21.0181, lng: -89.6242 }; // Mérida, Yucatán

const mockJobs = [
  { 
    id: 1, 
    titulo: "Instalación de Ventilador de Techo", 
    lat: 21.0250, 
    lng: -89.6300, 
    presupuesto: "$500", 
    cliente: "María Gómez",
    descripcion: "Necesito instalar un ventilador nuevo en la sala. Ya tengo el equipo.",
    fecha: "Hoy, 14:00"
  },
  { 
    id: 2, 
    titulo: "Mantenimiento Minisplit 12000 BTU", 
    lat: 21.0100, 
    lng: -89.6200, 
    presupuesto: "A convenir", 
    cliente: "Roberto Carlos",
    descripcion: "El aire acondicionado tira agua y no enfría bien.",
    fecha: "Mañana, 09:00"
  }
];

const MercadoTrabajos = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyDgyTj0X6kgGoMV8NxQGDp4-Nx0bxJd0Hw"
  });

  const [selectedJob, setSelectedJob] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [networkJobs, setNetworkJobs] = useState([]);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/mercado-trabajos`);
      if (res.data.success) {
        const jobs = res.data.data.map(order => ({
            id: order.id,
            titulo: order.type + (order.equipment ? ` - ${order.equipment}` : ''),
            lat: order.property?.latitud ? parseFloat(order.property.latitud) : (21.0181 + (Math.random() - 0.5) * 0.05),
            lng: order.property?.longitud ? parseFloat(order.property.longitud) : (-89.6242 + (Math.random() - 0.5) * 0.05),
            presupuesto: "A convenir",
            cliente: order.property?.client?.first_name || 'Cliente Autónomo',
            descripcion: order.description,
            fecha: new Date(order.created_at).toLocaleDateString(),
        }));
        setNetworkJobs(jobs);
      }
    } catch (e) {
      console.error("Error fetching jobs from API", e);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Polling cada 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mercado-container">
      <Header title="Mercado de Trabajos" />
      
      <div className="mercado-content">
        {/* Lado del Mapa */}
        <div className="mercado-map-section">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={13}
            >
              {networkJobs.map(job => (
                <Marker
                  key={job.id}
                  position={{ lat: job.lat, lng: job.lng }}
                  onClick={() => setSelectedJob(job)}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                  }}
                  animation={job.id > 1000 ? window.google.maps.Animation.DROP : null}
                />
              ))}

              {selectedJob && (
                <InfoWindow
                  position={{ lat: selectedJob.lat, lng: selectedJob.lng }}
                  onCloseClick={() => setSelectedJob(null)}
                >
                  <div className="mercado-info-window">
                    <h4>{selectedJob.titulo}</h4>
                    <p><MapPin size={12}/> A 2.5 km de ti</p>
                    <p className="mercado-info-price">{selectedJob.presupuesto}</p>
                    <button 
                      className="mercado-btn-details"
                      onClick={() => setShowQuoteModal(true)}
                    >
                      Ver y Cotizar
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="mercado-loading-map">Cargando Mapa...</div>
          )}
        </div>

        {/* Panel lateral o listado (Opcional, en este caso priorizamos el mapa) */}
        <div className="mercado-sidebar">
          <h3>Trabajos Recientes</h3>
          <p className="mercado-subtitle">Haz clic en un marcador del mapa o selecciona de la lista para cotizar.</p>
          
          <div className="mercado-job-list">
            {networkJobs.map(job => (
              <div 
                key={job.id} 
                className={`mercado-job-card ${selectedJob?.id === job.id ? 'active' : ''}`}
                onClick={() => setSelectedJob(job)}
              >
                <h4>{job.titulo}</h4>
                <div className="mercado-job-meta">
                  <span><DollarSign size={14}/> {job.presupuesto}</span>
                  <span><Clock size={14}/> {job.fecha}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para Cotizar */}
      {showQuoteModal && selectedJob && (
        <div className="mercado-modal-overlay">
          <div className="mercado-modal">
            <div className="mercado-modal-header">
              <h2>Cotizar Trabajo</h2>
              <span className="mercado-modal-close" onClick={() => setShowQuoteModal(false)}>×</span>
            </div>
            
            <div className="mercado-modal-body">
              <div className="mercado-job-summary">
                <h3>{selectedJob.titulo}</h3>
                <p><strong>Cliente:</strong> {selectedJob.cliente}</p>
                <p><strong>Descripción:</strong> {selectedJob.descripcion}</p>
              </div>
              
              <div className="mercado-quote-form">
                <label>Tu Propuesta Económica ($)</label>
                <input type="number" placeholder="Ej. 800" className="mercado-input" />
                
                <label>Mensaje para el cliente</label>
                <textarea 
                  placeholder="Hola, tengo experiencia en esto. Puedo ir hoy mismo..." 
                  className="mercado-textarea"
                ></textarea>
              </div>
            </div>
            
            <div className="mercado-modal-footer">
              <button className="mercado-btn-cancel" onClick={() => setShowQuoteModal(false)}>Cancelar</button>
              <button className="mercado-btn-submit" onClick={() => setShowQuoteModal(false)}>
                <Send size={16}/> Enviar Cotización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MercadoTrabajos;
