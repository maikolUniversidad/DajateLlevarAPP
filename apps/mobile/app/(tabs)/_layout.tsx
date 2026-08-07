import { Tabs } from 'expo-router';
import { colors } from '../../lib/theme';

/** Tabs de la app móvil (§7.7): Explorar, Reservas, Mensajes, Perfil. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.monte },
        headerTintColor: colors.paja,
        tabBarActiveTintColor: colors.rio,
        tabBarInactiveTintColor: colors.humo,
      }}
    >
      <Tabs.Screen name="explorar" options={{ title: 'Explorar' }} />
      <Tabs.Screen name="reservas" options={{ title: 'Reservas' }} />
      <Tabs.Screen name="mensajes" options={{ title: 'Mensajes' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
