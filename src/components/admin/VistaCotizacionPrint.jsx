import React from "react";
import "../../styles/Admin/VistaCotizacionPrint.css";
import logo from "../../assets/Logo.png";

const VistaCotizacionPrint = () => {
  return (
    <div className="cotizacion-container">

      {/* HEADER */}
      <div className="header">
        <div className="header-left">
          <img src={logo} alt="logo" className="logo" />

          <div className="info-cliente">
            <p><strong>ATENCION A:</strong></p>
            <h2>STONEWALL PENINSULA</h2>

            <p><strong>LOCACION:</strong></p>
            <h3>MERIDA, YUCATAN</h3>
          </div>
        </div>

        <div className="header-right">
          <div className="fecha-box">
            <span>FECHA DE COTIZACIÓN</span>
            <p>24 de mayo de 2024</p>
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
            <tr>
              <td>1</td>
              <td>
                SERVICIO DE INSTALACION DE VALVULA DE FLUXOMETRO, INCLUYE MATERIAL,
                MANO DE OBRA Y HERRAMIENTA NECESARIA PARA SU CORRECTA INSTALACION.
              </td>
              <td>1</td>
              <td>U</td>
              <td>$1,600.00</td>
              <td>$1,600.00</td>
            </tr>

            <tr>
              <td>2</td>
              <td>
                SERVICIO DE CAMBIO DE HERRAJE Y MANTENIMIENTO GENERAL A INODORO
                EXISTENTE. INCLUYE MATERIAL Y HERRAMIENTA NECESARIA PARA SU
                CORRECTA EJECUCION.
              </td>
              <td>1</td>
              <td>S</td>
              <td>$3,900.00</td>
              <td>$3,900.00</td>
            </tr>

            {/* TOTALES */}
            <tr className="totales">
              <td colSpan="4"></td>
              <td className="label">SUBTOTAL</td>
              <td className="subtotal">$5,500.00</td>
            </tr>

            <tr className="totales">
              <td colSpan="4"></td>
              <td className="label">IVA</td>
              <td>$880.00</td>
            </tr>

            <tr className="totales total-final">
              <td colSpan="4"></td>
              <td className="label">TOTAL</td>
              <td>$6,380.00</td>
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