import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../styles/TecnicoStyles/ReporteIndividual.css";
import { Camera } from 'lucide-react';

const NuevoReporte = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [imageFile, setImageFile] = useState(null);

  // Liberar memoria cuando cambie la imagen
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
      setImageFile(file);
    }
  };

  const handleSubmit = () => {
    if (!descripcion.trim()) {
      alert('La descripción es obligatoria.');
      return;
    }

    const nuevoReporte = {
      descripcion,
      imagen: imageFile,
      fecha: new Date().toISOString()
    };

    console.log('Reporte guardado:', nuevoReporte);

    navigate(-1);
  };

  return (
    <>
      <div className="report-detail-body">
        <div className="report-main-card">
          <div className="report-inner-content">
            
            <h3 className="report-label">NUEVO REPORTE</h3>
            
            <div className="report-flex-container">

              {/* IMAGEN */}
              <div 
                className="report-image-box upload-box"
                onClick={handleImageClick}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview del reporte"
                    className="report-image-preview"
                  />
                ) : (
                  <div className="upload-placeholder">
                    <Camera size={60} strokeWidth={1} />
                    <p>TAP PARA SUBIR FOTO</p>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
              </div>

              {/* DESCRIPCIÓN */}
              <div className="report-info-box">
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Escribe la descripción del reporte aquí..."
                  className="report-textarea"
                />
              </div>

            </div>

            {/* BOTÓN */}
            <div className="report-footer">
              <button
                type="button"
                className="btn-guardar-reporte"
                onClick={handleSubmit}
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

export default NuevoReporte;