import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { dashboard as dashDB, contratos as contratosDB, alertas as alertasDB } from '../../services/db';
import { colors, font, spacing, radius } from '../../utils/theme';
import KpiCard    from '../../components/ui/KpiCard';
import StatusBadge from '../../components/ui/StatusBadge';

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v||0);

export default function DashboardScreen({ navigation }) {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats,     setStats]     = useState(null);
  const [contratos, setContratos] = useState([]);
  const [alertas,   setAlertas]   = useState([]);
  const [loading,   setLoading]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, a] = await Promise.all([
        dashDB.getStats(),
        contratosDB.listar({ limit:5 }),
        alertasDB.listar({ leida:false, limit:3 }),
      ]);
      setStats(s); setContratos(c.data||[]); setAlertas(a||[]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hora = new Date().getHours();
  const saludo = hora<12 ? 'Buenos días' : hora<18 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = usuario?.nombre?.split(' ')[0] || 'Usuario';

  return (
    <View style={{ flex:1, backgroundColor:colors.bg }}>
      {/* Header */}
      <View style={{ backgroundColor:colors.navy, paddingTop:insets.top+spacing.sm, paddingBottom:spacing.xl, paddingHorizontal:spacing.xl }}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:spacing.md }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:spacing.sm }}>
            <View style={{ width:34, height:34, borderRadius:17, backgroundColor:colors.blue, alignItems:'center', justifyContent:'center' }}>
              <Text style={{ color:colors.white, fontSize:font.sm, fontWeight:'700' }}>
                {nombre[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={{ color:'rgba(147,197,253,0.7)', fontSize:font.xs }}>{saludo}</Text>
              <Text style={{ color:colors.white, fontSize:font.md, fontWeight:'600' }}>{nombre}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Alertas')}
            style={{ backgroundColor:'rgba(255,255,255,0.1)', padding:spacing.sm, borderRadius:radius.md }}>
            <Text style={{ fontSize:18 }}>🔔</Text>
            {alertas.length > 0 && (
              <View style={{ position:'absolute', top:4, right:4, width:8, height:8, borderRadius:4, backgroundColor:'#f87171', borderWidth:1.5, borderColor:colors.navy }}/>
            )}
          </TouchableOpacity>
        </View>
        <Text style={{ color:colors.white, fontSize:font.lg, fontWeight:'700' }}>
          ContralControl
        </Text>
        <Text style={{ color:'rgba(147,197,253,0.6)', fontSize:font.xs, marginTop:2 }}>
          Panel de control de contratos
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding:spacing.lg, gap:spacing.lg, paddingBottom:spacing.xxxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.blue}/>}
        showsVerticalScrollIndicator={false}
      >
        {/* KPIs */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:spacing.sm }}>
          <KpiCard label="Contratos" value={stats?.contratos_activos??'—'} sub="En ejecución" color={colors.blue} bg={colors.bluePale} barColor={colors.blue} style={{ flex:1 }}/>
          <KpiCard label="Por Vencer" value={stats?.contratos_proximos_vencer??'—'} sub="30 días" color={colors.warning} bg={colors.warningBg} barColor={colors.warning} style={{ flex:1 }}/>
        </View>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:spacing.sm }}>
          <KpiCard label="Docs. Vencidos" value={stats?.documentos_vencidos??'—'} sub="Acción requerida" color={colors.danger} bg={colors.dangerBg} barColor={colors.danger} style={{ flex:1 }}/>
          <KpiCard label="Contratistas" value={stats?.contratistas_activos??'—'} sub="Registrados" color="#0d9488" bg="#f0fdfa" barColor="#0d9488" style={{ flex:1 }}/>
        </View>

        {/* Contratos recientes */}
        <View style={{ backgroundColor:colors.card, borderRadius:radius.lg, overflow:'hidden', shadowColor:'#000', shadowOpacity:.06, shadowRadius:4, elevation:2 }}>
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:spacing.lg, borderBottomWidth:1, borderBottomColor:colors.border }}>
            <Text style={{ fontSize:font.md, fontWeight:'600', color:colors.gray900 }}>Contratos Recientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Contratos')}>
              <Text style={{ fontSize:font.sm, color:colors.blue, fontWeight:'500' }}>Ver todos →</Text>
            </TouchableOpacity>
          </View>
          {contratos.length === 0 ? (
            <View style={{ padding:spacing.xxl, alignItems:'center' }}>
              <Text style={{ color:colors.gray400, fontSize:font.sm }}>Sin contratos registrados</Text>
            </View>
          ) : contratos.map((c, i) => (
            <TouchableOpacity key={c.id}
              style={{ padding:spacing.lg, borderBottomWidth: i<contratos.length-1?1:0, borderBottomColor:colors.border }}
              onPress={() => navigation.navigate('Contratos', { screen:'DetalleContrato', params:{ id:c.id } })}>
              <View style={{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4 }}>
                <Text style={{ fontSize:font.sm, fontWeight:'600', color:colors.gray900, flex:1 }}>{c.numero_contrato}</Text>
                <StatusBadge status={c.semaforo}/>
              </View>
              <Text style={{ fontSize:font.xs, color:colors.gray500 }} numberOfLines={1}>{c.contratista_nombre}</Text>
              <Text style={{ fontSize:font.xs, color:colors.blue, fontWeight:'500', marginTop:2 }}>
                {formatCOP(c.valor_actual)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alertas recientes */}
        {alertas.length > 0 && (
          <View style={{ backgroundColor:colors.card, borderRadius:radius.lg, overflow:'hidden', shadowColor:'#000', shadowOpacity:.06, shadowRadius:4, elevation:2 }}>
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:spacing.lg, borderBottomWidth:1, borderBottomColor:colors.border }}>
              <Text style={{ fontSize:font.md, fontWeight:'600', color:colors.gray900 }}>Alertas Pendientes</Text>
              <View style={{ backgroundColor:colors.dangerBg, paddingHorizontal:8, paddingVertical:2, borderRadius:radius.full }}>
                <Text style={{ color:colors.danger, fontSize:font.xs, fontWeight:'700' }}>{alertas.length}</Text>
              </View>
            </View>
            {alertas.map((a, i) => (
              <TouchableOpacity key={a.id}
                style={{ padding:spacing.lg, flexDirection:'row', gap:spacing.md, borderBottomWidth:i<alertas.length-1?1:0, borderBottomColor:colors.border }}
                onPress={() => navigation.navigate('Alertas')}>
                <View style={{ width:8, height:8, borderRadius:4, backgroundColor:colors.danger, marginTop:4, flexShrink:0 }}/>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:font.sm, fontWeight:'500', color:colors.gray900 }}>
                    {a.contratos?.numero_contrato || 'Sistema'}
                  </Text>
                  <Text style={{ fontSize:font.xs, color:colors.gray500, marginTop:2, lineHeight:font.xs*1.5 }} numberOfLines={2}>
                    {a.mensaje}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}