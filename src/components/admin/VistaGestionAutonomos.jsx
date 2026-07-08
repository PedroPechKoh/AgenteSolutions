import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../Shared/Header';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, ArrowRightLeft, RefreshCw, AlertCircle, Phone, Mail, ShieldCheck } from 'lucide-react';

const VistaGestionAutonomos = () => {
  const [activeTenants, setActiveTenants] = useState([]);
  const [pendingTenants, setPendingTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'active', 'transfer'

  // Estados para traspaso de cartera
  const [fromTenantId, setFromTenantId] = useState('');
  const [toTenantId, setToTenantId] = useState('');
  const [suspendOld, setSuspendOld] = useState(false);
  const [transfering, setTransfering] = useState(false);

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const resActive = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/tenants/public-list`);
      if (resActive.data.success) {
        setActiveTenants(resActive.data.tenants);
      }

      const resPending = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/tenants/pending-memberships`);
      if (resPending.data.success) {
        setPendingTenants(resPending.data.pending_tenants);
      }
    } catch (error) {
      console.error('Error al cargar datos de autónomos:', error);
      setMessage('Error al cargar la información. Verifica tus permisos de Root.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('¿Estás seguro de autorizar esta membresía de Autónomo? Se le asignará un código AUT_XX y permisos de dueño.')) {
      return;
    }
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/tenants/${id}/approve`);
      if (res.data.success) {
        alert(res.data.message);
        fetchData();
      }
    } catch (error) {
      console.error('Error al aprobar:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!fromTenantId) {
      alert('Por favor selecciona la empresa de origen.');
      return;
    }
    if (fromTenantId === toTenantId) {
      alert('La empresa de origen y destino no pueden ser la misma.');
      return;
    }
    if (!window.confirm('🚨 ¿Estás seguro de traspasar toda la cartera de clientes, técnicos y propiedades al nuevo destino? Esta acción afectará los accesos y filtros.')) {
      return;
    }

    setTransfering(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/tenants/transfer-portfolio`, {
        from_tenant_id: parseInt(fromTenantId),
        to_tenant_id: toTenantId ? parseInt(toTenantId) : null,
        suspend_old_tenant: suspendOld
      });

      if (res.data.success) {
        alert('✅ ¡Traspaso realizado con éxito! ' + res.data.message);
        setFromTenantId('');
        setToTenantId('');
        setSuspendOld(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error en traspaso:', error);
      alert('Error en el traspaso: ' + (error.response?.data?.error || error.message));
    } finally {
      setTransfering(false);
    }
  };

  return (
    <div className="main-container" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      <Header rolTexto="ROOT / GESTIÓN DE AUTÓNOMOS" />

      <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <button
            onClick={() => navigate('/VistaRoot')}
            style={{ padding: '10px 18px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ← Volver al Panel Root
          </button>
          <button
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#FF6600', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <RefreshCw size={18} /> Actualizar
          </button>
        </div>

        {message && (
          <div style={{ padding: '15px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} /> {message}
          </div>
        )}

        {/* Pestañas de Navegación */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'pending' ? '#FF6600' : '#fff',
              color: activeTab === 'pending' ? '#fff' : '#555',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
          >
            ⏳ Solicitudes Pendientes ({pendingTenants.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'active' ? '#FF6600' : '#fff',
              color: activeTab === 'active' ? '#fff' : '#555',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
          >
            🏢 Autónomos Activos ({activeTenants.length})
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'transfer' ? '#FF6600' : '#fff',
              color: activeTab === 'transfer' ? '#fff' : '#555',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
          >
            🔄 Traspaso de Cartera
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#666' }}>
            Cargando información empresarial...
          </div>
        ) : (
          <>
            {/* PESTAÑA 1: SOLICITUDES PENDIENTES */}
            {activeTab === 'pending' && (
              <div>
                <h3 style={{ fontSize: '1.4rem', color: '#333', marginBottom: '20px' }}>
                  Solicitudes de Membresía por Autorizar
                </h3>
                {pendingTenants.length === 0 ? (
                  <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#888', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    ✅ No hay solicitudes de membresía pendientes en este momento.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {pendingTenants.map((t) => (
                      <div key={t.id} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', borderLeft: '5px solid #FF9800', overflow: 'hidden', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', gap: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.3rem', color: '#333', overflowWrap: 'anywhere' }}>{t.name}</h4>
                          <span style={{ backgroundColor: '#FFF3E0', color: '#E65100', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 }}>
                            Pendiente
                          </span>
                        </div>
                        <p style={{ margin: '8px 0', color: '#555', display: 'flex', alignItems: 'flex-start', gap: '8px', overflowWrap: 'anywhere' }}>
                          <Phone size={16} color="#FF6600" style={{ flexShrink: 0, marginTop: '3px' }} /> <span><strong>Teléfono:</strong> {t.phone || 'N/A'}</span>
                        </p>
                        <p style={{ margin: '8px 0', color: '#555', display: 'flex', alignItems: 'flex-start', gap: '8px', overflowWrap: 'anywhere' }}>
                          <Mail size={16} color="#FF6600" style={{ flexShrink: 0, marginTop: '3px' }} /> <span style={{ wordBreak: 'break-all' }}><strong>Correo:</strong> {t.email || 'N/A'}</span>
                        </p>
                        <p style={{ margin: '8px 0', color: '#555', overflowWrap: 'anywhere' }}>
                          <strong>Dueño ID:</strong> #{t.owner_user_id || 'N/A'} {t.owner ? `(${t.owner.first_name} ${t.owner.last_name})` : ''}
                        </p>
                        <p style={{ margin: '8px 0', color: '#888', fontSize: '0.85rem' }}>
                          <strong>Solicitado:</strong> {new Date(t.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <button
                          onClick={() => handleApprove(t.id)}
                          style={{
                            width: '100%',
                            marginTop: '15px',
                            padding: '12px',
                            backgroundColor: '#4CAF50',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '1rem',
                            boxShadow: '0 4px 10px rgba(76,175,80,0.3)'
                          }}
                        >
                          <CheckCircle size={20} /> Autorizar y Asignar AUT_XX
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 2: AUTÓNOMOS ACTIVOS */}
            {activeTab === 'active' && (
              <div>
                <h3 style={{ fontSize: '1.4rem', color: '#333', marginBottom: '20px' }}>
                  Empresas Autónomas Activas en el Sistema
                </h3>
                {activeTenants.length === 0 ? (
                  <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#888', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    No hay empresas activas registradas aún.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {activeTenants.map((t) => (
                      <div key={t.id} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', borderLeft: '5px solid #4CAF50', overflow: 'hidden', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', gap: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.3rem', color: '#333', overflowWrap: 'anywhere' }}>{t.name}</h4>
                          <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', flexShrink: 0 }}>
                            {t.code}
                          </span>
                        </div>
                        <p style={{ margin: '8px 0', color: '#555', display: 'flex', alignItems: 'flex-start', gap: '8px', overflowWrap: 'anywhere' }}>
                          <Phone size={16} color="#FF6600" style={{ flexShrink: 0, marginTop: '3px' }} /> <span><strong>Teléfono:</strong> {t.phone || 'N/A'}</span>
                        </p>
                        <p style={{ margin: '8px 0', color: '#555', display: 'flex', alignItems: 'flex-start', gap: '8px', overflowWrap: 'anywhere' }}>
                          <Mail size={16} color="#FF6600" style={{ flexShrink: 0, marginTop: '3px' }} /> <span style={{ wordBreak: 'break-all' }}><strong>Correo:</strong> {t.email || 'N/A'}</span>
                        </p>
                        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#F9F9F9', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: '#555', fontSize: '0.85rem' }}>
                          <ShieldCheck size={18} color="#4CAF50" style={{ flexShrink: 0 }} />
                          <span>Aislamiento de datos activo vía Global Scopes.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 3: TRASPASO DE CARTERA */}
            {activeTab === 'transfer' && (
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '35px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: '750px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
                  <ArrowRightLeft size={30} color="#FF6600" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>Traspaso de Cartera y Clientes</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Transfiere todos los clientes, técnicos, propiedades y cotizaciones de un Autónomo a otro o al Root.</p>
                  </div>
                </div>

                <form onSubmit={handleTransfer}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      🏢 1. Selecciona el Autónomo de ORIGEN (El que cederá su cartera):
                    </label>
                    <select
                      value={fromTenantId}
                      onChange={(e) => setFromTenantId(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', backgroundColor: '#fff' }}
                      required
                    >
                      <option value="">-- Selecciona la empresa de origen --</option>
                      {activeTenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code}) - ID: {t.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      🎯 2. Selecciona el DESTINO (A quién pasarán todos los registros):
                    </label>
                    <select
                      value={toTenantId}
                      onChange={(e) => setToTenantId(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', backgroundColor: '#fff' }}
                    >
                      <option value="">🏠 Root / Sistema General (Sin Tenant ID)</option>
                      {activeTenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code}) - ID: {t.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FFF3E0', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #FF9800' }}>
                    <input
                      type="checkbox"
                      id="suspendOld"
                      checked={suspendOld}
                      onChange={(e) => setSuspendOld(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="suspendOld" style={{ cursor: 'pointer', color: '#E65100', fontWeight: 'bold', fontSize: '0.95rem' }}>
                      Suspender automáticamente la empresa de origen después de transferir la cartera.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={transfering}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: transfering ? '#ccc' : '#FF6600',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: transfering ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(255,102,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                  >
                    <ArrowRightLeft size={22} />
                    {transfering ? 'Realizando traspaso en base de datos...' : 'PROCESAR TRASPASO DE CARTERA NOW'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VistaGestionAutonomos;
