import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import Header from '../../../components/Shared/Header';
import { useAuth } from '../../../context/AuthContext';
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

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY_HERE"
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
              {mockSolicitudes.map(job => (
                <Marker
                  key={job.id}
                  position={{ lat: job.lat, lng: job.lng }}
                  onClick={() => setSelectedJob(job)}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'
                  }}
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
        <div className="red-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="red-modal">
            <h2>Publicar Trabajo en la Red</h2>
            <div className="red-modal-body">
              <input type="text" placeholder="Título del trabajo (Ej. Mantenimiento A/C)" className="red-input" />
              <textarea placeholder="Describe lo que necesitas..." className="red-textarea" rows="4"></textarea>
              <input type="text" placeholder="Ubicación" className="red-input" />
              <input type="text" placeholder="Presupuesto sugerido (Opcional)" className="red-input" />
            </div>
            <div className="red-modal-footer">
              <button className="red-btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="red-btn-primary" onClick={() => setShowModal(false)}>Publicar Ahora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaRedAutonomo;
