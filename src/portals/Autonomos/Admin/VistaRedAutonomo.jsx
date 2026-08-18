import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import Header from '../../../components/Shared/Header';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import ModalServicioAutonomo from './ModalServicioAutonomo';
import ChatModal from '../../../components/Shared/ChatModal';
import '../../../styles/Autonomos/VistaRedAutonomo.css';
import '../../../styles/AgenteSolutions/Tecnico/MercadoTrabajos.css';
import {
  Plus, MapPin, DollarSign, Clock, CheckCircle, User, Mail, Phone,
  Calendar, Award, List, Map as MapIcon, MessageCircle, Briefcase,
  Star, Shield, ChevronRight, X, Eye, TrendingUp
} from 'lucide-react';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 21.0181, lng: -89.6242 };

const mockSolicitudes = [
  { id: 1, titulo: "Mantenimiento de 5 Minisplits", lat: 21.0250, lng: -89.6300, presupuesto: "$2,000", estado: "Cotizando", cotizaciones: 3, fecha: "2026-08-11", lugar: "Casa 1", zona: "Col. Itzimná, Mérida", calle: "C. 30 x 7", cotizaciones_list: [] },
  { id: 2, titulo: "Reparación de Fuga de Agua", lat: 21.0100, lng: -89.6200, presupuesto: "A convenir", estado: "Completado", cotizaciones: 1, fecha: "2026-08-09", lugar: "Casa 2", zona: "Col. San Lorenzo, Umán", calle: "C. 20 x 15", cotizaciones_list: [] }
];

const getStatusColor = (estado) => {
  if (!estado) return '#94a3b8';
  const s = estado.toLowerCase();
  if (s.includes('completado') || s.includes('done')) return '#16a34a';
  if (s.includes('aceptado') || s.includes('accepted')) return '#2563eb';
  if (s.includes('cotizando') || s.includes('pending')) return '#ea580c';
  return '#64748b';
};

const VistaRedAutonomo = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showQuotesModal, setShowQuotesModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobForQuotes, setSelectedJobForQuotes] = useState(null);
  const [selectedTechnicianProfile, setSelectedTechnicianProfile] = useState(null);
  const [showTechModal, setShowTechModal] = useState(false);
  const [activeChatQuote, setActiveChatQuote] = useState(null);
  const [networkJobs, setNetworkJobs] = useState([]);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('agente_token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/mercado-trabajos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        const jobs = res.data.data.map(order => {
          const rawLat = order.lat ? parseFloat(order.lat) : (order.area_lat ? parseFloat(order.area_lat) : (21.0181 + Math.sin(order.id * 17) * 0.025));
          const rawLng = order.lng ? parseFloat(order.lng) : (order.area_lng ? parseFloat(order.area_lng) : (-89.6242 + Math.cos(order.id * 17) * 0.025));
          const zonaTexto = order.zona || order.zona_colonia || order.property?.property_name || 'Zona Metropolitana';
          return {
            id: order.id,
            titulo: order.type + (order.equipment ? ` - ${order.equipment}` : ''),
            lat: rawLat,
            lng: rawLng,
            presupuesto: "A convenir",
            estado: order.status || 'Por Hacer',
            fecha: new Date(order.created_at).toLocaleDateString('es-MX'),
            lugar: order.property?.property_name || 'Lugar no especificado',
            zona: zonaTexto,
            calle: order.property?.address || 'Dirección no especificada',
            cotizaciones: order.network_quotes_count || 0,
            cotizaciones_list: order.network_quotes || [],
            cliente: order.owner_name || 'Cliente',
            descripcion: order.description || '',
          };
        });
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
      const token = localStorage.getItem('agente_token');
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/network-quotes/${quoteId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
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

  const handleAcceptQuote = async (quote) => {
    const techName = quote.technician ? `${quote.technician.first_name} ${quote.technician.last_name}` : 'este técnico';
    if (!window.confirm(`¿Confirmas que deseas ACEPTAR la cotización de $${parseFloat(quote.price).toFixed(2)} de ${techName}? El trabajo le será asignado de inmediato.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('agente_token');
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/network-quotes/${quote.id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        alert("🎉 " + res.data.message);
        setShowQuotesModal(false);
        fetchJobs();
      }
    } catch (e) {
      console.error(e);
      alert("Hubo un error al aceptar la cotización. Intenta de nuevo.");
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

  const totalOfertas = networkJobs.reduce((s, j) => s + (j.cotizaciones || 0), 0);

  return (
    <div className="mercado-container">
      <Header title="Red de Trabajos — Mis Publicaciones" />

      <div className="mercado-content">
        {/* ── Mobile Toggle Button ── */}
        <button
          className="mercado-mobile-toggle-btn"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
        >
          {mobileDrawerOpen ? (
            <><MapIcon size={16} /> Ver Mapa</>
          ) : (
            <><List size={16} /> Ver Mis Publicaciones ({networkJobs.length})</>
          )}
        </button>

        {/* ── Mapa ── */}
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
                  <React.Fragment key={job.id}>
                    <Circle
                      center={{ lat: job.lat, lng: job.lng }}
                      radius={550}
                      options={{
                        fillColor: job.cotizaciones > 0 ? '#16a34a' : '#ff6600',
                        fillOpacity: 0.16,
                        strokeColor: job.cotizaciones > 0 ? '#15803d' : '#ea580c',
                        strokeOpacity: 0.7,
                        strokeWeight: 1.5,
                        clickable: true
                      }}
                      onClick={() => setSelectedJob(job)}
                    />
                    <Marker
                      position={{ lat: job.lat, lng: job.lng }}
                      onClick={() => setSelectedJob(job)}
                      title={`Zona: ${job.zona}`}
                      icon={{
                        url: job.cotizaciones > 0
                          ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                          : 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
                      }}
                    />
                  </React.Fragment>
                ))}

                {selectedJob && (
                  <InfoWindow
                    position={{ lat: selectedJob.lat, lng: selectedJob.lng }}
                    onCloseClick={() => setSelectedJob(null)}
                  >
                    <div className="mercado-info-window">
                      <h4>{selectedJob.titulo}</h4>
                      <p style={{ color: '#ea580c', fontWeight: '700', margin: '4px 0' }}>
                        <MapPin size={11} /> {selectedJob.zona}
                      </p>
                      <p style={{ margin: '3px 0', fontSize: '12px', color: '#64748b' }}>
                        <Clock size={11} /> {selectedJob.fecha}
                      </p>
                      <button
                        className="mercado-btn-details"
                        onClick={() => openQuotesModal(selectedJob)}
                      >
                        Ver {selectedJob.cotizaciones} {selectedJob.cotizaciones === 1 ? 'Oferta' : 'Ofertas'}
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

        {/* ── Sidebar Premium ── */}
        <div className={`mercado-sidebar ${mobileDrawerOpen ? 'mobile-open' : ''}`}>
          {/* Grab Handle */}
          <div
            className="mercado-mobile-drag-handle"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          />

          {/* Header de la sidebar */}
          <div className="mercado-sidebar-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <p className="mercado-sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="mercado-map-live-dot" style={{ display: 'inline-block' }} />
                  En vivo
                </p>
                <h2 className="mercado-sidebar-subtitle">Mis Publicaciones</h2>
                <p className="mercado-sidebar-desc">Trabajos que has publicado en la red</p>
              </div>
              <button
                className="red-btn-publish"
                onClick={() => setShowModal(true)}
              >
                <Plus size={15} /> Publicar
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, background: '#fff7ed', borderRadius: '12px', padding: '10px 12px', border: '1.5px solid #fed7aa' }}>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Publicaciones</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#ea580c' }}>{networkJobs.length}</p>
              </div>
              <div style={{ flex: 1, background: '#f0fdf4', borderRadius: '12px', padding: '10px 12px', border: '1.5px solid #bbf7d0' }}>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ofertas Total</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#16a34a' }}>{totalOfertas}</p>
              </div>
            </div>
          </div>

          {/* Job List */}
          <div className="mercado-job-list">
            {networkJobs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                <Briefcase size={36} style={{ marginBottom: '10px', opacity: 0.4 }} />
                <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#64748b' }}>Sin publicaciones activas</p>
                <p style={{ margin: '4px 0 16px 0', fontSize: '12px' }}>Publica tu primer problema para recibir ofertas de técnicos.</p>
                <button className="red-btn-publish" onClick={() => setShowModal(true)}>
                  <Plus size={14} /> Nueva Publicación
                </button>
              </div>
            )}

            {networkJobs.map(job => {
              const statusColor = getStatusColor(job.estado);
              const hasOffers = job.cotizaciones > 0;
              return (
                <div
                  key={job.id}
                  className={`mercado-job-card ${selectedJob?.id === job.id ? 'active' : ''}`}
                  onClick={() => openQuotesModal(job)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  {/* Top: Title + Estado */}
                  <div className="mercado-job-card-top">
                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', lineHeight: 1.3, margin: 0, flex: 1 }}>
                      {job.titulo}
                    </h4>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        background: `${statusColor}18`,
                        color: statusColor,
                        border: `1.5px solid ${statusColor}40`,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {job.estado}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="mercado-job-meta" style={{ marginTop: '8px' }}>
                    <span style={{ color: '#ea580c', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={11} /> {job.zona}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> {job.fecha}
                    </span>
                  </div>

                  {/* Footer: Offer count */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {hasOffers ? (
                        <>
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #16a34a, #15803d)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <TrendingUp size={12} color="#fff" />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#16a34a' }}>
                            {job.cotizaciones} {job.cotizaciones === 1 ? 'oferta recibida' : 'ofertas recibidas'}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                          Esperando ofertas...
                        </span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '12px', fontWeight: '700', color: '#ff6600',
                      display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                      Ver ofertas <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modal Publicar Servicio ── */}
      {showModal && (
        <ModalServicioAutonomo
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchJobs();
          }}
        />
      )}

      {/* ── MODAL: OFERTAS RECIBIDAS ── */}
      {showQuotesModal && selectedJobForQuotes && (
        <div className="mercado-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowQuotesModal(false)}>
          <div className="mercado-premium-modal" style={{ maxWidth: '680px' }}>
            {/* Header */}
            <div className="mercado-premium-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={18} color="#fb923c" />
                  Ofertas Recibidas
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                  {selectedJobForQuotes.titulo}
                </p>
              </div>
              <button
                onClick={() => setShowQuotesModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="mercado-premium-body" style={{ flexDirection: 'column', padding: '0', background: '#f8fafc', maxHeight: '78vh', overflowY: 'auto' }}>

              {/* Job info strip */}
              <div style={{ background: '#ffffff', padding: '16px 24px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                  <MapPin size={14} color="#ea580c" />
                  <span><strong>Zona:</strong> {selectedJobForQuotes.zona}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                  <Clock size={14} color="#ea580c" />
                  <span><strong>Publicado:</strong> {selectedJobForQuotes.fecha}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                  <TrendingUp size={14} color="#16a34a" />
                  <span><strong>{selectedJobForQuotes.cotizaciones}</strong> ofertas en total</span>
                </div>
              </div>

              {/* Privacy notice */}
              <div style={{ margin: '16px 24px 0', padding: '10px 14px', background: '#fff7ed', borderRadius: '12px', border: '1.5px solid #fed7aa', fontSize: '12px', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Shield size={14} color="#ea580c" style={{ flexShrink: 0 }} />
                <span>🔒 <strong>Protección de datos:</strong> Tu dirección exacta solo se comparte con el técnico cuya oferta aceptes.</span>
              </div>

              {/* Quotes */}
              <div style={{ padding: '16px 24px 24px' }}>
                {selectedJobForQuotes.cotizaciones_list.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '48px 20px', background: '#ffffff', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                    <Star size={32} style={{ marginBottom: '10px', opacity: 0.3 }} />
                    <p style={{ margin: '0 0 4px 0', fontWeight: '700', fontSize: '15px', color: '#475569' }}>Aún no hay ofertas</p>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Los técnicos de la red te notificarán en cuanto coticen.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {selectedJobForQuotes.cotizaciones_list.map((quote) => {
                      const isRejected = quote.status === 'rejected';
                      const isAccepted = quote.status === 'accepted';
                      return (
                        <div
                          key={quote.id}
                          style={{
                            background: isRejected ? '#fef2f2' : isAccepted ? '#f0fdf4' : '#ffffff',
                            border: `1.5px solid ${isRejected ? '#fca5a5' : isAccepted ? '#86efac' : '#e2e8f0'}`,
                            borderRadius: '18px',
                            padding: '18px 20px',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Quote header: Avatar + Name + Price */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              {/* Avatar */}
                              <div
                                onClick={() => { setSelectedTechnicianProfile(quote.technician); setShowTechModal(true); }}
                                title="Ver perfil completo del técnico"
                                style={{
                                  width: '50px', height: '50px', borderRadius: '50%',
                                  background: isRejected ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : isAccepted ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #ff6600, #ea580c)',
                                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '20px', fontWeight: '900', cursor: 'pointer',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  transition: 'transform 0.2s',
                                  flexShrink: 0
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                {quote.technician?.first_name?.charAt(0) || 'T'}
                              </div>

                              {/* Name + Badge */}
                              <div>
                                <h4 style={{ margin: '0 0 3px 0', fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>
                                  {quote.technician?.first_name} {quote.technician?.last_name}
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px',
                                    padding: '2px 8px', borderRadius: '12px',
                                    background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa'
                                  }}>
                                    <Shield size={9} style={{ marginRight: '3px', verticalAlign: 'middle' }} />
                                    Técnico Verificado
                                  </span>
                                  <button
                                    onClick={() => { setSelectedTechnicianProfile(quote.technician); setShowTechModal(true); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px', padding: 0 }}
                                  >
                                    <Eye size={11} /> Ver perfil
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Price */}
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>
                                ${parseFloat(quote.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Oferta del técnico</div>
                            </div>
                          </div>

                          {/* Message */}
                          {quote.message && (
                            <div style={{
                              background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 15px',
                              borderRadius: '12px', fontSize: '13px', color: '#475569', fontStyle: 'italic',
                              marginBottom: '14px', lineHeight: 1.5, borderLeft: '3px solid #fb923c'
                            }}>
                              "{quote.message}"
                            </div>
                          )}

                          {/* Actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                            {isRejected ? (
                              <div style={{ color: '#dc2626', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                ❌ Propuesta Rechazada
                              </div>
                            ) : isAccepted ? (
                              <div style={{ color: '#16a34a', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <CheckCircle size={16} /> ✅ Oferta Aceptada — Técnico Asignado
                              </div>
                            ) : (
                              <>
                                <button
                                  className="red-btn-reject"
                                  onClick={() => handleRejectQuote(quote.id)}
                                >
                                  ✕ Rechazar
                                </button>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button
                                    className="red-btn-contact"
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                    onClick={() => setActiveChatQuote({ ...quote, jobTitle: selectedJobForQuotes?.titulo })}
                                  >
                                    <MessageCircle size={14} /> Chat
                                  </button>
                                  <button
                                    className="red-btn-accept"
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px' }}
                                    onClick={() => handleAcceptQuote(quote)}
                                  >
                                    <CheckCircle size={15} /> Aceptar Oferta
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PERFIL DEL TÉCNICO ── */}
      {showTechModal && selectedTechnicianProfile && (
        <div className="mercado-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowTechModal(false)}>
          <div className="mercado-premium-modal" style={{ maxWidth: '480px' }}>
            {/* Header */}
            <div className="mercado-premium-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={17} color="#fb923c" /> Perfil del Técnico
              </h2>
              <button
                onClick={() => setShowTechModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={17} />
              </button>
            </div>

            <div className="mercado-premium-body" style={{ flexDirection: 'column', padding: '24px', background: '#ffffff' }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '22px' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff6600, #ea580c)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: '900',
                  boxShadow: '0 6px 20px rgba(234, 88, 12, 0.4)'
                }}>
                  {selectedTechnicianProfile.first_name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '20px', fontWeight: '900' }}>
                    {selectedTechnicianProfile.first_name} {selectedTechnicianProfile.last_name}
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#ea580c', background: '#fff7ed', padding: '3px 10px', borderRadius: '20px', border: '1px solid #fed7aa' }}>
                    <Shield size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} />
                    Técnico Verificado de la Red
                  </span>
                </div>
              </div>

              {/* Contact info */}
              <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '14px', border: '1.5px solid #e2e8f0', marginBottom: '20px' }}>
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

              {/* Specialties */}
              <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
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

      {/* ── CHAT EN VIVO CON EL TÉCNICO ── */}
      {activeChatQuote && (
        <ChatModal
          quoteId={activeChatQuote.id}
          isNetworkQuote={true}
          jobTitle={activeChatQuote.jobTitle || 'Trabajo en la Red'}
          otherPartyName={
            activeChatQuote.technician?.first_name
              ? `${activeChatQuote.technician.first_name} ${activeChatQuote.technician.last_name || ''}`
              : (activeChatQuote.technician?.name || 'Técnico de la Red')
          }
          otherPartyRole="Técnico de la Red"
          initialMessages={activeChatQuote.chat_history || []}
          onClose={() => setActiveChatQuote(null)}
        />
      )}
    </div>
  );
};

export default VistaRedAutonomo;
