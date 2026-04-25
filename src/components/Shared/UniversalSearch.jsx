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
          coincideFiltro = estadoActual === 'pendiente' || estadoActual === 'en proceso';
        } else if (filtroActual === 'Aprobado') {
          coincideFiltro = estadoActual === 'aprobado' || estadoActual === 'aprobada';
        } else if (filtroActual === 'Rechazado') {
          coincideFiltro = estadoActual === 'rechazado' || estadoActual === 'rechazada';
        }
      }

      // Búsqueda por texto (Lupa)
      const coincideBusqueda = Object.values(item).some(valor => 
        String(valor || '').toLowerCase().includes(termino)
      );

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