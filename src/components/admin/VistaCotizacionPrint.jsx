import React, { useEffect, useState } from "react";
import axios from 'axios';
import "../../styles/Admin/VistaCotizacionPrint.css";
import logo from "../../assets/Logo3.png"; 

const VistaCotizacionPrint = () => {
  const [cotizacion, setCotizacion] = useState(null);
  const [elementosTabla, setElementosTabla] = useState([]);
  const [guardando, setGuardando] = useState(false);

  // --- ESTADOS PARA LAS NOTAS Y EL TÍTULO ---
  const [notas, setNotas] = useState(
    "• EN CASO DE NO REQUERIR FACTURA EL PRECIO DE LOS EQUIPOS ES MAS IVA, MANO DE OBRA SIN IVA.\n" +
    "• EL CLIENTE PROPORCIONARÁ FACILIDADES PARA EL CUMPLIMIENTO DE LOS TRABAJOS\n" +
    "• SE REQUIERE UN 70% DE ANTICIPO PARA INICIAR EL SERVICIO\n" +
    "• LA PRESENTE COTIZACIÓN TIENE UNA VIGENCIA DE 15 DIAS A PARTIR DE LA FECHA INDICADA EN LA MISMA"
  );
  
  // Lista de opciones de títulos
  const [opcionesTitulos, setOpcionesTitulos] = useState([
    "OBSERVACIONES", 
    "ESPECIFICACIONES", 
    "TÉRMINOS Y CONDICIONES", 
    "NOTAS IMPORTANTES"
  ]);
  const [tituloNotas, setTituloNotas] = useState("OBSERVACIONES");
  
  // Controles para el botón "+"
  const [modoNuevoTitulo, setModoNuevoTitulo] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");

  useEffect(() => {
    const datosGuardados = localStorage.getItem('cotizacion_para_imprimir');
    
    if (datosGuardados) {
      const data = JSON.parse(datosGuardados);
      setCotizacion(data);

      if (data.observaciones) {
        setNotas(data.observaciones);
      }

      let items = [];
      try {
        const detalle = typeof data.concepto === 'string' ? JSON.parse(data.concepto) : data.concepto;
        
        if (detalle && typeof detalle === 'object') {
          if (detalle.conceptos) {
            detalle.conceptos.filter(c => c.descripcion).forEach(c => {
              items.push({ descripcion: c.descripcion, cantidad: c.cantidad || 1, unidad: 'S', precio_u: c.precio_u || 0, importe: (c.cantidad || 1) * (c.precio_u || 0) });
            });
          }
          if (detalle.materiales) {
            detalle.materiales.filter(m => m.nombre).forEach(m => {
              items.push({ descripcion: m.nombre, cantidad: m.cantidad || 1, unidad: 'PZA', precio_u: m.costo_u || 0, importe: (m.cantidad || 1) * (m.costo_u || 0) });
            });
          }
        } else {
          items.push({ descripcion: data.concepto, cantidad: 1, unidad: 'S', precio_u: data.total, importe: data.total });
        }
      } catch (error) {
        items.push({ descripcion: data.concepto, cantidad: 1, unidad: 'S', precio_u: data.total, importe: data.total });
      }
      
      setElementosTabla(items);
    }
  }, []);

  const handleGenerarPDF = async () => {
    setGuardando(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacion.id}/observaciones`, {
        observaciones: notas 
      });
      alert("Notas guardadas correctamente. (Generación de PDF en construcción...)");
      window.print();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar las especificaciones.");
    } finally {
      setGuardando(false);
    }
  };

  // Función para guardar el título personalizado
  const handleAgregarTitulo = () => {
    if (nuevoTitulo.trim() !== "") {
      const tituloMayusculas = nuevoTitulo.toUpperCase();
      setOpcionesTitulos([...opcionesTitulos, tituloMayusculas]);
      setTituloNotas(tituloMayusculas);
    }
    setModoNuevoTitulo(false);
    setNuevoTitulo("");
  };

  if (!cotizacion) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando formato de impresión...</div>;
  }

  const totalCotizacion = parseFloat(cotizacion.total);
  const subtotal = totalCotizacion / 1.16;
  const iva = totalCotizacion - subtotal;

  const formatearDinero = (cantidad) => {
    return `$${parseFloat(cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div style={{ backgroundColor: '#f0f0f0', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Botón Flotante para Generar PDF */}
      <div className="no-print" style={{ marginBottom: '20px', width: '21cm', display: 'flex', justifyContent: 'flex-end' }}>
         <button 
            onClick={handleGenerarPDF} 
            disabled={guardando}
            style={{ padding: '10px 20px', backgroundColor: '#FF6600', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
         >
           {guardando ? 'Guardando...' : '💾 Generar y Guardar PDF'}
         </button>
      </div>

      {/* Contenedor principal de la cotización (Tamaño A4) */}
      <div id="cotizacion-pdf" className="cotizacion-container" style={{ backgroundColor: 'white', width: '21cm', minHeight: '29.7cm', padding: '2cm', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>

        <div className="header">
          <div className="header-left">
            <img src={logo} alt="logo" className="logo" />
            <div className="info-cliente">
              <p><strong>ATENCION A:</strong></p>
              <h2>{cotizacion.cliente.toUpperCase()}</h2>
              <p><strong>LOCACION:</strong></p>
              <h3>MERIDA, YUCATAN</h3>
            </div>
          </div>
          <div className="header-right">
            <div className="fecha-box">
              <span>FECHA DE COTIZACIÓN</span>
              <p>{cotizacion.fecha}</p> 
            </div>
          </div>
        </div>

        <div className="linea"></div>

        <div className="tabla-container">
          <table className="tabla">
            <thead>
              <tr>
                <th>NO</th>
                <th>CONCEPTO</th>
                <th>CANT</th>
                <th>U/S</th>
                <th>PRECIO/U</th>
                <th>PRECIO</th>
              </tr>
            </thead>
            <tbody>
              {elementosTabla.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td style={{ textAlign: 'left' }}>{item.descripcion.toUpperCase()}</td>
                  <td>{item.cantidad}</td>
                  <td>{item.unidad}</td>
                  <td>{formatearDinero(item.precio_u)}</td>
                  <td>{formatearDinero(item.importe)}</td>
                </tr>
              ))}
              <tr className="totales">
                <td colSpan="4" style={{ border: 'none' }}></td>
                <td className="label">SUBTOTAL</td>
                <td className="subtotal">{formatearDinero(subtotal)}</td>
              </tr>
              <tr className="totales">
                <td colSpan="4" style={{ border: 'none' }}></td>
                <td className="label">IVA</td>
                <td>{formatearDinero(iva)}</td>
              </tr>
              <tr className="totales total-final">
                <td colSpan="4" style={{ border: 'none' }}></td>
                <td className="label">TOTAL</td>
                <td>{formatearDinero(totalCotizacion)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* --- SECCIÓN EDITABLE DE NOTAS --- */}
        <div className="notas">
          
          {/* Controles del título (Ocultos al imprimir) */}
          <div className="no-print" style={{ marginBottom: '10px', padding: '10px', background: '#fff3e0', border: '1px dashed #FF6600', borderRadius: '5px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
             <label style={{ fontWeight: 'bold', color: '#333' }}>Título de la sección:</label>

             {!modoNuevoTitulo ? (
               <>
                 <select 
                   value={tituloNotas} 
                   onChange={(e) => setTituloNotas(e.target.value)}
                   style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                 >
                   {opcionesTitulos.map((op, idx) => (
                     <option key={idx} value={op}>{op}</option>
                   ))}
                 </select>
                 <button 
                   onClick={() => setModoNuevoTitulo(true)}
                   style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}
                   title="Agregar título personalizado"
                 >
                   +
                 </button>
               </>
             ) : (
               <>
                 <input 
                   type="text" 
                   value={nuevoTitulo} 
                   onChange={(e) => setNuevoTitulo(e.target.value)} 
                   placeholder="Escribe el título..." 
                   style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                 />
                 <button 
                   onClick={handleAgregarTitulo}
                   style={{ background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}
                 >
                   Aceptar
                 </button>
                 <button 
                   onClick={() => { setModoNuevoTitulo(false); setNuevoTitulo(""); }}
                   style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}
                 >
                   Cancelar
                 </button>
               </>
             )}
          </div>

          {/* Título visual para el documento (Este sí se imprime) */}
          <h4 style={{ color: '#FF6600', marginBottom: '8px', textTransform: 'uppercase', fontSize: '1rem', borderBottom: '2px solid #FF6600', paddingBottom: '4px', display: 'inline-block' }}>
            {tituloNotas}
          </h4>

          {/* Textarea para las notas */}
          <textarea 
            className="notas-textarea"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            spellCheck="false"
            placeholder="Escribe las especificaciones o condiciones de la cotización aquí..."
          />
        </div>

        {/* DATOS FISCALES */}
        <div className="fiscales">
          <h3>DATOS FISCALES</h3>
          <p><strong>JORGE ERNESTO VALLARTA SOSA</strong></p>
          <p><strong>RFC:</strong> VASJ820324779</p>
          <p><strong>DIRECCIÓN:</strong> CALLE 23 No. 137 POR 20A XCANATUN. MERIDA, YUCATAN</p>
          <p><strong>TELÉFONO:</strong> 9992426030</p>
          <p>Vallofacturas@gmail.com</p>
          <p><strong>RÉGIMEN:</strong> PERSONAS FISICAS CON ACTIVIDADES EMPRESARIALES Y COMERCIALES</p>
        </div>

      </div>
    </div>
  );
};

export default VistaCotizacionPrint;