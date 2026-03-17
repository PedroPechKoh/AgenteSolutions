import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/TecnicoStyles/TrabajoPropiedad.css";
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

const TrabajoPropiedad = () => {
  const [tabActual, setTabActual] = useState("ASIGNADOS");
  const navigate = useNavigate();
  const { id } = useParams();
  const [curpPropiedad, setCurpPropiedad] = useState("");
  const [trabajosReales, setTrabajosReales] = useState([]);
  const idDeLaPropiedad = id;
  const [nombreCliente, setNombreCliente] = useState("");
  useEffect(() => {
    const idTecnico = 2;

    if (idDeLaPropiedad) {
      axios
        .get(
          `http://localhost:8000/api/tecnico/${idTecnico}/propiedad/${idDeLaPropiedad}/servicios`,
        )
        .then((response) => {
          setTrabajosReales(response.data);

          if (response.data.length > 0 && response.data[0].property) {
            setCurpPropiedad(response.data[0].property.custom_curp);
          }
          if (response.data[0].property.client) {
            setNombreCliente(response.data[0].property.client.name);
          }
        })
        .catch((error) =>
          console.error("Error trayendo trabajos de propiedad:", error),
        );
    }
  }, [idDeLaPropiedad]);

  const trabajosFiltrados = trabajosReales.filter((servicio) => {
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
          <div className="header-left" onClick={() => navigate(-1)}>
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
          <div className="tt-search-wrapper">
            <input
              type="text"
              className="tt-search-input"
              placeholder="Buscar..."
            />
            <Search className="search-icon-inside" size={20} />
          </div>

          <div className="tt-id-actions-row">
            <div className="id-prop-horizontal">
              <span className="id-label-pill">CURP DE LA PROPIEDAD:</span>
              <span className="id-value-text">
                {curpPropiedad || idDeLaPropiedad}
              </span>
              {nombreCliente && (
                <span
                  className="id-value-text"
                  style={{ marginLeft: "20px", fontWeight: "normal" }}
                >
                  PROPIEDAD DE: <strong>{nombreCliente}</strong>
                </span>
              )}
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
                  <div
                    key={item.id}
                    className="tt-row-card"
                    onClick={() => navigate(`/trabajo-inicio/${item.id}`)}
                  >
                    {" "}
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
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#666",
                  }}
                >
                  No hay trabajos aquí.
                </div>
              )}
            </div>
          </div>

          <button
            className="btn-venta-cruzada-footer"
            onClick={() => navigate("/venta-cruzada")}
          >
            AGREGAR VENTA CRUZADA
          </button>
          <div className="tt-table-footer-bar"></div>
        </div>
      </main>
    </div>
  );
};

export default TrabajoPropiedad;
