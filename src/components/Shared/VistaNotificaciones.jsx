import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, CheckCircle, Info } from 'lucide-react';
import Header from './Header';

const VistaNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [filtroActivo, setFiltroActivo] = useState('todas'); 
  
  const navigate = useNavigate();

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const { data } = await axios.get('http://127.0.0.1:8000/api/notifications/all');
        if (data.success) {
          setNotificaciones(data.notifications);
        }
      } catch (error) {
        console.error("Error al cargar historial", error);
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, []);

  const formatearFecha = (fechaString) => {
    const opciones = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-ES', opciones);
  };

  const notificacionesFiltradas = notificaciones.filter(notif => {
    if (filtroActivo === 'leidas') return notif.read_at !== null;
    if (filtroActivo === 'no_leidas') return notif.read_at === null;
    return true; 
  });

  return (
    <div style={{ backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      <Header />
      
      <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Bell size={28} color="#F26522" />
          <h2 style={{ color: '#333', margin: 0 }}>Historial de Notificaciones</h2>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {['todas', 'no_leidas', 'leidas'].map((filtro) => (
            <button
              key={filtro}
              onClick={() => setFiltroActivo(filtro)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                backgroundColor: filtroActivo === filtro ? '#F26522' : '#e0e0e0',
                color: filtroActivo === filtro ? 'white' : '#555',
                boxShadow: filtroActivo === filtro ? '0 2px 8px rgba(242, 101, 34, 0.4)' : 'none'
              }}
            >
              {filtro === 'todas' ? 'Todas' : filtro === 'no_leidas' ? 'No Leídas' : 'Leídas'}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {cargando ? (
            <p style={{ padding: '30px', textAlign: 'center', color: '#888' }}>Cargando historial...</p>
          ) : notificacionesFiltradas.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
              <Bell size={40} color="#ccc" style={{ marginBottom: '10px' }} />
              <p>No hay notificaciones en esta categoría.</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {notificacionesFiltradas.map((notif) => {
                const esNueva = notif.read_at === null; 

                return (
                  <li 
                    key={notif.id}
                    style={{ 
                      padding: '20px', 
                      borderBottom: '1px solid #eee',
                      backgroundColor: esNueva ? '#fffafa' : 'white', 
                      display: 'flex',
                      gap: '15px',
                      alignItems: 'flex-start',
                      cursor: notif.data.url ? 'pointer' : 'default',
                      transition: 'background 0.2s'
                    }}
                    onClick={() => notif.data.url && navigate(notif.data.url)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = esNueva ? '#ffe9df' : '#f9f9f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = esNueva ? '#fffafa' : 'white'}
                  >
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: esNueva ? '#FF3B30' : 'transparent', 
                      marginTop: '6px',
                      flexShrink: 0
                    }} />

                    <div style={{ color: esNueva ? '#F26522' : '#999', marginTop: '0px' }}>
                      {esNueva ? <Info size={24} /> : <CheckCircle size={24} />}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0', color: esNueva ? '#000' : '#555', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {notif.data.title}
                        {esNueva && (
                          <span style={{ fontSize: '0.7rem', backgroundColor: '#FF3B30', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>
                            Nueva
                          </span>
                        )}
                      </h4>
                      <p style={{ margin: '0 0 8px 0', color: '#555', fontSize: '0.95rem' }}>
                        {notif.data.message}
                      </p>
                      <span style={{ fontSize: '0.8rem', color: '#999' }}>
                        {formatearFecha(notif.created_at)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default VistaNotificaciones;