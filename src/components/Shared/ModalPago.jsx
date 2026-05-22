import React from 'react';
import { X, CreditCard } from 'lucide-react';
import '../../styles/TecnicoStyles/TrabajoPropiedad.css';

const ModalPago = ({ cotizacion, onClose }) => {
  return (
    <div className="tp-modal-overlay">
      <div className="tp-modal-quotation-card" style={{ maxWidth: '500px' }}>
        <button className="tp-close-modal-btn" onClick={onClose}><X size={24} /></button>
        <div className="tp-modal-q-header" style={{ background: '#1b8a5a', color: 'white', padding: '20px', borderRadius: '15px 15px 0 0' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><CreditCard size={24}/> PAGO DE COTIZACIÓN</h2>
          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Folio: {cotizacion?.folio}</p>
        </div>
        <div className="tp-modal-q-body" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>Vista de Pago</h3>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>Próximamente se integrarán los datos y métodos de pago aquí.</p>
          
          <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '5px' }}>TOTAL A PAGAR</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#1e293b' }}>
              ${Number(cotizacion?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <div className="tp-modal-q-footer">
          <div className="tp-q-footer-actions" style={{ justifyContent: 'center', width: '100%' }}>
            <button className="tp-q-btn-cancel-new" style={{ width: '100%', maxWidth: '200px' }} onClick={onClose}>CERRAR</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPago;
