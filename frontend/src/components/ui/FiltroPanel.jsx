import { useState } from 'react';
import { X, Filter } from 'lucide-react';

export default function FiltroPanel({ campos, valores, onAplicar, onLimpiar }) {
  const [local, setLocal] = useState(valores || {});
  const set = (k, v) => setLocal(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:40,
      display:'flex', justifyContent:'flex-end',
    }}>
      {/* Overlay */}
      <div style={{ position:'absolute', inset:0, background:'rgba(13,51,33,0.3)', backdropFilter:'blur(2px)' }}
        onClick={() => onAplicar(local)}/>

      {/* Panel */}
      <div style={{
        position:'relative', width:320, height:'100%',
        background:'#fff', borderLeft:'1px solid var(--border)',
        display:'flex', flexDirection:'column',
        boxShadow:'-4px 0 24px rgba(13,51,33,0.1)',
        animation:'slideIn .2s ease',
      }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Filter size={15} style={{ color:'var(--emerald)' }}/>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--forest)', letterSpacing:'-0.01em' }}>Filtros</span>
          </div>
          <button className="btn-icon" onClick={() => onAplicar(local)}><X size={15}/></button>
        </div>

        <div style={{ flex:1, overflow:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:16 }}>
          {campos.map(campo => (
            <div key={campo.key} className="field">
              <label>{campo.label}</label>
              {campo.type === 'select' ? (
                <select className="select-field" value={local[campo.key] || ''} onChange={e => set(campo.key, e.target.value)}>
                  <option value="">Todos</option>
                  {campo.options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : campo.type === 'date-range' ? (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <input className="input-field" type="date" value={local[campo.key+'_desde'] || ''}
                    onChange={e => set(campo.key+'_desde', e.target.value)} placeholder="Desde"/>
                  <input className="input-field" type="date" value={local[campo.key+'_hasta'] || ''}
                    onChange={e => set(campo.key+'_hasta', e.target.value)} placeholder="Hasta"/>
                </div>
              ) : (
                <input className="input-field" type={campo.type || 'text'}
                  value={local[campo.key] || ''} onChange={e => set(campo.key, e.target.value)}
                  placeholder={campo.placeholder || ''}/>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
          <button className="btn btn-secondary" style={{ flex:1, justifyContent:'center' }}
            onClick={() => { setLocal({}); onLimpiar(); }}>
            Limpiar
          </button>
          <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}
            onClick={() => onAplicar(local)}>
            Aplicar filtros
          </button>
        </div>
      </div>

      <style>{`@keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }`}</style>
    </div>
  );
}
