import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contratos as contratosDB } from '../../services/db';
import { colors, font, spacing, radius } from '../../utils/theme';
import StatusBadge from '../../components/ui/StatusBadge';

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v||0);

const TABS = [
  { key:'', label:'Todos' },
  { key:'vigente', label:'Vigentes' },
  { key:'proximo', label:'Por Vencer' },
  { key:'vencido', label:'Vencidos' },
];

export default function ContratosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState('');
  const [buscar,  setBuscar]  = useState('');
  const [page,    setPage]    = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await contratosDB.listar({ page, limit:20, semaforo:tab||undefined, buscar:buscar||undefined });
      if (page === 1) setData(r.data||[]);
      else setData(prev => [...prev, ...(r.data||[])]);
      setTotal(r.total||0);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab, buscar, page]);

  useEffect(() => { setData([]); setPage(1); }, [tab, buscar]);
  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex:1, backgroundColor:colors.bg }}>
      {/* Header */}
      <View style={{ backgroundColor:colors.navy, paddingTop:insets.top+spacing.sm, paddingBottom:spacing.xl, paddingHorizontal:spacing.xl }}>
        <Text style={{ color:colors.white, fontSize:font.xl, fontWeight:'700', marginBottom:spacing.sm }}>Contratos</Text>
        <TextInput
          value={buscar} onChangeText={v => { setBuscar(v); setPage(1); }}
          placeholder="Buscar contrato o contratista..."
          placeholderTextColor="rgba(147,197,253,0.5)"
          style={{ backgroundColor:'rgba(255,255,255,0.1)', borderRadius:radius.md, padding:spacing.sm, color:colors.white, fontSize:font.sm, borderWidth:1, borderColor:'rgba(255,255,255,0.15)' }}
        />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection:'row', padding:spacing.sm, backgroundColor:colors.white, borderBottomWidth:1, borderBottomColor:colors.border }}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
            style={{ flex:1, alignItems:'center', paddingVertical:spacing.sm, borderBottomWidth:2, borderBottomColor: tab===t.key ? colors.blue : 'transparent' }}>
            <Text style={{ fontSize:font.xs, fontWeight:'600', color: tab===t.key ? colors.blue : colors.gray500 }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding:spacing.lg, gap:spacing.sm, paddingBottom:spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={loading&&page===1} onRefresh={() => { setPage(1); load(); }} tintColor={colors.blue}/>}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 100 && !loading && data.length < total) {
            setPage(p => p + 1);
          }
        }}
        scrollEventThrottle={16}
      >
        {data.map(c => (
          <TouchableOpacity key={c.id}
            style={{ backgroundColor:colors.card, borderRadius:radius.lg, padding:spacing.lg, shadowColor:'#000', shadowOpacity:.05, shadowRadius:3, elevation:2 }}
            onPress={() => navigation.navigate('DetalleContrato', { id:c.id })}>
            <View style={{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', marginBottom:spacing.sm }}>
              <Text style={{ fontSize:font.md, fontWeight:'700', color:colors.gray900, flex:1 }}>{c.numero_contrato}</Text>
              <StatusBadge status={c.semaforo}/>
            </View>
            <Text style={{ fontSize:font.sm, color:colors.gray700, fontWeight:'500', marginBottom:4 }} numberOfLines={2}>
              {c.objeto}
            </Text>
            <Text style={{ fontSize:font.xs, color:colors.gray500, marginBottom:spacing.sm }}>
              {c.contratista_nombre}
            </Text>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
              <Text style={{ fontSize:font.sm, color:colors.blue, fontWeight:'700' }}>
                {formatCOP(c.valor_actual)}
              </Text>
              <Text style={{ fontSize:font.xs, color: c.dias_restantes<0?colors.danger:c.dias_restantes<30?colors.warning:colors.gray500 }}>
                {c.dias_restantes < 0 ? `Venció hace ${Math.abs(c.dias_restantes)}d` : `${c.dias_restantes} días restantes`}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {loading && page > 1 && <ActivityIndicator color={colors.blue} style={{ margin:spacing.lg }}/>}
        {data.length === 0 && !loading && (
          <View style={{ padding:spacing.xxxl, alignItems:'center' }}>
            <Text style={{ fontSize:font.md, color:colors.gray400, textAlign:'center' }}>
              Sin contratos{tab ? ` con estado "${tab}"` : ''}.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}