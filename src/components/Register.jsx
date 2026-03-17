import React, { useState } from 'react';
import { User, Lock, Mail, Shield } from 'lucide-react';
import axios from 'axios';

const RegisteRoot = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: 1 
  });
  
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState(''); 

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setMensaje('Registrando...');
    setTipoMensaje('');

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/registro-usuario', formData);
      
      setMensaje(`¡Éxito! Usuario ${res.data.user.name} registrado.`);
      setTipoMensaje('success');
      
      setFormData({ name: '', email: '', password: '', role_id: 1 });
      
    } catch (error) {
      setTipoMensaje('error');
      if (error.response && error.response.data.errors) {
        setMensaje('Error: Datos inválidos o el correo ya existe.');
      } else {
        setMensaje('Error al conectar con el servidor.');
      }
    }
  };

  return (
    <div className="main-viewport">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .main-viewport {
          background-color: #000;
          width: 100vw;
          height: 100vh;
          position: relative; 
          display: flex;
          align-items: center;
          justify-content: flex-end; 
          font-family: "Arial Black", sans-serif;
          overflow: hidden;
        }

        .logo-top-left {
          position: absolute;
          top: 40px;
          left: 60px;
          width: 220px;
          z-index: 50; 
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
        }

        .decoration-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .stripe-top {
          position: absolute;
          top: 25%;
          left: -100px;
          width: 60%; 
          height: 130px;
          background: #e5e5e5;
          clip-path: polygon(0 35%, 85% 35%, 100% 0, 100% 65%, 85% 100%, 0 100%);
        }
        .stripe-top::after {
          content: '';
          position: absolute;
          inset: 10px;
          background: #F26522;
          clip-path: polygon(0 35%, 85% 35%, 100% 0, 100% 65%, 85% 100%, 0 100%);
        }

        .stripe-bottom {
          position: absolute;
          bottom: 25%;
          left: -100px;
          width: 60%;
          height: 150px;
          background: #e5e5e5;
          clip-path: polygon(0 0, 85% 0, 100% 35%, 100% 100%, 85% 65%, 0 65%);
        }
        .stripe-bottom::after {
          content: '';
          position: absolute;
          inset: 10px;
          background: #F26522;
          clip-path: polygon(0 0, 85% 0, 100% 35%, 100% 100%, 85% 65%, 0 65%);
        }

        /* --- FORMULARIO (ALINEACIÓN CORREGIDA) --- */
        .form-section {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center; /* <--- Esto corrige la "escalera", centra todos los inputs en columna */
          justify-content: center;
          gap: 20px; /* Un poco menos de espacio para que quepan todos los campos */
          width: 350px;
          margin-right: 8%; 
        }

        .form-title {
          color: white;
          font-style: italic;
          font-size: 2.5rem;
          letter-spacing: 2px;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          white-space: nowrap;
        }

        .input-group {
          position: relative;
          width: 100%;
        }

        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #555;
          z-index: 2;
        }

        /* ESTILOS UNIFICADOS PARA INPUT Y SELECT */
        .custom-input, .custom-select {
          width: 100%;
          padding: 15px 15px 15px 45px;
          border-radius: 50px;
          border: 3px solid transparent;
          background-color: #cfd3d8;
          font-weight: 900;
          font-style: italic;
          font-size: 1rem;
          outline: none;
          transition: 0.3s;
          color: #000;
        }

        .custom-select {
          cursor: pointer;
          appearance: none; /* Quita la flechita fea por defecto del navegador */
        }

        .custom-input:focus, .custom-select:focus {
          border-color: #F26522;
          background: white;
          box-shadow: 0 0 15px rgba(242, 101, 34, 0.6);
        }

        .btn-registrar {
          width: 100%;
          padding: 15px;
          border-radius: 50px;
          border: none;
          background: #F26522;
          color: white;
          font-size: 1.4rem;
          font-weight: 900;
          font-style: italic;
          cursor: pointer;
          box-shadow: 0 5px 15px rgba(242,101,34,0.4);
          transition: transform 0.2s;
          margin-top: 10px;
        }
        
        .btn-registrar:hover {
          transform: scale(1.05);
        }

        .msg-box {
          text-align: center;
          width: 100%;
          font-weight: bold;
          padding: 8px;
          border-radius: 4px;
        }
        .success { color: #fff; background: rgba(34, 197, 94, 0.9); }
        .error { color: #fff; background: rgba(255, 68, 68, 0.9); }

        /* --- RESPONSIVO --- */
        @media (max-width: 960px) {
          .main-viewport {
            justify-content: center; 
            flex-direction: column;
          }

          .logo-top-left {
            position: relative; 
            top: auto; left: auto;
            margin-bottom: 20px;
            width: 180px;
          }

          .stripe-top { width: 100%; left: 0; top: 5%; opacity: 0.5; }
          .stripe-bottom { width: 100%; left: 0; bottom: 5%; opacity: 0.5; }

          .form-section {
            margin-right: 0;
            width: 100%;
            max-width: 350px;
            padding: 20px;
            align-items: center;
          }
        }
      `}</style>

      <img src="/src/assets/Logo4.png" alt="Agente Solutions" className="logo-top-left" />

      <div className="decoration-layer">
        <div className="stripe-top"></div>
        <div className="stripe-bottom"></div>
      </div>

      <form className="form-section" onSubmit={handleRegistro}>
        
        <h2 className="form-title">REGISTRO</h2>

        <div className="input-group">
          <User size={20} className="input-icon"/>
          <input 
            type="text" name="name" placeholder="NOMBRE COMPLETO" 
            className="custom-input"
            value={formData.name} onChange={handleChange} required
          />
        </div>

        <div className="input-group">
          <Mail size={20} className="input-icon"/>
          <input 
            type="email" name="email" placeholder="CORREO ELECTRÓNICO" 
            className="custom-input"
            value={formData.email} onChange={handleChange} required
          />
        </div>

        <div className="input-group">
          <Lock size={20} className="input-icon"/>
          <input 
            type="password" name="password" placeholder="CONTRASEÑA (Min. 6)" 
            className="custom-input"
            value={formData.password} onChange={handleChange} required minLength="6"
          />
        </div>

        <div className="input-group">
          <Shield size={20} className="input-icon"/>
          <select 
            name="role_id" className="custom-select"
            value={formData.role_id} onChange={handleChange} required
          >
            <option value={0}>ROOT (Nivel 0)</option>
            <option value={1}>ADMINISTRADOR (Nivel 1)</option>
            <option value={2}>TÉCNICO / VENDEDOR (Nivel 2)</option>
          </select>
        </div>

        <button type="submit" className="btn-registrar">REGISTRAR</button>

        {mensaje && (
          <p className={`msg-box ${tipoMensaje}`}>
            {mensaje}
          </p>
        )}
      </form>

    </div>
  );
};

export default RegisteRoot;