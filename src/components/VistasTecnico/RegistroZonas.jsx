import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Plus, X, Save, ImageIcon, Loader2, ArrowLeft, LayoutGrid } from 'lucide-react';
import DetalleZona from './DetalleZona'; 
import Header from '../Shared/Header';
import "../../styles/TecnicoStyles/RegistroZonas.css";

const RegistroZonas = () => {
  const { curp } = useParams(); 
  const location = useLocation();
  const navigate = useNavigate();
  
  const propertyId = location.state?.id;
  const propertyCurp = curp || location.state?.curp || "S/N";

  // ESTADOS
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
  
  // Formulario
  const [nuevaZona, setNuevaZona] = useState({ nombre: '', descripcion: '' });
  const [selectedFile, setSelectedFile] = useState(null); // Archivo real
  const [previewImg, setPreviewImg] = useState(null);    // Vista previa

  useEffect(() => {
    if (propertyId) {
      fetchZonas();
    }
  }, [propertyId]);

  const fetchZonas = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/properties/${propertyId}/areas`);
      setZonas(res.data);
    } catch (error) {
      console.error("Error al cargar zonas:", error);
    }
  };

  // Manejador de selección de archivo
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImg(URL.createObjectURL(file));
    }
  };

  const guardarZona = async () => {
    if (!nuevaZona.nombre) return alert("Debes asignarle un nombre a la zona.");

    setLoading(true);

    // USAMOS FORMDATA PARA ENVIAR LA IMAGEN
    const formData = new FormData();
    formData.append('property_id', propertyId);
    formData.append('name', nuevaZona.nombre);
    formData.append('description', nuevaZona.descripcion || '');
    
    if (selectedFile) {
      formData.append('image', selectedFile); // 'image' debe coincidir con el backend
    }

    try {
      await axios.post('http://127.0.0.1:8000/api/property-areas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reset y Cerrar
      setModalAbierto(false);
      setNuevaZona({ nombre: '', descripcion: '' });
      setSelectedFile(null);
      setPreviewImg(null);
      fetchZonas(); 
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No se pudo registrar la zona.");
    } finally {
      setLoading(false);
    }
  };

  if (zonaSeleccionada) {
    return (
      <DetalleZona 
        zona={zonaSeleccionada} 
        propertyCurp={propertyCurp}
        alVolver={() => setZonaSeleccionada(null)} 
      />
    );
  }

  return (
    <>
      <Header />
      <div className="rz-body-wrapper">
        <div className="rz-top-info-row">
          <div className="rz-action-buttons">
            <button className="rz-btn-main orange-gradient" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} /> VOLVER
            </button>
            <button className="rz-btn-main purple-gradient" onClick={() => setModalAbierto(true)}>
              <Plus size={24} strokeWidth={3} /> AGREGAR
            </button>
          </div>

          <div className="rz-bubbles-group">
            <div className="rz-bubble-info">
              <strong className="rz-bubble-value">FOLIO {propertyCurp}</strong>
            </div>
          </div>
        </div>

        <div className="rz-scrollable-grid">
          {zonas.length > 0 ? zonas.map((zona) => (
            <div key={zona.id} className="rz-card-dark">
              <div className="rz-image-holder">
                <img 
                  src={zona.image_path 
                    ? `http://127.0.0.1:8000/storage/${zona.image_path}` 
                    : "https://images.homify.com/v1452164048/p/photo/image/1227856/3.jpg"
                  } 
                  alt={zona.name} 
                />
                <div className="rz-image-overlay">
                  <span className="rz-zona-pill">{zona.name}</span>
                </div>
              </div>
              <div className="rz-card-footer">
                <button className="rz-btn-ver" onClick={() => setZonaSeleccionada(zona)}>VER ZONA</button>
              </div>
            </div>
          )) : (
            <div className="no-data-msg">
               <LayoutGrid size={48} color="#444" />
               <p>No hay zonas registradas. Comienza agregando una nueva área de levantamiento.</p>
            </div>
          )}
        </div>

        {modalAbierto && (
          <div className="rz-modal-overlay">
            <div className="rz-modal-content">
              <div className="rz-modal-header">
                <h2 className="rz-modal-title">DETALLES DE ZONA</h2>
                <div className="rz-modal-actions">
                  <button className="rz-btn-action orange-gradient" onClick={guardarZona} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                    {loading ? ' GUARDANDO...' : ' GUARDAR'}
                  </button>
                  <button className="rz-btn-action gray-gradient" onClick={() => {
                    setModalAbierto(false);
                    setPreviewImg(null);
                    setSelectedFile(null);
                  }}>
                    <X size={18} /> CANCELAR
                  </button>
                </div>
              </div>

              <div className="rz-modal-body">
                <div className="rz-input-group">
                  <label>NOMBRE DE LA ZONA (EJ. COCINA, SALA, PATIO)</label>
                  <input 
                    type="text" 
                    placeholder="ESCRIBE AQUÍ EL NOMBRE..." 
                    value={nuevaZona.nombre}
                    onChange={(e) => setNuevaZona({...nuevaZona, nombre: e.target.value.toUpperCase()})}
                  />
                </div>

                <div className="rz-upload-container">
                  <div className="rz-upload-placeholder" onClick={() => document.getElementById('fileInput').click()}>
                    {previewImg ? (
                      <div className="rz-preview-image-wrapper">
                        <img src={previewImg} alt="Preview" />
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={50} color="#999" />
                        <span>SUBIR IMAGEN DE REFERENCIA</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      id="fileInput" 
                      hidden 
                      accept="image/*" 
                      onChange={handleFileSelect} 
                    />
                    <button className="rz-btn-upload" type="button">
                      {previewImg ? 'CAMBIAR ARCHIVO' : 'SELECCIONAR ARCHIVO'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RegistroZonas;