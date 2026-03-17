import React, { useState } from "react";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import "../styles/LoginAgente.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginAgente = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { loginGlobal } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/login-rapido", {
        email,
        password,
      });

      const { 
        id, 
        first_name, 
        last_name, 
        email: emailDb, 
        phone_number, 
        birth_date, 
        role_id, 
        profile_picture, 
        cover_picture,
        created_at 
      } = res.data;

      loginGlobal({
        id,
        first_name,
        last_name,
        email: emailDb, 
        phone_number,
        birth_date,
        role_id,
        profile_picture,
        cover_picture,
        created_at
      });

      if (role_id === 0) {
        setMensaje(`¡Bienvenido ROOT ${first_name}! Entrando al panel principal...`);
        setTimeout(() => {
          navigate("/VistaRoot");
        }, 1000);
      } else if (role_id === 1) {
        setMensaje(`¡Bienvenido ADMIN ${first_name}! Entrando al panel administrativo...`);
        setTimeout(() => {
          navigate("/VistaAdmin");
        }, 1000);
      } else if (role_id === 2) {
        setMensaje(`¡Bienvenido TÉCNICO ${first_name}! Abriendo tu panel de trabajo...`);
        setTimeout(() => {
          navigate("/VistaTecnico");
        }, 1000);
      } else {
        setMensaje(`Error: Tu usuario no tiene permisos válidos.`);
      }
    } catch (error) {
      console.log("Error de JS o Laravel:", error); 
      setMensaje("Error: Datos incorrectos o servidor no disponible");
    }
  };

  return (
    <div className="main-viewport">
      <img src="/src/assets/Logo4.png" alt="Agente Solutions" className="logo-top-left" />
      <div className="decoration-layer">
        <div className="stripe-top"></div>
        <div className="stripe-bottom"></div>
        <div className="shape-right"></div>
      </div>
      
      <form className="form-section" onSubmit={handleLogin}>
        <h2 className="form-title">INICIO DE SESIÓN</h2>

        <div className="input-group">
          <User size={20} className="input-icon" />
          <input
            type="email"
            placeholder="USUARIO"
            className="custom-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <Lock size={20} className="input-icon" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="CONTRASEÑA"
            className="custom-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="button" className="toggle-password-btn" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button type="submit" className="btn-login">INICIAR</button>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: '#888' }}>¿No tienes una cuenta? </span>
          <span 
            onClick={() => navigate('/registro-cliente')} 
            style={{ color: '#FF6600', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            Regístrate aquí
          </span>
        </div>
        {mensaje && (
          <p className={`msg-box ${mensaje.includes("Error") ? "error" : "success"}`}>
            {mensaje}
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginAgente;