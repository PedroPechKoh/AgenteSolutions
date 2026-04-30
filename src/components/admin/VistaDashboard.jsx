import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { ChevronLeft, Users, Home, Box, AlertTriangle, ClipboardCheck, Loader2, Wrench } from 'lucide-react';
import '../../styles/Admin/VistaDashboard.css';
import Header from '../Shared/Header';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const VistaDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://tu-api.com/api/admin/dashboard-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar estadísticas", error);
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Loader2 className="animate-spin" size={40} color="#3b82f6" />
      <p>Cargando datos maestros...</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      <Header />

      <div style={{ padding: '20px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-back-dash" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ChevronLeft size={20} /> VOLVER AL MENÚ
        </button>
        <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>Análisis de Operaciones</h2>
      </div>

      {/* KPIs Dinámicos */}
      <div className="stats-grid">
        <div className="stat-card orange">
          <Users size={32} />
          <div className="stat-info">
            <span className="stat-value">{data?.kpis.clientes}</span>
            <span className="stat-label">Clientes Totales</span>
          </div>
        </div>
        <div className="stat-card blue">
          <Home size={32} />
          <div className="stat-info">
            <span className="stat-value">{data?.kpis.propiedades}</span>
            <span className="stat-label">Propiedades</span>
          </div>
        </div>
        <div className="stat-card green">
          <ClipboardCheck size={32} />
          <div className="stat-info">
            <span className="stat-value">{data?.levantamientos.length}</span>
            <span className="stat-label">Levantamientos Recientes</span>
          </div>
        </div>
        <div className="stat-card red">
          <AlertTriangle size={32} />
          <div className="stat-info">
            <span className="stat-value">{data?.kpis.notificaciones}</span>
            <span className="stat-label">Alertas Pendientes</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* 1. Técnicos con más trabajos (Barras) */}
        <div className="chart-item">
          <h3><Users size={18} /> Técnicos con más Servicios</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data?.topTecnicos}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Tipo de Trabajo (Dona) */}
        <div className="chart-item">
          <h3><Wrench size={18} /> Distribución de Especialidades</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data?.tiposTrabajo} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data?.tiposTrabajo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="charts-grid mt-6" style={{ marginTop: '25px' }}>
        {/* 3. Productos más reparados (Barras Horizontales) */}
        <div className="chart-item">
          <h3><Box size={18} /> Productos más Reparados</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={data?.productosReparados}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Levantamientos (Área) */}
        <div className="chart-item">
          <h3><ClipboardCheck size={18} /> Flujo de Levantamientos</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={data?.levantamientos}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="qty" stroke="#ff8800" fill="#ffedd5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VistaDashboard;