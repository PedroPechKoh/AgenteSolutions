import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../styles/TecnicoStyles/TrabajosTecnico.css";
import logo from "../../assets/Logo4.png";
import { Settings, User, ArrowLeft, ClipboardList, FileText, Wrench } from 'lucide-react';

const RegistrarVentaCruzada = () => {
  const navigate = useNavigate();
  const [navActivo] = useState('TRABAJOS');

  return (
    <div className="tt-container">
      <aside className="tt-sidebar">
        <div className="logo-section">
          <img src={logo} alt="Logo" className="main-logo" />
        </div>
        <div className="tt-nav">
          <button className={`tt-nav-btn ${navActivo === 'TRABAJOS' ? 'active' : ''}`}>
            <Wrench size={18} /> <span>TRABAJOS</span>
          </button>
          <button className="tt-nav-btn">
            <ClipboardList size={18} /> <span>LEVANTAMIENTO</span>
          </button>
          <button className="tt-nav-btn">
            <FileText size={18} /> <span>COTIZACIONES</span>
          </button>
        </div>
      </aside>

      <main className="tt-main">
        <header className="tt-header">
          <div className="header-left" onClick={() => navigate(-1)} style={{cursor: 'pointer'}}>
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

        <div className="tt-body">
          <div className="vc-register-container">
            <div className="id-prop-container align-end">
              <span className="id-label">ID PROPIEDAD</span>
              <span className="id-value">JDJF123</span>
            </div>

            <div className="vc-form-box">
              <div className="form-group">
                <label>FOLIO</label>
                <input type="text" className="form-input-pill" />
              </div>

              <div className="form-group">
                <label>TÉCNICO</label>
                <input type="text" className="form-input-pill" value="MARIO" readOnly />
              </div>

              <div className="form-group">
                <label>DESCRIPCIÓN</label>
                <textarea className="form-input-pill textarea-vc" rows="4"></textarea>
              </div>

              <div className="form-group">
                <label>FECHA DE REGISTRO</label>
                <input type="text" className="form-input-pill" value="06-02-2026" readOnly />
              </div>
            </div>

            <button className="btn-venta-cruzada-full" style={{marginTop: '20px'}}>
              REGISTRAR
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegistrarVentaCruzada;