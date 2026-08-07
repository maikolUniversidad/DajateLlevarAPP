import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBanner } from '../../components/GradientBanner';
import { Logo } from '../../components/Logo';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { SocialRow } from '../../components/SocialRow';
import { TextField } from '../../components/TextField';
import { colors, fontWeight, spacing, typography } from '../../lib/theme';

/**
 * Registro — paso 1: cuenta. La Tanda B añade los pasos siguientes
 * (nombre → teléfono → código → info básica → bienvenida).
 */
export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <GradientBanner style={styles.banner}>
        <SafeAreaView edges={['top']} style={styles.bannerInner}>
          <Logo tone="light" />
        </SafeAreaView>
      </GradientBanner>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <SegmentedTabs
            value="signup"
            onChange={(v) => {
              if (v === 'login') router.back();
            }}
            options={[
              { value: 'login', label: 'Login' },
              { value: 'signup', label: 'Sign Up' },
            ]}
          />

          <View style={styles.fields}>
            <TextField
              value={email}
              onChangeText={setEmail}
              placeholder="Usuario o correo"
              autoCapitalize="none"
              keyboardType="email-address"
              icon="👤"
            />
            <TextField
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              secure
            />
            <TextField
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirmar contraseña"
              secure
            />
          </View>

          {/* TODO(Tanda B): enrutar a /(auth)/register-name en vez de a tabs. */}
          <PrimaryButton
            label="Continuar"
            variant="dark"
            onPress={() => router.replace('/(tabs)/explorar')}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Otras maneras de registrarse</Text>
            <View style={styles.line} />
          </View>

          <SocialRow />

          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.loginRow}>
            <Text style={styles.loginText}>
              ¿Ya tienes una cuenta? <Text style={styles.loginLink}>Inicia sesión</Text>
            </Text>
          </Pressable>

          <Text style={styles.terms}>
            Al tocar Crear cuenta o Iniciar sesión, aceptas nuestros Términos. Conoce cómo tratamos
            tus datos en nuestra Política de Privacidad y Política de Cookies.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  banner: { height: 220 },
  bannerInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  fields: { gap: spacing.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.niebla },
  dividerText: { color: colors.textMuted, fontSize: typography.tiny },
  loginRow: { alignSelf: 'center' },
  loginText: { color: colors.textMuted, fontSize: typography.small },
  loginLink: { color: colors.violeta, fontWeight: fontWeight.semibold },
  terms: {
    color: colors.textMuted,
    fontSize: typography.tiny,
    textAlign: 'center',
    lineHeight: 18,
  },
});
