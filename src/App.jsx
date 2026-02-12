import React from 'react';
import ApplianceForm from './components/ApplianceForm'; // <--- Importamos el componente

function App() {
  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>Agente Solutions Este es el Front</h1>
      <p style={{ textAlign: 'center' }}>Panel de Administración</p>
      
      {/* Aquí renderizamos el formulario */}
      <ApplianceForm /> 
    </div>
  );
}

export default App;