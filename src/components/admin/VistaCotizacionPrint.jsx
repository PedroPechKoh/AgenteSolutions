import React, { useEffect, useState } from "react";
import axios from 'axios';
import "../../styles/Admin/VistaCotizacionPrint.css";
import logo from "../../assets/Logo3.png"; 

const VistaCotizacionPrint = () => {
  const [cotizacion, setCotizacion] = useState(null);
  const [elementosTabla, setElementosTabla] = useState([]);
  const [guardando, setGuardando] = useState(false);

  // --- ESTADOS PARA LAS ESPECIFICACIONES ---
  // Ahora el estado inicial es un string vacío como solicitaste
  const [notas, setNotas] = useState("");
  
  const [opcionesTitulos, setOpcionesTitulos] = useState([
    "OBSERVACIONES", 
    "ESPECIFICACIONES", 
    "TÉRMINOS Y CONDICIONES", 
    "NOTAS IMPORTANTES"
  ]);
  const [tituloNotas, setTituloNotas] = useState("ESPECIFICACIONES");
  
  const [modoNuevoTitulo, setModoNuevoTitulo] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");

  useEffect(() => {
    const datosGuardados = localStorage.getItem('cotizacion_para_imprimir');
    
    if (datosGuardados) {
      const data = JSON.parse(datosGuardados);
      setCotizacion(data);

      // ❌ Se eliminó la carga automática de data.observaciones para que el cuadro esté vacío

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
  
  // 1. Configuración del PDF
  const elemento = document.getElementById('cotizacion-pdf');
  const opciones = {
    margin: 0,
    filename: `cotizacion_${cotizacion.folio}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true }, // useCORS es vital para que salga el logo de Cloudinary
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  try {
    // 2. Generar el PDF como un "Blob" (archivo en memoria)
    const pdfBlob = await html2pdf().set(opciones).from(elemento).output('blob');

    // 3. Preparar el envío (FormData)
    const formData = new FormData();
    formData.append('pdf', pdfBlob, `cotizacion_${cotizacion.folio}.pdf`);
    formData.append('observaciones', notas);
    formData.append('titulo_seccion', tituloNotas);

    // 4. Enviar a Laravel
    const respuesta = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacion.id}/finalizar`, 
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    alert("¡Cotización generada, guardada en la base de datos y subida a Cloudinary!");
    
    // Opcional: abrir el PDF recién creado en otra pestaña
    window.open(respuesta.data.url, '_blank');

  } catch (error) {
    console.error("Error en el proceso:", error);
    alert("Hubo un error al procesar el archivo.");
  } finally {
    setGuardando(false);
  }
};

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
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando información...</div>;
  }

  const totalCotizacion = parseFloat(cotizacion.total);
  const subtotal = totalCotizacion / 1.16;
  const iva = totalCotizacion - subtotal;

  const formatearDinero = (cantidad) => {
    return `$${parseFloat(cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div style={{ backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Panel de control superior */}
      <div className="no-print" style={{ marginBottom: '20px', width: '21cm', display: 'flex', justifyContent: 'flex-end' }}>
         <button 
            onClick={handleGenerarPDF} 
            disabled={guardando}
            style={{ padding: '12px 24px', backgroundColor: '#FF6600', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
         >
           {guardando ? 'Procesando...' : '💾 GENERAR Y GUARDAR PDF'}
         </button>
      </div>

      <div id="cotizacion-pdf" className="cotizacion-container" style={{ backgroundColor: 'white', width: '21cm', minHeight: '29.7cm', padding: '1.5cm 2cm', boxShadow: '0 0 15px rgba(0,0,0,0.1)' }}>

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

        <div className="notas">
          <div className="no-print" style={{ marginBottom: '10px', padding: '12px', background: '#fff5e6', border: '1px dashed #FF6600', borderRadius: '6px', display: 'flex', gap: '10px', alignItems: 'center' }}>
             <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Título:</span>
             {!modoNuevoTitulo ? (
               <>
                 <select 
                   value={tituloNotas} 
                   onChange={(e) => setTituloNotas(e.target.value)}
                   style={{ padding: '5px', borderRadius: '4px' }}
                 >
                   {opcionesTitulos.map((op, idx) => (
                     <option key={idx} value={op}>{op}</option>
                   ))}
                 </select>
                 <button onClick={() => setModoNuevoTitulo(true)} style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>+</button>
               </>
             ) : (
               <>
                 <input type="text" value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} placeholder="Nuevo título..." style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
                 <button onClick={handleAgregarTitulo} style={{ background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>Aceptar</button>
               </>
             )}
          </div>

          <h4 style={{ color: '#FF6600', marginBottom: '8px', textTransform: 'uppercase', fontSize: '1rem', borderBottom: '2px solid #FF6600', paddingBottom: '4px', display: 'inline-block' }}>
            {tituloNotas}
          </h4>

          <textarea 
            className="notas-textarea"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            spellCheck="false"
            placeholder="Escriba aquí los términos, especificaciones o condiciones de esta cotización..."
            style={{ border: '1px solid #eee' }}
          />
        </div>

        <div className="fiscales" style={{ marginTop: 'auto' }}>
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