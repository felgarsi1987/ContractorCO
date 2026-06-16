import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle, XCircle, Filter, Send, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { alertas as alertasDB } from '../lib/db';
import { emailService } from '../lib/emailService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const priorityStyle = (tipo) => {
  if (tipo?.includes('vencido') || tipo?.includes('_5'))
    return { icon:<XCircle size={14} color="#5B21B6"/>, bg:'#DDD6FE', label:'Crítica', badgeCls:'badge-red' };
  if (tipo?.includes('_15'))
    return { icon:<AlertCircle size={14} color="#7C3AED"/>, bg:'#EDE9FE', label:'Alta', badgeCls:'badge-orange' };
  return { icon:<Clock size={14} color="#64748B"/>, bg:'#F1F5F9', label:'Media', badgeCls:'badge-gray' };
};

export default function Alertas() {
  const { usuario } = useAuth();
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState({});

  const load = () => {
    setLoading(true);
    alertasDB.listar({ limit:50 }).then(r => setData(r||[])).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const marcar = async (id) => {
    await alertasDB.marcarLeida(id);
    setData(p => p.map(a => a.id===id ? {...a, leida:true} : a));
    toast.success('Alerta marcada como leída');
  };

  const enviarEmail = async (alerta) => {
    setEnviando(p => ({ ...p, [alerta.id]: true }));
    try {
      // Buscar email del contratista vinculado al contrato
      let emailDestino = '';
      if (alerta.contrato_id) {
        const { data: ct } = await supabase
          .from('contratos')
          .select('contratistas(email, nombres, apellidos)')
          .eq('id', alerta.contrato_id)
          .single();
        emailDestino = ct?.contratistas?.email || '';
      }

      if (!emailDestino) {
        toast.error('El contratista no tiene email registrado');
        return;
      }

      await emailService.alertaVencimiento({
        para: emailDestino,
        contratoId: alerta.contrato_id,
        usuarioId: usuario?.id,
        datos: {
          numero_contrato: alerta.contratos?.numero_contrato || '—',
          mensaje: alerta.mensaje,
          tipo: alerta.tipo_alerta,
          fecha_vencimiento: alerta.documentos?.fecha_vencimiento,
          documento: alerta.documentos?.nombre,
          contratos_url: `${window.location.origin}/contratos`,
        },
      });
      toast.success(`Email enviado a ${emailDestino}`);
    } catch (e) {
      toast.error(e.message || 'Error enviando email');
    } finally {
      setEnviando(p => ({ ...p, [alerta.id]: false }));
    }
  };

  const criticas = data.filter(a => a.tipo_alerta?.includes('vencido') || a.tipo_alerta?.includes('_5'));
  const altas    = data.filter(a => a.tipo_alerta?.includes('_15'));

  return (
    <div className="page">
      <div className="page-hdr">
        <div><h1>Alertas</h1><p>Notificaciones y alertas del sistema</p></div>
        <div className="hdr-actions">
          <div className="badge badge-red" style={{ padding:'6px 12px', display:'flex', alignItems:'center', gap:4 }}><XCircle size={12}/>{criticas.length} Críticas</div>
          <div className="badge badge-orange" style={{ padding:'6px 12px', display:'flex', alignItems:'center', gap:4 }}><Clock size={12}/>{altas.length} Alta prioridad</div>
          <div className="badge badge-green" style={{ padding:'6px 12px', display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={12}/>{data.filter(a=>a.leida).length} Resueltas</div>
        </div>
      </div>

      <div className="card" style={{ flex:1, minHeight:0, overflow:'auto' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Cargando...</div>
        ) : data.length === 0 ? (
          <div style={{ padding:48, textAlign:'center' }}>
            <CheckCircle size={32} color="#94a3b8" style={{ margin:'0 auto 12px', display:'block' }}/>
            <div style={{ fontSize:14, fontWeight:500, color:'#64748b' }}>Sin alertas pendientes</div>
          </div>
        ) : data.map((a) => {
          const { icon, bg, label, badgeCls } = priorityStyle(a.tipo_alerta);
          return (
            <div key={a.id} className="alert-row" style={{ opacity: a.leida ? .6 : 1 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'#064E3B' }}>{a.contratos?.numero_contrato || 'Sistema'}</span>
                  <span className={`badge ${badgeCls}`}>{label}</span>
                  {a.leida && <span className="badge badge-green">Resuelta</span>}
                  {a.enviado_email && <span className="badge badge-blue" style={{ display:'flex', alignItems:'center', gap:3 }}><Mail size={9}/> Email enviado</span>}
                </div>
                <p style={{ fontSize:12, color:'#334155', fontWeight:500, margin:0 }}>{a.mensaje}</p>
              </div>
              <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:11, color:'#475569', margin:0 }}>{new Date(a.creado_en).toLocaleDateString('es-CO')}</p>
                  <p style={{ fontSize:10, color:'#94a3b8', margin:0 }}>{new Date(a.creado_en).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}</p>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button
                    onClick={() => enviarEmail(a)}
                    disabled={enviando[a.id]}
                    title="Enviar email de alerta al contratista"
                    className="btn btn-secondary"
                    style={{ padding:'5px 8px', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                    {enviando[a.id]
                      ? <Clock size={11} style={{ animation:'spin 1s linear infinite' }}/>
                      : <><Send size={11}/> Email</>
                    }
                  </button>
                  {!a.leida && <>
                    <button className="btn btn-primary btn-sm" onClick={() => marcar(a.id)} style={{ padding:'5px 10px' }}>Ver</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => marcar(a.id)} style={{ padding:'5px 10px' }}>Resolver</button>
                  </>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
