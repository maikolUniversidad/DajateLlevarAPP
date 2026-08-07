import { Stack } from 'expo-router';
import { AppOfflineProvider } from '../lib/offline-provider';

/**
 * Raíz de navegación. La ruta inicial es `index` (Splash), que enruta a
 * onboarding → auth → tabs. Sin cabeceras: cada flujo dibuja la suya.
 */
export default function RootLayout() {
  return (
    <AppOfflineProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F6F5FA' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AppOfflineProvider>
  );
}
