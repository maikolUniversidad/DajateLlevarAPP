import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../lib/theme';

export default function PerfilScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Perfil</Text>
      <Text style={styles.m}>Cuenta, verificación y preferencias (M04).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.paja, padding: 24, gap: 8, justifyContent: 'center' },
  t: { fontSize: 22, fontWeight: '700', color: colors.carbon },
  m: { fontSize: 15, color: colors.humo },
});
