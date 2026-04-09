import React, { useState } from 'react'; // Importamos useState para el modal
import "../../styles/TecnicoStyles/RegistroDetalleHabitacion.css";
import { ArrowLeft, Settings, User, Plus, Trash2, X } from 'lucide-react';

const RegistroDetalleHabitacion = ({ habitacionNombre, alVolver }) => {
  // Estado para abrir/cerrar el modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const registros = [
    { marca: "BTICINO", modelo: "QUINZIÑO", cantidad: 5, tipo: "ENCHUFE" },
    { marca: "PHILIPS", modelo: "LED BULB", cantidad: 3, tipo: "FOCOS" },
    { marca: "LEVITON", modelo: "15 AMP DUPLEX", cantidad: 2, tipo: "ENCHUFE" },
  ];

  return (
    <div className="rdh-body-wrapper">
      <div className="rdh-info-row">
        <div className="rdh-data-pill">FOLIO <strong>123</strong></div>
        <div className="rdh-data-pill">ID PROPIEDAD <strong>JSCK123</strong></div>
        <div className="rdh-date-box">FECHA DE REGISTRO</div>
      </div>

      <div className="rdh-main-card">
        <div className="rdh-header-grid">
          <div className="rdh-name-pill-large">
            <h3>{habitacionNombre || "HABITACION PRINCIPAL"}</h3>
          </div>
          <div className="rdh-category-indicator">ELECTRICO</div>
        </div>

        <div className="rdh-content-layout">
          <div className="rdh-table-container">
            <div className="rdh-table-header">
              <span>MARCA</span>
              <span>MODELO</span>
              <span>CANTIDAD</span>
              <span>TIPO</span>
              <span></span>
            </div>
            
            {registros.map((reg, idx) => (
              <div key={idx} className="rdh-table-row">
                <span>{reg.marca}</span>
                <span>{reg.modelo}</span>
                <span>{reg.cantidad}</span>
                <span>{reg.tipo}</span>
                <Trash2 size={20} className="rdh-icon-del" />
              </div>
            ))}
          </div>

          <div className="rdh-side-controls">
            {/* El botón naranja ahora abre el modal */}
            <button className="rdh-btn-plus-sq" onClick={() => setIsModalOpen(true)}>
              <Plus size={35} strokeWidth={4} />+
            </button>
          </div>
        </div>
      </div>

      <div className="rdh-actions-outer">
        <button className="rdh-btn-save-3d">GUARDAR</button>
      </div>

      {/* RENDERIZADO DEL MODAL */}
      {isModalOpen && (
        <div className="rdh-modal-overlay">
          <div className="rdh-modal-content">
            <button className="rdh-modal-close" onClick={() => setIsModalOpen(false)}>
              <X size={24} strokeWidth={3} />
            </button>
            
            <h2 className="rdh-modal-title">NUEVO PRODUCTO</h2>
            
            <div className="rdh-modal-form">
              <div className="rdh-modal-field">
                <label>MARCA</label>
                <input type="text" className="rdh-modal-input" />
              </div>
              <div className="rdh-modal-field">
                <label>MODELO</label>
                <input type="text" className="rdh-modal-input" />
              </div>
              <div className="rdh-modal-field">
                <label>CANTIDAD</label>
                <input type="number" className="rdh-modal-input" />
              </div>
              <div className="rdh-modal-field">
                <label>TIPO</label>
                <input type="text" className="rdh-modal-input" />
              </div>

              <div className="rdh-modal-btn-container">
                <button className="rdh-btn-save-3d modal-btn" onClick={() => setIsModalOpen(false)}>
                  GUARDAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroDetalleHabitacion;