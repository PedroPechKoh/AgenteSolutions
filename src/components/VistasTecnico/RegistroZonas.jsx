import React, { useState } from 'react';
import '../styles/RegistroZonas.css';
import { Plus, Send, X, Save, ImageIcon } from 'lucide-react';
// Importamos el nuevo componente que creamos antes
import DetalleZona from './DetalleZona'; 

const RegistroZonas = () => {
  const [modalAbierto, setModalAbierto] = useState(false);
  // Estado para saber qué zona estamos viendo en detalle
  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);

  const zonas = [
    { id: 1, nombre: "HABITACIONES", img: "https://images.homify.com/v1452164048/p/photo/image/1227856/3.jpg" },
    { id: 3, nombre: "BAÑOS", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHqTqWv4xOr07r2cVNQoakAioNav5Ew8cBcQ&s" },
    { id: 4, nombre: "COMEDOR", img: "https://d38qrl83hrqn1t.cloudfront.net/media/catalog/product/cache/e5313a059d82e47a0dd0c73b13afb6be/m/e/mesa-comedor-rectangular-240x120-creta-tzalam-con-sillas-arena-decorado-dc-11.jpg" },
    { id: 5, nombre: "COCINA", img: "https://nectali.net/wp-content/uploads/2024/05/cocina-con-isla-nectali-7.jpeg" },
    { id: 6, nombre: "PATIO", img: "https://images.homify.com/v1467211586/p/photo/image/1564951/65_feltrin_carminati_w98806_1.jpg" },
    { id: 7, nombre: "ENTRADA", img: "https://img.freepik.com/foto-gratis/sala-estar-lujo-estanteria-cerca-estanteria_105762-2224.jpg?semt=ais_rp_progressive&w=740&q=80" },
  ];


  if (zonaSeleccionada) {
    return (
      <DetalleZona 
        zonaNombre={zonaSeleccionada.nombre} 
        alVolver={() => setZonaSeleccionada(null)} 
      />
    );
  }

  return (
    <div className="rz-body-wrapper">
      <div className="rz-top-info-row">
        <div className="rz-bubbles-group">
          <div className="rz-bubble-info">
            <strong className="rz-bubble-value">FOLIO 1234</strong>
          </div>
        </div>

        <div className="rz-action-buttons">
          <button className="rz-btn-main orange-gradient">
            <Send size={20} /> ENVIAR
          </button>
          <button className="rz-btn-main purple-gradient" onClick={() => setModalAbierto(true)}>
            <Plus size={24} strokeWidth={3} /> AGREGAR
          </button>
        </div>
      </div>

      <div className="rz-scrollable-grid">
        {zonas.map((zona) => (
          <div key={zona.id} className="rz-card-dark">
            <div className="rz-image-holder">
              <img src={zona.img} alt={zona.nombre} />
            </div>
            <div className="rz-card-footer">
              <span className="rz-zona-pill">{zona.nombre}</span>
              {/* VINCULACIÓN: Al dar clic, guardamos la zona en el estado */}
              <button 
                className="rz-btn-ver" 
                onClick={() => setZonaSeleccionada(zona)}
              >
                VER
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- ESTRUCTURA DEL MODAL --- */}
      {modalAbierto && (
        <div className="rz-modal-overlay">
          <div className="rz-modal-content">
            <div className="rz-modal-header">
              <h2 className="rz-modal-title">DETALLES</h2>
              <div className="rz-modal-actions">
                <button className="rz-btn-action orange-gradient" onClick={() => setModalAbierto(false)}>
                  <Save size={18} /> GUARDAR
                </button>
                <button className="rz-btn-action gray-gradient" onClick={() => setModalAbierto(false)}>
                  <X size={18} /> CANCELAR
                </button>
              </div>
            </div>

            <div className="rz-modal-body">
              <div className="rz-input-group">
                <label>NOMBRE DE LA ZONA</label>
                <input type="text" placeholder="Ej. SALA DE ESTAR..." />
              </div>

              <div className="rz-upload-container">
                <div className="rz-upload-placeholder">
                  <ImageIcon size={50} color="#999" />
                  <span>SUBIR IMAGEN DE LA ZONA</span>
                  <button className="rz-btn-upload">SELECCIONAR ARCHIVO</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroZonas;