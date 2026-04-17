import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../../styles/TecnicoStyles/DetalleZona.css";
import { Plus, Edit3, Trash2, ArrowLeft, Settings, Send, Home, Loader2, DoorOpen, LayoutGrid } from 'lucide-react';
import DetalleHabitacion from './DetalleHabitacion';
import Header from '../Shared/Header';

const DetalleZona = ({ zona, propertyCurp, alVolver }) => {
  // Estados para las SUB-HABITACIONES
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  const [habitacionActiva, setHabitacionActiva] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevaHabitacion, setNuevaHabitacion] = useState("");

  // Cargar sub-habitaciones al iniciar
  useEffect(() => {
    if (zona?.id) fetchHabitaciones();
  }, [zona]);

  const fetchHabitaciones = async () => {
    try {
      // Llamamos a la nueva ruta que trae áreas hijas
      const res = await axios.get(`http://127.0.0.1:8000/api/areas/${zona.id}/subareas`);
      setHabitaciones(res.data);
    } catch (error) {
      console.error("Error al cargar habitaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const guardarHabitacion = async () => {
    if (!nuevaHabitacion) return alert("Por favor, ingresa el nombre de la habitación.");

    setGuardando(true);
    try {
      // Guardamos en property_areas apuntando al parent_id
      await axios.post('http://127.0.0.1:8000/api/property-areas', {
        property_id: zona.property_id,
        parent_id: zona.id, // Esto la convierte en sub-habitación
        name: nuevaHabitacion
      });
      
      setIsModalOpen(false);
      setNuevaHabitacion("");
      fetchHabitaciones(); 
    } catch (error) {
      console.error("Error al guardar habitación:", error);
      alert("Hubo un error al registrar la habitación.");
    } finally {
      setGuardando(false);
    }
  };

  if (habitacionActiva) {
    return (
      <DetalleHabitacion 
        habitacion={habitacionActiva} 
        propertyCurp={propertyCurp} // Pasamos el curp para no perderlo
        alVolver={() => {
          setHabitacionActiva(null);
          fetchHabitaciones();
        }} 
      />
    );
  }

  return (
    <>
      <Header />
      <div className="dz-body-wrapper">
        {/* BURBUJAS SUPERIORES (Con tus estilos) */}
        <div className="dz-bubbles-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="dz-btn-back-orange" onClick={alVolver} style={{ marginRight: '0', width: 'auto', padding: '0 20px', height: '40px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center' }}>
               <ArrowLeft size={18} style={{ marginRight: '8px' }}/> VOLVER A ZONAS
            </button>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="dz-info-pill" style={{ color: 'black', display: 'flex', alignItems: 'center' }}>CURP <strong>&nbsp;{propertyCurp || "S/N"}</strong></div>
            <div className="dz-info-pill" style={{ color: 'black', display: 'flex', alignItems: 'center' }}>ID ZONA <strong>&nbsp;{zona?.id}</strong></div>
          </div>
        </div>

        {/* TARJETA PRINCIPAL */}
        <div className="dz-main-card">
          <div className="dz-controls-row">
            <div className="dz-category-tag" style={{ color: 'black' }}>
              CATEGORIA: <strong>{zona?.name || "SIN NOMBRE"}</strong> <Settings size={14} style={{ marginLeft: '5px' }} />
            </div>
            
            <div className="dz-actions-group">
              <button className="dz-btn-plus"><Send size={20} /> ENVIAR</button>
              <button className="dz-btn-save">GUARDAR</button>
              <button className="dz-btn-save" onClick={() => setIsModalOpen(true)}>+</button>
            </div>

            <div className="dz-date-tag">
              FECHA REGISTRO <strong>{new Date().toLocaleDateString()}</strong>
            </div>
          </div>

          {/* LISTA DE SUB-HABITACIONES */}
          <div className="dz-list-container">
            {loading ? (
              <p style={{textAlign: 'center', padding: '20px', color: '#fff'}}>Cargando habitaciones...</p>
            ) : habitaciones.length > 0 ? (
              habitaciones.map((item) => (
                <div key={item.id} className="dz-item-row" style={{ alignItems: 'center' }}>
                  <div className="dz-item-left" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="dz-thumb-box" style={{ width: '50px', height: '50px', backgroundColor: '#f0f0f0', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <DoorOpen size={28} color="#555" />
                    </div>
                    <span className="dz-item-name" style={{ fontSize: '1.1rem' }}>{item.name}</span>
                  </div>
                  
                  <div className="dz-item-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Botón clave para entrar a ver los electrodomésticos */}
                    <button 
                      onClick={() => setHabitacionActiva(item)}
                      style={{ padding: '8px 15px', backgroundColor: '#f37021', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <LayoutGrid size={16} /> VER ACTIVOS
                    </button>
                    <Edit3 size={20} className="dz-icon-edit" style={{ cursor: 'pointer' }} />
                    <Trash2 size={20} className="dz-icon-delete" style={{ cursor: 'pointer' }} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{textAlign: 'center', padding: '40px', color: '#ccc'}}>
                <DoorOpen size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
                <p>No hay sub-habitaciones registradas.</p>
                <p style={{ fontSize: '0.9rem' }}>Presiona el botón <strong>+</strong> para agregar una (Ej. Medio Baño, Cuarto de estar).</p>
              </div>
            )}
          </div>
        </div>

        {/* MODAL SIMPLIFICADO PARA HABITACIONES */}
        {isModalOpen && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-card" style={{ maxWidth: '400px', width: '95%' }}>
              
              <div className="modal-header-gradient">
                <div className="header-content">
                  <Home size={22} color="#fff" />
                  <h2>NUEVA HABITACIÓN</h2>
                </div>
              </div>
              
              <div className="modal-body" style={{ padding: '20px' }}>
                <div className="input-container-modern">
                  <label>NOMBRE (Ej. Cuarto de estar, Baño principal)</label>
                  <input 
                    type="text" 
                    value={nuevaHabitacion} 
                    onChange={(e) => setNuevaHabitacion(e.target.value.toUpperCase())} 
                    placeholder="Escribe aquí..." 
                    autoFocus 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  CANCELAR
                </button>
                <button className="btn-confirm-grad" onClick={guardarHabitacion} disabled={guardando}>
                  {guardando ? <Loader2 size={16} className="animate-spin" /> : 'AGREGAR'}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DetalleZona;