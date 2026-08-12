import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import Header from '../../../components/Shared/Header';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import ModalServicioAutonomo from './ModalServicioAutonomo';
import '../../../styles/Autonomos/VistaRedAutonomo.css';
import '../../../styles/AgenteSolutions/Tecnico/MercadoTrabajos.css';
import { Plus, MapPin, DollarSign, Clock, CheckCircle } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 180px)',
  borderRadius: '12px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
};

const defaultCenter = { lat: 21.0181, lng: -89.6242 }; // Mérida, Yucatán

const mockSolicitudes = [
  { id: 1, titulo: "Mantenimiento de 5 Minisplits", lat: 21.0250, lng: -89.6300, presupuesto: "$2,000", estado: "Cotizando", cotizaciones: 3, fecha: "2026-08-11" },
  { id: 2, titulo: "Reparación de Fuga de Agua", lat: 21.0100, lng: -89.6200, presupuesto: "A convenir", estado: "Completado", cotizaciones: 1, fecha: "2026-08-09" }
];

const VistaRedAutonomo = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [networkJobs, setNetworkJobs] = useState([]);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/mercado-trabajos`);
      if (res.data.success) {
        // Transform the backend data into map format
        const jobs = res.data.data.map(order => ({
            id: order.id,
            titulo: order.type + (order.equipment ? ` - ${order.equipment}` : ''),
            lat: order.property?.latitud ? parseFloat(order.property.latitud) : (21.0181 + (Math.random() - 0.5) * 0.05),
            lng: order.property?.longitud ? parseFloat(order.property.longitud) : (-89.6242 + (Math.random() - 0.5) * 0.05),
            presupuesto: "A convenir",
            estado: order.status,
            fecha: new Date(order.created_at).toLocaleDateString(),
            cotizaciones: 0,
            cliente: order.property?.client?.first_name || 'Cliente'
        }));
        setNetworkJobs(jobs);
      }
    } catch (e) {
      console.error("Error fetching network jobs", e);
    }
  };

  useEffect(() => {
    fetchJobs(); // Fetch initially
    const interval = setInterval(fetchJobs, 5000); // Polling every 5 seconds for real-time
    return () => clearInterval(interval);
  }, []);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyDgyTj0X6kgGoMV8NxQGDp4-Nx0bxJd0Hw"
  });

  return (
    <div className="mercado-container" style={{ position: 'relative' }}>
      <Header title="Red de Autónomos / Mercado" />
      
      <div className="mercado-content" style={{ display: 'block', padding: '0 20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#334155' }}>Mis Publicaciones en el Mapa</h2>
            <button className="red-btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={20} /> AGREGAR PROBLEMA / PUBLICAR
            </button>
        </div>

        <div className="mercado-map-section" style={{ width: '100%' }}>
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
                    url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'
                  }}
                  animation={job.id > 1000 ? window.google.maps.Animation.DROP : null} // Animación si es nuevo
                />
              ))}

              {selectedJob && (
                <InfoWindow
                  position={{ lat: selectedJob.lat, lng: selectedJob.lng }}
                  onCloseClick={() => setSelectedJob(null)}
                >
                  <div className="mercado-info-window">
                    <h4>{selectedJob.titulo}</h4>
                    <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#f26522' }}>{selectedJob.estado}</p>
                    <p><DollarSign size={12}/> {selectedJob.presupuesto}</p>
                    <p><Clock size={12}/> {selectedJob.fecha}</p>
                    <button 
                      className="mercado-btn-details"
                    >
                      Ver {selectedJob.cotizaciones} Cotizaciones
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="mercado-loading-map">Cargando Mapa...</div>
          )}
        </div>
      </div>

      {showModal && (
        <ModalServicioAutonomo onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default VistaRedAutonomo;
