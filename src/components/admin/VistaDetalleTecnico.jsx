import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft, User, Mail, MapPin, ArrowRight, ShieldCheck, X, Save, Phone, Lock, CheckCircle, Briefcase, Clipboard, FileText, Clock
} from 'lucide-react';
import '../../styles/Admin/VistaDetalleCliente.css';

const VistaDetalleTecnico = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [tecnico, setTecnico] = useState(location.state?.tecnico || location.state?.u || null);
  const [trabajos, setTrabajos] = useState([]);
  const [levantamientos, setLevantamientos] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: tecnico?.name || tecnico?.nombre || '',
    correo: tecnico?.email || tecnico?.correo || '',
    telefono: tecnico?.phone || tecnico?.telefono || '',
    direccion: tecnico?.address || tecnico?.direccion || '',
    estado: tecnico?.estado || 'Activo',
    password: '',
  });

  useEffect(() => {
    if (!tecnico) return;

    const cargarDatosTecnico = async () => {
      try {
        const id = tecnico.id; // user_id del tecnico
        
        // 1. Obtener TODO el tablero (Igual que en VistaServiciosAdmin)
        const [resWorkOrders, resReportes, resCotizaciones] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/work-orders/all`).catch(() => ({ data: [] })),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/reportes-globales`).catch(() => ({ data: [] })),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`).catch(() => ({ data: [] }))
        ]);

        const todosWorkOrders = resWorkOrders.data || [];
        const reportesGlobales = resReportes.data || [];
        const todasCotizaciones = resCotizaciones.data || [];

        // 2. Filtrar solo los que le pertenecen al técnico actual
        const misWorkOrders = todosWorkOrders.filter(w => {
          const asignadoDirecto = w.tecnico_id == id || w.assigned_to == id;
          const enEquipo = w.technicians && w.technicians.some(t => t.id == id);
          return asignadoDirecto || enEquipo;
        }).map(w => ({
          ...w,
          id: w.id,
          tipo_registro: 'work_order',
          composite_id: `work_order-${w.id}`,
          title: `${w.zone} - ${w.equipment || 'General'}`,
          property_name: w.property?.property_name || w.property?.nombre_propiedad || w.property?.address || 'N/A',
          address: w.property?.address || 'N/A',
          cliente: w.property?.client?.name || 'Sin Cliente',
          scheduled_start: w.scheduled_at,
          status: w.status
        }));

        const todoElTrabajo = [...misWorkOrders];

        // 3. Agrupar evidencias fotográficas por ID de trabajo
        const evidenciasPorTrabajo = {};
        reportesGlobales.forEach(r => {
          // Asegurarnos que el reporte es de este técnico o para este trabajo
          const trabajoId = r.service_id || r.work_order_id;
          if (trabajoId) {
            if (!evidenciasPorTrabajo[trabajoId]) evidenciasPorTrabajo[trabajoId] = [];
            if (r.image_url || r.image_path) {
              evidenciasPorTrabajo[trabajoId].push(r.image_url || r.image_path);
            }
          }
        });

        // 4. Separar en Trabajos y Levantamientos
        const trabajosArr = [];
        const levantamientosArr = [];

        todoElTrabajo.forEach(item => {
          const titulo = (item.title || item.type || item.description || 'Mantenimiento').toLowerCase();
          const itemConFotos = { ...item, evidencias: evidenciasPorTrabajo[item.id] || [] };
          
          if (titulo.includes('levantamiento')) {
            levantamientosArr.push(itemConFotos);
          } else {
            trabajosArr.push(itemConFotos);
          }
        });

        // 5. Filtrar Cotizaciones
        const cotizacionesArr = todasCotizaciones.filter(c => 
          c.tecnico_id == id || c.tecnico_user_id == id || (c.created_by_role === 'Técnico' && (c.tecnico_id == id || c.user_id == id))
        );
        
        setTrabajos(trabajosArr);
        setLevantamientos(levantamientosArr);
        setCotizaciones(cotizacionesArr);

      } catch (error) {
        console.error('Error masivo al reconstruir datos del técnico:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosTecnico();
  }, [tecnico]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const [seccionAbierta, setSeccionAbierta] = useState('trabajos');
  const toggleSeccion = (seccion) => setSeccionAbierta(seccionAbierta === seccion ? null : seccion);

  const guardarCambios = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: tecnico.id,
        first_name: formData.nombre.split(' ')[0] || '',
        last_name: formData.nombre.split(' ').slice(1).join(' ') || '',
        email: formData.correo,
        phone_number: formData.telefono,
        address: formData.direccion,
        is_active: formData.estado === 'Activo' ? 1 : 0,
      };
      if (formData.password) payload.password = formData.password;

      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/usuarios/update-profile`, payload);
      setTecnico({ ...tecnico, ...formData });
      setIsModalOpen(false);
      alert(data.message || '¡Perfil actualizado con éxito!');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('No se pudieron guardar los cambios: ' + (error.response?.data?.message || error.message));
    }
  };

  if (!tecnico) return <div className="text-center p-10">Cargando expediente...</div>;

  const renderCard = (item, type) => {
    const isCompleted = ['finalizado', 'completado', 'completed', 'listo', 'aprobado'].includes((item.status || '').toLowerCase());
    const isPending = ['en proceso', 'en progreso', 'programado', 'por hacer', 'asignado', 'pendiente'].includes((item.status || '').toLowerCase());
    
    let statusColor = '#888';
    if (isCompleted) statusColor = '#16a34a'; 
    else if (isPending) statusColor = '#F26522'; 
    else if ((item.status || '').toLowerCase().includes('rechazado')) statusColor = '#ef4444'; 

    const handleCardClick = () => {
      if (type === 'cotizacion') {
        navigate(`/vista-cotizaciones?quoteId=${item.id}`);
      } else {
        navigate(`/tablero-servicios?jobId=${item.id}`);
      }
    };

    return (
      <div key={item.composite_id || item.id} className="history-log-card clickable-card" onClick={handleCardClick} style={{ borderLeft: `4px solid ${statusColor}`, padding: '15px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}>
        <div className="log-status" style={{ color: statusColor, fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {isCompleted ? <CheckCircle size={14}/> : <Clock size={14}/>} 
          <span>{item.status ? item.status.toUpperCase() : 'ASIGNADO'}</span>
        </div>
        <div className="log-content" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>
            {item.title || item.type || item.description || (type === 'cotizacion' ? `Cotización #${item.folio}` : `Trabajo #${item.id}`)}
          </h4>
          
          {(item.property_name || item.address || item.cliente) && (
             <div style={{fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'flex-start', gap: '5px'}}>
               <MapPin size={14} color="#F26522" style={{ marginTop: '2px', flexShrink: 0 }} />
               <span><strong>{item.property_name || item.cliente || 'Sin nombre'}</strong> <br/> {item.address || 'Sin dirección'}</span>
             </div>
          )}
          
          <div className="log-meta" style={{ display: 'flex', gap: '15px', marginTop: '5px', fontSize: '0.8rem', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14}/> 
              {item.scheduled_start ? `Fecha Asignada: ${new Date(item.scheduled_start).toLocaleDateString()}` : 
              (item.created_at ? `Fecha Creación: ${new Date(item.created_at).toLocaleDateString()}` : 'Sin fecha')}
            </span>
          </div>
        </div>
        {item.evidencias && item.evidencias.length > 0 && (
          <div className="photo-grid-report" style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
            {item.evidencias.slice(0, 4).map((img, idx) => (
              <div key={idx} className="photo-item" style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden' }}>
                <img src={img} alt="evidencia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="detalle-cliente-container">
      <header className="detalle-header">
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F26522', color: 'white', padding: '8px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
          <ChevronLeft size={20} /> REGRESAR
        </button>
        <div className="header-title">
          <h1>Expediente del Técnico</h1>
        </div>
      </header>

      <div className="detalle-main-wrapper">
        <aside className="cliente-data-card">
          <div className="avatar-header-section">
            <div className="avatar-container-large">
              {tecnico.profile_picture_url || tecnico.profile_picture ? (
                <img src={tecnico.profile_picture_url || tecnico.profile_picture} alt="Perfil" className="perfil-photo-circle-large" onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=User'; }} />
              ) : (
                <User size={50} />
              )}
            </div>
            <h2>{tecnico.name || tecnico.nombre}</h2>
            <span className="badge-role-center">{tecnico.rol || 'Técnico'}</span>
          </div>

          <div className="dossier-info-list">
            <div className="info-row-stack">
              <Mail size={18} className="icon-orange" />
              <div><label>CORREO ELECTRÓNICO</label><p>{tecnico.email || tecnico.correo}</p></div>
            </div>
            <div className="info-row-stack">
              <Phone size={18} className="icon-orange" />
              <div><label>TELÉFONO</label><p>{tecnico.phone || tecnico.telefono || 'Sin registrar'}</p></div>
            </div>
            <div className="info-row-stack">
              <MapPin size={18} className="icon-orange" />
              <div><label>DIRECCIÓN PARTICULAR</label><p>{tecnico.address || tecnico.direccion || 'No especificada'}</p></div>
            </div>
            <div className="info-row-stack">
              <ShieldCheck size={18} className="icon-orange" />
              <div><label>ID DE EXPEDIENTE</label><p>#{String(tecnico.id).replace(/[^\d]/g, '')}</p></div>
            </div>
          </div>
          <button className="btn-editar-perfil-new" onClick={() => setIsModalOpen(true)}>MODIFICAR PERFIL</button>
        </aside>

        <main className="propiedades-section">
          <div className={`accordion-item ${seccionAbierta === 'trabajos' ? 'is-open' : ''}`}>
            <div className="section-header clickable" onClick={() => toggleSeccion('trabajos')}>
              <h3><Briefcase size={22} /> TRABAJOS ASIGNADOS Y REALIZADOS</h3><ChevronLeft className="arrow-icon" size={20} />
            </div>
            <div className="accordion-content">
              {cargando ? <p className="text-center p-5">Cargando trabajos... ⏳</p> : trabajos.length > 0 ? (
                <div className="history-grid-layout">{trabajos.map(t => renderCard(t, 'trabajo'))}</div>
              ) : <p className="text-center p-5">Sin trabajos registrados</p>}
            </div>
          </div>

          <div className={`accordion-item ${seccionAbierta === 'levantamientos' ? 'is-open' : ''}`}>
            <div className="section-header clickable" onClick={() => toggleSeccion('levantamientos')}>
              <h3><Clipboard size={22} /> LEVANTAMIENTOS ASIGNADOS Y REALIZADOS</h3><ChevronLeft className="arrow-icon" size={20} />
            </div>
            <div className="accordion-content">
              {cargando ? null : levantamientos.length > 0 ? (
                <div className="history-grid-layout">{levantamientos.map(l => renderCard(l, 'levantamiento'))}</div>
              ) : <p className="text-center p-5">Sin levantamientos registrados</p>}
            </div>
          </div>

          <div className={`accordion-item ${seccionAbierta === 'cotizaciones' ? 'is-open' : ''}`}>
            <div className="section-header clickable" onClick={() => toggleSeccion('cotizaciones')}>
              <h3><FileText size={22} /> COTIZACIONES REALIZADAS</h3><ChevronLeft className="arrow-icon" size={20} />
            </div>
            <div className="accordion-content">
              {cargando ? null : cotizaciones.length > 0 ? (
                <div className="history-grid-layout">{cotizaciones.map(c => renderCard(c, 'cotizacion'))}</div>
              ) : <p className="text-center p-5">Sin cotizaciones registradas</p>}
            </div>
          </div>
        </main>

        {isModalOpen && (
          <div className="modal-overlay-new">
            <div className="modal-card-new">
              <div className="modal-header-new">
                <div className="header-icon-box"><User size={24} /></div>
                <div><h3>Editar Perfil</h3><p>Actualizando información de {tecnico.nombre || tecnico.name}</p></div>
                <button className="btn-close-new" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={guardarCambios} className="modal-body-new">
                <div className="input-grid-new">
                  <div className="input-box-new"><label><User size={14} /> Nombre Completo</label><input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required /></div>
                  <div className="input-box-new"><label><Mail size={14} /> Correo Electrónico</label><input type="email" name="correo" value={formData.correo} onChange={handleInputChange} required /></div>
                  <div className="input-box-new"><label><Phone size={14} /> Número de Teléfono</label><input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} /></div>
                  <div className="input-box-new"><label><Lock size={14} /> Nueva Contraseña</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="En blanco para no cambiar" /></div>
                  <div className="input-box-new full-width"><label><MapPin size={14} /> Dirección Particular</label><input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} placeholder="Ej. Calle 23..." /></div>
                  <div className="input-box-new full-width">
                    <label><CheckCircle size={14} /> Estatus del Técnico</label>
                    <select name="estado" value={formData.estado} onChange={handleInputChange}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="modal-actions-new">
                  <button type="button" className="btn-secondary-new" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary-new"><Save size={18} /> Guardar Cambios</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default VistaDetalleTecnico;