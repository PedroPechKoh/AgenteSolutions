import React, { useState, useRef } from 'react';
import { User, Lock, Mail, Phone, Eye, EyeOff, Shield, X, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const isRoot = user?.role_id === 0;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    role_id: 1,
    company_name: '',
    company_code: ''
  });
  
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const gridRef = useRef(null);
  const cardRefs = useRef({});

  const centerCard = (cardEl) => {
    if (!cardEl || !gridRef.current) return;
    const container = gridRef.current;
    const card = cardEl;
    const offset = Math.max(0, card.offsetLeft - (container.clientWidth - card.clientWidth) / 2);
    container.scrollTo({ left: offset, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (onClose) onClose();
    navigate('/');
  };

  const [flippedRole, setFlippedRole] = useState(null);

  const plans = [
    {
      id: 3,
      title: 'CLIENTE',
      subtitle: 'Contrata servicios',
      price: 'GRATIS',
      features: [
        'Solicita servicios de mantenimiento',
        'Sigue el estado de tus órdenes',
        'Recibe y aprueba cotizaciones',
        'Historial por propiedad',
      ],
      details: [
        'Solicita técnicos certificados',
        'Aprueba cotizaciones en la app',
        'Sigue tu orden en tiempo real',
        'Historial por propiedad',
        'Registro 100% gratuito',
      ],
      note: 'Registro gratis para clientes con seguimiento en vivo y historial por propiedad.',
      cta: 'Registrarme',
      color: '#F26522'
    },
    {
      id: 2,
      title: 'TÉCNICO',
      subtitle: 'Presto servicios',
      price: 'Perfil',
      features: ['Recibe órdenes', 'Administra tu agenda', 'Calificaciones y perfil'],
      details: [
        '12 meses gratis de prueba',
        'red de 1000clientes de agentes solutions',
        'Gestiona órdenes y agenda',
        'genera tus propias cotizaciones',
        'genera tu propio perfil de especialidad'
      ],
      note: '12 meses gratis y perfil profesional para captar clientes y gestionar órdenes.',
      cta: 'Suscribirme',
      color: '#6B7280'
    },
    {
      id: 5,
      title: 'AUTÓNOMO',
      subtitle: '3 Propiedades',
      price: '$299/m',
      features: ['Añade propiedades', 'Historial completo', 'Administración simple'],
      details: [
        '6 meses gratis de prueba',
        'Registra hasta 3 propiedades',
        'ingresa a tus tecnicos a tu sistema',
        'Dashboard de administración',
        'Pago $299 MXN/mes después'
      ],
      note: '6 meses gratis para propietarios personales con control de hasta 3 propiedades.',
      cta: 'Suscribirme',
      color: '#1F6FEB'
    },
    {
      id: 4,
      title: 'AUTÓNOMO EMPRESARIAL',
      subtitle: '30 Clientes',
      price: '$935/m',
      features: ['Gestiona clientes', 'Reportes', 'Panel empresarial'],
      details: [
        '6 meses gratis de prueba',
        'Administra hasta 30 clientes',
        'Usuarios y técnicos sin límite',
        'Reportes y cotizaciones en línea',
        'Pago $935 MXN/mes después'
      ],
      note: '6 meses gratis para empresas con clientes ilimitados y reportes inteligentes.',
      cta: 'Suscribirme',
      color: '#0F766E'
    }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = {
      ...formData,
      [name]: name === 'role_id' ? parseInt(value) : value
    };

    if (name === 'role_id' && parseInt(value) === 4 && !formData.company_code) {
      const randomCode = 'AUT_' + Math.floor(100 + Math.random() * 900);
      newFormData.company_code = randomCode;
    }

    setFormData(newFormData);
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setMensaje('');
    setTipoMensaje('');

    if (formData.password !== formData.confirmPassword) {
      setMensaje('Error: Las contraseñas no coinciden.');
      setTipoMensaje('error');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/registro-usuario`, {
        ...formData,
        from_admin: true
      }, { headers });
      
      setMensaje(`¡Éxito! Usuario ${res.data.user.first_name} registrado.`);
      setTipoMensaje('success');
      
      setTimeout(() => {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          password: '',
          confirmPassword: '',
          role_id: 1,
          company_name: '',
          company_code: ''
        });
        setIsLoading(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
      
    } catch (error) {
      setIsLoading(false);
      setTipoMensaje('error');
      if (error.response && error.response.data.errors) {
        setMensaje('Error: Datos inválidos o el correo ya existe.');
      } else {
        setMensaje('Error al conectar con el servidor.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-overlay .modal-content {
          background: #000;
          padding: 45px 30px 30px 30px;
          border-radius: 15px;
          width: 90%;
          max-width: 650px;
          position: relative;
          box-shadow: 0 0 20px rgba(242, 101, 34, 0.5);
          font-family: "Arial Black", sans-serif;
          box-sizing: border-box;
        }

        .modal-overlay .close-button {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          transition: 0.3s;
        }
        .modal-overlay .close-button:hover {
          color: #F26522;
          transform: scale(1.1);
        }

        .modal-overlay .back-button {
          position: absolute;
          top: 18px;
          left: 18px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.25);
          color: white;
          cursor: pointer;
          font-family: "Arial Black", sans-serif;
          font-size: 0.95rem;
          letter-spacing: 1px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 999px;
          transition: 0.3s;
          z-index: 1100;
          backdrop-filter: blur(6px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }
        .modal-overlay .back-button:hover {
          color: #F26522;
          transform: translateX(-2px) scale(1.03);
          background: rgba(242,101,34,0.18);
          border-color: rgba(242,101,34,0.4);
        }

        .modal-overlay .form-title {
          color: white;
          font-style: italic;
          font-size: 1.8rem;
          letter-spacing: 2px;
          margin-bottom: 25px;
          text-align: center;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          padding: 0 40px;
        }

        .modal-overlay .form-row-responsive {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }

        .modal-overlay .input-group {
          position: relative;
          flex: 1;
        }

        .modal-overlay .input-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #555;
          z-index: 2;
          pointer-events: none;
        }

        .modal-overlay .custom-input, 
        .modal-overlay .custom-select {
          width: 100%;
          padding: 12px 45px 12px 55px;
          border-radius: 50px;
          border: 3px solid transparent;
          background-color: #cfd3d8;
          font-weight: 900;
          font-style: italic;
          font-size: 0.95rem;
          outline: none;
          transition: 0.3s;
          color: #000;
          box-sizing: border-box;
        }

        .modal-overlay .custom-input::placeholder {
          color: #555;
          opacity: 1;
        }
        
        .modal-overlay .no-icon-input {
          padding-left: 20px;
        }

        .modal-overlay .custom-select {
          cursor: pointer;
          appearance: none; 
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23555555' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
          background-repeat: no-repeat;
          background-position: right 15px center;
          background-size: 18px;
        }

        .modal-overlay .custom-input:focus, 
        .modal-overlay .custom-select:focus {
          border-color: #F26522;
          background-color: white;
          box-shadow: 0 0 15px rgba(242, 101, 34, 0.6);
        }

        .modal-overlay .custom-select:focus {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23F26522' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
        }

        /* Subscription / plan cards styles */
        .modal-overlay .plan-grid {
          display: flex;
          gap: 14px;
          margin: 0 auto 18px;
          justify-content: space-between;
          flex-wrap: nowrap;
          transition: all 0.45s cubic-bezier(.2,.9,.2,1);
          overflow-x: auto;
          padding-bottom: 6px;
        }
        .modal-overlay .plan-grid.focused {
          justify-content: center;
        }
        .modal-overlay .plan-card {
          flex: 0 0 180px;
          width: 180px;
          height: 260px;
          background: linear-gradient(180deg,#0f0f0f,#131313);
          border-radius: 12px;
          padding: 18px;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.04);
          box-shadow: 0 6px 12px rgba(0,0,0,0.5);
          cursor: pointer;
          transition: transform 0.45s cubic-bezier(.2,.9,.2,1), opacity 0.35s ease, box-shadow 0.35s;
          transform-origin: center;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          perspective: 1200px;
          position: relative;
        }
        .modal-overlay .plan-card:not(.active) {
          transform: scale(0.96) translateY(4px);
          opacity: 0.9;
        }
        .modal-overlay .plan-card.active {
          transform: translateY(-18px) scale(1.06);
          z-index: 30;
          box-shadow: 0 18px 40px rgba(0,0,0,0.6), 0 6px 18px rgba(0,0,0,0.12);
        }
        .modal-overlay .plan-head .plan-title { font-weight: 900; font-size: 0.98rem; color: #fff; }
        .modal-overlay .plan-sub { font-size: 0.74rem; color: #cfcfcf; margin-top: 4px; }
        .modal-overlay .plan-price { margin-top: 6px; font-weight: 900; color: #fff; padding: 8px 12px; border-radius: 8px; display: inline-block; background: rgba(255,255,255,0.02); font-size: 0.95rem; }
        .modal-overlay .plan-features { margin-top: 10px; padding-left: 14px; font-size: 0.78rem; color: #bfcfc0; max-height: 84px; overflow: hidden; }
        .modal-overlay .plan-features li { margin-bottom: 6px; }
        .modal-overlay .plan-cta { margin-top: 8px; width: 100%; padding: 10px 12px; border-radius: 28px; border: none; background: #F26522; color: #fff; font-weight: 800; cursor: pointer; }
        .modal-overlay .plan-grid.focused .plan-card:not(.active) { transform: scale(0.82) translateY(18px); opacity: 0.28; pointer-events: none; filter: blur(0.8px); }
        .modal-overlay .plan-card .card-inner{ transition: transform 0.6s cubic-bezier(.2,.9,.2,1); transform-style: preserve-3d; position: relative; }
        .modal-overlay .plan-card.flip .card-inner{ transform: rotateY(180deg); }
        .modal-overlay .card-front, .modal-overlay .card-back{ position: relative; width:100%; height:100%; }

        /* Form show/hide animation */
        .modal-overlay .toggle-password-btn {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #555;
          cursor: pointer;
          z-index: 2;
        }

        .modal-overlay .btn-registrar {
          width: 100%;
          padding: 15px;
          border-radius: 50px;
          border: none;
          background: #F26522;
          color: white;
          font-size: 1.2rem;
          font-weight: 900;
          font-style: italic;
          cursor: pointer;
          box-shadow: 0 5px 15px rgba(242,101,34,0.4);
          transition: transform 0.2s;
          margin-top: 10px;
        }
        
        .modal-overlay .btn-registrar:hover:not(:disabled) {
          transform: scale(1.05);
        }
        .modal-overlay .btn-registrar:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .modal-overlay .msg-box {
          text-align: center;
          width: 100%;
          font-weight: bold;
          padding: 8px;
          border-radius: 4px;
          margin-top: 15px;
        }
        .modal-overlay .success { color: #fff; background: rgba(34, 197, 94, 0.9); }
        .modal-overlay .error { color: #fff; background: rgba(255, 68, 68, 0.9); }

        @media (max-width: 600px) {
          .modal-overlay .modal-content {
            padding: 45px 18px 25px 18px;
          }
          .modal-overlay .form-title {
            font-size: 1.35rem;
            letter-spacing: 1px;
            margin-bottom: 20px;
            padding: 0 25px;
          }
          .modal-overlay .form-row-responsive {
            flex-direction: column;
            gap: 15px;
          }
          .modal-overlay .custom-input, 
          .modal-overlay .custom-select {
            padding: 10px 40px 10px 48px;
            font-size: 0.85rem;
          }
          .modal-overlay .no-icon-input {
            padding-left: 15px;
          }
          .modal-overlay .input-icon {
            left: 14px;
          }
          .modal-overlay .plan-grid { gap: 10px; }
          .modal-overlay .plan-card { width: 150px; height: 240px; flex: 0 0 150px; }
        }
      `}</style>

      <button type="button" className="back-button" onClick={handleGoBack} aria-label="Regresar al inicio de sesión">
        <ArrowLeft size={18} />
        <span>Iniciar sesión</span>
      </button>

      <div className="modal-content">
        <button className="close-button" onClick={onClose} type="button">
          <X size={28} />
        </button>

        {/* Subscription / Plan cards */}
        <div ref={gridRef} className={`plan-grid ${selectedRole ? 'focused' : ''}`}>
          {plans.map((p) => {
            const isActive = selectedRole === p.id;
            const isFlipped = flippedRole === p.id;
            return (
              <div
                key={p.id}
                ref={el => cardRefs.current[p.id] = el}
                className={`plan-card ${isActive ? 'active' : ''} ${isFlipped ? 'flip' : ''}`}
                style={{ borderTop: `4px solid ${p.color}`, boxShadow: selectedRole === p.id ? `0 18px 40px rgba(0,0,0,0.6), 0 6px 18px ${p.color}33` : undefined }}
              >
                <div className="card-inner" style={{ transition: 'transform 0.6s', transformStyle: 'preserve-3d', position: 'relative' }}>
                  <div className="card-front" style={{ backfaceVisibility: 'hidden' }} onClick={() => { setFormData({ ...formData, role_id: p.id }); setSelectedRole(p.id); centerCard(cardRefs.current[p.id]); }}>
                    <div className="plan-head">
                      <div className="plan-title">{p.title}</div>
                      <div className="plan-sub">{p.subtitle}</div>
                    </div>
                    <div className="plan-price">{p.price}</div>
                    <div style={{ fontSize: '0.82rem', color: '#d9d9d9', marginTop: '6px', minHeight: '44px' }}>{p.note}</div>
                    <ul className="plan-features">
                      {p.features.map((f, i) => (<li key={i}>{f}</li>))}
                    </ul>
                    <div style={{ width: '100%' }}>
                      <button type="button" className="plan-cta" onClick={(ev) => { ev.stopPropagation(); setFormData({ ...formData, role_id: p.id }); setSelectedRole(p.id); centerCard(cardRefs.current[p.id]); setFlippedRole(p.id); }}>{p.cta}</button>
                    </div>
                  </div>

                  <div className="card-back" style={{ position: 'absolute', top:0, left:0, width:'100%', height:'100%', padding:'12px', boxSizing:'border-box', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', overflowY: 'auto' }}>
                    <div style={{ color: '#ffd9b8', fontWeight: 900, marginBottom: 6 }}>{p.title} — ¿Qué incluye?</div>
                    <ul style={{ color: '#dcdcdc', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 8 }}>
                      {p.details.map((f,i)=>(<li key={i}>• {f}</li>))}
                    </ul>
                    <div style={{ color: '#d9d9d9', fontSize: '0.85rem', marginBottom: 12 }}>{p.note}</div>
                    <form onSubmit={handleRegistro} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <input name="first_name" required placeholder="NOMBRE(S)" value={formData.first_name} onChange={handleChange} style={{ padding:'10px 12px', borderRadius:20, border:'none', background:'#f3f3f3' }} />
                      <input name="last_name" required placeholder="APELLIDOS" value={formData.last_name} onChange={handleChange} style={{ padding:'10px 12px', borderRadius:20, border:'none', background:'#f3f3f3' }} />
                      <input name="email" required type="email" placeholder="CORREO" value={formData.email} onChange={handleChange} style={{ padding:'10px 12px', borderRadius:20, border:'none', background:'#f3f3f3' }} />
                      <input name="phone_number" required type="tel" placeholder="TELÉFONO" value={formData.phone_number} onChange={handleChange} style={{ padding:'10px 12px', borderRadius:20, border:'none', background:'#f3f3f3' }} />
                      <input name="password" required type="password" placeholder="CONTRASEÑA" value={formData.password} onChange={handleChange} style={{ padding:'10px 12px', borderRadius:20, border:'none', background:'#f3f3f3' }} />
                      <input name="confirmPassword" required type="password" placeholder="CONFIRMA CONTRASEÑA" value={formData.confirmPassword} onChange={handleChange} style={{ padding:'10px 12px', borderRadius:20, border:'none', background:'#f3f3f3' }} />
                      {(p.id === 3 || p.id === 2) && (
                        <input name="company_code" value={formData.company_code} onChange={handleChange} placeholder="Código de empresa (Opcional)" type="text" style={{ padding:'10px 12px', borderRadius:20, border:'none', background:'#f3f3f3' }} />
                      )}
                      {p.id === 4 && (
                        <input name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Nombre de tu empresa / negocio" type="text" style={{ padding:'10px 12px', borderRadius:20, border:'none', background:'#f3f3f3' }} />
                      )}
                      <div style={{ display:'flex', gap:8 }}>
                        <button type="submit" className="plan-cta" style={{ flex:1 }}>{isLoading ? '...' : 'Registrar'}</button>
                        <button type="button" onClick={() => { setFlippedRole(null); }} style={{ padding:'8px 10px', borderRadius:20, background:'#333', color:'#fff' }}>Cancelar</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;