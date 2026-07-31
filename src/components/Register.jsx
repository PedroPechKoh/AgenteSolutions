import React, { useState } from 'react';
import { User, Lock, Mail, Phone, Shield, X, ArrowLeft, Building, Key, Users, Globe } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterModal = ({ isOpen = true, onClose, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeCategoryTab, setActiveCategoryTab] = useState('agente'); // 'agente' | 'publico'

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    role_id: 2, // Por defecto Técnico
    company_name: '',
    company_code: ''
  });

  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ROLES PARA LA PESTAÑA 1: AGENTE SOLUTIONS (INTERNOS / DIRECTOS)
  const rolesAgente = [
    { id: 0, label: 'USUARIO ROOT', desc: 'Superadministrador matriz (Acceso Total)', icon: '👑', color: '#EF4444' },
    { id: 1, label: 'ADMINISTRADOR', desc: 'Administrador de Agente Solutions', icon: '🔴', color: '#F59E0B' },
    { id: 2, label: 'TÉCNICO AGENTE', desc: 'Técnico directo de Agente Solutions', icon: '🛠️', color: '#F26522' },
    { id: 3, label: 'CLIENTE AGENTE', desc: 'Cliente directo de Agente Solutions', icon: '👤', color: '#10B981' }
  ];

  // ROLES PARA LA PESTAÑA 2: AUTÓNOMOS Y PÚBLICO (EXTERNOS / MULTI-TENANT)
  const rolesPublicos = [
    { id: 5, label: 'AUTÓNOMO PERSONAL', desc: 'Gestiona hasta 3 propiedades', icon: '🏢', color: '#3B82F6' },
    { id: 4, label: 'AUTÓNOMO EMPRESARIAL', desc: 'Gestiona hasta 30 clientes', icon: '🏬', color: '#8B5CF6' },
    { id: 7, label: 'ADMIN. PROPIEDADES', desc: 'Vinculado a un equipo Autónomo', icon: '🔑', color: '#F59E0B' },
    { id: 2, label: 'TÉCNICO DE AUTÓNOMO', desc: 'Técnico asignado a un Autónomo', icon: '🧰', color: '#06B6D4' },
    { id: 3, label: 'CLIENTE DE AUTÓNOMO', desc: 'Cliente asignado a un Autónomo', icon: '👥', color: '#EC4899' }
  ];

  const rolesActuales = activeCategoryTab === 'agente' ? rolesAgente : rolesPublicos;

  const handleTabSwitch = (tab) => {
    setActiveCategoryTab(tab);
    setMensaje('');
    if (tab === 'agente') {
      setFormData(prev => ({ ...prev, role_id: 2, company_code: '', company_name: '' }));
    } else {
      setFormData(prev => ({
        ...prev,
        role_id: 5,
        company_code: prev.company_code || 'AUT_' + Math.floor(100 + Math.random() * 900)
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = {
      ...formData,
      [name]: name === 'role_id' ? parseInt(value) : value
    };

    if (name === 'role_id' && (parseInt(value) === 4 || parseInt(value) === 5) && !formData.company_code) {
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
      const token = localStorage.getItem('agente_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/registro-usuario`,
        {
          ...formData,
          from_admin: true,
          captcha_token: 'from_admin_bypass'
        },
        { headers }
      );

      setMensaje(`¡Usuario ${res.data.user?.first_name || ''} registrado con éxito!`);
      setTipoMensaje('success');

      setTimeout(() => {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          password: '',
          confirmPassword: '',
          role_id: activeCategoryTab === 'agente' ? 2 : 5,
          company_name: '',
          company_code: ''
        });
        setIsLoading(false);
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1500);

    } catch (error) {
      setIsLoading(false);
      setTipoMensaje('error');
      if (error.response && error.response.data && error.response.data.errors) {
        const errs = error.response.data.errors;
        const msg = Object.values(errs).flat().join(' ');
        setMensaje(msg || 'Error: Datos inválidos o correo/teléfono ya registrado.');
      } else {
        setMensaje('Error al conectar con el servidor.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="root-register-overlay">
      <style>{`
        .root-register-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 20px;
          box-sizing: border-box;
        }

        .root-register-card {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 24px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 32px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(242, 101, 34, 0.2);
          position: relative;
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .root-register-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 16px;
        }

        .root-register-title {
          font-size: 1.35rem;
          font-weight: 900;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 10px;
          letter-spacing: 0.5px;
        }

        .root-close-btn {
          background: #1e293b;
          border: 1px solid #334155;
          color: #94a3b8;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .root-close-btn:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          transform: rotate(90deg);
        }

        /* TAB NAVIGATION STYLES */
        .category-tabs-container {
          display: flex;
          background: #1e293b;
          border-radius: 16px;
          padding: 6px;
          margin-bottom: 24px;
          border: 1px solid #334155;
          gap: 8px;
        }

        .category-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .category-tab-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }

        .category-tab-btn.active {
          background: #F26522;
          color: white;
          box-shadow: 0 4px 14px rgba(242, 101, 34, 0.35);
        }

        .role-selector-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .role-option-btn {
          background: #1e293b;
          border: 2px solid #334155;
          border-radius: 14px;
          padding: 12px 14px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .role-option-btn:hover {
          border-color: #64748b;
          background: #334155;
        }

        .role-option-btn.selected {
          border-color: #F26522;
          background: rgba(242, 101, 34, 0.15);
          box-shadow: 0 0 15px rgba(242, 101, 34, 0.2);
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-input-box {
          position: relative;
        }

        .form-input-box input, 
        .form-input-box select {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border-radius: 12px;
          border: 1.5px solid #334155;
          background: #1e293b;
          color: white;
          font-size: 0.95rem;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-input-box input:focus, 
        .form-input-box select:focus {
          border-color: #F26522;
          box-shadow: 0 0 0 3px rgba(242, 101, 34, 0.2);
        }

        .form-input-box .input-icon-svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }

        .btn-submit-root {
          width: 100%;
          padding: 14px;
          border-radius: 50px;
          border: none;
          background: linear-gradient(135deg, #F26522 0%, #E05300 100%);
          color: white;
          font-size: 1.05rem;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(242, 101, 34, 0.35);
          transition: all 0.2s;
          margin-top: 10px;
        }

        .btn-submit-root:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(242, 101, 34, 0.5);
        }

        .btn-submit-root:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
          .role-selector-grid {
            grid-template-columns: 1fr;
          }
          .root-register-card {
            padding: 20px;
          }
          .category-tabs-container {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="root-register-card">
        <div className="root-register-header">
          <div className="root-register-title">
            <Shield size={24} color="#F26522" />
            <span>REGISTRO PRIVADO DE USUARIOS (ROOT)</span>
          </div>
          {onClose && (
            <button className="root-close-btn" onClick={onClose} type="button" title="Cerrar">
              <X size={20} />
            </button>
          )}
        </div>

        {/* 🔴 DOS PESTAÑAS PRINCIPALES DE REGISTRO */}
        <div className="category-tabs-container">
          <button
            type="button"
            className={`category-tab-btn ${activeCategoryTab === 'agente' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('agente')}
          >
            <Users size={18} />
            <span>1. EQUIPO AGENTE SOLUTIONS</span>
          </button>
          <button
            type="button"
            className={`category-tab-btn ${activeCategoryTab === 'publico' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('publico')}
          >
            <Globe size={18} />
            <span>2. AUTÓNOMOS Y PÚBLICO EXTERNO</span>
          </button>
        </div>

        <form onSubmit={handleRegistro}>
          <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '10px' }}>
            SELECCIONA EL ROL DE USUARIO ({activeCategoryTab === 'agente' ? 'EQUIPO INTERNO' : 'AUTÓNOMOS / EXTERNOS'}):
          </label>
          <div className="role-selector-grid">
            {rolesActuales.map(r => (
              <button
                key={r.id + '-' + r.label}
                type="button"
                className={`role-option-btn ${formData.role_id === r.id ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, role_id: r.id })}
              >
                <span style={{ fontSize: '1.5rem' }}>{r.icon}</span>
                <div>
                  <div style={{ fontWeight: '900', fontSize: '0.9rem', color: '#ffffff' }}>{r.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="form-grid-2">
            <div className="form-input-box">
              <User className="input-icon-svg" size={18} />
              <input
                name="first_name"
                required
                type="text"
                placeholder="NOMBRE(S)"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-input-box">
              <User className="input-icon-svg" size={18} />
              <input
                name="last_name"
                required
                type="text"
                placeholder="APELLIDOS"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-input-box">
              <Mail className="input-icon-svg" size={18} />
              <input
                name="email"
                required
                type="email"
                placeholder="CORREO ELECTRÓNICO"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-input-box">
              <Phone className="input-icon-svg" size={18} />
              <input
                name="phone_number"
                required
                type="tel"
                placeholder="TELÉFONO (10 DÍGITOS)"
                value={formData.phone_number}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-input-box">
              <Lock className="input-icon-svg" size={18} />
              <input
                name="password"
                required
                type="password"
                placeholder="CONTRASEÑA"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div className="form-input-box">
              <Lock className="input-icon-svg" size={18} />
              <input
                name="confirmPassword"
                required
                type="password"
                placeholder="CONFIRMA CONTRASEÑA"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* CAMPOS CONDICIONALES PARA LA PESTAÑA DE AUTÓNOMOS / EXTERNOS */}
          {activeCategoryTab === 'publico' && (formData.role_id === 4 || formData.role_id === 5) && (
            <div className="form-grid-2" style={{ marginTop: '8px' }}>
              <div className="form-input-box">
                <Building className="input-icon-svg" size={18} />
                <input
                  name="company_name"
                  type="text"
                  required
                  placeholder="NOMBRE DE LA EMPRESA / NEGOCIO"
                  value={formData.company_name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-input-box">
                <Key className="input-icon-svg" size={18} />
                <input
                  name="company_code"
                  type="text"
                  placeholder="CÓDIGO ÚNICO DE EMPRESA"
                  value={formData.company_code}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {activeCategoryTab === 'publico' && (formData.role_id === 2 || formData.role_id === 3 || formData.role_id === 7) && (
            <div className="form-input-box" style={{ marginTop: '8px', marginBottom: '16px' }}>
              <Key className="input-icon-svg" size={18} />
              <input
                name="company_code"
                type="text"
                required={formData.role_id === 7}
                placeholder={formData.role_id === 7 ? "CÓDIGO DEL AUTÓNOMO A VINCULAR (REQUERIDO)" : "CÓDIGO DEL AUTÓNOMO / EMPRESA VINCULADA"}
                value={formData.company_code}
                onChange={handleChange}
              />
            </div>
          )}

          <button type="submit" className="btn-submit-root" disabled={isLoading}>
            {isLoading ? 'REGISTRANDO USUARIO...' : '🚀 CREAR Y ACTIVAR CUENTA'}
          </button>
        </form>

        {mensaje && (
          <div style={{
            marginTop: '20px',
            padding: '12px 16px',
            borderRadius: '12px',
            textAlign: 'center',
            fontWeight: '800',
            fontSize: '0.95rem',
            color: 'white',
            backgroundColor: tipoMensaje === 'error' ? '#ef4444' : '#10b981',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
          }}>
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterModal;