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
import './styles/globals.css';

function PrivateRoute({ children }) {
  const { usuario, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F0FDF4' }}>
      <div style={{ fontSize:13, color:'#6B7280' }}>Cargando...</div>
    </div>
  );
  return usuario ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { usuario } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/" replace/> : <Login/>}/>
      <Route path="/" element={<PrivateRoute><Layout/></PrivateRoute>}>
        <Route index                        element={<Dashboard/>}/>
        <Route path="contratos"             element={<Contratos/>}/>
        <Route path="contratos/nuevo"       element={<ContratoNuevo/>}/>
        <Route path="contratos/:id"         element={<ContratoDetalle/>}/>
        <Route path="contratos/:id/editar"  element={<ContratoNuevo/>}/>
        <Route path="contratistas"          element={<Contratistas/>}/>
        <Route path="documentos"            element={<Documentos/>}/>
        <Route path="alertas"               element={<Alertas/>}/>
        <Route path="supervisores"          element={<Supervisores/>}/>
        <Route path="reportes"              element={<Reportes/>}/>
        <Route path="auditoria"             element={<Auditoria/>}/>
        <Route path="usuarios"              element={<Usuarios/>}/>
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
