import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { gradients, radius } from '../lib/theme';

/**
 * Cabecera de marca con degradado índigo→violeta y borde inferior curvo,
 * el gesto visual recurrente de los mockups.
 */
export function GradientBanner({
  children,
  variant = 'brand',
  style,
}: {
  children?: ReactNode;
  variant?: keyof typeof gradients;
  style?: object;
}) {
  return (
    <LinearGradient
      colors={gradients[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.banner, style]}
    >
      <View style={styles.inner}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderBottomLeftRadius: radius.banner,
    borderBottomRightRadius: radius.banner,
    overflow: 'hidden',
  },
  inner: { flex: 1 },
});
