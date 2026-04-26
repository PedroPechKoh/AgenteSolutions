import React, { useState } from 'react';
import { User, Lock, Mail, Phone, Eye, EyeOff, Shield, X } from 'lucide-react';
import axios from 'axios';

const RegisterModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    role_id: 1 
  });
  
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/registro-usuario`, formData);
      
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
          role_id: 1
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
        
        .modal-content {
          background: #000;
          padding: 30px;
          border-radius: 15px;
          width: 90%;
          max-width: 650px;
          position: relative;
          box-shadow: 0 0 20px rgba(242, 101, 34, 0.5);
          font-family: "Arial Black", sans-serif;
        }

        .close-button {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          transition: 0.3s;
        }
        .close-button:hover {
          color: #F26522;
          transform: scale(1.1);
        }

        .form-title {
          color: white;
          font-style: italic;
          font-size: 1.8rem;
          letter-spacing: 2px;
          margin-bottom: 25px;
          text-align: center;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .form-row-responsive {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }

        .input-group {
          position: relative;
          flex: 1;
        }

        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #555;
          z-index: 2;
        }

        .custom-input, .custom-select {
          width: 100%;
          padding: 12px 15px 12px 45px;
          border-radius: 50px;
          border: 3px solid transparent;
          background-color: #cfd3d8;
          font-weight: 900;
          font-style: italic;
          font-size: 0.95rem;
          outline: none;
          transition: 0.3s;
          color: #000;
        }
        
        .no-icon-input {
          padding-left: 20px;
        }

        .custom-select {
          cursor: pointer;
          appearance: none; 
        }

        .custom-input:focus, .custom-select:focus {
          border-color: #F26522;
          background: white;
          box-shadow: 0 0 15px rgba(242, 101, 34, 0.6);
        }

        .toggle-password-btn {
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

        .btn-registrar {
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
        
        .btn-registrar:hover:not(:disabled) {
          transform: scale(1.05);
        }
        .btn-registrar:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .msg-box {
          text-align: center;
          width: 100%;
          font-weight: bold;
          padding: 8px;
          border-radius: 4px;
          margin-top: 15px;
        }
        .success { color: #fff; background: rgba(34, 197, 94, 0.9); }
        .error { color: #fff; background: rgba(255, 68, 68, 0.9); }

        @media (max-width: 600px) {
          .form-row-responsive {
            flex-direction: column;
            gap: 15px;
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
              />
            </div>
            <div className="input-group">
              <input 
                type="text" name="last_name" placeholder="APELLIDOS" 
                className="custom-input no-icon-input"
                value={formData.last_name} onChange={handleChange} required
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
              />
            </div>
            <div className="input-group">
              <Phone size={20} className="input-icon" />
              <input 
                type="tel" name="phone_number" placeholder="TELÉFONO" 
                className="custom-input"
                value={formData.phone_number} onChange={handleChange} required
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
            >
              <option value={1}>ADMINISTRADOR (Nivel 1)</option>
              <option value={2}>TÉCNICO / VENDEDOR (Nivel 2)</option>
              <option value={3}>CLIENTE (Nivel 3)</option>
            </select>
          </div>

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