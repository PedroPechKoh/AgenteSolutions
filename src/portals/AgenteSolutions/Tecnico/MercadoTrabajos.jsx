import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import Header from '../../../components/Shared/Header';
import { MapPin, DollarSign, Clock, Send, User, FileText } from 'lucide-react';
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
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/mercado-trabajos`);
      if (res.data.success) {
        const userStr = localStorage.getItem('agente_user');
        const authUser = userStr ? JSON.parse(userStr) : null;
        
        const jobs = res.data.data.map(order => {
            let myQuote = null;
            if (authUser && order.network_quotes) {
                const userQuotes = order.network_quotes.filter(q => q.technician_id === authUser.id);
                if (userQuotes.length > 0) {
                    userQuotes.sort((a, b) => b.id - a.id);
                    myQuote = userQuotes[0];
                }
            }
            return {
                id: order.id,
                titulo: order.type + (order.equipment ? ` - ${order.equipment}` : ''),
                lat: order.property?.latitud ? parseFloat(order.property.latitud) : (21.0181 + (Math.random() - 0.5) * 0.05),
                lng: order.property?.longitud ? parseFloat(order.property.longitud) : (-89.6242 + (Math.random() - 0.5) * 0.05),
                presupuesto: "A convenir",
                cliente: order.owner_name || 'Cliente Autónomo',
                lugar: order.property?.property_name || 'Lugar no especificado',
                calle: order.property?.address || 'Dirección no especificada',
                descripcion: order.description,
                foto: order.evidence_path || order.evidence_path_2 || order.property?.facade_photo_path || null,
                fecha: new Date(order.created_at).toLocaleDateString(),
                cotizaciones: order.network_quotes_count || 0,
                myQuote: myQuote
            };
        });
        setNetworkJobs(jobs);
      }
    } catch (e) {
      console.error("Error fetching jobs from API, falling back to mock", e);
      if (networkJobs.length === 0) setNetworkJobs(mockJobs);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Polling cada 5s
    return () => clearInterval(interval);
  }, []);

  const handleEnviarCotizacion = async () => {
    if (!selectedJob) return;
    if (!quotePrice) {
      alert("Por favor ingresa una propuesta económica.");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/mercado-trabajos/${selectedJob.id}/cotizar`, {
        price: quotePrice,
        message: quoteMessage
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('agente_token')}` }
      });

      if (res.data.success) {
        alert("✅ " + res.data.message);
        setShowQuoteModal(false);
        setQuotePrice('');
        setQuoteMessage('');
        fetchJobs(); // Actualizar el mapa
      }
    } catch (e) {
      console.error(e);
      alert("Hubo un error al enviar tu cotización. Intenta de nuevo.");
    }
  };

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
                      onClick={() => {
                        setQuotePrice(selectedJob.myQuote ? selectedJob.myQuote.price : '');
                        setQuoteMessage(selectedJob.myQuote ? selectedJob.myQuote.message : '');
                        setShowQuoteModal(true);
                      }}
                    >
                      {selectedJob.myQuote ? (selectedJob.myQuote.status === 'rejected' ? 'Revisar Rechazo' : 'Ver tu Cotización') : 'Ver y Cotizar'}
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
                <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                  {job.cotizaciones} Cotizaciones enviadas
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para Cotizar */}
      {showQuoteModal && selectedJob && (
        <div className="mercado-modal-overlay">
          <div className="mercado-premium-modal">
            <div className="mercado-premium-header">
              <h2>Cotizar Trabajo</h2>
              <span className="mercado-modal-close" onClick={() => setShowQuoteModal(false)}>×</span>
            </div>
            
            <div className="mercado-premium-body">
              <div className="mercado-premium-details">
                {selectedJob.foto && (
                  <div className="mercado-premium-image-wrapper">
                    <img src={selectedJob.foto} alt="Propiedad / Evidencia" className="mercado-premium-image" />
                  </div>
                )}
                <div className="mercado-premium-text">
                  <h3>{selectedJob.titulo}</h3>
                  <div className="mercado-premium-info-grid">
                    <div className="mercado-info-item">
                      <MapPin size={16} className="mercado-icon-blue" />
                      <div>
                        <strong>Lugar</strong>
                        <span>{selectedJob.lugar}</span>
                      </div>
                    </div>
                    <div className="mercado-info-item">
                      <MapPin size={16} className="mercado-icon-blue" />
                      <div>
                        <strong>Calle</strong>
                        <span>{selectedJob.calle}</span>
                      </div>
                    </div>
                    <div className="mercado-info-item">
                      <User size={16} className="mercado-icon-blue" />
                      <div>
                        <strong>Cliente</strong>
                        <span>{selectedJob.cliente}</span>
                      </div>
                    </div>
                    <div className="mercado-info-item full-width">
                      <FileText size={16} className="mercado-icon-blue" />
                      <div>
                        <strong>Descripción</strong>
                        <span>{selectedJob.descripcion}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mercado-premium-form">
                {selectedJob.myQuote && selectedJob.myQuote.status === 'rejected' && (
                  <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #f5c6cb', fontSize: '14px' }}>
                    <strong>❌ Tu cotización fue rechazada.</strong> Por favor, revisa las condiciones y envía una nueva propuesta si lo deseas.
                  </div>
                )}
                <h4>{selectedJob.myQuote ? 'Actualizar Tu Oferta' : 'Tu Oferta'}</h4>
                <div className="mercado-form-group">
                  <label>Propuesta Económica ($)</label>
                  <div className="mercado-input-wrapper">
                    <DollarSign size={18} className="mercado-input-icon" />
                    <input 
                      type="number" 
                      placeholder="Ej. 800" 
                      className="mercado-premium-input" 
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="mercado-form-group">
                  <label>Mensaje para el cliente</label>
                  <textarea 
                    placeholder="Hola, tengo experiencia en esto. Puedo ir hoy mismo..." 
                    className="mercado-premium-textarea"
                    value={quoteMessage}
                    onChange={(e) => setQuoteMessage(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="mercado-premium-footer">
              <button className="mercado-btn-cancel" onClick={() => setShowQuoteModal(false)}>Cancelar</button>
              <button 
                className="mercado-premium-submit"
                onClick={handleEnviarCotizacion}
              >
                <Send size={16} /> 
                {selectedJob.myQuote ? 'Actualizar Cotización' : 'Enviar Cotización'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MercadoTrabajos;
