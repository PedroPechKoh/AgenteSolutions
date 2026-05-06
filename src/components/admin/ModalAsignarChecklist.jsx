import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Plus, Trash2, CheckCircle, Wrench, Package, Settings, Calendar } from 'lucide-react';

const ModalAsignarChecklist = ({ workOrder, onClose, onAssign }) => {
  const [tecnicos, setTecnicos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [tecnicoId, setTecnicoId] = useState(workOrder.tecnicoId || '');
  
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
      // No resetear si ya tiene algo? O sí?
      // Por ahora dejamos que cargue blanco
      setChecklist({ herramientas: [], equipo: [], material: [] });
    } else {
      const t = templates.find(temp => temp.id == tId);
      if (t && t.content) {
        const content = typeof t.content === 'string' ? JSON.parse(t.content) : t.content;
        setChecklist(content);
      }
    }
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
    if (!tecnicoId) {
      return alert("Por favor selecciona un técnico.");
    }
    setLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/${workOrder.dbId}/assign`, {
        tecnico_id: tecnicoId,
        custom_checklist: checklist
      });
      alert("Trabajo y Checklist asignados correctamente");
      onAssign();
    } catch (e) {
      console.error(e);
      alert("Error al asignar el trabajo");
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
          {/* Selección de Técnico */}
          <div className="assignment-section-mini">
            <div className="form-group-cl">
              <label><Settings size={14}/> TÉCNICO RESPONSABLE</label>
              <select value={tecnicoId} onChange={e => setTecnicoId(e.target.value)}>
                <option value="">-- Seleccionar Técnico --</option>
                {tecnicos.map(t => (
                  <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group-cl">
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
              <Settings size={16} /> HERRAMIENTAS
            </button>
            <button 
              className={`cl-tab-btn ${activeTab === 'equipo' ? 'active' : ''}`}
              onClick={() => setActiveTab('equipo')}
            >
              <Wrench size={16} /> EQUIPO DE TRABAJO
            </button>
            <button 
              className={`cl-tab-btn ${activeTab === 'material' ? 'active' : ''}`}
              onClick={() => setActiveTab('material')}
            >
              <Package size={16} /> MATERIAL
            </button>
          </div>

          <div className="cl-tab-content">
            <div className="add-item-row">
              <input 
                type="text" 
                placeholder={`Agregar nuevo ítem a ${activeTab}...`} 
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
              placeholder="Nombre para guardar esta plantilla..." 
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
            />
            <button onClick={handleSaveTemplate} disabled={savingTemplate || checklist[activeTab].length === 0} className="btn-save-template">
              <Save size={18} /> {savingTemplate ? 'Guardando...' : 'GUARDAR PLANTILLA'}
            </button>
          </div>
        </div>

        <div className="checklist-modal-footer">
          <button className="btn-secondary" onClick={onClose}>CANCELAR</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'ASIGNANDO...' : '✓ ASIGNAR TRABAJO'}
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
          padding: 20px;
        }
        .checklist-modal-card {
          width: 100%; max-width: 800px;
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
          padding: 20px 30px; border-bottom: 1px solid #eee;
          display: flex; justify-content: space-between; align-items: center;
        }
        .header-title-main { display: flex; align-items: center; gap: 15px; }
        .header-title-main h3 { margin: 0; font-weight: 900; color: #333; text-transform: uppercase; }
        .header-title-main p { margin: 0; color: #888; font-size: 0.8rem; font-weight: bold; }
        
        .close-btn { background: #f5f5f5; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .close-btn:hover { background: #eee; transform: rotate(90deg); }

        .checklist-modal-body { padding: 30px; flex: 1; overflow-y: auto; }
        
        .assignment-section-mini { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
        .form-group-cl { display: flex; flex-direction: column; gap: 8px; }
        .form-group-cl label { font-size: 0.75rem; font-weight: 900; color: #666; display: flex; align-items: center; gap: 6px; }
        .form-group-cl select { padding: 12px; border: 2px solid #eee; border-radius: 12px; outline: none; font-weight: 600; color: #444; }
        .form-group-cl select:focus { border-color: #F26522; }

        .cl-tabs-header { display: flex; gap: 10px; margin-bottom: 0; border-bottom: 2px solid #eee; }
        .cl-tab-btn {
          padding: 12px 20px; border: none; background: transparent;
          font-weight: 800; font-size: 0.8rem; color: #999;
          display: flex; align-items: center; gap: 8px; cursor: pointer;
          position: relative; transition: all 0.2s;
        }
        .cl-tab-btn.active { color: #F26522; }
        .cl-tab-btn.active::after {
          content: ""; position: absolute; bottom: -2px; left: 0; width: 100%; height: 2px; background: #F26522;
        }

        .cl-tab-content { background: #f9f9f9; padding: 25px; border-radius: 0 0 16px 16px; margin-bottom: 20px; }
        .add-item-row { display: flex; gap: 10px; margin-bottom: 20px; }
        .add-item-row input { flex: 1; padding: 12px; border: 2px solid #ddd; border-radius: 10px; outline: none; }
        .add-item-row input:focus { border-color: #F26522; }
        .btn-add-item { background: #333; color: white; border: none; padding: 0 20px; border-radius: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; }

        .items-list-container { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; }
        .cl-item-editable {
          background: white; padding: 10px 15px; border-radius: 8px;
          display: flex; justify-content: space-between; align-items: center;
          border: 1px solid #eee; transition: all 0.2s;
        }
        .cl-item-editable:hover { border-color: #F26522; }
        .cl-item-editable span { font-weight: 600; color: #444; }
        .btn-remove-item { background: #fff1f1; color: #e53e3e; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .btn-remove-item:hover { background: #e53e3e; color: white; }
        
        .empty-checklist-msg { text-align: center; color: #bbb; font-style: italic; padding: 20px; }

        .save-template-footer {
          display: flex; gap: 15px; align-items: center;
          padding: 15px; background: #fff5f0; border-radius: 12px; border: 1px dashed #F26522;
        }
        .save-template-footer input { flex: 1; padding: 10px; border: 1px solid #ffccbc; border-radius: 8px; outline: none; }
        .btn-save-template { background: #F26522; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; }
        .btn-save-template:disabled { opacity: 0.5; cursor: not-allowed; }

        .checklist-modal-footer {
          padding: 20px 30px; background: #f5f5f5; display: flex; justify-content: flex-end; gap: 15px;
        }
        .btn-secondary { padding: 12px 25px; border-radius: 10px; border: none; background: #ddd; color: #666; font-weight: 800; cursor: pointer; }
        .btn-primary { padding: 12px 30px; border-radius: 10px; border: none; background: #2e7d32; color: white; font-weight: 800; cursor: pointer; box-shadow: 0 4px 10px rgba(46, 125, 50, 0.3); }
        .btn-primary:hover { transform: translateY(-2px); }
      `}</style>
    </div>
  );
};

export default ModalAsignarChecklist;
