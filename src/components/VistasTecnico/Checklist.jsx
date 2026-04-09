import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../styles/TecnicoStyles/CheckList.css";

const CheckList = () => {
  const navigate = useNavigate();

  const [seccionActiva, setSeccionActiva] = useState('HERRAMIENTAS');

  const [items, setItems] = useState({
    HERRAMIENTAS: [
      { id: 'h1', nombre: "MULTÍMETRO DIGITAL", completado: false },
      { id: 'h2', nombre: "JUEGO DE DESTORNILLADORES", completado: false },
      { id: 'h3', nombre: "PINZAS DE PUNTA Y CORTE", completado: false }
    ],
    EQUIPO: [
      { id: 'e1', nombre: "CASCO DIELECTRICO", completado: false },
      { id: 'e2', nombre: "GUANTES DE SEGURIDAD", completado: false },
      { id: 'e3', nombre: "CHALECO REFLEJANTE", completado: false }
    ],
    MATERIAL: [
      { id: 'm1', nombre: "CABLE CALIBRE 12", completado: false },
      { id: 'm2', nombre: "CINTA AISLANTE", completado: false },
      { id: 'm3', nombre: "CONECTORES", completado: false }
    ]
  });

  const handleToggle = useCallback((id) => {
    setItems(prev => ({
      ...prev,
      [seccionActiva]: prev[seccionActiva].map(item =>
        item.id === id
          ? { ...item, completado: !item.completado }
          : item
      )
    }));
  }, [seccionActiva]);

  return (
    <>
      <div className="cl-body">

        {/* TABS */}
        <div className="cl-tabs-container">
          {['HERRAMIENTAS', 'EQUIPO', 'MATERIAL'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`cl-tab ${seccionActiva === tab ? 'active' : ''}`}
              onClick={() => setSeccionActiva(tab)}
            >
              {tab === 'EQUIPO' ? 'EQUIPO DE TRABAJO' : tab}
            </button>
          ))}
        </div>

        <div className="cl-main-card">
          <div className="cl-list-wrapper">
            <div className="cl-scroll-area">

              {items[seccionActiva].map((item) => (
                <div
                  key={item.id}
                  className={`cl-item-row ${item.completado ? 'item-checked' : ''}`}
                  onClick={() => handleToggle(item.id)}
                >
                  <div className="cl-check-box">
                    <input
                      type="checkbox"
                      className="cl-native-check"
                      checked={item.completado}
                      readOnly
                    />
                  </div>

                  <div className="cl-item-text">
                    {item.nombre}
                  </div>
                </div>
              ))}

            </div>

            <div className="cl-black-bar"></div>
          </div>
        </div>

        <div className="cl-footer">
          <button
            type="button"
            className="cl-btn-siguiente"
            onClick={() => navigate('/detalleTrabajo')}
          >
            SIGUIENTE
          </button>
        </div>

      </div>
    </>
  );
};

export default CheckList;