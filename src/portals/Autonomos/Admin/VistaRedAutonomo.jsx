import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import Header from '../../../components/Shared/Header';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import ModalServicioAutonomo from './ModalServicioAutonomo';
import '../../../styles/Autonomos/VistaRedAutonomo.css';
import '../../../styles/AgenteSolutions/Tecnico/MercadoTrabajos.css';
import { Plus, MapPin, DollarSign, Clock, CheckCircle, User, Mail, Phone, Calendar, Award } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 21.0181, lng: -89.6242 }; // Mérida, Yucatán

const mockSolicitudes = [
  { id: 1, titulo: "Mantenimiento de 5 Minisplits", lat: 21.0250, lng: -89.6300, presupuesto: "$2,000", estado: "Cotizando", cotizaciones: 3, fecha: "2026-08-11", lugar: "Casa 1", calle: "C. 30 x 7", cotizaciones_list: [] },
  { id: 2, titulo: "Reparación de Fuga de Agua", lat: 21.0100, lng: -89.6200, presupuesto: "A convenir", estado: "Completado", cotizaciones: 1, fecha: "2026-08-09", lugar: "Casa 2", calle: "C. 20 x 15", cotizaciones_list: [] }
];

const VistaRedAutonomo = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showQuotesModal, setShowQuotesModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobForQuotes, setSelectedJobForQuotes] = useState(null);
  const [selectedTechnicianProfile, setSelectedTechnicianProfile] = useState(null);
  const [showTechModal, setShowTechModal] = useState(false);
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
          estado: order.status || 'Por Hacer',
          fecha: new Date(order.created_at).toLocaleDateString('es-MX'),
          lugar: order.property?.property_name || 'Lugar no especificado',
          calle: order.property?.address || 'Dirección no especificada',
          cotizaciones: order.network_quotes_count || 0,
          cotizaciones_list: order.network_quotes || [],
          cliente: order.owner_name || 'Cliente'
        }));
        setNetworkJobs(jobs);
      }
    } catch (e) {
      console.error("Error fetching network jobs, falling back to mock", e);
      if (networkJobs.length === 0) setNetworkJobs(mockSolicitudes);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRejectQuote = async (quoteId) => {
    if (!window.confirm("¿Estás seguro de que deseas rechazar esta cotización?")) return;
    
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/network-quotes/${quoteId}/reject`);
      if (res.data.success) {
        alert("Cotización rechazada. El técnico ha sido notificado para mejorar su oferta.");
        fetchJobs();
        setShowQuotesModal(false);
      }
    } catch (e) {
      console.error(e);
      alert("Hubo un error al rechazar la cotización.");
    }
  };

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyDgyTj0X6kgGoMV8NxQGDp4-Nx0bxJd0Hw"
  });

  const openQuotesModal = (job) => {
    setSelectedJobForQuotes(job);
    setShowQuotesModal(true);
  };

  return (
    <div className="mercado-container">
      <Header title="Red de Autónomos / Mis Publicaciones" />
      
      <div className="mercado-content">
        {/* ─── Map Section ─── */}
        <div className="mercado-map-section">
          {isLoaded ? (
            <>
              <div className="mercado-map-overlay-badge">
                <span className="mercado-map-live-dot" />
                {networkJobs.length} publicaciones activas
              </div>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={13}
                options={{ disableDefaultUI: false }}
              >
                {networkJobs.map(job => (
                  <Marker
                    key={job.id}
                    position={{ lat: job.lat, lng: job.lng }}
                    onClick={() => setSelectedJob(job)}
                    icon={{
                      url: job.cotizaciones > 0 
                        ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                        : 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'
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
                      <p style={{ margin: '4px 0', fontWeight: 'bold', color: '#ff6600' }}>{selectedJob.estado}</p>
                      <p><MapPin size={11} /> {selectedJob.lugar}</p>
                      <p><Clock size={11} /> {selectedJob.fecha}</p>
                      <button 
                        className="mercado-btn-details"
                        onClick={() => openQuotesModal(selectedJob)}
                      >
                        Ver {selectedJob.cotizaciones} {selectedJob.cotizaciones === 1 ? 'Cotización' : 'Cotizaciones'}
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </>
          ) : (
            <div className="mercado-loading-map">Cargando Mapa...</div>
          )}
        </div>

        {/* ─── Sidebar Section ─── */}
        <div className="mercado-sidebar">
          <div className="mercado-sidebar-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p className="mercado-sidebar-title">🔴 En vivo</p>
              <button 
                className="red-btn-publish"
                onClick={() => setShowModal(true)}
              >
                <Plus size={16} /> Publicar Problema
              </button>
            </div>
            <h2 className="mercado-sidebar-subtitle">Mis Publicaciones</h2>
            <p className="mercado-sidebar-desc">Tus reportes publicados en el mapa de la red</p>
          </div>

          <div className="mercado-job-list">
            {networkJobs.length === 0 && (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 20px', fontSize: '14px' }}>
                No tienes publicaciones activas en la red. Haz clic en "Publicar Problema" para crear una.
              </div>
            )}
            {networkJobs.map(job => (
              <div
                key={job.id}
                className={`mercado-job-card ${selectedJob?.id === job.id ? 'active' : ''}`}
                onClick={() => openQuotesModal(job)}
              >
                <div className="mercado-job-card-top">
                  <h4>{job.titulo}</h4>
                  <span className="mercado-job-badge badge-pending">
                    {job.estado}
                  </span>
                </div>
                <div className="mercado-job-meta">
                  <span><MapPin size={11} /> {job.lugar}</span>
                  <span><Clock size={11} /> {job.fecha}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '12px' }}>
                  <span style={{ color: '#ea580c', fontWeight: '800' }}>
                    {job.cotizaciones} {job.cotizaciones === 1 ? 'oferta recibida' : 'ofertas recibidas'}
                  </span>
                  <span style={{ color: '#ff6600', fontWeight: '700', cursor: 'pointer' }}>
                    Ver ofertas →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para Crear / Publicar Servicio */}
      {showModal && (
        <ModalServicioAutonomo 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
            fetchJobs();
          }}
        />
      )}

      {/* ─── MODAL DE COTIZACIONES RECIBIDAS ─── */}
      {showQuotesModal && selectedJobForQuotes && (
        <div className="mercado-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowQuotesModal(false)}>
          <div className="mercado-premium-modal" style={{ maxWidth: '650px' }}>
            <div className="mercado-premium-header">
              <h2>📋 Cotizaciones Recibidas</h2>
              <span className="mercado-modal-close" onClick={() => setShowQuotesModal(false)}>×</span>
            </div>
            <div className="mercado-premium-body" style={{ flexDirection: 'column', padding: '24px', background: '#f8fafc' }}>
              <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '1.5px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>
                  {selectedJobForQuotes.titulo}
                </h3>
                <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '15px' }}>
                  <span><MapPin size={13} style={{ verticalAlign: 'middle', color: '#ff6600' }} /> {selectedJobForQuotes.lugar}</span>
                  <span><Clock size={13} style={{ verticalAlign: 'middle', color: '#ff6600' }} /> {selectedJobForQuotes.fecha}</span>
                </div>
              </div>
              
              {selectedJobForQuotes.cotizaciones_list.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px', background: '#ffffff', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '15px' }}>Aún no has recibido cotizaciones para este trabajo.</p>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Los técnicos de la red te notificarán en cuanto coticen.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {selectedJobForQuotes.cotizaciones_list.map((quote) => (
                    <div key={quote.id} className="red-quote-card">
                      <div className="red-quote-header">
                        <div className="red-quote-tech">
                          <div 
                            className="red-quote-avatar" 
                            onClick={() => {
                              setSelectedTechnicianProfile(quote.technician);
                              setShowTechModal(true);
                            }}
                            title="Ver perfil completo y especialidades del técnico"
                          >
                            {quote.technician?.first_name?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                              {quote.technician?.first_name} {quote.technician?.last_name}
                            </h4>
                            <span className="red-quote-role">Técnico Verificado</span>
                          </div>
                        </div>
                        <div className="red-quote-price">
                          ${parseFloat(quote.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      {quote.message && (
                        <div className="red-quote-message">
                          "{quote.message}"
                        </div>
                      )}

                      <div className="red-quote-actions">
                        {quote.status === 'rejected' ? (
                          <div style={{ color: '#dc2626', fontWeight: '800', fontSize: '13px', padding: '8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ❌ Propuesta Rechazada
                          </div>
                        ) : (
                          <>
                            <button className="red-btn-reject" onClick={() => handleRejectQuote(quote.id)}>
                              Rechazar Oferta
                            </button>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button className="red-btn-contact" onClick={() => alert("Función de chat en desarrollo.")}>
                                Contactar
                              </button>
                              <button className="red-btn-accept" onClick={() => alert("Se aceptaría la cotización de " + quote.technician?.first_name)}>
                                Aceptar Oferta
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DEL PERFIL DEL TÉCNICO ─── */}
      {showTechModal && selectedTechnicianProfile && (
        <div className="mercado-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowTechModal(false)}>
          <div className="mercado-premium-modal" style={{ maxWidth: '480px' }}>
            <div className="mercado-premium-header">
              <h2>👤 Perfil del Técnico</h2>
              <span className="mercado-modal-close" onClick={() => setShowTechModal(false)}>×</span>
            </div>
            <div className="mercado-premium-body" style={{ flexDirection: 'column', padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ 
                  width: '68px', 
                  height: '68px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #ff6600, #ea580c)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '26px', 
                  fontWeight: '800',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)'
                }}>
                  {selectedTechnicianProfile.first_name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>
                    {selectedTechnicianProfile.first_name} {selectedTechnicianProfile.last_name}
                  </h3>
                  <span style={{ color: '#ea580c', fontWeight: '700', fontSize: '13px' }}>Técnico de la Red Agente</span>
                </div>
              </div>

              <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '14px', border: '1.5px solid #fed7aa', marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px', fontSize: '13px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} color="#ea580c" />
                  <strong>Email:</strong> {selectedTechnicianProfile.email || 'No disponible'}
                </div>
                <div style={{ marginBottom: '10px', fontSize: '13px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={15} color="#ea580c" />
                  <strong>Teléfono:</strong> {selectedTechnicianProfile.phone_number || 'No disponible'}
                </div>
                {selectedTechnicianProfile.birth_date && (
                  <div style={{ fontSize: '13px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={15} color="#ea580c" />
                    <strong>Fecha de Nacimiento:</strong> {new Date(selectedTechnicianProfile.birth_date).toLocaleDateString('es-MX')}
                  </div>
                )}
              </div>

              <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={16} color="#ea580c" /> Especialidades Verificadas
              </h4>
              {selectedTechnicianProfile.specialties && selectedTechnicianProfile.specialties.length > 0 ? (
                <div className="red-quote-specialties" style={{ marginTop: 0 }}>
                  {selectedTechnicianProfile.specialties.map(spec => (
                    <span key={spec.id} className="red-specialty-badge">
                      ✓ {spec.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0, fontSize: '13px' }}>No ha registrado especialidades adicionales.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaRedAutonomo;
