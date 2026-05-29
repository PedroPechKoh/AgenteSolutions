import React from 'react';
import '../../styles/UniversalSearch.css';

const UniversalSearch = ({ data, setFilteredData, placeholder, filtroActual, type }) => {
  const [busqueda, setBusqueda] = React.useState("");

  React.useEffect(() => {
    const termino = busqueda.toLowerCase();
    
    const filtrados = data.filter((item) => {
      let coincideFiltro = true;
      
      if (type === 'USUARIOS') {
        const rolBuscado = filtroActual === "ROOTS" ? "ROOT" : filtroActual.replace("S", "");
        coincideFiltro = filtroActual === "TODOS" || item.rol === rolBuscado;
        
      } else if (type === 'PROPIEDADES') {
        coincideFiltro = filtroActual === "TODAS" || item.tipo === filtroActual;
        
      } else if (type === 'COTIZACIONES') {
        // ✅ A PRUEBA DE BALAS: Extraemos el estado, sea como sea que venga de la BD
        const estadoActual = String(item.estado || item.status || '').toLowerCase();
        
        if (filtroActual === 'Pendiente') {
          coincideFiltro = estadoActual === 'pendiente' || estadoActual === 'en proceso' || estadoActual.includes('admin') || estadoActual.includes('enviada');
        } else if (filtroActual === 'Aprobado') {
          coincideFiltro = estadoActual.includes('aprobad') || 
                           estadoActual.includes('procesada') || 
                           estadoActual.includes('aceptad') || 
                           estadoActual.includes('pago') || 
                           estadoActual.includes('pagad') || 
                           estadoActual.includes('validado');
        } else if (filtroActual === 'Rechazado') {
          coincideFiltro = estadoActual.includes('rechazad'); // Captura rechazado y rechazada
        }
      } else if (type === 'TECNICO_TABLERO') {
        coincideFiltro = true; // El tablero ya está filtrado por técnico, la búsqueda es global sobre eso
      } else if (type === 'LEVANTAMIENTOS') {
        if (filtroActual === "REALIZADOS") {
          coincideFiltro = item.status === "Finalizado" || item.status === "completed";
        } else {
          coincideFiltro = item.status !== "Finalizado" && item.status !== "completed";
        }
      }

      // Búsqueda por texto (Lupa)
      let coincideBusqueda = false;
      if (type === 'COTIZACIONES') {
        const searchFields = [
          item.folio,
          item.cliente,
          item.propiedad_nombre,
          item.propiedad_direccion,
          item.tecnico,
          item.cliente_telefono,
          item.telefono_cliente,
          item.telefono,
          item.total
        ];

        // Incluir cualquier otro valor directo del objeto
        Object.keys(item).forEach(key => {
          const val = item[key];
          if (typeof val === 'string' || typeof val === 'number') {
            searchFields.push(val);
          }
        });

        const textToSearch = searchFields.map(val => String(val || '').toLowerCase()).join(' ');
        coincideBusqueda = textToSearch.includes(termino);
      } else {
        coincideBusqueda = Object.values(item).some(valor => 
          String(valor || '').toLowerCase().includes(termino)
        );
      }

      return coincideFiltro && coincideBusqueda;
    });

    setFilteredData(filtrados);
  }, [busqueda, data, filtroActual, type, setFilteredData]);

  return (
    <div className="search-wrapper-full">
      <div className="search-input-container">
        <input
          type="text"
          placeholder={placeholder}
          className="search-input-large"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda === "" && <span className="search-icon-inside">🔍</span>}
      </div>
    </div>
  );
};

export default UniversalSearch;