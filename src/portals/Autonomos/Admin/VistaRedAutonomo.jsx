import React, { useState } from 'react';
import Header from '../../../components/Shared/Header';
import { useAuth } from '../../../context/AuthContext';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import '../../../styles/Autonomos/VistaRedAutonomo.css';
import { Network, Plus, Star, MapPin, DollarSign, Clock, CheckCircle, Send } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
};

const defaultCenter = { lat: 21.0181, lng: -89.6242 }; // Mérida

const mockSolicitudes = [
  { id: 1, titulo: "Mantenimiento de 5 Minisplits", lat: 21.0250, lng: -89.6300, ubicacion: "Norte, Mérida", presupuesto: "$2,000", estado: "Cotizando", cotizaciones: 3, fecha: "Hoy" },
  { id: 2, titulo: "Reparación de Fuga de Agua", lat: 21.0100, lng: -89.6200, ubicacion: "Centro, Mérida", presupuesto: "A convenir", estado: "Completado", cotizaciones: 1, fecha: "Ayer" }
];

const mockCotizaciones = [
  { id: 101, solicitudId: 1, tecnico: "Juan Pérez", precio: "$1,800", rating: 4.8, mensaje: "Puedo ir mañana a primera hora." },
  { id: 102, solicitudId: 1, tecnico: "Carlos Sánchez", precio: "$2,100", rating: 4.5, mensaje: "Incluye limpieza profunda y gas." }
];

const VistaRedAutonomo = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('mapa');
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY_HERE"
  });

  return (
    <div className="red-autonomo-container">
      <Header title="Red de Técnicos" />
      
      <div className="red-content">
        <div className="red-header-actions">
          <div className="red-tabs">
            <button 
              className={`red-tab ${activeTab === 'mapa' ? 'active' : ''}`}
              onClick={() => setActiveTab('mapa')}
            >
              <MapPin size={18} /> Ver Mapa
            </button>
            <button 
              className={`red-tab ${activeTab === 'mis-solicitudes' ? 'active' : ''}`}
              onClick={() => setActiveTab('mis-solicitudes')}
            >
              <Network size={18} /> Mis Publicaciones
            </button>
            <button 
              className={`red-tab ${activeTab === 'cotizaciones' ? 'active' : ''}`}
              onClick={() => setActiveTab('cotizaciones')}
            >
              <DollarSign size={18} /> Cotizaciones Recibidas
            </button>
          </div>
        </div>

        {activeTab === 'mapa' && (
          <div className="red-map-wrapper">
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
                  />
                ))}

                {selectedJob && (
                  <InfoWindow
                    position={{ lat: selectedJob.lat, lng: selectedJob.lng }}
                    onCloseClick={() => setSelectedJob(null)}
                  >
                    <div className="mercado-info-window">
                      <h4>{selectedJob.titulo}</h4>
                      <p><MapPin size={12}/> {selectedJob.ubicacion}</p>
                      <p className="red-status cotizando">{selectedJob.estado}</p>
                      <p><strong>{selectedJob.cotizaciones} Cotizaciones</strong></p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div className="red-loading-map">Cargando Mapa...</div>
            )}
            
            {/* Botón flotante para agregar un problema */}
            <button className="red-fab-button" onClick={() => setShowModal(true)} title="Agregar un problema a la red">
              <Plus size={32} />
            </button>
          </div>
        )}

        {activeTab === 'mis-solicitudes' && (
          <div className="red-solicitudes-grid">
            {mockSolicitudes.map(sol => (
              <div key={sol.id} className="red-solicitud-card">
                <div className="red-card-header">
                  <h3>{sol.titulo}</h3>
                  <span className={`red-status ${sol.estado.toLowerCase()}`}>{sol.estado}</span>
                </div>
                <div className="red-card-body">
                  <p><MapPin size={16}/> {sol.ubicacion}</p>
                  <p><DollarSign size={16}/> {sol.presupuesto}</p>
                  <p><Clock size={16}/> {sol.fecha}</p>
                </div>
                <div className="red-card-footer">
                  <div className="red-cotizaciones-badge">
                    {sol.cotizaciones} Cotizaciones
                  </div>
                  <button className="red-btn-secondary" onClick={() => setActiveTab('cotizaciones')}>Ver Cotizaciones</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'cotizaciones' && (
          <div className="red-cotizaciones-list">
            {mockCotizaciones.map(cot => (
              <div key={cot.id} className="red-cotizacion-item">
                <div className="red-tecnico-info">
                  <h4>{cot.tecnico}</h4>
                  <div className="red-rating">
                    <Star size={14} className="star-icon filled" /> {cot.rating}
                  </div>
                </div>
                <div className="red-propuesta-info">
                  <p className="red-precio">{cot.precio}</p>
                  <p className="red-mensaje">"{cot.mensaje}"</p>
                </div>
                <div className="red-cotizacion-actions">
                  <button className="red-btn-primary small">Aceptar</button>
                  <button className="red-btn-secondary small">Ver Perfil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="red-modal-overlay">
          <div className="red-modal">
            <h2>Publicar Trabajo en la Red</h2>
            <div className="red-modal-body">
              <label className="red-label">Título del trabajo</label>
              <input type="text" placeholder="Ej. Mantenimiento A/C" className="red-input" />
              
              <label className="red-label">Describe el problema</label>
              <textarea placeholder="Necesito reparar..." className="red-textarea"></textarea>
              
              <label className="red-label">Ubicación (Propiedad)</label>
              <input type="text" placeholder="Selecciona la propiedad" className="red-input" />
              
              <label className="red-label">Presupuesto sugerido (Opcional)</label>
              <input type="text" placeholder="Ej. $800" className="red-input" />
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
