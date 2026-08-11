import React, { useState } from 'react';
import Header from '../../../components/Shared/Header';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/Autonomos/VistaRedAutonomo.css';
import { Network, Plus, Star, MapPin, DollarSign, Clock, CheckCircle } from 'lucide-react';

const mockSolicitudes = [
  { id: 1, titulo: "Mantenimiento de 5 Minisplits", ubicacion: "Norte, Mérida", presupuesto: "$2,000", estado: "Cotizando", cotizaciones: 3, fecha: "2026-08-11" },
  { id: 2, titulo: "Reparación de Fuga de Agua", ubicacion: "Centro, Mérida", presupuesto: "A convenir", estado: "Completado", cotizaciones: 1, fecha: "2026-08-09" }
];

const mockCotizaciones = [
  { id: 101, solicitudId: 1, tecnico: "Juan Pérez", precio: "$1,800", rating: 4.8, mensaje: "Puedo ir mañana a primera hora." },
  { id: 102, solicitudId: 1, tecnico: "Carlos Sánchez", precio: "$2,100", rating: 4.5, mensaje: "Incluye limpieza profunda y gas." }
];

const VistaRedAutonomo = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('mis-solicitudes');
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="red-autonomo-container">
      <Header title="Red de Técnicos" />
      
      <div className="red-content">
        <div className="red-header-actions">
          <div className="red-tabs">
            <button 
              className={`red-tab ${activeTab === 'mis-solicitudes' ? 'active' : ''}`}
              onClick={() => setActiveTab('mis-solicitudes')}
            >
              <Network size={18} /> Mis Publicaciones
            </button>
            <button 
              className={`red-tab ${activeTab === 'cotizaciones' ? 'active' : ''}`}
              onClick={() => setActiveTab('cotizaciones')}
            >
              <DollarSign size={18} /> Cotizaciones Recibidas
            </button>
          </div>
          
          <button className="red-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} /> Publicar en la Red
          </button>
        </div>

        {activeTab === 'mis-solicitudes' && (
          <div className="red-solicitudes-grid">
            {mockSolicitudes.map(sol => (
              <div key={sol.id} className="red-solicitud-card">
                <div className="red-card-header">
                  <h3>{sol.titulo}</h3>
                  <span className={`red-status ${sol.estado.toLowerCase()}`}>{sol.estado}</span>
                </div>
                <div className="red-card-body">
                  <p><MapPin size={16}/> {sol.ubicacion}</p>
                  <p><DollarSign size={16}/> {sol.presupuesto}</p>
                  <p><Clock size={16}/> {sol.fecha}</p>
                </div>
                <div className="red-card-footer">
                  <div className="red-cotizaciones-badge">
                    {sol.cotizaciones} Cotizaciones
                  </div>
                  <button className="red-btn-secondary">Ver Detalles</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'cotizaciones' && (
          <div className="red-cotizaciones-list">
            {mockCotizaciones.map(cot => (
              <div key={cot.id} className="red-cotizacion-item">
                <div className="red-tecnico-info">
                  <h4>{cot.tecnico}</h4>
                  <div className="red-rating">
                    <Star size={14} className="star-icon filled" /> {cot.rating}
                  </div>
                </div>
                <div className="red-propuesta-info">
                  <p className="red-precio">{cot.precio}</p>
                  <p className="red-mensaje">"{cot.mensaje}"</p>
                </div>
                <div className="red-cotizacion-actions">
                  <button className="red-btn-primary small">Aceptar</button>
                  <button className="red-btn-secondary small">Ver Perfil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="red-modal-overlay">
          <div className="red-modal">
            <h2>Publicar Trabajo en la Red</h2>
            <div className="red-modal-body">
              <input type="text" placeholder="Título del trabajo (Ej. Mantenimiento A/C)" className="red-input" />
              <textarea placeholder="Describe lo que necesitas..." className="red-textarea"></textarea>
              <input type="text" placeholder="Ubicación" className="red-input" />
              <input type="text" placeholder="Presupuesto sugerido (Opcional)" className="red-input" />
            </div>
            <div className="red-modal-footer">
              <button className="red-btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="red-btn-primary" onClick={() => setShowModal(false)}>Publicar Ahora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaRedAutonomo;
