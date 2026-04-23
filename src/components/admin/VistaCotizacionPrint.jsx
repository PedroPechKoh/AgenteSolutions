import React, { useEffect, useState } from "react";
import "../../styles/Admin/VistaCotizacionPrint.css";
import logo from "../../assets/Logo.png"; // Verifica que sea Logo.png o Logo4.png según corresponda

const VistaCotizacionPrint = () => {
  const [cotizacion, setCotizacion] = useState(null);
  const [elementosTabla, setElementosTabla] = useState([]);

  useEffect(() => {
    // 1. Extraemos la cotización de la memoria temporal
    const datosGuardados = localStorage.getItem('cotizacion_para_imprimir');
    
    if (datosGuardados) {
      const data = JSON.parse(datosGuardados);
      setCotizacion(data);

      // 2. Desmenuzamos el JSON para armar las filas de la tabla
      let items = [];
      try {
        const detalle = typeof data.concepto === 'string' ? JSON.parse(data.concepto) : data.concepto;
        
        if (detalle && typeof detalle === 'object') {
          // Extraemos los Conceptos (Mano de obra)
          if (detalle.conceptos) {
            detalle.conceptos.filter(c => c.descripcion).forEach(c => {
              items.push({
                descripcion: c.descripcion,
                cantidad: c.cantidad || 1,
                unidad: 'S', // Servicio
                precio_u: c.precio_u || 0,
                importe: (c.cantidad || 1) * (c.precio_u || 0)
              });
            });
          }
          // Extraemos los Materiales
          if (detalle.materiales) {
            detalle.materiales.filter(m => m.nombre).forEach(m => {
              items.push({
                descripcion: m.nombre,
                cantidad: m.cantidad || 1,
                unidad: 'PZA', // Pieza
                precio_u: m.costo_u || 0,
                importe: (m.cantidad || 1) * (m.costo_u || 0)
              });
            });
          }
        } else {
          // Si por alguna razón es texto normal viejo, lo ponemos como 1 solo servicio
          items.push({
            descripcion: data.concepto,
            cantidad: 1,
            unidad: 'S',
            precio_u: data.total,
            importe: data.total
          });
        }
      } catch (error) {
        // Fallback en caso de error
        items.push({
          descripcion: data.concepto,
          cantidad: 1,
          unidad: 'S',
          precio_u: data.total,
          importe: data.total
        });
      }
      
      setElementosTabla(items);

      // 3. Magia: Abrimos la ventana de imprimir automáticamente después de 1 segundo
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, []);

  // Mostrar mensaje mientras carga la información
  if (!cotizacion) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando formato de impresión...</div>;
  }

  // Cálculos matemáticos basados en el total (Asumiendo que el total ya incluye IVA)
  // Si tu total es SIN IVA, puedes invertir la fórmula. 
  const totalCotizacion = parseFloat(cotizacion.total);
  const subtotal = totalCotizacion / 1.16;
  const iva = totalCotizacion - subtotal;

  const formatearDinero = (cantidad) => {
    return `$${parseFloat(cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="cotizacion-container">

      {/* HEADER */}
      <div className="header">
        <div className="header-left">
          <img src={logo} alt="logo" className="logo" />

          <div className="info-cliente">
            <p><strong>ATENCION A:</strong></p>
            {/* Dato Dinámico */}
            <h2>{cotizacion.cliente.toUpperCase()}</h2>

            <p><strong>LOCACION:</strong></p>
            <h3>MERIDA, YUCATAN</h3>
          </div>
        </div>

        <div className="header-right">
          <div className="fecha-box">
            <span>FECHA DE COTIZACIÓN</span>
            {/* Dato Dinámico */}
            <p>{cotizacion.fecha}</p> 
          </div>
        </div>
      </div>

      {/* LINEA */}
      <div className="linea"></div>

      {/* TABLA (ENVUELTA PARA RESPONSIVE) */}
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
            {/* Ciclo para dibujar filas dinámicas */}
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

            {/* TOTALES (Si no necesitas desglose de IVA, borra las filas de Subtotal e IVA y deja solo el Total Final) */}
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

      {/* NOTAS */}
      <div className="notas">
        <ul>
          <li>EN CASO DE NO REQUERIR FACTURA EL PRECIO DE LOS EQUIPOS ES MAS IVA, MANO DE OBRA SIN IVA.</li>
          <li>EL CLIENTE PROPORCIONARÁ FACILIDADES PARA EL CUMPLIMIENTO DE LOS TRABAJOS</li>
          <li>SE REQUIERE UN 70% DE ANTICIPO PARA INICIAR EL SERVICIO</li>
          <li>LA PRESENTE COTIZACIÓN TIENE UNA VIGENCIA DE 15 DIAS A PARTIR DE LA FECHA INDICADA EN LA MISMA</li>
        </ul>
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
  );
};

export default VistaCotizacionPrint;