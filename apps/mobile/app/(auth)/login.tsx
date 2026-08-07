import { useApi } from '@dejatellevar/client';
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
import { setDevSession } from '../../lib/dev-session';
import { colors, fontWeight, spacing, typography } from '../../lib/theme';

/** P — Iniciar sesión. La autenticación real llega con el módulo de identidad. */
export default function LoginScreen() {
  const router = useRouter();
  const api = useApi();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');

  // Dev: obtiene una sesión demo del shim para poder escribir reseñas. Si el
  // shim está apagado, entra igual (solo lectura).
  const enter = async () => {
    try {
      const s = await api.devSession();
      setDevSession(s.token, s.account.full_name);
    } catch {
      setDevSession(null, null);
    }
    router.replace('/modo');
  };

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
            value="login"
            onChange={(v) => {
              if (v === 'signup') router.push('/(auth)/register');
            }}
            options={[
              { value: 'login', label: 'Log In' },
              { value: 'signup', label: 'Sign up' },
            ]}
          />

          <View style={styles.fields}>
            <TextField
              value={user}
              onChangeText={setUser}
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
          </View>

          <PrimaryButton label="Iniciar sesión" onPress={enter} />

          <Pressable onPress={() => {}} hitSlop={8} style={styles.forgot}>
            <Text style={styles.forgotText}>¿Problemas para entrar?</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Otras maneras de iniciar sesión</Text>
            <View style={styles.line} />
          </View>

          <SocialRow />

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
  forgot: { alignSelf: 'center' },
  forgotText: {
    color: colors.violeta,
    fontSize: typography.small,
    fontWeight: fontWeight.medium,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.niebla },
  dividerText: { color: colors.textMuted, fontSize: typography.tiny },
  terms: {
    color: colors.textMuted,
    fontSize: typography.tiny,
    textAlign: 'center',
    lineHeight: 18,
  },
});
