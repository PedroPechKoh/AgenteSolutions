import React, { useState } from 'react';
import axios from 'axios';
import { Copy, Upload, ShieldCheck, X, CheckCircle2, Loader2 } from 'lucide-react';
import '../../styles/Cliente/Pagos.css';

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

  const [metodoPago, setMetodoPago] = useState('tarjeta'); // tarjeta, mercadopago, transferencia

  const handleUploadComprobante = async () => {
    if (!file) return;
    
    try {
      setSubiendo(true);

      const formData = new FormData();
      formData.append('receipt_file', file);
      
      const token = localStorage.getItem('agente_token');
      
      // Conectar con el backend para guardar el recibo y cambiar estado
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacion.id}/pago`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Comprobante subido y notificado");
      
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

  const handleSimularPago = () => {
    setSubiendo(true);
    setTimeout(() => {
      setSubiendo(false);
      setPagoCompletado(true);
      setTimeout(() => onClose(), 3000);
    }, 2000);
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
      <div className="payment-content-card" style={{ position: 'relative', maxWidth: '900px', width: '90%', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="tp-close-modal-btn" style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }} onClick={onClose}><X size={24} color="#333" /></button>
        
        <div className="payment-header-txt" style={{ marginBottom: '20px', textAlign: 'center', padding: '20px 20px 0' }}>
          <h1>Finalizar Pago</h1>
          <p>Selecciona tu método de pago preferido para la cotización #{cotizacion?.folio || cotizacion?.id}.</p>
          <div className="payment-total-pill" style={{ display: 'inline-block', marginTop: '15px', fontSize: '1.2rem' }}>
            <span>Monto a pagar: </span>
            <strong>${Number(cotizacion?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* Pestañas de Método de Pago */}
        <div style={{ display: 'flex', borderBottom: '2px solid #eee', marginBottom: '20px', padding: '0 20px' }}>
          <button 
            onClick={() => setMetodoPago('tarjeta')}
            style={{ flex: 1, padding: '15px', background: 'none', border: 'none', borderBottom: metodoPago === 'tarjeta' ? '3px solid #F26522' : '3px solid transparent', color: metodoPago === 'tarjeta' ? '#F26522' : '#666', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.3s' }}
          >
            💳 Tarjeta
          </button>
          <button 
            onClick={() => setMetodoPago('mercadopago')}
            style={{ flex: 1, padding: '15px', background: 'none', border: 'none', borderBottom: metodoPago === 'mercadopago' ? '3px solid #009ee3' : '3px solid transparent', color: metodoPago === 'mercadopago' ? '#009ee3' : '#666', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.3s' }}
          >
            🤝 MercadoPago
          </button>
          <button 
            onClick={() => setMetodoPago('transferencia')}
            style={{ flex: 1, padding: '15px', background: 'none', border: 'none', borderBottom: metodoPago === 'transferencia' ? '3px solid #1b8a5a' : '3px solid transparent', color: metodoPago === 'transferencia' ? '#1b8a5a' : '#666', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.3s' }}
          >
            🏦 Transferencia
          </button>
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          
          {/* VISTA TARJETA */}
          {metodoPago === 'tarjeta' && (
            <div style={{ maxWidth: '500px', margin: '0 auto', background: '#f8f9fa', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} color="#10b981" /> Pago Seguro con Tarjeta
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Nombre en la tarjeta</label>
                  <input type="text" placeholder="Ej. Juan Pérez" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Número de tarjeta</label>
                  <input type="text" placeholder="0000 0000 0000 0000" maxLength="19" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', letterSpacing: '2px' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Vencimiento (MM/AA)</label>
                    <input type="text" placeholder="MM/AA" maxLength="5" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>CVV</label>
                    <input type="password" placeholder="123" maxLength="4" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                  </div>
                </div>

                <button 
                  onClick={handleSimularPago}
                  disabled={subiendo}
                  style={{ width: '100%', background: '#F26522', color: 'white', padding: '15px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                >
                  {subiendo ? <Loader2 className="spin-icon" size={20} /> : `Pagar $${Number(cotizacion?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                </button>
              </div>
            </div>
          )}

          {/* VISTA MERCADOPAGO */}
          {metodoPago === 'mercadopago' && (
            <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
              <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icon-1024.png" alt="MercadoPago" style={{ height: '80px', marginBottom: '20px' }} />
              <h3 style={{ color: '#334155', marginBottom: '10px' }}>Paga de forma rápida y segura</h3>
              <p style={{ color: '#64748b', marginBottom: '30px' }}>Serás redirigido al portal de MercadoPago para completar tu transacción.</p>
              
              <button 
                onClick={handleSimularPago}
                style={{ width: '100%', background: '#009ee3', color: 'white', padding: '15px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 14px rgba(0, 158, 227, 0.4)' }}
              >
                Pagar con MercadoPago
              </button>
            </div>
          )}

          {/* VISTA TRANSFERENCIA (ORIGINAL) */}
          {metodoPago === 'transferencia' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
              {/* Lado Izquierdo: Datos Fiscales */}
              <div className="payment-side-info" style={{ flex: 1, minWidth: '300px' }}>
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
              </div>

              {/* Lado Derecho: Subida de archivo */}
              <div className="payment-side-action" style={{ flex: 1, minWidth: '300px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1e293b' }}>Sube tu Comprobante</h2>
                
                <div 
                  className={`upload-box-area ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => setIsPhotoMenuOpen(true)}
                  style={{ cursor: 'pointer', minHeight: '200px' }}
                >
                  <input 
                    type="file" 
                    id="pago-evidence-camera" 
                    hidden 
                    onChange={handleFileChange}
                    accept=".pdf,image/*"
                    capture="environment"
                  />
                  <input 
                    type="file" 
                    id="pago-evidence-gallery" 
                    hidden 
                    onChange={handleFileChange}
                    accept=".pdf,image/*"
                  />
                  
                  <div className="upload-label-content">
                    {file ? (
                      <div className="file-ready">
                        {file.type && file.type.startsWith('image/') ? (
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt="Preview" 
                            style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', objectFit: 'contain', marginBottom: '10px' }} 
                          />
                        ) : (
                          <CheckCircle2 size={40} className="success-icon" style={{ color: '#10b981', marginBottom: '10px' }} />
                        )}
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{file.name}</p>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Archivo listo</span>
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
                  </div>
                </div>

                <div className="security-tag" style={{ marginTop: '15px', marginBottom: '15px' }}>
                  <ShieldCheck size={16} color="#10b981" />
                  <span>Verificación segura por el Administrador</span>
                </div>

                <button 
                  className={`btn-send-payment ${subiendo ? 'loading' : ''}`} 
                  disabled={!file || subiendo}
                  onClick={handleUploadComprobante}
                  style={{ width: '100%', padding: '15px', background: !file ? '#cbd5e1' : '#1b8a5a', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: !file ? 'not-allowed' : 'pointer', transition: 'background 0.3s' }}
                >
                  {subiendo ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <Loader2 className="spin-icon" size={20} /> Enviando...
                    </span>
                  ) : 'Confirmar y Enviar Comprobante'}
                </button>
              </div>
            </div>
          )}

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