import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { alertas as alertasDB } from '../../services/db';
import { colors, font, spacing, radius } from '../../utils/theme';
import Toast from 'react-native-toast-message';

const prioridad = (tipo) => {
  if (tipo?.includes('vencido') || tipo?.includes('_5'))  return { color:colors.danger,  bg:colors.dangerBg,  emoji:'🔴', label:'Crítica'    };
  if (tipo?.includes('_15'))                              return { color:colors.warning, bg:colors.warningBg, emoji:'🟠', label:'Alta'       };
  return                                                         { color:'#f59e0b',      bg:'#fffbeb',        emoji:'🟡', label:'Media'      };
};

export default function AlertasScreen() {
  const insets = useSafeAreaInsets();
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await alertasDB.listar({ limit:50 })); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const marcar = async (id) => {
    try {
      await alertasDB.marcarLeida(id);
      setData(prev => prev.map(a => a.id===id ? {...a, leida:true} : a));
      Toast.show({ type:'success', text1:'Alerta marcada como leída' });
    } catch(e) { Toast.show({ type:'error', text1:'Error al actualizar' }); }
  };

  const noLeidas = data.filter(a => !a.leida).length;

  return (
    <View style={{ flex:1, backgroundColor:colors.bg }}>
      <View style={{ backgroundColor:colors.navy, paddingTop:insets.top+spacing.sm, paddingBottom:spacing.xl, paddingHorizontal:spacing.xl }}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
          <Text style={{ color:colors.white, fontSize:font.xl, fontWeight:'700' }}>Alertas</Text>
          {noLeidas > 0 && (
            <View style={{ backgroundColor:colors.danger, paddingHorizontal:10, paddingVertical:3, borderRadius:radius.full }}>
              <Text style={{ color:colors.white, fontSize:font.xs, fontWeight:'700' }}>{noLeidas} sin leer</Text>
            </View>
          )}
        </View>
        <Text style={{ color:'rgba(147,197,253,0.6)', fontSize:font.xs, marginTop:2 }}>
          Notificaciones de vencimientos y documentos
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding:spacing.lg, gap:spacing.sm, paddingBottom:spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.blue}/>}
        showsVerticalScrollIndicator={false}
      >
        {data.length === 0 && !loading ? (
          <View style={{ padding:spacing.xxxl, alignItems:'center' }}>
            <Text style={{ fontSize:32, marginBottom:spacing.md }}>✅</Text>
            <Text style={{ fontSize:font.lg, fontWeight:'600', color:colors.gray700, marginBottom:4 }}>Sin alertas pendientes</Text>
            <Text style={{ fontSize:font.sm, color:colors.gray500 }}>Todo está al día</Text>
          </View>
        ) : data.map(a => {
          const p = prioridad(a.tipo_alerta);
          return (
            <View key={a.id} style={{ backgroundColor:colors.card, borderRadius:radius.lg, padding:spacing.lg, borderLeftWidth:3, borderLeftColor:a.leida?colors.gray200:p.color, opacity:a.leida?.6:1, shadowColor:'#000', shadowOpacity:.04, shadowRadius:3, elevation:1 }}>
              <View style={{ flexDirection:'row', alignItems:'flex-start', gap:spacing.md }}>
                <Text style={{ fontSize:18 }}>{p.emoji}</Text>
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:spacing.sm, marginBottom:4 }}>
                    <Text style={{ fontSize:font.sm, fontWeight:'600', color:colors.gray900 }}>
                      {a.contratos?.numero_contrato || 'Sistema'}
                    </Text>
                    <View style={{ backgroundColor:p.bg, paddingHorizontal:6, paddingVertical:1, borderRadius:radius.full }}>
                      <Text style={{ fontSize:9, fontWeight:'700', color:p.color }}>{p.label}</Text>
                    </View>
                    {a.leida && (
                      <View style={{ backgroundColor:colors.successBg, paddingHorizontal:6, paddingVertical:1, borderRadius:radius.full }}>
                        <Text style={{ fontSize:9, fontWeight:'700', color:colors.success }}>Leída</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize:font.sm, color:colors.gray700, lineHeight:font.sm*1.5 }}>{a.mensaje}</Text>
                  <Text style={{ fontSize:font.xs, color:colors.gray400, marginTop:6 }}>
                    {new Date(a.creado_en).toLocaleDateString('es-CO')} · {new Date(a.creado_en).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})}
                  </Text>
                </View>
              </View>
              {!a.leida && (
                <TouchableOpacity onPress={() => marcar(a.id)}
                  style={{ marginTop:spacing.md, padding:spacing.sm, backgroundColor:colors.bluePale, borderRadius:radius.sm, alignItems:'center' }}>
                  <Text style={{ fontSize:font.xs, color:colors.blue, fontWeight:'600' }}>Marcar como leída</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}