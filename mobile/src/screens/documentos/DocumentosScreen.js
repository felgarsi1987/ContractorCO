import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { documentos as docsDB } from '../../services/db';
import { colors, font, spacing, radius } from '../../utils/theme';
import StatusBadge from '../../components/ui/StatusBadge';

const TABS = [
  { key:undefined,   label:'Todos'      },
  { key:'vencido',   label:'Vencidos'   },
  { key:'proximo',   label:'Por Vencer' },
  { key:'vigente',   label:'Vigentes'   },
];

export default function DocumentosScreen() {
  const insets = useSafeAreaInsets();
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await docsDB.listar({ estado_vence: tab })); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const vencidos = data.filter(d => d.estado_vence === 'vencido').length;

  return (
    <View style={{ flex:1, backgroundColor:colors.bg }}>
      <View style={{ backgroundColor:colors.navy, paddingTop:insets.top+spacing.sm, paddingBottom:spacing.xl, paddingHorizontal:spacing.xl }}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
          <Text style={{ color:colors.white, fontSize:font.xl, fontWeight:'700' }}>Documentos</Text>
          {vencidos > 0 && (
            <View style={{ backgroundColor:colors.danger, paddingHorizontal:10, paddingVertical:3, borderRadius:radius.full }}>
              <Text style={{ color:colors.white, fontSize:font.xs, fontWeight:'700' }}>{vencidos} vencidos</Text>
            </View>
          )}
        </View>
        <Text style={{ color:'rgba(147,197,253,0.6)', fontSize:font.xs, marginTop:2 }}>
          Gestión documental de contratos
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection:'row', backgroundColor:colors.white, borderBottomWidth:1, borderBottomColor:colors.border }}>
        {TABS.map(t => (
          <TouchableOpacity key={String(t.key)} onPress={() => setTab(t.key)}
            style={{ flex:1, alignItems:'center', paddingVertical:spacing.md, borderBottomWidth:2, borderBottomColor: tab===t.key?colors.blue:'transparent' }}>
            <Text style={{ fontSize:font.xs, fontWeight:'600', color: tab===t.key?colors.blue:colors.gray500 }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding:spacing.lg, gap:spacing.sm, paddingBottom:spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.blue}/>}
        showsVerticalScrollIndicator={false}
      >
        {data.map((d, i) => (
          <View key={d.id} style={{ backgroundColor:colors.card, borderRadius:radius.lg, padding:spacing.lg, flexDirection:'row', alignItems:'center', gap:spacing.md, shadowColor:'#000', shadowOpacity:.04, shadowRadius:3, elevation:1 }}>
            <View style={{ width:38, height:38, borderRadius:radius.md, backgroundColor:colors.bluePale, alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Text style={{ fontSize:20 }}>📄</Text>
            </View>
            <View style={{ flex:1, minWidth:0 }}>
              <Text style={{ fontSize:font.sm, fontWeight:'600', color:colors.gray900 }} numberOfLines={1}>{d.nombre}</Text>
              <Text style={{ fontSize:font.xs, color:colors.gray500, marginTop:1 }}>
                {d.contratos?.numero_contrato || 'Sin contrato'} · {d.categoria?.replace(/_/g,' ')}
              </Text>
              {d.fecha_vencimiento && (
                <Text style={{ fontSize:font.xs, color: d.estado_vence==='vencido'?colors.danger:d.estado_vence==='proximo'?colors.warning:colors.gray400, marginTop:2 }}>
                  Vence: {new Date(d.fecha_vencimiento).toLocaleDateString('es-CO')}
                </Text>
              )}
            </View>
            <StatusBadge status={d.estado_vence}/>
          </View>
        ))}
        {data.length === 0 && !loading && (
          <View style={{ padding:spacing.xxxl, alignItems:'center' }}>
            <Text style={{ fontSize:32, marginBottom:spacing.md }}>📂</Text>
            <Text style={{ fontSize:font.md, fontWeight:'600', color:colors.gray700, marginBottom:4 }}>Sin documentos</Text>
            <Text style={{ fontSize:font.sm, color:colors.gray500, textAlign:'center' }}>
              Los documentos aparecerán aquí cuando se carguen desde el portal web.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}