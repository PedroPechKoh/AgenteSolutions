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
        const id = tecnico.id;
        
        // 1. Trabajos y Levantamientos
        const resServicios = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/tecnico/${id}/servicios`);
        let servicios = resServicios.data || [];
        if (!Array.isArray(servicios)) servicios = [];

        // 2. Reportes para fotos
        const resReportes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/reportes-globales`);
        const reportesTecnico = (resReportes.data || []).filter(r => 
          r.technician_id == id || (r.technician && r.technician.id == id)
        );

        // Agrupar fotos por trabajo
        const evidenciasPorTrabajo = {};
        reportesTecnico.forEach(r => {
          const trabajoId = r.service_id || r.work_order_id || r.id;
          if (!evidenciasPorTrabajo[trabajoId]) evidenciasPorTrabajo[trabajoId] = [];
          if (r.image_url || r.image_path) {
            evidenciasPorTrabajo[trabajoId].push(r.image_url || r.image_path);
          }
        });

        const trabajosArr = [];
        const levantamientosArr = [];

        servicios.forEach(s => {
          const titulo = (s.title || s.type || s.description || 'Mantenimiento').toLowerCase();
          const obj = { ...s, evidencias: evidenciasPorTrabajo[s.id] || [] };
          if (titulo.includes('levantamiento')) {
            levantamientosArr.push(obj);
          } else {
            trabajosArr.push(obj);
          }
        });

        // 3. Cotizaciones
        const resCotizaciones = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`);
        const cotizacionesArr = (resCotizaciones.data || []).filter(c => c.created_by == id || c.technician_id == id);
        
        setTrabajos(trabajosArr);
        setLevantamientos(levantamientosArr);
        setCotizaciones(cotizacionesArr);
      } catch (error) {
        console.error('Error al cargar datos del técnico:', error);
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

  const renderCard = (item, prefixUrl) => {
    const isCompleted = ['finalizado', 'completado', 'completed', 'listo'].includes((item.status || '').toLowerCase());
    const statusColor = isCompleted ? 'green' : (item.status === 'En Proceso' || item.status === 'En Progreso' ? '#F26522' : '#888');
    
    return (
      <div key={item.id} className="history-log-card clickable-card" onClick={() => navigate(`/${prefixUrl}/${item.id}`)}>
        <div className="log-status" style={{ color: statusColor, borderColor: statusColor }}>
          <CheckCircle size={12}/> {item.status ? item.status.toUpperCase() : 'ASIGNADO'}
        </div>
        <div className="log-content">
          <h4>{item.title || item.type || item.description || (prefixUrl.includes('cotiza') ? `Cotización #${item.folio}` : `Trabajo #${item.id}`)}</h4>
          {(item.property_name || item.address || item.cliente) && (
             <div style={{fontSize: '0.85rem', color: '#64748b', marginBottom: '8px'}}>
               <strong>{item.property_name || item.cliente || 'Sin nombre'}</strong> - {item.address || 'Sin dirección'}
             </div>
          )}
          <div className="log-meta">
            <span><User size={14}/> {tecnico.name || tecnico.nombre}</span>
            <span><Clock size={14}/> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Sin fecha'}</span>
          </div>
        </div>
        {item.evidencias && item.evidencias.length > 0 && (
          <div className="photo-grid-report">
            {item.evidencias.map((img, idx) => (
              <div key={idx} className="photo-item">
                <img src={img} alt="evidencia"/>
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
              <h3><Briefcase size={22} /> TRABAJOS REALIZADOS</h3><ChevronLeft className="arrow-icon" size={20} />
            </div>
            <div className="accordion-content">
              {cargando ? <p className="text-center p-5">Cargando trabajos... ⏳</p> : trabajos.length > 0 ? (
                <div className="history-grid-layout">{trabajos.map(t => renderCard(t, 'detalle-trabajo'))}</div>
              ) : <p className="text-center p-5">Sin trabajos registrados</p>}
            </div>
          </div>

          <div className={`accordion-item ${seccionAbierta === 'levantamientos' ? 'is-open' : ''}`}>
            <div className="section-header clickable" onClick={() => toggleSeccion('levantamientos')}>
              <h3><Clipboard size={22} /> LEVANTAMIENTOS REALIZADOS</h3><ChevronLeft className="arrow-icon" size={20} />
            </div>
            <div className="accordion-content">
              {cargando ? null : levantamientos.length > 0 ? (
                <div className="history-grid-layout">{levantamientos.map(l => renderCard(l, 'detalle-levantamiento'))}</div>
              ) : <p className="text-center p-5">Sin levantamientos registrados</p>}
            </div>
          </div>

          <div className={`accordion-item ${seccionAbierta === 'cotizaciones' ? 'is-open' : ''}`}>
            <div className="section-header clickable" onClick={() => toggleSeccion('cotizaciones')}>
              <h3><FileText size={22} /> COTIZACIONES REALIZADAS</h3><ChevronLeft className="arrow-icon" size={20} />
            </div>
            <div className="accordion-content">
              {cargando ? null : cotizaciones.length > 0 ? (
                <div className="history-grid-layout">{cotizaciones.map(c => renderCard(c, 'detalle-cotizacion'))}</div>
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