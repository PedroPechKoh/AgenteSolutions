import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../../styles/TecnicoStyles/RegistroDetalleHabitacion.css"; 
import { Plus, ArrowLeft, ImageIcon, Loader2, Edit3, Eye, X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// IMPORTAMOS LA VISTA DEL NIVEL 5
import RegistroDetalleHabitacion from './RegistroDetalleHabitacion'; 
import Header from '../Shared/Header';

const DetalleHabitacion = ({ habitacion, propertyCurp, alVolver, servicioId }) => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [creandoNuevaCategoria, setCreandoNuevaCategoria] = useState(false);

  // NUEVO ESTADO: Controla a qué categoría entramos
  const [categoriaActiva, setCategoriaActiva] = useState(null); 

  // ESTADOS PARA ACTUALIZACIÓN DE ZONA
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  
  // HOVER EFFECT AND LIGHTBOX
  const [isHovered, setIsHovered] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  useEffect(() => {
    if (habitacion?.id) {
      fetchCategorias();
      setDescription(habitacion.description || '');
      // ✅ CORRECCIÓN: Leemos la URL directa de Cloudinary
      setPreviewImg(habitacion.image_path ? habitacion.image_path : null);
    }
  }, [habitacion]);

  const fetchCategorias = async () => {
    try {
      // ✅ INYECTAMOS EL TOKEN
      const token = localStorage.getItem('agente_token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/areas/${habitacion.id}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCategorias(res.data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    } finally {
      setLoading(false);
    }
  };

  const guardarCategoria = async () => {
    if (!nuevaCategoria) return alert("Ingresa el nombre de la categoría.");
    setGuardando(true);
    try {
      // ✅ INYECTAMOS EL TOKEN
      const token = localStorage.getItem('agente_token');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/property-categories`, {
        property_area_id: habitacion.id,
        name: nuevaCategoria
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setIsModalOpen(false);
      setNuevaCategoria('');
      setCreandoNuevaCategoria(false);
      fetchCategorias(); 
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      alert("Hubo un error al registrar la categoría.");
    } finally {
      setGuardando(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImg(URL.createObjectURL(file));
    }
  };

  const actualizarZona = async () => {
    setActualizando(true);
    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (description) formData.append('description', description);
    
    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    try {
      // ✅ INYECTAMOS EL TOKEN Y MULTIPART
      const token = localStorage.getItem('agente_token');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/property-areas/${habitacion.id}`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      alert("Zona actualizada correctamente");
      alVolver(); // Volvemos después de guardar
    } catch (error) {
      console.error("Error al actualizar zona", error);
      alert("Error al actualizar la zona");
    } finally {
      setActualizando(false);
    }
  };

  const finalizarLevantamiento = async () => {
    if (!servicioId) return alert("Error: ID de servicio no encontrado.");
    if (!window.confirm("¿Seguro que deseas FINALIZAR todo el levantamiento? Esta propiedad pasará a la pestaña de finalizados.")) return;
    
    // Mostramos estado de carga general (aprovechamos actualizando)
    setActualizando(true);
    try {
      const token = localStorage.getItem('agente_token');
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/servicios/${servicioId}`, 
        { status: 'completed' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      alert("¡Levantamiento finalizado con éxito!");
      navigate("/trabajos-asignados");
    } catch (error) {
       console.error(error);
       alert("No se pudo finalizar el levantamiento.");
    } finally {
       setActualizando(false);
    }
  };

  // ========================================================
  // PUENTE AL NIVEL 5: Si hay categoría activa, mostramos la otra vista
  // ========================================================
  if (categoriaActiva) {
    return (
      <RegistroDetalleHabitacion 
        habitacion={habitacion} 
        categoriaActiva={categoriaActiva} 
        propertyCurp={propertyCurp}
        alVolver={() => setCategoriaActiva(null)} // Al darle "VOLVER" allá, regresa aquí
      />
    );
  }

  return (
    <>
      <Header />
      <div className="dh-body-wrapper">
      <div className="dh-modal-container">
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
          <button onClick={alVolver} style={{ background: '#f26624', color: 'white', border: 'none', borderRadius: '20px', padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            <ArrowLeft size={18} style={{ marginRight: '8px' }}/> VOLVER
          </button>
          
          <div style={{marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center'}}>
            <div className="dh-data-pill">FOLIO {propertyCurp || "S/N"}</div>
            <div className="dh-data-pill">ID ÁREA {habitacion?.id}</div>
            <div className="dh-date-box">FECHA <br /> DE REGISTRO</div>
          </div>
        </div>

        <div className="dh-main-card">
          <div className="dh-top-grid">
            <div className="dh-name-pill">
              <h3>{habitacion?.name || "HABITACIÓN PRINCIPAL"}</h3>
            </div>
            <div 
              className="dh-image-upload" 
              style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <input type="file" id="zonaImageInput" hidden accept="image/*" onChange={handleFileSelect} />
              
              {previewImg ? (
                <>
                  <img src={previewImg} alt="Zona" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px' }} />
                  {isHovered && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                      backgroundColor: 'rgba(0,0,0,0.6)', 
                      borderRadius: '15px', 
                      display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '25px'
                    }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); document.getElementById('zonaImageInput').click(); }}
                        style={{ background: 'none', border: 'none', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: 0 }}
                      >
                        <Edit3 size={20} />
                        <span style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>Cambiar</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setImagenAmpliada(previewImg); }}
                        style={{ background: 'none', border: 'none', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: 0 }}
                      >
                        <Eye size={20} />
                        <span style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>Visualizar</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="dh-image-placeholder" onClick={() => document.getElementById('zonaImageInput').click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                  <ImageIcon size={50} color="#636363" />
                  <span style={{ fontSize: '12px', color: '#636363', marginTop: '10px', fontWeight: 'bold' }}>AGREGAR FOTO</span>
                </div>
              )}
            </div>
            <div className="dh-description-box">
              <span className="dh-label-italic">DESCRIPCIÓN</span>
              <textarea 
                className="dh-textarea" 
                placeholder="Escribe aquí los detalles generales de la habitación..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div className="dh-bottom-grid" style={{ flex: 2, marginTop: 0 }}>
              <div className="dh-mantenimiento-header">
                <span className="dh-label-italic" style={{color: '#333'}}>LISTA DE MANTENIMIENTO</span>
                <button className="dh-btn-plus-small" onClick={() => setIsModalOpen(true)}>
                  <Plus size={24} strokeWidth={4} />
                </button>
              </div>

              {/* LISTA DINÁMICA DE CATEGORÍAS (Pills) */}
              <div className="dh-pills-grid">
                {loading ? (
                  <p>Cargando...</p>
                ) : categorias.length > 0 ? (
                  categorias.map((cat) => (
                    <button 
                      key={cat.id} 
                      className="dh-category-pill active" 
                      onClick={() => setCategoriaActiva(cat)} // <-- AQUÍ ACTIVAMOS LA NAVEGACIÓN
                    >
                      {cat.name}
                    </button>
                  ))
                ) : (
                  <p style={{ gridColumn: '1 / -1', color: '#666', fontStyle: 'italic' }}>
                    No hay categorías. Agrega "ELÉCTRICO", "PLOMERÍA", etc.
                  </p>
                )}
              </div>
            </div>

            <div className="dh-footer-actions" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button className="dh-btn-save-3d" onClick={actualizarZona} disabled={actualizando} style={{ width: '100%', minHeight: '80px', borderRadius: '40px' }}>
                {actualizando ? <Loader2 className="animate-spin" size={24} /> : 'GUARDAR ZONA'}
              </button>
              
              {servicioId && (
                <button 
                  onClick={finalizarLevantamiento}
                  disabled={actualizando}
                  style={{ 
                    width: '100%', minHeight: '80px', borderRadius: '40px', background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', 
                    color: '#fff', fontWeight: 'bold', fontSize: '13px', fontStyle: 'italic', border: 'none', cursor: 'pointer', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 6px 0px #15803d' 
                  }}
                >
                  <CheckCircle size={22} /> FINALIZAR LEVANTAMIENTO
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PARA AGREGAR NUEVA CATEGORÍA */}
      {isModalOpen && (
        <div className="rdh-modal-overlay">
          <div className="rdh-modal-content" style={{ width: '450px' }}>
            <div className="rdh-modal-title">
              <h2>NUEVA CATEGORÍA</h2>
            </div>
            
            <div className="rdh-modal-form">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{fontWeight: 900, fontSize: 14, marginBottom: 5}}>
                  SELECCIONA O AGREGA UNA CATEGORÍA
                </label>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {creandoNuevaCategoria ? (
                    <input 
                      className="rdh-modal-input" 
                      style={{ flex: 1 }}
                      type="text" 
                      value={nuevaCategoria} 
                      onChange={(e) => setNuevaCategoria(e.target.value.toUpperCase())} 
                      placeholder="Escribe la nueva categoría..." 
                      autoFocus 
                    />
                  ) : (
                    <select 
                      className="rdh-modal-input" 
                      style={{ flex: 1, cursor: 'pointer' }}
                      value={nuevaCategoria}
                      onChange={(e) => setNuevaCategoria(e.target.value)}
                    >
                      <option value="">Selecciona una opción...</option>
                      <option value="ELÉCTRICO">ELÉCTRICO</option>
                      <option value="ELECTRODOMÉSTICOS">ELECTRODOMÉSTICOS</option>
                      <option value="MUEBLES">MUEBLES</option>
                      <option value="PLOMERÍA">PLOMERÍA</option>
                      <option value="CARPINTERÍA">CARPINTERÍA</option>
                    </select>
                  )}

                  <button 
                    onClick={() => {
                      setCreandoNuevaCategoria(!creandoNuevaCategoria);
                      setNuevaCategoria('');
                    }}
                    style={{ backgroundColor: creandoNuevaCategoria ? '#666' : '#f26624', border: 'none', borderRadius: '15px', width: '45px', color: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  >
                    {creandoNuevaCategoria ? <ArrowLeft size={20} /> : <Plus size={20} strokeWidth={3} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="rdh-modal-btn-container" style={{ gap: '15px', marginTop: '30px' }}>
              <button className="dh-btn-save-3d" style={{ background: '#777', boxShadow: '0 6px 0px #444', height: '45px', padding: '0 30px', fontSize: '16px' }} onClick={() => {
                setIsModalOpen(false);
                setCreandoNuevaCategoria(false);
              }}>CANCELAR</button>
              <button className="dh-btn-save-3d" style={{ height: '45px', padding: '0 30px', fontSize: '16px' }} onClick={guardarCategoria} disabled={guardando}>
                {guardando ? <Loader2 size={16} className="animate-spin" /> : 'AGREGAR'}
              </button>
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

export default DetalleHabitacion;