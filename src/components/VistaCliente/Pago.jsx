import React, { useState } from 'react';
import axios from 'axios';
import { Copy, Upload, ShieldCheck, X, CheckCircle2, Loader2 } from 'lucide-react';
import '../../styles/Cliente/Pagos.css';

const Pago = ({ cotizacion, onClose }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);

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

  const handleUploadComprobante = async () => {
    if (!file) return;
    
    try {
      setSubiendo(true);

      // Subir a Cloudinary (la misma cuenta que usas para fotos de propiedades)
      const cloudinaryUrl = "https://api.cloudinary.com/v1_1/dcj5rcpi8/upload"; 
      const cloudinaryPreset = "bienes_raices"; // Asumiendo que es el que usas, o podemos mandar formData crudo

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'bienes_raices'); 
      formData.append('folder', 'comprobantes_pago');

      const res = await axios.post(cloudinaryUrl, formData);
      const fileUrl = res.data.secure_url;

      // Conectar con el backend para guardar el recibo y cambiar estado
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacion.id}/pago`, {
        payment_receipt_path: fileUrl
      });
      
      console.log("Comprobante subido y notificado:", fileUrl);
      
      setPagoCompletado(true);
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error("Error subiendo el comprobante:", error);
      alert("Hubo un error al subir el comprobante. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  };

  if (pagoCompletado) {
    return (
      <div className="tp-modal-overlay" style={{ zIndex: 100000 }}>
        <div className="payment-content-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '50px 20px' }}>
          <CheckCircle2 size={64} color="#1b8a5a" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ color: '#1b8a5a', marginBottom: '10px' }}>¡Comprobante Enviado!</h2>
          <p style={{ color: '#666' }}>Tu pago está en revisión. El Administrador validará el comprobante pronto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-modal-overlay" style={{ zIndex: 100000 }}>
      <div className="payment-content-card" style={{ position: 'relative', maxWidth: '900px', width: '90%', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="tp-close-modal-btn" style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><X size={24} color="#333" /></button>
        
        {/* Lado Izquierdo: Datos Fiscales */}
        <div className="payment-side-info">
         
          
          <div className="payment-header-txt">
            <h1>Finalizar Pago</h1>
            <p>Realiza tu transferencia y sube el comprobante para activar tu servicio.</p>
          </div>

          <div className="fiscal-details-container">
            <div className="fiscal-item">
              <label>Banco</label>
              <p>Banorte</p>
            </div>
            <div className="fiscal-item">
              <label>Beneficiario</label>
              <p>Jorge Ernesto Vallarta Sosa</p>
            </div>
            <div className="fiscal-item highlighted-field">
              <label>Cuenta</label>
              <div className="copy-box">
                <strong>1195878544</strong>
                <button className="copy-btn-icon" onClick={() => navigator.clipboard.writeText('1195878544')}><Copy size={16} /></button>
              </div>
            </div>
            <div className="fiscal-item highlighted-field">
              <label>CLABE Interbancaria</label>
              <div className="copy-box">
                <strong>072 910 0119 5878 5445</strong>
                <button className="copy-btn-icon" onClick={() => navigator.clipboard.writeText('072910011958785445')}><Copy size={16} /></button>
              </div>
            </div>
            <div className="fiscal-item">
              <label>Referencia</label>
              <p>{cotizacion?.folio ? `COT-${cotizacion.folio}` : 'Pago de Servicio'}</p>
            </div>
          </div>

          <div className="payment-total-pill">
            <span>Monto a depositar:</span>
            <strong>${Number(cotizacion?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* Lado Derecho: Subida de archivo */}
        <div className="payment-side-action">
          <div className="step-indicator">Paso 2 de 2</div>
          <h2>Confirmar Comprobante</h2>
          
          <div 
            className={`upload-box-area ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="file-upload" 
              className="hidden-input" 
              onChange={handleFileChange}
              accept=".pdf,image/*"
            />
            
            <label htmlFor="file-upload" className="upload-label-content">
              {file ? (
                <div className="file-ready">
                  <CheckCircle2 size={48} className="success-icon" />
                  <p>{file.name}</p>
                  <span>Archivo seleccionado correctamente</span>
                </div>
              ) : (
                <>
                  <div className="upload-circle-icon">
                    <Upload size={32} />
                  </div>
                  <h3>Arrastra tu comprobante</h3>
                  <p>o haz clic para buscar el archivo</p>
                  <span className="file-types">Formatos: PDF, JPG, PNG</span>
                </>
              )}
            </label>
          </div>

          <div className="security-tag">
            <ShieldCheck size={16} />
            <span>Transacción segura validada por Agente Solutions</span>
          </div>

          <button 
            className={`btn-send-payment ${subiendo ? 'loading' : ''}`} 
            disabled={!file || subiendo}
            onClick={handleUploadComprobante}
          >
            {subiendo ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <Loader2 className="spin-icon" size={20} /> Subiendo archivo...
              </span>
            ) : 'Enviar Comprobante'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Pago;