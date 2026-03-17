import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';
import logoAgente from '../assets/Logo_simple.png';

const containerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '15px'
};

const Map = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [marcadorActivo, setMarcadorActivo] = useState(null);
  const [center, setCenter] = useState({ lat: 20.8822, lng: -89.7468 }); 
  const [miUbicacion, setMiUbicacion] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyDgyTj0X6kgGoMV8NxQGDp4-Nx0bxJd0Hw" // API key de Google
  });

  useEffect(() => {
    const cargarPropiedades = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/map');
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
    <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <img 
          src="/src/assets/Logo3.png" 
          alt="Agente Solutions" 
          style={{ height: '80px', objectFit: 'contain' }} 
        />
      </div>      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13} 
      >
        {miUbicacion && (
          <Marker
            position={miUbicacion}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' // Icono azul oficial de Google
            }}
            title="¡Estás aquí!"
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
                
                <button style={{
                    marginTop: '8px', 
                    backgroundColor: '#333', 
                    color: 'white', 
                    border: 'none', 
                    padding: '6px 12px', 
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    alignSelf: 'flex-start'
                  }}>
                  Ver Detalles
                </button>
              </div>
              
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default Map;