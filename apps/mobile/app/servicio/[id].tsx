import {
  ApiRequestError,
  useCreateProductReview,
  useCreateVenueReview,
  useProductReviews,
  useServiceDetail,
  useServiceReviews,
} from '@dejatellevar/client';
import {
  type AxisDef,
  type AxisRating,
  type Product,
  type ProductReview,
  type Review,
  formatMoney,
} from '@dejatellevar/contracts';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { StarInput } from '../../components/StarInput';
import { colors, fontWeight, gradients, radius, spacing, typography } from '../../lib/theme';

/** Traduce un error de la API a un mensaje corto para el usuario. */
function reviewErrorText(err: unknown): string {
  if (err instanceof ApiRequestError) {
    if (err.code === 'ALREADY_REVIEWED') return 'Ya publicaste una opinión aquí.';
    if (err.code === 'NO_ELIGIBLE_BOOKING')
      return 'Necesitas una reserva completada de este lugar para opinar.';
    if (err.code === 'UNAUTHENTICATED') return 'Inicia sesión para opinar.';
    return err.message;
  }
  return 'No pudimos publicar tu opinión. Intenta de nuevo.';
}

/** Formulario de reseña: una estrella por eje + comentario. */
function ReviewForm({
  axes,
  submitting,
  error,
  onSubmit,
  onCancel,
}: {
  axes: { axis_key: string; label: string }[];
  submitting: boolean;
  error: string | null;
  onSubmit: (data: { comment: string; axes: { axis_key: string; value: number }[] }) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const complete = axes.every((a) => (values[a.axis_key] ?? 0) > 0);

  return (
    <View style={styles.form}>
      {axes.map((a) => (
        <View key={a.axis_key} style={styles.formAxis}>
          <Text style={styles.formAxisLabel}>{a.label}</Text>
          <StarInput
            value={values[a.axis_key] ?? 0}
            onChange={(v) => setValues((s) => ({ ...s, [a.axis_key]: v }))}
            size={26}
          />
        </View>
      ))}
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Escribe un comentario…"
        placeholderTextColor={colors.humo}
        style={styles.formInput}
        multiline
      />
      {error ? <Text style={styles.formError}>{error}</Text> : null}
      <View style={styles.formActions}>
        <Pressable onPress={onCancel} hitSlop={6}>
          <Text style={styles.formCancel}>Cancelar</Text>
        </Pressable>
        <Pressable
          disabled={!complete || submitting}
          onPress={() =>
            onSubmit({
              comment,
              axes: axes.map((a) => ({ axis_key: a.axis_key, value: values[a.axis_key]! })),
            })
          }
          style={[styles.formSubmit, (!complete || submitting) && styles.formSubmitOff]}
        >
          <Text style={styles.formSubmitText}>{submitting ? 'Publicando…' : 'Publicar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Estrellas 1..5 a partir de un valor (redondeo al 0.5 más cercano). */
function Stars({ value, size = 16 }: { value: number | null; size?: number }) {
  const v = value ?? 0;
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text
          key={i}
          style={{ fontSize: size, color: i <= Math.round(v) ? colors.barro : colors.niebla }}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

/** Barra horizontal 0..1. */
function Bar({ ratio, tint = colors.violeta }: { ratio: number; tint?: string }) {
  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          { width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, backgroundColor: tint },
        ]}
      />
    </View>
  );
}

function AxisRow({ axis }: { axis: AxisRating }) {
  const ratio = axis.average === null ? 0 : axis.average / 5;
  return (
    <View style={styles.axisRow}>
      <Text style={styles.axisLabel}>{axis.label}</Text>
      <Bar ratio={ratio} />
      <Text style={styles.axisValue}>{axis.average === null ? '—' : axis.average.toFixed(1)}</Text>
    </View>
  );
}

/** Chips de ejes de una reseña (Sabor 4.5, Cantidad 4.0, …). */
function AxisChips({ axes }: { axes: { axis_key: string; label: string; value: number }[] }) {
  if (axes.length === 0) return null;
  return (
    <View style={styles.chipWrap}>
      {axes.map((a) => (
        <View key={a.axis_key} style={styles.axisChip}>
          <Text style={styles.axisChipText}>
            {a.label} {a.value.toFixed(1)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: Review | ProductReview }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{review.author_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewAuthor}>{review.author_name}</Text>
          <Stars value={review.rating} size={13} />
        </View>
      </View>
      {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
      <AxisChips axes={review.axes} />
    </View>
  );
}

/** Fila de producto (plato/combo) con sus reseñas y su formulario de opinión. */
function ProductRow({
  product,
  serviceId,
  productAxes,
}: {
  product: Product;
  serviceId: string;
  productAxes: AxisDef[];
}) {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const reviewsQ = useProductReviews(open ? product.id : '');
  const reviews = reviewsQ.data?.data ?? [];
  const mutation = useCreateProductReview(serviceId, product.id);

  return (
    <View style={styles.productCard}>
      <Pressable style={styles.productHead} onPress={() => setOpen((o) => !o)}>
        <View style={{ flex: 1 }}>
          <View style={styles.productTitleRow}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.is_combo ? <Text style={styles.comboTag}>Combo</Text> : null}
          </View>
          {product.description ? (
            <Text style={styles.productDesc} numberOfLines={2}>
              {product.description}
            </Text>
          ) : null}
          <View style={styles.productMeta}>
            <Stars value={product.avg_rating} size={13} />
            <Text style={styles.productCount}>({product.review_count})</Text>
          </View>
        </View>
        <View style={styles.productRight}>
          <Text style={styles.productPrice}>
            {product.price ? formatMoney(product.price) : '—'}
          </Text>
          <Text style={styles.expandHint}>{open ? 'Ocultar' : 'Ver opiniones'}</Text>
        </View>
      </Pressable>

      {open ? (
        <View style={styles.productReviews}>
          {reviewsQ.isLoading ? (
            <ActivityIndicator color={colors.violeta} style={{ marginVertical: spacing.md }} />
          ) : reviews.length === 0 ? (
            <Text style={styles.emptySmall}>Aún no hay opiniones de este plato.</Text>
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          )}

          {formOpen ? (
            <ReviewForm
              axes={productAxes}
              submitting={mutation.isPending}
              error={mutation.isError ? reviewErrorText(mutation.error) : null}
              onCancel={() => setFormOpen(false)}
              onSubmit={(data) => mutation.mutate(data, { onSuccess: () => setFormOpen(false) })}
            />
          ) : (
            <Pressable style={styles.writeBtn} onPress={() => setFormOpen(true)}>
              <Text style={styles.writeBtnText}>Escribe tu opinión</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

export default function ServicioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<'general' | 'opiniones'>('general');
  const [venueFormOpen, setVenueFormOpen] = useState(false);

  const detailQ = useServiceDetail(id ?? '');
  const reviewsQ = useServiceReviews(id ?? '');
  const venueMutation = useCreateVenueReview(id ?? '');
  const d = detailQ.data;

  if (detailQ.isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.violeta} />
      </SafeAreaView>
    );
  }
  if (detailQ.isError || !d) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.error}>No pudimos cargar este lugar.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const summary = d.rating_summary;
  const dist = summary.distribution;
  // Denominador de las barras = reseñas realmente distribuidas (no review_count,
  // que puede venir agregado/histórico y dejar las barras casi vacías).
  const total = Math.max(dist.excelente + dist.bueno + dist.promedio + dist.malo, 1);

  return (
    <View style={styles.container}>
      {/* Portada */}
      <LinearGradient colors={gradients.brand} style={styles.cover}>
        <SafeAreaView edges={['top']} style={styles.coverInner}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.coverName} numberOfLines={2}>
            {d.name}
          </Text>
          <Text style={styles.coverAddr}>{[d.city, d.department].filter(Boolean).join(', ')}</Text>
        </SafeAreaView>
      </LinearGradient>

      {/* Facts */}
      <View style={styles.facts}>
        <Fact
          label="Por persona"
          value={
            d.avg_price_per_person
              ? formatMoney(d.avg_price_per_person)
              : d.base_price
                ? formatMoney(d.base_price)
                : '—'
          }
        />
        <Fact label="Demora" value={d.duration_minutes ? `${d.duration_minutes} min` : '—'} />
        <Fact label="Reserva" value={d.requires_reservation ? 'Sí' : 'No'} />
      </View>

      <View style={styles.tabs}>
        <SegmentedTabs<'general' | 'opiniones'>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'general', label: 'General' },
            { value: 'opiniones', label: 'Opiniones' },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {tab === 'general' ? (
          <>
            {/* Resumen de calificación */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryLeft}>
                <Text style={styles.summaryScore}>
                  {summary.average !== null ? summary.average.toFixed(1) : '—'}
                </Text>
                <Stars value={summary.average} size={16} />
                <Text style={styles.summaryCount}>{summary.count} opiniones</Text>
                {d.fidelity.value !== null && d.fidelity.sampleSize >= 5 ? (
                  <Text style={styles.fidelity}>
                    Fidelidad {d.fidelity.value > 0 ? '+' : ''}
                    {d.fidelity.value.toFixed(1)}
                  </Text>
                ) : null}
              </View>
              <View style={styles.summaryRight}>
                <DistRow label="Excelente" ratio={dist.excelente / total} />
                <DistRow label="Bueno" ratio={dist.bueno / total} />
                <DistRow label="Promedio" ratio={dist.promedio / total} />
                <DistRow label="Malo" ratio={dist.malo / total} />
              </View>
            </View>

            {/* Ejes del local */}
            {d.axes.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Calificación del lugar</Text>
                {d.axes.map((a) => (
                  <AxisRow key={a.axis_key} axis={a} />
                ))}
              </View>
            ) : null}

            {/* Platos / combos */}
            {d.products.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Platos y combos</Text>
                {d.products.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    serviceId={d.id}
                    productAxes={d.product_axes}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.emptySmall}>Este lugar aún no publica platos.</Text>
            )}
          </>
        ) : (
          <View style={styles.section}>
            <View style={styles.opinionsHead}>
              <Text style={styles.sectionTitle}>Opiniones del lugar</Text>
              {!venueFormOpen ? (
                <Pressable onPress={() => setVenueFormOpen(true)} hitSlop={6}>
                  <Text style={styles.writeLink}>Comentar</Text>
                </Pressable>
              ) : null}
            </View>

            {venueFormOpen ? (
              <ReviewForm
                axes={d.axes}
                submitting={venueMutation.isPending}
                error={venueMutation.isError ? reviewErrorText(venueMutation.error) : null}
                onCancel={() => setVenueFormOpen(false)}
                onSubmit={(data) =>
                  venueMutation.mutate(data, { onSuccess: () => setVenueFormOpen(false) })
                }
              />
            ) : null}

            {reviewsQ.isLoading ? (
              <ActivityIndicator color={colors.violeta} style={{ marginTop: spacing.lg }} />
            ) : (reviewsQ.data?.data.length ?? 0) === 0 ? (
              <Text style={styles.emptySmall}>
                Todavía no hay opiniones del lugar. Sé el primero.
              </Text>
            ) : (
              reviewsQ.data!.data.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

function DistRow({ label, ratio }: { label: string; ratio: number }) {
  return (
    <View style={styles.distRow}>
      <Text style={styles.distLabel}>{label}</Text>
      <Bar ratio={ratio} tint={colors.lila} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  error: { color: colors.tinto },
  backLink: { color: colors.violeta, fontWeight: fontWeight.semibold },
  cover: { height: 200 },
  coverInner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
  backBtn: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.white, fontSize: 28, lineHeight: 30, marginTop: -2 },
  coverName: { color: colors.white, fontSize: typography.display, fontWeight: fontWeight.bold },
  coverAddr: { color: colors.niebla, fontSize: typography.small, marginTop: spacing.xs },
  facts: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  fact: { flex: 1, alignItems: 'center', gap: 2 },
  factValue: { fontSize: typography.body, fontWeight: fontWeight.bold, color: colors.text },
  factLabel: { fontSize: typography.tiny, color: colors.textMuted },
  tabs: { marginTop: spacing.lg },
  body: { padding: spacing.lg, gap: spacing.lg },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.niebla,
  },
  summaryLeft: { alignItems: 'center', gap: spacing.xs, justifyContent: 'center' },
  summaryScore: { fontSize: 44, fontWeight: fontWeight.heavy, color: colors.text },
  summaryCount: { fontSize: typography.tiny, color: colors.textMuted },
  fidelity: { color: colors.brote, fontWeight: fontWeight.semibold, fontSize: typography.small },
  summaryRight: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  distLabel: { width: 68, fontSize: typography.tiny, color: colors.textMuted },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.niebla,
  },
  sectionTitle: { fontSize: typography.h2, fontWeight: fontWeight.semibold, color: colors.text },
  axisRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  axisLabel: { width: 96, fontSize: typography.small, color: colors.text },
  axisValue: { width: 30, textAlign: 'right', fontSize: typography.small, color: colors.textMuted },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.niebla,
    overflow: 'hidden',
  },
  barFill: { height: 8, borderRadius: 4 },
  productCard: { borderTopWidth: 1, borderTopColor: colors.niebla, paddingTop: spacing.md },
  productHead: { flexDirection: 'row', gap: spacing.md },
  productTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  productName: { fontSize: typography.body, fontWeight: fontWeight.semibold, color: colors.text },
  comboTag: {
    fontSize: typography.tiny,
    color: colors.violeta,
    fontWeight: fontWeight.semibold,
    backgroundColor: colors.niebla,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  productDesc: { fontSize: typography.small, color: colors.textMuted, marginTop: 2 },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  productCount: { fontSize: typography.tiny, color: colors.textMuted },
  productRight: { alignItems: 'flex-end', gap: spacing.xs },
  productPrice: { fontFamily: 'monospace', color: colors.text, fontWeight: fontWeight.semibold },
  expandHint: { fontSize: typography.tiny, color: colors.violeta, fontWeight: fontWeight.semibold },
  productReviews: { marginTop: spacing.md, gap: spacing.md },
  reviewCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.lila,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: fontWeight.bold },
  reviewAuthor: { fontSize: typography.small, fontWeight: fontWeight.semibold, color: colors.text },
  reviewComment: { fontSize: typography.small, color: colors.text, lineHeight: 20 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  axisChip: {
    backgroundColor: colors.niebla,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  axisChipText: { fontSize: typography.tiny, color: colors.carbon, fontWeight: fontWeight.medium },
  emptySmall: { color: colors.textMuted, fontSize: typography.small, padding: spacing.md },
  opinionsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  writeLink: { color: colors.violeta, fontSize: typography.small, fontWeight: fontWeight.semibold },
  writeBtn: {
    borderWidth: 1,
    borderColor: colors.violeta,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  writeBtnText: {
    color: colors.violeta,
    fontWeight: fontWeight.semibold,
    fontSize: typography.small,
  },
  form: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.niebla,
  },
  formAxis: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formAxisLabel: { fontSize: typography.small, color: colors.text },
  formInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 60,
    color: colors.carbon,
    fontSize: typography.small,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  formError: { color: colors.tinto, fontSize: typography.small },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.lg,
  },
  formCancel: { color: colors.humo, fontSize: typography.small, fontWeight: fontWeight.medium },
  formSubmit: {
    backgroundColor: colors.violeta,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  formSubmitOff: { opacity: 0.5 },
  formSubmitText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    fontSize: typography.small,
  },
});
