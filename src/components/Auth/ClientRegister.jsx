import React, { useState, useEffect, useRef } from "react";
import { User, Lock, Eye, EyeOff, Mail, Phone, Building2, Briefcase, UserCheck, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import "../../styles/Auth/LoginAgente.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import Logo4 from "../../assets/Logo4.png";

const ESPECIALIDADES_CATALOGO = [
  { id: 1, name: "Electricidad", icon: "⚡" },
  { id: 2, name: "Plomería", icon: "🚰" },
  { id: 3, name: "Aire Acondicionado (HVAC)", icon: "❄️" },
  { id: 4, name: "Pintura e Impermeabilización", icon: "🎨" },
  { id: 5, name: "Albañilería y Remodelación", icon: "🧱" },
  { id: 6, name: "Carpintería y Muebles", icon: "🪚" },
  { id: 7, name: "Cerrajería y Seguridad", icon: "🔑" },
  { id: 8, name: "Limpieza y Mantenimiento", icon: "🧹" },
  { id: 9, name: "Multi-técnico / General", icon: "🧰" },
  { id: 10, name: "Electrodomésticos y Equipos", icon: "🔌" },
  { id: 11, name: "Jardinería y Exteriores", icon: "🪴" },
  { id: 12, name: "Redes y CCTV", icon: "🖥️" }
];

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
  const [selectedSpecialties, setSelectedSpecialties] = useState(["Electricidad"]);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundSettings, setBackgroundSettings] = useState({ imageUrl: null, colorHex: '#000000', appLogo: null });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const gridRef = useRef(null);
  const cardRefs = useRef({});
  const [flipped, setFlipped] = useState(null);

  const centerCard = (cardEl) => {
    if (!cardEl || !gridRef.current) return;
    const container = gridRef.current;
    const card = cardEl;
    const offset = Math.max(0, card.offsetLeft - (container.clientWidth - card.clientWidth) / 2);
    container.scrollTo({ left: offset, behavior: 'smooth' });
  };

  const plans = [
    {
      key: 'client',
      roleId: 3,
      label: 'CLIENTE',
      sub: 'Contrata servicios',
      cta: 'Registrarme',
      color: '#F26522'
    },
    {
      key: 'technician',
      roleId: 2,
      label: 'TÉCNICO',
      sub: 'Presto servicios',
      cta: 'Suscribirme',
      color: '#6B7280'
    },
    {
      key: 'owner_personal',
      roleId: 5,
      label: 'AUTÓNOMO',
      sub: '3 Propiedades',
      cta: 'Suscribirme',
      color: '#1F6FEB'
    },
    {
      key: 'owner_business',
      roleId: 4,
      label: 'AUTÓNOMO EMPRESARIAL',
      sub: '30 Clientes',
      cta: 'Suscribirme',
      color: '#0F766E'
    },
    {
      key: 'admin_propiedades',
      roleId: 7,
      label: 'ADMIN. PROPIEDADES',
      sub: 'Gestión Inmuebles',
      cta: 'Registrarme',
      color: '#6D28D9'
    },
    {
      key: 'tecnico_red',
      roleId: 8,
      label: 'TÉCNICO DE LA RED',
      sub: 'Red de Trabajos',
      cta: 'Suscribirme',
      color: '#EA580C'
    }
  ];

  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/ui/settings/login-settings`)
      .then(r => { if (r.data.success) setBackgroundSettings(r.data.settings); })
      .catch(() => { });
  }, []);

  const handleCaptchaChange = (value) => {
    setIsCaptchaValid(!!value);
    setCaptchaToken(value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) { setMessage("Error: Las contraseñas no coinciden."); return; }
    if (!isCaptchaValid) { setMessage("Error: Por favor verifica que no eres un robot."); return; }

    setIsLoading(true);

    const roleMap = { 
      technician: 2, 
      client: 3, 
      owner_business: 4, 
      owner_personal: 5, 
      admin_propiedades: 7, 
      tecnico_red: 8 
    };
    const roleId = roleMap[accountType] ?? 3;

    try {
      const isAutonomoAccount = (roleId === 5 || roleId === 4 || roleId === 8);
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/registro-usuario`, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email,
        phone_number: phone,
        password,
        role_id: roleId,
        company_code: (!isAutonomoAccount && roleId !== 7) ? companyCode.trim() || null : null,
        company_name: isAutonomoAccount ? (companyName.trim() || `${firstName.trim()} ${lastName.trim()}`) : null,
        specialties: (roleId === 2 || roleId === 8) ? selectedSpecialties : [],
        captcha_token: captchaToken
      });

      setIsLoading(false);

      if (res.data.status === 'pending_payment') {
        // Autónomo: redirigir a pantalla de pago
        navigate(`/activacion-cuenta?tenant_id=${res.data.tenant_id}`);
      } else if (res.data.status === 'pending_approval' || roleId === 2 || (roleId === 7 && companyCode.trim() !== '')) {
        setIsPendingApproval(true);
      } else if (roleId === 5 || roleId === 4 || roleId === 6 || roleId === 8) {
        setMessage('🎉 ¡Registro exitoso con 1 AÑO GRATIS de prueba! Redirigiendo...');
        setTimeout(() => navigate(`/login`), 2200);
      } else if (roleId === 7) {
        setMessage('¡Registro exitoso! Redirigiendo...');
        setTimeout(() => navigate(`/login`), 2000);
      } else {
        setMessage('¡Registro exitoso! Redirigiendo...');
        setTimeout(() => navigate(`/login`), 2000);
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
      <style>{`
        .back-button {
          position: fixed;
          top: 50px;
          left: 50px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          transition: all 0.3s ease;
          z-index: 1100;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        .back-button:hover {
          color: #F26522;
          background: rgba(242, 101, 34, 0.15);
          border-color: #F26522;
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(242, 101, 34, 0.4);
        }
        @media (max-width: 600px) {
          .back-button {
            top: 15px;
            left: 15px;
            width: 40px;
            height: 40px;
          }
        }
      `}</style>

      <button type="button" className="back-button" onClick={handleGoBack} title="Regresar al Login" aria-label="Regresar al inicio de sesión">
        <ArrowLeft size={28} />
      </button>

      <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
        {/* LOGO SUPERIOR */}
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
              Tu registro se ha completado con éxito. Por seguridad, tu perfil está en la sala de espera y debe ser revisado y autorizado por el <strong>Administrador de tu empresa</strong> para poder iniciar sesión.
            </p>
            <div style={{ padding: '18px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', marginBottom: '25px', borderLeft: '4px solid #f26522', textAlign: 'left', maxWidth: '500px', margin: '0 auto 25px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#eee', overflowWrap: 'anywhere' }}>
                <strong style={{ color: '#f26522' }}>Empresa / Código:</strong> {companyCode || 'Agente Solutions (Empresa Oficial)'}<br />
                <strong style={{ color: '#f26522' }}>Estado actual:</strong> <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>⏳ Pendiente de aprobación</span>
              </p>
            </div>
            <button
              onClick={() => navigate(`/revisa-tu-correo?email=${email}`)}
              style={{ padding: '12px 24px', backgroundColor: '#f26522', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Continuar a verificación de correo
            </button>
          </div>
        ) : (
          <div
            className="register-card"
            style={{
              width: '100%',
              maxWidth: '100%',
              minHeight: 'auto',
              padding: '45px 35px',
              borderRadius: '26px',
              backgroundColor: 'rgba(10, 10, 10, 0.95)',
              border: '1px solid rgba(242, 101, 34, 0.25)',
              boxShadow: '0 32px 90px rgba(0, 0, 0, 0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '35px',
              boxSizing: 'border-box',
              margin: '0 auto'
            }}
          >
            <h2
              style={{ color: 'white', fontStyle: 'italic', fontSize: '1.8rem', letterSpacing: '1.5px', margin: '0', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)', textAlign: 'center', fontWeight: '900' }}
            >
              CREAR CUENTA <i className="fas fa-chess-queen-alt"></i>
            </h2>

            {/* ─── Selector de tipo de cuenta (Estilo cápsula gris original) ─── */}
            <style>{`
              .plan-grid { 
                display: flex; 
                flex-direction: row; 
                flex-wrap: wrap; 
                gap: 22px; 
                width: 100%; 
                max-width: 1060px;
                margin: 0 auto;
                justify-content: center; 
                align-items: stretch; 
                padding-bottom: 6px; 
              }
              .plan-card { 
                flex: 0 0 310px; 
                width: 310px; 
                min-height: 460px; 
                background: #ffffff; 
                border-radius: 28px; 
                padding: 16px; 
                color: #111; 
                border: 1px solid rgba(255, 255, 255, 0.2); 
                box-shadow: 0 20px 50px rgba(0,0,0,0.3); 
                cursor: pointer; 
                display: flex; 
                flex-direction: column; 
                justify-content: space-between; 
                transition: transform .36s cubic-bezier(.2,.9,.2,1), box-shadow .3s; 
                perspective: 1200px; 
                position: relative; 
                box-sizing: border-box;
              }
              .plan-card:hover { 
                transform: translateY(-8px) scale(1.02); 
                box-shadow: 0 26px 60px rgba(242, 101, 34, 0.3); 
              }
              .plan-card.active { 
                transform: translateY(-12px) scale(1.03); 
                z-index: 20; 
                box-shadow: 0 30px 70px rgba(242, 101, 34, 0.4); 
              }
              .plan-card .card-inner { 
                transition: transform 0.6s cubic-bezier(.2,.9,.2,1); 
                transform-style: preserve-3d; 
                position: relative; 
                height: 100%; 
                display: flex; 
                flex-direction: column; 
              }
              .plan-card.flip .card-inner { 
                transform: rotateY(180deg); 
              }
              .card-front, .card-back { 
                position: relative; 
                width: 100%; 
                min-height: 420px; 
                display: flex; 
                flex-direction: column; 
                justify-content: space-between; 
              }
              .card-grey-capsule {
                background: #bec5cc; 
                border-radius: 22px; 
                padding: 28px 18px 22px 18px; 
                display: flex; 
                flex-direction: column; 
                justify-content: space-between; 
                align-items: center; 
                height: 100%; 
                min-height: 420px;
                box-sizing: border-box;
                box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.05);
              }
              .card-back { 
                background: #ffffff; 
                border-radius: 22px; 
                overflow-y: auto; 
                justify-content: flex-start; 
                padding: 16px;
                box-sizing: border-box;
              }
              .plan-title { 
                font-weight: 900; 
                font-size: 1.28rem; 
                color: #111827; 
                text-align: center; 
                text-transform: uppercase; 
                margin: 0;
                letter-spacing: 0.3px;
              }
              .plan-sub { 
                font-size: 0.92rem; 
                color: #374151; 
                margin-top: 8px; 
                font-weight: 700; 
                text-align: center;
              }
              .plan-cta { 
                margin-top: 20px; 
                width: 100%; 
                padding: 14px 18px; 
                border-radius: 36px; 
                border: none; 
                background: #f26522; 
                color: #ffffff; 
                font-weight: 900; 
                font-size: 1rem; 
                cursor: pointer; 
                box-shadow: 0 10px 22px rgba(242, 101, 34, 0.35); 
                transition: transform .2s ease, background .2s; 
                text-align: center;
              }
              .plan-cta:hover { 
                transform: scale(1.03); 
                background: #e05514;
              }
              @media(max-width:1200px){ 
                .plan-card { width: 280px; flex: 0 0 280px; min-height: 440px; } 
              }
              @media(max-width:960px){ 
                .plan-card { width: 250px; flex: 0 0 250px; min-height: 430px; } 
              }
              @media(max-width:780px){ 
                .plan-grid { justify-content: center; gap: 18px; } 
                .plan-card { width: 100%; flex: 1 0 auto; min-height: 400px; } 
              }
            `}</style>

            <div ref={gridRef} className={`plan-grid ${selectedPlan ? 'focused' : ''}`}>
              {plans.map(p => {
                const isActive = selectedPlan === p.key;
                const isFlipped = flipped === p.key;
                return (
                  <div
                    key={p.key}
                    ref={el => cardRefs.current[p.key] = el}
                    className={`plan-card ${isActive ? 'active' : ''} ${isFlipped ? 'flip' : ''}`}
                    style={{ borderTop: `5px solid ${p.color}` }}
                  >
                    <div className="card-inner">
                      {/* FRONT OF THE CARD (Original Grey Capsule Design) */}
                      <div 
                        className="card-front" 
                        style={{ backfaceVisibility: 'hidden' }} 
                        onClick={() => { 
                          setAccountType(p.key); 
                          setSelectedPlan(p.key); 
                          setFlipped(p.key); 
                        }}
                      >
                        <div className="card-grey-capsule">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', paddingTop: '10px' }}>
                            <h3 className="plan-title">{p.label}</h3>
                            <div className="plan-sub">{p.sub}</div>
                          </div>

                          <div style={{ width: '100%' }}>
                            <button 
                              type="button" 
                              className="plan-cta" 
                              onClick={(ev) => { 
                                ev.stopPropagation(); 
                                setAccountType(p.key); 
                                setSelectedPlan(p.key); 
                                setFlipped(p.key); 
                              }}
                            >
                              {p.cta}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* BACK OF THE CARD (Registration Form) */}
                      <div className="card-back" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1.5px solid #e2e8f0' }}>
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: p.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {p.sub}
                            </span>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: '#0f172a' }}>{p.label}</h3>
                          </div>
                        </div>

                        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '9px', flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
                          <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="NOMBRE(S)" style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#111', fontSize: '12px', outline: 'none' }} />
                          <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="APELLIDOS" style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#111', fontSize: '12px', outline: 'none' }} />
                          <input required value={email} onChange={e => setEmail(e.target.value)} placeholder="CORREO" type="email" style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#111', fontSize: '12px', outline: 'none' }} />
                          <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="TELÉFONO" type="tel" style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#111', fontSize: '12px', outline: 'none' }} />
                          <input required value={password} onChange={e => setPassword(e.target.value)} placeholder="CONTRASEÑA" type="password" style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#111', fontSize: '12px', outline: 'none' }} />
                          <input required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="CONFIRMAR CONTRASEÑA" type="password" style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#111', fontSize: '12px', outline: 'none' }} />
                          
                          {(p.key === 'owner_business' || p.key === 'contratista') && (
                            <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nombre de tu empresa / negocio" type="text" style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#111', fontSize: '12px', outline: 'none' }} />
                          )}
                          
                          {(p.key === 'client' || p.key === 'technician' || p.key === 'admin_propiedades') && (
                            <input value={companyCode} onChange={e => setCompanyCode(e.target.value)} placeholder="Código de empresa (Opcional)" type="text" style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#111', fontSize: '12px', outline: 'none' }} />
                          )}

                          {(p.key === 'technician' || p.key === 'tecnico_red') && (
                            <select 
                              value={selectedSpecialties[0] || 'Electricidad'}
                              onChange={e => setSelectedSpecialties([e.target.value])}
                              style={{ padding: '9px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#111', fontSize: '12px', outline: 'none' }}
                            >
                              {ESPECIALIDADES_CATALOGO.map(spec => (
                                <option key={spec.id} value={spec.name}>{spec.icon} {spec.name}</option>
                              ))}
                            </select>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                            <ReCAPTCHA
                              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LfHnl4tAAAAAIosLgj18bnFZ4aqpQ0jBXpnJs_Q"}
                              onChange={handleCaptchaChange}
                              size="compact"
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                            <button type="submit" disabled={isLoading} style={{ flex: 1, padding: '10px 14px', borderRadius: '14px', background: '#f26522', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '13px' }}>
                              {isLoading ? '...' : 'Registrar'}
                            </button>
                            <button type="button" onClick={(ev) => { ev.stopPropagation(); setFlipped(null); }} style={{ padding: '10px 14px', borderRadius: '14px', background: '#e2e8f0', color: '#334155', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              {message && (
                <p
                  style={{
                    width: '100%',
                    margin: 0,
                    padding: '14px',
                    borderRadius: '18px',
                    backgroundColor: message.includes('Error') ? 'rgba(244, 67, 54, 0.16)' : 'rgba(76, 175, 80, 0.16)',
                    color: message.includes('Error') ? '#ff6b6b' : '#69db7c',
                    border: message.includes('Error') ? '1px solid rgba(244, 67, 54, 0.35)' : '1px solid rgba(76, 175, 80, 0.35)',
                    textAlign: 'center',
                    fontWeight: '700'
                  }}
                >
                  {message}
                </p>
              )}

              <div style={{ fontSize: '0.95rem', textAlign: 'center' }}>
                <span style={{ color: '#aaa' }}>¿Ya tienes una cuenta? </span>
                <span
                  onClick={() => navigate('/')}
                  style={{ color: '#f26522', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                >
                  Iniciar Sesión
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientRegister;