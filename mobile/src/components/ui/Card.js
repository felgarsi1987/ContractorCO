import { View, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../../utils/theme';

export default function Card({ children, style, padding=true }) {
  return (
    <View style={[
      {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        ...shadow.sm,
        ...(padding ? { padding: spacing.lg } : {}),
      },
      style,
    ]}>
      {children}
    </View>
  );
}