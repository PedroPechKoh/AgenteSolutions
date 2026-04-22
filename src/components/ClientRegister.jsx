import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, Mail, Phone } from "lucide-react";
import "../styles/LoginAgente.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

////Comentario

const ClientRegister = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleCaptchaChange = (value) => {
    setIsCaptchaValid(!!value);
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
      // ✅ CORRECCIÓN: Mandamos first_name y last_name en lugar de name
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/registro-cliente`,
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email,
          phone,
          password,
        }
      );
      
      setMessage("¡Registro exitoso! Redirigiendo al inicio de sesión...");

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      console.error(error.response?.data);
      alert("Error del servidor: " + (error.response?.data?.error || error.response?.data?.message || "Error desconocido"));
    }
  };

  return (
    <div className="main-viewport">
      <img
        src="/src/assets/Logo4.png"
        alt="Agente Solutions"
        className="logo-top-left"
      />
      <div className="decoration-layer">
        <div className="stripe-top"></div>
        <div className="stripe-bottom"></div>
        <div className="shape-right"></div>
      </div>

      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <form
          className="form-section"
          onSubmit={handleRegister}
          style={{ maxWidth: "650px", width: "90%", padding: "30px" }}
        >
          <h2
            className="form-title"
            style={{ fontSize: "1.6rem", marginBottom: "25px" }}
          >
            CREAR CUENTA <i className="fas fa-chess-queen-alt"></i>
          </h2>

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

          <div className="form-row-responsive">
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

          <div className="form-row-responsive">
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
                placeholder="INGRESA NUEVAMENTE LA CONTRASEÑA"
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
              marginBottom: "20px",
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
      </div>
    </div>
  );
};

export default ClientRegister;