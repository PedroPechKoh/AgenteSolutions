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
    const [archivoPreview, setArchivoPreview] = useState(null);
    const [archivoFisico, setArchivoFisico] = useState(null);

    // ESTADOS DEL COTIZADOR
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
            alert("Cotización enviada");
            setMostrarCotizacion(false);
        } catch (error) {
            console.error(error);
            alert("Error al guardar.");
        }
    };

    // --- ESTILOS REUTILIZABLES ---
    const estiloHeaderTabla = { background: '#ebeef0', color: '#555', padding: '12px', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center', border: '1px solid #dee2e6' };
    const estiloCelda = { padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' };
    const estiloInput = { width: '90%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' };
    const estiloBtnAgregar = { width: '100%', padding: '12px', background: '#fff', color: '#ff9800', border: '2px dashed #ff9800', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', marginTop: '10px', marginBottom: '30px' };
    const estiloTituloSeccion = { color: '#444', borderBottom: '2px solid #ff9800', display: 'inline-block', marginBottom: '15px', fontSize: '1rem', textTransform: 'uppercase' };

    if (cargando) return <div style={{padding: '50px', textAlign: 'center', color: 'white'}}>Cargando...</div>;

    return (
        <div className="rep-container">
            {/* SIDEBAR ORIGINAL */}
            <aside className="rep-sidebar">
                <img src={logo} alt="Logo" className="side-logo" onClick={() => navigate('/')} />
                <div className="side-info">
                    <span className="id-badge">{datosBD.identificador_curp}</span>
                    <h2>{datosBD.propietario}</h2>
                    <button className="btn-cotizacion" onClick={() => setMostrarCotizacion(true)}>+ GENERAR COTIZACIÓN</button>
                </div>
                <button className="btn-regresar" onClick={() => navigate(-1)}>← VOLVER</button>
            </aside>

            {/* CONTENIDO ORIGINAL */}
            <main className="rep-main-content">
                <header className="main-banner">
                    <img src={casaImg} alt="Propiedad" />
                    <div className="banner-text"><h1>{datosBD.titulo}</h1></div>
                </header>
                <section className="reporte-flujo" style={{padding: '20px'}}>
                   {/* Aquí va tu mapeo de secciones de inventario igual que antes */}
                </section>
            </main>

            {/* MODAL CON DISEÑO MEJORADO */}
            {mostrarCotizacion && (
                <div className="lev-modal-overlay" style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
                    <div className="cot-modal-card" style={{width: '90%', maxWidth: '1100px', background: '#fff', borderRadius: '15px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '95vh'}}>
                        
                        <div style={{background: '#1a1a1a', color: '#fff', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <h3 style={{margin: 0, fontSize: '1.2rem', letterSpacing: '1px'}}>GENERAR NUEVA COTIZACIÓN</h3>
                            <button onClick={() => setMostrarCotizacion(false)} style={{background: 'none', border: 'none', color: '#fff', fontSize: '1.8rem', cursor: 'pointer'}}>×</button>
                        </div>

                        <div style={{display: 'flex', padding: '15px 25px', gap: '15px', background: '#f8f9fa'}}>
                            <button onClick={() => setMetodoCotizacion('manual')} style={{flex: 1, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: metodoCotizacion === 'manual' ? '#fff' : 'transparent', color: metodoCotizacion === 'manual' ? '#ff9800' : '#888', boxShadow: metodoCotizacion === 'manual' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'}}>📝 Manual</button>
                            <button onClick={() => setMetodoCotizacion('archivo')} style={{flex: 1, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: metodoCotizacion === 'archivo' ? '#fff' : 'transparent', color: metodoCotizacion === 'archivo' ? '#ff9800' : '#888', boxShadow: metodoCotizacion === 'archivo' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'}}>📎 Archivo</button>
                        </div>

                        <div style={{padding: '25px', overflowY: 'auto', flex: 1}}>
                            {metodoCotizacion === 'manual' ? (
                                <>
                                    <h4 style={estiloTituloSeccion}>1. CONCEPTOS PARA EL CLIENTE</h4>
                                    <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '10px'}}>
                                        <thead>
                                            <tr>
                                                <th style={{...estiloHeaderTabla, width: '40%'}}>DESCRIPCIÓN</th>
                                                <th style={estiloHeaderTabla}>CANT.</th>
                                                <th style={estiloHeaderTabla}>PRECIO U.</th>
                                                <th style={estiloHeaderTabla}>SUBTOTAL</th>
                                                <th style={{...estiloHeaderTabla, width: '50px'}}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filasConceptos.map((f, i) => (
                                                <tr key={i}>
                                                    <td style={estiloCelda}><input style={estiloInput} type="text" placeholder="Concepto..." value={f.descripcion} onChange={(e) => actualizarFila(i, 'descripcion', e.target.value, 'concepto')} /></td>
                                                    <td style={estiloCelda}><input style={estiloInput} type="number" value={f.cantidad} onChange={(e) => actualizarFila(i, 'cantidad', e.target.value, 'concepto')} /></td>
                                                    <td style={estiloCelda}><input style={estiloInput} type="number" value={f.precio_u} onChange={(e) => actualizarFila(i, 'precio_u', e.target.value, 'concepto')} /></td>
                                                    <td style={{...estiloCelda, fontWeight: 'bold'}}>${(f.cantidad * f.precio_u).toLocaleString()}</td>
                                                    <td style={estiloCelda}><button onClick={() => eliminarFila(i, 'concepto')} style={{background: '#fff0f0', border: 'none', color: '#d9534f', cursor: 'pointer', padding: '5px'}}>🗑️</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button onClick={() => agregarFila('concepto')} style={estiloBtnAgregar}>+ AGREGAR FILA</button>

                                    <h4 style={estiloTituloSeccion}>2. MATERIALES (PRECIOS INTERNOS)</h4>
                                    <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '10px'}}>
                                        <thead>
                                            <tr>
                                                <th style={{...estiloHeaderTabla, width: '40%'}}>MATERIAL</th>
                                                <th style={estiloHeaderTabla}>CANT.</th>
                                                <th style={estiloHeaderTabla}>COSTO U.</th>
                                                <th style={estiloHeaderTabla}>SUBTOTAL</th>
                                                <th style={{...estiloHeaderTabla, width: '50px'}}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filasMateriales.map((f, i) => (
                                                <tr key={i}>
                                                    <td style={estiloCelda}><input style={estiloInput} type="text" placeholder="Material..." value={f.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'material')} /></td>
                                                    <td style={estiloCelda}><input style={estiloInput} type="number" value={f.cantidad} onChange={(e) => actualizarFila(i, 'cantidad', e.target.value, 'material')} /></td>
                                                    <td style={estiloCelda}><input style={estiloInput} type="number" value={f.costo_u} onChange={(e) => actualizarFila(i, 'costo_u', e.target.value, 'material')} /></td>
                                                    <td style={{...estiloCelda, fontWeight: 'bold'}}>${(f.cantidad * f.costo_u).toLocaleString()}</td>
                                                    <td style={estiloCelda}><button onClick={() => eliminarFila(i, 'material')} style={{background: '#fff0f0', border: 'none', color: '#d9534f', cursor: 'pointer', padding: '5px'}}>🗑️</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button onClick={() => agregarFila('material')} style={estiloBtnAgregar}>+ AGREGAR MATERIAL</button>

                                    <div style={{display: 'flex', gap: '30px'}}>
                                        <div style={{flex: 1}}>
                                            <h4 style={estiloTituloSeccion}>3.1 HERRAMIENTAS BÁSICAS</h4>
                                            <table style={{width: '100%', borderCollapse: 'collapse'}}>
                                                <thead><tr><th style={estiloHeaderTabla}>HERRAMIENTA</th><th style={estiloHeaderTabla}>CANT.</th><th style={estiloHeaderTabla}></th></tr></thead>
                                                <tbody>
                                                    {herramientasBasicas.map((h, i) => (
                                                        <tr key={i}>
                                                            <td style={estiloCelda}><input style={estiloInput} type="text" value={h.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'basica')} /></td>
                                                            <td style={estiloCelda}><input style={estiloInput} type="number" value={h.cantidad} onChange={(e) => actualizarFila(i, 'cantidad', e.target.value, 'basica')} /></td>
                                                            <td style={estiloCelda}><button onClick={() => eliminarFila(i, 'basica')}>🗑️</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <button onClick={() => agregarFila('basica')} style={{...estiloBtnAgregar, marginBottom: '10px'}}>+ AGREGAR BÁSICA</button>
                                        </div>
                                        <div style={{flex: 1}}>
                                            <h4 style={estiloTituloSeccion}>3.2 ESPECIALES</h4>
                                            <table style={{width: '100%', borderCollapse: 'collapse'}}>
                                                <thead><tr><th style={estiloHeaderTabla}>ESPECÍFICA</th><th style={estiloHeaderTabla}>CANT.</th><th style={estiloHeaderTabla}></th></tr></thead>
                                                <tbody>
                                                    {herramientasEspeciales.map((h, i) => (
                                                        <tr key={i}>
                                                            <td style={estiloCelda}><input style={estiloInput} type="text" value={h.nombre} onChange={(e) => actualizarFila(i, 'nombre', e.target.value, 'especial')} /></td>
                                                            <td style={estiloCelda}><input style={estiloInput} type="number" value={h.cantidad} onChange={(e) => actualizarFila(i, 'cantidad', e.target.value, 'especial')} /></td>
                                                            <td style={estiloCelda}><button onClick={() => eliminarFila(i, 'especial')}>🗑️</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <button onClick={() => agregarFila('especial')} style={{...estiloBtnAgregar, marginBottom: '10px'}}>+ AGREGAR ESPECIAL</button>
                                        </div>
                                    </div>

                                    <div style={{marginTop: '20px'}}>
                                        <h4 style={estiloTituloSeccion}>4. OBSERVACIONES</h4>
                                        <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Detalles técnicos..." style={{width: '100%', height: '100px', padding: '15px', borderRadius: '10px', border: '1px solid #ddd', background: '#fcfcfc'}} />
                                    </div>
                                </>
                            ) : (
                                <div style={{textAlign: 'center', padding: '50px'}}>
                                    <div style={{border: '2px dashed #ccc', padding: '40px', borderRadius: '15px'}}>
                                        <input type="file" onChange={manejarArchivo} accept="image/*,application/pdf" />
                                        {archivoPreview && <img src={archivoPreview} alt="Preview" style={{maxWidth: '100%', marginTop: '20px', borderRadius: '10px'}} />}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{padding: '20px 30px', background: '#f1f3f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div style={{background: '#fff', border: '1.5px solid #ff9800', padding: '15px 25px', borderRadius: '10px'}}>
                                <span style={{color: '#ff9800', fontWeight: 'bold', fontSize: '1.1rem'}}>TOTAL: </span>
                                <strong style={{fontSize: '1.6rem', color: '#ff9800'}}>${totalGeneral.toLocaleString()}</strong>
                            </div>
                            <div style={{display: 'flex', gap: '15px'}}>
                                <button onClick={() => setMostrarCotizacion(false)} style={{background: '#232e3a', color: '#fff', padding: '12px 30px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>CANCELAR</button>
                                <button onClick={guardarCotizacion} style={{background: '#1a252f', color: '#fff', padding: '12px 30px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>ENVIAR COTIZACIÓN</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetalleReporte;