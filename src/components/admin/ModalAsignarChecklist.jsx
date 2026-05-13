import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Plus, Trash2, CheckCircle, Wrench, Package, Settings, Calendar } from 'lucide-react';

const ModalAsignarChecklist = ({ workOrder, onClose, onAssign }) => {
  const [tecnicos, setTecnicos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [tecnicosIds, setTecnicosIds] = useState(workOrder.tecnicosIds || (workOrder.tecnicoId ? [workOrder.tecnicoId] : []));
  
  // Custom Checklist State (The 3 Tabs)
  const [activeTab, setActiveTab] = useState('herramientas');
  const [checklist, setChecklist] = useState({
    herramientas: [],
    equipo: [],
    material: []
  });
  const [newItem, setNewItem] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    fetchTecnicos();
    fetchTemplates();
    
    // Si la orden ya tiene un checklist, cargarlo
    if (workOrder.custom_checklist) {
      setChecklist(workOrder.custom_checklist);
    }
  }, [workOrder]);

  const fetchTecnicos = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/usuarios/tecnicos`);
      setTecnicos(response.data);
    } catch (error) {
      console.error("Error cargando técnicos:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/checklist-templates`);
      setTemplates(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setTemplates([]);
    }
  };

  const handleTemplateChange = (e) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    if (tId === '') {
      setChecklist({ herramientas: [], equipo: [], material: [] });
    } else {
      const t = templates.find(temp => temp.id == tId);
      if (t && t.content) {
        const content = typeof t.content === 'string' ? JSON.parse(t.content) : t.content;
        setChecklist(content);
      }
    }
  };

  const toggleTecnico = (id) => {
    setTecnicosIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    setChecklist(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], { id: Date.now(), task: newItem, completed: false }]
    }));
    setNewItem('');
  };

  const handleRemoveItem = (tab, id) => {
    setChecklist(prev => ({
      ...prev,
      [tab]: prev[tab].filter(item => item.id !== id)
    }));
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) return alert("Por favor ingresa un nombre para la plantilla");
    setSavingTemplate(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/checklist-templates`, {
        name: newTemplateName,
        content: checklist
      });
      alert("Plantilla guardada con éxito");
      setTemplates([...templates, res.data.template]);
      setSelectedTemplateId(res.data.template.id);
      setNewTemplateName('');
    } catch (e) {
      console.error(e);
      alert("Error al guardar plantilla");
    }
    setSavingTemplate(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/${workOrder.dbId}/assign`, {
        tecnicos_ids: tecnicosIds,
        custom_checklist: checklist
      });
      alert("Checklist asignado correctamente");
      onAssign();
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.error || e.response?.data?.message || "Error al asignar el checklist";
      alert(msg);
    }
    setLoading(false);
  };

  return (
    <div className="checklist-modal-overlay" onClick={onClose}>
      <div className="checklist-modal-card" onClick={e => e.stopPropagation()}>
        <div className="checklist-modal-header">
          <div className="header-title-main">
            <CheckCircle size={24} color="#F26522" />
            <div>
              <h3>Checklist Personalizado</h3>
              <p>ORDEN: WKF-ORD-{workOrder.dbId}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="checklist-modal-body">
          {/* Selección de Técnico y Plantilla */}
          <div className="assignment-section-top">
            <div className="form-group-cl full-width">
              <label><Settings size={14}/> EQUIPO DE TRABAJO (Selecciona uno o más)</label>
              <div className="tecnicos-grid">
                {tecnicos.map(t => {
                  const isSelected = tecnicosIds.includes(t.id);
                  return (
                    <div 
                      key={t.id} 
                      className={`tecnico-card-select ${isSelected ? 'selected' : ''}`} 
                      onClick={() => toggleTecnico(t.id)}
                    >
                    <div 
                      key={t.id} 
                      className={`tecnico-card-select ${isSelected ? 'selected' : ''}`} 
                      onClick={() => toggleTecnico(t.id)}
                    >
                      {t.profile_picture_url ? (
                        <img 
                          src={t.profile_picture_url} 
                          alt="Técnico" 
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="tech-avatar-fallback" style={{ display: t.profile_picture_url ? 'none' : 'flex' }}>
                        {t.first_name?.charAt(0)}{t.last_name?.charAt(0)}
                      </div>
                      <div className="tecnico-card-info">
                        <span className="tech-name">{t.first_name} {t.last_name?.charAt(0)}.</span>
                      </div>
                      {isSelected && <div className="check-badge"><CheckCircle size={16} /></div>}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="form-group-cl full-width template-selector-box">
              <label><Package size={14}/> CARGAR PLANTILLA</label>
              <select value={selectedTemplateId} onChange={handleTemplateChange}>
                <option value="">-- Nueva Plantilla en Blanco --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabs del Checklist */}
          <div className="cl-tabs-header">
            <button 
              className={`cl-tab-btn ${activeTab === 'herramientas' ? 'active' : ''}`}
              onClick={() => setActiveTab('herramientas')}
            >
              <Settings size={16} /> <span className="tab-text">HERRAMIENTAS</span>
            </button>
            <button 
              className={`cl-tab-btn ${activeTab === 'equipo' ? 'active' : ''}`}
              onClick={() => setActiveTab('equipo')}
            >
              <Wrench size={16} /> <span className="tab-text">EQUIPO</span>
            </button>
            <button 
              className={`cl-tab-btn ${activeTab === 'material' ? 'active' : ''}`}
              onClick={() => setActiveTab('material')}
            >
              <Package size={16} /> <span className="tab-text">MATERIAL</span>
            </button>
          </div>

          <div className="cl-tab-content">
            <div className="add-item-row">
              <input 
                type="text" 
                placeholder={`Agregar a ${activeTab}...`} 
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddItem()}
              />
              <button onClick={handleAddItem} className="btn-add-item">
                <Plus size={18} /> AGREGAR
              </button>
            </div>

            <div className="items-list-container">
              {checklist[activeTab].map(item => (
                <div key={item.id} className="cl-item-editable">
                  <span>{item.task}</span>
                  <button onClick={() => handleRemoveItem(activeTab, item.id)} className="btn-remove-item">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {checklist[activeTab].length === 0 && (
                <div className="empty-checklist-msg">No hay ítems en esta categoría.</div>
              )}
            </div>
          </div>

          {/* Guardar Plantilla */}
          <div className="save-template-footer">
            <input 
              type="text" 
              placeholder="Nombre de plantilla..." 
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
            />
            <button onClick={handleSaveTemplate} disabled={savingTemplate || checklist[activeTab].length === 0} className="btn-save-template">
              <Save size={18} /> <span className="btn-text">{savingTemplate ? 'Guardando...' : 'GUARDAR PLANTILLA'}</span>
            </button>
          </div>
        </div>

        <div className="checklist-modal-footer">
          <button className="btn-secondary" onClick={onClose}>CANCELAR</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'GUARDANDO...' : (workOrder.custom_checklist ? '✓ ACTUALIZAR' : '✓ ASIGNAR')}
          </button>
        </div>
      </div>

      <style>{`
        .checklist-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 20000;
          display: flex; align-items: center; justify-content: center;
          padding: 10px;
        }
        .checklist-modal-card {
          width: 100%; max-width: 800px;
          max-height: 95vh;
          background: white; border-radius: 20px;
          display: flex; flex-direction: column;
          overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          animation: modalAppear 0.3s ease-out;
        }
        @keyframes modalAppear {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .checklist-modal-header {
          padding: 15px 25px; border-bottom: 1px solid #eee;
          display: flex; justify-content: space-between; align-items: center;
          background: white;
        }
        .header-title-main { display: flex; align-items: center; gap: 15px; }
        .header-title-main h3 { margin: 0; font-weight: 900; color: #333; text-transform: uppercase; font-size: 1.1rem; }
        .header-title-main p { margin: 0; color: #888; font-size: 0.75rem; font-weight: bold; }
        
        .close-btn { background: #f5f5f5; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .close-btn:hover { background: #eee; transform: rotate(90deg); }

        .checklist-modal-body { padding: 20px; flex: 1; overflow-y: auto; background: white; }
        
        .assignment-section-top { display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px; }
        .full-width { width: 100%; }
        .form-group-cl { display: flex; flex-direction: column; gap: 8px; }
        .form-group-cl label { font-size: 0.7rem; font-weight: 900; color: #444; display: flex; align-items: center; gap: 6px; text-transform: uppercase; }
        .form-group-cl select { 
          padding: 10px; border: 2px solid #ddd; border-radius: 12px; 
          outline: none; font-weight: 600; color: #333; background: white; width: 100%; font-size: 0.9rem;
        }
        .form-group-cl select:focus { border-color: #F26522; }

        .tecnicos-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); 
          gap: 10px; 
          margin-top: 5px; 
          max-height: 180px; 
          overflow-y: auto; 
          padding: 5px;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
        }
        .tecnico-card-select {
          background: #f9f9f9; border: 2px solid #eee; border-radius: 12px; padding: 8px; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; transition: all 0.2s;
        }
        .tecnico-card-select:hover { border-color: #ffccbc; background: #fff5f0; }
        .tecnico-card-select.selected { border-color: #F26522; background: #fff5f0; box-shadow: 0 4px 10px rgba(242, 101, 34, 0.2); }
        
        .tecnico-card-select img, .tech-avatar-fallback { 
          width: 45px; height: 45px; border-radius: 50%; object-fit: cover; 
          border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
        }
        .tech-avatar-fallback {
          background: #eee; color: #666; font-weight: bold; font-size: 0.9rem;
          display: flex; align-items: center; justify-content: center;
        }
        .tech-name { font-size: 0.7rem; font-weight: 800; color: #444; text-align: center; }
        .check-badge { position: absolute; top: -5px; right: -5px; background: white; color: #F26522; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        
        .template-selector-box { background: #fdfdfd; padding: 12px; border-radius: 12px; border: 1px dashed #ddd; }

        .cl-tabs-header { display: flex; gap: 5px; margin-bottom: 0; border-bottom: 2px solid #eee; overflow-x: auto; scrollbar-width: none; }
        .cl-tabs-header::-webkit-scrollbar { display: none; }
        
        .cl-tab-btn {
          padding: 10px 15px; border: none; background: transparent;
          font-weight: 800; font-size: 0.7rem; color: #999;
          display: flex; align-items: center; gap: 6px; cursor: pointer;
          position: relative; transition: all 0.2s; white-space: nowrap;
        }
        .cl-tab-btn.active { color: #F26522; }
        .cl-tab-btn.active::after {
          content: ""; position: absolute; bottom: -2px; left: 0; width: 100%; height: 2px; background: #F26522;
        }

        .cl-tab-content { background: #fafafa; padding: 15px; border-radius: 0 0 16px 16px; margin-bottom: 15px; border: 1px solid #eee; }
        .add-item-row { display: flex; gap: 8px; margin-bottom: 15px; }
        .add-item-row input { 
          flex: 1; padding: 10px; border: 2px solid #ddd; border-radius: 10px; 
          outline: none; background: white; color: #333; font-size: 0.9rem;
        }
        .add-item-row input:focus { border-color: #F26522; }
        .btn-add-item { background: #333; color: white; border: none; padding: 0 15px; border-radius: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.8rem; }

        .items-list-container { display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto; padding-right: 5px; }
        .cl-item-editable {
          background: white; padding: 8px 12px; border-radius: 8px;
          display: flex; justify-content: space-between; align-items: center;
          border: 1px solid #eee; transition: all 0.2s;
        }
        .cl-item-editable span { font-weight: 600; color: #333; font-size: 0.85rem; }
        .btn-remove-item { background: #fff1f1; color: #e53e3e; border: none; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        
        .save-template-footer {
          display: flex; gap: 10px; align-items: center;
          padding: 12px; background: #fff5f0; border-radius: 12px; border: 1px dashed #F26522;
        }
        .save-template-footer input { 
          flex: 1; padding: 8px 12px; border: 1px solid #ffccbc; border-radius: 8px; 
          outline: none; background: white; color: #333; font-size: 0.85rem;
        }
        .btn-save-template { background: #F26522; color: white; border: none; padding: 8px 15px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; font-size: 0.8rem; }

        .checklist-modal-footer {
          padding: 15px 25px; background: #f5f5f5; display: flex; justify-content: flex-end; gap: 10px;
        }
        .btn-secondary { padding: 10px 20px; border-radius: 8px; border: none; background: #ddd; color: #666; font-weight: 800; cursor: pointer; font-size: 0.85rem; }
        .btn-primary { padding: 10px 20px; border-radius: 8px; border: none; background: #2e7d32; color: white; font-weight: 800; cursor: pointer; font-size: 0.85rem; box-shadow: 0 4px 10px rgba(46, 125, 50, 0.2); }

        /* MEDIA QUERIES PARA RESPONSIVO */
        @media (max-width: 600px) {
          .checklist-modal-card { height: 100vh; max-height: 100vh; border-radius: 0; }
          .checklist-modal-body { padding: 15px; }
          .cl-tab-btn .tab-text { display: none; }
          .cl-tab-btn { padding: 10px; }
          .add-item-row { flex-direction: column; }
          .btn-add-item { padding: 12px; justify-content: center; }
          .save-template-footer { flex-direction: column; align-items: stretch; }
          .btn-save-template { justify-content: center; padding: 12px; }
          .checklist-modal-header h3 { font-size: 1rem; }
          .tecnicos-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); }
        }
      `}</style>
      `}</style>
    </div>
  );
};

export default ModalAsignarChecklist;
