import React, { useState } from 'react';
import axios from 'axios';
import { Copy, Upload, ShieldCheck, X, CheckCircle2, Loader2 } from 'lucide-react';
import '../../styles/Cliente/Pagos.css';
import mpLogo from '../../assets/Mercado-Pago.png';

const Pago = ({ cotizacion, onClose }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };


  const handleMercadoPago = async () => {
    try {
      setSubiendo(true);
      const token = localStorage.getItem('agente_token');
      
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacion.id}/mercadopago/preference`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.init_point) {
        // Redirigir al Checkout de MercadoPago
        window.location.href = response.data.init_point;
      } else {
        alert("No se recibió el enlace de pago. Intenta de nuevo.");
        setSubiendo(false);
      }
    } catch (error) {
      console.error("Error iniciando MercadoPago:", error);
      alert("Hubo un error al conectar con MercadoPago. Verifica tus credenciales o intenta más tarde.");
      setSubiendo(false);
    }
  };

  if (pagoCompletado) {
    return (
      <div className="tp-modal-overlay" style={{ zIndex: 100000 }}>
        <div className="payment-content-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '50px 20px' }}>
          <CheckCircle2 size={64} color="#1b8a5a" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ color: '#1b8a5a', marginBottom: '10px' }}>¡Pago Procesado!</h2>
          <p style={{ color: '#666' }}>Tu pago está en revisión. El Administrador lo validará pronto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-modal-overlay" style={{ zIndex: 100000 }}>
      <div className="payment-content-card" style={{ position: 'relative', maxWidth: '600px', width: '90%', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
        <button className="tp-close-modal-btn" style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }} onClick={onClose}><X size={24} color="#333" /></button>
        
        <div className="payment-header-txt" style={{ marginBottom: '20px', textAlign: 'center', padding: '30px 20px 0' }}>
          <h1 style={{ color: '#1e293b', fontSize: '1.5rem', marginBottom: '10px' }}>Finalizar Pago</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Selecciona tu método de pago preferido para la cotización #{cotizacion?.folio || cotizacion?.id}.</p>
          <div className="payment-total-pill" style={{ display: 'inline-block', marginTop: '15px', fontSize: '1.2rem', background: '#F26522', color: 'white', padding: '10px 20px', borderRadius: '12px' }}>
            <span>Monto a pagar: </span>
            <strong>${Number(cotizacion?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        <div style={{ padding: '0 20px 30px' }}>
          <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', padding: '20px' }}>
            <img src={mpLogo} alt="MercadoPago" style={{ height: '40px', objectFit: 'contain', marginBottom: '20px' }} />
            <h3 style={{ color: '#1e293b', marginBottom: '10px' }}>Paga de forma rápida y segura</h3>
            <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '0.9rem' }}>
              Serás redirigido al portal oficial de MercadoPago para completar tu transacción de forma segura. Podrás usar tu tarjeta de crédito, débito, saldo o transferencia.
            </p>
            
            <button 
              onClick={handleMercadoPago}
              disabled={subiendo}
              style={{ width: '100%', background: '#009ee3', color: 'white', padding: '15px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 14px rgba(0, 158, 227, 0.4)' }}
            >
              {subiendo ? <Loader2 className="spin-icon" size={20} /> : <>Pagar con <img src={mpLogo} alt="MercadoPago" style={{ height: '24px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} /></>}
            </button>
          </div>
        </div>
      </div>

      {isPhotoMenuOpen && (
        <div className="tp-modal-overlay" onClick={() => setIsPhotoMenuOpen(false)} style={{ zIndex: 1000000, background: 'rgba(0,0,0,0.8)' }}>
          <div className="tp-modal-content" style={{ maxWidth: '400px', width: '90%', padding: '0', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#F26522', borderBottom: '1px solid #333', margin: 0, padding: '20px', textAlign: 'center', fontSize: '1.2rem' }}>Seleccionar Comprobante</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button 
                onClick={() => { document.getElementById('pago-evidence-camera').click(); setIsPhotoMenuOpen(false); }}
                style={{ padding: '20px', border: 'none', background: 'transparent', color: 'white', fontSize: '1.1rem', cursor: 'pointer', borderBottom: '1px solid #333' }}
              >
                📷 Tomar Foto
              </button>
              <button 
                onClick={() => { document.getElementById('pago-evidence-gallery').click(); setIsPhotoMenuOpen(false); }}
                style={{ padding: '20px', border: 'none', background: 'transparent', color: 'white', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                🖼️ Elegir Archivo / Galería
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pago;