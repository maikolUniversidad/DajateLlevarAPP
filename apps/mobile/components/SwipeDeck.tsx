import { type Service, formatMoney } from '@dejatellevar/contracts';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fontWeight, gradients, radius, spacing, typography } from '../lib/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.25;

/** Contenido de una tarjeta de la baraja. Degradado mientras no haya media. */
function DeckCard({ service }: { service: Service }) {
  return (
    <LinearGradient colors={gradients.brand} style={styles.cardFill}>
      <Text style={styles.cardInitial}>{service.name.charAt(0).toUpperCase()}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.cardName} numberOfLines={2}>
          {service.name}
        </Text>
        {service.city ? <Text style={styles.cardCity}>{service.city}</Text> : null}
        <Text style={styles.cardPrice}>
          {service.base_price ? formatMoney(service.base_price) : 'Por cotización'}
        </Text>
      </View>
    </LinearGradient>
  );
}

/**
 * Baraja de descubrimiento estilo Tinder. Deslizar a la derecha = me gusta
 * (guardar), a la izquierda = no me gusta (ocultar). Usa Animated + PanResponder
 * nativos para no añadir dependencias. El padre debe remontar con `key` cuando
 * cambien los filtros para reiniciar la baraja.
 */
export function SwipeDeck({
  services,
  onLike,
  onNope,
  onEmpty,
}: {
  services: Service[];
  onLike: (s: Service) => void;
  onNope: (s: Service) => void;
  onEmpty?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  // Refs siempre-frescas para que los callbacks del PanResponder (creado una
  // sola vez) no cierren sobre valores obsoletos.
  const stateRef = useRef({ services, index, onLike, onNope, onEmpty });
  stateRef.current = { services, index, onLike, onNope, onEmpty };

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_W / 2, 0, SCREEN_W / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const forceSwipe = useCallback(
    (dir: 'like' | 'nope') => {
      const st = stateRef.current;
      const current = st.services[st.index];
      if (!current) return;
      const toX = dir === 'like' ? SCREEN_W * 1.3 : -SCREEN_W * 1.3;
      Animated.timing(position, {
        toValue: { x: toX, y: 0 },
        duration: 220,
        useNativeDriver: false,
      }).start(() => {
        const s2 = stateRef.current;
        if (dir === 'like') s2.onLike(current);
        else s2.onNope(current);
        position.setValue({ x: 0, y: 0 });
        const next = s2.index + 1;
        setIndex(next);
        if (next >= s2.services.length) s2.onEmpty?.();
      });
    },
    [position],
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_e, g) => position.setValue({ x: g.dx, y: g.dy }),
      onPanResponderRelease: (_e, g) => {
        if (g.dx > SWIPE_THRESHOLD) forceSwipe('like');
        else if (g.dx < -SWIPE_THRESHOLD) forceSwipe('nope');
        else
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            useNativeDriver: false,
          }).start();
      },
    }),
  ).current;

  const top = services[index];
  const behind = services[index + 1];

  if (!top) {
    return (
      <View style={styles.deck}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No quedan más por aquí.</Text>
          <Text style={styles.emptyHint}>Cambia de destino o de actividad para ver más.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.deck}>
      <View style={styles.stack}>
        {behind ? (
          <View style={[styles.cardWrap, styles.cardBehind]} pointerEvents="none">
            <DeckCard service={behind} />
          </View>
        ) : null}

        <Animated.View
          style={[
            styles.cardWrap,
            { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
          ]}
          {...panResponder.panHandlers}
        >
          <DeckCard service={top} />
          <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
            <Text style={[styles.stampText, { color: colors.brote }]}>ME GUSTA</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
            <Text style={[styles.stampText, { color: colors.tinto }]}>PASO</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityLabel="No me gusta"
          onPress={() => forceSwipe('nope')}
          style={[styles.actionBtn, styles.nopeBtn]}
        >
          <Text style={[styles.actionIcon, { color: colors.tinto }]}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Me gusta, guardar"
          onPress={() => forceSwipe('like')}
          style={[styles.actionBtn, styles.likeBtn]}
        >
          <Text style={[styles.actionIcon, { color: colors.brote }]}>♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  deck: { flex: 1, padding: spacing.lg },
  stack: { flex: 1 },
  cardWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cardBehind: { transform: [{ scale: 0.94 }], opacity: 0.7 },
  cardFill: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  cardInitial: { color: colors.white, fontSize: 64, fontWeight: fontWeight.heavy, opacity: 0.5 },
  cardMeta: { gap: spacing.xs },
  cardName: { color: colors.white, fontSize: typography.h1, fontWeight: fontWeight.bold },
  cardCity: { color: colors.lila, fontSize: typography.body, fontWeight: fontWeight.semibold },
  cardPrice: { color: colors.white, fontSize: typography.body, marginTop: spacing.xs },
  stamp: {
    position: 'absolute',
    top: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  stampLike: { left: spacing.xl, borderColor: colors.brote, transform: [{ rotate: '-12deg' }] },
  stampNope: { right: spacing.xl, borderColor: colors.tinto, transform: [{ rotate: '12deg' }] },
  stampText: { fontSize: typography.h2, fontWeight: fontWeight.heavy },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.lg,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.niebla,
    elevation: 3,
  },
  nopeBtn: {},
  likeBtn: {},
  actionIcon: { fontSize: typography.h1, fontWeight: fontWeight.bold },
  emptyCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.niebla,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyText: { fontSize: typography.h2, fontWeight: fontWeight.semibold, color: colors.text },
  emptyHint: { fontSize: typography.small, color: colors.textMuted, textAlign: 'center' },
});
