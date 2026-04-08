import React, { useState, useEffect } from "react";
import "../styles/LoginAgente.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const LoginAgente = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { loginGlobal } = useAuth();

  //Variablaes para personalizar el Login
const [backgroundSettings, setBackgroundSettings] = useState({ imageUrl: null, colorHex: '#000000' });

 useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/ui/settings/login-settings");
        if (response.data.success) {
          setBackgroundSettings(response.data.settings); 
        }
      } catch (error) {
        console.error("Error al cargar configuraciones visuales:", error);
        setBackgroundSettings({ imageUrl: null, colorHex: '#000000' });
      }
    };
    fetchSettings();
  }, []);

const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/login", { // O la ruta que tengas en api.php
        email,
        password,
      });

      // 👇 1. ATRAPAMOS EL NUEVO PAQUETE DEL BACKEND 👇
      const { token, user } = res.data;

      // 👇 2. GUARDAMOS EL TOKEN COMO UN TESORO 👇
      localStorage.setItem('agente_token', token);

      // 👇 3. LE DECIMOS A AXIOS QUE USE EL TOKEN DESDE AHORA 👇
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // 4. Sacamos los datos del usuario (ahora vienen dentro del objeto 'user')
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
      } = user;

      // Actualizamos tu contexto global
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

      // 5. Las redirecciones se quedan exactamente igual
      if (role_id === 0) {
        setMensaje(`¡Bienvenido ROOT ${first_name}! Entrando al panel principal...`);
        setTimeout(() => navigate("/VistaRoot"), 1000);
      } else if (role_id === 1) {
        setMensaje(`¡Bienvenido ADMIN ${first_name}! Entrando al panel administrativo...`);
        setTimeout(() => navigate("/VistaAdmin"), 1000);
      } else if (role_id === 2) {
        setMensaje(`¡Bienvenido TÉCNICO ${first_name}! Abriendo tu panel de trabajo...`);
        setTimeout(() => navigate("/VistaTecnico"), 1000);
      } else if (role_id === 3) {
        setMensaje(`¡Bienvenido CLIENTE ${first_name}! Abriendo tu portal...`);
        setTimeout(() => navigate("/VistaInicioCliente"), 1000);
      } else {
        setMensaje(`Error: Tu usuario no tiene permisos válidos.`);
      }
      
    } catch (error) {
      console.log("Error en el login:", error); 
      
      if (error.response) {
        if (error.response.status === 403) {
          setMensaje(`Error: ${error.response.data.error || 'Acceso denegado.'}`);
        } else if (error.response.status === 401) {
          setMensaje(`Error: ${error.response.data.message || 'Credenciales incorrectas.'}`);
        } else {
          setMensaje("Error: Hubo un problema al procesar tu solicitud.");
        }
      } else {
        setMensaje("Error: Servidor no disponible. Revisa tu conexión.");
      }
    }
  };

  return (
  <div 
      className="main-viewport"
      style={{ 
        backgroundColor: backgroundSettings.colorHex, 
        backgroundImage: backgroundSettings.imageUrl ? `url(${backgroundSettings.imageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.5s ease-in-out'
      }} 
    >
      
      <img src="/src/assets/Logo4.png" alt="Agente Solutions" className="logo-top-left" />
      <div className="decoration-layer">
        <div className="stripe-top"></div>
        <div className="stripe-bottom"></div>
        <div className="shape-right"></div>
      </div>
      
      <form className="form-section" onSubmit={handleLogin}>
        <h2 className="form-title">INICIO DE SESIÓN</h2>

        <div className="input-group">
          <Mail size={22} strokeWidth={2.5} className="input-icon" />
          <input
            type="email"
            placeholder="USUARIO"
            className="custom-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ paddingLeft: "55px" }}
          />
        </div>

        <div className="input-group">
          <Lock size={22} strokeWidth={2.5} className="input-icon" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="CONTRASEÑA"
            className="custom-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ paddingLeft: "55px" }}
          />
          <button type="button" className="toggle-password-btn" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={22} strokeWidth={2.5} /> : <Eye size={22} strokeWidth={2.5} />}
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