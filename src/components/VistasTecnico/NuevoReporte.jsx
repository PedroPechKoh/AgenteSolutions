import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../styles/TecnicoStyles/ReporteIndividual.css";
import logo from "../../assets/Logo4.png";
import { Settings, User, ArrowLeft, ClipboardList, FileText, Wrench, Image as ImageIcon, Camera } from 'lucide-react';

const NuevoReporte = () => {
  const [navActivo, setNavActivo] = useState('TRABAJOS');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="tt-container">
      <aside className="tt-sidebar">
        <div className="logo-section">
          <img src={logo} alt="Logo" className="main-logo" />
        </div>
        <div className="tt-nav">
          <button className={`tt-nav-btn ${navActivo === 'TRABAJOS' ? 'active' : ''}`} onClick={() => setNavActivo('TRABAJOS')}>
            <Wrench size={18} /> <span>TRABAJOS</span>
          </button>
          <button className={`tt-nav-btn ${navActivo === 'LEVANTAMIENTO' ? 'active' : ''}`} onClick={() => setNavActivo('LEVANTAMIENTO')}>
            <ClipboardList size={18} /> <span>LEVANTAMIENTO</span>
          </button>
          <button className={`tt-nav-btn ${navActivo === 'COTIZACIONES' ? 'active' : ''}`} onClick={() => setNavActivo('COTIZACIONES')}>
            <FileText size={18} /> <span>COTIZACIONES</span>
          </button>
        </div>
      </aside>

      <main className="tt-main">
        <header className="tt-header">
          <div className="header-left" onClick={() => navigate(-1)} style={{cursor: 'pointer'}}>
            <ArrowLeft size={35} strokeWidth={3} />
            <h2 className="header-title">MARIO</h2>
          </div>
          <h2 className="header-title">DETALLES</h2>
          <div className="header-right">
            <Settings size={30} />
            <User size={30} />
          </div>
        </header>

        <div className="tt-orange-bar"></div>

        <div className="report-detail-body">
          <div className="report-main-card">
            <div className="report-inner-content">
              {/* Título cambiado a NUEVO REPORTE según tu solicitud */}
              <h3 className="report-label">NUEVO REPORTE</h3>
              
              <div className="report-flex-container">
                {/* Cuadro para subir imagen */}
                <div className="report-image-box" onClick={handleImageClick} style={{ cursor: 'pointer', overflow: 'hidden' }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <Camera size={60} strokeWidth={1} color="#333" />
                      <p style={{ fontSize: '12px', fontWeight: 'bold' }}>TAP PARA SUBIR FOTO</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                  />
                </div>

                {/* Cuadro para escribir descripción */}
                <div className="report-info-box">
                  <textarea 
                    placeholder="Escribe la descripción del reporte aquí..."
                    className="report-textarea"
                  ></textarea>
                </div>
              </div>

              <div className="report-footer">
                <button className="btn-guardar-reporte" onClick={() => navigate(-1)}>
                  GUARDAR
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NuevoReporte;