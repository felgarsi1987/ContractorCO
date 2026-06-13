import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contratos as contratosDB } from '../../services/db';
import { colors, font, spacing, radius } from '../../utils/theme';
import StatusBadge from '../../components/ui/StatusBadge';

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v||0);

export default function ContratoDetalle({ route, navigation }) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const [contrato, setContrato] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    contratosDB.obtener(id).then(setContrato).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:colors.bg }}>
      <ActivityIndicator color={colors.blue} size="large"/>
    </View>
  );

  if (!contrato) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:colors.bg }}>
      <Text style={{ color:colors.gray400 }}>Contrato no encontrado.</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop:spacing.lg }}>
        <Text style={{ color:colors.blue }}>← Volver</Text>
      </TouchableOpacity>
    </View>
  );

  const campos = [
    ['Contratista', contrato.contratista_nombre || '—'],
    ['Supervisor',  contrato.supervisor_nombre  || '—'],
    ['Tipo',        contrato.tipo_contrato?.replace(/_/g,' ') || '—'],
    ['Valor',       formatCOP(contrato.valor_actual)],
    ['Inicio',      contrato.fecha_inicio ? new Date(contrato.fecha_inicio).toLocaleDateString('es-CO') : '—'],
    ['Terminación', contrato.fecha_fin    ? new Date(contrato.fecha_fin).toLocaleDateString('es-CO')    : '—'],
    ['SECOP II',    contrato.numero_secop || '—'],
  ];

  return (
    <View style={{ flex:1, backgroundColor:colors.bg }}>
      <View style={{ backgroundColor:colors.navy, paddingTop:insets.top+spacing.sm, paddingBottom:spacing.xl, paddingHorizontal:spacing.xl }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom:spacing.sm }}>
          <Text style={{ color:'rgba(147,197,253,0.7)', fontSize:font.sm }}>← Volver</Text>
        </TouchableOpacity>
        <View style={{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between' }}>
          <View style={{ flex:1 }}>
            <Text style={{ color:colors.white, fontSize:font.xl, fontWeight:'700' }}>{contrato.numero_contrato}</Text>
            <Text style={{ color:'rgba(147,197,253,0.6)', fontSize:font.xs, marginTop:2 }}>
              {contrato.tipo_contrato?.replace(/_/g,' ')}
            </Text>
          </View>
          <StatusBadge status={contrato.semaforo || contrato.estado} size="lg"/>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding:spacing.lg, gap:spacing.lg, paddingBottom:spacing.xxxl }} showsVerticalScrollIndicator={false}>

        {/* Info general */}
        <View style={{ backgroundColor:colors.card, borderRadius:radius.lg, padding:spacing.lg, shadowColor:'#000', shadowOpacity:.05, shadowRadius:4, elevation:2 }}>
          <Text style={{ fontSize:font.md, fontWeight:'600', color:colors.gray900, marginBottom:spacing.lg }}>
            Información del Contrato
          </Text>
          {campos.map(([k,v]) => (
            <View key={k} style={{ flexDirection:'row', paddingVertical:spacing.sm, borderBottomWidth:1, borderBottomColor:colors.gray100 }}>
              <Text style={{ fontSize:font.xs, color:colors.gray500, fontWeight:'600', textTransform:'uppercase', letterSpacing:.4, width:100 }}>{k}</Text>
              <Text style={{ fontSize:font.sm, color:k==='Valor'?colors.blue:colors.gray900, fontWeight:k==='Valor'?'700':'400', flex:1 }}>{v}</Text>
            </View>
          ))}
          <View style={{ paddingVertical:spacing.sm }}>
            <Text style={{ fontSize:font.xs, color:colors.gray500, fontWeight:'600', textTransform:'uppercase', letterSpacing:.4, marginBottom:6 }}>Objeto</Text>
            <Text style={{ fontSize:font.sm, color:colors.gray700, lineHeight:font.sm*1.6 }}>{contrato.objeto}</Text>
          </View>
        </View>

        {/* Documentos */}
        <View style={{ backgroundColor:colors.card, borderRadius:radius.lg, overflow:'hidden', shadowColor:'#000', shadowOpacity:.05, shadowRadius:4, elevation:2 }}>
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:spacing.lg, borderBottomWidth:1, borderBottomColor:colors.border }}>
            <Text style={{ fontSize:font.md, fontWeight:'600', color:colors.gray900 }}>
              Documentos ({contrato.documentos?.length || 0})
            </Text>
          </View>
          {(contrato.documentos || []).map((d, i) => (
            <View key={d.id} style={{ padding:spacing.lg, flexDirection:'row', alignItems:'center', gap:spacing.md, borderBottomWidth: i<contrato.documentos.length-1?1:0, borderBottomColor:colors.gray100 }}>
              <Text style={{ fontSize:20 }}>📄</Text>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:font.sm, fontWeight:'500', color:colors.gray900 }} numberOfLines={1}>{d.nombre}</Text>
                <Text style={{ fontSize:font.xs, color:colors.gray500, marginTop:2 }}>
                  {d.categoria?.replace(/_/g,' ')}
                  {d.fecha_vencimiento ? ` · Vence: ${new Date(d.fecha_vencimiento).toLocaleDateString('es-CO')}` : ''}
                </Text>
              </View>
              <StatusBadge status={d.estado_vence}/>
            </View>
          ))}
          {!contrato.documentos?.length && (
            <View style={{ padding:spacing.xxl, alignItems:'center' }}>
              <Text style={{ color:colors.gray400, fontSize:font.sm }}>Sin documentos cargados.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}