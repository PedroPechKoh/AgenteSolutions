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
  const [accountType, setAccountType] = useState("client"); // 'client' (3) o 'technician' (2)
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

    setIsLoading(true);

    try {
      const roleId = accountType === "client" ? 3 : 2;
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
        }
      );
      
      setIsLoading(false);

      if (res.data.status === "pending_approval" || roleId === 2) {
        setIsPendingApproval(true);
      } else {
        setMessage("¡Registro exitoso! Redirigiendo al inicio de sesión...");
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
      <img
        src={backgroundSettings.appLogo || Logo4}
        alt="Agente Solutions"
        className="logo-top-left"
        style={{ objectFit: 'contain' }}
      />
      <div className="decoration-layer">
        <div className="stripe-top"></div>
        <div className="stripe-bottom"></div>
        <div className="shape-right"></div>
      </div>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px"
        }}
      >
        {isPendingApproval ? (
          <div className="form-section" style={{ maxWidth: "550px", width: "100%", padding: "40px", textAlign: "center", borderRadius: "20px", backgroundColor: "rgba(20, 20, 20, 0.95)", border: "2px solid #f26522", boxShadow: "0 0 30px rgba(242, 101, 34, 0.3)" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "rgba(242, 101, 34, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto", border: "1px solid #f26522" }}>
              <Clock size={45} color="#f26522" />
            </div>
            <h2 style={{ fontSize: "2rem", color: "#fff", marginBottom: "15px", fontWeight: "900", fontStyle: "italic" }}>
              ¡PERFIL EN REVISIÓN!
            </h2>
            <p style={{ color: "#ddd", fontSize: "1.1rem", lineHeight: "1.6", marginBottom: "25px" }}>
              Tu registro como <strong>Técnico</strong> se ha completado con éxito. Por seguridad, tu perfil está en la sala de espera y debe ser revisado y autorizado por el <strong>Administrador de tu empresa</strong> para poder iniciar sesión.
            </p>
            <div style={{ padding: "18px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", marginBottom: "25px", borderLeft: "4px solid #f26522", textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#eee" }}>
                <strong style={{ color: "#f26522" }}>Empresa / Código:</strong> {companyCode || "General / Root"}<br />
                <strong style={{ color: "#f26522" }}>Estado actual:</strong> <span style={{ color: "#4CAF50", fontWeight: "bold" }}>⏳ Pendiente de aprobación</span>
              </p>
            </div>
            <button
              type="button"
              className="btn-login"
              onClick={() => navigate("/")}
              style={{ width: "100%", padding: "15px", fontSize: "1.2rem" }}
            >
              VOLVER AL INICIO DE SESIÓN
            </button>
          </div>
        ) : (
          <form
            className="form-section"
            onSubmit={handleRegister}
            style={{ maxWidth: "680px", width: "100%", padding: "20px" }}
          >
            <h2
              className="form-title"
              style={{ fontSize: "1.8rem", marginBottom: "20px", textAlign: "center" }}
            >
              CREAR CUENTA <i className="fas fa-chess-queen-alt"></i>
            </h2>

            {/* Selector de Tipo de Cuenta */}
            <div style={{ display: "flex", gap: "15px", marginBottom: "25px", width: "100%" }}>
              <button
                type="button"
                onClick={() => setAccountType("client")}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "50px",
                  border: accountType === "client" ? "3px solid #f26522" : "3px solid transparent",
                  backgroundColor: accountType === "client" ? "#f26522" : "#cfd3d8",
                  color: accountType === "client" ? "#fff" : "#333333",
                  fontWeight: "900",
                  fontStyle: "italic",
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.3s",
                  boxShadow: accountType === "client" ? "0 0 15px rgba(242, 101, 34, 0.6)" : "none"
                }}
              >
                <UserCheck size={20} /> SOY CLIENTE
              </button>
              <button
                type="button"
                onClick={() => setAccountType("technician")}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "50px",
                  border: accountType === "technician" ? "3px solid #f26522" : "3px solid transparent",
                  backgroundColor: accountType === "technician" ? "#f26522" : "#cfd3d8",
                  color: accountType === "technician" ? "#fff" : "#333333",
                  fontWeight: "900",
                  fontStyle: "italic",
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.3s",
                  boxShadow: accountType === "technician" ? "0 0 15px rgba(242, 101, 34, 0.6)" : "none"
                }}
              >
                <Briefcase size={20} /> QUIERO SER TÉCNICO
              </button>
            </div>

            {/* Selector de Empresa / Autónomo */}
            <div className="input-group" style={{ marginBottom: "15px", width: "100%" }}>
              <Building2 size={22} className="input-icon" />
              <select
                className="custom-input"
                value={selectedTenantId}
                onChange={handleTenantSelect}
                style={{ paddingLeft: "55px", cursor: "pointer" }}
              >
                <option value="">-- SELECCIONA TU EMPRESA O PROFESIONAL --</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row-responsive">
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <User size={20} className="input-icon" />
                <input
                  type="text"
                  placeholder="NOMBRE(S)"
                  className="custom-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ paddingLeft: "55px" }}
                  required
                />
              </div>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <input
                  type="text"
                  placeholder="APELLIDOS"
                  className="custom-input"
                  style={{ paddingLeft: "15px" }}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row-responsive" style={{ marginTop: "15px" }}>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  placeholder="CORREO ELECTRONICO"
                  className="custom-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: "55px" }}
                  required
                />
              </div>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <Phone size={20} className="input-icon" />
                <input
                  type="tel"
                  placeholder="TELEFONO"
                  className="custom-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ paddingLeft: "55px" }}
                  required
                />
              </div>
            </div>

            <div className="form-row-responsive" style={{ marginTop: "15px" }}>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <Lock size={20} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="CONTRASEÑA"
                  className="custom-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: "55px" }}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <Lock size={20} className="input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="CONFIRMA CONTRASEÑA"
                  className="custom-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: "55px" }}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "20px 0",
              }}
            >
              <ReCAPTCHA
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                onChange={handleCaptchaChange}
              />
            </div>

            <button type="submit" className="btn-login" disabled={isLoading}>
              {isLoading ? "Creando cuenta..." : "REGISTRAR"}
            </button>

            {message && (
              <p
                className={`msg-box ${message.includes("Error") ? "error" : "success"}`}
                style={{ marginTop: "15px" }}
              >
                {message}
              </p>
            )}

            <div
              style={{
                marginTop: "25px",
                textAlign: "center",
                fontSize: "0.95rem",
              }}
            >
              <span style={{ color: "#666" }}>¿Ya tienes una cuenta? </span>
              <span
                onClick={() => navigate("/")}
                style={{
                  color: "#FF6600",
                  cursor: "pointer",
                  fontWeight: "bold",
                  textDecoration: "underline",
                }}
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