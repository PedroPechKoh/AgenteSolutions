import React, { useState } from 'react';
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
        }
      `}</style>

      <div className="modal-content">
        <button className="close-button" onClick={onClose} type="button">
          <X size={28} />
        </button>

        <form onSubmit={handleRegistro}>
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

          <div className="input-group" style={{ marginBottom: "20px" }}>
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
              <option value={4}>AUTÓNOMO (Nivel 4)</option>
            </select>
          </div>

          {parseInt(formData.role_id) === 4 && (
            <div style={{ background: '#fff7ed', border: '1px solid #fdba74', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#c2410c', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🏢 Datos de Empresa para Autónomo
              </div>
              <div className="input-group" style={{ marginBottom: "12px" }}>
                <input 
                  type="text" 
                  name="company_name" 
                  placeholder="NOMBRE DE LA EMPRESA / NEGOCIO" 
                  className="custom-input"
                  style={{ paddingLeft: '15px' }}
                  value={formData.company_name || ''} 
                  onChange={handleChange} 
                  required={parseInt(formData.role_id) === 4} 
                />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <input 
                  type="text" 
                  name="company_code" 
                  placeholder="CÓDIGO PERSONALIZADO (ej. AUT_101)" 
                  className="custom-input"
                  style={{ paddingLeft: '15px' }}
                  value={formData.company_code || ''} 
                  onChange={handleChange} 
                  required={parseInt(formData.role_id) === 4} 
                />
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9a3412', marginTop: '8px', fontWeight: 'bold' }}>
                * El código de empresa se autogenera, pero puedes personalizarlo.
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