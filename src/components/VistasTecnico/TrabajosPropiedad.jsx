import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Header from "../Shared/Header";
import "../../styles/TecnicoStyles/TrabajoPropiedad.css";
import { 
  MapPin, Phone, User, Wrench, Clock, 
  ChevronLeft, Navigation, CheckCircle2, AlertCircle,
  FileText, ArrowRight
} from 'lucide-react';

const TrabajoPropiedad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModalFinalizar, setShowModalFinalizar] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios/${id}`);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizar = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/work-orders/${id}/status`, {
        status: 'Listo'
      });
      setShowModalFinalizar(true);
    } catch (error) {
      console.error("Error finalizing job:", error);
    }
  };

  const openInGoogleMaps = () => {
    if (data?.coordenadas) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${data.coordenadas}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="tp-loading-container">
        <div className="tp-loader"></div>
        <p>Cargando detalles del trabajo...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="tp-error-container">
        <AlertCircle size={48} color="#f26624" />
        <h2>No se encontró el trabajo</h2>
        <button onClick={() => navigate('/trabajos-tecnico')}>VOLVER AL LISTADO</button>
      </div>
    );
  }

  return (
    <div className="tp-page-wrapper">
      <Header />
      
      <div className="tp-content-body">
        {/* HEADER DE NAVEGACIÓN */}
        <div className="tp-navigation-bar">
          <button className="tp-back-btn" onClick={() => navigate('/trabajos-tecnico')}>
            <ChevronLeft size={20} />
            <span>Regresar</span>
          </button>
          <div className="tp-status-pill" data-status={data.estado}>
            {data.estado}
          </div>
        </div>

        {/* HERO SECTION: PROPIEDAD */}
        <section className="tp-property-hero">
          <div className="tp-hero-overlay"></div>
          {data.foto_fachada && (
            <img src={data.foto_fachada} alt="Fachada" className="tp-hero-bg" />
          )}
          
          <div className="tp-hero-content">
            <div className="tp-hero-text">
              <span className="tp-id-badge">ID: {data.identificador_curp}</span>
              <h1 className="tp-property-name">{data.propiedad_nombre}</h1>
              <div className="tp-property-address">
                <MapPin size={16} />
                <p>{data.direccion}</p>
              </div>
            </div>
            
            <div className="tp-hero-actions">
              <button className="tp-action-btn maps" onClick={openInGoogleMaps}>
                <Navigation size={18} />
                <span>GPS</span>
              </button>
              <button className="tp-action-btn call" onClick={() => window.open(`tel:${data.telefono_cliente || ''}`)}>
                <Phone size={18} />
                <span>Llamar</span>
              </button>
            </div>
          </div>
        </section>

        {/* CONTENIDO PRINCIPAL: DETALLES DEL TRABAJO */}
        <div className="tp-main-grid">
          
          {/* COLUMNA IZQUIERDA: DESCRIPCIÓN Y DETALLES */}
          <div className="tp-details-column">
            <motion.div 
              className="tp-card tp-work-description-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="tp-card-header">
                <FileText size={20} />
                <h3>CONSISTE EN:</h3>
              </div>
              <div className="tp-work-description">
                <p>{data.descripcion || "Sin descripción detallada."}</p>
              </div>
              
              <div className="tp-work-meta">
                <div className="tp-meta-item">
                  <Clock size={16} />
                  <span>Programado: {data.fecha_programada}</span>
                </div>
                <div className="tp-meta-item">
                  <Wrench size={16} />
                  <span>Título: {data.titulo}</span>
                </div>
              </div>
            </motion.div>

            {/* INFORMACIÓN DEL CLIENTE / CONTACTO */}
            <motion.div 
              className="tp-card tp-client-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="tp-card-header">
                <User size={20} />
                <h3>DATOS DEL CLIENTE</h3>
              </div>
              <div className="tp-client-info">
                <p><strong>Nombre:</strong> {data.propietario}</p>
                <p><strong>Tipo:</strong> {data.tipoPropiedad}</p>
              </div>
            </motion.div>
          </div>

          {/* COLUMNA DERECHA: ACCIONES Y SIGUIENTES PASOS */}
          <div className="tp-actions-column">
            <motion.div 
              className="tp-card tp-flow-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3>ACCIONES DE FLUJO</h3>
              <p className="tp-flow-instruction">¿Listo para comenzar o terminar?</p>
              
              <div className="tp-flow-buttons">
                <button 
                  className="tp-btn-primary" 
                  onClick={() => navigate(data.custom_checklist ? `/Checklist/${id}` : `/trabajo-inicio/${id}`)}
                >
                  <span>INICIAR TRABAJO</span>
                  <ArrowRight size={18} />
                </button>

                <button 
                  className="tp-btn-secondary"
                  onClick={handleFinalizar}
                >
                  <CheckCircle2 size={18} />
                  <span>MARCAR COMO LISTO</span>
                </button>

                <button 
                  className="tp-btn-outline"
                  onClick={() => navigate('/venta-cruzada')}
                >
                  <span>VENTA CRUZADA</span>
                </button>
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* MODAL: FINALIZAR */}
      <AnimatePresence>
        {showModalFinalizar && (
          <div className="tp-modal-overlay">
            <motion.div 
              className="tp-modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="tp-success-icon">
                <CheckCircle2 size={64} color="#f26624" />
              </div>
              <h2>¡TRABAJO FINALIZADO!</h2>
              <p>Se ha enviado para verificación del administrador.</p>
              <button onClick={() => navigate('/trabajos-tecnico')}>VOLVER AL TABLERO</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrabajoPropiedad;
joPropiedad;