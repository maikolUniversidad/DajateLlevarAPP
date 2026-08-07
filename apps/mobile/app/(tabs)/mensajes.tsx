import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../lib/theme';

export default function MensajesScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Mensajes</Text>
      <Text style={styles.m}>Bandeja unificada con empresas y creadores (M03).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.paja, padding: 24, gap: 8, justifyContent: 'center' },
  t: { fontSize: 22, fontWeight: '700', color: colors.carbon },
  m: { fontSize: 15, color: colors.humo },
});
