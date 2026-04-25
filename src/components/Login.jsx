import React, { useState, useEffect } from "react";
import "../styles/LoginAgente.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Logo4 from "../assets/Logo4.png";


const LoginAgente = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { loginGlobal } = useAuth();

  const [isRecoverModalOpen, setIsRecoverModalOpen] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoverMessage, setRecoverMessage] = useState("");

  //Variablaes para personalizar el Login
const [backgroundSettings, setBackgroundSettings] = useState({ imageUrl: null, colorHex: '#000000' });

 useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/login-settings`);
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
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/login`, {
    email: email,
    password: password
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

  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    setRecoverMessage("");
    if (newPassword !== confirmPassword) {
      setRecoverMessage("Las contraseñas no coinciden.");
      return;
    }
    
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/recover-password`, {
        email: recoverEmail,
        new_password: newPassword
      });
      setRecoverMessage("Contraseña actualizada con éxito.");
      setTimeout(() => {
        setIsRecoverModalOpen(false);
        setRecoverMessage("");
        setRecoverEmail("");
        setNewPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch (error) {
      console.log("Error al recuperar:", error);
      if (error.response) {
        setRecoverMessage(`Error: ${error.response.data.message || error.response.data.error || 'No se pudo actualizar.'}`);
      } else {
        setRecoverMessage("Error al recuperar la contraseña. Verifica tu conexión.");
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
      
      <img src={Logo4} alt="Agente Solutions" className="logo-top-left" />
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
            {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
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
        <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '0.9rem' }}>
          <span 
            onClick={() => setIsRecoverModalOpen(true)} 
            style={{ color: '#FF6600', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            ¿Olvidaste tu contraseña? Recuperar aquí
          </span>
        </div>
        {mensaje && (
          <p className={`msg-box ${mensaje.includes("Error") ? "error" : "success"}`}>
            {mensaje}
          </p>
        )}
      </form>

      {isRecoverModalOpen && (
        <div className="login-modal-overlay">
          <div className="login-modal-content">
            <img src={Logo4} alt="Agente Solutions" className="login-modal-logo" style={{ width: '150px', marginBottom: '20px' }} />
            <h3 style={{ color: 'white', marginBottom: '20px', fontStyle: 'italic' }}>RECUPERAR CONTRASEÑA</h3>
            <form onSubmit={handleRecoverPassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
              <div className="input-group">
                <Mail size={20} strokeWidth={2.5} className="input-icon" />
                <input
                  type="email"
                  placeholder="CORREO REGISTRADO"
                  className="custom-input login-modal-input"
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  required
                  style={{ paddingLeft: "50px" }}
                />
              </div>
              <div className="input-group">
                <Lock size={20} strokeWidth={2.5} className="input-icon" />
                <input
                  type="password"
                  placeholder="NUEVA CONTRASEÑA"
                  className="custom-input login-modal-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ paddingLeft: "50px" }}
                />
              </div>
              <div className="input-group">
                <Lock size={20} strokeWidth={2.5} className="input-icon" />
                <input
                  type="password"
                  placeholder="CONFIRMAR CONTRASEÑA"
                  className="custom-input login-modal-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ paddingLeft: "50px" }}
                />
              </div>
              <button type="submit" className="btn-login" style={{ fontSize: '1.2rem', padding: '10px' }}>
                ACTUALIZAR
              </button>
              <button 
                type="button" 
                className="btn-cancelar"
                onClick={() => setIsRecoverModalOpen(false)} 
              >
                CANCELAR
              </button>
              {recoverMessage && (
                <p className={`msg-box ${recoverMessage.includes("Error") || recoverMessage.includes("no coinciden") ? "error" : "success"}`} style={{ marginTop: '10px' }}>
                  {recoverMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginAgente;