import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import "../../styles/TecnicoStyles/RegistroDetalleHabitacion.css";
import { ArrowLeft, Plus, Trash2, X, Loader2, ImageIcon, Edit3, Eye } from 'lucide-react';
import Header from '../Shared/Header';

const RegistroDetalleHabitacion = ({ habitacion, categoriaActiva, propertyCurp, alVolver }) => {
  const [componentes, setComponentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ESTADOS PARA EDICIÓN Y DETALLE
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [itemDetalle, setItemDetalle] = useState(null); // Nuevo estado para modal de visualización
  const [imagenAmpliada, setImagenAmpliada] = useState(null); // Para el Lightbox de la foto


  // ESTADOS PARA IMÁGENES
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const [galeriaArchivos, setGaleriaArchivos] = useState([]); // Nuevas fotos extra
  const [galeriaExistente, setGaleriaExistente] = useState([]); // Fotos extra que ya vienen de BD

  const [nuevoRegistro, setNuevoRegistro] = useState({
    brand: '', model_or_color: '', quantity: 1, sub_category: '', serial_number: '', observations: ''
  });

  useEffect(() => {
    if (habitacion?.id) fetchComponentes();
  }, [habitacion]);

  const fetchComponentes = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/areas/${habitacion.id}/components`);
      const filtrados = res.data.filter(comp => comp.category === categoriaActiva?.name);
      setComponentes(filtrados);
    } catch (error) {
      console.error("Error al cargar componentes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImg(URL.createObjectURL(file));
    }
  };

  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setGaleriaArchivos([...galeriaArchivos, ...files]);
    }
  };

  // FUNCIÓN PARA ABRIR MODAL EN MODO EDICIÓN
  const abrirModalEdicion = (item) => {
    setModoEdicion(true);
    setIdEditando(item.id);
    setNuevoRegistro({
      brand: item.brand || '',
      model_or_color: item.model_or_color || '',
      quantity: item.quantity || 1,
      sub_category: item.sub_category || '',
      serial_number: item.serial_number || '',
      observations: item.observations || ''
    });

    // Si ya tenía imagen en la BD, se la mostramos
    if (item.image_path) {
      setPreviewImg(`http://127.0.0.1:8000/storage/${item.image_path}`);
    } else {
      setPreviewImg(null);
    }
    
    // Asignamos ambas galerías (limpiamos las temporales seleccionadas)
    setGaleriaArchivos([]);
    setGaleriaExistente(item.galleries || []);
    setIsModalOpen(true);
  };

  // FUNCIÓN PARA ABRIR MODAL EN MODO CREACIÓN
  const abrirModalCreacion = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setNuevoRegistro({ brand: '', model_or_color: '', quantity: 1, sub_category: '', serial_number: '', observations: '' });
    setPreviewImg(null);
    setSelectedFile(null);
    setGaleriaArchivos([]);
    setGaleriaExistente([]);
    setIsModalOpen(true);
  };

  const guardarComponente = async () => {
    if (!nuevoRegistro.sub_category) return alert("El campo TIPO es obligatorio.");

    setGuardando(true);
    
    const formData = new FormData();
    formData.append('property_area_id', habitacion.id);
    formData.append('category', categoriaActiva.name);
    formData.append('sub_category', nuevoRegistro.sub_category);
    formData.append('brand', nuevoRegistro.brand);
    formData.append('model_or_color', nuevoRegistro.model_or_color);
    formData.append('quantity', nuevoRegistro.quantity);
    formData.append('serial_number', nuevoRegistro.serial_number);
    formData.append('observations', nuevoRegistro.observations);
    formData.append('unit', 'PZA');
    formData.append('status', 'Bueno');
    
    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    // MANDAMOS LAS FOTOS DE LA GALERÍA A LARAVEL
    galeriaArchivos.forEach((file) => {
      formData.append('gallery[]', file);
    });

    // SI ESTAMOS EDITANDO, AGREGAMOS EL TRUCO PARA LARAVEL Y CAMBIAMOS LA URL
    if (modoEdicion) {
      formData.append('_method', 'PUT'); 
    }

    const url = modoEdicion 
      ? `http://127.0.0.1:8000/api/property-components/${idEditando}` 
      : 'http://127.0.0.1:8000/api/property-components';

    try {
      await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setIsModalOpen(false);
      fetchComponentes(); 
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar el elemento.");
    } finally {
      setGuardando(false);
    }
  };
  const eliminarComponente = async (id) => {
    if(window.confirm("¿Seguro que deseas eliminar este elemento?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/property-components/${id}`);
        fetchComponentes();
      } catch (error) {
        alert("Error al eliminar");
      }
    }
  };

  const fotosItem = itemDetalle ? [
    ...(itemDetalle.image_path ? [`http://127.0.0.1:8000/storage/${itemDetalle.image_path}`] : []),
    ...(itemDetalle.galleries ? itemDetalle.galleries.map(g => `http://127.0.0.1:8000/storage/${g.image_path}`) : [])
  ] : [];

  return (
    <>
      <Header />
      <div className="rdh-body-wrapper">
      <div className="rdh-info-row">
        <button onClick={alVolver} style={{ background: '#f26624', color: 'white', border: 'none', borderRadius: '20px', padding: '6px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
          <ArrowLeft size={16} style={{ marginRight: '8px' }}/> VOLVER
        </button>
        <div className="rdh-data-pill">CURP <strong>{propertyCurp || "S/N"}</strong></div>
        <div className="rdh-data-pill">ID ÁREA <strong>{habitacion?.id}</strong></div>
        <div className="rdh-date-box">FECHA DE REGISTRO</div>
      </div>

      <div className="rdh-main-card">
        <div className="rdh-header-grid">
          <div className="rdh-name-pill-large">
            <h3>{habitacion?.name || "HABITACIÓN PRINCIPAL"}</h3>
          </div>
          <div className="rdh-category-indicator">{categoriaActiva?.name || "CATEGORÍA"}</div>
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
            
            {loading ? (
              <p style={{textAlign: 'center', color: 'white', padding: '20px'}}>Cargando elementos...</p>
            ) : componentes.length > 0 ? (
              componentes.map((reg) => (
                <div key={reg.id} className="rdh-table-row">
                  <span>{reg.brand || 'N/A'}</span>
                  <span>{reg.model_or_color || 'N/A'}</span>
                  <span>{reg.quantity}</span>
                  <span>{reg.sub_category}</span>
                  
                  {/* SECCIÓN DE BOTONES: DETALLE, EDITAR Y ELIMINAR */}
                  <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                    <button onClick={() => setItemDetalle(reg)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#333'}} title="Ver Detalles">
                      <Eye size={20} />
                    </button>
                    <button onClick={() => abrirModalEdicion(reg)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#333'}} title="Editar">
                      <Edit3 size={20} />
                    </button>
                    <button onClick={() => eliminarComponente(reg.id)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4d'}} title="Eliminar">
                      <Trash2 size={20} className="rdh-icon-del" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{textAlign: 'center', color: '#ccc', fontStyle: 'italic', padding: '20px'}}>
                No hay elementos registrados en {categoriaActiva?.name}.
              </p>
            )}
          </div>

          <div className="rdh-side-controls">
            <button className="rdh-btn-plus-sq" onClick={abrirModalCreacion}>
              <Plus size={35} strokeWidth={4} />
            </button>
          </div>
        </div>
      </div>

      <div className="rdh-actions-outer">
        <button className="rdh-btn-save-3d" onClick={alVolver}>GUARDAR CATEGORÍA</button>
      </div>

      {/* MODAL CON FOTO, GALERÍA, SERIE Y COMENTARIOS */}
      {isModalOpen && (
        <div className="rdh-modal-overlay">
          <div className="rdh-modal-content" style={{ width: '500px' }}>
            <button className="rdh-modal-close" onClick={() => setIsModalOpen(false)}>
              <X size={24} strokeWidth={3} />
            </button>
            
            {/* TÍTULO DINÁMICO */}
            <h2 className="rdh-modal-title">{modoEdicion ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}</h2>
            
            <div className="rdh-modal-form" style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '10px' }}>
              
              {/* === NUEVA SECCIÓN DE FOTOS (PRINCIPAL + GALERÍA) === */}
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '20px' }}>
                
                {/* FOTO PRINCIPAL */}
                <div>
                  <div 
                    className="rdh-foto-box"
                    onClick={() => document.getElementById('fotoProducto').click()}
                  >
                    {previewImg ? (
                      <img src={previewImg} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <ImageIcon size={40} color="#ccc" />
                        <span style={{ fontSize: '10px', color: '#ccc', marginTop: '5px', fontWeight: 'bold', textAlign: 'center' }}>
                          {modoEdicion ? 'CAMBIAR FOTO' : 'FOTO PRINCIPAL'}
                        </span>
                      </>
                    )}
                  </div>
                  <input type="file" id="fotoProducto" hidden accept="image/*" onChange={handleFileSelect} />
                </div>

                {/* FOTOS DE GALERÍA (EXTRA) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div 
                    className="rdh-gallery-box"
                    title="Agregar fotos extra"
                    onClick={() => document.getElementById('fotoGaleria').click()}
                    style={{ position: 'relative', overflow: 'hidden', padding: (galeriaArchivos.length > 0 || galeriaExistente.length > 0) ? '5px' : '0' }}
                  >
                    {(galeriaArchivos.length > 0 || galeriaExistente.length > 0) ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', width: '100%', height: '100%', justifyContent: 'center', alignContent: 'center' }}>
                        
                        {/* Mostrar fotos de la BD */}
                        {galeriaExistente.map((foto, i) => (
                           <img key={`ex-${i}`} src={`http://127.0.0.1:8000/storage/${foto.image_path}`} alt={`galeria-bd-${i}`} style={{ width: (galeriaArchivos.length + galeriaExistente.length) > 1 ? '45%' : '90%', height: (galeriaArchivos.length + galeriaExistente.length) > 1 ? '45%' : '90%', objectFit: 'cover', borderRadius: '5px' }} />
                        ))}

                        {/* Mostrar fotos recién seleccionadas */}
                        {galeriaArchivos.slice(0, 4 - galeriaExistente.length).map((file, i) => (
                           <img key={`new-${i}`} src={URL.createObjectURL(file)} alt={`galeria-new-${i}`} style={{ width: (galeriaArchivos.length + galeriaExistente.length) > 1 ? '45%' : '90%', height: (galeriaArchivos.length + galeriaExistente.length) > 1 ? '45%' : '90%', objectFit: 'cover', borderRadius: '5px' }} />
                        ))}

                      </div>
                    ) : (
                      <>
                        <Plus size={40} color="#ccc" className="gallery-icon" />
                        <span className="gallery-text" style={{ fontSize: '10px', color: '#ccc', marginTop: '5px', fontWeight: 'bold', textAlign: 'center' }}>
                          AGREGAR MÁS
                        </span>
                      </>
                    )}
                  </div>
                  {/* Atributo 'multiple' permite seleccionar varios archivos a la vez */}
                  <input type="file" id="fotoGaleria" hidden accept="image/*" multiple onChange={(e) => { handleGallerySelect(e); e.target.value = null; }} />
                  
                  {/* TEXTO INDICADOR DE CUÁNTAS FOTOS HAY EN TOTAL */}
                  {(galeriaArchivos.length > 0 || galeriaExistente.length > 0) && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#f26624', fontWeight: 'bold' }}>
                        {(galeriaArchivos.length + galeriaExistente.length)} fotos extra
                      </span>
                      {galeriaArchivos.length > 0 && ( /* Solo limpia las recién agregadas, las de BD requerirían su endpoint de borrado individual si quisieras */
                        <button 
                           onClick={() => setGaleriaArchivos([])} 
                           style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', padding: 0 }}
                        >
                           Limpiar nuevas
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>

              <div className="rdh-modal-field">
                <label>TIPO *</label>
                <input type="text" className="rdh-modal-input" placeholder="Ej. ENCHUFE, FOCO" value={nuevoRegistro.sub_category} onChange={(e) => setNuevoRegistro({...nuevoRegistro, sub_category: e.target.value.toUpperCase()})}/>
              </div>
              <div className="rdh-modal-field">
                <label>MARCA</label>
                <input type="text" className="rdh-modal-input" value={nuevoRegistro.brand} onChange={(e) => setNuevoRegistro({...nuevoRegistro, brand: e.target.value.toUpperCase()})}/>
              </div>
              <div className="rdh-modal-field">
                <label>MODELO</label>
                <input type="text" className="rdh-modal-input" value={nuevoRegistro.model_or_color} onChange={(e) => setNuevoRegistro({...nuevoRegistro, model_or_color: e.target.value.toUpperCase()})}/>
              </div>
              
              <div className="rdh-modal-field">
                <label>NO. SERIE</label>
                <input type="text" className="rdh-modal-input" placeholder="S/N" value={nuevoRegistro.serial_number} onChange={(e) => setNuevoRegistro({...nuevoRegistro, serial_number: e.target.value.toUpperCase()})}/>
              </div>

              <div className="rdh-modal-field">
                <label>CANTIDAD *</label>
                <input type="number" min="0.1" step="0.1" className="rdh-modal-input" value={nuevoRegistro.quantity} onChange={(e) => setNuevoRegistro({...nuevoRegistro, quantity: e.target.value})}/>
              </div>

              <div className="rdh-modal-field" style={{ alignItems: 'flex-start' }}>
                <label style={{ marginTop: '15px' }}>COMENTARIOS</label>
                <textarea 
                  className="rdh-modal-input" 
                  style={{ height: 'auto', paddingTop: '10px', resize: 'vertical', minHeight: '60px' }}
                  rows="3" 
                  placeholder="Detalla daños o notas especiales..."
                  value={nuevoRegistro.observations} 
                  onChange={(e) => setNuevoRegistro({...nuevoRegistro, observations: e.target.value})}
                />
              </div>

              <div className="rdh-modal-btn-container" style={{ marginTop: '20px' }}>
                <button className="rdh-btn-save-3d modal-btn" onClick={guardarComponente} disabled={guardando}>
                  {guardando ? <Loader2 size={20} className="animate-spin" /> : (modoEdicion ? 'ACTUALIZAR' : 'GUARDAR')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES DEL PRODUCTO */}
      {itemDetalle && (
        <div className="rdh-modal-overlay">
          <div className="rdh-modal-content" style={{ width: '850px', maxWidth: '95vw' }}>
            <button className="rdh-modal-close" onClick={() => setItemDetalle(null)}>
              <X size={24} strokeWidth={3} />
            </button>
            <h2 className="rdh-modal-title" style={{ marginBottom: '15px' }}>DETALLES DEL PRODUCTO</h2>
            
            <div className="rdh-modal-form" style={{ display: 'flex', gap: '30px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
              
              {/* COLUMNA IZQUIERDA: FOTOS EN FILA */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '15px', color: '#333' }}>FOTOS DEL PRODUCTO:</label>
                
                {fotosItem.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {fotosItem.map((url, i) => (
                      <img 
                        key={i} 
                        src={url} 
                        alt="foto" 
                        onClick={() => setImagenAmpliada(url)}
                        title="Clic para agrandar"
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #ccc', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{width: '100%', height: '120px', backgroundColor: '#999', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <span style={{color: '#fff', fontWeight: 'bold'}}>SIN FOTOS REGISTRADAS</span>
                  </div>
                )}
              </div>

              {/* COLUMNA DERECHA: DATOS */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#999', padding: '25px', borderRadius: '15px', color: 'white', justifyContent: 'flex-start' }}>
                <div style={{ fontSize: '15px' }}><strong style={{color: '#fff'}}>TIPO:</strong> {itemDetalle.sub_category}</div>
                <div style={{ fontSize: '15px' }}><strong style={{color: '#fff'}}>MARCA:</strong> {itemDetalle.brand || 'N/A'}</div>
                <div style={{ fontSize: '15px' }}><strong style={{color: '#fff'}}>MODELO:</strong> {itemDetalle.model_or_color || 'N/A'}</div>
                <div style={{ fontSize: '15px' }}><strong style={{color: '#fff'}}>NO. SERIE:</strong> {itemDetalle.serial_number || 'S/N'}</div>
                <div style={{ fontSize: '15px' }}><strong style={{color: '#fff'}}>CANTIDAD:</strong> {itemDetalle.quantity}</div>
                <div style={{ marginTop: '10px', fontSize: '15px' }}><strong style={{color: '#fff'}}>OBSERVACIONES:</strong></div>
                <div style={{ backgroundColor: '#777', padding: '15px', borderRadius: '10px', minHeight: '80px', fontStyle: 'italic', fontSize: '14px', overflowY: 'auto' }}>
                  {itemDetalle.observations || 'Sin observaciones del técnico.'}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PARA IMAGEN AMPLIADA */}
      {imagenAmpliada && (
        <div 
          onClick={() => setImagenAmpliada(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
        >
          <img src={imagenAmpliada} alt="Zoom" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
          <button 
             onClick={() => setImagenAmpliada(null)} 
             style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
             <X size={40} />
          </button>
        </div>
      )}

      </div>
    </>
  );
};

export default RegistroDetalleHabitacion;