import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // IMPORTANTE
import axios from 'axios';
import '../../styles/Admin/DetalleReporte.css';
import logo from "../../assets/Logo4.png";
import casaImg from '../../assets/propiedad_ejemplo.jpg';

const DetalleReporte = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- ESTADOS DE LA VISTA PRINCIPAL (LEVANTAMIENTO) ---
    const [datosBD, setDatosBD] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [seccionesAbiertas, setSeccionesAbiertas] = useState({}); // Estado para el acordeón de zonas

    const toggleSeccion = (idx) => {
        setSeccionesAbiertas(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    // --- ESTADOS DEL COTIZADOR ---
    const [mostrarCotizacion, setMostrarCotizacion] = useState(false);
    const [metodoCotizacion, setMetodoCotizacion] = useState('manual');
    const [archivoPreview, setArchivoPreview] = useState(null);
    const [archivoFisico, setArchivoFisico] = useState(null);
    
    // --- REFERENCIAS Y ESTADOS PARA SUBIR ARCHIVOS ---
    const cameraRef = React.useRef(null);
    const galleryRef = React.useRef(null);
    const fileRef = React.useRef(null);
    const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);

    const selectFileSource = (source) => {
        if (source === 'camera') cameraRef.current.click();
        else if (source === 'gallery') galleryRef.current.click();
        else fileRef.current.click();
        setIsFileMenuOpen(false);
    };
    
    // Tablas dinámicas del cotizador
    const [filasConceptos, setFilasConceptos] = useState([{ descripcion: '', cantidad: 0, precio_u: 0 }]);
    const [filasMateriales, setFilasMateriales] = useState([{ nombre: '', cantidad: 0, costo_u: 0 }]);
    const [herramientasBasicas, setHerramientasBasicas] = useState([{ nombre: '', cantidad: 1 }]);
    const [herramientasEspeciales, setHerramientasEspeciales] = useState([{ nombre: '', cantidad: 1 }]);
    const [observaciones, setObservaciones] = useState('');

    // --- CARGA DE DATOS DESDE API ---
    useEffect(() => {
        const cargarReporte = async () => {
            try {
                const token = localStorage.getItem('agente_token');
                const respuesta = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/servicios/${id}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                setDatosBD(respuesta.data);

            } catch (error) {
                console.error("Error al cargar el reporte:", error);
            } finally {
                setCargando(false);
            }
        };
        cargarReporte();
    }, [id]);

    // --- FUNCIONES AUXILIARES DEL COTIZADOR ---
    const agregarFila = (tipo) => {
        if (tipo === 'concepto') setFilasConceptos([...filasConceptos, { descripcion: '', cantidad: 0, precio_u: 0 }]);
        if (tipo === 'material') setFilasMateriales([...filasMateriales, { nombre: '', cantidad: 0, costo_u: 0 }]);
        if (tipo === 'basica') setHerramientasBasicas([...herramientasBasicas, { nombre: '', cantidad: 1 }]);
        if (tipo === 'especial') setHerramientasEspeciales([...herramientasEspeciales, { nombre: '', cantidad: 1 }]);
    };

    const eliminarFila = (index, tipo) => {
        if (tipo === 'concepto') setFilasConceptos(filasConceptos.filter((_, i) => i !== index));
        if (tipo === 'material') setFilasMateriales(filasMateriales.filter((_, i) => i !== index));
        if (tipo === 'basica') setHerramientasBasicas(herramientasBasicas.filter((_, i) => i !== index));
        if (tipo === 'especial') setHerramientasEspeciales(herramientasEspeciales.filter((_, i) => i !== index));
    };

    const actualizarFila = (index, campo, valor, tipo) => {
        const actualizar = (prev) => prev.map((fila, i) => i === index ? { ...fila, [campo]: valor } : fila);
        if (tipo === 'concepto') setFilasConceptos(actualizar);
        if (tipo === 'material') setFilasMateriales(actualizar);
        if (tipo === 'basica') setHerramientasBasicas(actualizar);
        if (tipo === 'especial') setHerramientasEspeciales(actualizar);
    };

    const manejarArchivo = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArchivoFisico(file);
            setArchivoPreview(URL.createObjectURL(file));
        }
    };

    const totalGeneral = filasConceptos.reduce((acc, f) => acc + (Number(f.cantidad) * Number(f.precio_u)), 0) + 
                         filasMateriales.reduce((acc, f) => acc + (Number(f.cantidad) * Number(f.costo_u)), 0);

    const guardarCotizacion = async () => {
        try {
            const data = new FormData();
            data.append('service_id', id);
            data.append('type', metodoCotizacion);

            if (metodoCotizacion === 'manual') {
                data.append('concept', JSON.stringify({
                    conceptos: filasConceptos,
                    materiales: filasMateriales,
                    herramientas_basicas: herramientasBasicas,
                    herramientas_especiales: herramientasEspeciales
                }));
                data.append('estimated_amount', totalGeneral);
                data.append('observations', observaciones);
            } else {
                if (!archivoFisico) return alert("Selecciona un archivo");
                data.append('file', archivoFisico);
            }

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`, data);
            alert("¡Cotización guardada exitosamente!");
            setMostrarCotizacion(false);
        } catch (error) {
            console.error(error);
            alert("Error al guardar la cotización.");
        }
    };

    // --- RENDERIZADO DE CARGA ---
    if (cargando) return <div className="loading-screen">Cargando datos del reporte...</div>;
    if (!datosBD) return <div className="loading-screen">Error: Reporte no encontrado.</div>;

    const userData = JSON.parse(localStorage.getItem('agente_session'))?.userData;
    const isClient = userData?.role_id === 3;

    return (
        <div className={`rep-container ${isClient ? 'is-client-view' : ''}`}>
            {/* --- SIDEBAR (Oculto para clientes) --- */}
            {!isClient && (
                <aside className="rep-sidebar">
                    <img src={logo} alt="Logo" className="side-logo" onClick={() => navigate('/')} />
                    <div className="side-info">
                        <span className="id-badge">{datosBD.identificador_curp}</span>
                        <h2>{datosBD.propietario}</h2>
                        <div className="rep-direccion-box">
                            <p><strong>Dirección:</strong><br/>{datosBD.direccion}</p>
                        </div>
                        {/* Solo el Admin puede generar cotizaciones */}
                        {userData?.role_id !== 3 && (
                            <button className="btn-cotizacion" onClick={() => setMostrarCotizacion(true)}>
                                + GENERAR COTIZACIÓN
                            </button>
                        )}
                        <hr className="side-hr" />
                        <p><strong>Técnico:</strong><br/>{datosBD.tecnico}</p>
                        <p><strong>Visita:</strong><br/>{datosBD.fecha_programada}</p>
                    </div>
                    <button className="btn-regresar" onClick={() => navigate(-1)}>← VOLVER</button>
                </aside>
            )}


            {/* --- CONTENIDO PRINCIPAL (LEVANTAMIENTO) --- */}
            <main className="rep-main-content">
                <header className="main-banner">
                    <img src={datosBD.foto_fachada || casaImg} alt="Propiedad" />
                    <div className="banner-text">
                        <h1>{datosBD.titulo}</h1>
                    </div>
                </header>

                <section className="reporte-flujo">
                    {/* VALIDACIÓN DE SEGURIDAD PARA EVITAR EL ERROR .MAP */}
                    {Array.isArray(datosBD.secciones) && datosBD.secciones.length > 0 ? (
                        datosBD.secciones.map((sec, idx) => {
                            // La foto de la zona principal (ej. BAÑO, COCINA)
                            const zonaFoto = sec.foto || sec.image_path || sec.image;
                            const isAbierta = seccionesAbiertas[idx];

                            return (
                                <div key={`sec-${idx}`} className="seccion-bloque">
                                    <div 
                                        className="seccion-header accordion-header" 
                                        onClick={() => toggleSeccion(idx)}
                                        style={{ cursor: 'pointer', transition: 'background-color 0.3s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                    >
                                        <div className="sec-header-info">
                                            <h3>{sec.titulo}</h3>
                                            {sec.descripcion && <p className="sec-desc" style={{ marginBottom: 0 }}>{sec.descripcion}</p>}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            {zonaFoto && (
                                                <img src={zonaFoto} alt={sec.titulo} className="sec-foto-header" />
                                            )}
                                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f26624', width: '24px', textAlign: 'center' }}>
                                                {isAbierta ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </div>

                                    {isAbierta && (
                                        <div className="seccion-body" style={{ borderTop: '1px solid #eee' }}>
                                            {Array.isArray(sec.subSecciones) && sec.subSecciones.length > 0 ? (
                                                sec.subSecciones.map((sub, sIdx) => {
                                                    // Probamos todas las posibles propiedades de imagen de la sub-área
                                                    const areaFoto = sub.foto || sub.image_path || sub.image || sub.foto_url;
                                                    
                                                    return (
                                                        <div key={`sub-${idx}-${sIdx}`} className="subseccion-caja">
                                                            <div className="subseccion-contenido">
                                                                {/* Si tiene foto, la mostramos a la izquierda */}
                                                                {areaFoto && (
                                                                    <div className="subseccion-foto-wrapper">
                                                                        <img src={areaFoto} alt={sub.nombre} className="subseccion-foto" />
                                                                    </div>
                                                                )}
                                                                
                                                                <div className="subseccion-info">
                                                                    <div className="sub-titulo">
                                                                        <h4>{sub.nombre}</h4>
                                                                        {sub.nota && <span className="nota-tecnica">Nota: {sub.nota}</span>}
                                                                    </div>

                                                                    <div className="table-responsive">
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
                                                                                {Array.isArray(sub.inventario) && sub.inventario.length > 0 ? (
                                                                                    sub.inventario.map((inv, iIdx) => (
                                                                                        <tr key={`inv-${idx}-${sIdx}-${iIdx}`}>
                                                                                            <td className="bold">{inv.categoria}</td>
                                                                                            <td>{inv.marca || '-'}</td>
                                                                                            <td>{inv.modelo || '-'}</td>
                                                                                            <td className="col-cant">{inv.cantidad}</td>
                                                                                        </tr>
                                                                                    ))
                                                                                ) : (
                                                                                    <tr>
                                                                                        <td colSpan="4" className="txt-center" style={{ padding: '15px', color: '#888', fontStyle: 'italic' }}>
                                                                                            Sin ítems en esta categoría
                                                                                        </td>
                                                                                    </tr>
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="empty-zone-message" style={{ textAlign: 'center', padding: '30px 20px', color: '#666', backgroundColor: '#fcfcfc', borderRadius: '8px', border: '1px dashed #ccc' }}>
                                                    <div style={{ fontSize: '2rem', marginBottom: '10px', color: '#ccc' }}>📦</div>
                                                    <p style={{ margin: 0, fontStyle: 'italic' }}>No hay componentes ni inventario registrados en esta zona ({sec.titulo}).</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🏢</div>
                            <h3 style={{ color: '#444' }}>No hay áreas registradas</h3>
                            <p style={{ color: '#888' }}>Esta propiedad no tiene zonas ni inventario registrado aún.</p>
                        </div>
                    )}
                </section>


            </main>

            {/* --- MODAL DEL COTIZADOR --- */}
            {mostrarCotizacion && (
                <div className="lev-modal-overlay">
                    <div className="cot-modal-card wide">
                        <div className="cot-modal-header">
                            <h3>NUEVA COTIZACIÓN - {datosBD.identificador_curp}</h3>
                            <button className="cot-close-btn" onClick={() => setMostrarCotizacion(false)}>×</button>
                        </div>

                        <div className="cot-tabs-selector">
                            <button className={metodoCotizacion === 'manual' ? 'active' : ''} onClick={() => setMetodoCotizacion('manual')}>📝 Registro Manual</button>
                            <button className={metodoCotizacion === 'archivo' ? 'active' : ''} onClick={() => setMetodoCotizacion('archivo')}>📎 Cargar Archivo</button>
                        </div>

                        <div className="cot-modal-body dinamico">
                            {metodoCotizacion === 'manual' ? (
                                <>
                                    <div className="cot-section">
                                        <h4 className="coti-section-title">1. CONCEPTOS DE SERVICIO</h4>
                                        <table className="coti-table">
                                            <thead>
                                                <tr><th>DESCRIPCIÓN</th><th>CANT.</th><th>PRECIO U.</th><th>SUBTOTAL</th><th></th></tr>
                                            </thead>
                                            <tbody>
                                                {filasConceptos.map((f, i) => (
                                                    <tr key={i}>
                                                        <td><input type="text" value={f.descripcion} onChange={(e) => actualizarFila(i, 'descripcion', e.target.value, 'concepto')} /></td>
                                                        <td><input type="number" value={f.cantidad} onChange={(e) => actualizarFila(i, 'cantidad', e.target.value, 'concepto')} /></td>
                                                        <td><input type="number" value={f.precio_u} onChange={(e) => actualizarFila(i, 'precio_u', e.target.value, 'concepto')} /></td>
                                                        <td className="subtotal-cell">${(f.cantidad * f.precio_u).toLocaleString()}</td>
                                                        <td><button className="btn-delete" onClick={() => eliminarFila(i, 'concepto')}>🗑️</button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button className="btn-add-row" onClick={() => agregarFila('concepto')}>+ Agregar Concepto</button>
                                    </div>

                                    <div className="cot-section">
                                        <h4 className="coti-section-title">2. MATERIALES</h4>
                                        <table className="coti-table">
                                            <thead>
                                                <tr><th>MATERIAL</th><th>CANT.</th><th>COSTO U.</th><th>SUBTOTAL</th><th></th></tr>
                                            </thead>
                                            <tbody>
                                                {filasMateriales.map((f, i) => (
                                                    <tr key={i}>
                                                        <td><input type="text" value={f.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'material')} /></td>
                                                        <td><input type="number" value={f.cantidad} onChange={(e) => actualizarFila(i, 'cantidad', e.target.value, 'material')} /></td>
                                                        <td><input type="number" value={f.costo_u} onChange={(e) => actualizarFila(i, 'costo_u', e.target.value, 'material')} /></td>
                                                        <td className="subtotal-cell">${(f.cantidad * f.costo_u).toLocaleString()}</td>
                                                        <td><button className="btn-delete" onClick={() => eliminarFila(i, 'material')}>🗑️</button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button className="btn-add-row" onClick={() => agregarFila('material')}>+ Agregar Material</button>
                                    </div>

                                    <div className="cot-grid-tools">
                                        <div className="cot-section half">
                                            <h4 className="coti-section-title">3.1 HERRAMIENTAS BÁSICAS</h4>
                                            {herramientasBasicas.map((h, i) => (
                                                <div key={i} className="tool-row">
                                                    <input type="text" value={h.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'basica')} />
                                                    <button className="btn-delete-small" onClick={() => eliminarFila(i, 'basica')}>×</button>
                                                </div>
                                            ))}
                                            <button className="btn-add-tool" onClick={() => agregarFila('basica')}>+</button>
                                        </div>
                                        <div className="cot-section half">
                                            <h4 className="coti-section-title">3.2 ESPECIALES</h4>
                                            {herramientasEspeciales.map((h, i) => (
                                                <div key={i} className="tool-row">
                                                    <input type="text" value={h.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'especial')} />
                                                    <button className="btn-delete-small" onClick={() => eliminarFila(i, 'especial')}>×</button>
                                                </div>
                                            ))}
                                            <button className="btn-add-tool" onClick={() => agregarFila('especial')}>+</button>
                                        </div>
                                    </div>

                                    <div className="cot-section">
                                        <label>Observaciones Adicionales</label>
                                        <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows="3" placeholder="Notas internas..." />
                                    </div>
                                </>
                            ) : (
                                <div className="cot-upload-container">
                                    <div 
                                        onClick={() => setIsFileMenuOpen(true)}
                                        style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            gap: '15px',
                                            border: '3px dashed #f26624',
                                            borderRadius: '15px',
                                            padding: '40px 20px',
                                            backgroundColor: '#fff5f0',
                                            cursor: 'pointer',
                                            minHeight: '250px',
                                            textAlign: 'center',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffe5d9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff5f0'}
                                    >
                                        {!archivoPreview ? (
                                            <>
                                                <div style={{ backgroundColor: '#f26624', color: 'white', borderRadius: '50%', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>
                                                    📁
                                                </div>
                                                <h3 style={{ color: '#f26624', margin: '10px 0 0 0' }}>Toca aquí para subir un archivo</h3>
                                                <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>Soporta PDF, DOC, JPG, PNG o usa tu cámara</p>
                                            </>
                                        ) : (
                                            <div className="preview-box" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                {archivoFisico?.type === 'application/pdf' ? (
                                                    <>
                                                        <div style={{ fontSize: '60px' }}>📄</div>
                                                        <div className="pdf-placeholder" style={{ fontSize: '1.2rem', color: '#f26624', fontWeight: 'bold', marginTop: '10px' }}>{archivoFisico.name}</div>
                                                    </>
                                                ) : (
                                                    <img src={archivoPreview} className="img-preview" alt="Vista previa" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '2px solid #f26624' }} />
                                                )}
                                                <p style={{ color: '#666', marginTop: '15px', fontSize: '0.9rem', textDecoration: 'underline' }}>Haz clic para cambiar de archivo</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <input type="file" ref={cameraRef} hidden accept="image/*" onChange={manejarArchivo} />
                                    <input type="file" ref={galleryRef} hidden accept="image/*" onChange={manejarArchivo} />
                                    <input type="file" ref={fileRef} hidden accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={manejarArchivo} />
                                </div>
                            )}
                        </div>

                        <div className="cot-modal-footer dinamico">
                            <div className="total-box">
                                <span>TOTAL ESTIMADO:</span>
                                <strong>${totalGeneral.toLocaleString()}</strong>
                            </div>
                            <div className="actions">
                                <button className="btn-secundario" onClick={() => setMostrarCotizacion(false)}>CANCELAR</button>
                                <button className="btn-primario" onClick={guardarCotizacion}>GUARDAR COTIZACIÓN</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL SELECCIONAR ARCHIVO --- */}
            {isFileMenuOpen && (
                <div className="lev-modal-overlay" onClick={() => setIsFileMenuOpen(false)} style={{ zIndex: 10000 }}>
                    <div className="cot-modal-card" style={{ maxWidth: '400px', padding: '0', backgroundColor: '#1a1a1a', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: '#F26522', borderBottom: '1px solid #333', margin: 0, padding: '20px', textAlign: 'center', fontSize: '1.2rem' }}>Seleccionar Archivo</h3>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <button 
                                onClick={() => selectFileSource('camera')}
                                style={{ background: 'transparent', border: 'none', padding: '15px', color: 'white', borderBottom: '1px solid #333', fontSize: '1rem', cursor: 'pointer' }}
                            >
                                📷 Tomar Foto
                            </button>
                            <button 
                                onClick={() => selectFileSource('gallery')}
                                style={{ background: 'transparent', border: 'none', padding: '15px', color: 'white', borderBottom: '1px solid #333', fontSize: '1rem', cursor: 'pointer' }}
                            >
                                🖼️ Elegir Imagen
                            </button>
                            <button 
                                onClick={() => selectFileSource('file')}
                                style={{ background: 'transparent', border: 'none', padding: '15px', color: 'white', borderBottom: '1px solid #333', fontSize: '1rem', cursor: 'pointer' }}
                            >
                                📄 Subir Documento (PDF, DOC)
                            </button>
                            <button 
                                onClick={() => setIsFileMenuOpen(false)}
                                style={{ background: 'transparent', border: 'none', padding: '15px', color: '#a0a0a0', fontSize: '1rem', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetalleReporte;