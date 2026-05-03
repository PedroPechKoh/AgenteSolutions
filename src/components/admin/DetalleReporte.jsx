import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [editandoZonaId, setEditandoZonaId] = useState(null);
    const [nuevoNombreZona, setNuevoNombreZona] = useState('');
    const [seccionesAbiertas, setSeccionesAbiertas] = useState({}); // Estado para el acordeón de zonas (DEPRECATED)
    const [selectedImage, setSelectedImage] = useState(null); // Estado para ver la imagen en grande
    const [selectedSubseccion, setSelectedSubseccion] = useState(null); // Estado para el modal de la cuadrícula

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

    // --- FUNCIONES PARA EDITAR/ELIMINAR ZONAS ---
    const handleEliminarZona = async (idZona, nombreZona) => {
        if (!idZona) return alert("Error: ID de zona no encontrado.");
        if (window.confirm(`¿Estás seguro de eliminar la zona "${nombreZona}" y todo su contenido? Esta acción no se puede deshacer.`)) {
            try {
                const token = localStorage.getItem('agente_token');
                await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/property-areas/${idZona}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                alert("Zona eliminada con éxito.");
                window.location.reload(); 
            } catch (error) {
                console.error("Error al eliminar zona:", error);
                alert("Hubo un error al eliminar la zona.");
            }
        }
    };

    const handleGuardarEdicionZona = async (idZona) => {
        if (!nuevoNombreZona.trim()) return alert("El nombre no puede estar vacío");
        try {
            const token = localStorage.getItem('agente_token');
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/property-areas/${idZona}`, 
                { name: nuevoNombreZona.toUpperCase() },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setEditandoZonaId(null);
            window.location.reload();
        } catch (error) {
            console.error("Error al editar zona:", error);
            alert("Error al editar el nombre de la zona.");
        }
    };

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
    const isClient = Number(userData?.role_id) === 3;

    return (
        <div 
            className={`rep-container ${isClient ? 'is-client-view' : ''}`}
            style={isClient ? { height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' } : {}}
        >
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
            <main 
                className="rep-main-content"
                style={isClient ? { flex: 1, overflowY: 'auto', display: 'block', padding: '10px 0', maxWidth: '100%', width: '100%', margin: 0 } : {}}
            >
                <header className="main-banner" style={isClient ? { maxWidth: '1000px', margin: '0 auto 20px auto', width: '100%' } : {}}>
                    <img src={datosBD.foto_fachada || casaImg} alt="Propiedad" />
                    <div className="banner-text">
                        <h1 style={{ margin: 0 }}>{datosBD.propiedad_nombre || datosBD.titulo}</h1>
                        <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '1.1rem', fontWeight: '500' }}>
                            {datosBD.titulo}
                        </p>
                    </div>
                </header>

                <section className="reporte-flujo" style={isClient ? { maxWidth: '1000px', margin: '0 auto', width: '100%' } : {}}>
                    {/* VALIDACIÓN DE SEGURIDAD PARA EVITAR EL ERROR .MAP */}
                    {Array.isArray(datosBD.secciones) && datosBD.secciones.length > 0 ? (() => {
                        // Agrupar los cuartos por Zona
                        const zonasAgrupadas = {};
                        datosBD.secciones.forEach(sec => {
                            // Intentar encontrar el nombre de la zona padre en varias posibles propiedades
                            const nombreZona = 
                                (sec.parent && sec.parent.name) || 
                                (sec.parent && sec.parent.titulo) || 
                                (sec.zona && sec.zona.name) || 
                                sec.zona_nombre || 
                                sec.parent_name || 
                                sec.zona || 
                                sec.parent_area || 
                                sec.parent_area_name || 
                                'ZONAS DE LA PROPIEDAD';

                            const idZona = 
                                (sec.parent && sec.parent.id) || 
                                (sec.zona && sec.zona.id) || 
                                sec.parent_area_id || 
                                sec.zona_id || null;

                            if (!zonasAgrupadas[nombreZona]) {
                                zonasAgrupadas[nombreZona] = {
                                    titulo: nombreZona,
                                    id: idZona,
                                    cuartos: []
                                };
                            }
                            zonasAgrupadas[nombreZona].cuartos.push({
                                ...sec,
                                nombre: sec.titulo,
                                categorias: sec.subSecciones
                            });
                        });
                        const zonas = Object.values(zonasAgrupadas);

                        const renderZonas = zonas.map((zona, idx) => (
                            <div key={`zona-${idx}`} className="seccion-bloque" style={{ padding: '25px', backgroundColor: '#fff', borderLeft: '6px solid #ff7f00' }}>
                                <h3 className="coti-section-title" style={{ fontSize: '1.4rem', borderBottom: 'none', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    {editandoZonaId === zona.id && zona.id ? (
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                            <input 
                                                type="text" 
                                                value={nuevoNombreZona} 
                                                onChange={(e) => setNuevoNombreZona(e.target.value.toUpperCase())}
                                                style={{ padding: '5px 10px', fontSize: '1.2rem', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
                                                autoFocus
                                            />
                                            <button onClick={() => handleGuardarEdicionZona(zona.id)} style={{ padding: '6px 12px', background: '#f26624', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✓</button>
                                            <button onClick={() => setEditandoZonaId(null)} style={{ padding: '6px 12px', background: '#666', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span style={{ textTransform: 'uppercase' }}>{zona.titulo}</span>
                                            {zona.id && (
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button 
                                                        onClick={() => { setEditandoZonaId(zona.id); setNuevoNombreZona(zona.titulo); }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#666', padding: '0 5px' }}
                                                        title="Editar nombre de zona"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEliminarZona(zona.id, zona.titulo)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#e63946', padding: '0 5px' }}
                                                        title="Eliminar zona completa"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </h3>
                                
                                <div className="properties-grid" style={{ justifyContent: 'flex-start' }}>
                                    {zona.cuartos && zona.cuartos.length > 0 ? (
                                        zona.cuartos.map((cuarto, cIdx) => {
                                            const areaFoto = cuarto.foto || cuarto.image_path || cuarto.image || cuarto.foto_url || casaImg;
                                            
                                            // Calcular cantidad total de items en el cuarto
                                            let totalItems = 0;
                                            if (Array.isArray(cuarto.categorias)) {
                                                cuarto.categorias.forEach(cat => {
                                                    totalItems += cat.inventario?.length || 0;
                                                });
                                            }

                                            return (
                                                <div key={`cuarto-${idx}-${cIdx}`} className="property-card" onClick={() => setSelectedSubseccion(cuarto)}>
                                                    <img src={areaFoto} alt={cuarto.nombre} className="property-image" />
                                                    <div className="property-overlay">
                                                        <h3 className="property-title-overlay">{cuarto.nombre}</h3>
                                                        <button className="btn-overlay">
                                                            VER INVENTARIO ({totalItems})
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="empty-zone-message" style={{ width: '100%', textAlign: 'center', padding: '30px', color: '#666', fontStyle: 'italic', border: '1px dashed #ccc', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '10px', color: '#ccc' }}>📦</div>
                                            <p style={{ margin: 0 }}>No hay cuartos registrados en esta zona.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ));

                        return (
                            <>
                                {renderZonas}
                                <div 
                                    className="seccion-bloque add-zone-block" 
                                    onClick={() => navigate(`/RegistroZonas/${datosBD.identificador_curp}`)}
                                    style={{ 
                                        padding: '30px', 
                                        backgroundColor: '#f9f9f9', 
                                        border: '2px dashed #ccc', 
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        marginTop: '20px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f26624'; e.currentTarget.style.backgroundColor = '#fff5f0'; e.currentTarget.style.color = '#f26624'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.backgroundColor = '#f9f9f9'; e.currentTarget.style.color = 'inherit'; }}
                                >
                                    <div style={{ fontSize: '2rem', marginBottom: '10px', color: 'inherit' }}>+</div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'inherit' }}>AGREGAR NUEVA ZONA</h3>
                                    <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9rem' }}>Añadir áreas, cuartos o espacios por remodelación</p>
                                </div>
                            </>
                        );
                    })() : (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🏢</div>
                            <h3 style={{ color: '#444' }}>No hay áreas registradas</h3>
                            <p style={{ color: '#888', marginBottom: '25px' }}>Esta propiedad no tiene zonas ni inventario registrado aún.</p>
                            <button 
                                onClick={() => navigate(`/RegistroZonas/${datosBD.identificador_curp}`)}
                                style={{ padding: '12px 25px', backgroundColor: '#f26624', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                + AGREGAR NUEVA ZONA
                            </button>
                        </div>
                    )}
                </section>
                
                {/* DEBUGER OCULTO SOLO PARA DESARROLLO - BORRAR DESPUÉS */}
                {Array.isArray(datosBD.secciones) && datosBD.secciones.length > 0 && (
                    <div style={{ fontSize: '10px', color: '#ccc', textAlign: 'center', marginTop: '20px' }}>
                        DEBUG KEYS: {Object.keys(datosBD.secciones[0]).join(', ')}
                        {datosBD.secciones[0].parent ? ` | PARENT: ${Object.keys(datosBD.secciones[0].parent).join(', ')}` : ''}
                    </div>
                )}

            </main>

            {/* --- MODAL DEL COTIZADOR --- */}
            {mostrarCotizacion && createPortal(
                <div className="lev-modal-overlay" style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
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
                </div>,
                document.body
            )}

            {/* --- MODAL SELECCIONAR ARCHIVO --- */}
            {isFileMenuOpen && createPortal(
                <div className="lev-modal-overlay" onClick={() => setIsFileMenuOpen(false)} style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
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
                </div>,
                document.body
            )}

            {/* --- MODAL PARA VER INVENTARIO DE SUBSECCIÓN --- */}
            {selectedSubseccion && createPortal(
                <div className="lev-modal-overlay" onClick={() => setSelectedSubseccion(null)} style={{ zIndex: 999998, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
                    <div className="cot-modal-card wide" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="cot-modal-header">
                            <div className="header-content">
                                <span className="header-icon" style={{ padding: '5px 10px', fontSize: '1.2rem', background: '#333' }}>📋</span>
                                <div>
                                    <h3 style={{ textTransform: 'uppercase' }}>{selectedSubseccion.nombre}</h3>
                                    {selectedSubseccion.nota && <p>Nota: {selectedSubseccion.nota}</p>}
                                </div>
                            </div>
                            <button className="close-x" onClick={() => setSelectedSubseccion(null)}>×</button>
                        </div>
                        
                        <div className="cot-modal-body dinamico" style={{ padding: '20px', overflowY: 'auto' }}>
                            {selectedSubseccion.foto && (
                                <div style={{ width: '100%', height: '200px', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden' }}>
                                    <img src={selectedSubseccion.foto || selectedSubseccion.image_path || selectedSubseccion.image || selectedSubseccion.foto_url} alt="Referencia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}

                            {Array.isArray(selectedSubseccion.categorias) && selectedSubseccion.categorias.length > 0 ? (
                                selectedSubseccion.categorias.map((cat, catIdx) => (
                                    <div key={`cat-${catIdx}`} style={{ marginBottom: '30px' }}>
                                        <h4 className="coti-section-title" style={{ width: '100%', borderBottom: '2px solid #ddd', paddingBottom: '10px', color: '#f26624', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ background: '#f26624', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.9rem' }}>{cat.nombre}</span>
                                        </h4>
                                        <div className="table-responsive">
                                            <table className="tabla-inventario">
                                                <thead>
                                                    <tr>
                                                        <th>Elemento</th>
                                                        <th>Marca / Modelo</th>
                                                        <th>Estado</th>
                                                        <th className="txt-center">Cant.</th>
                                                        <th className="txt-center">Foto</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Array.isArray(cat.inventario) && cat.inventario.length > 0 ? (
                                                        cat.inventario.map((inv, iIdx) => (
                                                            <tr key={`mod-inv-${catIdx}-${iIdx}`}>
                                                                <td className="bold">{inv.nombre || inv.categoria}</td>
                                                                <td>
                                                                    {inv.marca || '-'} {inv.modelo && inv.modelo !== 'N/A' ? `/ ${inv.modelo}` : ''}
                                                                    {inv.observaciones && <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Nota: {inv.observaciones}</div>}
                                                                </td>
                                                                <td>
                                                                    {inv.estado ? (
                                                                        <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem', background: '#e9ecef', color: '#495057' }}>{inv.estado}</span>
                                                                    ) : '-'}
                                                                </td>
                                                                <td className="col-cant">{inv.cantidad}</td>
                                                                <td className="txt-center">
                                                                    {inv.foto ? (
                                                                        <img 
                                                                            src={inv.foto} 
                                                                            alt={inv.nombre} 
                                                                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in', border: '1px solid #ddd' }} 
                                                                            onClick={() => setSelectedImage(inv.foto)}
                                                                        />
                                                                    ) : (
                                                                        <span style={{ color: '#ccc', fontSize: '0.8rem' }}>S/F</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="txt-center" style={{ padding: '15px', color: '#888', fontStyle: 'italic' }}>
                                                                Sin ítems en esta categoría
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#666', fontStyle: 'italic', border: '1px dashed #ccc', borderRadius: '8px' }}>
                                    No hay categorías ni inventario registrado en este cuarto.
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* --- MODAL VISOR DE IMAGEN (LIGHTBOX) --- */}
            {selectedImage && createPortal(
                <div 
                    className="lev-modal-overlay" 
                    onClick={() => setSelectedImage(null)} 
                    style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', cursor: 'zoom-out', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
                        <img 
                            src={selectedImage} 
                            alt="Vista ampliada" 
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '90vh', 
                                objectFit: 'contain', 
                                borderRadius: '8px', 
                                boxShadow: '0 5px 25px rgba(0,0,0,0.5)' 
                            }} 
                            onClick={(e) => e.stopPropagation()} /* Para que no se cierre si hace click en la imagen misma */
                        />
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                            style={{ 
                                position: 'absolute', 
                                top: '-15px', 
                                right: '-15px', 
                                background: '#f26624', 
                                color: 'white', 
                                border: '2px solid white', 
                                borderRadius: '50%', 
                                width: '40px', 
                                height: '40px', 
                                fontSize: '1.5rem', 
                                cursor: 'pointer', 
                                fontWeight: 'bold', 
                                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DetalleReporte;