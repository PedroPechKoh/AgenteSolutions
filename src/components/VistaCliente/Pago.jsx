import React, { useState } from 'react';
import { Copy, Upload, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import '../../styles/Cliente/Pagos.css';

const Pago = ({ cotizacion, onClose }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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
              <p>BBVA México</p>
            </div>
            <div className="fiscal-item">
              <label>Beneficiario</label>
              <p>Agente Solutions S.A. de C.V.</p>
            </div>
            <div className="fiscal-item highlighted-field">
              <label>CLABE Interbancaria</label>
              <div className="copy-box">
                <strong>012 345 6789 0123 4567</strong>
                <button className="copy-btn-icon"><Copy size={16} /></button>
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

          <button className="btn-send-payment" disabled={!file}>
            Enviar Comprobante
          </button>
        </div>

      </div>
    </div>
  );
};

export default Pago;