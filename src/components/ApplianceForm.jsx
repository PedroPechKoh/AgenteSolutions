import { useState } from 'react';
import axios from 'axios';

function ApplianceForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/login-rapido', {
        email,
        password
      });
      
      const { user_name, role_id } = res.data;
      setMensaje(`¡Bienvenido ${user_name}! Tu nivel es: ${role_id}`);
      
    } catch (error) {
      setMensaje('Error: Usuario no encontrado o datos incorrectos');
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Login Agente Solutions</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} /><br /><br />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} /><br /><br />
        <button type="submit">Entrar</button>
      </form>
      {mensaje && <h3>{mensaje}</h3>}
    </div>
  );
}

export default ApplianceForm;