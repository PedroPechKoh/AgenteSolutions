import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Cliente/DetallePr.css';
import Swal from 'sweetalert2';
import { 
  MapPin, User, AlertTriangle, Settings, CheckCircle, 
  X, LayoutDashboard, FileText, Send, Trash2, Clock, Briefcase, MessageSquare,
  CreditCard, Map, ExternalLink, Plus 
} from 'lucide-react';

const DetallePropiedad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // --- ESTADOS ---
  const [isModalPerfilOpen, setIsModalPerfilOpen] = useState(false);
  const [isModalCotizarEmergenciaOpen, setIsModalCotizarEmergenciaOpen] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [emergenciaACotizar, setEmergenciaACotizar] = useState(null);
  const [colaTrabajos, setColaTrabajos] = useState([]);
  const [isModalHistorialOpen, setIsModalHistorialOpen] = useState(false);
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState(null);
  
  // DATOS DE LA PROPIEDAD
  const [datosPropiedad, setDatosPropiedad] = useState({
    personaCargo: "Cargando...",
    curp: "...",
    direccion: "Cargando...",
    mapsUrl: "#" 
  });

  const [cotizaciones, setCotizaciones] = useState([]);
  const [sosPendientes, setSosPendientes] = useState([]);
  const [stats, setStats] = useState({
    sos: 0, pendientes: 0, proceso: 0, listos: 0
  });
  const [historialFinalizados, setHistorialFinalizados] = useState([]);

  // EFECTO DE CARGA
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('agente_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Dashboard data
        const resDash = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/propiedades/${id}/dashboard`, { headers });
        const { propiedad, stats: backStats, historial } = resDash.data;

        setDatosPropiedad({
          personaCargo: propiedad.propietario || "Sin asignar",
          curp: propiedad.custom_curp || propiedad.id,
          direccion: propiedad.address || "Sin dirección",
          mapsUrl: propiedad.coordinates ? `https://maps.google.com/?q=${propiedad.coordinates}` : "#",
          nombre_propiedad: propiedad.nombre_propiedad,
          location: propiedad.location || "Mérida, Yuc."
        });

        setStats(backStats || { sos: 0, pendientes: 0, proceso: 0, listos: 0 });
        
        const histMapeado = (historial || []).map(h => ({
          id: h.id,
          producto: h.title || h.labor || "Trabajo",
          tecnico: h.tecnico_nombre || "Técnico",
          fecha: new Date(h.updated_at || h.fecha).toLocaleDateString(),
          evidencias: h.fotos || []
        }));
        setHistorialFinalizados(histMapeado);

        // 2. Cotizaciones
        const resCot = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`, { 
          params: { property_id: id },
          headers 
        });
        const cots = resCot.data.filter(c => String(c.property_id) === String(id));
        
        const cotsMapeadas = cots.map(c => ({
          id: c.id,
          fecha: c.fecha || new Date(c.created_at).toLocaleDateString(),
          status: c.estado || "Pendiente",
          producto: c.descripcion || c.folio,
          zona: c.zona || "General",
          comentario: c.observaciones || "",
          esEmergencia: c.is_emergency || false,
          items: c.items || []
        }));
        setCotizaciones(cotsMapeadas);

        // 3. SOS Pendientes
        setSosPendientes(cotsMapeadas.filter(c => c.esEmergencia && c.status === "Pendiente"));

        // 4. Servicios/Tablero
        const resServ = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios`, { 
          params: { property_id: id },
          headers 
        });
        const servs = resServ.data.filter(s => String(s.property_id) === String(id));
        
        const colaMapeada = servs.map(s => ({
          id: s.id,
          producto: s.title || s.labor,
          tecnico: s.tecnico_nombre || "Por asignar",
          fecha: s.scheduled_date || "---",
          prioridad: s.priority || "ALTA",
          estado: s.status === "SOS" ? "SOS" : (s.status === "Pendiente" ? "PENDIENTE" : (s.status === "Aprobado" ? "ESPERANDO" : "PROCESO"))
        }));
        setColaTrabajos(colaMapeada);

      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAllData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '20px' }}>
        <div className="spinner" style={{ border: '8px solid #f3f3f3', borderTop: '8px solid #ff6b00', borderRadius: '50%', width: '60px', height: '60px', animation: 'spin 2s linear infinite' }}></div>
        <p style={{ fontWeight: 'bold', color: '#555' }}>Cargando detalles...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="detalle-cliente-wrap">
      {/* QUITAMOS SIDEBAR Y HEADER PORQUE YA ESTÁN EN EL LAYOUT */}

      <div className="management-grid">
        {/* Historial de Servicios */}
        <section className="glass-card">
          <div className="card-header-ui"><CheckCircle size={20} className="icon-blue"/> <h2>Mis Solicitudes</h2></div>
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr><th>Servicio</th><th>Estatus</th><th>Observaciones</th><th>Acción</th></tr>
              </thead>
              <tbody>
                {cotizaciones.map(cot => (
                  <tr key={cot.id} className={cot.esEmergencia ? 'row-priority-sos' : ''}>
                    <td><b>{cot.producto}</b> {cot.esEmergencia && <span className="prio-tag">SOS</span>}</td>
                    <td><span className={`status-pill pill-${cot.status.toLowerCase()}`}>{cot.status}</span></td>
                    <td className="comment-cell">
                      <div className="flex-comment"><MessageSquare size={14} className="icon-gray"/><span>{cot.comentario || "Sin observaciones"}</span></div>
                    </td>
                    <td>
                      <button className="btn-planificar" onClick={() => navigate(`/Cotizaciones`)}>
                        <Eye size={14}/> VER DETALLE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SOS ALERT */}
        <div className="stats-mini-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
           <div className="glass-card" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px' }}>ESTADO DE OBRA</h3>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ff6b00' }}>{stats.proceso || 0}</div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Servicios en proceso</p>
           </div>
           
           {sosPendientes.length > 0 && (
             <div className="sos-alert-banner" style={{ margin: 0, padding: '15px' }}>
                <div className="icon-pulse"><AlertTriangle size={20} /></div>
                <div style={{ fontSize: '0.8rem' }}>
                  <strong>EMERGENCIA ACTIVA</strong>
                  <p>{sosPendientes[0].producto}</p>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Tablero Kanban */}
      <section className="kanban-section-full">
          <div className="section-title"><LayoutDashboard size={20}/> <h2>Tablero de Control</h2></div>
          <div className="kanban-container-ui">
             {["ESPERANDO", "SOS", "PENDIENTE", "PROCESO", "FINALIZADO"].map((estado, idx) => (
               <div key={idx} className={`k-column ${estado === 'SOS' ? 'sos-line' : estado === 'ESPERANDO' ? 'orange-line' : estado === 'PENDIENTE' ? 'yellow-line' : estado === 'PROCESO' ? 'blue-line' : 'green-line'}`}>
                  <div className={`k-header ${estado === 'SOS' ? 'red-text' : estado === 'ESPERANDO' ? 'orange-text' : ''}`}>
                    {estado === 'SOS' ? 'SOS' : estado === 'ESPERANDO' ? 'POR AUTORIZAR' : estado === 'PENDIENTE' ? 'PROGRAMADO' : estado} 
                    <span>{colaTrabajos.filter(t=>t.estado === estado).length}</span>
                  </div>
                  <div className="k-body">
                    {colaTrabajos.filter(t => t.estado === estado).map(t => (
                      <div key={t.id} className={`k-card ${estado === 'SOS' ? 'card-sos-active' : estado === 'ESPERANDO' ? 'card-waiting-client' : ''} animate-fade-in`}>
                          <h4>{t.producto}</h4>
                          <div className="k-footer">
                            <span className={estado === 'SOS' ? 'badge-sos' : estado === 'ESPERANDO' ? 'badge-status-waiting' : 'badge-prio'}>
                              {t.tecnico}
                            </span>
                            <span className="date-text"><Clock size={12}/> {t.fecha}</span>
                          </div>
                      </div>
                    ))}
                  </div>
               </div>
             ))}
          </div>
      </section>

      {/* HISTORIAL */}
      <section className="history-section-container">
        <div className="card-header-ui"><CheckCircle size={20} className="icon-blue"/> <h2>Trabajos Finalizados</h2></div>
        <div className="history-grid-layout">
          {historialFinalizados.map((item) => (
            <div key={item.id} className="history-log-card clickable-card" onClick={() => { setTrabajoSeleccionado(item); setIsModalHistorialOpen(true); }}>
              <div className="log-status"><CheckCircle size={12}/> FINALIZADO</div>
              <div className="log-content">
                <h4>{item.producto}</h4>
                <div className="log-meta">
                  <span><User size={14}/> {item.tecnico}</span>
                  <span><Clock size={14}/> {item.fecha}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODALES REUTILIZADOS */}
      {isModalHistorialOpen && trabajoSeleccionado && (
        <div className="modal-overlay-ui" onClick={() => setIsModalHistorialOpen(false)}>
          <div className="modal-card-ui report-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="header-content">
                <div className="icon-badge-white"><CheckCircle size={22} /></div>
                <div><h3>Detalle del Trabajo</h3><span>{trabajoSeleccionado.producto}</span></div>
              </div>
              <button className="btn-close-light" onClick={() => setIsModalHistorialOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body modern-body">
              <div className="info-grid">
                <div className="info-item-card"><div className="item-icon"><User size={18} /></div><div className="item-details"><label>Técnico</label><p>{trabajoSeleccionado.tecnico}</p></div></div>
                <div className="info-item-card"><div className="item-icon"><Clock size={18} /></div><div className="item-details"><label>Fecha</label><p>{trabajoSeleccionado.fecha}</p></div></div>
              </div>
              <div style={{ marginTop: "20px" }}>
                <h4 style={{ marginBottom: "10px" }}>Evidencias</h4>
                <div className="photo-grid-report">
                  {trabajoSeleccionado.evidencias.map((img, index) => (
                    <div key={index} className="photo-item"><img src={img} alt="evidencia" /></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetallePropiedad;