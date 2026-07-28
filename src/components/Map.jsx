import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoAgente from '../assets/Logo_simple.png';
import Header from './Shared/Header';
import { ChevronLeft, RefreshCw, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const containerStyle = {
  width: '100%',
  height: '75vh', 
  borderRadius: '15px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)' 
};

const Map = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [techniciansLive, setTechniciansLive] = useState([]);
  const [marcadorActivo, setMarcadorActivo] = useState(null);
  const [tecnicoActivo, setTecnicoActivo] = useState(null);
  const [center, setCenter] = useState({ lat: 20.8822, lng: -89.7468 }); 
  const [miUbicacion, setMiUbicacion] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tenantLogo, setTenantLogo] = useState(null);
  const isRoot = user?.role_id === 0 || user?.role_id === 1;

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("dynamic_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.appLogo) setTenantLogo(parsed.appLogo);
      }
    } catch (e) {
      console.error("Error leyendo dynamic_settings para Map:", e);
    }
  }, []);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyDgyTj0X6kgGoMV8NxQGDp4-Nx0bxJd0Hw"
  });

  const cargarDatos = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/map`);
      setPropiedades(res.data);

      if (isRoot) {
        try {
          const liveRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/root/technicians-live-map`);
          if (liveRes.data && liveRes.data.data) {
            setTechniciansLive(liveRes.data.data);
          }
        } catch (liveErr) {
          console.warn("No se pudieron cargar los datos de rastreo en vivo:", liveErr);
        }
      }
    } catch (error) {
      console.error("Error cargando los marcadores:", error);
    }
  };

  useEffect(() => {
    cargarDatos();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const ubicacionActual = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCenter(ubicacionActual); 
          setMiUbicacion(ubicacionActual); 
        },
        (error) => {
          console.warn("El usuario no dio permiso de ubicación o hubo un error:", error);
        }
      );
    }

    // Auto-refresh si es Root para rastreo en tiempo real
    if (isRoot) {
      const intervalId = setInterval(cargarDatos, 15000);
      return () => clearInterval(intervalId);
    }
  }, [user, isRoot]);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const techId = params.get('techId') || params.get('userId');
    if (techId && techniciansLive.length > 0) {
      const tech = techniciansLive.find(t => String(t.user_id) === String(techId));
      if (tech) {
        setTecnicoActivo(tech);
        setMarcadorActivo(null);
        const lat = parseFloat(tech.latitude);
        const lng = parseFloat(tech.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setCenter({ lat, lng });
        }
      }
    }
  }, [techniciansLive]);

  if (!isLoaded) return <div style={{ padding: 20, textAlign: 'center' }}>Cargando el mapa...</div>;

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Header titulo="MAPA DE MONITOREO GPS" />

      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '8px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            <ChevronLeft size={18} />
            <span>REGRESAR</span>
          </button>

          {isRoot && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}>
                <Radio size={16} className="animate-pulse" color="#2563eb" />
                <span>Rastreo GPS Root Activo ({techniciansLive.length} Técnicos)</span>
              </span>

              <button
                type="button"
                onClick={cargarDatos}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#334155',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}
              >
                <RefreshCw size={14} /> Actualizar
              </button>
            </div>
          )}
        </div>

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={13} 
        >
          {miUbicacion && (
            <Marker
              position={miUbicacion}
              title="¡Estás aquí!"
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' 
              }}
            />
          )}

          {/* MARCADORES DE PROPIEDADES */}
          {propiedades.map((prop) => {
            const pinUrl = prop.tenant_logo_url || (!isRoot && tenantLogo ? tenantLogo : logoAgente);
            return (
              <Marker
                key={`prop-${prop.id}`}
                position={{ lat: parseFloat(prop.lat), lng: parseFloat(prop.lng) }}
                onClick={() => {
                  setMarcadorActivo(prop);
                  setTecnicoActivo(null);
                }}
                icon={{
                  url: pinUrl, 
                  scaledSize: new window.google.maps.Size(42, 42), 
                  origin: new window.google.maps.Point(0, 0),
                  anchor: new window.google.maps.Point(21, 42)
                }}
              />
            );
          })}

          {/* MARCADORES DE TÉCNICOS EN TIEMPO REAL (SOLO ROOT) */}
          {isRoot && techniciansLive.map((tech) => {
            const lat = parseFloat(tech.latitude);
            const lng = parseFloat(tech.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            const tieneArribo = tech.assigned_jobs && tech.assigned_jobs.some(j => j.arrival_status === 'EN_SITIO');
            const pinColor = tieneArribo ? 'green-dot.png' : 'orange-dot.png';

            return (
              <React.Fragment key={`tech-${tech.user_id}`}>
                <Marker
                  position={{ lat, lng }}
                  title={`${tech.first_name} ${tech.last_name}`}
                  onClick={() => {
                    setTecnicoActivo(tech);
                    setMarcadorActivo(null);
                  }}
                  icon={{
                    path: "M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z",
                    fillColor: tieneArribo ? '#10b981' : '#f26522',
                    fillOpacity: 1,
                    strokeWeight: 1.5,
                    strokeColor: '#ffffff',
                    scale: 1.5,
                    anchor: window.google ? new window.google.maps.Point(12, 12) : null
                  }}
                />

                {/* Línea conectora a la propiedad del trabajo asignado */}
                {tech.assigned_jobs && tech.assigned_jobs.map((job) => {
                  const propLat = parseFloat(job.property_latitude);
                  const propLng = parseFloat(job.property_longitude);
                  if (isNaN(propLat) || isNaN(propLng)) return null;

                  return (
                    <Polyline
                      key={`line-${tech.user_id}-${job.id}`}
                      path={[
                        { lat, lng },
                        { lat: propLat, lng: propLng }
                      ]}
                      options={{
                        strokeColor: job.arrival_status === 'EN_SITIO' ? '#10b981' : '#f26522',
                        strokeOpacity: 0.8,
                        strokeWeight: 3,
                        icons: [{
                          icon: { path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW },
                          offset: '50%'
                        }]
                      }}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* INFO WINDOW CLIENTE */}
          {marcadorActivo && (
            <InfoWindow
              position={{ lat: parseFloat(marcadorActivo.lat), lng: parseFloat(marcadorActivo.lng) }}
              onCloseClick={() => setMarcadorActivo(null)}
            >
              <div style={{ display: 'flex', gap: '15px', maxWidth: '300px', padding: '5px', alignItems: 'center' }}>
                <div>
                  <img 
                    src={marcadorActivo.picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                    alt="Perfil del Cliente" 
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FF6600' }} 
                  />
                </div>

                <div style={{ color: '#333', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h4 style={{ margin: 0, color: '#FF6600', fontSize: '1.1rem' }}>
                    {marcadorActivo.owner_name || 'Cliente sin nombre'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>
                    📞 {marcadorActivo.phone || 'Sin teléfono registrado'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', lineHeight: '1.2' }}>
                    📍 {marcadorActivo.address}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button 
                      onClick={() => {
                        const clienteData = {
                          id: marcadorActivo.client_id,
                          name: marcadorActivo.owner_name,
                          nombre: marcadorActivo.owner_name,
                          email: marcadorActivo.email,
                          correo: marcadorActivo.email,
                          phone: marcadorActivo.phone,
                          telefono: marcadorActivo.phone,
                          profile_picture: marcadorActivo.picture,
                          profile_picture_url: marcadorActivo.picture,
                          address: marcadorActivo.address,
                          direccion: marcadorActivo.address,
                          rol: 'CLIENTE'
                        };
                        navigate('/detalle-cliente', { state: { cliente: clienteData } });
                      }}
                      style={{
                        backgroundColor: '#333', 
                        color: 'white', 
                        border: 'none', 
                        padding: '8px 12px', 
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        flex: 1
                      }}>
                      Ver Detalles
                    </button>
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${marcadorActivo.lat},${marcadorActivo.lng}`)}
                      style={{
                        backgroundColor: '#F26522', 
                        color: 'white', 
                        border: 'none', 
                        padding: '8px 12px', 
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        flex: 1
                      }}>
                      Llegar
                    </button>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* INFO WINDOW TÉCNICO EN VIVO (SOLO ROOT) */}
          {tecnicoActivo && (
            <InfoWindow
              position={{ lat: parseFloat(tecnicoActivo.latitude), lng: parseFloat(tecnicoActivo.longitude) }}
              onCloseClick={() => setTecnicoActivo(null)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px', padding: '5px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img 
                    src={tecnicoActivo.profile_picture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                    alt="Técnico" 
                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #F26522' }} 
                  />
                  <div>
                    <h4 style={{ margin: 0, color: '#F26522', fontSize: '1.05rem', fontWeight: 'bold' }}>
                      🛠️ {tecnicoActivo.first_name} {tecnicoActivo.last_name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                      📞 {tecnicoActivo.phone_number || 'Sin teléfono'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>
                      GPS: {new Date(tecnicoActivo.last_gps_update).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #eee', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#333' }}>Trabajos del Día:</span>
                  {(!tecnicoActivo.assigned_jobs || tecnicoActivo.assigned_jobs.length === 0) ? (
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#666' }}>Sin trabajos agendados hoy</p>
                  ) : (
                    tecnicoActivo.assigned_jobs.map((job) => (
                      <div key={job.composite_id} style={{
                        marginTop: '6px',
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a' }}>
                            #{job.id} - {job.property_name || job.address}
                          </span>
                          {job.arrival_status === 'EN_SITIO' ? (
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', backgroundColor: '#d1fae5', color: '#065f46' }}>
                              🟢 En el lugar
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', backgroundColor: '#fff3ed', color: '#f26522' }}>
                              🟠 En camino
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                          Cliente: {job.client_name || 'Desconocido'} ({job.client_phone || 'Sin tel'})
                        </p>
                        {job.arrived_at && (
                          <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#059669', fontWeight: 'bold' }}>
                            Llegada confirmada: {new Date(job.arrived_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default Map;