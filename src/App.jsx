import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";
import LoginAgente from "./components/Login";
import RegisterProperties from "./components/RegisterProperties";
import VistaInicioAdmin from "./components/VistaInicioAdmin";
import Profile from "./components/Shared/Profile";
import Map from "./components/Map";
import RegistroCliente from "./components/ClientRegister";

import VistaInicioTecnico from "./components/VistaInicioTecnico";
import TrabajosTecnico from "./components/VistasTecnico/TrabajosTecnico";
import CheckList from "./components/VistasTecnico/Checklist";
import DetalleTrabajo from "./components/VistasTecnico/DetalleTrabajo";
import GaleriaReportes from "./components/VistasTecnico/GaleriaReportes";
import ReporteIndividual from "./components/VistasTecnico/ReporteIndividual";
import NuevoReporte from "./components/VistasTecnico/NuevoReporte";
import TrabajoInicio from "./components/VistasTecnico/TrabajoInicio";
import TrabajoPropiedad from "./components/VistasTecnico/TrabajosPropiedad";
import VentaCruzada from "./components/VistasTecnico/VentaCruzada";
import RegistrarVentaCruzada from "./components/VistasTecnico/RegistrarVentaCruzada";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginAgente />} />
          <Route
            path="/VistaRoot"
            element={
              <ProtectedRoute allowedRoles={[0]}>
                <VistaInicioAdmin />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<LoginAgente />} />
          <Route
            path="/VistaTecnico"
            element={
              <ProtectedRoute allowedRoles={[1, 2]}>
                <VistaInicioTecnico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registro-propiedades"
            element={
              <ProtectedRoute allowedRoles={[0, 1]}>
                <RegisterProperties />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />

          {/* ------RUTAS DE LA VISTA DEL TECNICO ------*/}

          <Route path="/trabajos-tecnico" element={<TrabajosTecnico />} />
          <Route path="/Checklist" element={<CheckList />} />
          <Route path="/detalleTrabajo" element={<DetalleTrabajo />} />
          <Route path="/galeria-reportes" element={<GaleriaReportes />} />
          <Route path="/reporte-individual" element={<ReporteIndividual />} />
          <Route path="/nuevo-reporte" element={<NuevoReporte />} />
          <Route path="/trabajo-inicio/:id" element={<TrabajoInicio />} />
          <Route path="/trabajo-propiedad/:id" element={<TrabajoPropiedad />} />
          <Route path="/venta-cruzada" element={<VentaCruzada />} />
          <Route
            path="/registrar-venta-cruzada"
            element={<RegistrarVentaCruzada />}
          />
          <Route path="/mi-perfil" element={<Profile />} />
          <Route path="/map" element={<Map />} />
          <Route path="/registro-cliente" element={<RegistroCliente />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
