import { useState } from 'react';
import { Plus, X, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { CATALOGO_DOCS } from '../lib/docCatalog';

// Construye la lista del checklist para una solicitud.
// Props:
//   items      — [{nombre, base_legal, obligatorio, orden}]
//   onChange   — (newItems) => void
//   tipo       — 'precontractual'|'inicio'|'mensual'|'especial'|'cierre'
//   readOnly   — boolean

export default function ChecklistBuilder({ items = [], onChange, tipo = 'mensual', readOnly = false }) {
  const [busqueda, setBusqueda]         = useState('');
  const [dropdownAbierto, setDropdown]  = useState(false);

  const catalogo = CATALOGO_DOCS[tipo] || CATALOGO_DOCS.mensual;
  const nombresEnUso = new Set(items.map(i => i.nombre.toLowerCase()));

  const sugerencias = busqueda.trim().length > 0
    ? catalogo.filter(d =>
        d.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !nombresEnUso.has(d.nombre.toLowerCase())
      )
    : catalogo.filter(d => !nombresEnUso.has(d.nombre.toLowerCase()));

  function agregarDoc(doc) {
    const nuevo = { nombre: doc.nombre, base_legal: doc.base_legal || '', obligatorio: true, orden: items.length + 1 };
    onChange([...items, nuevo]);
    setBusqueda('');
    setDropdown(false);
  }

  function agregarPersonalizado() {
    const nombre = busqueda.trim();
    if (!nombre) return;
    if (nombresEnUso.has(nombre.toLowerCase())) { setBusqueda(''); return; }
    agregarDoc({ nombre, base_legal: '' });
  }

  function eliminar(idx) {
    onChange(items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, orden: i + 1 })));
  }

  function toggleObligatorio(idx) {
    onChange(items.map((it, i) => i === idx ? { ...it, obligatorio: !it.obligatorio } : it));
  }

  function mover(idx, dir) {
    if (dir === -1 && idx === 0) return;
    if (dir ===  1 && idx === items.length - 1) return;
    const arr = [...items];
    const tmp = arr[idx]; arr[idx] = arr[idx + dir]; arr[idx + dir] = tmp;
    onChange(arr.map((it, i) => ({ ...it, orden: i + 1 })));
  }

  return (
    <div>
      {/* Lista de items */}
      <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:8 }}>
        {items.length === 0 && (
          <div style={{ textAlign:'center', padding:'12px 0', color:'#94a3b8', fontSize:11, border:'1px dashed #CBD5E1', borderRadius:7 }}>
            Sin documentos — usa el buscador para agregar
          </div>
        )}
        {items.map((item, idx) => (
          <div key={idx} style={{
            display:'flex', alignItems:'flex-start', gap:8,
            padding:'8px 10px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:7,
          }}>
            {/* Orden */}
            {!readOnly && (
              <div style={{ display:'flex', flexDirection:'column', gap:1, paddingTop:1, flexShrink:0 }}>
                <button onClick={() => mover(idx, -1)} disabled={idx === 0} style={{ background:'none', border:'none', cursor:'pointer', color:'#CBD5E1', padding:0, lineHeight:1 }}>
                  <ChevronUp size={11}/>
                </button>
                <button onClick={() => mover(idx, 1)} disabled={idx === items.length - 1} style={{ background:'none', border:'none', cursor:'pointer', color:'#CBD5E1', padding:0, lineHeight:1 }}>
                  <ChevronDown size={11}/>
                </button>
              </div>
            )}

            {/* Número */}
            <div style={{ width:18, height:18, borderRadius:'50%', background:'#E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#64748b', flexShrink:0, marginTop:1 }}>
              {idx + 1}
            </div>

            {/* Contenido */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, fontWeight:600, color:'#064E3B' }}>{item.nombre}</span>
                {!readOnly && (
                  <button
                    onClick={() => toggleObligatorio(idx)}
                    style={{
                      fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4,
                      border:'none', cursor:'pointer', flexShrink:0,
                      background: item.obligatorio ? '#DDD6FE' : '#F1F5F9',
                      color:      item.obligatorio ? '#5B21B6' : '#64748B',
                    }}>
                    {item.obligatorio ? 'Obligatorio' : 'Opcional'}
                  </button>
                )}
                {readOnly && !item.obligatorio && (
                  <span style={{ fontSize:9, color:'#94a3b8', fontWeight:600 }}>Opcional</span>
                )}
              </div>
              {item.base_legal && (
                <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{item.base_legal}</div>
              )}
            </div>

            {/* Eliminar */}
            {!readOnly && (
              <button onClick={() => eliminar(idx)} title="Quitar documento"
                style={{ background:'none', border:'none', cursor:'pointer', color:'#5B21B6', padding:2, flexShrink:0, marginTop:1 }}>
                <X size={13}/>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Buscador / agregar */}
      {!readOnly && (
        <div style={{ position:'relative' }}>
          <div style={{ position:'relative' }}>
            <Search size={12} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}/>
            <input
              style={{ width:'100%', padding:'7px 10px 7px 28px', border:'1px solid #CBD5E1', borderRadius:6, fontSize:12, outline:'none', boxSizing:'border-box' }}
              placeholder="Buscar en catálogo o escribir documento personalizado..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setDropdown(true); }}
              onFocus={() => setDropdown(true)}
              onBlur={() => setTimeout(() => setDropdown(false), 180)}
            />
          </div>

          {dropdownAbierto && (
            <div style={{
              position:'absolute', top:'calc(100% + 2px)', left:0, right:0, zIndex:200,
              background:'#fff', border:'1px solid #E2E8F0', borderRadius:7,
              boxShadow:'0 4px 20px rgba(0,0,0,.09)', maxHeight:220, overflow:'auto',
            }}>
              {sugerencias.length === 0 && !busqueda.trim() && (
                <div style={{ padding:'12px 14px', fontSize:11, color:'#94a3b8', textAlign:'center' }}>
                  Ya están todos los documentos del catálogo
                </div>
              )}
              {busqueda.trim().length === 0 && sugerencias.length > 0 && (
                <div style={{ padding:'5px 12px 3px', fontSize:9, fontWeight:800, color:'#94a3b8', letterSpacing:'.08em' }}>
                  CATÁLOGO DE DOCUMENTOS ({sugerencias.length})
                </div>
              )}
              {sugerencias.map((d, i) => (
                <div
                  key={i}
                  onMouseDown={() => agregarDoc(d)}
                  style={{ padding:'8px 12px', cursor:'pointer', borderBottom:'1px solid #F8FAFC' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#064E3B', display:'flex', alignItems:'center', gap:6 }}>
                    <Plus size={11} color="#059669"/> {d.nombre}
                  </div>
                  {d.base_legal && <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{d.base_legal}</div>}
                </div>
              ))}
              {busqueda.trim() && (
                <div
                  onMouseDown={agregarPersonalizado}
                  style={{ padding:'8px 12px', cursor:'pointer', background:'#ECFDF5', borderTop:'1px solid #A7F3D0' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#059669', display:'flex', alignItems:'center', gap:6 }}>
                    <Plus size={11}/> Agregar como personalizado: &quot;{busqueda.trim()}&quot;
                  </div>
                  <div style={{ fontSize:10, color:'#60a5fa', marginTop:1 }}>No está en el catálogo — se añadirá sin base legal</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!readOnly && (
        <div style={{ fontSize:10, color:'#94a3b8', marginTop:5 }}>
          {items.length} documento{items.length !== 1 ? 's' : ''} en el checklist
          {items.filter(i => i.obligatorio).length > 0 && ` · ${items.filter(i => i.obligatorio).length} obligatorio${items.filter(i => i.obligatorio).length !== 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  );
}
