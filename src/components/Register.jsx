import React, { useState, useRef } from 'react';
import { User, Lock, Mail, Phone, Eye, EyeOff, Shield, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RegisterModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const { user } = useAuth();
  const isRoot = user?.role_id === 0;

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
  const [showForm, setShowForm] = useState(true); // show by default for existing behavior
  const gridRef = useRef(null);
  const cardRefs = useRef({});

  const centerCard = (cardEl) => {
    if (!cardEl || !gridRef.current) return;
    const container = gridRef.current;
    const card = cardEl;
    const offset = Math.max(0, card.offsetLeft - (container.clientWidth - card.clientWidth) / 2);
    container.scrollTo({ left: offset, behavior: 'smooth' });
  };
  const [flippedRole, setFlippedRole] = useState(null);

  const plans = [
    {
      id: 3,
      title: 'SOY CLIENTE',
      subtitle: 'Contrata servicios',
      price: 'GRATIS',
      features: [
        'Solicita servicios de mantenimiento',
        'Sigue el estado de tus órdenes',
        'Recibe y aprueba cotizaciones',
        'Historial por propiedad',
      ],
      cta: 'Registrarme',
      color: '#F26522'
    },
    {
      id: 2,
      title: 'SOY TÉCNICO',
      subtitle: 'Presto servicios',
      price: 'Perfil',
      features: ['Recibe órdenes', 'Administra tu agenda', 'Calificaciones y perfil'],
      cta: 'Suscribirme',
      color: '#6B7280'
    },
    {
      id: 5,
      title: 'PROPIETARIO PERSONAL',
      subtitle: '3 Propiedades',
      price: '$299/m',
      features: ['Añade propiedades', 'Historial completo', 'Administración simple'],
      cta: 'Suscribirme',
      color: '#1F6FEB'
    },
    {
      id: 4,
      title: 'AUTÓNOMO EMPRESA',
      subtitle: '30 Clientes',
      price: '$935/m',
      features: ['Gestiona clientes', 'Reportes', 'Panel empresarial'],
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
        .modal-overlay .register-form.hidden { opacity: 0; max-height: 0; overflow: hidden; transform: translateY(10px); transition: all 0.35s ease; }
        .modal-overlay .register-form.visible { opacity: 1; max-height: 2000px; transform: translateY(0); transition: all 0.45s cubic-bezier(.2,.9,.2,1); }

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
                  <div className="card-front" style={{ backfaceVisibility: 'hidden' }} onClick={() => { setFormData({ ...formData, role_id: p.id }); setSelectedRole(p.id); setShowForm(true); centerCard(cardRefs.current[p.id]); }}>
                    <div className="plan-head">
                      <div className="plan-title">{p.title}</div>
                      <div className="plan-sub">{p.subtitle}</div>
                    </div>
                    <div className="plan-price">{p.price}</div>
                    <ul className="plan-features">
                      {p.features.map((f, i) => (<li key={i}>{f}</li>))}
                    </ul>
                    <div style={{ width: '100%' }}>
                      <button type="button" className="plan-cta" onClick={(ev) => { ev.stopPropagation(); setFormData({ ...formData, role_id: p.id }); setSelectedRole(p.id); setShowForm(false); centerCard(cardRefs.current[p.id]); setFlippedRole(p.id); }}>{p.cta}</button>
                    </div>
                  </div>

                  <div className="card-back" style={{ position: 'absolute', top:0, left:0, width:'100%', height:'100%', padding:'12px', boxSizing:'border-box', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                    <div style={{ color: '#ffd9b8', fontWeight: 900, marginBottom: 6 }}>{p.title} — ¿Qué incluye?</div>
                    <ul style={{ color: '#dcdcdc', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 8 }}>
                      {p.features.map((f,i)=>(<li key={i}>• {f}</li>))}
                    </ul>
                    <form onSubmit={handleRegistro} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <input name="first_name" required placeholder="NOMBRE(S)" value={formData.first_name} onChange={handleChange} style={{ padding:'8px 10px', borderRadius:20 }} />
                      <input name="last_name" required placeholder="APELLIDOS" value={formData.last_name} onChange={handleChange} style={{ padding:'8px 10px', borderRadius:20 }} />
                      <input name="email" required type="email" placeholder="CORREO" value={formData.email} onChange={handleChange} style={{ padding:'8px 10px', borderRadius:20 }} />
                      <input name="password" required type="password" placeholder="CONTRASEÑA" value={formData.password} onChange={handleChange} style={{ padding:'8px 10px', borderRadius:20 }} />
                      <div style={{ display:'flex', gap:8 }}>
                        <button type="submit" className="plan-cta" style={{ flex:1 }}>{isLoading ? '...' : 'Registrar'}</button>
                        <button type="button" onClick={() => { setFlippedRole(null); setShowForm(true); }} style={{ padding:'8px 10px', borderRadius:20, background:'#333', color:'#fff' }}>Cancelar</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleRegistro} className={`register-form ${showForm ? 'visible' : 'hidden'}`}>
          <h2 className="form-title">REGISTRAR USUARIO</h2>

          <div className="form-row-responsive">
            <div className="input-group">
              <User size={20} className="input-icon" />
              <input 
                type="text" name="first_name" placeholder="NOMBRE(S)" 
                className="custom-input"
                value={formData.first_name} onChange={handleChange} required
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bitwarden-ignore="true"
              />
            </div>
            <div className="input-group">
              <input 
                type="text" name="last_name" placeholder="APELLIDOS" 
                className="custom-input no-icon-input"
                value={formData.last_name} onChange={handleChange} required
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bitwarden-ignore="true"
              />
            </div>
          </div>

          <div className="form-row-responsive">
            <div className="input-group">
              <Mail size={20} className="input-icon" />
              <input 
                type="email" name="email" placeholder="CORREO ELECTRÓNICO" 
                className="custom-input"
                value={formData.email} onChange={handleChange} required
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bitwarden-ignore="true"
              />
            </div>
            <div className="input-group">
              <Phone size={20} className="input-icon" />
              <input 
                type="tel" name="phone_number" placeholder="TELÉFONO" 
                className="custom-input"
                value={formData.phone_number} onChange={handleChange} required
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bitwarden-ignore="true"
              />
            </div>
          </div>

          <div className="form-row-responsive">
            <div className="input-group">
              <Lock size={20} className="input-icon" />
              <input 
                type={showPassword ? "text" : "password"} name="password" placeholder="CONTRASEÑA (Min. 6)" 
                className="custom-input"
                value={formData.password} onChange={handleChange} required minLength="6"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bitwarden-ignore="true"
              />
              <button type="button" className="toggle-password-btn" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="input-group">
              <Lock size={20} className="input-icon" />
              <input 
                type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="CONFIRMAR CONTRASEÑA" 
                className="custom-input"
                value={formData.confirmPassword} onChange={handleChange} required minLength="6"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bitwarden-ignore="true"
              />
              <button type="button" className="toggle-password-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: "20px", display: 'none' }}>
            <Shield size={20} className="input-icon" />
            <select 
              name="role_id" className="custom-select"
              value={formData.role_id} onChange={handleChange} required
              data-lpignore="true"
              data-1p-ignore="true"
              data-bitwarden-ignore="true"
            >
              {isRoot && <option value={0}>ROOT (Nivel 0)</option>}
              <option value={1}>ADMINISTRADOR (Nivel 1)</option>
              <option value={2}>TÉCNICO / VENDEDOR (Nivel 2)</option>
              <option value={3}>CLIENTE (Nivel 3)</option>
              <option value={4}>AUTÓNOMO EMPRESARIAL ($935/m | 6 meses gratis - Nivel 4)</option>
              <option value={5}>AUTÓNOMO PERSONAL ($299/m | 6 meses gratis - Nivel 5)</option>
            </select>
          </div>

          {(parseInt(formData.role_id) === 4 || parseInt(formData.role_id) === 5) && (
            <div style={{ background: '#fff7ed', border: '1px solid #fdba74', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#c2410c', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🏢 Datos para Autónomo ({parseInt(formData.role_id) === 5 ? 'Personal ($299/m tras 6 meses gratis)' : 'Empresarial ($935/m tras 6 meses gratis)'})
              </div>
              {parseInt(formData.role_id) === 4 && (
                <div className="input-group" style={{ marginBottom: "12px" }}>
                  <input 
                    type="text" 
                    name="company_name" 
                    placeholder="NOMBRE DE LA EMPRESA / NEGOCIO" 
                    className="custom-input"
                    style={{ paddingLeft: '15px' }}
                    value={formData.company_name || ''} 
                    onChange={handleChange} 
                    required
                  />
                </div>
              )}
              {parseInt(formData.role_id) === 5 && (
                <div style={{ fontSize: '0.78rem', color: '#854d0e', fontStyle: 'italic', marginBottom: '12px' }}>
                  ℹ️ El Propietario Personal no requiere nombre de empresa aquí; gestionará y nombrará sus propiedades directamente en su panel al iniciar sesión.
                </div>
              )}
              <div className="input-group" style={{ margin: 0 }}>
                <input 
                  type="text" 
                  name="company_code" 
                  placeholder={parseInt(formData.role_id) === 5 ? "CÓDIGO PERSONALIZADO (ej. AUT_P_101)" : "CÓDIGO PERSONALIZADO (ej. AUT_E_101)"} 
                  className="custom-input"
                  style={{ paddingLeft: '15px' }}
                  value={formData.company_code || ''} 
                  onChange={handleChange} 
                  required
                />
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9a3412', marginTop: '8px', fontWeight: 'bold' }}>
                * El código de empresa se autogenera si se deja vacío, o puedes personalizarlo.
              </div>
            </div>
          )}

          <button type="submit" className="btn-registrar" disabled={isLoading}>
            {isLoading ? "REGISTRANDO..." : "REGISTRAR"}
          </button>

          {mensaje && (
            <p className={`msg-box ${tipoMensaje}`}>
              {mensaje}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;