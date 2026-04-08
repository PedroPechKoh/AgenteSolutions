import React, { useState } from 'react';
import '../styles/DetalleZona.css';
import { Plus, Edit3, Trash2, ArrowLeft, Settings, User, Send, X, Home } from 'lucide-react';
import DetalleHabitacion from './DetalleHabitacion';

const DetalleZona = ({ zonaNombre }) => {
  // Estados
  const [habitacionActiva, setHabitacionActiva] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevaHabitacion, setNuevaHabitacion] = useState("");

  const items = [
    { id: 1, nombre: "HABITACION PRINCIPAL", img: "https://via.placeholder.com/60x40" },
    { id: 2, nombre: "HABITACION 2", img: "https://via.placeholder.com/60x40" },
    { id: 3, nombre: "HABITACION 3", img: "https://via.placeholder.com/60x40" },
  ];

  // Navegación interna a detalle de habitación
  if (habitacionActiva) {
    return (
      <DetalleHabitacion 
        habitacionNombre={habitacionActiva.nombre} 
        alVolver={() => setHabitacionActiva(null)} 
      />
    );
  }

  return (
    <div className="dz-body-wrapper">
      {/* BURBUJAS SUPERIORES */}
      <div className="dz-bubbles-container">
        <div className="dz-info-pill">FOLIO <strong>1234</strong></div>
        <div className="dz-info-pill">ID PROPIEDAD <strong>JDJF123</strong></div>
        <div className="dz-info-pill">TECNICO <strong>MARIO</strong></div>
      </div>

      {/* TARJETA PRINCIPAL */}
      <div className="dz-main-card">
        <div className="dz-controls-row">
          <div className="dz-category-tag">
            CATEGORIA: <strong>{zonaNombre || "BAÑOS"}</strong> <Settings size={14} />
          </div>
          
          <div className="dz-actions-group">
            <button className="dz-btn-plus">
              <Send size={20} /> ENVIAR
            </button>
            <button className="dz-btn-save">
              GUARDAR
            </button>
            {/* BOTÓN MÁS PARA ABRIR MODAL */}
            <button className="dz-btn-save" onClick={() => setIsModalOpen(true)}>
              +
            </button>
          </div>

          <div className="dz-date-tag">
            FECHA DE REGISTRO <strong>06-02-2026</strong>
          </div>
        </div>

        {/* LISTA DE HABITACIONES */}
        <div className="dz-list-container">
          {items.map((item) => (
            <div key={item.id} className="dz-item-row">
              <div className="dz-item-left">
                <div className="dz-thumb-box">
                  <img src={item.img} alt="thumb" />
                </div>
                <span className="dz-item-name">{item.nombre}</span>
              </div>
              <div className="dz-item-right">
                <Edit3 
                  size={20} 
                  className="dz-icon-edit" 
                  onClick={() => setHabitacionActiva(item)} 
                />
                <Trash2 size={20} className="dz-icon-delete" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL REDISEÑADO */}
      {isModalOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            {/* Encabezado del Modal */}
            <div className="modal-header-gradient">
              <div className="header-content">
                <Home size={22} color="#fff" />
                <h2>NUEVA HABITACIÓN</h2>
              </div>
            </div>
            
            {/* Cuerpo del Modal */}
            <div className="modal-body">
              <div className="input-container-modern">
                <label>NOMBRE DE LA HABITACIÓN / ÁREA</label>
                <input 
                  type="text" 
                  value={nuevaHabitacion}
                  onChange={(e) => setNuevaHabitacion(e.target.value)}
                  placeholder="Escribe el nombre aquí..."
                  autoFocus
                />
              </div>
            </div>

            {/* Acciones del Modal */}
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                CANCELAR
              </button>
              <button 
                className="btn-confirm-grad" 
                onClick={() => {
                  console.log("Nueva habitación:", nuevaHabitacion);
                  setIsModalOpen(false);
                  setNuevaHabitacion("");
                }}
              >
                AGREGAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleZona;