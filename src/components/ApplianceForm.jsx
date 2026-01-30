import React, { useState } from 'react';
import axios from 'axios';

const ApplianceForm = () => {
  // Estado para guardar los datos
  const [formData, setFormData] = useState({
    property_id: 1, // Usamos la Casa #1 que creaste en Tinker
    type: '',
    brand: '',
    model: '',
    image: null // Aquí va el archivo real
  });

  const [message, setMessage] = useState('');

  // Maneja los textos (Tipo, Marca, Modelo)
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Maneja la selección de la FOTO
  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0] // Guardamos el archivo
    });
  };

  // Envía todo al Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Para enviar fotos, es OBLIGATORIO usar "FormData"
    const data = new FormData();
    data.append('property_id', formData.property_id);
    data.append('type', formData.type);
    data.append('brand', formData.brand);
    data.append('model', formData.model);
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      // Petición al servidor Laravel (Puerto 8000)
      const response = await axios.post('http://localhost:8000/api/appliances', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setMessage('✅ ¡Electrodoméstico guardado con éxito!');
      console.log(response.data);
    } catch (error) {
      console.error(error);
      setMessage('❌ Error al guardar. Revisa la consola (F12).');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', border: '1px solid #ccc' }}>
      <h3>Nuevo Electrodoméstico</h3>
      <form onSubmit={handleSubmit}>
        
        <div style={{ marginBottom: '10px' }}>
          <input 
            type="text" name="type" placeholder="Tipo (ej: Aire Acondicionado)" 
            onChange={handleChange} required style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <input 
            type="text" name="brand" placeholder="Marca" 
            onChange={handleChange} required style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <input 
            type="text" name="model" placeholder="Modelo" 
            onChange={handleChange} required style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Foto del equipo:</label>
          <input type="file" onChange={handleFileChange} accept="image/*" />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
          Guardar
        </button>

      </form>
      {message && <p style={{ marginTop: '10px', textAlign: 'center' }}>{message}</p>}
    </div>
  );
};

export default ApplianceForm;