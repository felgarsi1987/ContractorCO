import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

/**
 * Dropdown con búsqueda incorporada — reemplaza <select> nativo cuando hay >10 opciones.
 * Props:
 *   value       string | ''     — valor seleccionado actualmente
 *   onChange    (val) => void   — callback al seleccionar
 *   options     [{value, label, sublabel?}]
 *   placeholder string
 *   searchPlaceholder string
 *   disabled    bool
 *   clearable   bool (default true)
 *   style       CSSProperties
 */
export default function SearchSelect({
  value = '',
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  disabled = false,
  clearable = true,
  style,
}) {
  const [open, setBuscar_open] = useState(false);
  const [buscar, setBuscar] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find(o => o.value === value);

  const filtradas = buscar.trim()
    ? options.filter(o =>
        o.label.toLowerCase().includes(buscar.toLowerCase()) ||
        (o.sublabel || '').toLowerCase().includes(buscar.toLowerCase())
      )
    : options;

  const close = useCallback(() => {
    setBuscar_open(false);
    setBuscar('');
  }, []);

  useEffect(() => {
    const handle = (e) => { if (!ref.current?.contains(e.target)) close(); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const select = (val) => {
    onChange(val);
    close();
  };

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setBuscar_open(o => !o)}
        className="form-input"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none', padding: '7px 10px',
          opacity: disabled ? 0.6 : 1,
          background: disabled ? '#f9fafb' : undefined,
        }}
      >
        <span style={{
          flex: 1, fontSize: 12,
          color: selected ? '#1F2937' : '#94a3b8',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {selected
            ? <>
                {selected.label}
                {selected.sublabel && (
                  <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>
                    {selected.sublabel}
                  </span>
                )}
              </>
            : placeholder}
        </span>
        {clearable && value && !disabled && (
          <X
            size={11} color="#94a3b8"
            style={{ flexShrink: 0, cursor: 'pointer' }}
            onClick={e => { e.stopPropagation(); onChange(''); setBuscar(''); }}
          />
        )}
        <ChevronDown
          size={12} color="#94a3b8"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : '', transition: 'transform .15s' }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0,
          zIndex: 9999, background: '#fff',
          border: '1px solid #D1D5DB', borderRadius: 8,
          boxShadow: '0 10px 30px rgba(0,0,0,.14)', overflow: 'hidden',
          minWidth: 220,
        }}>
          {/* Search input */}
          <div style={{ padding: '7px 8px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{
                position: 'absolute', left: 8, top: '50%',
                transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none',
              }}/>
              <input
                ref={inputRef}
                className="form-input"
                style={{ paddingLeft: 26, fontSize: 12, height: 30 }}
                placeholder={searchPlaceholder}
                value={buscar}
                onChange={e => setBuscar(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options list */}
          <div style={{ maxHeight: 240, overflow: 'auto' }}>
            {filtradas.length === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                Sin resultados para "{buscar}"
              </div>
            ) : filtradas.map(o => (
              <div
                key={o.value}
                onClick={() => select(o.value)}
                style={{
                  padding: o.sublabel ? '8px 12px' : '9px 12px',
                  fontSize: 12, cursor: 'pointer',
                  background: o.value === value ? '#D1FAE5' : 'transparent',
                  color: o.value === value ? '#059669' : '#374151',
                  fontWeight: o.value === value ? 600 : 400,
                  borderBottom: '1px solid #F9FAFB',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ lineHeight: 1.3 }}>{o.label}</div>
                {o.sublabel && (
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{o.sublabel}</div>
                )}
              </div>
            ))}
          </div>

          {/* Footer count */}
          {filtradas.length > 0 && (
            <div style={{
              padding: '4px 12px', fontSize: 10, color: '#94a3b8',
              borderTop: '1px solid #F3F4F6', textAlign: 'right',
            }}>
              {filtradas.length} {filtradas.length === 1 ? 'resultado' : 'resultados'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
