import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, FolderOpen, Bell,
  UserCog, BarChart3, Shield, UsersRound, Search,
  HelpCircle, Plus, ChevronRight, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlertas } from '../../hooks/useAlertas';

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
  ],
  supervisor: [
    { to:'/',             label:'Resumen',      Icon:LayoutDashboard },
    { to:'/contratos',    label:'Contratos',    Icon:FileText },
    { to:'/documentos',   label:'Documentos',   Icon:FolderOpen },
    { to:'/alertas',      label:'Alertas',      Icon:Bell, badge:true },
  ],
  auditor: [
    { to:'/',             label:'Resumen',      Icon:LayoutDashboard },
    { to:'/contratos',    label:'Contratos',    Icon:FileText },
    { to:'/contratistas', label:'Contratistas', Icon:Users },
    { to:'/documentos',   label:'Documentos',   Icon:FolderOpen },
    { to:'/reportes',     label:'Reportes',     Icon:BarChart3 },
  ],
  contratista: [
    { to:'/',             label:'Resumen',      Icon:LayoutDashboard },
    { to:'/contratos',    label:'Mis Contratos',Icon:FileText },
    { to:'/documentos',   label:'Documentos',   Icon:FolderOpen },
    { to:'/alertas',      label:'Alertas',      Icon:Bell, badge:true },
  ],
};

const ADMIN_NAV = [
  { to:'/auditoria', label:'Auditoría', Icon:Shield },
  { to:'/usuarios',  label:'Usuarios',  Icon:UsersRound },
];

function SideLink({ to, label, Icon, badge, alertCount }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
        borderRadius:8, textDecoration:'none', fontSize:13, fontWeight: isActive ? 600 : 400,
        background: isActive ? 'rgba(59,130,246,0.85)' : 'transparent',
        color: isActive ? '#fff' : 'rgba(147,197,253,0.85)',
        transition:'all .15s',
      })}
      onMouseEnter={e => { if (!e.currentTarget.style.background.includes('59,130')) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={e => { if (!e.currentTarget.style.background.includes('59,130')) e.currentTarget.style.background = 'transparent'; }}
    >
      {({ isActive }) => <>
        <Icon size={15} style={{ flexShrink:0 }} />
        <span style={{ flex:1 }}>{label}</span>
        {badge && alertCount > 0 && (
          <span style={{ background:'#ef4444', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:99 }}>
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        )}
        {isActive && <ChevronRight size={13} style={{ opacity:.7 }} />}
      </>}
    </NavLink>
  );
}

const ROL_LABEL = { admin:'Administrador', supervisor:'Supervisor', auditor:'Auditor', contratista:'Contratista' };

export default function Layout() {
  const { usuario, logout } = useAuth();
  const { noLeidas } = useAlertas();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const rol  = usuario?.rol || 'supervisor';
  const nav  = NAV_BY_ROL[rol] || NAV_BY_ROL.supervisor;
  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
    : 'U';

  return (
    <div className="app-shell">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="app-sidebar" style={{ width:240, background:'linear-gradient(180deg,#0d1f3c 0%,#1a3460 100%)' }}>

        {/* Logo */}
        <div style={{ padding:'16px 20px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 6v4c0 4.4 3 8.5 7 9.5C14 18.5 17 14.4 17 10V6L10 2z" fill="white" fillOpacity="0.95"/>
              <path d="M7 10l2 2 4-4" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color:'#fff', fontSize:13, fontWeight:700 }}>ContralControl</div>
            <div style={{ color:'rgba(147,197,253,0.6)', fontSize:9, letterSpacing:'.06em' }}>GESTIÓN DE CONTRATISTAS</div>
          </div>
        </div>

        {/* Nav — con scroll */}
        <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
          <div style={{ fontSize:9, fontWeight:700, color:'rgba(147,197,253,0.45)', letterSpacing:'.1em', padding:'0 12px', marginBottom:4 }}>MENÚ PRINCIPAL</div>
          {nav.map(item => (
            <SideLink key={item.to} {...item} alertCount={noLeidas} />
          ))}

          {/* Administración — solo admin */}
          {rol === 'admin' && (
            <>
              <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'8px 4px' }} />
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(147,197,253,0.45)', letterSpacing:'.1em', padding:'0 12px', marginBottom:4 }}>ADMINISTRACIÓN</div>
              {ADMIN_NAV.map(item => (
                <SideLink key={item.to} {...item} />
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div style={{ padding:'10px 8px 12px', borderTop:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
          {/* Nuevo contrato — solo admin/supervisor */}
          {['admin','supervisor'].includes(rol) && (
            <button
              onClick={() => navigate('/contratos')}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:8, background:'rgba(59,130,246,0.25)', border:'1px solid rgba(59,130,246,0.35)', color:'rgba(147,197,253,0.9)', fontSize:12, fontWeight:500, cursor:'pointer', marginBottom:8 }}
            >
              <Plus size={13}/> Nuevo Contrato
            </button>
          )}
          {/* Usuario */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:600, flexShrink:0 }}>
              {initials}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:'#fff', fontSize:11, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {usuario?.nombre || usuario?.email || 'Usuario'}
              </div>
              <div style={{ color:'rgba(147,197,253,0.6)', fontSize:10 }}>{ROL_LABEL[rol] || rol}</div>
            </div>
            <button onClick={logout} title="Cerrar sesión" style={{ background:'transparent', border:'none', color:'rgba(147,197,253,0.5)', cursor:'pointer', padding:2 }}>
              <LogOut size={13}/>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="app-main">

        {/* Header */}
        <header style={{ flexShrink:0, display:'flex', alignItems:'center', padding:'10px 24px', gap:16, background:'#1e3a5f', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ flex:1, maxWidth:460, position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(147,197,253,0.5)' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search && navigate(`/contratos?buscar=${encodeURIComponent(search)}`)}
              placeholder="Buscar contratos, contratistas..."
              style={{ width:'100%', padding:'7px 12px 7px 32px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.08)', color:'#e2e8f0', fontSize:12, outline:'none' }}
            />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:'auto' }}>
            <button onClick={() => navigate('/alertas')} style={{ position:'relative', padding:8, borderRadius:8, border:'none', background:'transparent', cursor:'pointer' }}>
              <Bell size={16} color="rgba(147,197,253,0.8)"/>
              {noLeidas > 0 && <span style={{ position:'absolute', top:7, right:7, width:6, height:6, borderRadius:'50%', background:'#f87171', border:'1.5px solid #1e3a5f' }}/>}
            </button>
            <button style={{ padding:8, borderRadius:8, border:'none', background:'transparent', cursor:'pointer' }}>
              <HelpCircle size={16} color="rgba(147,197,253,0.8)"/>
            </button>
            <div style={{ paddingLeft:10, borderLeft:'1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ color:'#fff', fontSize:11, fontWeight:500 }}>{usuario?.nombre || 'Usuario'}</div>
              <div style={{ color:'rgba(147,197,253,0.6)', fontSize:10 }}>{ROL_LABEL[rol]}</div>
            </div>
          </div>
        </header>

        {/* Contenido con scroll */}
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
