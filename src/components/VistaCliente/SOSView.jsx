import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, Home, MapPin, Wrench, MessageSquare, ArrowLeft, Send, Phone } from 'lucide-react';
import '../../styles/Cliente/SOSView.css';

const SOSView = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    propiedadId: '',
    area: '',
    productoId: '',
    descripcion: ''
  });

  const [misPropiedades, setMisPropiedades] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);

  useEffect(() => {
    const fetchPropiedades = async () => {
      try {
        const token = localStorage.getItem('agente_token'); 
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/propiedades`,
          {
            headers: {
              'Authorization': `Bearer ${token}` 
            }
          }
        );
        // data will return the properties assigned to the user
        setMisPropiedades(data);
      } catch (error) {
        console.error("Error al cargar propiedades:", error);
      } finally {
        setLoadingProps(false);
      }
    };
    fetchPropiedades();
  }, []);


  // Configuración de WhatsApp con tu número (incluye código de país México: +52)
  const telefonoEmpresa = "529992426030"; 
  const mensajeWA = encodeURIComponent("¡Hola Agente Solutions! Tengo una emergencia SOS y necesito asistencia inmediata.");
  const urlWhatsApp = `https://wa.me/${telefonoEmpresa}?text=${mensajeWA}`;


  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos del reporte SOS:", formData);
    alert("Reporte de emergencia enviado con éxito. Un técnico se pondrá en contacto.");
    navigate(-1);
  };

  return (
    <div className="sos-main-layout-premium">
      <div className="sos-content-area-premium">
        
        <div className="sos-header-inline-premium">
          <button className="btn-back-minimal-premium" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Volver
          </button>
          <div className="sos-badge-urgent-premium">CENTRO DE URGENCIAS</div>
        </div>

        <div className="sos-form-card-premium">
          <div className="sos-intro-premium">
            <AlertTriangle className="icon-emergency-flash-premium" size={50} />
            <h1>Reportar Problema Urgente</h1>
            <p>Describe el problema para una atención prioritaria inmediata.</p>
          </div>

          <div className="wa-direct-container-premium">
             <a href={urlWhatsApp} target="_blank" rel="noopener noreferrer" className="btn-wa-direct-premium">
                <div className="icon-circle-phone"><Phone size={22} /></div>
                <span>CONTACTO DIRECTO WHATSAPP</span>
             </a>
             <div className="separator-text-premium"><span>O REGISTRA UN REPORTE DIGITAL</span></div>
          </div>

          <form className="sos-form-grid-premium" onSubmit={handleSubmit}>
            <div className="sos-input-group-premium full">
              <label><Home size={16} /> Propiedad afectada</label>
              <select 
                required 
                value={formData.propiedadId}
                onChange={(e) => setFormData({...formData, propiedadId: e.target.value})}
              >
                <option value="">-- Selecciona una propiedad --</option>
                {loadingProps ? (
                  <option value="" disabled>Cargando propiedades...</option>
                ) : misPropiedades.length > 0 ? (
                  misPropiedades.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre_propiedad || p.direccion || `Propiedad #${p.id}`}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No tienes propiedades asignadas</option>
                )}
              </select>
            </div>

         
      

            <div className="sos-input-group-premium full">
              <label><MessageSquare size={16} /> Detalles del problema</label>
              <textarea 
                required
                placeholder="Ej: El tomacorriente hace chispas o el aire no enfría..."
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              ></textarea>
            </div>

            <button type="submit" className="btn-submit-sos-urgent-premium">
              <Send size={20} /> ENVIAR REPORTE AHORA
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SOSView;