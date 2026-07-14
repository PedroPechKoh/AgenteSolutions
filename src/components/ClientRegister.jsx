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

  // 'client' (3), 'technician' (2), 'owner' (5)
  const [accountType, setAccountType] = useState("client");
  const [companyName, setCompanyName] = useState("");
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
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/login-settings`)
      .then(r => { if (r.data.success) setBackgroundSettings(r.data.settings); })
      .catch(() => {});
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

    if (password !== confirmPassword) { setMessage("Error: Las contraseñas no coinciden."); return; }
    if (!isCaptchaValid) { setMessage("Error: Por favor verifica que no eres un robot."); return; }
    if ((accountType === "owner" || accountType === "owner_business") && !companyName.trim() && !firstName.trim()) {
      setMessage("Error: Por favor ingresa el nombre de tu negocio/empresa."); return;
    }

    setIsLoading(true);

    const roleMap = { client: 3, technician: 2, owner: 5, owner_personal: 5, owner_business: 4 };
    const roleId  = roleMap[accountType] ?? 3;

    try {
      const isAutonomoAccount = (roleId === 5 || roleId === 4);
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/registro-usuario`, {
        first_name:   firstName.trim(),
        last_name:    lastName.trim(),
        email,
        phone_number: phone,
        password,
        role_id:      roleId,
        company_code: !isAutonomoAccount ? companyCode.trim() || null : null,
        company_name: isAutonomoAccount ? (companyName.trim() || `${firstName.trim()} ${lastName.trim()}`) : null
      });

      setIsLoading(false);

      if (res.data.status === 'pending_payment') {
        // Autónomo: redirigir a pantalla de pago
        navigate(`/activacion-cuenta?tenant_id=${res.data.tenant_id}`);
      } else if (res.data.status === 'pending_approval' || roleId === 2) {
        setIsPendingApproval(true);
      } else if (roleId === 5 || roleId === 4) {
        setMessage('🎉 ¡Registro exitoso con 6 MESES GRATIS activos! Redirigiendo para iniciar sesión...');
        setTimeout(() => navigate('/'), 2200);
      } else {
        setMessage('¡Registro exitoso! Redirigiendo al inicio de sesión...');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      setIsLoading(false);
      const msg = error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(' ') : (error.response?.data?.message || 'Error del servidor.');
      setMessage('Error: ' + msg);
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
        overflowX: 'hidden',
        fontFamily: '"Arial Black", sans-serif'
      }} 
    >
      <div style={{ maxWidth: '720px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
        
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
                <strong style={{ color: '#f26522' }}>Empresa / Código:</strong> {companyCode || 'Agente Solutions (Empresa Oficial)'}<br />
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
            className="register-card"
            style={{
              width: '100%',
              maxWidth: '650px',
              padding: '35px 25px',
              borderRadius: '24px',
              backgroundColor: 'rgba(25, 25, 25, 0.94)',
              border: '1px solid rgba(242, 101, 34, 0.4)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.65)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxSizing: 'border-box',
              margin: '0 auto'
            }}
          >
            <h2
              style={{ color: 'white', fontStyle: 'italic', fontSize: '1.8rem', letterSpacing: '1.5px', margin: '0 0 10px 0', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)', textAlign: 'center', fontWeight: '900' }}
            >
              CREAR CUENTA <i className="fas fa-chess-queen-alt"></i>
            </h2>

            {/* ─── Selector de tipo de cuenta ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', width: '100%' }}>
              {[
                { key: 'client',         icon: '👤', label: 'SOY CLIENTE',         sub: 'Contrato servicios' },
                { key: 'technician',     icon: '🛠️', label: 'SOY TÉCNICO',         sub: 'Presto servicios' },
                { key: 'owner_personal', icon: '🏠', label: 'PROPIETARIO PERSONAL', sub: '3 Propiedades ($299/m)' },
                { key: 'owner_business', icon: '🏢', label: 'AUTÓNOMO EMPRESA',    sub: '30 Clientes ($935/m)' },
              ].map(({ key, icon, label, sub }) => {
                const isSelected = accountType === key || (key === 'owner_personal' && accountType === 'owner');
                return (
                  <button key={key} type="button" onClick={() => setAccountType(key)}
                    style={{
                      padding: '12px 6px', borderRadius: '16px', cursor: 'pointer',
                      border: isSelected ? '2px solid #f26522' : '2px solid rgba(255,255,255,0.08)',
                      backgroundColor: isSelected ? 'rgba(242,101,34,0.18)' : 'rgba(255,255,255,0.04)',
                      color: isSelected ? '#f26522' : '#bbb',
                      fontWeight: 900, fontStyle: 'italic', fontSize: '0.76rem', textAlign: 'center',
                      transition: 'all 0.25s', boxShadow: isSelected ? '0 0 14px rgba(242,101,34,0.3)' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{icon}</div>
                    <div style={{ lineHeight: 1.2 }}>{label}</div>
                    <div style={{ fontWeight: 'normal', fontStyle: 'normal', fontSize: '0.67rem', color: isSelected ? '#f9a97e' : '#777', marginTop: 3 }}>{sub}</div>
                  </button>
                );
              })}
            </div>

            {/* ─── Panel de beneficios dinámico ─── */}
            {accountType === 'client' && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '14px 18px', width: '100%', boxSizing: 'border-box' }}>
                <p style={{ color: '#f26522', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 8px 0' }}>👤 Cliente — ¿Qué incluye?</p>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#ccc', fontSize: '0.82rem', lineHeight: 1.8 }}>
                  <li>✅ Solicita servicios de mantenimiento</li>
                  <li>✅ Sigue el estado de tus órdenes en vivo</li>
                  <li>✅ Recibe y aprueba cotizaciones</li>
                  <li>✅ Historial completo por propiedad</li>
                  <li style={{ color: '#5cb85c' }}>🆓 Registro completamente gratuito</li>
                </ul>
                <div style={{ marginTop: 14 }}>
                  <label style={{ color: '#888', fontSize: '0.75rem', display: 'block', marginBottom: 6, fontWeight: 'bold' }}>🔑 ¿Tienes un código de empresa? <span style={{ color: '#555' }}>(Opcional)</span></label>
                  <input type="text" placeholder="Ej: AUT_E_001 — déjalo vacío para Agente Solutions"
                    value={companyCode} onChange={e => setCompanyCode(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '50px', border: 'none', backgroundColor: '#cfd3d8', color: '#1a1a1a', fontWeight: 'bold', fontSize: '0.83rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {accountType === 'technician' && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '14px 18px', width: '100%', boxSizing: 'border-box' }}>
                <p style={{ color: '#f26522', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 8px 0' }}>🛠️ Técnico — ¿Qué incluye?</p>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#ccc', fontSize: '0.82rem', lineHeight: 1.8 }}>
                  <li style={{ color: '#5cb85c', fontWeight: 'bold' }}>🎁 ¡INCLUYE 1 AÑO (12 MESES) GRATIS DE PRUEBA!</li>
                  <li>✅ Recibe y gestiona órdenes de trabajo</li>
                  <li>✅ Genera cotizaciones y reportes fotográficos</li>
                  <li>✅ Cuota después de 1 año: <strong>$99 MXN/mes</strong> *(exento si eres de Agente Solutions)*</li>
                  <li style={{ color: '#aaa' }}>⏳ Tu perfil será aprobado por tu empresa o Root</li>
                </ul>
                <div style={{ marginTop: 14 }}>
                  <label style={{ color: '#888', fontSize: '0.75rem', display: 'block', marginBottom: 6, fontWeight: 'bold' }}>🔑 Código de tu empresa <span style={{ color: '#f26522' }}>*</span></label>
                  <input type="text" placeholder="Ingresa el código que te dio tu empresa"
                    value={companyCode} onChange={e => setCompanyCode(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '50px', border: 'none', backgroundColor: '#cfd3d8', color: '#1a1a1a', fontWeight: 'bold', fontSize: '0.83rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {(accountType === 'owner' || accountType === 'owner_personal') && (
              <div style={{ background: 'rgba(242,101,34,0.07)', border: '1px solid rgba(242,101,34,0.25)', borderRadius: 14, padding: '14px 18px', width: '100%', boxSizing: 'border-box' }}>
                <p style={{ color: '#f26522', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 8px 0' }}>👑 Propietario Personal — ¿Qué incluye?</p>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#ccc', fontSize: '0.82rem', lineHeight: 1.8 }}>
                  <li style={{ color: '#5cb85c', fontWeight: 'bold', fontSize: '0.88rem' }}>🎁 ¡INCLUYE 6 MESES GRATIS DE PRUEBA!</li>
                  <li>✅ Registra hasta <strong>3 propiedades</strong> *(+$79.99 por propiedad extra)*</li>
                  <li>✅ Agrega tus técnicos e ingenieros propios sin límite</li>
                  <li>✅ Dashboard de administración, cotizaciones y evidencias</li>
                  <li style={{ color: '#f9a97e' }}>💳 Después de 6 meses: <strong>$299 MXN/mes</strong> o <strong>$3,229/año (-10%)</strong></li>
                </ul>
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, borderLeft: '3px solid #f26522' }}>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: '#bbb', fontStyle: 'italic' }}>
                    ℹ️ No requieres ingresar el nombre de la propiedad aquí; lo harás directamente en tu panel al iniciar sesión.
                  </p>
                </div>
              </div>
            )}

            {accountType === 'owner_business' && (
              <div style={{ background: 'rgba(242,101,34,0.1)', border: '1px solid rgba(242,101,34,0.35)', borderRadius: 14, padding: '14px 18px', width: '100%', boxSizing: 'border-box' }}>
                <p style={{ color: '#f26522', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 8px 0' }}>🏢 Autónomo Empresarial — ¿Qué incluye?</p>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#ccc', fontSize: '0.82rem', lineHeight: 1.8 }}>
                  <li style={{ color: '#5cb85c', fontWeight: 'bold', fontSize: '0.88rem' }}>🎁 ¡INCLUYE 6 MESES GRATIS DE PRUEBA!</li>
                  <li>✅ Administra hasta <strong>30 clientes / propiedades</strong></li>
                  <li>✅ Agrega técnicos y colaboradores sin límite de usuarios</li>
                  <li>✅ Gestión de portafolio, cotizaciones en línea y reportes en vivo</li>
                  <li style={{ color: '#f9a97e' }}>💳 Después de 6 meses: <strong>$935 MXN/mes</strong> o <strong>$10,200/año</strong></li>
                </ul>
                <div style={{ marginTop: 14 }}>
                  <label style={{ color: '#888', fontSize: '0.75rem', display: 'block', marginBottom: 6, fontWeight: 'bold' }}>🏢 Nombre de tu Empresa / Negocio Inmobiliario <span style={{ color: '#555' }}>(Opcional)</span></label>
                  <input type="text" placeholder="Ej: Inmobiliaria & Mantenimiento CDMX — o déjalo vacío"
                    value={companyName} onChange={e => setCompanyName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '50px', border: 'none', backgroundColor: '#cfd3d8', color: '#1a1a1a', fontWeight: 'bold', fontSize: '0.83rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}


            <div className="form-row-responsive">
              <div className="input-group">
                <User size={20} className="input-icon" />
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
              <div className="input-group">
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

            <div className="form-row-responsive">
              <div className="input-group">
                <Mail size={20} className="input-icon" />
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
              <div className="input-group">
                <Phone size={20} className="input-icon" />
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

            <div className="form-row-responsive">
              <div className="input-group">
                <Lock size={20} className="input-icon" />
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
              <div className="input-group">
                <Lock size={20} className="input-icon" />
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