import { useCategories, useServices } from '@dejatellevar/client';
import type { Service, ServiceSearch } from '@dejatellevar/contracts';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { ServiceCard } from '../../components/ServiceCard';
import { SwipeDeck } from '../../components/SwipeDeck';
import { DESTINOS } from '../../lib/destinos';
import { colors, fontWeight, radius, spacing, typography } from '../../lib/theme';

type Vista = 'lista' | 'mapa' | 'swipe';

/** Fila de píldoras seleccionables (una activa). `null` = "Todas". */
function Chips<T extends string>({
  items,
  value,
  onChange,
  allLabel,
}: {
  items: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
  allLabel: string;
}) {
  const options: { value: T | null; label: string }[] = [
    { value: null, label: allLabel },
    ...items,
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value ?? '__all__'}
            onPress={() => onChange(o.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * M01 — Descubrimiento (camino de usuario). Escoge un destino, filtra por
 * actividad y explora la oferta en tres modos: lista, mapa y swipe. Consume el
 * cliente tipado compartido con la web (caché offline).
 */
export default function ExplorarScreen() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [destino, setDestino] = useState<string | null>(null); // slug de DESTINOS
  const [actividad, setActividad] = useState<string | null>(null); // slug de categoría
  const [vista, setVista] = useState<Vista>('lista');
  const [guardados, setGuardados] = useState<Set<string>>(new Set());

  const categoriesQ = useCategories();
  const ciudad = DESTINOS.find((d) => d.slug === destino)?.city;

  const params = useMemo<Partial<ServiceSearch>>(
    () => ({
      sort: 'fidelity',
      ...(submitted ? { q: submitted } : {}),
      ...(ciudad ? { city: ciudad } : {}),
      ...(actividad ? { category: actividad } : {}),
    }),
    [submitted, ciudad, actividad],
  );
  const servicesQ = useServices(params);
  const services = servicesQ.data?.data ?? [];

  // Firma de filtros: remonta la baraja swipe al cambiar cualquier filtro.
  const swipeKey = `${submitted}|${ciudad ?? ''}|${actividad ?? ''}`;

  const actividadItems = (categoriesQ.data?.data ?? [])
    .filter((c) => c.parent_id === null)
    .map((c) => ({ value: c.slug, label: c.name }));

  const onLike = (s: Service) => setGuardados((prev) => new Set(prev).add(s.id));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Cabecera con filtros */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Descubre</Text>
          <Text style={styles.saved}>♥ {guardados.size}</Text>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => setSubmitted(query.trim())}
          placeholder="Mamona, rafting, masaje..."
          placeholderTextColor={colors.humo}
          style={styles.input}
          returnKeyType="search"
        />

        <Text style={styles.filterLabel}>Destino</Text>
        <Chips
          items={DESTINOS.map((d) => ({ value: d.slug, label: d.label }))}
          value={destino}
          onChange={setDestino}
          allLabel="Todo el Meta"
        />

        <Text style={styles.filterLabel}>Actividad</Text>
        <Chips items={actividadItems} value={actividad} onChange={setActividad} allLabel="Todas" />

        <View style={styles.switcher}>
          <SegmentedTabs<Vista>
            value={vista}
            onChange={setVista}
            options={[
              { value: 'lista', label: 'Lista' },
              { value: 'mapa', label: 'Mapa' },
              { value: 'swipe', label: 'Swipe' },
            ]}
          />
        </View>
      </View>

      {/* Cuerpo según la vista */}
      <Body
        vista={vista}
        query={servicesQ}
        services={services}
        swipeKey={swipeKey}
        onLike={onLike}
      />
    </SafeAreaView>
  );
}

function Body({
  vista,
  query,
  services,
  swipeKey,
  onLike,
}: {
  vista: Vista;
  query: ReturnType<typeof useServices>;
  services: Service[];
  swipeKey: string;
  onLike: (s: Service) => void;
}) {
  const router = useRouter();
  if (query.isLoading) {
    return <ActivityIndicator color={colors.violeta} style={{ marginTop: spacing.xxl }} />;
  }
  if (query.isError) {
    return (
      <Text style={styles.error}>
        No pudimos cargar el catálogo. Revisa que la API esté corriendo.
      </Text>
    );
  }
  if (services.length === 0) {
    return (
      <Text style={styles.empty}>
        No hay servicios con estos filtros. Prueba con otro destino o actividad.
      </Text>
    );
  }

  if (vista === 'swipe') {
    return <SwipeDeck key={swipeKey} services={services} onLike={onLike} onNope={() => {}} />;
  }

  if (vista === 'mapa') {
    const conCoords = services.filter((s) => s.latitude !== null && s.longitude !== null);
    return (
      <View style={styles.mapStub}>
        <Text style={styles.mapStubTitle}>Vista de mapa</Text>
        <Text style={styles.mapStubText}>
          El mapa interactivo requiere react-native-maps y un dev build de EAS (no corre en Expo
          Go). {conCoords.length} de {services.length} servicios ya traen coordenadas listas para
          ubicarse.
        </Text>
      </View>
    );
  }

  // Lista
  return (
    <FlatList
      data={services}
      keyExtractor={(s) => s.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <ServiceCard service={item} onPress={() => router.push(`/servicio/${item.id}`)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.noche,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    gap: spacing.sm,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.white, fontSize: typography.h1, fontWeight: fontWeight.bold },
  saved: { color: colors.lila, fontSize: typography.body, fontWeight: fontWeight.semibold },
  input: {
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.paja,
    paddingHorizontal: spacing.md,
    color: colors.carbon,
    fontSize: typography.body,
  },
  filterLabel: {
    color: colors.lila,
    fontSize: typography.tiny,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  chipsRow: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chipActive: { backgroundColor: colors.violeta },
  chipText: { color: colors.niebla, fontSize: typography.small, fontWeight: fontWeight.medium },
  chipTextActive: { color: colors.white, fontWeight: fontWeight.semibold },
  switcher: { marginTop: spacing.md },
  list: { padding: spacing.lg, gap: spacing.md },
  error: { margin: spacing.xl, color: colors.tinto },
  empty: { margin: spacing.xl, color: colors.textMuted },
  mapStub: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  mapStubTitle: { fontSize: typography.h2, fontWeight: fontWeight.semibold, color: colors.text },
  mapStubText: { fontSize: typography.small, color: colors.textMuted, lineHeight: 20 },
});
