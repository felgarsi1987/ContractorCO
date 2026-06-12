import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAlertas } from '../../hooks/useAlertas';

const NAV_ITEMS = [
  { to: '/',              icon: 'dashboard',            label: 'Resumen' },
  { to: '/contratos',     icon: 'description',          label: 'Contratos' },
  { to: '/contratistas',  icon: 'engineering',          label: 'Contratistas' },
  { to: '/documentos',    icon: 'folder_managed',       label: 'Documentos' },
  { to: '/alertas',       icon: 'notifications_active', label: 'Alertas', badge: true },
  { to: '/supervisores',  icon: 'manage_accounts',      label: 'Supervisores' },
  { to: '/reportes',      icon: 'analytics',            label: 'Reportes' },
];

const NAV_SYSTEM = [
  { to: '/auditoria', icon: 'policy',  label: 'Auditoría' },
  { to: '/usuarios',  icon: 'group',   label: 'Usuarios' },
];

function NavItem({ to, icon, label, badge, alertCount }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `sb-item ${isActive ? 'active' : ''}`
      }
    >
      <span className="ms ms-sm">{icon}</span>
      {label}
      {badge && alertCount > 0 && (
        <span className="sb-badge">{alertCount > 99 ? '99+' : alertCount}</span>
      )}
    </NavLink>
  );
}

export default function Layout() {
  const { usuario, logout } = useAuth();
  const { noLeidas } = useAlertas();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'AP';

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/contratos?buscar=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="app">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="sidebar" style={{ width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)', background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>

        {/* Brand */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="text-headline-md c-primary" style={{ fontWeight: 700 }}>Control Portal</div>
          <div className="text-label c-secondary" style={{ opacity: .7, marginTop: 2 }}>Administración Pública</div>
        </div>

        {/* Nav principal */}
        <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV_ITEMS.map(item => (
            <NavItem key={item.to} {...item} alertCount={noLeidas} />
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px' }} />

          {NAV_SYSTEM.map(item => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
            onClick={() => navigate('/contratos/nuevo')}
          >
            <span className="ms ms-sm">add</span>
            Nuevo Contrato
          </button>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 4, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-low)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div className="sb-avatar" style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-container)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-label c-primary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0, textTransform: 'none' }}>
                {usuario?.nombre || 'Admin Principal'}
              </div>
              <div className="text-caption c-secondary">ID: {usuario?.id?.slice(0,8) || '44021'}</div>
            </div>
            <span className="ms ms-sm" style={{ color: 'var(--outline)' }} onClick={logout}>logout</span>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ height: 'var(--topbar-height)', background: 'var(--surface-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0, zIndex: 40 }}>

          <div className="search-box" style={{ flex: 1, maxWidth: 420 }}>
            <span className="ms">search</span>
            <input
              className="input"
              placeholder="Buscar contratos, contratistas o documentos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <button className="btn-icon" onClick={() => navigate('/alertas')} style={{ position: 'relative' }}>
              <span className="ms">notifications</span>
              {noLeidas > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--surface-card)' }} />
              )}
            </button>
            <button className="btn-icon"><span className="ms">help</span></button>

            <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>
              <div style={{ textAlign: 'right' }}>
                <div className="text-label c-primary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0, textTransform: 'none', lineHeight: 1.3 }}>
                  {usuario?.nombre || 'Admin Principal'}
                </div>
                <div className="text-caption c-secondary">ID: {usuario?.id?.slice(0,8) || '44021'}</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-container)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Contenido de la página */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
