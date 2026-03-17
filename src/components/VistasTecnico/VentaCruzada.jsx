import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/TecnicoStyles/VentaCruzada.css';
import logo from "../../assets/Logo4.png";
import { 
  Settings, 
  User, 
  ArrowLeft, 
  ClipboardList, 
  FileText, 
  Wrench, 
  Trash2, 
  Plus, 
  X 
} from 'lucide-react';

const VentaCruzada = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Datos de ejemplo
  const ventas = [
    { folio: "1234", tecnico: "MARIO", desc: "PARED CUARTEADA ...", fecha: "06-02-2026" },
    { folio: "1234", tecnico: "MARIO", desc: "PARED CUARTEADA ...", fecha: "06-02-2026" },
  ];

  return (
    <div className="tt-container">
      {/* Sidebar - Mantenemos tu estructura original */}
      <aside className="tt-sidebar">
        <div className="logo-section">
          <img src={logo} alt="Logo" className="main-logo" />
        </div>
        <div className="tt-nav">
          <button className="tt-nav-btn active"><Wrench size={18} /> <span>TRABAJOS</span></button>
          <button className="tt-nav-btn"><ClipboardList size={18} /> <span>LEVANTAMIENTO</span></button>
          <button className="tt-nav-btn"><FileText size={18} /> <span>COTIZACIONES</span></button>
        </div>
      </aside>

      <main className="tt-main">
        {/* Header Superior */}
        <header className="tt-header">
          <div className="header-left" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>
            <ArrowLeft size={35} strokeWidth={3} />
            <h2 className="header-title-bold">MARIO</h2>
          </div>
          <h2 className="header-title-bold">VENTA CRUZADA</h2>
          <div className="header-right">
            <Settings size={30} />
            <User size={30} />
          </div>
        </header>

        <div className="tt-orange-bar"></div>

        <div className="vc-body-content">
          {/* Fila superior con ID Propiedad y Botones de Acción */}
          <div className="vc-top-row">
            <div className="id-prop-box-horizontal">
              <span className="id-prop-label">ID PROPIEDAD</span>
              <span className="id-prop-value">JDJF123</span>
            </div>
            
            <div className="vc-actions">
              <button className="btn-enviar-vc">ENVIAR</button>
            <button 
  style={{ background: '#f26624', 
    color: 'white', 
    height: '40px', 
    width: '90px', 
    zIndex: 9999, 
    cursor: 'pointer',
    border: 'none',         
    borderRadius: '20px',    
    display: 'flex',        
    alignItems: 'center',   
    justifyContent: 'center', 
    fontSize: '24px',        
    fontWeight: 'bold',     
    padding: '0', }} 
  onClick={() => {
    console.log("¡Clic detectado!");
    setShowModal(true);
  }}
>+
</button>
            </div>
          </div>

          {/* Contenedor Gris de la Tabla */}
          <div className="tt-table-container">
            {/* Encabezados de Columna (Píldoras) */}
            <div className="vc-grid-header">
              <div className="tt-header-pill">FOLIO</div>
              <div className="tt-header-pill">TÉCNICO</div>
              <div className="tt-header-pill">DESCRIPCIÓN</div>
              <div className="tt-header-pill">FECHA DE REGISTRO</div>
              <div style={{ width: '40px' }}></div> {/* Espacio para alinear con la basura */}
            </div>

            {/* Cuerpo de la tabla con scroll */}
            <div className="tt-scrollable-rows">
              {ventas.map((item, index) => (
                <div key={index} className="vc-row-card-slim">
                  <div className="vc-grid-content">
                    <span className="col-text">{item.folio}</span>
                    <span className="col-text">{item.tecnico}</span>
                    <span className="col-text">{item.desc}</span>
                    <span className="col-text">{item.fecha}</span>
                    <div className="col-trash">
                      <button className="btn-trash-vc">
                        <Trash2 size={20  } />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal de Registro */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header-row">
  <h2 className="modal-main-title">NUEVA VENTA CRUZADA</h2>
  <button className="modal-close-small" onClick={() => setShowModal(false)}>
    X
  </button>
</div>
              <div className="modal-form">
                <div className="form-row-vc">
                  <div className="input-group-vc">
                    <label>FOLIO</label>
                    <input type="text" className="pill-input-vc" placeholder="0000" />
                  </div>
                  <div className="input-group-vc">
                    <label>FECHA</label>
                    <input type="text" className="pill-input-vc" value="06-02-2026" readOnly />
                  </div>
                </div>
                <div className="input-group-vc">
                  <label>TÉCNICO</label>
                  <input type="text" className="pill-input-vc" value="MARIO" readOnly />
                </div>
                <div className="input-group-vc">
                  <label>DESCRIPCIÓN</label>
                  <textarea 
                    className="pill-input-vc tarea-vc" 
                    rows="3" 
                    placeholder="Escriba la descripción aquí..."
                  ></textarea>
                </div>
                <button className="btn-registrar-vc" onClick={() => setShowModal(false)}>
                  REGISTRAR
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VentaCruzada;