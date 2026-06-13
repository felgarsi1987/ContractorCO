import { View, Text, StyleSheet } from 'react-native';
import { colors, font, radius } from '../../utils/theme';

const CONFIG = {
  vigente:      { bg: colors.successBg, color: colors.success,  label:'Vigente'     },
  proximo:      { bg: colors.warningBg, color: colors.warning,  label:'Por Vencer'  },
  vencido:      { bg: colors.dangerBg,  color: colors.danger,   label:'Vencido'     },
  en_ejecucion: { bg: colors.successBg, color: colors.success,  label:'En Ejecución'},
  liquidado:    { bg: colors.gray100,   color: colors.gray500,  label:'Liquidado'   },
  borrador:     { bg: colors.gray100,   color: colors.gray500,  label:'Borrador'    },
};

export default function StatusBadge({ status, size='sm' }) {
  const c = CONFIG[status] || { bg:colors.gray100, color:colors.gray500, label:status||'—' };
  const pad = size === 'lg' ? { paddingHorizontal:12, paddingVertical:4 } : { paddingHorizontal:8, paddingVertical:2 };
  const fs  = size === 'lg' ? font.sm : font.xs;
  return (
    <View style={[{ backgroundColor:c.bg, borderRadius:radius.full, alignSelf:'flex-start' }, pad]}>
      <Text style={{ color:c.color, fontSize:fs, fontWeight:'600' }}>{c.label}</Text>
    </View>
  );
}