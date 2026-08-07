import { type Service, formatMoney } from '@dejatellevar/contracts';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontWeight, gradients, radius, spacing, typography } from '../lib/theme';

/** Insignia de fidelidad (Expectativa vs Realidad). Solo con muestra suficiente. */
function FidelityBadge({ service }: { service: Service }) {
  const { value, sampleSize } = service.fidelity;
  if (value === null || sampleSize < 5) {
    return <Text style={styles.fidelityMuted}>Sin datos aún</Text>;
  }
  return (
    <Text style={styles.fidelity}>
      Fidelidad {value > 0 ? '+' : ''}
      {value.toFixed(1)}
    </Text>
  );
}

/**
 * Tarjeta de servicio para la vista de lista. La miniatura es un degradado de
 * marca mientras la API no exponga media (service_media); al añadir imagen de
 * portada, se reemplaza el bloque por un <Image>.
 */
export function ServiceCard({
  service,
  onPress,
}: {
  service: Service;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient colors={gradients.brandVivid} style={styles.thumb}>
        <Text style={styles.thumbInitial}>{service.name.charAt(0).toUpperCase()}</Text>
      </LinearGradient>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {service.name}
        </Text>
        {service.short_description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {service.short_description}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.price}>
            {service.base_price ? formatMoney(service.base_price) : 'Por cotización'}
          </Text>
          <FidelityBadge service={service} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.niebla,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  thumb: { width: 88, alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { color: colors.white, fontSize: typography.h1, fontWeight: fontWeight.heavy },
  body: { flex: 1, padding: spacing.md, gap: spacing.xs },
  name: { fontSize: typography.body, fontWeight: fontWeight.semibold, color: colors.text },
  desc: { fontSize: typography.small, color: colors.textMuted },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  price: { fontFamily: 'monospace', color: colors.text },
  fidelity: { color: colors.brote, fontWeight: fontWeight.semibold, fontSize: typography.small },
  fidelityMuted: { color: colors.humo, fontSize: typography.tiny },
});
