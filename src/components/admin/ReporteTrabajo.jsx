// ReporteTrabajo.jsx
import React, { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/Admin/ReporteTrabajo.css";
import logo from '../../assets/fondo.png';
import { Save, Plus, Trash2, Printer, ChevronLeft } from "lucide-react";

const ReporteTrabajo = () => {
  const componentRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Datos recibidos de la navegación
  const { trabajoId, servicio, imagenes: imagenesEvidencia } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado principal del reporte
  const [reportData, setReportData] = useState({
    folio: `FT-${new Date().getFullYear()}-${String(trabajoId || '001').padStart(3, '0')}`,
    fechaTrabajo: servicio?.fecha_programada || new Date().toLocaleDateString("es-MX"),
    horaInicio: "09:00 AM",
    horaFin: "02:00 PM",
    cliente: {
      nombre: servicio?.cliente_nombre || "Cargando...",
      telefono: servicio?.telefono_cliente || "",
      correo: servicio?.cliente_email || "",
      direccion: servicio?.direccion || "",
    },
    propiedad: {
      nombre: servicio?.propiedad_nombre || "",
      direccion: servicio?.direccion || "",
      tipo: servicio?.tipoPropiedad || "Residencial",
      superficie: "N/A",
    },
    tecnico: {
      nombre: servicio?.tecnico_nombre || "",
      especialidad: "Técnico Especialista",
      cedula: "",
    },
    descripcion: servicio?.descripcion || "",
    materiales: [
      { nombre: "", cantidad: 1, unidad: "pza", precio: 0 },
    ],
    observaciones: "El cliente queda satisfecho con el trabajo realizado.",
    imagenes: imagenesEvidencia || [],
    firmaCliente: null,
    firmaTecnico: null,
  });

  // Cargar datos reales de la BD
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!trabajoId) {
        setLoading(false);
        return;
      }
      try {
        // 1. Intentar cargar reporte final guardado
        const resFinal = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios/${trabajoId}/final-report`);
        
        if (resFinal.data) {
          // Si ya existe un reporte guardado, lo usamos
          setReportData(prev => ({
            ...prev,
            ...resFinal.data,
            cliente: { ...prev.cliente, ...(resFinal.data.cliente || {}) },
            propiedad: { ...prev.propiedad, ...(resFinal.data.propiedad || {}) },
            tecnico: { ...prev.tecnico, ...(resFinal.data.tecnico || {}) },
          }));
        } else {
          // 2. Si no hay reporte guardado, cargar datos del servicio/cliente reales de la BD
          const resService = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios/${trabajoId}`);
          const s = resService.data;
          
          setReportData(prev => ({
            ...prev,
            fechaTrabajo: s.fecha_programada || prev.fechaTrabajo,
            cliente: {
              nombre: s.propietario || s.cliente_nombre || prev.cliente.nombre,
              telefono: s.telefono_cliente || prev.cliente.telefono,
              correo: s.cliente_email || prev.cliente.correo,
              direccion: s.direccion || prev.cliente.direccion,
            },
            propiedad: {
              nombre: s.propiedad_nombre || prev.propiedad.nombre,
              direccion: s.direccion || prev.propiedad.direccion,
              tipo: s.tipoPropiedad || prev.propiedad.tipo,
              superficie: "N/A",
            },
            tecnico: {
              nombre: s.tecnico || prev.tecnico.nombre,
              especialidad: "Técnico Especialista",
              cedula: "",
            },
            descripcion: s.descripcion || prev.descripcion,
          }));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [trabajoId]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Reporte_Trabajo_${reportData.folio}`,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/servicios/${trabajoId}/final-report`, {
        ...reportData,
        service_id: trabajoId
      });
      alert("¡Reporte guardado con éxito!");
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Error al guardar el reporte.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section, field, value) => {
    if (section) {
      setReportData(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    } else {
      setReportData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleMaterialChange = (index, field, value) => {
    const newMateriales = [...reportData.materiales];
    newMateriales[index][field] = field === 'cantidad' || field === 'precio' ? Number(value) : value;
    setReportData(prev => ({ ...prev, materiales: newMateriales }));
  };

  const addMaterial = () => {
    setReportData(prev => ({
      ...prev,
      materiales: [...prev.materiales, { nombre: "", cantidad: 1, unidad: "pza", precio: 0 }]
    }));
  };

  const removeMaterial = (index) => {
    setReportData(prev => ({
      ...prev,
      materiales: prev.materiales.filter((_, i) => i !== index)
    }));
  };

  const toggleImage = (url) => {
      const currentImages = reportData.imagenes || [];
      if (currentImages.includes(url)) {
          setReportData(prev => ({ ...prev, imagenes: currentImages.filter(img => img !== url) }));
      } else {
          setReportData(prev => ({ ...prev, imagenes: [...currentImages, url] }));
      }
  };

  const totalMateriales = reportData.materiales.reduce(
    (sum, m) => sum + (m.cantidad * m.precio),
    0
  );

  if (loading) return <div className="loading-report">Cargando editor de reporte...</div>;

  return (
    <div className="reporte-container">
      <div className="print-actions no-print">
        <button onClick={() => navigate(-1)} className="btn-back">
          <ChevronLeft size={18} /> REGRESAR
        </button>
        <button onClick={handleSave} className="btn-save" disabled={saving}>
          <Save size={18} /> {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
        </button>
        <button onClick={handlePrint} className="btn-print">
          <Printer size={18} /> IMPRIMIR REPORTE
        </button>
      </div>

      <div ref={componentRef} className="reporte-content editable-mode">
        {/* Encabezado */}
        <div className="reporte-header">
          <div className="header-left">
            <img src={logo} alt="Logo" className="logo-reporte" />
          </div>
          <div className="header-right">
            <div className="folio-box">
              <span className="folio-label">FOLIO:</span>
              <input 
                className="editable-folio" 
                value={reportData.folio} 
                onChange={(e) => updateField(null, 'folio', e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Título */}
        <div className="reporte-title">
          <h2>REPORTE DE TRABAJO REALIZADO</h2>
          <div className="fecha-trabajo">
            <span>📅 Fecha: 
                <input type="text" className="inline-input" value={reportData.fechaTrabajo} onChange={(e) => updateField(null, 'fechaTrabajo', e.target.value)} />
            </span>
            <span>⏰ Horario: 
                <input type="text" className="inline-input" style={{width: '80px'}} value={reportData.horaInicio} onChange={(e) => updateField(null, 'horaInicio', e.target.value)} /> - 
                <input type="text" className="inline-input" style={{width: '80px'}} value={reportData.horaFin} onChange={(e) => updateField(null, 'horaFin', e.target.value)} />
            </span>
          </div>
        </div>

        {/* Info Cliente */}
        <div className="info-section">
          <h3>INFORMACIÓN DEL CLIENTE</h3>
          <div className="info-grid-2cols">
            <div className="info-linea">
              <strong>NOMBRE:</strong> 
              <input className="editable-span" value={reportData.cliente.nombre} onChange={(e) => updateField('cliente', 'nombre', e.target.value)} />
            </div>
            <div className="info-linea">
              <strong>TELÉFONO:</strong> 
              <input className="editable-span" value={reportData.cliente.telefono} onChange={(e) => updateField('cliente', 'telefono', e.target.value)} />
            </div>
            <div className="info-linea">
              <strong>CORREO:</strong> 
              <input className="editable-span" value={reportData.cliente.correo} onChange={(e) => updateField('cliente', 'correo', e.target.value)} />
            </div>
            <div className="info-linea full-width">
              <strong>DIRECCIÓN:</strong> 
              <input className="editable-span" value={reportData.cliente.direccion} onChange={(e) => updateField('cliente', 'direccion', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Info Propiedad */}
        <div className="info-section">
          <h3>INFORMACIÓN DE LA PROPIEDAD</h3>
          <div className="info-grid-2cols">
            <div className="info-linea">
              <strong>PROPIEDAD:</strong> 
              <input className="editable-span" value={reportData.propiedad.nombre} onChange={(e) => updateField('propiedad', 'nombre', e.target.value)} />
            </div>
            <div className="info-linea">
              <strong>TIPO:</strong> 
              <input className="editable-span" value={reportData.propiedad.tipo} onChange={(e) => updateField('propiedad', 'tipo', e.target.value)} />
            </div>
            <div className="info-linea">
              <strong>SUPERFICIE:</strong> 
              <input className="editable-span" value={reportData.propiedad.superficie} onChange={(e) => updateField('propiedad', 'superficie', e.target.value)} />
            </div>
            <div className="info-linea full-width">
              <strong>UBICACIÓN:</strong> 
              <input className="editable-span" value={reportData.propiedad.direccion} onChange={(e) => updateField('propiedad', 'direccion', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Técnico */}
        <div className="info-section">
          <h3>TÉCNICO RESPONSABLE</h3>
          <div className="info-grid-2cols">
            <div className="info-linea">
              <strong>NOMBRE:</strong> 
              <input className="editable-span" value={reportData.tecnico.nombre} onChange={(e) => updateField('tecnico', 'nombre', e.target.value)} />
            </div>
            <div className="info-linea">
              <strong>ESPECIALIDAD:</strong> 
              <input className="editable-span" value={reportData.tecnico.especialidad} onChange={(e) => updateField('tecnico', 'especialidad', e.target.value)} />
            </div>
            <div className="info-linea">
              <strong>CÉDULA:</strong> 
              <input className="editable-span" value={reportData.tecnico.cedula} onChange={(e) => updateField('tecnico', 'cedula', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="info-section">
          <h3>DESCRIPCIÓN DEL TRABAJO</h3>
          <div className="descripcion-box">
            <textarea 
                className="editable-textarea" 
                value={reportData.descripcion} 
                onChange={(e) => updateField(null, 'descripcion', e.target.value)}
                placeholder="Escribe aquí el resumen de las actividades realizadas..."
            />
          </div>
        </div>

        {/* Materiales */}
        <div className="info-section">
          <h3>MATERIALES UTILIZADOS 
              <button className="btn-add-item no-print" onClick={addMaterial}><Plus size={14}/> AGREGAR</button>
          </h3>
          <table className="materiales-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th style={{width: '60px'}}>Cant.</th>
                <th style={{width: '80px'}}>Unidad</th>
                <th style={{width: '100px'}}>P. Unitario</th>
                <th style={{width: '100px'}}>Subtotal</th>
                <th className="no-print" style={{width: '40px'}}></th>
              </tr>
            </thead>
            <tbody>
              {reportData.materiales.map((material, idx) => (
                <tr key={idx}>
                  <td><input className="table-input" value={material.nombre} onChange={(e) => handleMaterialChange(idx, 'nombre', e.target.value)} /></td>
                  <td><input className="table-input center" type="number" value={material.cantidad} onChange={(e) => handleMaterialChange(idx, 'cantidad', e.target.value)} /></td>
                  <td><input className="table-input center" value={material.unidad} onChange={(e) => handleMaterialChange(idx, 'unidad', e.target.value)} /></td>
                  <td><input className="table-input" type="number" value={material.precio} onChange={(e) => handleMaterialChange(idx, 'precio', e.target.value)} /></td>
                  <td>${(material.cantidad * material.precio).toFixed(2)}</td>
                  <td className="no-print">
                      <button className="btn-row-delete" onClick={() => removeMaterial(idx)}><Trash2 size={12}/></button>
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="4" className="total-label">TOTAL MATERIALES:</td>
                <td className="total-amount">${totalMateriales.toFixed(2)}</td>
                <td className="no-print"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Galería */}
        <div className="info-section">
          <h3>EVIDENCIA FOTOGRÁFICA (Toca para ocultar/mostrar en reporte)</h3>
          <div className="galeria-imagenes">
            {reportData.imagenes.map((img, idx) => (
              <div key={idx} className={`imagen-item ${reportData.imagenes.includes(img) ? '' : 'hidden-print'}`} onClick={() => toggleImage(img)}>
                <img src={img} alt={`Evidencia ${idx + 1}`} />
                <p className="no-print">Foto {idx + 1}</p>
              </div>
            ))}
            {reportData.imagenes.length === 0 && <p className="empty-gallery">No se han seleccionado imágenes de la galería.</p>}
          </div>
        </div>

        {/* Observaciones */}
        <div className="info-section">
          <h3>OBSERVACIONES Y RECOMENDACIONES</h3>
          <div className="observaciones-box">
            <textarea 
                className="editable-textarea" 
                value={reportData.observaciones} 
                onChange={(e) => updateField(null, 'observaciones', e.target.value)}
            />
          </div>
        </div>

        {/* Firmas */}
        <div className="firmas-section">
          <div className="firma-cliente">
            <div className="firma-linea">
                <div className="linea-firma"></div>
            </div>
            <p>Firma del Cliente</p>
          </div>
          <div className="firma-tecnico">
            <div className="firma-linea">
                <div className="linea-firma"></div>
            </div>
            <p>Firma del Técnico</p>
          </div>
        </div>

        {/* Pie de página */}
        <div className="reporte-footer">
          <p>Este documento es un comprobante oficial de los trabajos realizados.</p>
          <p>AGENTE SOLUTIONS - Resolviendo tus necesidades</p>
          <p>Tel: (999) 123-4567 | Email: soporte@agentesolutions.com</p>
        </div>
      </div>
    </div>
  );
};

export default ReporteTrabajo;