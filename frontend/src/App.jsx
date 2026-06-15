import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout          from './components/layout/Layout';
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import Contratos       from './pages/Contratos';
import ContratoNuevo   from './pages/ContratoNuevo';
import ContratoDetalle from './pages/ContratoDetalle';
import Contratistas    from './pages/Contratistas';
import Documentos      from './pages/Documentos';
import Alertas         from './pages/Alertas';
import Supervisores    from './pages/Supervisores';
import Reportes        from './pages/Reportes';
import Auditoria       from './pages/Auditoria';
import Usuarios        from './pages/Usuarios';
import Garantias            from './pages/Garantias';
import Actas               from './pages/Actas';
import InformesSupervisión  from './pages/InformesSupervisión';
import Pagos               from './pages/Pagos';
import PAA                 from './pages/PAA';
import Inhabilidades       from './pages/Inhabilidades';
import SeguridadSocial     from './pages/SeguridadSocial';
import Presupuesto         from './pages/Presupuesto';
import SolicitudDocumentos  from './pages/SolicitudDocumentos';
import SolicitudPrecontrato from './pages/SolicitudPrecontrato';
import PortalContratista   from './pages/PortalContratista';
import ConfigEmail         from './pages/ConfigEmail';
import './styles/globals.css';

// Rutas permitidas por rol
const ROL_RUTAS = {
  admin:       /.*/,  // todo
  supervisor:  /^\/(contratos|documentos|alertas|garantias|actas|informes|pagos|inhabilidades|seguridad-social|solicitudes|precontrato)($|\/)/,
  auditor:     /^\/(contratos|contratistas|reportes)($|\/)/,
  contratista: /^\/(contratos|documentos|alertas|portal)($|\/)/,
};

function PrivateRoute({ children, roles }) {
  const { usuario, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F0FDF4' }}>
      <div style={{ fontSize:13, color:'#6B7280' }}>Cargando...</div>
    </div>
  );
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles) {
    const allowed = roles.includes(usuario.rol);
    if (!allowed) return <Navigate to="/" replace />;
  }
  return children;
}

function RolRoute({ children, path }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  const pattern = ROL_RUTAS[usuario.rol];
  const allowed = !path || (pattern instanceof RegExp ? pattern.test('/' + path) : true);
  if (!allowed) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { usuario } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/" replace/> : <Login/>}/>
      <Route path="/" element={<PrivateRoute><Layout/></PrivateRoute>}>
        <Route index                        element={<Dashboard/>}/>
        {/* Todos los roles autenticados */}
        <Route path="contratos"             element={<Contratos/>}/>
        <Route path="contratos/:id"         element={<ContratoDetalle/>}/>
        <Route path="documentos"            element={<Documentos/>}/>
        <Route path="alertas"               element={<Alertas/>}/>
        {/* Admin + Supervisor */}
        <Route path="contratos/nuevo"       element={<RolRoute path="contratos/nuevo"><ContratoNuevo/></RolRoute>}/>
        <Route path="contratos/:id/editar"  element={<RolRoute path="contratos/nuevo"><ContratoNuevo/></RolRoute>}/>
        <Route path="garantias"             element={<RolRoute path="garantias"><Garantias/></RolRoute>}/>
        <Route path="actas"                 element={<RolRoute path="actas"><Actas/></RolRoute>}/>
        <Route path="informes"              element={<RolRoute path="informes"><InformesSupervisión/></RolRoute>}/>
        <Route path="pagos"                 element={<RolRoute path="pagos"><Pagos/></RolRoute>}/>
        <Route path="inhabilidades"         element={<RolRoute path="inhabilidades"><Inhabilidades/></RolRoute>}/>
        <Route path="seguridad-social"      element={<RolRoute path="seguridad-social"><SeguridadSocial/></RolRoute>}/>
        <Route path="solicitudes"           element={<RolRoute path="solicitudes"><SolicitudDocumentos/></RolRoute>}/>
        <Route path="precontrato"           element={<RolRoute path="precontrato"><SolicitudPrecontrato/></RolRoute>}/>
        {/* Portal contratista */}
        <Route path="portal"               element={<PrivateRoute roles={['contratista']}><PortalContratista/></PrivateRoute>}/>
        {/* Solo Admin */}
        <Route path="contratistas"          element={<PrivateRoute roles={['admin']}><Contratistas/></PrivateRoute>}/>
        <Route path="supervisores"          element={<PrivateRoute roles={['admin']}><Supervisores/></PrivateRoute>}/>
        <Route path="paa"                   element={<PrivateRoute roles={['admin']}><PAA/></PrivateRoute>}/>
        <Route path="presupuesto"           element={<PrivateRoute roles={['admin']}><Presupuesto/></PrivateRoute>}/>
        <Route path="reportes"              element={<PrivateRoute roles={['admin','auditor']}><Reportes/></PrivateRoute>}/>
        <Route path="auditoria"             element={<PrivateRoute roles={['admin']}><Auditoria/></PrivateRoute>}/>
        <Route path="usuarios"              element={<PrivateRoute roles={['admin']}><Usuarios/></PrivateRoute>}/>
        <Route path="config-email"          element={<PrivateRoute roles={['admin','supervisor']}><ConfigEmail/></PrivateRoute>}/>
      </Route>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontFamily:'Inter,sans-serif', fontSize:12, borderRadius:8, border:'1px solid #D1FAE5' },
            success: { iconTheme: { primary:'#059669', secondary:'#fff' } },
          }}
        />
        <AppRoutes/>
      </BrowserRouter>
    </AuthProvider>
  );
}
