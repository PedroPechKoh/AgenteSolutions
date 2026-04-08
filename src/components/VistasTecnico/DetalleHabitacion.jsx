import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importamos el Hook de navegación
import '../styles/DetalleHabitacion.css';
import { ArrowLeft, Settings, User, Plus, ImageIcon } from 'lucide-react';

const DetalleHabitacion = ({ habitacionNombre }) => {
  const navigate = useNavigate(); // Inicializamos navigate

  const categoriasMantenimiento = [
    "ELECTRICO", 
    "ELETRODOMESTICOS", 
    "MUEBLES", 
    "", 
    "", 
    ""
  ];

  // Función para navegar a la ruta de registro definida en tu App.js
  const navegarARegistro = () => {
    navigate('/registro-dz');
  };

  return (
    <div className="dh-body-wrapper">
    
      <div className="dh-info-row">
        <div className="dh-data-pill">FOLIO <strong>123</strong></div>
        <div className="dh-data-pill">ID PROPIEDAD <strong>JSCK123</strong></div>
        <div className="dh-date-box">
          FECHA <br /> DE REGISTRO
        </div>
      </div>

      <div className="dh-main-card">
        <div className="dh-top-grid">
          <div className="dh-name-pill">
            <h3>{habitacionNombre || "HABITACION PRINCIPAL"}</h3>
          </div>

          <div className="dh-image-upload">
            <div className="dh-image-placeholder">
              <ImageIcon size={60} color="#636363" />
            </div>
          </div>

          <div className="dh-description-box">
            <span className="dh-label-italic">DESCRIPCIÓN</span>
            <textarea className="dh-textarea" placeholder="Escribe aquí los detalles..."></textarea>
          </div>
        </div>

        <div className="dh-bottom-grid">
          <div className="dh-mantenimiento-section">
            <div className="dh-mantenimiento-header">
              <span className="dh-label-italic">LISTA DE MANTENIMIENTO</span>
              {/* BOTÓN (+) AHORA USA NAVEGACIÓN DE RUTA */}
              <button 
                className="dh-btn-plus-small" 
                onClick={navegarARegistro}
              >
                <Plus size={24} strokeWidth={4} />
              </button>
            </div>

            <div className="dh-pills-grid">
              {categoriasMantenimiento.map((cat, idx) => (
                <button 
                  key={idx} 
                  className={`dh-category-pill ${cat ? 'active' : 'empty'}`}
                  /* AL HACER CLIC EN LAS CATEGORÍAS NAVEGA A /registro-dz */
                  onClick={() => cat && navegarARegistro()}
                  disabled={!cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="dh-footer-actions">
            {/* BOTÓN GUARDAR REGRESA A LA VISTA DE ZONAS */}
            <button className="dh-btn-save-3d" onClick={() => navigate('/registro-zonas')}>
              GUARDAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleHabitacion;