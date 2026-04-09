import React from 'react';
import { useNavigate } from 'react-router-dom';
import "../../styles/TecnicoStyles/GaleriaReportes.css";
import { Plus } from 'lucide-react';

const GaleriaReportes = () => {
  const navigate = useNavigate();

  const reportes = [
    { id: 1, img: "https://cdn-es.checklistfacil.com/estrategias-de-mantenimiento.webp", titulo: "REPORTE" },
    { id: 2, img: "https://todoferreteria.com.mx/wp-content/uploads/2022/12/plomero-entrada-01.png", titulo: "REPORTE" },
    { id: 3, img: "https://alfaservicioscr.com/wp-content/uploads/2024/07/Mantenimiento-electrico.webp", titulo: "REPORTE" },
  ];

  return (
    <>
      {/* BOTÓN SUPERIOR DERECHO */}
      <div className="gallery-top-actions">
        <button
          type="button"
          className="btn-add-photo"
          onClick={() => navigate('/nuevo-reporte')}
        >
          <Plus size={26} strokeWidth={3} />
        </button>
      </div>

      <div className="galeria-body">

        {/* ID PROPIEDAD */}
        <div className="id-property-tag">
          <span>ID PROPIEDAD:</span>
          <strong>JDJF123</strong>
        </div>

        {/* GRID */}
        <div className="gallery-grid">
          {reportes.map((reporte) => (
            <div key={reporte.id} className="gallery-card">
              
              <div className="card-image-container">
                <img 
                  src={reporte.img} 
                  alt={`Reporte ${reporte.id}`} 
                  loading="lazy"
                />
              </div>

              <div className="card-footer">
                <span className="footer-title">{reporte.titulo}</span>

                <button
                  type="button"
                  className="btn-footer-ver"
                  onClick={() => navigate(`/reporte-individual/${reporte.id}`)}
                >
                  VER
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </>
  );
};

export default GaleriaReportes;