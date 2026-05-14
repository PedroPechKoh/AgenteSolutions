import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoAgente from '../assets/Logo_simple.png';
import Header from './Shared/Header';
import { ChevronLeft } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '75vh', 
  borderRadius: '15px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)' 
};

const Map = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [marcadorActivo, setMarcadorActivo] = useState(null);
  const [center, setCenter] = useState({ lat: 20.8822, lng: -89.7468 }); 
  const [miUbicacion, setMiUbicacion] = useState(null);
  const navigate = useNavigate();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyDgyTj0X6kgGoMV8NxQGDp4-Nx0bxJd0Hw" // API key de Google
  });

  useEffect(() => {
    const cargarPropiedades = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/map`);
        setPropiedades(res.data);
      } catch (error) {
        console.error("Error cargando los marcadores:", error);
      }
    };
    cargarPropiedades();

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
  }, []);

  if (!isLoaded) return <div>Cargando el mapa...</div>;

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* ✅ REEMPLAZAMOS EL LOGO SUELTO POR EL HEADER COMPLETO */}
      <Header titulo="MAPA" />

      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '15px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '8px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            <ChevronLeft size={18} />
            <span>REGRESAR</span>
          </button>
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
                // Usamos un ícono azul de Google para diferenciar la ubicación actual de los clientes
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' 
              }}
            />
          )}

          {propiedades.map((prop) => (
            <Marker
              key={prop.id}
              position={{ lat: prop.lat, lng: prop.lng }}
              onClick={() => setMarcadorActivo(prop)}
              icon={{
                url: logoAgente, 
                scaledSize: new window.google.maps.Size(40, 40), 
                origin: new window.google.maps.Point(0, 0),
                anchor: new window.google.maps.Point(20, 40)
              }}
            />
          ))}

          {marcadorActivo && (
            <InfoWindow
              position={{ lat: marcadorActivo.lat, lng: marcadorActivo.lng }}
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
        </GoogleMap>
      </div>
    </div>
  );
};

export default Map;