import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";
import LoginAgente from "./components/Login";
import RegisterProperties from "./components/RegisterProperties";
import VistaInicioAdmin from "./components/VistaInicioAdmin";
import Profile from "./components/Shared/Profile";
import Map from "./components/Map";
import RegistroCliente from "./components/ClientRegister";
import CustomizeLogin from "./components/CustomizeLogin";
import AssignServiceForm from "./components/AssignServiceForm";
import VistaNotificaciones from "./components/Shared/VistaNotificaciones"; 
import RegistroZonas from "./components/VistasTecnico/RegistroZonas";

///Cliente
import MainLayoutCliente from "./components/VistaCliente/MainLayoutCliente";
import VistaInicioCliente from "./components/VistaCliente/VistaInicioCliente";

/* ------RUTAS DE LA VISTA DEL ADMIN ------*/
import DetalleReporte from "./components/admin/DetalleReporte";
import ProductoDetalleView from "./components/admin/ProductoDetalleView";
import ProductosView from "./components/admin/ProductosView";
import VistaCotizaciones from "./components/admin/VistaCotizaciones";
import VistaDashboard from "./components/admin/VistaDashboard";
import VistaDetalleCliente from "./components/admin/VistaDetalleCliente";
import VistaDetallePropiedad from "./components/admin/VistaDetallePropiedad";
import VistaLevantamientos from "./components/admin/VistaLevantamientos";
import VistaPropiedades from "./components/admin/VistaPropiedades";
import VistaUsuarios from "./components/admin/VistaUsuarios";
import VistaBodeguero from "./components/admin/VistaBodeguero";


/* ------RUTAS DE LA VISTA DEL TECNICO ------*/
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



// 👇 1. IMPORTAMOS AXIOS Y CONFIGURAMOS EL TOKEN GLOBAL 👇
import axios from "axios";
import TrabajosAsignados from "./components/VistasTecnico/TrabajosAsignados";
import LevantamientoPropiedad from "./components/VistasTecnico/LevantamientoPropiedad";
import Cotizaciones from "./components/VistaCliente/Cotizaciones";

import Pago from "./components/VistaCliente/Pago";
import SOSView from "./components/VistaCliente/SOSView";
import TableroScrum from "./components/VistaCliente/TableroScrum";
import DetallePropiedad from "./components/VistaCliente/DetallePropiedad";
import ReporteTrabajo from "./components/VistaCliente/ReporteTrabajo";
import DetallePropiedadadmin from "./components/admin/DetallePropiedad";

import RegisteRoot from "./components/Register"; 
import VistaCotizacionPrint from "./components/admin/VistaCotizacionPrint";
// Le decimos a Laravel que siempre queremos JSON de regreso (Evita el error 'Route [login] not defined')
axios.defaults.headers.common["Accept"] = "application/json";

const token = localStorage.getItem("agente_token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

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

          {/* Se eliminó el Login duplicado que estaba aquí */}

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
              <ProtectedRoute allowedRoles={[0, 1, 3]}>
                {" "}
                {/* 👇 ¡Agregamos el 3 aquí! */}
                <RegisterProperties />
              </ProtectedRoute>
            }
          />

          {/* 👇 2. PROTEGEMOS LA RUTA DEL CLIENTE (Rol 3) 👇 */}
          <Route
            path="/VistaInicioCliente"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <VistaInicioCliente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/MenuCliente"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <MainLayoutCliente />
              </ProtectedRoute>
            }
          />

          {/* ------RUTAS DE LA VISTA DEL TECNICO ------*/}
          <Route path="/trabajos-tecnico" element={<TrabajosTecnico />} />
          <Route path="/Checklist/:id" element={<CheckList />} />
          <Route path="/detalleTrabajo" element={<DetalleTrabajo />} />
          <Route path="/galeria-reportes" element={<GaleriaReportes />} />
          <Route path="/reporte-individual" element={<ReporteIndividual />} />
          <Route path="/nuevo-reporte" element={<NuevoReporte />} />
          <Route path="/trabajo-inicio/:id" element={<TrabajoInicio />} />
          <Route path="/trabajo-propiedad/:id" element={<TrabajoPropiedad />} />
          <Route path="/venta-cruzada" element={<VentaCruzada />} />
          <Route path="/registrar-venta-cruzada" element={<RegistrarVentaCruzada />} />
          <Route path="/levantamiento-propiedad" element={<LevantamientoPropiedad />} />
         <Route path="/RegistroZonas/:curp" element={<RegistroZonas />} />



          {/* ------RUTAS DE LA VISTA DEL ADMIN ------*/}
          <Route element={<ProtectedRoute allowedRoles={[0, 1]} />}>
            <Route path="/detalle-reporte/:id" element={<DetalleReporte />} />
            <Route path="/detalle-producto" element={<ProductoDetalleView />} />
            <Route path="/vista-producto" element={<ProductosView />} />
            <Route path="/vista-cotizaciones" element={<VistaCotizaciones />} />
            <Route path="/dashboard" element={<VistaDashboard />} />
            <Route path="/detalle-cliente" element={<VistaDetalleCliente />} />
            <Route path="/levantamientos" element={<VistaLevantamientos />} />
            <Route path="/propiedades" element={<VistaPropiedades />} />
            <Route path="/usuarios" element={<VistaUsuarios />} />
            <Route path="/mi-perfil" element={<Profile />} />
            <Route path="/map" element={<Map />} />
            <Route path="/registro-cliente" element={<RegistroCliente />} />
            <Route path="/customize-login" element={<CustomizeLogin />} />
            <Route path="/assign-service" element={<AssignServiceForm />} />
            <Route path="/bodeguero" element={<VistaBodeguero/>} />
            <Route path="/detalle-propiedad/:id" element={<DetallePropiedadadmin/>} />
          </Route>





          <Route path="/notificaciones" element={<VistaNotificaciones />} />
          <Route path="/trabajos-asignados" element={<TrabajosAsignados />} />

           {/* ------RUTAS DE LA VISTA DEL CLIENTE (CON SIDEBAR) ------*/}
           <Route element={<ProtectedRoute allowedRoles={[3]}><MainLayoutCliente /></ProtectedRoute>}>
             <Route path="/VistaInicioCliente" element={<VistaInicioCliente />} />
             <Route path="/Cotizaciones" element={<Cotizaciones />} />
             <Route path="/Pago" element={<Pago />} />
             <Route path="/SOSView" element={<SOSView />} />
             <Route path="/propiedad/:id/tablero" element={<TableroScrum />} />
             <Route path="/DetallePropiedad/:id" element={<DetallePropiedad />} />
             <Route path="/ReporteTrabajo" element={<ReporteTrabajo />} />
             <Route path="/detalle-reporte/:id" element={<DetalleReporte />} />
             <Route path="/VistaDetallePropiedad" element={<VistaDetallePropiedad />} />

             <Route path="/propiedad/:id" element={<VistaDetallePropiedad />} />
           </Route>


          <Route path="/registro" element={<RegisteRoot />} />
          <Route path="/imprimir-cotizacion" element={<VistaCotizacionPrint />} />

          {/* La redirección por defecto siempre al final */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
