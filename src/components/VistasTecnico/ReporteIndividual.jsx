import React from 'react';
import { useNavigate } from 'react-router-dom';
import "../../styles/TecnicoStyles/ReporteIndividual.css";
import { Image as ImageIcon } from 'lucide-react';

const ReporteIndividual = () => {
  const navigate = useNavigate();

  const reporte = {
    titulo: "REPORTE",
    descripcion: "",
    imagen: null
  };

  return (
    <>
      <div className="report-detail-body">
        <div className="report-main-card">
          <div className="report-inner-content">
            
            <h3 className="report-label">{reporte.titulo}</h3>

            <div className="report-flex-container">
              
              {/* IMAGEN */}
              <div className="report-image-box">
                {reporte.imagen ? (
                  <img
                    src={reporte.imagen}
                    alt="Imagen del reporte"
                    className="report-image-preview"
                  />
                ) : (
                  <ImageIcon size={100} strokeWidth={1} color="#333" />
                )}
              </div>

              {/* INFORMACIÓN */}
              <div className="report-info-box">
                {reporte.descripcion ? (
                  <p>{reporte.descripcion}</p>
                ) : (
                  <p className="report-empty-text">
                    No hay información disponible para este reporte.
                  </p>
                )}
              </div>
            </div>

            {/* BOTÓN */}
            <div className="report-footer">
              <button
                type="button"
                className="btn-guardar-reporte"
                onClick={() => navigate(-1)}
              >
                GUARDAR
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default ReporteIndividual;