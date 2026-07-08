import React, { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, Mail, Phone, Building2, Briefcase, UserCheck, Clock, CheckCircle } from "lucide-react";
import "../styles/LoginAgente.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import Logo4 from "../assets/Logo4.png";

const ClientRegister = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Nuevos estados para Multi-Tenant y Rol
  const [accountType, setAccountType] = useState("client"); // 'client' (3), 'technician' (2), o 'autonomo' (4)
  const [companyName, setCompanyName] = useState("");
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundSettings, setBackgroundSettings] = useState({ imageUrl: null, colorHex: '#000000', appLogo: null });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettingsAndTenants = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/login-settings`);
        if (response.data.success) {
          setBackgroundSettings(response.data.settings);
        }
      } catch (error) {
        console.error("Error al cargar configuraciones visuales:", error);
      }

      try {
        const resTenants = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/tenants/public-list`);
        if (resTenants.data.success) {
          setTenants(resTenants.data.tenants);
          // Reemplazar o cargar de localStorage si existe
          const savedTenant = localStorage.getItem("agente_tenant_selected");
          if (savedTenant) {
            const parsed = JSON.parse(savedTenant);
            setSelectedTenantId(parsed.id || "");
            setCompanyCode(parsed.code || "");
          }
        }
      } catch (error) {
        console.error("Error al cargar empresas:", error);
      }
    };
    fetchSettingsAndTenants();
  }, []);

  const handleCaptchaChange = (value) => {
    setIsCaptchaValid(!!value);
  };

  const handleTenantSelect = (e) => {
    const id = e.target.value;
    setSelectedTenantId(id);
    if (id) {
      const found = tenants.find((t) => t.id.toString() === id.toString());
      if (found) {
        setCompanyCode(found.code);
        localStorage.setItem("agente_tenant_selected", JSON.stringify(found));
      }
    } else {
      setCompanyCode("");
      localStorage.removeItem("agente_tenant_selected");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Error: Las contraseñas no coinciden.");
      return;
    }

    if (!isCaptchaValid) {
      setMessage("Error: Por favor verifica que no eres un robot.");
      return;
    }

    if (accountType === "autonomo" && !companyName.trim()) {
      setMessage("Error: Por favor ingresa el nombre de tu Empresa o Negocio.");
      return;
    }

    setIsLoading(true);

    try {
      const roleId = accountType === "autonomo" ? 4 : (accountType === "client" ? 3 : 2);
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/registro-usuario`,
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email,
          phone_number: phone,
          password,
          role_id: roleId,
          company_code: companyCode,
          tenant_id: selectedTenantId ? parseInt(selectedTenantId) : null,
          company_name: accountType === "autonomo" ? companyName.trim() : null
        }
      );
      
      setIsLoading(false);

      if (res.data.status === "pending_approval" || roleId === 2) {
        setIsPendingApproval(true);
      } else {
        setMessage(accountType === "autonomo" ? "¡Solicitud de Empresa enviada! Redirigiendo al portal..." : "¡Registro exitoso! Redirigiendo al inicio de sesión...");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      setIsLoading(false);
      console.error(error.response?.data);
      alert("Error del servidor: " + (error.response?.data?.error || error.response?.data?.message || "Error desconocido"));
    }
  };

  return (
    <div 
      style={{ 
        backgroundColor: backgroundSettings.colorHex || '#0f0f0f', 
        backgroundImage: backgroundSettings.imageUrl ? `url(${backgroundSettings.imageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.5s ease-in-out',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 15px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        fontFamily: '"Arial Black", sans-serif'
      }} 
    >
      <div style={{ maxWidth: '720px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* LOGO SUPERIOR LIMPIO (Sin overlaps ni scale absoluto) */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <img
            src={backgroundSettings.appLogo || Logo4}
            alt="Agente Solutions"
            style={{ maxWidth: '240px', width: '100%', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          />
        </div>

        {isPendingApproval ? (
          <div style={{ width: '100%', padding: '40px 25px', textAlign: 'center', borderRadius: '24px', backgroundColor: 'rgba(20, 20, 20, 0.95)', border: '2px solid #f26522', boxShadow: '0 15px 35px rgba(242, 101, 34, 0.3)', color: '#fff' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(242, 101, 34, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '1px solid #f26522' }}>
              <Clock size={45} color="#f26522" />
            </div>
            <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '15px', fontWeight: '900', fontStyle: 'italic' }}>
              ¡PERFIL EN REVISIÓN!
            </h2>
            <p style={{ color: '#ddd', fontSize: '1rem', lineHeight: '1.6', marginBottom: '25px', maxWidth: '550px', margin: '0 auto 25px auto' }}>
              Tu registro como <strong>Técnico</strong> se ha completado con éxito. Por seguridad, tu perfil está en la sala de espera y debe ser revisado y autorizado por el <strong>Administrador de tu empresa</strong> para poder iniciar sesión.
            </p>
            <div style={{ padding: '18px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', marginBottom: '25px', borderLeft: '4px solid #f26522', textAlign: 'left', maxWidth: '500px', margin: '0 auto 25px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#eee', overflowWrap: 'anywhere' }}>
                <strong style={{ color: '#f26522' }}>Empresa / Código:</strong> {companyCode || 'General / Root'}<br />
                <strong style={{ color: '#f26522' }}>Estado actual:</strong> <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>⏳ Pendiente de aprobación</span>
              </p>
            </div>
            <button
              type="button"
              className="btn-login"
              onClick={() => navigate('/')}
              style={{ width: '100%', maxWidth: '350px', padding: '14px', fontSize: '1.1rem', borderRadius: '50px', backgroundColor: '#f26522', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            >
              VOLVER AL INICIO DE SESIÓN
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleRegister}
            style={{
              width: '100%',
              padding: '35px 25px',
              borderRadius: '24px',
              backgroundColor: 'rgba(25, 25, 25, 0.94)',
              border: '1px solid rgba(242, 101, 34, 0.4)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.65)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxSizing: 'border-box'
            }}
          >
            <h2
              style={{ color: 'white', fontStyle: 'italic', fontSize: '1.8rem', letterSpacing: '1.5px', margin: '0 0 10px 0', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)', textAlign: 'center', fontWeight: '900' }}
            >
              CREAR CUENTA <i className="fas fa-chess-queen-alt"></i>
            </h2>

            {/* Selector de Tipo de Cuenta */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
              <button
                type="button"
                onClick={() => setAccountType('client')}
                style={{
                  flex: '1 1 200px',
                  padding: '14px 10px',
                  borderRadius: '50px',
                  border: accountType === 'client' ? '3px solid #f26522' : '3px solid transparent',
                  backgroundColor: accountType === 'client' ? '#f26522' : '#cfd3d8',
                  color: accountType === 'client' ? '#fff' : '#333333',
                  fontWeight: '900',
                  fontStyle: 'italic',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  boxShadow: accountType === 'client' ? '0 0 15px rgba(242, 101, 34, 0.6)' : 'none'
                }}
              >
                <UserCheck size={20} /> SOY CLIENTE
              </button>
              <button
                type="button"
                onClick={() => setAccountType('technician')}
                style={{
                  flex: '1 1 200px',
                  padding: '14px 10px',
                  borderRadius: '50px',
                  border: accountType === 'technician' ? '3px solid #f26522' : '3px solid transparent',
                  backgroundColor: accountType === 'technician' ? '#f26522' : '#cfd3d8',
                  color: accountType === 'technician' ? '#fff' : '#333333',
                  fontWeight: '900',
                  fontStyle: 'italic',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  boxShadow: accountType === 'technician' ? '0 0 15px rgba(242, 101, 34, 0.6)' : 'none'
                }}
              >
                <Briefcase size={20} /> SOY TÉCNICO
              </button>
            </div>

            {/* Selector de Empresa / Autónomo */}
            <div className="input-group" style={{ position: 'relative', width: '100%' }}>
              <Building2 size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#333', zIndex: 2 }} />
              <select
                className="custom-input"
                value={selectedTenantId}
                onChange={handleTenantSelect}
                style={{ width: '100%', padding: '14px 15px 14px 50px', borderRadius: '50px', border: 'none', backgroundColor: '#cfd3d8', color: '#1a1a1a', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="">🏢 AGENTE SOLUTIONS (EMPRESA OFICIAL / ROOT)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    🏢 {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row-responsive" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', width: '100%' }}>
              <div className="input-group" style={{ flex: '1 1 240px', position: 'relative' }}>
                <User size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#333', zIndex: 2 }} />
                <input
                  type="text"
                  placeholder="NOMBRE(S)"
                  className="custom-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: '100%', padding: '14px 15px 14px 50px', borderRadius: '50px', border: 'none', backgroundColor: '#cfd3d8', color: '#1a1a1a', fontWeight: 'bold', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div className="input-group" style={{ flex: '1 1 240px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="APELLIDOS"
                  className="custom-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ width: '100%', padding: '14px 20px', borderRadius: '50px', border: 'none', backgroundColor: '#cfd3d8', color: '#1a1a1a', fontWeight: 'bold', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
              </div>
            </div>

            <div className="form-row-responsive" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', width: '100%' }}>
              <div className="input-group" style={{ flex: '1 1 240px', position: 'relative' }}>
                <Mail size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#333', zIndex: 2 }} />
                <input
                  type="email"
                  placeholder="CORREO ELECTRÓNICO"
                  className="custom-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '14px 15px 14px 50px', borderRadius: '50px', border: 'none', backgroundColor: '#cfd3d8', color: '#1a1a1a', fontWeight: 'bold', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div className="input-group" style={{ flex: '1 1 240px', position: 'relative' }}>
                <Phone size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#333', zIndex: 2 }} />
                <input
                  type="tel"
                  placeholder="TELÉFONO"
                  className="custom-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '14px 15px 14px 50px', borderRadius: '50px', border: 'none', backgroundColor: '#cfd3d8', color: '#1a1a1a', fontWeight: 'bold', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
              </div>
            </div>

            <div className="form-row-responsive" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', width: '100%' }}>
              <div className="input-group" style={{ flex: '1 1 240px', position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#333', zIndex: 2 }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="CONTRASEÑA"
                  className="custom-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '14px 45px 14px 50px', borderRadius: '50px', border: 'none', backgroundColor: '#cfd3d8', color: '#1a1a1a', fontWeight: 'bold', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#333', zIndex: 2 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="input-group" style={{ flex: '1 1 240px', position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#333', zIndex: 2 }} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="CONFIRMA CONTRASEÑA"
                  className="custom-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '14px 45px 14px 50px', borderRadius: '50px', border: 'none', backgroundColor: '#cfd3d8', color: '#1a1a1a', fontWeight: 'bold', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#333', zIndex: 2 }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', margin: '10px 0', width: '100%', overflowX: 'auto' }}>
              <ReCAPTCHA
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                onChange={handleCaptchaChange}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '50px',
                border: 'none',
                backgroundColor: '#f26522',
                color: '#fff',
                fontWeight: '900',
                fontSize: '1.15rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px rgba(242, 101, 34, 0.4)',
                transition: 'transform 0.2s, background-color 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseOver={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseOut={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isLoading ? 'Creando cuenta...' : 'REGISTRAR'}
            </button>

            {message && (
              <p
                style={{
                  margin: '10px 0 0 0',
                  padding: '12px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  backgroundColor: message.includes('Error') ? 'rgba(244, 67, 54, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                  color: message.includes('Error') ? '#ff6b6b' : '#69db7c',
                  border: message.includes('Error') ? '1px solid #f44336' : '1px solid #4CAF50'
                }}
              >
                {message}
              </p>
            )}

            <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.95rem' }}>
              <span style={{ color: '#aaa' }}>¿Ya tienes una cuenta? </span>
              <span
                onClick={() => navigate('/')}
                style={{ color: '#f26522', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
              >
                Iniciar Sesión
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClientRegister;