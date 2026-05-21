import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { X, Plus, Trash2, Camera, FileText, Upload } from 'lucide-react';
import '../../styles/TecnicoStyles/TrabajoPropiedad.css';

const ModalCrearCotizacion = ({ 
  workOrderId, 
  serviceId, 
  cotizacionExistente, 
  onClose, 
  onSuccess 
}) => {
  const [tabCotizacion, setTabCotizacion] = useState('manual');
  const [filasConceptos, setFilasConceptos] = useState([{ id: Date.now(), desc: '', cant: 1, precio: 0 }]);
  const [filasMateriales, setFilasMateriales] = useState([{ id: Date.now() + 1, desc: '', cant: 1, precio: 0 }]);
  const [observacionesCotizacion, setObservacionesCotizacion] = useState('');
  const [archivoCotizacion, setArchivoCotizacion] = useState(null);
  const [fotoEvidencia, setFotoEvidencia] = useState(null);
  const [modoConsulta, setModoConsulta] = useState(false);
  const [enviandoCotizacion, setEnviandoCotizacion] = useState(false);
  const [cotizacionEnviada, setCotizacionEnviada] = useState(false);

  useEffect(() => {
    if (cotizacionExistente) {
      setModoConsulta(true);
      if (cotizacionExistente.type === 'manual') {
        const parsed = typeof cotizacionExistente.concept === 'string' 
          ? JSON.parse(cotizacionExistente.concept) 
          : cotizacionExistente.concept;
        setFilasConceptos(parsed.servicios?.map((s, i) => ({ id: i, desc: s.descripcion, cant: s.cantidad, precio: s.precio })) || []);
        setFilasMateriales(parsed.materiales?.map((m, i) => ({ id: i + 1000, desc: m.descripcion, cant: m.cantidad, precio: m.precio })) || []);
        setObservacionesCotizacion(cotizacionExistente.observations || '');
        setTabCotizacion('manual');
      } else {
        setTabCotizacion('archivo');
      }
    } else {
      setModoConsulta(false);
    }
  }, [cotizacionExistente]);

  const addFila = (setter) => setter(prev => [...prev, { id: Date.now(), desc: '', cant: 1, precio: 0 }]);
  const removeFila = (setter, id) => setter(prev => prev.filter(f => f.id !== id));
  const updateFila = (setter, id, field, value) => {
    setter(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const calcularTotal = () => {
    const totalConceptos = filasConceptos.reduce((acc, f) => acc + (Number(f.cant) * Number(f.precio)), 0);
    const totalMateriales = filasMateriales.reduce((acc, f) => acc + (Number(f.cant) * Number(f.precio)), 0);
    return totalConceptos + totalMateriales;
  };

  const enviarCotizacion = async () => {
    try {
      setEnviandoCotizacion(true);
      const formData = new FormData();
      formData.append('type', tabCotizacion);
      
      if (workOrderId) {
        formData.append('work_order_id', workOrderId);
      } else if (serviceId) {
        formData.append('service_id', serviceId);
      } else {
        alert("Falta ID de referencia para la cotización.");
        setEnviandoCotizacion(false);
        return;
      }

      if (tabCotizacion === 'manual') {
        const conceptData = {
          servicios: filasConceptos.map(f => ({ descripcion: f.desc, cantidad: f.cant, precio: f.precio })),
          materiales: filasMateriales.map(f => ({ descripcion: f.desc, cantidad: f.cant, precio: f.precio }))
        };
        formData.append('concept', JSON.stringify(conceptData));
        formData.append('estimated_amount', calcularTotal());
        formData.append('observations', observacionesCotizacion);
        if (fotoEvidencia) {
          formData.append('evidence_photo', fotoEvidencia);
        }
      } else {
        if (!archivoCotizacion) return alert("Por favor seleccione un archivo.");
        formData.append('file', archivoCotizacion);
      }

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 201) {
        setCotizacionEnviada(true);
        setTimeout(() => {
          setCotizacionEnviada(false);
          if (onSuccess) onSuccess(res.data);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error enviando cotización:", error);
      const msg = error.response?.data?.error || error.message || "Error desconocido";
      alert("Hubo un error al enviar la cotización: " + msg);
    } finally {
      setEnviandoCotizacion(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="tp-modal-overlay">
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
          className="tp-modal-content tp-modal-q-full"
        >
          <button className="tp-modal-close-btn" onClick={onClose}><X size={24} /></button>
          <div className="tp-modal-q-header">
            <h2>{modoConsulta ? 'COTIZACIÓN REGISTRADA' : 'GENERAR COTIZACIÓN'}</h2>
            <p>{modoConsulta ? 'Consulta los detalles de la cotización actual' : 'Complete el formato para enviar la cotización al cliente'}</p>
          </div>

          <div className="tp-q-tabs">
            <button 
              className={`tp-q-tab ${tabCotizacion === 'manual' ? 'active' : ''}`}
              onClick={() => !modoConsulta && setTabCotizacion('manual')}
            >Formato Manual</button>
            <button 
              className={`tp-q-tab ${tabCotizacion === 'archivo' ? 'active' : ''}`}
              onClick={() => !modoConsulta && setTabCotizacion('archivo')}
            >Subir Archivo (PDF/Img)</button>
          </div>

          <div className="tp-modal-q-body">
            {tabCotizacion === 'manual' ? (
              <div className="tp-q-manual-form">
                <div className="tp-q-section">
                  <div className="tp-q-section-header">
                    <h3>1. CONCEPTOS DE SERVICIO</h3>
                    <div className="tp-q-line"></div>
                  </div>
                  <div className="tp-q-table-header">
                    <span className="col-desc">DESCRIPCIÓN</span>
                    <span className="col-cant">CANT.</span>
                    <span className="col-price">PRECIO U.</span>
                    <span className="col-sub">SUBTOTAL</span>
                    <span className="col-actions"></span>
                  </div>
                  <div className="tp-q-rows-container">
                    {filasConceptos.map(f => (
                      <div key={f.id} className="tp-q-row">
                        <input 
                          type="text" 
                          className="tp-q-input desc" 
                          placeholder="Ej: Instalación de luminarias"
                          value={f.desc}
                          onChange={(e) => updateFila(setFilasConceptos, f.id, 'desc', e.target.value)}
                          readOnly={modoConsulta}
                        />
                        <input 
                          type="number" 
                          className="tp-q-input cant" 
                          value={f.cant}
                          onChange={(e) => updateFila(setFilasConceptos, f.id, 'cant', e.target.value)}
                          readOnly={modoConsulta}
                        />
                        <div className="tp-q-price-wrapper">
                          <span>$</span>
                          <input 
                            type="number" 
                            className="tp-q-input" 
                            value={f.precio}
                            onChange={(e) => updateFila(setFilasConceptos, f.id, 'precio', e.target.value)}
                            readOnly={modoConsulta}
                          />
                        </div>
                        <span className="tp-q-subtotal">${(f.cant * f.precio).toLocaleString()}</span>
                        {!modoConsulta && (
                          <button className="tp-q-btn-del" onClick={() => removeFila(setFilasConceptos, f.id)}><X size={16}/></button>
                        )}
                      </div>
                    ))}
                  </div>
                  {!modoConsulta && (
                    <button className="tp-q-btn-add" onClick={() => addFila(setFilasConceptos)}>
                      <Plus size={16} />
                      <span>Agregar Concepto</span>
                    </button>
                  )}
                </div>

                <div className="tp-q-section">
                  <div className="tp-q-section-header">
                    <h3>2. MATERIALES</h3>
                    <div className="tp-q-line"></div>
                  </div>
                  
                  <div className="tp-q-table-header">
                    <span className="col-desc">MATERIAL</span>
                    <span className="col-cant">CANT.</span>
                    <span className="col-price">COSTO U.</span>
                    <span className="col-sub">SUBTOTAL</span>
                    <span className="col-actions"></span>
                  </div>

                  <div className="tp-q-rows-container">
                    {filasMateriales.map(f => (
                      <div key={f.id} className="tp-q-row">
                        <input 
                          type="text" 
                          className="tp-q-input desc" 
                          placeholder="Ej: Cable UTP"
                          value={f.desc}
                          onChange={(e) => updateFila(setFilasMateriales, f.id, 'desc', e.target.value)}
                          readOnly={modoConsulta}
                        />
                        <input 
                          type="number" 
                          className="tp-q-input cant" 
                          value={f.cant}
                          onChange={(e) => updateFila(setFilasMateriales, f.id, 'cant', e.target.value)}
                          readOnly={modoConsulta}
                        />
                        <div className="tp-q-price-wrapper">
                          <span>$</span>
                          <input 
                            type="number" 
                            className="tp-q-input price" 
                            value={f.precio}
                            onChange={(e) => updateFila(setFilasMateriales, f.id, 'precio', e.target.value)}
                            readOnly={modoConsulta}
                          />
                        </div>
                        <span className="tp-q-subtotal">${(f.cant * f.precio).toLocaleString()}</span>
                        {!modoConsulta && (
                          <button className="tp-q-btn-del" onClick={() => removeFila(setFilasMateriales, f.id)}><Trash2 size={16}/></button>
                        )}
                      </div>
                    ))}
                  </div>
                  {!modoConsulta && (
                    <button className="tp-q-btn-add" onClick={() => addFila(setFilasMateriales)}>
                      <Plus size={16} />
                      <span>Agregar Material</span>
                    </button>
                  )}
                </div>

                <div className="tp-q-section">
                  <div className="tp-q-section-header">
                    <h3>3. OBSERVACIONES ADICIONALES</h3>
                    <div className="tp-q-line"></div>
                  </div>
                  <textarea 
                    className="tp-q-textarea"
                    placeholder="Notas internas..."
                    value={observacionesCotizacion}
                    onChange={(e) => setObservacionesCotizacion(e.target.value)}
                    readOnly={modoConsulta}
                  ></textarea>
                </div>

                <div className="tp-q-section" style={{ marginTop: '20px' }}>
                  <div className="tp-q-section-header">
                    <h3>4. EVIDENCIA FOTOGRÁFICA (Opcional)</h3>
                    <div className="tp-q-line"></div>
                  </div>
                  <div className="tp-q-file-upload" style={{ minHeight: '120px', padding: '15px' }}>
                    {modoConsulta ? (
                      cotizacionExistente?.evidence_photo_path ? (
                        <div className="tp-q-view-file" style={{ border: 'none', background: 'transparent' }}>
                          <img src={cotizacionExistente.evidence_photo_path} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px' }} />
                        </div>
                      ) : (
                        <p style={{ textAlign: 'center', color: '#888' }}>No se adjuntó evidencia fotográfica.</p>
                      )
                    ) : (
                      <div className="tp-upload-area" onClick={() => document.getElementById('q-evidence-input').click()} style={{ padding: '20px', border: '2px dashed #ccc', borderRadius: '10px', textAlign: 'center', cursor: 'pointer' }}>
                        {fotoEvidencia ? (
                          <img src={URL.createObjectURL(fotoEvidencia)} alt="Vista previa" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', objectFit: 'contain', margin: '0 auto' }} />
                        ) : (
                          <>
                            <Camera size={32} color="#f26624" style={{ margin: '0 auto 10px' }} />
                            <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                              Haga clic para subir una foto de evidencia
                            </p>
                          </>
                        )}
                        <input 
                          id="q-evidence-input" 
                          type="file" 
                          accept="image/*"
                          hidden 
                          onChange={(e) => setFotoEvidencia(e.target.files[0])}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="tp-q-file-upload">
                {modoConsulta ? (
                  <div className="tp-q-view-file">
                    <FileText size={48} color="#f26624" />
                    <p>Esta cotización fue cargada como archivo.</p>
                    <a href={cotizacionExistente.archivo_url} target="_blank" rel="noreferrer" className="tp-q-btn-view">VER ARCHIVO</a>
                  </div>
                ) : (
                  <div className="tp-upload-area" onClick={() => document.getElementById('q-file-input').click()}>
                    <Upload size={48} color="#f26624" />
                    <p>{archivoCotizacion ? archivoCotizacion.name : "Haga clic para seleccionar el archivo de cotización (PDF/Imagen)"}</p>
                    <input 
                      id="q-file-input" 
                      type="file" 
                      hidden 
                      onChange={(e) => setArchivoCotizacion(e.target.files[0])}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="tp-modal-q-footer">
            <div className="tp-q-total-card">
              <span className="tp-q-total-label">TOTAL ESTIMADO:</span>
              <span className="tp-q-total-amount">${Number(calcularTotal()).toLocaleString()}</span>
            </div>
            <div className="tp-q-footer-actions">
              {modoConsulta ? (
                <button className="tp-q-btn-cancel-new" onClick={onClose}>CERRAR</button>
              ) : (
                <>
                  <button className="tp-q-btn-cancel-new" onClick={onClose}>CANCELAR</button>
                  <button 
                    className={`tp-q-btn-save-new ${enviandoCotizacion ? 'loading' : ''}`}
                    onClick={enviarCotizacion}
                    disabled={enviandoCotizacion || cotizacionEnviada}
                  >
                    {enviandoCotizacion ? "ENVIANDO..." : cotizacionEnviada ? "¡ENVIADO!" : "GUARDAR COTIZACIÓN"}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ModalCrearCotizacion;
