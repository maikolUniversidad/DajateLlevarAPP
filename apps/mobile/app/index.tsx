import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Logo } from '../components/Logo';
import { gradients } from '../lib/theme';

/** Portada (Splash). Muestra la marca y avanza al onboarding. */
export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/onboarding'), 1800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <Pressable style={styles.fill} onPress={() => router.replace('/onboarding')}>
      <StatusBar style="light" />
      <LinearGradient
        colors={gradients.splash}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.fill}
      >
        <Logo tone="light" size={1.4} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
