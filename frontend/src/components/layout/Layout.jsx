import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, FolderOpen, Bell,
  UserCog, BarChart3, Shield, UsersRound, Search,
  HelpCircle, Plus, LogOut, ChevronRight, Leaf,
  ShieldCheck, ClipboardList, FileBarChart2, DollarSign,
  CalendarDays, AlertOctagon, Heart, Wallet, SendHorizontal, Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlertas } from '../../hooks/useAlertas';
import { alertas as alertasDB } from '../../lib/db';

// Navegación por rol
const NAV_BY_ROL = {
  admin: [
    { to:'/',             label:'Resumen',      Icon:LayoutDashboard },
    { to:'/contratos',    label:'Contratos',    Icon:FileText },
    { to:'/contratistas', label:'Contratistas', Icon:Users },
    { to:'/documentos',   label:'Documentos',   Icon:FolderOpen },
    { to:'/alertas',      label:'Alertas',      Icon:Bell, badge:true },
    { to:'/supervisores', label:'Supervisores', Icon:UserCog },
    { to:'/reportes',     label:'Reportes',     Icon:BarChart3 },
    { to:'/garantias',    label:'Garantías',    Icon:ShieldCheck },
    { to:'/actas',        label:'Actas',        Icon:ClipboardList },
    { to:'/informes',       label:'Informes',       Icon:FileBarChart2 },
    { to:'/pagos',          label:'Pagos',          Icon:DollarSign },
    { to:'/paa',              label:'PAA',            Icon:CalendarDays },
    { to:'/inhabilidades',    label:'Inhabilidades',  Icon:AlertOctagon },
    { to:'/seguridad-social', label:'Seg. Social',    Icon:Heart },
    { to:'/presupuesto',      label:'Presupuesto',    Icon:Wallet },
    { to:'/solicitudes',      label:'Solicitar Docs', Icon:SendHorizontal },
  ],
  supervisor: [
    { to:'/',                 label:'Resumen',        Icon:LayoutDashboard },
    { to:'/contratos',        label:'Contratos',      Icon:FileText },
    { to:'/documentos',       label:'Documentos',     Icon:FolderOpen },
    { to:'/alertas',          label:'Alertas',        Icon:Bell, badge:true },
    { to:'/garantias',        label:'Garantías',      Icon:ShieldCheck },
    { to:'/actas',            label:'Actas',          Icon:ClipboardList },
    { to:'/informes',         label:'Informes',       Icon:FileBarChart2 },
    { to:'/pagos',            label:'Pagos',          Icon:DollarSign },
    { to:'/inhabilidades',    label:'Inhabilidades',  Icon:AlertOctagon },
    { to:'/seguridad-social', label:'Seg. Social',    Icon:Heart },
    { to:'/solicitudes',      label:'Solicitar Docs', Icon:SendHorizontal },
  ],
  auditor: [
    { to:'/',             label:'Resumen',      Icon:LayoutDashboard },
    { to:'/contratos',    label:'Contratos',    Icon:FileText },
    { to:'/contratistas', label:'Contratistas', Icon:Users },
    { to:'/reportes',     label:'Reportes',     Icon:BarChart3 },
  ],
  contratista: [
    { to:'/',          label:'Resumen',         Icon:LayoutDashboard },
    { to:'/portal',    label:'Mi Portal',       Icon:Home, badge:true },
    { to:'/contratos', label:'Mis Contratos',   Icon:FileText },
    { to:'/documentos',label:'Documentos',      Icon:FolderOpen },
    { to:'/alertas',   label:'Alertas',         Icon:Bell },
  ],
};
const ADMIN_NAV = [
  { to:'/auditoria', label:'Auditoría', Icon:Shield },
  { to:'/usuarios',  label:'Usuarios',  Icon:UsersRound },
];
const ROL_LABEL = { admin:'Administrador', supervisor:'Supervisor', auditor:'Auditor', contratista:'Contratista' };

function SideLink({ to, label, Icon, badge, alertCount }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display:'flex', alignItems:'center', gap:10,
        padding:'8px 12px', borderRadius:6, textDecoration:'none',
        fontSize:12, fontWeight: isActive ? 600 : 400,
        background: isActive ? 'rgba(52,211,153,0.15)' : 'transparent',
        color: isActive ? '#34D399' : 'rgba(167,243,208,0.7)',
        transition:'all .13s',
        borderLeft: isActive ? '2px solid #34D399' : '2px solid transparent',
      })}
    >
      {({ isActive }) => <>
        <Icon size={15} style={{ flexShrink:0 }}/>
        <span style={{ flex:1 }}>{label}</span>
        {badge && alertCount > 0 && (
          <span style={{ background:'#DC2626', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:99, lineHeight:1.4 }}>
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        )}
        {isActive && <ChevronRight size={12} style={{ opacity:.5 }}/>}
      </>}
    </NavLink>
  );
}

// Firma única: barra de salud del portafolio en el sidebar
function HealthBar({ stats }) {
  if (!stats) return null;
  const total   = (stats.contratos_activos || 0);
  const vencidos = (stats.contratos_vencidos || 0);
  const proximos = (stats.contratos_proximos_vencer || 0);
  const sanos   = total - vencidos - proximos;
  const color   = vencidos > 0 ? '#DC2626' : proximos > 0 ? '#D97706' : '#34D399';
  const label   = vencidos > 0 ? `${vencidos} vencidos` : proximos > 0 ? `${proximos} por vencer` : 'Todo vigente';

  return (
    <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(52,211,153,0.1)', marginTop:'auto' }}>
      <div style={{ fontSize:9, fontWeight:700, color:'rgba(167,243,208,0.45)', letterSpacing:'.1em', marginBottom:6 }}>
        ESTADO DEL PORTAFOLIO
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.1)', borderRadius:99, overflow:'hidden', marginBottom:5 }}>
        {total > 0 && (
          <div style={{
            height:'100%', borderRadius:99,
            background:`linear-gradient(90deg, ${color} ${(sanos/total*100).toFixed(0)}%, rgba(255,255,255,0.1) 0%)`,
            transition:'all .5s ease'
          }}/>
        )}
      </div>
      <div style={{ fontSize:10, color:color, fontWeight:600 }}>{total > 0 ? label : 'Sin contratos activos'}</div>
    </div>
  );
}

export default function Layout() {
  const { usuario, logout } = useAuth();
  const { noLeidas } = useAlertas();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [portfolioStats, setPortfolioStats] = useState(null);

  const rol  = usuario?.rol || 'supervisor';
  const nav  = NAV_BY_ROL[rol] || NAV_BY_ROL.supervisor;
  const ini  = usuario?.nombre
    ? usuario.nombre.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
    : 'U';

  useEffect(() => {
    // Cargar stats para la barra de salud
    alertasDB.listar({ limit:1 }).catch(()=>{});
    import('../../lib/db').then(({ dashboard }) => {
      dashboard.getStats().then(setPortfolioStats).catch(()=>{});
    });
  }, []);

  return (
    <div className="app-shell">

      {/* ── Sidebar verde bosque ─────────────────────────────── */}
      <aside className="app-sidebar" style={{
        width: 224,
        background: 'linear-gradient(180deg, #0D3321 0%, #0A2A1B 100%)',
        borderRight: '1px solid rgba(52,211,153,0.1)',
      }}>

        {/* Logo */}
        <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid rgba(52,211,153,0.1)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg, #059669, #34D399)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Leaf size={16} color="#fff" fill="rgba(255,255,255,0.3)"/>
          </div>
          <div>
            <div style={{ color:'#fff', fontSize:13, fontWeight:700, letterSpacing:'-0.02em' }}>ContralControl</div>
            <div style={{ color:'rgba(167,243,208,0.5)', fontSize:9, letterSpacing:'.06em', textTransform:'uppercase' }}>Colombia · Contratistas</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:1, overflowY:'auto', minHeight:0 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'rgba(167,243,208,0.35)', letterSpacing:'.1em', padding:'0 12px', margin:'4px 0' }}>
            PRINCIPAL
          </div>
          {nav.map(item => (
            <SideLink key={item.to} {...item} alertCount={noLeidas}/>
          ))}

          {rol === 'admin' && <>
            <div style={{ height:1, background:'rgba(52,211,153,0.08)', margin:'8px 4px' }}/>
            <div style={{ fontSize:9, fontWeight:700, color:'rgba(167,243,208,0.35)', letterSpacing:'.1em', padding:'0 12px', margin:'4px 0' }}>
              ADMINISTRACIÓN
            </div>
            {ADMIN_NAV.map(item => <SideLink key={item.to} {...item}/>)}
          </>}
        </nav>

        {/* Barra de salud del portafolio — la firma única */}
        <HealthBar stats={portfolioStats}/>

        {/* Botón nuevo contrato */}
        {['admin','supervisor'].includes(rol) && (
          <div style={{ padding:'10px 10px 6px', flexShrink:0 }}>
            <button onClick={() => navigate('/contratos')} style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'center',
              gap:6, padding:'8px', borderRadius:6,
              background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.2)',
              color:'#34D399', fontSize:11, fontWeight:600, cursor:'pointer',
            }}>
              <Plus size={13}/> Nuevo Contrato
            </button>
          </div>
        )}

        {/* Usuario */}
        <div style={{ padding:'8px 10px 12px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:6, background:'rgba(255,255,255,0.05)' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#059669,#34D399)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700, flexShrink:0 }}>
              {ini}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:'#fff', fontSize:11, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
                {usuario?.nombre || usuario?.email || 'Usuario'}
              </div>
              <div style={{ color:'rgba(167,243,208,0.55)', fontSize:10 }}>{ROL_LABEL[rol] || rol}</div>
            </div>
            <button onClick={logout} title="Cerrar sesión" style={{ background:'transparent', border:'none', color:'rgba(167,243,208,0.4)', cursor:'pointer', padding:4, borderRadius:4 }}>
              <LogOut size={13}/>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="app-main">

        {/* Header verde oscuro */}
        <header style={{
          flexShrink:0, display:'flex', alignItems:'center',
          padding:'9px 22px', gap:14,
          background: '#0F4D2F',
          borderBottom:'1px solid rgba(52,211,153,0.12)',
        }}>
          <div style={{ flex:1, maxWidth:420, position:'relative' }}>
            <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'rgba(167,243,208,0.45)', pointerEvents:'none' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search && navigate(`/contratos?buscar=${encodeURIComponent(search)}`)}
              placeholder="Buscar contratos, contratistas..."
              style={{
                width:'100%', padding:'6px 12px 6px 30px',
                borderRadius:6, border:'1px solid rgba(52,211,153,0.2)',
                background:'rgba(255,255,255,0.07)', color:'#ECFDF5',
                fontSize:12, outline:'none',
              }}
            />
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:'auto' }}>
            <button
              onClick={() => navigate('/alertas')}
              style={{ position:'relative', padding:'6px 8px', borderRadius:6, border:'none', background:'transparent', cursor:'pointer' }}
            >
              <Bell size={15} color="rgba(167,243,208,0.7)"/>
              {noLeidas > 0 && (
                <span style={{ position:'absolute', top:5, right:5, width:6, height:6, borderRadius:'50%', background:'#F87171', border:'1.5px solid #0F4D2F' }}/>
              )}
            </button>
            <button style={{ padding:'6px 8px', borderRadius:6, border:'none', background:'transparent', cursor:'pointer' }}>
              <HelpCircle size={15} color="rgba(167,243,208,0.7)"/>
            </button>
            <div style={{ paddingLeft:10, borderLeft:'1px solid rgba(52,211,153,0.15)' }}>
              <div style={{ color:'#ECFDF5', fontSize:11, fontWeight:600, letterSpacing:'-0.01em' }}>
                {usuario?.nombre || 'Usuario'}
              </div>
              <div style={{ color:'rgba(167,243,208,0.5)', fontSize:10 }}>{ROL_LABEL[rol]}</div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <div className="app-content">
          <Outlet/>
        </div>
      </div>
    </div>
  );
}
