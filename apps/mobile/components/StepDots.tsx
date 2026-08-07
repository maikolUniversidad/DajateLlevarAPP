import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../lib/theme';

/** Indicador de paso: el punto activo se alarga (como en los mockups). */
export function StepDots({ count, index }: { count: number; index: number }) {
  return (
    <View style={styles.row} accessibilityRole="progressbar">
      {Array.from({ length: count }).map((_, i) => {
        const active = i === index;
        return (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: lista estática de puntos
            key={i}
            style={[
              styles.dot,
              active && styles.active,
              { backgroundColor: active ? colors.violeta : colors.borderStrong },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  active: { width: 22 },
});
