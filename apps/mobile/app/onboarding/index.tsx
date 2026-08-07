import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBanner } from '../../components/GradientBanner';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StepDots } from '../../components/StepDots';
import { colors, fontWeight, spacing, typography } from '../../lib/theme';

const { width } = Dimensions.get('window');

/** Pasos del onboarding (§ textos en español de Colombia). */
const SLIDES = [
  {
    key: 'destino',
    art: '🧳',
    title: 'Escoge tu destino',
    body: 'Déjate llevar y descubre lugares y experiencias emocionantes…',
  },
  {
    key: 'lugares',
    art: '🗺️',
    title: 'Encuentra lugares bien parchados',
    body: 'Dar acceso a tu ubicación nos facilita enormemente la búsqueda de lugares cercanos. ¡Descubre lo fácil que es encontrar lo que necesitas en un instante!',
  },
  {
    key: 'planea',
    art: '🛴',
    title: 'Planea y personaliza tu aventura',
    body: 'Explora nuevos destinos, guarda tus lugares o actividades favoritas, y planifica tu agenda con total flexibilidad.',
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  const isLast = index === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      router.replace('/(auth)/login');
    } else {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

  const back = () => {
    if (index === 0) router.replace('/');
    else listRef.current?.scrollToIndex({ index: index - 1, animated: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <GradientBanner style={styles.banner}>
              <SafeAreaView edges={['top']} style={styles.bannerInner}>
                <Text style={styles.art}>{item.art}</Text>
              </SafeAreaView>
            </GradientBanner>
            <View style={styles.copy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      {/* Flecha atrás sobre el degradado */}
      <SafeAreaView edges={['top']} style={styles.backWrap} pointerEvents="box-none">
        <Pressable
          onPress={back}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Atrás"
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <StepDots count={SLIDES.length} index={index} />
        <PrimaryButton label={isLast ? 'Empezar' : 'Siguiente'} onPress={next} style={styles.cta} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  banner: { height: 340 },
  bannerInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  art: { fontSize: 120 },
  copy: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, gap: spacing.md },
  title: {
    fontSize: typography.display,
    fontWeight: fontWeight.heavy,
    color: colors.noche,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  backWrap: { position: 'absolute', top: 0, left: 0, padding: spacing.lg },
  backIcon: { color: colors.white, fontSize: 40, lineHeight: 40, fontWeight: fontWeight.bold },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
    alignItems: 'center',
  },
  cta: { alignSelf: 'stretch' },
});
