import { View, Text } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../../utils/theme';

export default function KpiCard({ label, value, sub, color='#3b82f6', bg='#eff6ff', barColor }) {
  return (
    <View style={{ backgroundColor:colors.card, borderRadius:radius.lg, padding:spacing.md, flex:1, minWidth:140, ...shadow.sm, overflow:'hidden' }}>
      <View style={{ width:32, height:32, borderRadius:8, backgroundColor:bg, alignItems:'center', justifyContent:'center', marginBottom:8 }}>
        <View style={{ width:16, height:16, borderRadius:4, backgroundColor:color, opacity:.7 }}/>
      </View>
      <Text style={{ fontSize:font.xs, fontWeight:'600', color:colors.gray500, letterSpacing:.5, textTransform:'uppercase', marginBottom:2 }}>
        {label}
      </Text>
      <Text style={{ fontSize:font.xxl, fontWeight:'700', color:colors.gray900, lineHeight:font.xxl*1.2 }}>
        {value ?? '—'}
      </Text>
      {sub && <Text style={{ fontSize:font.xs, color:colors.gray400, marginTop:2 }}>{sub}</Text>}
      {barColor && (
        <View style={{ position:'absolute', bottom:0, left:0, right:0, height:3, backgroundColor:barColor }}/>
      )}
    </View>
  );
}