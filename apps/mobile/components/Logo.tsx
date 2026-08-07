import { StyleSheet, Text, View } from 'react-native';
import { colors, fontWeight } from '../lib/theme';

/**
 * Marca "Déjate Llevar": pin de ubicación estilizado + logotipo.
 * `tone='light'` para fondos con degradado; `tone='dark'` sobre blanco.
 * (Placeholder vectorial: sustituir por el asset oficial cuando esté.)
 */
export function Logo({
  tone = 'light',
  size = 1,
}: {
  tone?: 'light' | 'dark';
  size?: number;
}) {
  const light = tone === 'light';
  const wordColor = light ? colors.white : colors.violeta;
  const pinColor = light ? colors.white : colors.violeta;
  const pinInner = light ? colors.violeta : colors.white;

  return (
    <View style={styles.row}>
      <View
        style={[styles.pin, { width: 34 * size, height: 34 * size, backgroundColor: pinColor }]}
      >
        <View
          style={[
            styles.pinInner,
            { width: 12 * size, height: 12 * size, backgroundColor: pinInner },
          ]}
        />
      </View>
      <Text style={[styles.word, { color: wordColor, fontSize: 26 * size }]}>
        Déjate{'\n'}Llevar
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pin: {
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 2,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInner: {
    borderRadius: 999,
    transform: [{ rotate: '-45deg' }],
  },
  word: {
    fontWeight: fontWeight.heavy,
    lineHeight: 27,
    letterSpacing: -0.5,
  },
});
