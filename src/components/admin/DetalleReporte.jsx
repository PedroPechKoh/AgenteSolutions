import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Admin/DetalleReporte.css';
import logo from "../../assets/Logo4.png";
import casaImg from '../../assets/propiedad_ejemplo.jpg';

const DetalleReporte = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [mostrarCotizacion, setMostrarCotizacion] = useState(false);
    const [metodoCotizacion, setMetodoCotizacion] = useState('manual');

    // Estados para manejo de archivos
    const [archivoPreview, setArchivoPreview] = useState(null);
    const [archivoFisico, setArchivoFisico] = useState(null);

    // --- NUEVOS ESTADOS PARA EL COTIZADOR DINÁMICO (MANTENIENDO LO ANTERIOR) ---
    const [filasConceptos, setFilasConceptos] = useState([{ descripcion: '', cantidad: 1, precio_u: 0 }]);
    const [filasMateriales, setFilasMateriales] = useState([{ nombre: '', cantidad: 1, costo_u: 0 }]);
    const [herramientasBasicas, setHerramientasBasicas] = useState([{ nombre: '', cantidad: 1 }]);
    const [herramientasEspeciales, setHerramientasEspeciales] = useState([]);
    const [observaciones, setObservaciones] = useState('');

    // ESTADO PARA GUARDAR LOS DATOS DE LA BD
    const [datosBD, setDatosBD] = useState(null);
    const [cargando, setCargando] = useState(true);

    // EFECTO PARA TRAER DATOS DE LARAVEL (SIN CAMBIOS)
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

    // --- LÓGICA DE TABLAS DINÁMICAS ---
    const agregarFila = (tipo) => {
        if (tipo === 'concepto') setFilasConceptos([...filasConceptos, { descripcion: '', cantidad: 1, precio_u: 0 }]);
        if (tipo === 'material') setFilasMateriales([...filasMateriales, { nombre: '', cantidad: 1, costo_u: 0 }]);
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

    // Cálculos de totales en tiempo real
    const totalConceptos = filasConceptos.reduce((acc, f) => acc + (f.cantidad * f.precio_u), 0);
    const totalMateriales = filasMateriales.reduce((acc, f) => acc + (f.cantidad * f.costo_u), 0);
    const totalGeneral = totalConceptos + totalMateriales;

    const manejarArchivo = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArchivoFisico(file);
            setArchivoPreview(URL.createObjectURL(file));
        }
    };

    // Lógica para enviar la cotización (MODIFICADA PARA ENVIAR JSON)
    const guardarCotizacion = async () => {
        try {
            const data = new FormData();
            data.append('service_id', id);
            data.append('type', metodoCotizacion);

            if (metodoCotizacion === 'manual') {
                // Enviamos toda la estructura como un string JSON en el campo 'concept'
                const conceptoEstructurado = JSON.stringify({
                    conceptos: filasConceptos,
                    materiales: filasMateriales,
                    herramientas_basicas: herramientasBasicas,
                    herramientas_especiales: herramientasEspeciales
                });
                
                data.append('concept', conceptoEstructurado);
                data.append('estimated_amount', totalGeneral);
                data.append('observations', observaciones);
                data.append('validity_days', 15);
            } else {
                if (!archivoFisico) { alert("Selecciona un documento."); return; }
                data.append('file', archivoFisico);
            }

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert("¡Cotización guardada exitosamente!");
            setMostrarCotizacion(false);
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Hubo un problema al guardar.");
        }
    };

    if (cargando) return <div style={{padding: '50px', textAlign: 'center', color: 'white'}}>Cargando datos del reporte...</div>;
    if (!datosBD) return <div style={{padding: '50px', textAlign: 'center', color: 'white'}}>Error: Reporte no encontrado.</div>;

    return (
        <div className="rep-container">
            {/* SIDEBAR ORIGINAL SIN CAMBIOS */}
            <aside className="rep-sidebar">
                <img src={logo} alt="Logo Agente" className="side-logo" onClick={() => navigate('/')} />
                <div className="side-info">
                    <span className="id-badge">{datosBD.identificador_curp}</span>
                    <h2>{datosBD.propietario}</h2>
                    <div className="rep-clasificacion">
                        <div className="rep-direccion-box" style={{marginTop: '20px', marginBottom: '25px'}}>
                            <p style={{fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '12px'}}>
                                <strong>Dirección:</strong><br/>{datosBD.direccion}
                            </p>
                            <a href={`https://www.google.com/maps/search/?api=1&query=$${datosBD.direccion}`} target="_blank" rel="noopener noreferrer" className="btn-maps">
                                📍 VER EN GOOGLE MAPS
                            </a>
                        </div>
                    </div>
                    <button className="btn-cotizacion" onClick={() => setMostrarCotizacion(true)}>+ GENERAR COTIZACIÓN</button>
                    <hr className="side-hr" />
                    <p><strong>Técnico Asignado:</strong><br/>{datosBD.tecnico}</p>
                    <p><strong>Día de visita programada:</strong><br/>{datosBD.fecha_programada}</p>
                </div>
                <button className="btn-regresar" onClick={() => navigate(-1)}>← VOLVER AL LISTADO</button>
            </aside>

            {/* MAIN CONTENT ORIGINAL SIN CAMBIOS */}
            <main className="rep-main-content">
                <header className="main-banner">
                    <img src={casaImg} alt="Propiedad" />
                    <div className="banner-text"><h1>{datosBD.titulo}</h1></div>
                </header>

                <section className="reporte-flujo">
                    {datosBD.secciones && datosBD.secciones.length > 0 ? (
                        datosBD.secciones.map((sec, idx) => (
                            <div key={`sec-${idx}`} className="seccion-bloque">
                                <div className="seccion-header">
                                    <h3>{sec.titulo}</h3>
                                    {sec.descripcion && <p className="sec-desc">{sec.descripcion}</p>}
                                </div>
                                {sec.subSecciones.map((sub, sIdx) => (
                                    <div key={`sub-${idx}-${sIdx}`} className="subseccion-caja">
                                        <div className="sub-titulo">
                                            <h4>{sub.nombre}</h4>
                                            <span className="nota-tecnica">Nota: {sub.nota}</span>
                                        </div>
                                        <div className="table-responsive">
                                            <table className="tabla-inventario">
                                                <thead>
                                                    <tr><th>Categoría</th><th>Marca</th><th>Modelo</th><th className="txt-center">Cant.</th></tr>
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
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No hay áreas registradas.</div>
                    )}
                </section>
            </main>

            {/* MODAL DE COTIZACIÓN - UNICA PARTE MODIFICADA INTERNAMENTE */}
            {mostrarCotizacion && (
                <div className="lev-modal-overlay" onClick={() => setMostrarCotizacion(false)}>
                    <div className="cot-modal-card" style={{maxWidth: '1000px', width: '95%'}} onClick={e => e.stopPropagation()}>
                        <div className="cot-modal-header">
                            <h3>GENERAR NUEVA COTIZACIÓN</h3>
                            <button className="cot-close-btn" onClick={() => setMostrarCotizacion(false)}>×</button>
                        </div>

                        <div className="cot-tabs-selector">
                            <button className={metodoCotizacion === 'manual' ? 'active' : ''} onClick={() => setMetodoCotizacion('manual')}>📝 Manual</button>
                            <button className={metodoCotizacion === 'archivo' ? 'active' : ''} onClick={() => setMetodoCotizacion('archivo')}>📎 Archivo</button>
                        </div>

                        <div className="cot-modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                            {metodoCotizacion === 'manual' ? (
                                <div className="cot-dinamico-container">
                                    {/* SECCIÓN 1: CONCEPTOS */}
                                    <h4 className="coti-title">1. CONCEPTOS PARA EL CLIENTE</h4>
                                    <table className="coti-table">
                                        <thead>
                                            <tr><th>DESCRIPCIÓN</th><th>CANT.</th><th>PRECIO U.</th><th>SUBTOTAL</th><th></th></tr>
                                        </thead>
                                        <tbody>
                                            {filasConceptos.map((f, i) => (
                                                <tr key={i}>
                                                    <td><input type="text" value={f.descripcion} onChange={(e) => actualizarFila(i, 'descripcion', e.target.value, 'concepto')} placeholder="Concepto..." /></td>
                                                    <td><input type="number" value={f.cantidad} onChange={(e) => actualizarFila(i, 'cantidad', e.target.value, 'concepto')} style={{width: '60px'}} /></td>
                                                    <td><input type="number" value={f.precio_u} onChange={(e) => actualizarFila(i, 'precio_u', e.target.value, 'concepto')} style={{width: '100px'}} /></td>
                                                    <td>${f.cantidad * f.precio_u}</td>
                                                    <td><button onClick={() => eliminarFila(i, 'concepto')}>🗑️</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button className="btn-add-row" onClick={() => agregarFila('concepto')}>+ AGREGAR FILA</button>

                                    {/* SECCIÓN 2: MATERIALES */}
                                    <h4 className="coti-title">2. MATERIALES (PRECIOS INTERNOS)</h4>
                                    <table className="coti-table">
                                        <thead>
                                            <tr><th>MATERIAL</th><th>CANT.</th><th>COSTO U.</th><th>SUBTOTAL</th><th></th></tr>
                                        </thead>
                                        <tbody>
                                            {filasMateriales.map((f, i) => (
                                                <tr key={i}>
                                                    <td><input type="text" value={f.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'material')} placeholder="Material..." /></td>
                                                    <td><input type="number" value={f.cantidad} onChange={(e) => actualizarFila(i, 'cantidad', e.target.value, 'material')} style={{width: '60px'}} /></td>
                                                    <td><input type="number" value={f.costo_u} onChange={(e) => actualizarFila(i, 'costo_u', e.target.value, 'material')} style={{width: '100px'}} /></td>
                                                    <td>${f.cantidad * f.costo_u}</td>
                                                    <td><button onClick={() => eliminarFila(i, 'material')}>🗑️</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button className="btn-add-row" onClick={() => agregarFila('material')}>+ AGREGAR MATERIAL</button>

                                    {/* SECCIÓN 3: HERRAMIENTAS */}
                                    <div style={{display: 'flex', gap: '20px', marginTop: '20px'}}>
                                        <div style={{flex: 1}}>
                                            <h4 className="coti-title">3.1 HERRAMIENTAS BÁSICAS</h4>
                                            {herramientasBasicas.map((h, i) => (
                                                <div key={i} style={{display: 'flex', gap: '5px', marginBottom: '5px'}}>
                                                    <input type="text" value={h.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'basica')} placeholder="Herramienta..." style={{flex: 1}} />
                                                    <button onClick={() => eliminarFila(i, 'basica')}>🗑️</button>
                                                </div>
                                            ))}
                                            <button className="btn-add-row" onClick={() => agregarFila('basica')}>+ AGREGAR</button>
                                        </div>
                                        {/* SECCIÓN 4: OBSERVACIONES */}
<div style={{ marginTop: '20px' }}>
    <h4 className="coti-title">4. OBSERVACIONES ADICIONALES</h4>
    <textarea 
        className="cot-textarea"
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        placeholder="Escribe notas internas o detalles específicos aquí..."
        style={{
            width: '100%',
            height: '80px',
            backgroundColor: '#2a2a2a',
            color: 'white',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '10px',
            marginTop: '10px'
        }}
    />
</div>
                                        <div style={{flex: 1}}>
                                            <h4 className="coti-title">3.2 ESPECIALES</h4>
                                            {herramientasEspeciales.map((h, i) => (
                                                <div key={i} style={{display: 'flex', gap: '5px', marginBottom: '5px'}}>
                                                    <input type="text" value={h.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'especial')} placeholder="Especial..." style={{flex: 1}} />
                                                    <button onClick={() => eliminarFila(i, 'especial')}>🗑️</button>
                                                </div>
                                            ))}
                                            <button className="btn-add-row" onClick={() => agregarFila('especial')}>+ AGREGAR</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="cot-upload-container">
                                    <input type="file" onChange={manejarArchivo} accept="image/*,application/pdf" />
                                    {archivoPreview && <img src={archivoPreview} alt="Vista previa" style={{width: '100%', marginTop: '10px'}} />}
                                </div>
                            )}
                        </div>

                        <div className="cot-modal-footer" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div className="total-display" style={{border: '1px solid #ff9800', padding: '10px 20px', borderRadius: '8px', color: '#ff9800', fontWeight: 'bold', fontSize: '1.2rem'}}>
                                TOTAL: ${totalGeneral}
                            </div>
                            <div>
                                <button className="btn-secundario" onClick={() => setMostrarCotizacion(false)}>CANCELAR</button>
                                <button className="btn-primario" onClick={guardarCotizacion}>ENVIAR COTIZACIÓN</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetalleReporte;