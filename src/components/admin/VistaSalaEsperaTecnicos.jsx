import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../Shared/Header';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Clock, Phone, Mail, RefreshCw, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';

const VistaSalaEsperaTecnicos = () => {
  const [pendingTechs, setPendingTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchPendingTechs = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/tenants/pending-technicians`);
      if (res.data.success) {
        setPendingTechs(res.data.pending_technicians);
      }
    } catch (error) {
      console.error('Error al cargar técnicos en espera:', error);
      setMessage('Error al cargar la información. Revisa tu conexión o permisos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTechs();
  }, []);

  const handleApproveTech = async (userId) => {
    if (!window.confirm('¿Estás seguro de autorizar y dar de alta a este Técnico? Podrá iniciar sesión e ingresar a tu empresa inmediatamente.')) {
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/tenants/approve-technician/${userId}`);
      if (res.data.success) {
        alert('✅ ' + res.data.message);
        fetchPendingTechs();
      }
    } catch (error) {
      console.error('Error al aprobar técnico:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="main-container" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      <Header rolTexto="SALA DE ESPERA DE TÉCNICOS" />

      <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <button
            onClick={() => navigate('/VistaRoot')}
            style={{ padding: '10px 18px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ← Volver al Panel Principal
          </button>
          <button
            onClick={fetchPendingTechs}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#FF6600', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <RefreshCw size={18} /> Actualizar Lista
          </button>
        </div>

        <div style={{ backgroundColor: '#FFF3E0', borderRadius: '12px', padding: '20px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '5px solid #FF9800' }}>
          <Clock size={35} color="#FF6600" />
          <div>
            <h4 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>SALA DE ESPERA Y APROBACIÓN DE TÉCNICOS</h4>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.95rem' }}>
              Aquí aparecen los especialistas que se han registrado seleccionando tu empresa (código <strong>AUT_XX</strong>). Por seguridad, su acceso está restringido hasta que tú los autorices haciendo clic en "Aceptar y Dar de Alta".
            </p>
          </div>
        </div>

        {message && (
          <div style={{ padding: '15px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} /> {message}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#666' }}>
            Consultando sala de espera...
          </div>
        ) : pendingTechs.length === 0 ? (
          <div style={{ backgroundColor: '#fff', padding: '50px', borderRadius: '16px', textAlign: 'center', color: '#888', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <UserCheck size={50} color="#4CAF50" style={{ margin: '0 auto 15px auto', display: 'block' }} />
            <h3 style={{ margin: 0, color: '#333', fontSize: '1.3rem' }}>¡Todo al día!</h3>
            <p style={{ marginTop: '10px', color: '#666' }}>No hay técnicos pendientes de autorización en tu empresa en este momento.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {pendingTechs.map((tech) => (
              <div key={tech.id} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderTop: '5px solid #FF6600', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>SOLICITANTE #ID-{tech.id}</span>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: '1.3rem', color: '#333' }}>
                        {tech.first_name} {tech.last_name}
                      </h4>
                    </div>
                    <span style={{ backgroundColor: '#FFF5EC', color: '#FF6600', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      ⏳ En Espera
                    </span>
                  </div>

                  <div style={{ margin: '15px 0', padding: '12px', backgroundColor: '#F9F9F9', borderRadius: '8px' }}>
                    <p style={{ margin: '6px 0', color: '#555', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                      <Phone size={16} color="#FF6600" /> {tech.phone_number || 'Sin teléfono'}
                    </p>
                    <p style={{ margin: '6px 0', color: '#555', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                      <Mail size={16} color="#FF6600" /> {tech.email}
                    </p>
                    <p style={{ margin: '6px 0', color: '#888', fontSize: '0.85rem' }}>
                      <strong>Fecha registro:</strong> {new Date(tech.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleApproveTech(tech.id)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#4CAF50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(76,175,80,0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  <CheckCircle size={20} /> Aceptar y Dar de Alta
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VistaSalaEsperaTecnicos;
