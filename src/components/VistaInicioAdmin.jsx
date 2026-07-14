import React, { useEffect, useState } from 'react';
import '../styles/VistaInicioAdmin.css';
import { useNavigate } from 'react-router-dom';
import Header from './Shared/Header'; 
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const VistaInicioAdmin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subInfo, setSubInfo] = useState(null);

  const isRoot     = user?.role_id === 0;
  const isEmpresa  = user?.role_id === 4;
  const isPersonal = user?.role_id === 5;
  const isAutonomo = isEmpresa || isPersonal;

  useEffect(() => {
    if (isAutonomo || user?.role_id === 2) {
      axios.get(`${import.meta.env.VITE_API_BASE_URL}/tenant/subscription-status`)
        .then(r => { if (r.data.success) setSubInfo(r.data); })
        .catch(() => {});
    }
  }, [isAutonomo, user?.role_id]);

  let rolTexto = "ADMINISTRADOR";
  if (isRoot) rolTexto = "ROOT / SUPERADMIN";
  else if (isEmpresa) rolTexto = "EMPRESA / AUTÓNOMO EMPRESARIAL";
  else if (isPersonal) rolTexto = "PROPIETARIO / AUTÓNOMO PERSONAL";
  else if (user?.role_id === 2) rolTexto = "TÉCNICO / PROVEEDOR";

  const menuItems = [
    { id: 1, title: isPersonal ? 'TÉCNICOS Y PROVEEDORES' : 'USUARIOS', icon: '👤', path: '/usuarios'}, 
    { id: 2, title: 'PROPIEDADES', icon: '🏠',  path: '/propiedades' },
    { id: 3, title: 'LEVANTAMIENTOS', icon: '📋', path: '/levantamientos' },
    { id: 4, title: 'REPORTES', icon: '📸', path: '/reportes-globales' },
    { id: 5, title: 'COTIZACIONES', icon: '🧾' , path: '/vista-cotizaciones'},
    { id: 6, title: 'SERVICIOS', icon: '🔧', path: '/tablero-servicios' },
    { id: 7, title: 'BODEGA', icon: '🏭', path: '/bodeguero' },
    { id: 8, title: 'PRODUCTOS', icon: '📦', path: '/vista-producto' },
    { id: 9, title: 'DASHBOARD', icon: '📊',  path: '/dashboard'},
    { id: 10, title: 'PERSONALIZAR', icon: '🎨', path: '/customize-login' },
  ];

  if (isRoot) {
    menuItems.unshift({
      id: 11,
      title: 'AUTÓNOMOS Y CARTERA',
      icon: '🏢',
      path: '/gestion-autonomos'
    });
  }

  if (isRoot || isAutonomo || user?.role_id === 1) {
    menuItems.push({
      id: 12,
      title: 'SALA DE ESPERA',
      icon: '⏳',
      path: '/sala-espera-tecnicos'
    });
  }

  if (isAutonomo) {
    const codeDisplay = subInfo?.tenant?.code || (isPersonal ? 'AUT_P' : 'AUT_E');
    menuItems.push({
      id: 13,
      title: `MI CÓDIGO (${codeDisplay})`,
      icon: '📲',
      path: '/mi-codigo-autonomo'
    });
    menuItems.push({
      id: 14,
      title: '¿NECESITAS AYUDA?',
      icon: '🤝',
      path: '/apoyo-autonomo'
    });
  }

  return (
    <div className="main-container">
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      <Header rolTexto={rolTexto} />

      {(isAutonomo || user?.role_id === 2) && subInfo && (
        <div style={{
          maxWidth: '1150px', margin: '20px auto 10px auto', padding: '18px 24px',
          background: 'rgba(242,101,34,0.09)', border: '2px solid rgba(242,101,34,0.45)',
          borderRadius: '18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
        }}>
          <div>
            <span style={{ color: '#f26522', fontWeight: 900, fontStyle: 'italic', fontSize: '1rem', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
              {user?.role_id === 2
                ? '🛠️ TÉCNICO EXTERNO | 1 AÑO DE PRUEBA GRATIS ($99 MXN/mes tras prueba)'
                : subInfo?.tenant?.membership_type === 'autonomo_fundador'
                  ? '🌟 PLAN FUNDADOR | 6 MESES GRATIS ($659 MXN/mes tras prueba)'
                  : isPersonal
                    ? '👑 PLAN PERSONAL | 6 MESES GRATIS ($299 MXN/mes tras prueba)'
                    : '🏢 PLAN EMPRESARIAL | 6 MESES GRATIS ($935 MXN/mes tras prueba)'}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#ddd', fontSize: '0.88rem', alignItems: 'center' }}>
              <span>
                📅 Vence: <strong style={{ color: '#fff' }}>{subInfo.subscription_expires_at ? new Date(subInfo.subscription_expires_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Indefinido'}</strong>
              </span>
              {isAutonomo && (
                <span style={{ background: 'rgba(255,255,255,0.07)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)' }}>
                  🏠 Propiedades: <strong style={{ color: (subInfo.properties_count >= (subInfo.max_properties + subInfo.extra_properties_count)) ? '#ff6b6b' : '#69db7c' }}>
                    {subInfo.properties_count ?? 0} / {(subInfo.max_properties ?? 3) + (subInfo.extra_properties_count ?? 0)}
                  </strong>
                </span>
              )}
              {isEmpresa && (
                <span style={{ background: 'rgba(255,255,255,0.07)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)' }}>
                  👥 Clientes: <strong style={{ color: (subInfo.clients_count >= (subInfo.max_clients ?? 30)) ? '#ff6b6b' : '#69db7c' }}>
                    {subInfo.clients_count ?? 0} / {subInfo.max_clients ?? 30}
                  </strong>
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: (subInfo.days_remaining <= 30) ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.18)', border: `1px solid ${(subInfo.days_remaining <= 30) ? '#ef4444' : '#22c55e'}`, color: (subInfo.days_remaining <= 30) ? '#ef4444' : '#22c55e', padding: '6px 16px', borderRadius: '50px', fontWeight: 'bold', fontSize: '0.85rem' }}>
              ⏳ {subInfo.days_remaining ?? 180} días restantes
            </div>

            {isPersonal && (
              <button onClick={() => navigate(`/activacion-cuenta?tenant_id=${subInfo.tenant?.id}&type=extra_property`)}
                title="Adquiere cupo para +1 propiedad por $79.99 MXN"
                style={{ padding: '8px 16px', borderRadius: '50px', border: '1px solid #69db7c', background: 'rgba(105,219,124,0.15)', color: '#69db7c', fontWeight: 900, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.2s' }}>
                ➕ COMPRAR PROPIEDAD EXTRA ($79.99)
              </button>
            )}

            {(subInfo.days_remaining <= 45 || user?.role_id === 2) && (
              <button onClick={() => navigate(`/activacion-cuenta?${user?.role_id === 2 ? `user_id=${user.id}&type=technician` : `tenant_id=${subInfo.tenant?.id}`}`)}
                style={{ padding: '8px 18px', borderRadius: '50px', border: 'none', background: '#f26522', color: '#fff', fontWeight: 900, cursor: 'pointer', fontSize: '0.82rem', boxShadow: '0 4px 12px rgba(242,101,34,0.4)' }}>
                🔄 RENOVAR / ACTIVAR
              </button>
            )}
          </div>
        </div>
      )}

      <div className="admin-grid">
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            className="menu-card"
            onClick={() => {
              if (item.path) {
                navigate(item.path);
              }
            }}
          >
            <div className="card-inner">
              <span className="card-icon-large">{item.icon}</span>
              <span className="card-title">{item.title}</span>
            </div>
          </div>
        ))}
      </div>

      <footer className="footer-watermark">
        <img src="/logo-faded.png" alt="Watermark" className="watermark-img" />
      </footer>
    </div>
  );
};

export default VistaInicioAdmin;