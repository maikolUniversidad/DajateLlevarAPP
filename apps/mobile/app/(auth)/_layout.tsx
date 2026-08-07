import { Stack } from 'expo-router';

/** Flujo de identidad: login y asistente de registro. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
