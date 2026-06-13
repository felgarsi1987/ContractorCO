import supabase from './supabase';

export const auth = {
  login:  (email, password) => supabase.auth.signInWithPassword({ email, password }),
  logout: () => supabase.auth.signOut(),
  session: () => supabase.auth.getSession(),
  onAuthChange: (cb) => supabase.auth.onAuthStateChange(cb),
};

export const dashboard = {
  getStats: async () => {
    const { data, error } = await supabase.from('v_dashboard').select('*').single();
    if (error) throw error;
    return data;
  },
};

export const contratos = {
  listar: async ({ page=1, limit=20, semaforo, buscar, supervisor_id } = {}) => {
    let q = supabase.from('v_contratos_completos').select('*', { count:'exact' })
      .order('fecha_fin', { ascending:true })
      .range((page-1)*limit, page*limit-1);
    if (semaforo)      q = q.eq('semaforo', semaforo);
    if (supervisor_id) q = q.eq('supervisor_id', supervisor_id);
    if (buscar) q = q.or(`numero_contrato.ilike.%${buscar}%,contratista_nombre.ilike.%${buscar}%`);
    const { data, error, count } = await q;
    if (error) throw error;
    return { data, total: count };
  },
  obtener: async (id) => {
    const [{ data:c, error }, { data:docs }] = await Promise.all([
      supabase.from('v_contratos_completos').select('*').eq('id', id).single(),
      supabase.from('documentos').select('*').eq('contrato_id', id).eq('es_vigente', true).order('subido_en', { ascending:false }),
    ]);
    if (error) throw error;
    return { ...c, documentos: docs || [] };
  },
};

export const alertas = {
  listar: async ({ leida, limit=30 } = {}) => {
    let q = supabase.from('alertas')
      .select('*, contratos(numero_contrato)')
      .order('creado_en', { ascending:false })
      .limit(limit);
    if (leida !== undefined) q = q.eq('leida', leida);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },
  marcarLeida: async (id) => {
    const { error } = await supabase.from('alertas').update({ leida:true }).eq('id', id);
    if (error) throw error;
  },
  noLeidas: async () => {
    const { count, error } = await supabase.from('alertas').select('*', { count:'exact', head:true }).eq('leida', false);
    if (error) return 0;
    return count || 0;
  },
};

export const documentos = {
  listar: async ({ contrato_id, estado_vence } = {}) => {
    let q = supabase.from('documentos').select('*, contratos(numero_contrato)')
      .eq('es_vigente', true).order('subido_en', { ascending:false });
    if (contrato_id)  q = q.eq('contrato_id', contrato_id);
    if (estado_vence) q = q.eq('estado_vence', estado_vence);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },
};