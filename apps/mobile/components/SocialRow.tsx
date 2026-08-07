import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontWeight, radius } from '../lib/theme';

/**
 * Botones sociales (Facebook, Apple, Google). Marcas de letra como
 * placeholder — sustituir por los logotipos oficiales al integrar el SDK.
 */
const PROVIDERS = [
  { key: 'facebook', label: 'f', bg: '#1877F2', fg: '#FFFFFF' },
  { key: 'apple', label: '', bg: '#000000', fg: '#FFFFFF' },
  { key: 'google', label: 'G', bg: '#FFFFFF', fg: '#4285F4' },
] as const;

export function SocialRow({
  onPress,
}: {
  onPress?: (provider: 'facebook' | 'apple' | 'google') => void;
}) {
  return (
    <View style={styles.row}>
      {PROVIDERS.map((p) => (
        <Pressable
          key={p.key}
          accessibilityRole="button"
          accessibilityLabel={`Continuar con ${p.key}`}
          onPress={() => onPress?.(p.key)}
          style={({ pressed }) => [
            styles.circle,
            { backgroundColor: p.bg, opacity: pressed ? 0.85 : 1 },
            p.key === 'google' && styles.bordered,
          ]}
        >
          <Text style={[styles.label, { color: p.fg }]}>{p.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  circle: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bordered: { borderWidth: 1, borderColor: colors.niebla },
  label: { fontSize: 22, fontWeight: fontWeight.bold },
});
