import React, { useState } from "react";
import axios from "axios";
import { CreditCard, X, ShieldCheck } from "lucide-react";

const ModalCompraEspacios = ({ isOpen, onClose, tenantId, userId }) => {
  const [extraQuantity, setExtraQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handlePagar = async () => {
    const targetId = tenantId || userId || 1;
    if (!targetId) {
      setError("ID de empresa no identificado. Intenta recargar la página.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const origin = window.location.origin;
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/mercadopago/subscription/${targetId}`,
        {
          plan_option: "monthly",
          type: "extra_property",
          quantity: extraQuantity,
          ...(userId ? { user_id: userId } : {})
        },
        { headers: { Origin: origin } }
      );

      const url = import.meta.env.DEV ? res.data.sandbox_init_point : res.data.init_point;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Enlace de pago no devuelto por MercadoPago");
      }
    } catch (e) {
      console.error(e);
      setError("No se pudo generar el enlace de pago con MercadoPago. Intenta de nuevo.");
      setLoading(false);
    }
  };

  const total = (79.99 * extraQuantity).toFixed(2);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#111827",
          border: "2px solid #FF6600",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "460px",
          padding: "28px 24px",
          boxShadow: "0 25px 50px -12px rgba(255, 102, 0, 0.35)",
          position: "relative",
          color: "#fff",
          textAlign: "center",
          animation: "fadeInScale 0.25s ease-out"
        }}
      >
        {/* Botón de Cerrar */}
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "none",
            borderRadius: "50%",
            width: "38px",
            height: "38px",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")}
          title="Cerrar modal"
        >
          <X size={20} />
        </button>

        {/* Ícono superior */}
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            background: "rgba(255, 102, 0, 0.15)",
            border: "2px solid #FF6600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto"
          }}
        >
          <CreditCard size={34} color="#FF6600" />
        </div>

        <h3
          style={{
            fontSize: "1.5rem",
            fontWeight: 900,
            margin: "0 0 6px 0",
            letterSpacing: "-0.5px",
            lineHeight: 1.2
          }}
        >
          🏠 AMPLIACIÓN DE PORTAFOLIO (+{extraQuantity})
        </h3>

        <p
          style={{
            color: "#FF6600",
            fontWeight: 700,
            fontSize: "0.95rem",
            margin: "0 0 16px 0"
          }}
        >
          Adquiere Espacios de Propiedad en tu Plan Personal
        </p>

        <p
          style={{
            color: "#9CA3AF",
            fontSize: "0.88rem",
            lineHeight: 1.6,
            marginBottom: "20px",
            textAlign: "left"
          }}
        >
          Has alcanzado el límite de propiedades activas en tu cuenta. Selecciona cuántos espacios adicionales necesitas agregar para continuar registrando propiedades y asignando técnicos.
        </p>

        {/* Caja de Selector de Cantidad */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "20px"
          }}
        >
          <label
            style={{
              color: "#D1D5DB",
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "block",
              marginBottom: "12px"
            }}
          >
            ¿Cuántos espacios de propiedad necesitas?
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "18px",
              marginBottom: "16px"
            }}
          >
            <button
              type="button"
              onClick={() => setExtraQuantity(Math.max(1, extraQuantity - 1))}
              disabled={loading}
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "50%",
                border: "2px solid #FF6600",
                background: "rgba(255, 102, 0, 0.2)",
                color: "#fff",
                fontWeight: 900,
                fontSize: "1.4rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s, background 0.15s"
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.background = "rgba(255, 102, 0, 0.35)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255, 102, 0, 0.2)")}
            >
              -
            </button>

            <span
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                color: "#FF6600",
                minWidth: "45px",
                display: "inline-block"
              }}
            >
              {extraQuantity}
            </span>

            <button
              type="button"
              onClick={() => setExtraQuantity(extraQuantity + 1)}
              disabled={loading}
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "50%",
                border: "2px solid #FF6600",
                background: "rgba(255, 102, 0, 0.2)",
                color: "#fff",
                fontWeight: 900,
                fontSize: "1.4rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s, background 0.15s"
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.background = "rgba(255, 102, 0, 0.35)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255, 102, 0, 0.2)")}
            >
              +
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#F3F4F6",
              fontSize: "1.05rem",
              fontWeight: 800,
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "14px",
              flexWrap: "wrap",
              gap: "8px"
            }}
          >
            <span>Total a Pagar ({extraQuantity} {extraQuantity === 1 ? "espacio" : "espacios"}):</span>
            <span style={{ color: "#10B981", fontSize: "1.2rem" }}>${total} MXN</span>
          </div>
        </div>

        {error && (
          <p
            style={{
              color: "#EF4444",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              marginBottom: "16px"
            }}
          >
            {error}
          </p>
        )}

        {/* Botón de Pago MercadoPago */}
        <button
          onClick={handlePagar}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "50px",
            border: "none",
            backgroundColor: "#FF6600",
            background: "linear-gradient(135deg, #FF6600 0%, #d94e00 100%)",
            color: "#fff",
            fontWeight: 900,
            fontSize: "1.08rem",
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "0.5px",
            boxShadow: "0 8px 24px rgba(255, 102, 0, 0.45)",
            transition: "transform 0.2s, box-shadow 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px"
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 10px 28px rgba(255, 102, 0, 0.6)";
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 102, 0, 0.45)";
          }}
        >
          {loading ? (
            <span>⌛ GENERANDO ENLACE DE PAGO...</span>
          ) : (
            <>
              <CreditCard size={22} />
              <span>PAGAR ${total} CON MERCADOPAGO</span>
            </>
          )}
        </button>

        <div
          style={{
            marginTop: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            color: "#9CA3AF",
            fontSize: "0.78rem"
          }}
        >
          <ShieldCheck size={15} color="#10B981" />
          <span>Pago 100% seguro y encriptado por MercadoPago</span>
        </div>
      </div>
    </div>
  );
};

export default ModalCompraEspacios;
