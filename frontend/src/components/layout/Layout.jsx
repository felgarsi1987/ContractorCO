import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, FolderOpen, Bell,
  UserCog, BarChart3, Shield, UsersRound, Search,
  HelpCircle, Plus, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlertas } from '../../hooks/useAlertas';

const NAV = [
  { to: '/',             label: 'Resumen',      Icon: LayoutDashboard },
  { to: '/contratos',    label: 'Contratos',    Icon: FileText },
  { to: '/contratistas', label: 'Contratistas', Icon: Users },
  { to: '/documentos',   label: 'Documentos',   Icon: FolderOpen },
  { to: '/alertas',      label: 'Alertas',      Icon: Bell, badge: true },
  { to: '/supervisores', label: 'Supervisores', Icon: UserCog },
  { to: '/reportes',     label: 'Reportes',     Icon: BarChart3 },
];
const NAV2 = [
  { to: '/auditoria', label: 'Auditoría', Icon: Shield },
  { to: '/usuarios',  label: 'Usuarios',  Icon: UsersRound },
];

function SideLink({ to, label, Icon, badge, alertCount }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => isActive
        ? { display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:'rgba(59,130,246,0.85)', color:'#fff', fontSize:13, fontWeight:500, textDecoration:'none' }
        : { display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, color:'rgba(147,197,253,0.85)', fontSize:13, fontWeight:400, textDecoration:'none' }
      }
    >
      {({ isActive }) => <>
        <Icon size={16} style={{ flexShrink:0 }} />
        <span style={{ flex:1 }}>{label}</span>
        {badge && alertCount > 0 && (
          <span style={{ background:'#ef4444', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:99 }}>
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        )}
        {isActive && <ChevronRight size={14} style={{ opacity:.7 }} />}
      </>}
    </NavLink>
  );
}

export default function Layout() {
  const { usuario, logout } = useAuth();
  const { noLeidas } = useAlertas();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
    : 'A';

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f0f4f8' }}>

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside style={{ width:240, minWidth:240, display:'flex', flexDirection:'column', background:'linear-gradient(180deg, #0d1f3c 0%, #1a3460 100%)', flexShrink:0 }}>

        {/* Logo */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 6v4c0 4.4 3 8.5 7 9.5C14 18.5 17 14.4 17 10V6L10 2z" fill="white" fillOpacity="0.9"/>
              <path d="M7 10l2 2 4-4" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color:'#fff', fontSize:13, fontWeight:600, lineHeight:1.3 }}>ContralControl</div>
            <div style={{ color:'rgba(147,197,253,0.7)', fontSize:10, letterSpacing:'.05em' }}>GESTIÓN DE CONTRATISTAS</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
          <div style={{ fontSize:10, fontWeight:600, color:'rgba(147,197,253,0.5)', letterSpacing:'.08em', padding:'0 12px', marginBottom:6 }}>MENÚ PRINCIPAL</div>
          {NAV.map(item => (
            <SideLink key={item.to} {...item} alertCount={noLeidas} />
          ))}
          <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'10px 4px' }} />
          <div style={{ fontSize:10, fontWeight:600, color:'rgba(147,197,253,0.5)', letterSpacing:'.08em', padding:'0 12px', marginBottom:6 }}>ADMINISTRACIÓN</div>
          {NAV2.map(item => (
            <SideLink key={item.to} {...item} />
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:'10px 8px 12px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => navigate('/contratos')}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'8px', borderRadius:8, background:'rgba(59,130,246,0.3)', border:'1px solid rgba(59,130,246,0.4)', color:'#fff', fontSize:12, fontWeight:500, cursor:'pointer', marginBottom:8 }}
          >
            <Plus size={14} /> Nuevo Contrato
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.07)' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:600, flexShrink:0 }}>
              {initials}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:'#fff', fontSize:11, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{usuario?.email || usuario?.nombre || 'Admin'}</div>
              <div style={{ color:'rgba(147,197,253,0.7)', fontSize:10 }}>{usuario?.rol || 'admin'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Header */}
        <header style={{ flexShrink:0, display:'flex', alignItems:'center', padding:'10px 24px', gap:16, background:'#1e3a5f', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ flex:1, maxWidth:480, position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(147,197,253,0.6)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search && navigate(`/contratos?buscar=${search}`)}
              placeholder="Buscar contratos, contratistas o documentos..."
              style={{ width:'100%', padding:'7px 12px 7px 32px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.1)', color:'#e2e8f0', fontSize:13, outline:'none' }}
            />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
            <button onClick={() => navigate('/alertas')} style={{ position:'relative', padding:8, borderRadius:8, border:'none', background:'transparent', cursor:'pointer' }}>
              <Bell size={16} color="rgba(147,197,253,0.8)" />
              {noLeidas > 0 && <span style={{ position:'absolute', top:6, right:6, width:6, height:6, borderRadius:'50%', background:'#f87171', border:'1.5px solid #1e3a5f' }} />}
            </button>
            <button style={{ padding:8, borderRadius:8, border:'none', background:'transparent', cursor:'pointer' }}>
              <HelpCircle size={16} color="rgba(147,197,253,0.8)" />
            </button>
            <div style={{ paddingLeft:12, borderLeft:'1px solid rgba(255,255,255,0.15)', cursor:'pointer' }} onClick={logout}>
              <div style={{ color:'#fff', fontSize:12, fontWeight:500 }}>{usuario?.nombre || usuario?.email}</div>
              <div style={{ color:'rgba(147,197,253,0.7)', fontSize:10 }}>{usuario?.rol || 'Administrador'}</div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main style={{ flex:1, overflow:'hidden', minHeight:0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
