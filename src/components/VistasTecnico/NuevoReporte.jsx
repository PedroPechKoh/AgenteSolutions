import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import "../../styles/TecnicoStyles/ReporteIndividual.css";
import { Camera, ChevronLeft } from 'lucide-react';
import Header from '../Shared/Header';

const NuevoReporte = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const trabajoId = location.state?.trabajoId;

  const [imagePreview, setImagePreview] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);

  // Liberar memoria cuando cambie la imagen
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const openPhotoMenu = () => {
    setIsPhotoMenuOpen(true);
  };

  const selectPhotoSource = (source) => {
    if (source === 'camera') {
      cameraRef.current.click();
    } else {
      galleryRef.current.click();
    }
    setIsPhotoMenuOpen(false);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
      setImageFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!descripcion.trim()) {
      alert('La descripción es obligatoria.');
      return;
    }
    if (!imageFile) {
      alert('Debes subir una foto como evidencia.');
      return;
    }
    if (!trabajoId) {
      alert('Error: No se encontró el ID del trabajo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', descripcion);
      formData.append('image', imageFile);

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/servicios/${trabajoId}/reportes`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('¡Reporte guardado con éxito!');
      navigate('/galeria-reportes', { state: { trabajoId } });
    } catch (error) {
      console.error('Error al guardar reporte:', error);
      alert('Ocurrió un error al intentar guardar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="report-detail-body" style={{ marginTop: '20px', flexDirection: 'column' }}>
        {/* BOTÓN REGRESAR NARANJA COMO PIDIÓ EL USUARIO */}
        <div style={{ width: '90%', maxWidth: '1000px', marginBottom: '20px', display: 'flex' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <ChevronLeft size={20} />
            <span>REGRESAR</span>
          </button>
        </div>

        <div className="report-main-card">
          <div className="report-inner-content">
            
            <h3 className="report-label">NUEVO REPORTE</h3>
            
            <div className="report-flex-container">

              {/* IMAGEN */}
              <div 
                className="report-image-box upload-box"
                onClick={openPhotoMenu}
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
                  ref={cameraRef}
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  accept="image/*"
                  capture="environment"
                />
                <input
                  type="file"
                  ref={galleryRef}
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
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.6 : 1 }}
              >
                {isSubmitting ? 'SUBIENDO...' : 'GUARDAR REPORTE'}
              </button>
            </div>

          </div>
        </div>
      </div>
      {/* MODAL DE SELECCIÓN DE FOTO (Estilos heredados de Profile.css) */}
      {isPhotoMenuOpen && (
        <div className="modal-overlay" onClick={() => setIsPhotoMenuOpen(false)}>
          <div className="modal-content photo-menu-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ color: '#ff6600', borderBottom: '2px solid #EEEEEE' }}>Subir Evidencia</h3>
            <div className="photo-menu-actions">
              <button className="btn-menu-action" onClick={() => selectPhotoSource('camera')}>
                📷 Tomar Foto
              </button>
              <button className="btn-menu-action" onClick={() => selectPhotoSource('gallery')}>
                🖼️ Elegir de la Galería
              </button>
              <button className="btn-menu-action btn-menu-cancel" onClick={() => setIsPhotoMenuOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NuevoReporte;