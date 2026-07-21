import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import OneSignal from 'react-onesignal';
import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";
import LoginAgente from "./components/Login";
import RegisterProperties from "./components/RegisterProperties";
import VistaInicioAdmin from "./components/VistaInicioAdmin";
import Profile from "./components/Shared/Profile";
import Map from "./components/Map";
import RegistroCliente from "./components/ClientRegister";
import ActivacionCuenta from "./components/ActivacionCuenta";
import CustomizeLogin from "./components/CustomizeLogin";
import AssignServiceForm from "./components/AssignServiceForm";
import VistaNotificaciones from "./components/Shared/VistaNotificaciones"; 
import RegistroZonas from "./components/VistasTecnico/RegistroZonas";
import CheckEmail from "./components/CheckEmail";
import VerifyEmail from "./components/VerifyEmail";
import ResetPassword from "./components/ResetPassword";

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
import VistaServiciosAdmin from "./components/admin/VistaServiciosAdmin";
import VistaReportesGlobal from "./components/admin/VistaReportesGlobal";
import ReporteTrabajoAdmin from "./components/admin/ReporteTrabajo";
import VistaGestionAutonomos from "./components/admin/VistaGestionAutonomos";
import VistaSalaEsperaTecnicos from "./components/admin/VistaSalaEsperaTecnicos";
import VistaCodigoAutonomo from "./components/admin/VistaCodigoAutonomo";
import VistaApoyoAutonomo from "./components/admin/VistaApoyoAutonomo";

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
import LevantamientoPropiedad from "./components/VistasTecnico/LevantamientoPropiedad";
import VistaDetalleTecnico from "./components/admin/VistaDetalleTecnico";


// 👇 1. IMPORTAMOS AXIOS Y CONFIGURAMOS EL TOKEN GLOBAL 👇
import axios from "axios";
import TrabajosAsignados from "./components/VistasTecnico/TrabajosAsignados";
import Cotizaciones from "./components/VistaCliente/Cotizaciones";
import CotizacionesPendientes from "./components/VistaCliente/CotizacionesPendientes";

import Pago from "./components/VistaCliente/Pago";
import SOSView from "./components/VistaCliente/SOSView";
import TableroScrum from "./components/VistaCliente/TableroScrum";
import DetallePropiedad from "./components/VistaCliente/DetallePropiedad";
import ReporteTrabajo from "./components/VistaCliente/ReporteTrabajo";
import DetallePropiedadadmin from "./components/admin/DetallePropiedad";
import VistaDetallePropiedadCliente from "./components/VistaCliente/VistaDetallePropiedad";

import RegisteRoot from "./components/Register"; 
import VistaCotizacionPrint from "./components/admin/VistaCotizacionPrint";

// Accept JSON
axios.defaults.headers.common["Accept"] = "application/json";

const AppRoutes = () => {
useEffect(() => {
    OneSignal.init({
      appId: "632781ba-8ada-42ea-a894-b53f1618b204", // ⚠️ NO OLVIDES PEGAR TU ID REAL AQUÍ
      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: "push",
              autoPrompt: true,
              text: {
                actionMessage: "Nos gustaría enviarte notificaciones para mantenerte al día con tus servicios y cotizaciones.",
                acceptButton: "Permitir",
                cancelButton: "Más tarde"
              }
            }
          ]
        }
      }
    });
  }, []);
  const { user, initialized } = useAuth();

  // Mientras el auth está inicializando, no renderizamos nada para evitar
  // que el comodín (*) redirija antes de que se lea el localStorage
  if (!initialized) return null;

  return (
    <Routes>
      <Route path="/" element={<LoginAgente />} />
      <Route path="/registro-cliente" element={<RegistroCliente />} />
      <Route path="/activacion-cuenta" element={<ActivacionCuenta />} />
      <Route path="/revisa-tu-correo" element={<CheckEmail />} />
      <Route path="/email/verify/:id/:hash" element={<VerifyEmail />} />
      <Route path="/recuperar-password" element={<ResetPassword />} />

      {/* RUTA COMPARTIDA PROPIEDADES */}
      <Route path="/propiedades" element={
          user?.role_id === 3 ? <MainLayoutCliente><VistaPropiedades /></MainLayoutCliente> : <VistaPropiedades />
      } />

      {/* RUTA COMPARTIDA DETALLE REPORTE */}
      <Route path="/detalle-reporte/:id" element={
          user?.role_id === 3 
            ? <MainLayoutCliente><DetalleReporte /></MainLayoutCliente> 
            : <DetalleReporte />
      } />

      <Route path="/VistaRoot" element={<VistaInicioAdmin />} />
      <Route path="/VistaTecnico" element={<VistaInicioTecnico />} />

      <Route
        path="/registro-propiedades"
        element={
            user?.role_id === 3 ? <MainLayoutCliente><RegisterProperties /></MainLayoutCliente> : <RegisterProperties />
        }
      />

      {/* ------RUTAS DE LA VISTA DEL TECNICO (LIBERADAS) ------*/}
        <Route path="/trabajos-tecnico" element={<TrabajosTecnico />} />
        <Route path="/Checklist/:id" element={<CheckList />} />
        <Route path="/detalleTrabajo/:id" element={<DetalleTrabajo />} />
        <Route path="/galeria-reportes/:id?" element={<GaleriaReportes />} />
        <Route path="/reporte-individual/:id?" element={<ReporteIndividual />} />
        <Route path="/nuevo-reporte" element={<NuevoReporte />} />
        <Route path="/trabajo-inicio/:id" element={<TrabajoInicio />} />
        <Route path="/trabajo-propiedad/:id" element={<TrabajoPropiedad />} />
        <Route path="/venta-cruzada" element={<VentaCruzada />} />
        <Route path="/registrar-venta-cruzada" element={<RegistrarVentaCruzada />} />
        <Route path="/levantamiento-propiedad" element={<LevantamientoPropiedad />} />
        <Route path="/RegistroZonas/:curp" element={<RegistroZonas />} />

      {/* ------RUTAS DE LA VISTA DEL ADMIN (LIBERADAS) ------*/}
        <Route path="/vista-cotizaciones" element={
          user?.role_id === 3 ? <MainLayoutCliente><VistaCotizaciones /></MainLayoutCliente> : <VistaCotizaciones />
        } />
        <Route path="/levantamientos" element={
          user?.role_id === 3 ? <MainLayoutCliente><VistaLevantamientos /></MainLayoutCliente> : <VistaLevantamientos />
        } />
        <Route path="/mi-perfil" element={
          user?.role_id === 3 ? <MainLayoutCliente><Profile /></MainLayoutCliente> : <Profile />
        } />


        <Route path="/detalle-producto" element={<ProductoDetalleView />} />
        <Route path="/vista-producto" element={<ProductosView />} />
        <Route path="/dashboard" element={<VistaDashboard />} />
        <Route path="/detalle-cliente" element={<VistaDetalleCliente />} />
        <Route path="/usuarios" element={<VistaUsuarios />} />
        <Route path="/gestion-autonomos" element={<VistaGestionAutonomos />} />
        <Route path="/sala-espera-tecnicos" element={<VistaSalaEsperaTecnicos />} />
        <Route path="/mi-codigo-autonomo" element={<VistaCodigoAutonomo />} />
        <Route path="/apoyo-autonomo" element={<VistaApoyoAutonomo />} />


        <Route path="/map" element={<Map />} />
        <Route path="/customize-login" element={<CustomizeLogin />} />
        <Route path="/assign-service" element={<AssignServiceForm />} />
        <Route path="/bodeguero" element={<VistaBodeguero/>} />
        <Route path="/detalle-propiedad/:id" element={<DetallePropiedadadmin/>} />
        <Route path="/tablero-servicios" element={<VistaServiciosAdmin />} />
        <Route path="/detalle-tecnico" element={<VistaDetalleTecnico />} />
        <Route path="/reportes-globales" element={<VistaReportesGlobal />} />
        <Route path="/reporte-trabajo-admin/:id?" element={<ReporteTrabajoAdmin />} />

      <Route path="/notificaciones" element={<VistaNotificaciones />} />
      <Route path="/trabajos-asignados" element={<TrabajosAsignados />} />

      {/* Vista de inicio del cliente sin Sidebar */}
      <Route path="/VistaInicioCliente" element={<VistaInicioCliente />} />

      {/* Rutas del cliente con Sidebar */}
        <Route path="/Cotizaciones" element={<MainLayoutCliente><Cotizaciones /></MainLayoutCliente>} />
        <Route path="/cotizaciones-pendientes" element={<MainLayoutCliente><CotizacionesPendientes /></MainLayoutCliente>} />
        <Route path="/Pago" element={<MainLayoutCliente><Pago /></MainLayoutCliente>} />
        <Route path="/SOSView" element={<MainLayoutCliente><SOSView /></MainLayoutCliente>} />
        <Route path="/propiedad/:id/tablero" element={<DetallePropiedadadmin />} />
        <Route path="/DetallePropiedad/:id" element={<MainLayoutCliente><VistaDetallePropiedadCliente /></MainLayoutCliente>} />
        <Route path="/ReporteTrabajo" element={<MainLayoutCliente><ReporteTrabajo /></MainLayoutCliente>} />
        <Route path="/VistaDetallePropiedad" element={<MainLayoutCliente><VistaDetallePropiedadCliente /></MainLayoutCliente>} />
        <Route path="/propiedad/:id" element={<MainLayoutCliente><VistaDetallePropiedadCliente /></MainLayoutCliente>} />


      <Route path="/registro" element={<RegisteRoot />} />
      <Route path="/imprimir-cotizacion" element={<VistaCotizacionPrint />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
