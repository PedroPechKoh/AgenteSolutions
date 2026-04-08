import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Admin/DetalleReporte.css';
import logo from "../../assets/Logo4.png";
import casaImg from '../../assets/propiedad_ejemplo.jpg'; 

const DetalleReporte = () => {
  const { id } = useParams();
  const navigate = useNavigate();
    
  // ESTADOS PARA MODALES Y COTIZACIÓN
  const [mostrarCotizacion, setMostrarCotizacion] = useState(false);
  const [metodoCotizacion, setMetodoCotizacion] = useState('manual');
  
  // Estados para manejo de archivos
  const [archivoPreview, setArchivoPreview] = useState(null);
  const [archivoFisico, setArchivoFisico] = useState(null);

  // Estado para el formulario manual
  const [formCotizacion, setFormCotizacion] = useState({
    concepto: '',
    monto: '',
    dias: 15,
    observaciones: ''
  });

  // ESTADO PARA GUARDAR LOS DATOS DE LA BD
  const [datosBD, setDatosBD] = useState(null);
  const [cargando, setCargando] = useState(true);

  // EFECTO PARA TRAER DATOS DE LARAVEL
  useEffect(() => {
    const cargarReporte = async () => {
      try {
        const respuesta = await axios.get(`http://127.0.0.1:8000/api/servicios/${id}`);
        setDatosBD(respuesta.data);
      } catch (error) {
        console.error("Error al cargar el reporte:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarReporte();
  }, [id]);

  // Manejador de inputs del formulario manual
  const handleInputChange = (e) => {
    setFormCotizacion({ ...formCotizacion, [e.target.name]: e.target.value });
  };

  // Lógica para manejar la carga de archivos
  const manejarArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoFisico(file);
      setArchivoPreview(URL.createObjectURL(file));
    }
  };

  // Lógica para enviar la cotización a Laravel
  const guardarCotizacion = async () => {
    try {
      const data = new FormData();
      data.append('service_id', id);
      data.append('type', metodoCotizacion);

      if (metodoCotizacion === 'manual') {
        if (!formCotizacion.concepto || !formCotizacion.monto) {
          alert("El concepto y el monto son obligatorios.");
          return;
        }
        data.append('concept', formCotizacion.concepto);
        data.append('estimated_amount', formCotizacion.monto);
        data.append('validity_days', formCotizacion.dias);
        data.append('observations', formCotizacion.observaciones);
      } else {
        if (!archivoFisico) {
          alert("Por favor selecciona un documento.");
          return;
        }
        data.append('file', archivoFisico);
      }

      await axios.post('http://127.0.0.1:8000/api/cotizaciones', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert("¡Cotización guardada exitosamente!");
      setMostrarCotizacion(false); // Cierra el modal
      
      // Limpia los estados por si quiere abrirlo de nuevo
      setFormCotizacion({ concepto: '', monto: '', dias: 15, observaciones: '' });
      setArchivoPreview(null);
      setArchivoFisico(null);

    } catch (error) {
      console.error("Error al guardar cotización:", error);
      alert("Hubo un problema al guardar la cotización.");
    }
  };

  // PANTALLAS DE CARGA O ERROR
  if (cargando) return <div style={{padding: '50px', textAlign: 'center', color: 'white'}}>Cargando datos del reporte...</div>;
  if (!datosBD) return <div style={{padding: '50px', textAlign: 'center', color: 'white'}}>Error: Reporte no encontrado.</div>;

  return (
    <div className="rep-container">
      {/* SIDEBAR FIJO (Conectado a la BD) */}
      <aside className="rep-sidebar">
        <img src={logo} alt="Logo Agente" className="side-logo" onClick={() => navigate('/')} />
        
        <div className="side-info">
          <span className="id-badge">{datosBD.identificador_curp}</span>
          <h2>{datosBD.propietario}</h2>
          
          <div className="rep-clasificacion">
            <div className="rep-direccion-box" style={{marginTop: '20px', marginBottom: '25px'}}>
              <p style={{fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '12px'}}>
                <strong>Dirección:</strong><br/>
                {datosBD.direccion}
              </p>
              
              <a 
                href={datosBD.coordenadas 
                  ? `https://www.google.com/maps/search/?api=1&query=${datosBD.coordenadas}` 
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(datosBD.direccion)}`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#e8f0fe',
                  color: '#1a73e8',
                  padding: '10px 15px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  border: '1px solid #d2e3fc',
                  transition: 'background 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = '#d2e3fc'}
                onMouseOut={(e) => e.target.style.background = '#e8f0fe'}
              >
                📍 VER EN GOOGLE MAPS
              </a>
            </div>
          </div>

          <button className="btn-cotizacion" onClick={() => setMostrarCotizacion(true)}>
             + GENERAR COTIZACIÓN
          </button>

          <hr className="side-hr" />
          <p><strong>Técnico Asignado:</strong><br/>{datosBD.tecnico}</p>
          <p><strong>Día de visita programada:</strong><br/>{datosBD.fecha_programada}</p>
        </div>
        
        <button className="btn-regresar" onClick={() => navigate(-1)}>← VOLVER AL LISTADO</button>
      </aside>

      {/* CONTENIDO PRINCIPAL CON SCROLL */}
      <main className="rep-main-content">
        <header className="main-banner">
          <img src={casaImg} alt="Propiedad" />
          <div className="banner-text">
            <h1>{datosBD.titulo}</h1>
          </div>
        </header>

        <section className="reporte-flujo">
          {datosBD.secciones && datosBD.secciones.length > 0 ? (
            datosBD.secciones.map((sec, idx) => (
              <div key={idx} className="seccion-bloque">
                <div className="seccion-header">
                  <h3>{sec.titulo}</h3>
                  <p className="sec-desc">{sec.descripcion}</p>
                </div>

                {sec.subSecciones.map((sub, sIdx) => (
                  <div key={sIdx} className="subseccion-caja">
                    <div className="sub-titulo">
                      <h4>{sub.nombre}</h4>
                      <span className="nota-tecnica">Nota: {sub.nota}</span>
                    </div>

                    <table className="tabla-inventario">
                      <thead>
                        <tr>
                          <th>Categoría</th>
                          <th>Marca</th>
                          <th>Modelo</th>
                          <th className="txt-center">Cant.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sub.inventario.map((inv, iIdx) => (
                          <tr key={iIdx}>
                            <td className="bold">{inv.categoria}</td>
                            <td>{inv.marca || '-'}</td>
                            <td>{inv.modelo || '-'}</td>
                            <td className="col-cant">{inv.cantidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <p>No hay áreas ni inventario registrado para esta propiedad todavía.</p>
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE COTIZACIÓN PROFESIONAL */}
      {mostrarCotizacion && (
        <div className="lev-modal-overlay" onClick={() => setMostrarCotizacion(false)}>
          <div className="cot-modal-card" onClick={e => e.stopPropagation()}>
            <div className="cot-modal-header">
              <div className="header-content">
                <span className="header-icon">📄</span>
                <div>
                  <h3>Nueva Cotización</h3>
                  <p>Gestión de presupuesto para Agente Solutions</p>
                </div>
              </div>
              <button className="cot-close-btn" onClick={() => setMostrarCotizacion(false)}>×</button>
            </div>

            <div className="cot-tabs-selector">
              <button className={metodoCotizacion === 'manual' ? 'active' : ''} onClick={() => setMetodoCotizacion('manual')}>
                📝 Registro Manual
              </button>
              <button className={metodoCotizacion === 'archivo' ? 'active' : ''} onClick={() => setMetodoCotizacion('archivo')}>
                📎 Cargar Archivo
              </button>
            </div>

            <div className="cot-modal-body">
              {metodoCotizacion === 'manual' ? (
                <form className="cot-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="cot-field full">
                    <label>Concepto del Servicio</label>
                    <input 
                      type="text" 
                      name="concepto" 
                      value={formCotizacion.concepto} 
                      onChange={handleInputChange} 
                      placeholder="Ej. Mantenimiento Preventivo de Tableros" 
                      required 
                    />
                  </div>
                  <div className="cot-row">
                    <div className="cot-field">
                      <label>Monto Estimado ($)</label>
                      <input 
                        type="number" 
                        name="monto" 
                        value={formCotizacion.monto} 
                        onChange={handleInputChange} 
                        placeholder="0.00" 
                        required 
                      />
                    </div>
                    <div className="cot-field">
                      <label>Días de Validez</label>
                      <input 
                        type="number" 
                        name="dias" 
                        value={formCotizacion.dias} 
                        onChange={handleInputChange} 
                        placeholder="15" 
                      />
                    </div>
                  </div>
                  <div className="cot-field full">
                    <label>Observaciones Adicionales</label>
                    <textarea 
                      name="observaciones" 
                      value={formCotizacion.observaciones} 
                      onChange={handleInputChange} 
                      placeholder="Detalles técnicos o condiciones especiales..." 
                      rows="3"
                    ></textarea>
                  </div>
                </form>
              ) : (
                <div className="cot-upload-container">
                  {!archivoPreview ? (
                    <label className="cot-dropzone">
                      <input type="file" onChange={manejarArchivo} hidden accept="image/*,application/pdf" />
                      <div className="dropzone-content">
                        <span className="upload-icon">☁️</span>
                        <p><strong>Selecciona un archivo</strong> o arrástralo aquí</p>
                        <span>PDF, PNG o JPG (Máx. 10MB)</span>
                      </div>
                    </label>
                  ) : (
                    <div className="cot-preview-box">
                      <div className="preview-header">
                        <span>Documento seleccionado</span>
                        <button onClick={() => { setArchivoPreview(null); setArchivoFisico(null); }}>Eliminar y cambiar</button>
                      </div>
                      <div className="preview-content">
                        {/* Si es PDF mostramos un ícono, si es imagen la previsualizamos */}
                        {archivoFisico?.type === 'application/pdf' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <span style={{ fontSize: '4rem', marginBottom: '10px' }}>📄</span>
                            <span style={{ color: '#fff', textAlign: 'center' }}>{archivoFisico.name}</span>
                          </div>
                        ) : (
                          <img src={archivoPreview} alt="Vista previa cotización" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="cot-modal-footer">
              <button className="btn-secundario" onClick={() => setMostrarCotizacion(false)}>CANCELAR</button>
              <button className="btn-primario" onClick={guardarCotizacion}>GUARDAR COTIZACIÓN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleReporte;