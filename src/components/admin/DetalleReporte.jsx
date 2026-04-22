import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Admin/DetalleReporte.css';
import logo from "../../assets/Logo4.png";
import casaImg from '../../assets/propiedad_ejemplo.jpg';

const DetalleReporte = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- ESTADOS DE LA VISTA PRINCIPAL ---
    const [datosBD, setDatosBD] = useState(null);
    const [cargando, setCargando] = useState(true);

    // --- ESTADOS DEL COTIZADOR ---
    const [mostrarCotizacion, setMostrarCotizacion] = useState(false);
    const [metodoCotizacion, setMetodoCotizacion] = useState('manual');
    const [archivoPreview, setArchivoPreview] = useState(null);
    const [archivoFisico, setArchivoFisico] = useState(null);
    const [filasConceptos, setFilasConceptos] = useState([{ descripcion: '', cantidad: 0, precio_u: 0 }]);
    const [filasMateriales, setFilasMateriales] = useState([{ nombre: '', cantidad: 0, costo_u: 0 }]);
    const [herramientasBasicas, setHerramientasBasicas] = useState([{ nombre: '', cantidad: 1 }]);
    const [herramientasEspeciales, setHerramientasEspeciales] = useState([{ nombre: '', cantidad: 1 }]);
    const [observaciones, setObservaciones] = useState('');

    useEffect(() => {
        const cargarReporte = async () => {
            try {
                const respuesta = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/servicios/${id}`);
                setDatosBD(respuesta.data);
            } catch (error) {
                console.error("Error al cargar el reporte:", error);
            } finally {
                setCargando(false);
            }
        };
        cargarReporte();
    }, [id]);

    // --- LÓGICA DEL COTIZADOR ---
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

    const totalConceptos = filasConceptos.reduce((acc, f) => acc + (Number(f.cantidad) * Number(f.precio_u)), 0);
    const totalMateriales = filasMateriales.reduce((acc, f) => acc + (Number(f.cantidad) * Number(f.costo_u)), 0);
    const totalGeneral = totalConceptos + totalMateriales;

    const manejarArchivo = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArchivoFisico(file);
            setArchivoPreview(URL.createObjectURL(file));
        }
    };

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
            alert("Cotización enviada exitosamente");
            setMostrarCotizacion(false);
        } catch (error) {
            console.error(error);
            alert("Hubo un error al guardar la cotización.");
        }
    };

    if (cargando) return <div className="loading-screen">Cargando datos del reporte...</div>;

    return (
        <div className="rep-container">
            {/* --- SIDEBAR --- */}
            <aside className="rep-sidebar">
                <img src={logo} alt="Logo" className="side-logo" onClick={() => navigate('/')} />
                <div className="side-info">
                    <span className="id-badge">{datosBD?.identificador_curp}</span>
                    <h2 className="propietario-name">{datosBD?.propietario || 'Cargando...'}</h2>
                    <button className="btn-cotizacion" onClick={() => setMostrarCotizacion(true)}>
                        + GENERAR COTIZACIÓN
                    </button>
                </div>
                <button className="btn-regresar" onClick={() => navigate(-1)}>← VOLVER</button>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <main className="rep-main-content">
                <header className="main-banner">
                    <img src={datosBD?.foto_propiedad || casaImg} alt="Propiedad" />
                    <div className="banner-text">
                        <h1>{datosBD?.titulo || 'Detalle del Servicio'}</h1>
                        <p>{datosBD?.direccion || 'Mérida, Yucatán'}</p>
                    </div>
                </header>

                <section className="reporte-flujo">
                    {/* Renderizado dinámico de las secciones del levantamiento */}
                    {datosBD?.secciones && datosBD.secciones.length > 0 ? (
                        datosBD.secciones.map((seccion, idx) => (
                            <div key={idx} className="info-section-card">
                                <h3 className="section-title">{seccion.titulo}</h3>
                                <div className="section-content-grid">
                                    {seccion.items.map((item, i) => (
                                        <div key={i} className="info-item">
                                            <label>{item.nombre_campo}:</label>
                                            <span>{item.valor_campo}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">No hay datos de levantamiento para mostrar.</div>
                    )}
                </section>
            </main>

            {/* --- MODAL DE COTIZACIÓN --- */}
            {mostrarCotizacion && (
                <div className="lev-modal-overlay">
                    <div className="cot-modal-card wide">
                        <div className="cot-modal-header">
                            <h3>NUEVA COTIZACIÓN - FOLIO {datosBD?.identificador_curp}</h3>
                            <button className="cot-close-btn" onClick={() => setMostrarCotizacion(false)}>×</button>
                        </div>

                        <div className="cot-tabs-selector">
                            <button 
                                className={metodoCotizacion === 'manual' ? 'tab-btn active' : 'tab-btn'} 
                                onClick={() => setMetodoCotizacion('manual')}
                            >📝 Manual</button>
                            <button 
                                className={metodoCotizacion === 'archivo' ? 'tab-btn active' : 'tab-btn'} 
                                onClick={() => setMetodoCotizacion('archivo')}
                            >📎 Archivo</button>
                        </div>

                        <div className="cot-modal-body dinamico">
                            {metodoCotizacion === 'manual' ? (
                                <>
                                    {/* SECCIÓN 1: CONCEPTOS */}
                                    <div className="cot-section">
                                        <h4 className="coti-section-title">1. CONCEPTOS DE SERVICIO</h4>
                                        <table className="coti-table">
                                            <thead>
                                                <tr>
                                                    <th>DESCRIPCIÓN</th>
                                                    <th>CANT.</th>
                                                    <th>PRECIO U.</th>
                                                    <th>SUBTOTAL</th>
                                                    <th></th>
                                                </tr>
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
                                        <button className="btn-add-row orange-dashed" onClick={() => agregarFila('concepto')}>+ Agregar Concepto</button>
                                    </div>

                                    {/* SECCIÓN 2: MATERIALES */}
                                    <div className="cot-section">
                                        <h4 className="coti-section-title">2. MATERIALES</h4>
                                        <table className="coti-table">
                                            <thead>
                                                <tr>
                                                    <th>MATERIAL</th>
                                                    <th>CANT.</th>
                                                    <th>COSTO U.</th>
                                                    <th>SUBTOTAL</th>
                                                    <th></th>
                                                </tr>
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
                                        <button className="btn-add-row orange-dashed" onClick={() => agregarFila('material')}>+ Agregar Material</button>
                                    </div>

                                    {/* SECCIÓN 3: HERRAMIENTAS */}
                                    <div className="cot-grid-tools">
                                        <div className="cot-section half">
                                            <h4 className="coti-section-title">3.1 HERRAMIENTAS BÁSICAS</h4>
                                            <table className="coti-table compact">
                                                <tbody>
                                                    {herramientasBasicas.map((h, i) => (
                                                        <tr key={i}>
                                                            <td><input type="text" value={h.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'basica')} /></td>
                                                            <td><button className="btn-delete" onClick={() => eliminarFila(i, 'basica')}>🗑️</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <button className="btn-add-row orange-dashed compact" onClick={() => agregarFila('basica')}>+</button>
                                        </div>
                                        <div className="cot-section half">
                                            <h4 className="coti-section-title">3.2 ESPECIALES</h4>
                                            <table className="coti-table compact">
                                                <tbody>
                                                    {herramientasEspeciales.map((h, i) => (
                                                        <tr key={i}>
                                                            <td><input type="text" value={h.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'especial')} /></td>
                                                            <td><button className="btn-delete" onClick={() => eliminarFila(i, 'especial')}>🗑️</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <button className="btn-add-row orange-dashed compact" onClick={() => agregarFila('especial')}>+</button>
                                        </div>
                                    </div>

                                    <div className="cot-section observations">
                                        <h4 className="coti-section-title">4. OBSERVACIONES</h4>
                                        <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas internas..." />
                                    </div>
                                </>
                            ) : (
                                <div className="cot-upload-container">
                                    <div className="upload-box">
                                        <input type="file" onChange={manejarArchivo} accept="image/*,application/pdf" />
                                        {archivoPreview && <img src={archivoPreview} alt="Preview" className="img-preview" />}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="cot-modal-footer dinamico">
                            <div className="total-box orange-border">
                                <span className="total-label">TOTAL: </span>
                                <strong className="total-amount">${totalGeneral.toLocaleString()}</strong>
                            </div>
                            <div className="footer-actions">
                                <button className="btn-secundario rounded" onClick={() => setMostrarCotizacion(false)}>CANCELAR</button>
                                <button className="btn-primario orange-solid" onClick={guardarCotizacion}>ENVIAR COTIZACIÓN</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetalleReporte;