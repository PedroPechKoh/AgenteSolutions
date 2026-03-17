import React, { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
import "../../styles/TecnicoStyles/TrabajosTecnico.css";
import logo from "../../assets/Logo4.png";
import {
  Search,
  Settings,
  User,
  ArrowLeft,
  ClipboardList,
  FileText,
  Wrench,
} from "lucide-react";

const TrabajosTecnico = () => {
  const [tabActual, setTabActual] = useState("ASIGNADOS");
  const navigate = useNavigate();
  const [serviciosReales, setServiciosReales] = useState([]);

  useEffect(() => {
    const idTecnico = 2;

    axios
      .get(`http://localhost:8000/api/tecnico/${idTecnico}/servicios`)
      .then((response) => {
        setServiciosReales(response.data);
      })
      .catch((error) => {
        console.error("Hubo un error al traer los trabajos:", error);
      });
  }, []);

  const trabajosFiltrados = serviciosReales.filter((servicio) => {
    if (tabActual === "ASIGNADOS") return servicio.status === "Asignado";
    if (tabActual === "EN PROCESO") return servicio.status === "En Proceso";
    if (tabActual === "FINALIZADOS") return servicio.status === "Finalizado";
    return false;
  });

  return (
    <div className="tt-container">
      <aside className="tt-sidebar">
        <div className="logo-section">
          <img src={logo} alt="Logo" className="main-logo" />
        </div>
        <div className="tt-nav">
          <button className="tt-nav-btn active">
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
          <div
            className="header-left"
            onClick={() => navigate("/inicio-tecnico")}
          >
            <ArrowLeft size={28} strokeWidth={3} />
            <h2 className="header-name">MARIO</h2>
          </div>
          <h2 className="header-title">TRABAJOS</h2>
          <div className="header-icons">
            <Settings size={25} />
            <User size={25} />
          </div>
        </header>

        <div className="tt-orange-bar"></div>

        <div className="tt-body">
          <div className="tt-search-row">
            <div className="tt-search-wrapper">
              <input
                type="text"
                className="tt-search-input"
                placeholder="Buscar..."
              />
              <Search className="search-icon-inside" size={22} />
            </div>
          </div>

          <div className="tt-tabs-outer">
            {["ASIGNADOS", "EN PROCESO", "FINALIZADOS"].map((tab) => (
              <button
                key={tab}
                className={`tt-tab ${tabActual === tab ? "active" : "inactive"}`}
                onClick={() => setTabActual(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="tt-table-box">
            <div className="tt-grid-system header-grid">
              <div className="tt-col-header">FOLIO</div>
              <div className="tt-col-header">DESCRIPCIÓN</div>
              <div className="tt-col-header">FECHA</div>
            </div>

            <div className="tt-scroll-area">
              {trabajosFiltrados.length > 0 ? (
                trabajosFiltrados.map((item) => (
                  <button
                    key={item.id}
                    className="tt-row-button"
                    onClick={() =>
                      navigate(`/trabajo-propiedad/${item.property_id}`)
                    }
                  >
                    <div className="tt-grid-system">
                      <span className="col-text">{item.id}</span>
                      <span
                        className="col-text"
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.title}
                      </span>
                      <span className="col-text">
                        {new Date(item.created_at).toLocaleDateString("es-MX")}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#666",
                    fontWeight: "bold",
                  }}
                >
                  No hay trabajos en esta categoría.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrabajosTecnico;
