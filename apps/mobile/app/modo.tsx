import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBanner } from '../components/GradientBanner';
import { Logo } from '../components/Logo';
import { colors, fontWeight, radius, spacing, typography } from '../lib/theme';

/**
 * Home con los dos caminos (§7). El de usuario es el que se está construyendo;
 * el de empresa/proveedor queda trazado como stub hasta su módulo.
 */
export default function ModoScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <GradientBanner style={styles.banner}>
        <SafeAreaView edges={['top']} style={styles.bannerInner}>
          <Logo tone="light" />
          <Text style={styles.tagline}>¿Cómo quieres entrar hoy?</Text>
        </SafeAreaView>
      </GradientBanner>

      <View style={styles.body}>
        <Pressable
          style={({ pressed }) => [styles.card, styles.cardUser, pressed && styles.pressed]}
          onPress={() => router.replace('/(tabs)/explorar')}
        >
          <Text style={styles.cardIcon}>🧭</Text>
          <Text style={styles.cardTitle}>Explorar como usuario</Text>
          <Text style={styles.cardText}>Descubre planes en el Meta, guárdalos y resérvalos.</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, styles.cardBiz, pressed && styles.pressed]}
          onPress={() =>
            Alert.alert(
              'Próximamente',
              'El panel de empresas y creadores llega en su propio módulo.',
            )
          }
        >
          <Text style={styles.cardIcon}>🏪</Text>
          <Text style={[styles.cardTitle, styles.cardTitleBiz]}>Soy empresa o creador</Text>
          <Text style={[styles.cardText, styles.cardTextBiz]}>
            Publica servicios, gestiona reservas y campañas.
          </Text>
          <Text style={styles.soon}>En construcción</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  banner: { height: 240 },
  bannerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  tagline: { color: colors.niebla, fontSize: typography.body, fontWeight: fontWeight.medium },
  body: { flex: 1, padding: spacing.xl, gap: spacing.lg, justifyContent: 'center' },
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    borderWidth: 1,
  },
  cardUser: { backgroundColor: colors.violeta, borderColor: colors.violeta },
  cardBiz: { backgroundColor: colors.surface, borderColor: colors.niebla },
  pressed: { opacity: 0.85 },
  cardIcon: { fontSize: 34 },
  cardTitle: { fontSize: typography.h2, fontWeight: fontWeight.bold, color: colors.white },
  cardTitleBiz: { color: colors.text },
  cardText: { fontSize: typography.small, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  cardTextBiz: { color: colors.textMuted },
  soon: {
    marginTop: spacing.xs,
    fontSize: typography.tiny,
    fontWeight: fontWeight.semibold,
    color: colors.barro,
    textTransform: 'uppercase',
  },
});
