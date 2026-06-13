import { View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing } from '../../utils/theme';

export default function ScreenHeader({ title, subtitle, right, onBack, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{
      backgroundColor: colors.navy,
      paddingTop: insets.top + spacing.sm,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.xl,
    }}>
      {onBack && (
        <TouchableOpacity onPress={onBack || (() => navigation?.goBack())} style={{ marginBottom:8, alignSelf:'flex-start' }}>
          <Text style={{ color:colors.bluePale, fontSize:font.sm }}>← Volver</Text>
        </TouchableOpacity>
      )}
      <View style={{ flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between' }}>
        <View style={{ flex:1 }}>
          <Text style={{ color:colors.white, fontSize:font.xl, fontWeight:'700', lineHeight:font.xl*1.3 }}>{title}</Text>
          {subtitle && <Text style={{ color:'rgba(147,197,253,0.7)', fontSize:font.sm, marginTop:2 }}>{subtitle}</Text>}
        </View>
        {right}
      </View>
    </View>
  );
}