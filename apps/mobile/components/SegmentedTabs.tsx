import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontWeight, radius, typography } from '../lib/theme';

/** Conmutador segmentado Login / Sign up (píldora con pulgar activo). */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.track}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && styles.active]}
          >
            <Text style={[styles.label, { color: active ? colors.white : colors.humo }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.niebla,
    borderRadius: radius.pill,
    padding: 4,
  },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
  },
  active: { backgroundColor: colors.violeta },
  label: { fontSize: typography.small, fontWeight: fontWeight.semibold },
});
