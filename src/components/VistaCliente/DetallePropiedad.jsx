import React, { useState } from 'react';
import '../../styles/Cliente/DetallePropiedad.css';
import Swal from 'sweetalert2';
import { 
  MapPin, User, AlertTriangle, Settings, CheckCircle, 
  X, LayoutDashboard, FileText, Send, Trash2, Clock, Briefcase, MessageSquare,
  CreditCard, Map, ExternalLink, Plus 
} from 'lucide-react';

const DetallePropiedad = () => {
  // --- ESTADOS ---
  const [isModalPerfilOpen, setIsModalPerfilOpen] = useState(false);
  const [isModalCotizarEmergenciaOpen, setIsModalCotizarEmergenciaOpen] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [emergenciaACotizar, setEmergenciaACotizar] = useState(null);
  const [colaTrabajos, setColaTrabajos] = useState([]);
  const [isModalHistorialOpen, setIsModalHistorialOpen] = useState(false);
const [trabajoSeleccionado, setTrabajoSeleccionado] = useState(null);

  // DATOS DE LA PROPIEDAD
  const datosPropiedad = {
    personaCargo: "Alejandra Alcocer",
    curp: "ALCA800101HDFLNR01",
    direccion: "Calle 60 #123 x 45 y 47, Centro, CP 97000",
    mapsUrl: "https://goo.gl/maps/b5R4D8GgJ5Q2" 
  };

  // Datos iniciales
  const [cotizaciones, setCotizaciones] = useState([
    { id: 101, fecha: "20/Mar", status: "ACEPTADA", producto: "Revisión Eléctrica", zona: "PLANTA ALTA", comentario: "Autorizado por el dueño.", esEmergencia: false },
    { id: 103, fecha: "16/Mar", status: "RECHAZADA", producto: "Limpieza Profunda", zona: "GENERAL", comentario: "Precio muy alto.", esEmergencia: false }
  ]);

  const [sosPendientes, setSosPendientes] = useState([
    { id: 501, producto: "FUGA DE AGUA EN COCINA", descripcion: "Tubería rota bajo el fregadero", zona: "COCINA", cliente: "Alejandra V." }
  ]);

  const [itemsCotizacion, setItemsCotizacion] = useState([
    { id: 1, concepto: "Mano de Obra Emergencia", cantidad: 1, precio: "" },
    { id: 2, concepto: "Materiales e Insumos", cantidad: 1, precio: "" }
  ]);

  const [formPlanificacion, setFormPlanificacion] = useState({ tecnico: "", fecha: "", prioridad: "ALTA" });

  // --- FUNCIONES ---
  const abrirModalCotizar = (sos) => {
    setEmergenciaACotizar(sos);
    setIsModalCotizarEmergenciaOpen(true);
  };

  const calcularTotalCotizacion = () => {
    return itemsCotizacion.reduce((acc, item) => acc + (Number(item.precio || 0) * Number(item.cantidad || 0)), 0);
  };

  const agregarFila = () => {
    const nuevoItem = {
      id: Date.now(),
      concepto: "",
      cantidad: 1,
      precio: ""
    };
    setItemsCotizacion([...itemsCotizacion, nuevoItem]);
  };

  const enviarCotizacionFinal = (e) => {
    e.preventDefault();
    const nuevaCot = {
      id: emergenciaACotizar.id,
      fecha: "Hoy",
      status: "ENVIADA", 
      producto: emergenciaACotizar.producto,
      comentario: "Esperando respuesta del cliente...",
      esEmergencia: true
    };

    const nuevoTrabajoPendiente = {
        id: nuevaCot.id,
        producto: nuevaCot.producto,
        tecnico: "Por confirmar",
        fecha: "---",
        prioridad: "SOS",
        estado: "ESPERANDO" 
    };

    setCotizaciones([nuevaCot, ...cotizaciones]);
    setColaTrabajos([nuevoTrabajoPendiente, ...colaTrabajos]);
    setSosPendientes(sosPendientes.filter(s => s.id !== emergenciaACotizar.id));
    setIsModalCotizarEmergenciaOpen(false);
    Swal.fire({ icon: 'info', title: 'Presupuesto Enviado', text: 'Pendiente de aprobación.' });
  };

  const asignarTecnicoFinal = (e) => {
    e.preventDefault();
    const nuevoTrabajo = {
      id: Date.now(),
      producto: cotizacionSeleccionada.producto,
      tecnico: formPlanificacion.tecnico,
      fecha: formPlanificacion.fecha,
      prioridad: formPlanificacion.prioridad,
      comentario: cotizacionSeleccionada.comentario,
      estado: cotizacionSeleccionada.esEmergencia ? "SOS" : "PENDIENTE"
    };

    setCotizaciones(cotizaciones.map(cot => 
      cot.id === cotizacionSeleccionada.id 
      ? { ...cot, status: "ASIGNADO" } 
      : cot
    ));

    setColaTrabajos([nuevoTrabajo, ...colaTrabajos]);
    setCotizacionSeleccionada(null);
    Swal.fire({ icon: 'success', title: 'Técnico Asignado', text: 'Estatus actualizado a ASIGNADO.', timer: 1500, showConfirmButton: false });
  };
 const [historialFinalizados, _setHistorialFinalizados] = useState([
  {
    id: 1,
    producto: "Revisión Eléctrica",
    tecnico: "Tec. Mario",
    fecha: "25/Mar/2026",
    evidencias: [
      "https://via.placeholder.com/150",
      "https://via.placeholder.com/150"
    ]
  },
  {
    id: 2,
    producto: "Fuga de Agua",
    tecnico: "Ing. Jorge",
    fecha: "28/Mar/2026",
    evidencias: [
      "https://via.placeholder.com/150"
    ]
  }
]);

  return (
    <div className="app-container">
      {/* Sidebar y Header (Igual que antes) */}
      <aside className="sidebar-container">
        <div className="sidebar-header">
          <div className="logo-brand">AGENTE <span className="logo-solutions">SOLUTIONS</span></div>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item active"><LayoutDashboard size={18}/> <span>Dashboard</span></button>
          <button className="nav-item" onClick={() => setIsModalPerfilOpen(true)}><User size={18}/> <span>Perfil Propiedad</span></button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="prop-info">
            <h1>Propiedad <span>#101</span></h1>
            <p><MapPin size={14}/> Mérida, Yuc.</p>
          </div>
          <div className="user-badge" onClick={() => setIsModalPerfilOpen(true)}>
            <div className="avatar">AV</div>
            <span>Alejandra Alcocer</span>
          </div>
        </header>

        {sosPendientes.length > 0 && (
          <div className="sos-alert-banner">
            <div className="sos-banner-content">
              <div className="icon-pulse"><AlertTriangle size={24} /></div>
              <div>
                <strong>NUEVA EMERGENCIA DETECTADA</strong>
                <p>{sosPendientes[0].producto}</p>
              </div>
            </div>
            <button className="btn-atender-ahora" onClick={() => abrirModalCotizar(sosPendientes[0])}>COTIZAR AHORA</button>
          </div>
        )}

        <div className="management-grid">
          {/* Historial de Servicios */}
          <section className="glass-card">
            <div className="card-header-ui"><CheckCircle size={20} className="icon-blue"/> <h2>Historial de Servicios</h2></div>
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr><th>Servicio</th><th>Estatus</th><th>Comentario Cliente</th><th>Acción</th></tr>
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
                        {cot.status === "ACEPTADA" ? (
                          <button className="btn-planificar" onClick={() => {
                            setCotizacionSeleccionada(cot);
                            setFormPlanificacion({ tecnico: "", fecha: cot.esEmergencia ? "INMEDIATA" : "", prioridad: cot.esEmergencia ? "SOS" : "ALTA" });
                          }}><Settings size={14}/> ASIGNAR</button>
                        ) : cot.status === "ASIGNADO" ? (
                           <span className="text-assigned"><CheckCircle size={14}/> EN TABLERO</span>
                        ) : (
                          <span className="text-closed">{cot.status === "ENVIADA" ? "ESPERANDO..." : "CERRADO"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Formulario Asignación */}
          <div className="form-container-ui">
            {cotizacionSeleccionada ? (
              <section className={`glass-card planning-section ${cotizacionSeleccionada.esEmergencia ? 'border-sos' : ''}`}>
                <div className="card-header-ui">
                  <Briefcase size={20} className={cotizacionSeleccionada.esEmergencia ? 'icon-red' : 'icon-orange'}/>
                  <h2>{cotizacionSeleccionada.esEmergencia ? "ASIGNAR SOS" : "Planificar"}</h2>
                  <button className="btn-close-form" onClick={() => setCotizacionSeleccionada(null)}><X size={16}/></button>
                </div>
                <form className="modern-form" onSubmit={asignarTecnicoFinal}>
                  <div className="input-group">
                    <label>Técnico Responsable</label>
                    <select required value={formPlanificacion.tecnico} onChange={(e) => setFormPlanificacion({...formPlanificacion, tecnico: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      <option value="Mario">Tec. Mario</option>
                      <option value="Jorge">Ing. Jorge</option>
                    </select>
                  </div>
                  <div className="input-row">
                    <div className="input-group"><label>Fecha Inicio</label><input type="text" value={formPlanificacion.fecha} onChange={(e) => setFormPlanificacion({...formPlanificacion, fecha: e.target.value})} required /></div>
                    <div className="input-group"><label>Prioridad</label>
                      <select value={formPlanificacion.prioridad} onChange={(e) => setFormPlanificacion({...formPlanificacion, prioridad: e.target.value})}>
                        <option value="SOS">SOS</option><option value="ALTA">ALTA</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className={cotizacionSeleccionada.esEmergencia ? 'btn-sos-confirm' : 'btn-primary-ui'}>CONFIRMAR ASIGNACIÓN</button>
                </form>
              </section>
            ) : (
              <div className="empty-state-card">
                <Settings size={32} className="icon-ghost"/>
                <p>Selecciona una cotización aceptada para asignar técnico.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tablero Kanban */}
        <section className="kanban-section-full">
            <div className="section-title"><LayoutDashboard size={20}/> <h2>Tablero de Control de Servicios</h2></div>
            <div className="kanban-container-ui">
               {["ESPERANDO", "SOS", "PENDIENTE"].map((estado, idx) => (
                 <div key={idx} className={`k-column ${estado === 'SOS' ? 'sos-line' : estado === 'ESPERANDO' ? 'orange-line' : 'yellow-line'}`}>
                    <div className={`k-header ${estado === 'SOS' ? 'red-text' : estado === 'ESPERANDO' ? 'orange-text' : ''}`}>
                      {estado === 'SOS' ? 'SOS ACTIVO' : estado === 'ESPERANDO' ? 'POR AUTORIZAR' : 'POR HACER'} 
                      <span>{colaTrabajos.filter(t=>t.estado === estado).length}</span>
                    </div>
                    <div className="k-body">
                      {colaTrabajos.filter(t => t.estado === estado).map(t => (
                        <div key={t.id} className={`k-card ${estado === 'SOS' ? 'card-sos-active' : estado === 'ESPERANDO' ? 'card-waiting-client' : ''} animate-fade-in`}>
                            <h4>{t.producto}</h4>
                            <div className="k-footer">
                              <span className={estado === 'SOS' ? 'badge-sos' : estado === 'ESPERANDO' ? 'badge-status-waiting' : 'badge-prio alta'}>
                                {estado === 'PENDIENTE' ? t.tecnico : (estado === 'SOS' ? 'CRÍTICO' : 'ENVIADO')}
                              </span>
                              <span className={estado === 'SOS' ? 'date-text-red' : 'date-text'}><Clock size={12}/> {t.fecha}</span>
                            </div>
                        </div>
                      ))}
                    </div>
                 </div>
               ))}
               <div className="k-column blue-line"><div className="k-header">EN PROCESO <span>0</span></div><div className="k-body"></div></div>
               <div className="k-column green-line"><div className="k-header">FINALIZADO <span>0</span></div><div className="k-body"></div></div>
            </div>
        </section>
        {/* HISTORIAL DE TRABAJOS FINALIZADOS */}
<section className="history-section-container">
  <div className="card-header-ui">
    <CheckCircle size={20} className="icon-blue"/>
    <h2>Historial de Trabajos Finalizados</h2>
  </div>

  <div className="history-grid-layout">
    {historialFinalizados.map((item) => (
  <div 
  key={item.id} 
  className="history-log-card clickable-card"
  onClick={() => {
    setTrabajoSeleccionado(item);
    setIsModalHistorialOpen(true);
  }}
>
        
        <div className="log-status">
          <CheckCircle size={12}/> FINALIZADO
        </div>

        <div className="log-content">
          <h4>{item.producto}</h4>

          <div className="log-meta">
            <span><User size={14}/> {item.tecnico}</span>
            <span><Clock size={14}/> {item.fecha}</span>
          </div>
        </div>

        <div className="photo-grid-report">
          {item.evidencias.map((img, index) => (
            <div key={index} className="photo-item">
              <img src={img} alt="evidencia"/>
            </div>
          ))}
        </div>

      </div>
    ))}
  </div>
</section>
      </main>

      {/* MODAL DE COTIZACIÓN CON SCROLL INTERNO */}
      {isModalCotizarEmergenciaOpen && (
        <div className="modal-overlay-ui">
          <div className="modal-card-ui invoice-modal animate-fade-in">
            <div className="modal-header-sos">
              <div className="header-info">
                <div className="icon-circle-white"><FileText size={20} /></div>
                <div><h3>Presupuesto Emergencia</h3><span>ID: #{emergenciaACotizar?.id}</span></div>
              </div>
              <button className="btn-close-modal" onClick={() => setIsModalCotizarEmergenciaOpen(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={enviarCotizacionFinal} className="invoice-form">
              <div className="invoice-container">
                {/* ESTE CONTENEDOR TIENE EL SCROLL */}
                <div className="invoice-body-scrollable" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                  {itemsCotizacion.map((item, index) => (
                    <div key={item.id} className="invoice-row animate-fade-in">
                      <div className="col-desc"><input type="text" placeholder="Concepto" value={item.concepto} onChange={(e) => { const n = [...itemsCotizacion]; n[index].concepto = e.target.value; setItemsCotizacion(n); }} required /></div>
                      <div className="col-qty"><input type="number" value={item.cantidad} onChange={(e) => { const n = [...itemsCotizacion]; n[index].cantidad = e.target.value; setItemsCotizacion(n); }} /></div>
                      <div className="col-price"><input type="number" placeholder="0" value={item.precio} onChange={(e) => { const n = [...itemsCotizacion]; n[index].precio = e.target.value; setItemsCotizacion(n); }} required /></div>
                      <div className="col-total">${(Number(item.cantidad) * Number(item.precio)).toLocaleString()}</div>
                      <div className="col-actions">
                        {itemsCotizacion.length > 1 && (
                          <button type="button" className="btn-delete-row" onClick={() => setItemsCotizacion(itemsCotizacion.filter(i => i.id !== item.id))}><Trash2 size={16} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="add-row-container" style={{ margin: '15px 0' }}>
                    <button type="button" className="btn-add-item-orange" onClick={agregarFila} style={{ backgroundColor: '#ff6b00', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '25px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', width: 'fit-content' }}>
                      <Plus size={18} /> Agregar concepto
                    </button>
                  </div>
                </div>
                
                {/* El total y el botón de enviar se quedan fijos abajo */}
                <div className="invoice-summary">
                  <div className="summary-row">
                    <span>Total</span>
                    <span className="grand-total">${calcularTotalCotizacion().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="invoice-actions-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalCotizarEmergenciaOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-send-invoice"><Send size={18}/> ENVIAR COTIZACIÓN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Perfil (Igual que antes) */}
      {isModalPerfilOpen && (
        <div className="modal-overlay-ui" onClick={() => setIsModalPerfilOpen(false)}>
          <div className="modal-card-ui profile-modern animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="header-content">
                <div className="icon-badge-white"><User size={24} /></div>
                <div><h3>Perfil de Propiedad</h3><span>Datos Identificatorios</span></div>
              </div>
              <button className="btn-close-light" onClick={() => setIsModalPerfilOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body modern-body">
              <div className="info-grid">
                <div className="info-item-card"><div className="item-icon"><User size={18} /></div><div className="item-details"><label>Responsable</label><p>{datosPropiedad.personaCargo}</p></div></div>
                <div className="info-item-card"><div className="item-icon"><CreditCard size={18} /></div><div className="item-details"><label>CURP</label><p className="mono-text">{datosPropiedad.curp}</p></div></div>
                <div className="info-item-card full-width"><div className="item-icon"><MapPin size={18} /></div><div className="item-details"><label>Dirección Física</label><p>{datosPropiedad.direccion}</p></div></div>
              </div>
              <div className="modal-footer-actions">
                <a href={datosPropiedad.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-gps-premium"><Map size={18} /><span>Abrir Ubicación en Google Maps</span><ExternalLink size={14} className="icon-ext" /></a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DETALLE HISTORIAL */}
{isModalHistorialOpen && trabajoSeleccionado && (
  <div className="modal-overlay-ui" onClick={() => setIsModalHistorialOpen(false)}>
    
    <div 
      className="modal-card-ui report-modal animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      
      <div className="modal-header-premium">
        <div className="header-content">
          <div className="icon-badge-white">
            <CheckCircle size={22} />
          </div>
          <div>
            <h3>Detalle del Trabajo</h3>
            <span>{trabajoSeleccionado.producto}</span>
          </div>
        </div>

        <button 
          className="btn-close-light"
          onClick={() => setIsModalHistorialOpen(false)}
        >
          <X size={20}/>
        </button>
      </div>

      <div className="modal-body modern-body">

        <div className="info-grid">
          
          <div className="info-item-card">
            <div className="item-icon"><User size={18} /></div>
            <div className="item-details">
              <label>Técnico</label>
              <p>{trabajoSeleccionado.tecnico}</p>
            </div>
          </div>

          <div className="info-item-card">
            <div className="item-icon"><Clock size={18} /></div>
            <div className="item-details">
              <label>Fecha</label>
              <p>{trabajoSeleccionado.fecha}</p>
            </div>
          </div>

          <div className="info-item-card full-width">
            <div className="item-icon"><Briefcase size={18} /></div>
            <div className="item-details">
              <label>Servicio</label>
              <p>{trabajoSeleccionado.producto}</p>
            </div>
          </div>

        </div>

        {/* EVIDENCIAS */}
        <div style={{ marginTop: "20px" }}>
          <h4 style={{ marginBottom: "10px" }}>Evidencias</h4>

          <div className="photo-grid-report">
            {trabajoSeleccionado.evidencias.map((img, index) => (
              <div key={index} className="photo-item">
                <img src={img} alt="evidencia" />
              </div>
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