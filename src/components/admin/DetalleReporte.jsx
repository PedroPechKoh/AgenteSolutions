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
    const [metodoCotizacion, setMetodoCotizacion] = useState('manual'); // <--- AHORA SE USA ABAJO
    const [archivoPreview, setArchivoPreview] = useState(null);
    const [archivoFisico, setArchivoFisico] = useState(null);

    // ESTADOS DEL COTIZADOR DINÁMICO
    const [filasConceptos, setFilasConceptos] = useState([{ descripcion: '', cantidad: 0, precio_u: 0 }]);
    const [filasMateriales, setFilasMateriales] = useState([{ nombre: '', cantidad: 0, costo_u: 0 }]);
    const [herramientasBasicas, setHerramientasBasicas] = useState([{ nombre: '', cantidad: 1 }]);
    const [herramientasEspeciales, setHerramientasEspeciales] = useState([{ nombre: '', cantidad: 1 }]);
    const [observaciones, setObservaciones] = useState(''); 

    const [datosBD, setDatosBD] = useState(null);
    const [cargando, setCargando] = useState(true);

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
                    herramientas_especiales: herramientasEspeciales,
                    notas: observaciones
                }));
                data.append('estimated_amount', totalGeneral);
                data.append('observations', observaciones);
            } else {
                if (!archivoFisico) return alert("Selecciona un archivo");
                data.append('file', archivoFisico);
            }

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones`, data);
            alert("¡Cotización guardada!");
            setMostrarCotizacion(false);
        } catch (error) {
            console.error(error);
            alert("Error al guardar.");
        }
    };

    if (cargando) return <div style={{padding: '50px', textAlign: 'center', color: 'white'}}>Cargando datos...</div>;
    if (!datosBD) return <div style={{padding: '50px', textAlign: 'center', color: 'white'}}>Reporte no encontrado.</div>;

    return (
        <div className="rep-container">
            {/* SIDEBAR - SIN CAMBIOS */}
            <aside className="rep-sidebar">
                <img src={logo} alt="Logo Agente" className="side-logo" onClick={() => navigate('/')} />
                <div className="side-info">
                    <span className="id-badge">{datosBD.identificador_curp}</span>
                    <h2>{datosBD.propietario}</h2>
                    <button className="btn-cotizacion" onClick={() => setMostrarCotizacion(true)}>+ GENERAR COTIZACIÓN</button>
                </div>
                <button className="btn-regresar" onClick={() => navigate(-1)}>← VOLVER</button>
            </aside>

            {/* MAIN CONTENT - SIN CAMBIOS */}
            <main className="rep-main-content">
                <header className="main-banner">
                    <img src={casaImg} alt="Propiedad" />
                    <div className="banner-text"><h1>{datosBD.titulo}</h1></div>
                </header>

                <section className="reporte-flujo">
                    {datosBD.secciones?.map((sec, idx) => (
                        <div key={idx} className="seccion-bloque">
                            <div className="seccion-header"><h3>{sec.titulo}</h3></div>
                            {sec.subSecciones.map((sub, sIdx) => (
                                <div key={sIdx} className="subseccion-caja">
                                    <h4>{sub.nombre}</h4>
                                    <table className="tabla-inventario">
                                        <thead><tr><th>Categoría</th><th>Cant.</th></tr></thead>
                                        <tbody>
                                            {sub.inventario.map((inv, iIdx) => (
                                                <tr key={iIdx}><td>{inv.categoria}</td><td>{inv.cantidad}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    ))}
                </section>
            </main>

            {/* MODAL CON SELECTOR DE MÉTODO (SOLUCIONA ERROR ESLINT) */}
            {mostrarCotizacion && (
                <div className="lev-modal-overlay" onClick={() => setMostrarCotizacion(false)}>
                    <div className="cot-modal-card" style={{maxWidth: '1000px', width: '95%', background: '#fff', borderRadius: '12px'}} onClick={e => e.stopPropagation()}>
                        <div className="cot-modal-header" style={{background: '#1a1a1a', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', borderRadius: '12px 12px 0 0'}}>
                            <h3 style={{margin: 0, fontSize: '1.2rem'}}>GENERAR NUEVA COTIZACIÓN</h3>
                            <button onClick={() => setMostrarCotizacion(false)} style={{background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer'}}>×</button>
                        </div>

                        {/* SELECTOR DE PESTAÑAS - AQUÍ SE USA setMetodoCotizacion */}
                        <div style={{display: 'flex', padding: '15px 20px', gap: '15px', background: '#f8f9fa', borderBottom: '1px solid #eee'}}>
                            <button 
                                onClick={() => setMetodoCotizacion('manual')} 
                                style={{flex: 1, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: metodoCotizacion === 'manual' ? '#fff' : 'transparent', boxShadow: metodoCotizacion === 'manual' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', color: metodoCotizacion === 'manual' ? '#ff9800' : '#666'}}
                            >
                                📝 Registro Manual
                            </button>
                            <button 
                                onClick={() => setMetodoCotizacion('archivo')} 
                                style={{flex: 1, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: metodoCotizacion === 'archivo' ? '#fff' : 'transparent', boxShadow: metodoCotizacion === 'archivo' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', color: metodoCotizacion === 'archivo' ? '#ff9800' : '#666'}}
                            >
                                📎 Cargar Archivo
                            </button>
                        </div>

                        <div className="cot-modal-body" style={{padding: '20px', maxHeight: '65vh', overflowY: 'auto', color: '#333'}}>
                            {metodoCotizacion === 'manual' ? (
                                <>
                                    <h4 style={{borderBottom: '2px solid #ff9800', display: 'inline-block', marginBottom: '15px'}}>1. CONCEPTOS PARA EL CLIENTE</h4>
                                    <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '10px'}}>
                                        <thead style={{background: '#eee'}}>
                                            <tr><th style={{padding: '10px'}}>DESCRIPCIÓN</th><th>CANT.</th><th>PRECIO U.</th><th>SUBTOTAL</th><th></th></tr>
                                        </thead>
                                        <tbody>
                                            {filasConceptos.map((f, i) => (
                                                <tr key={i} style={{borderBottom: '1px solid #ddd'}}>
                                                    <td style={{padding: '5px'}}><input type="text" placeholder="Concepto..." value={f.descripcion} onChange={(e) => actualizarFila(i, 'descripcion', e.target.value, 'concepto')} style={{width: '95%', padding: '8px', border: '1px solid #ccc'}} /></td>
                                                    <td><input type="number" value={f.cantidad} onChange={(e) => actualizarFila(i, 'cantidad', e.target.value, 'concepto')} style={{width: '50px', padding: '8px'}} /></td>
                                                    <td><input type="number" value={f.precio_u} onChange={(e) => actualizarFila(i, 'precio_u', e.target.value, 'concepto')} style={{width: '80px', padding: '8px'}} /></td>
                                                    <td style={{fontWeight: 'bold'}}>${(f.cantidad * f.precio_u).toLocaleString()}</td>
                                                    <td><button onClick={() => eliminarFila(i, 'concepto')} style={{background: '#ffebee', border: 'none', padding: '5px', cursor: 'pointer'}}>🗑️</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button onClick={() => agregarFila('concepto')} style={{width: '100%', padding: '10px', background: 'none', border: '2px dashed #ff9800', color: '#ff9800', fontWeight: 'bold', cursor: 'pointer', marginBottom: '25px'}}>+ AGREGAR FILA</button>

                                    <h4 style={{borderBottom: '2px solid #ff9800', display: 'inline-block', marginBottom: '15px'}}>2. MATERIALES (PRECIOS INTERNOS)</h4>
                                    <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '10px'}}>
                                        <thead style={{background: '#eee'}}>
                                            <tr><th style={{padding: '10px'}}>MATERIAL</th><th>CANT.</th><th>COSTO U.</th><th>SUBTOTAL</th><th></th></tr>
                                        </thead>
                                        <tbody>
                                            {filasMateriales.map((f, i) => (
                                                <tr key={i} style={{borderBottom: '1px solid #ddd'}}>
                                                    <td style={{padding: '5px'}}><input type="text" placeholder="Material..." value={f.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'material')} style={{width: '95%', padding: '8px', border: '1px solid #ccc'}} /></td>
                                                    <td><input type="number" value={f.cantidad} onChange={(e) => actualizarFila(i, 'cantidad', e.target.value, 'material')} style={{width: '50px', padding: '8px'}} /></td>
                                                    <td><input type="number" value={f.costo_u} onChange={(e) => actualizarFila(i, 'costo_u', e.target.value, 'material')} style={{width: '80px', padding: '8px'}} /></td>
                                                    <td style={{fontWeight: 'bold'}}>${(f.cantidad * f.costo_u).toLocaleString()}</td>
                                                    <td><button onClick={() => eliminarFila(i, 'material')} style={{background: '#ffebee', border: 'none', padding: '5px', cursor: 'pointer'}}>🗑️</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button onClick={() => agregarFila('material')} style={{width: '100%', padding: '10px', background: 'none', border: '2px dashed #ff9800', color: '#ff9800', fontWeight: 'bold', cursor: 'pointer', marginBottom: '25px'}}>+ AGREGAR MATERIAL</button>

                                    <div style={{display: 'flex', gap: '20px'}}>
                                        <div style={{flex: 1}}>
                                            <h4 style={{borderBottom: '2px solid #ff9800', display: 'inline-block', marginBottom: '10px'}}>3.1 HERRAMIENTAS BÁSICAS</h4>
                                            {herramientasBasicas.map((h, i) => (
                                                <div key={i} style={{display: 'flex', gap: '5px', marginBottom: '5px'}}>
                                                    <input type="text" placeholder="Herramienta..." value={h.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'basica')} style={{flex: 1, padding: '8px'}} />
                                                    <button onClick={() => eliminarFila(i, 'basica')}>🗑️</button>
                                                </div>
                                            ))}
                                            <button onClick={() => agregarFila('basica')} style={{width: '100%', border: '1px dashed #ff9800', color: '#ff9800', background: 'none', padding: '5px', cursor: 'pointer'}}>+ AGREGAR BÁSICA</button>
                                        </div>
                                        <div style={{flex: 1}}>
                                            <h4 style={{borderBottom: '2px solid #ff9800', display: 'inline-block', marginBottom: '10px'}}>3.2 ESPECIALES</h4>
                                            {herramientasEspeciales.map((h, i) => (
                                                <div key={i} style={{display: 'flex', gap: '5px', marginBottom: '5px'}}>
                                                    <input type="text" placeholder="Especial..." value={h.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'especial')} style={{flex: 1, padding: '8px'}} />
                                                    <button onClick={() => eliminarFila(i, 'especial')}>🗑️</button>
                                                </div>
                                            ))}
                                            <button onClick={() => agregarFila('especial')} style={{width: '100%', border: '1px dashed #ff9800', color: '#ff9800', background: 'none', padding: '5px', cursor: 'pointer'}}>+ AGREGAR ESPECIAL</button>
                                        </div>
                                    </div>

                                    <div style={{marginTop: '20px'}}>
                                        <h4 style={{marginBottom: '10px'}}>OBSERVACIONES ADICIONALES</h4>
                                        <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Detalles técnicos..." style={{width: '97%', height: '80px', padding: '10px', border: '1px solid #ccc'}} />
                                    </div>
                                </>
                            ) : (
                                <div style={{textAlign: 'center', padding: '40px'}}>
                                    <input type="file" onChange={manejarArchivo} accept="image/*,application/pdf" style={{marginBottom: '20px'}} />
                                    {archivoPreview && (
                                        <div style={{marginTop: '10px', border: '1px solid #eee', padding: '10px'}}>
                                            <img src={archivoPreview} alt="Preview" style={{maxWidth: '100%', height: 'auto'}} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="cot-modal-footer" style={{padding: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div style={{border: '1px solid #ff9800', padding: '15px 30px', borderRadius: '8px'}}>
                                <span style={{color: '#ff9800', fontWeight: 'bold'}}>TOTAL: </span>
                                <strong style={{fontSize: '1.4rem', color: '#ff9800'}}>${totalGeneral.toLocaleString()}</strong>
                            </div>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <button onClick={() => setMostrarCotizacion(false)} style={{background: '#2c3e50', color: '#fff', padding: '12px 25px', borderRadius: '25px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>CANCELAR</button>
                                <button onClick={guardarCotizacion} style={{background: '#1a252f', color: '#fff', padding: '12px 25px', borderRadius: '5px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>ENVIAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetalleReporte;