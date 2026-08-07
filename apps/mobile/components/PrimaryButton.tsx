import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, fontWeight, radius, typography } from '../lib/theme';

/** Botón de acción tipo píldora (§1.2: una acción primaria por pantalla). */
export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'dark' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  const bg =
    variant === 'primary' ? colors.violeta : variant === 'dark' ? colors.noche : 'transparent';
  const fg = variant === 'outline' ? colors.violeta : colors.white;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1 },
        variant === 'outline' && styles.outline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  outline: { borderWidth: 1.5, borderColor: colors.violeta },
  label: {
    fontSize: typography.body,
    fontWeight: fontWeight.bold,
  },
});
