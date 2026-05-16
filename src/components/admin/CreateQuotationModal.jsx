import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, Plus, Trash2, Calculator, 
  Search, User, Home, Wrench, 
  AlertCircle, CheckCircle, Upload
} from 'lucide-react';

const CreateQuotationModal = ({ onClose, onSuccess, prefillData }) => {
  const [tab, setTab] = useState('manual');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Seleccionar Servicio, 2: Detalles

  // --- BUSQUEDA DE SERVICIO ---
  const [busqueda, setBusqueda] = useState('');
  const [serviciosEncontrados, setServiciosEncontrados] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  // --- DATOS COTIZACION ---
  const [filasConceptos, setFilasConceptos] = useState([{ id: Date.now(), desc: '', cant: 1, precio: 0 }]);
  const [filasMateriales, setFilasMateriales] = useState([{ id: Date.now() + 1, desc: '', cant: 1, precio: 0 }]);
  const [observaciones, setObservaciones] = useState('');
  const [observacionesInternas, setObservacionesInternas] = useState('');
  const [archivo, setArchivo] = useState(null);

  useEffect(() => {
    if (prefillData) {
      setServicioSeleccionado({
        id: prefillData.service_id || prefillData.work_order_id,
        is_work_order: !!prefillData.work_order_id,
        identificador_curp: prefillData.folio,
        propietario: prefillData.cliente,
        propiedad_nombre: prefillData.propiedad_nombre || '---',
        direccion: prefillData.direccion || '---'
      });
      
      if (prefillData.concept) {
        const c = prefillData.concept;
        if (c.servicios || c.conceptos) {
          setFilasConceptos((c.servicios || c.conceptos).map((f, i) => ({ id: Date.now() + i, desc: f.descripcion || f.desc, cant: f.cantidad || f.cant || 1, precio: f.precio || f.precio_u || 0 })));
        }
        if (c.materiales) {
          setFilasMateriales(c.materiales.map((f, i) => ({ id: Date.now() + 100 + i, desc: f.descripcion || f.nombre || f.desc, cant: f.cantidad || f.cant || 1, precio: f.precio || f.costo_u || 0 })));
        }
      }
      
      setObservacionesInternas(`--- COTIZACIÓN TÉCNICO ---\n${prefillData.observations || 'Sin observaciones'}`);
      setStep(2); // Ir directo a detalles
    }
  }, [prefillData]);

  useEffect(() => {
    if (busqueda.length > 2) {
      buscarServicios();
    }
  }, [busqueda]);

  const buscarServicios = async () => {
    try {
      // Usamos el endpoint de servicios globales para admin
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios?search=${busqueda}`);
      const data = res.data.data || res.data;
      setServiciosEncontrados(data.slice(0, 5));
    } catch (error) {
      console.error("Error buscando servicios:", error);
    }
  };

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

  const handleGuardar = async () => {
    if (!servicioSeleccionado) return alert("Por favor seleccione un servicio.");
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', tab);
      
      // Determinar si es service_id o work_order_id
      if (servicioSeleccionado.is_work_order) {
        formData.append('work_order_id', servicioSeleccionado.id);
      } else {
        formData.append('service_id', servicioSeleccionado.id);
      }

      if (tab === 'manual') {
        const conceptData = {
          servicios: filasConceptos.map(f => ({ descripcion: f.desc, cantidad: f.cant, precio: f.precio })),
          materiales: filasMateriales.map(f => ({ descripcion: f.desc, cantidad: f.cant, precio: f.precio }))
        };
        formData.append('concept', JSON.stringify(conceptData));
        formData.append('estimated_amount', calcularTotal());
        formData.append('observations', observaciones);
        formData.append('internal_observations', observacionesInternas);
        if (prefillData?.id) {
          formData.append('parent_id', prefillData.id);
        }
      } else {
        if (!archivo) return alert("Seleccione un archivo.");
        formData.append('file', archivo);
      }

      let endpoint = `${import.meta.env.VITE_API_BASE_URL}/cotizaciones`;
      let successMsg = "¡Cotización creada y enviada al cliente exitosamente!";

      if (prefillData?.status === 'Rechazado') {
        endpoint = `${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${prefillData.id}/update`;
        successMsg = "¡Cotización actualizada y reenviada al cliente!";
      }

      const res = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 201 || res.status === 200) {
        alert(successMsg);
        onSuccess();
      }
    } catch (error) {
      console.error("Error procesando cotización:", error);
      alert("Hubo un error al procesar la cotización.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-fixed-overlay" style={{ zIndex: 20000 }}>
      <div className="modal-box-card" style={{ maxWidth: '800px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        <div className="modal-header-dark">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calculator size={24} color="#ff8800" />
            <h2 className="cotiz-modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>NUEVA COTIZACIÓN - ADMIN</h2>
          </div>
          <button className="modal-close-icon" onClick={onClose}><X size={28} /></button>
        </div>

        <div className="modal-body-content" style={{ overflowY: 'auto', flex: 1, padding: '25px' }}>
          
          {step === 1 ? (
            <div className="step-selection">
              <h3 style={{ marginBottom: '20px', color: '#222' }}>1. Seleccionar Servicio o Trabajo</h3>
              <div className="admin-search-box" style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input 
                  type="text" 
                  placeholder="Buscar por cliente, propiedad o identificador..." 
                  style={{ width: '100%', padding: '15px 15px 15px 50px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <div className="servicios-results" style={{ marginTop: '20px' }}>
                {serviciosEncontrados.map(s => (
                  <div 
                    key={s.id} 
                    className={`servicio-item-card ${servicioSeleccionado?.id === s.id ? 'selected' : ''}`}
                    onClick={() => setServicioSeleccionado(s)}
                    style={{ 
                      padding: '15px', border: '1px solid #eee', borderRadius: '12px', marginBottom: '10px', 
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: servicioSeleccionado?.id === s.id ? '#fff3e0' : '#fff',
                      borderColor: servicioSeleccionado?.id === s.id ? '#ff8800' : '#eee'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold', color: '#ff8800' }}>#{s.identificador_curp || s.id}</span>
                      <span style={{ fontSize: '0.8rem', background: '#eee', padding: '2px 8px', borderRadius: '10px' }}>{s.tipoPropiedad}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      <User size={14} color="#666" />
                      <span style={{ fontSize: '0.9rem', color: '#333' }}>{s.propietario}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Home size={14} color="#666" />
                      <span style={{ fontSize: '0.9rem', color: '#555' }}>{s.propiedad_nombre} - {s.direccion}</span>
                    </div>
                  </div>
                ))}
              </div>

              {servicioSeleccionado && (
                <button 
                  onClick={() => setStep(2)}
                  style={{ width: '100%', padding: '15px', background: '#1c252e', color: '#fff', border: 'none', borderRadius: '12px', marginTop: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  CONTINUAR A DETALLES
                </button>
              )}
            </div>
          ) : (
            <div className="step-details">
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                  className={`tab-btn-mini ${tab === 'manual' ? 'active' : ''}`} 
                  onClick={() => setTab('manual')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: tab === 'manual' ? '#1c252e' : '#fff', color: tab === 'manual' ? '#fff' : '#333', fontWeight: 'bold' }}
                >
                  REGISTRO MANUAL
                </button>
                <button 
                  className={`tab-btn-mini ${tab === 'archivo' ? 'active' : ''}`} 
                  onClick={() => setTab('archivo')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: tab === 'archivo' ? '#1c252e' : '#fff', color: tab === 'archivo' ? '#fff' : '#333', fontWeight: 'bold' }}
                >
                  CARGAR ARCHIVO
                </button>
              </div>

              {tab === 'manual' ? (
                <div className="manual-form">
                  <h4 style={{ color: '#ff8800', borderBottom: '1px solid #ff8800', paddingBottom: '5px', marginBottom: '15px' }}>1. CONCEPTOS DE SERVICIO</h4>
                  {filasConceptos.map(f => (
                    <div key={f.id} style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                      <div style={{ width: '100%', marginBottom: '10px' }}>
                         <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '5px' }}>Descripción del Servicio</label>
                         <input 
                           placeholder="Ej. Cambio de carbones a máquina..." 
                           style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#333' }}
                           value={f.desc}
                           onChange={(e) => updateFila(setFilasConceptos, f.id, 'desc', e.target.value)}
                         />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', width: '100%' }}>
                         <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '5px' }}>Cant.</label>
                            <input 
                              type="number" 
                              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', background: '#fff', color: '#333' }}
                              value={f.cant}
                              onChange={(e) => updateFila(setFilasConceptos, f.id, 'cant', e.target.value)}
                            />
                         </div>
                         <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '5px' }}>Precio U. ($)</label>
                            <input 
                              type="number" 
                              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'right', background: '#fff', color: '#333' }}
                              value={f.precio}
                              onChange={(e) => updateFila(setFilasConceptos, f.id, 'precio', e.target.value)}
                            />
                         </div>
                         <button onClick={() => removeFila(setFilasConceptos, f.id)} style={{ padding: '10px 15px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', height: '39px', display: 'flex', alignItems: 'center' }}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addFila(setFilasConceptos)} style={{ width: '100%', padding: '8px', background: '#f5f5f5', border: '1px dashed #ccc', borderRadius: '8px', marginBottom: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#666' }}>
                    <Plus size={16} /> AGREGAR CONCEPTO
                  </button>

                  <h4 style={{ color: '#ff8800', borderBottom: '1px solid #ff8800', paddingBottom: '5px', marginBottom: '15px' }}>2. MATERIALES</h4>
                  {filasMateriales.map(f => (
                    <div key={f.id} style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                      <div style={{ width: '100%', marginBottom: '10px' }}>
                         <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '5px' }}>Nombre del Material</label>
                         <input 
                           placeholder="Ej. Carbones..." 
                           style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#333' }}
                           value={f.desc}
                           onChange={(e) => updateFila(setFilasMateriales, f.id, 'desc', e.target.value)}
                         />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', width: '100%' }}>
                         <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '5px' }}>Cant.</label>
                            <input 
                              type="number" 
                              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', background: '#fff', color: '#333' }}
                              value={f.cant}
                              onChange={(e) => updateFila(setFilasMateriales, f.id, 'cant', e.target.value)}
                            />
                         </div>
                         <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '5px' }}>Costo U. ($)</label>
                            <input 
                              type="number" 
                              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'right', background: '#fff', color: '#333' }}
                              value={f.precio}
                              onChange={(e) => updateFila(setFilasMateriales, f.id, 'precio', e.target.value)}
                            />
                         </div>
                         <button onClick={() => removeFila(setFilasMateriales, f.id)} style={{ padding: '10px 15px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', height: '39px', display: 'flex', alignItems: 'center' }}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addFila(setFilasMateriales)} style={{ width: '100%', padding: '8px', background: '#f5f5f5', border: '1px dashed #ccc', borderRadius: '8px', marginBottom: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#666' }}>
                    <Plus size={16} /> AGREGAR MATERIAL
                  </button>

                  <textarea 
                    placeholder="Observaciones para el CLIENTE..."
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', marginBottom: '15px', background: '#fff', color: '#333' }}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />

                  <div style={{ background: '#fff8e1', padding: '12px', borderRadius: '8px', border: '1px solid #ffe082' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f57c00', display: 'block', marginBottom: '5px' }}>
                      COMENTARIOS INTERNOS (Solo Admin/Técnico):
                    </label>
                    <textarea 
                      placeholder="Notas que el cliente NO verá..."
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ffcc80', minHeight: '80px', background: '#fffde7', color: '#333' }}
                      value={observacionesInternas}
                      onChange={(e) => setObservacionesInternas(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="file-upload-zone" style={{ padding: '40px', border: '2px dashed #ddd', borderRadius: '12px', textAlign: 'center', background: '#f9f9f9', marginBottom: '20px' }}>
                  <Upload size={48} color="#999" style={{ marginBottom: '15px' }} />
                  <p style={{ color: '#555', marginBottom: '15px' }}>{archivo ? `Archivo seleccionado: ${archivo.name}` : 'Suelte el archivo aquí o haga clic para buscar'}</p>
                  <input 
                    type="file" 
                    onChange={(e) => setArchivo(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="file-input"
                  />
                  <button onClick={() => document.getElementById('file-input').click()} style={{ padding: '10px 20px', background: '#1c252e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    SELECCIONAR ARCHIVO
                  </button>
                </div>
              )}

              <div className="modal-summary-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '15px', borderRadius: '12px' }}>
                <div className="total-badge">
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>TOTAL ESTIMADO:</span>
                  <h3 style={{ margin: 0, color: '#ff8800', fontSize: '1.5rem' }}>${calcularTotal().toLocaleString('es-MX')}</h3>
                </div>
                <div className="footer-btns-container" style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(1)} style={{ padding: '12px 20px', background: '#eee', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>VOLVER</button>
                  <button 
                    onClick={handleGuardar} 
                    disabled={loading}
                    style={{ padding: '12px 30px', background: '#ff8800', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,136,0,0.3)' }}
                  >
                    {loading ? 'ENVIANDO...' : 'GUARDAR Y ENVIAR'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CreateQuotationModal;
