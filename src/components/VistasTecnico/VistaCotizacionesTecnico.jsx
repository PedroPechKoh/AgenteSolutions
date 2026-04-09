import React, { useState, useMemo } from 'react';
import "../../styles/TecnicoStyles/VistaCotizacionesT.css";
const VistaCotizacionesTecnico = () => {
  // --- ESTADOS DE NAVEGACIÓN ---
  const [filtro, setFiltro] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarNuevaCotiz, setMostrarNuevaCotiz] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);

  // --- ESTADOS DEL FORMULARIO ---
  const [filasExcel, setFilasExcel] = useState([{ id: 1, desc: '', cant: 0, precio: 0 }]);
  const [filasMaterial, setFilasMaterial] = useState([{ id: 1, desc: '', cant: 0, precio: 0 }]);
  const [herramientasBasicas, setHerramientasBasicas] = useState([
    { id: 1, desc: 'Juego de desarmadores', cant: 1 },
    { id: 2, desc: 'Multímetro', cant: 1 }
  ]);
  // Herramientas Especiales ahora incluyen PRECIO
  const [herramientasEspeciales, setHerramientasEspeciales] = useState([{ id: 1, desc: '', cant: 0, precio: 0 }]);

  // --- DATOS DE EJEMPLO PARA LA TABLA PRINCIPAL ---
  const [misCotizaciones] = useState([
    { id: 101, cliente: 'Constructora Alfa', total: 15400, estado: 'ENVIADAS', fecha: '2024-03-01', comentarioAdmin: '' },
    { id: 102, cliente: 'Residencial Valle', total: 8500, estado: 'ACEPTADA', fecha: '2024-03-02', comentarioAdmin: 'Recoger equipo en bodega.' },
    { id: 103, cliente: 'Local Centro', total: 1200, estado: 'RECHAZADA', fecha: '2024-03-03', comentarioAdmin: 'Precio de material muy alto.' }
  ]);

  const updateFila = (setter, lista, id, field, value) => {
    setter(lista.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  // CÁLCULO DEL TOTAL (Incluye Conceptos + Materiales + Herramientas Especiales)
  const totalGlobal = useMemo(() => {
    const tCliente = filasExcel.reduce((acc, f) => acc + (Number(f.cant) * Number(f.precio)), 0);
    const tMaterial = filasMaterial.reduce((acc, f) => acc + (Number(f.cant) * Number(f.precio)), 0);
    const tEspeciales = herramientasEspeciales.reduce((acc, f) => acc + (Number(f.cant) * Number(f.precio)), 0);
    return tCliente + tMaterial + tEspeciales;
  }, [filasExcel, filasMaterial, herramientasEspeciales]);

  const filtradas = misCotizaciones.filter(c => {
    const coincideFiltro = filtro === 'TODAS' || c.estado === filtro;
    return coincideFiltro && (c.cliente.toLowerCase().includes(busqueda.toLowerCase()) || c.id.toString().includes(busqueda));
  });

  return (
    <div className="cotiz-page">
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

              <button className="btn-nueva-cotiz-orange" onClick={() => setMostrarNuevaCotiz(true)}>➕ NUEVA COTIZACIÓN</button>


      <main className="cotiz-main-content">
        <div className="search-section">
          <input 
            type="text" 
            placeholder="BUSCAR CLIENTE O FOLIO..." 
            className="cotiz-input-field-search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="cotiz-tabs-row">
          {['ENVIADAS', 'ACEPTADA', 'RECHAZADA', 'TODAS'].map(f => (
            <button key={f} className={`cotiz-tab-btn ${filtro === f ? 'active' : ''}`} onClick={() => setFiltro(f)}>{f}</button>
          ))}
        </div>

        <div className="cotiz-table-container">
          <table className="cotiz-data-table">
            <thead>
              <tr><th>FOLIO</th><th>CLIENTE</th><th>ESTADO</th><th>ACCIONES</th></tr>
            </thead>
            <tbody>
              {filtradas.map((c) => (
                <tr key={c.id}>
                  <td className="bold-folio">#{c.id}</td>
                  <td>{c.cliente}</td>
                  <td><span className={`status-badge ${c.estado.toLowerCase()}`}>{c.estado}</span></td>
                  <td><button className="btn-ver-tabla" onClick={() => setCotizacionSeleccionada(c)}>👁️ VER</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* --- MODAL NUEVA COTIZACIÓN --- */}
      {mostrarNuevaCotiz && (
        <div className="modal-fixed-overlay" onClick={() => setMostrarNuevaCotiz(false)}>
          <div className="modal-box-card scrollable-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-dark">
              <span>GENERAR NUEVA COTIZACIÓN</span>
              <button className="modal-close-icon" onClick={() => setMostrarNuevaCotiz(false)}>&times;</button>
            </div>
            
            <div className="modal-body-content scroll-area">
              <h3 className="section-title-excel">1. CONCEPTOS CLIENTE</h3>
              <div className="excel-table-wrapper">
                <table className="excel-style-table">
                  <thead><tr><th>DESC.</th><th>CANT.</th><th>PRECIO</th><th>SUB.</th><th></th></tr></thead>
                  <tbody>
                    {filasExcel.map(f => (
                      <tr key={f.id}>
                        <td><input type="text" value={f.desc} onChange={(e) => updateFila(setFilasExcel, filasExcel, f.id, 'desc', e.target.value)} /></td>
                        <td><input type="number" value={f.cant} onChange={(e) => updateFila(setFilasExcel, filasExcel, f.id, 'cant', e.target.value)} /></td>
                        <td><input type="number" value={f.precio} onChange={(e) => updateFila(setFilasExcel, filasExcel, f.id, 'precio', e.target.value)} /></td>
                        <td className="subtotal-cell">${(f.cant * f.precio).toLocaleString()}</td>
                        <td><button className="btn-del-row" onClick={() => setFilasExcel(filasExcel.filter(x => x.id !== f.id))}>🗑️</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn-add-row-excel" onClick={() => setFilasExcel([...filasExcel, { id: Date.now(), desc: '', cant: 0, precio: 0 }])}>+ FILA</button>
              </div>

              <h3 className="section-title-excel internal">2. MATERIALES INTERNOS</h3>
              <div className="excel-table-wrapper">
                <table className="excel-style-table">
                  <thead><tr><th>MATERIAL</th><th>CANT.</th><th>COSTO</th><th>SUB.</th><th></th></tr></thead>
                  <tbody>
                    {filasMaterial.map(f => (
                      <tr key={f.id}>
                        <td><input type="text" value={f.desc} onChange={(e) => updateFila(setFilasMaterial, filasMaterial, f.id, 'desc', e.target.value)} /></td>
                        <td><input type="number" value={f.cant} onChange={(e) => updateFila(setFilasMaterial, filasMaterial, f.id, 'cant', e.target.value)} /></td>
                        <td><input type="number" value={f.precio} onChange={(e) => updateFila(setFilasMaterial, filasMaterial, f.id, 'precio', e.target.value)} /></td>
                        <td className="subtotal-cell">${(f.cant * f.precio).toLocaleString()}</td>
                        <td><button className="btn-del-row" onClick={() => setFilasMaterial(filasMaterial.filter(x => x.id !== f.id))}>🗑️</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn-add-row-excel" onClick={() => setFilasMaterial([...filasMaterial, { id: Date.now(), desc: '', cant: 0, precio: 0 }])}>+ MATERIAL</button>
              </div>

              <h3 className="section-title-excel internal">3. HERRAMIENTAS BÁSICAS </h3>
              <div className="excel-table-wrapper">
                <table className="excel-style-table">
                  <thead><tr><th>DESCRIPCIÓN</th><th width="80">CANT.</th><th width="40"></th></tr></thead>
                  <tbody>
                    {herramientasBasicas.map(h => (
                      <tr key={h.id}>
                        <td><input type="text" value={h.desc} onChange={(e) => updateFila(setHerramientasBasicas, herramientasBasicas, h.id, 'desc', e.target.value)} /></td>
                        <td><input type="number" value={h.cant} onChange={(e) => updateFila(setHerramientasBasicas, herramientasBasicas, h.id, 'cant', e.target.value)} /></td>
                        <td><button className="btn-del-row" onClick={() => setHerramientasBasicas(herramientasBasicas.filter(x => x.id !== h.id))}>🗑️</button></td>
                      </tr>
                    ))}
                  </tbody>
                  
                </table>
                <button className="btn-add-row-excel" onClick={() => setHerramientasBasicas([...herramientasBasicas, { id: Date.now(), desc: '', cant: 1 }])}>+ ESPECIAL</button>

              </div>

              <h3 className="section-title-excel internal">4. HERRAMIENTAS ESPECIALES (BODEGA)</h3>
              <div className="excel-table-wrapper">
                <table className="excel-style-table">
                  <thead><tr><th>DESCRIPCIÓN</th><th>CANT.</th><th></th></tr></thead>
                  <tbody>
                    {herramientasEspeciales.map(h => (
                      <tr key={h.id}>
                        <td><input type="text" value={h.desc} onChange={(e) => updateFila(setHerramientasEspeciales, herramientasEspeciales, h.id, 'desc', e.target.value)} /></td>
                        <td><input type="number" value={h.cant} onChange={(e) => updateFila(setHerramientasEspeciales, herramientasEspeciales, h.id, 'cant', e.target.value)} /></td>
                        <td><button className="btn-del-row" onClick={() => setHerramientasEspeciales(herramientasEspeciales.filter(x => x.id !== h.id))}>🗑️</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn-add-row-excel" onClick={() => setHerramientasEspeciales([...herramientasEspeciales, { id: Date.now(), desc: '', cant: 0, precio: 0 }])}>+ ESPECIAL</button>
              </div>
              <div style={{height: '40px'}}></div>
            </div>

            <div className="modal-footer-btns-fixed">
              <div className="total-label-box">
                <span style={{color: 'white'}}>TOTAL ESTIMADO:</span>
                <span className="total-amount-val" style={{color: 'white'}}>${totalGlobal.toLocaleString()}</span>
              </div>
              <button className="btn-send-to-admin" onClick={() => setMostrarNuevaCotiz(false)}>ENVIAR AL ADMINISTRADOR</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DETALLE --- */}
      {/* --- MODAL DETALLE (CORREGIDO Y EXTENDIDO) --- */}
{cotizacionSeleccionada && (
  <div className="modal-fixed-overlay" onClick={() => setCotizacionSeleccionada(null)}>
    <div className="modal-box-card scrollable-modal" style={{maxWidth: '800px'}} onClick={e => e.stopPropagation()}>
      
      <div className="modal-header-dark">
        <span>RESUMEN COMPLETO - FOLIO #{cotizacionSeleccionada.id}</span>
        <button className="modal-close-icon" onClick={() => setCotizacionSeleccionada(null)}>&times;</button>
      </div>

      <div className="modal-body-content">
        {/* INFO CLIENTE */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <p><strong>CLIENTE:</strong> {cotizacionSeleccionada.cliente}</p>
          <p><strong>FECHA DE REGISTRO:</strong> {cotizacionSeleccionada.fecha}</p>
        </div>

        {/* TABLA DE CONCEPTOS */}
        <h4 style={{color: '#FF6B00'}}>1. TRABAJOS / CONCEPTOS</h4>
        <table className="excel-style-table">
          <thead>
            <tr><th>DESCRIPCIÓN</th><th>CANT.</th><th>PRECIO</th><th>TOTAL</th></tr>
          </thead>
          <tbody>
            {/* Aquí mapeas los datos reales guardados */}
            <tr><td>Instalación de cámaras</td><td>1</td><td>$5,000</td><td>$5,000</td></tr>
          </tbody>
        </table>

        {/* TABLA DE MATERIALES */}
        <h4 style={{color: '#FF6B00', marginTop: '20px'}}>2. MATERIALES INTERNOS</h4>
        <table className="excel-style-table">
          <thead>
            <tr><th>MATERIAL</th><th>CANT.</th><th>ESTADO</th></tr>
          </thead>
          <tbody>
            <tr><td>Cable UTP Cat6</td><td>30m</td><td>Utilizado</td></tr>
          </tbody>
        </table>

        {/* HERRAMIENTAS */}
        <h4 style={{color: '#FF6B00', marginTop: '20px'}}>3. HERRAMIENTAS UTILIZADAS</h4>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, background: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
            <strong>BÁSICAS:</strong>
            <ul style={{ fontSize: '0.85rem' }}>
              <li>Multímetro</li>
              <li>Juego de desarmadores</li>
            </ul>
          </div>
          <div style={{ flex: 1, background: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
            <strong>ESPECIALES:</strong>
            <ul style={{ fontSize: '0.85rem' }}>
              <li>Escalera telescópica</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="modal-footer-btns-fixed">
        <div style={{ textAlign: 'left', color: 'white' }}>
          <small>TOTAL DE COTIZACIÓN:</small>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FF6B00' }}>
            ${cotizacionSeleccionada.total.toLocaleString()}
          </div>
        </div>
        <button className="btn-close-simple" onClick={() => setCotizacionSeleccionada(null)}>CERRAR</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default VistaCotizacionesTecnico;