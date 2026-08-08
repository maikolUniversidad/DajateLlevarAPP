'use client';

import { Stars } from '@/components/Stars';
import { useProductReviews, useServiceDetail, useServiceReviews } from '@dejatellevar/client';
import type { AxisRating, Product, ProductReview, Review } from '@dejatellevar/contracts';
import { MoneyDisplay } from '@dejatellevar/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

function Bar({ ratio, tint = 'bg-violeta' }: { ratio: number; tint?: string }) {
  return (
    <span className="block h-2 flex-1 overflow-hidden rounded-full bg-niebla">
      <span
        className={`block h-2 rounded-full ${tint}`}
        style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
      />
    </span>
  );
}

function AxisRow({ axis }: { axis: AxisRating }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 font-body text-sm text-text">{axis.label}</span>
      <Bar ratio={axis.average === null ? 0 : axis.average / 5} />
      <span className="w-8 text-right font-body text-sm text-text-muted">
        {axis.average === null ? '—' : axis.average.toFixed(1)}
      </span>
    </div>
  );
}

function ReviewItem({ review }: { review: Review | ProductReview }) {
  return (
    <div className="rounded-md bg-bg p-3">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-lila font-body text-sm font-medium text-white">
          {review.author_name.charAt(0).toUpperCase()}
        </span>
        <span className="font-body text-sm font-medium text-text">{review.author_name}</span>
        <Stars value={review.rating} className="text-sm" />
      </div>
      {review.comment ? <p className="mt-2 font-body text-sm text-text">{review.comment}</p> : null}
      {review.axes.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {review.axes.map((a) => (
            <span
              key={a.axis_key}
              className="rounded-full bg-niebla px-2 py-0.5 font-body text-xs text-carbon"
            >
              {a.label} {a.value.toFixed(1)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const reviewsQ = useProductReviews(open ? product.id : '');
  const reviews = reviewsQ.data?.data ?? [];
  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <span className="flex-1">
          <span className="flex items-center gap-2">
            <span className="font-body font-medium text-text">{product.name}</span>
            {product.is_combo ? (
              <span className="rounded bg-niebla px-1.5 py-0.5 font-body text-xs text-violeta">
                Combo
              </span>
            ) : null}
          </span>
          {product.description ? (
            <span className="mt-0.5 block font-body text-sm text-text-muted">
              {product.description}
            </span>
          ) : null}
          <span className="mt-1 flex items-center gap-1">
            <Stars value={product.avg_rating} className="text-sm" />
            <span className="font-body text-xs text-text-muted">({product.review_count})</span>
          </span>
        </span>
        <span className="text-right">
          <span className="block font-mono font-medium text-text">
            {product.price ? <MoneyDisplay value={product.price} /> : '—'}
          </span>
          <span className="font-body text-xs font-medium text-violeta">
            {open ? 'Ocultar' : 'Ver opiniones'}
          </span>
        </span>
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          {reviewsQ.isLoading ? (
            <p className="font-body text-sm text-text-muted">Cargando…</p>
          ) : reviews.length === 0 ? (
            <p className="font-body text-sm text-text-muted">Aún no hay opiniones de este plato.</p>
          ) : (
            reviews.map((r) => <ReviewItem key={r.id} review={r} />)
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function ServicioDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = useState<'general' | 'opiniones'>('general');
  const detailQ = useServiceDetail(id ?? '');
  const reviewsQ = useServiceReviews(id ?? '');
  const d = detailQ.data;

  if (detailQ.isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10 font-body text-text-muted">Cargando…</main>
    );
  }
  if (detailQ.isError || !d) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="font-body text-tinto">No pudimos cargar este lugar.</p>
        <Link href="/descubrir" className="font-body text-violeta hover:underline">
          ← Volver
        </Link>
      </main>
    );
  }

  const sum = d.rating_summary;
  const dist = sum.distribution;
  const total = Math.max(dist.excelente + dist.bueno + dist.promedio + dist.malo, 1);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 md:px-12">
      <Link href="/descubrir" className="font-body text-sm text-violeta hover:underline">
        ← Descubrir
      </Link>

      <div className="mt-4 rounded-lg bg-noche p-6 text-paja">
        <h1 className="font-display text-3xl">{d.name}</h1>
        <p className="mt-1 font-body text-sm text-lila">
          {[d.city, d.department].filter(Boolean).join(', ')}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-surface py-3 text-center">
        <div>
          <p className="font-body font-medium text-text">
            {d.avg_price_per_person ? (
              <MoneyDisplay value={d.avg_price_per_person} />
            ) : d.base_price ? (
              <MoneyDisplay value={d.base_price} />
            ) : (
              '—'
            )}
          </p>
          <p className="font-body text-xs text-text-muted">Por persona</p>
        </div>
        <div>
          <p className="font-body font-medium text-text">
            {d.duration_minutes ? `${d.duration_minutes} min` : '—'}
          </p>
          <p className="font-body text-xs text-text-muted">Demora</p>
        </div>
        <div>
          <p className="font-body font-medium text-text">{d.requires_reservation ? 'Sí' : 'No'}</p>
          <p className="font-body text-xs text-text-muted">Reserva</p>
        </div>
      </div>

      <div className="my-6 inline-flex rounded-full bg-niebla p-1">
        {(['general', 'opiniones'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-1.5 font-body text-sm capitalize transition-colors ${
              tab === t ? 'bg-violeta text-white' : 'text-text-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'general' ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-6 rounded-md border border-border bg-surface p-5 sm:flex-row">
            <div className="text-center">
              <p className="font-display text-5xl text-text">
                {sum.average !== null ? sum.average.toFixed(1) : '—'}
              </p>
              <Stars value={sum.average} />
              <p className="font-body text-xs text-text-muted">{sum.count} opiniones</p>
              {d.fidelity.value !== null && d.fidelity.sampleSize >= 5 ? (
                <p className="mt-1 font-body text-sm font-medium text-brote">
                  Fidelidad {d.fidelity.value > 0 ? '+' : ''}
                  {d.fidelity.value.toFixed(1)}
                </p>
              ) : null}
            </div>
            <div className="flex-1 space-y-1.5 self-center">
              {(
                [
                  ['Excelente', dist.excelente],
                  ['Bueno', dist.bueno],
                  ['Promedio', dist.promedio],
                  ['Malo', dist.malo],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-16 font-body text-xs text-text-muted">{label}</span>
                  <Bar ratio={n / total} tint="bg-lila" />
                </div>
              ))}
            </div>
          </div>

          {d.axes.length > 0 ? (
            <section className="rounded-md border border-border bg-surface p-5">
              <h2 className="mb-3 font-display text-xl text-text">Calificación del lugar</h2>
              <div className="space-y-2">
                {d.axes.map((a) => (
                  <AxisRow key={a.axis_key} axis={a} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-md border border-border bg-surface p-5">
            <h2 className="mb-2 font-display text-xl text-text">Platos y combos</h2>
            {d.products.length > 0 ? (
              d.products.map((p) => <ProductRow key={p.id} product={p} />)
            ) : (
              <p className="font-body text-sm text-text-muted">Este lugar aún no publica platos.</p>
            )}
          </section>
        </div>
      ) : (
        <section className="space-y-3 rounded-md border border-border bg-surface p-5">
          <h2 className="font-display text-xl text-text">Opiniones del lugar</h2>
          {reviewsQ.isLoading ? (
            <p className="font-body text-sm text-text-muted">Cargando…</p>
          ) : (reviewsQ.data?.data.length ?? 0) === 0 ? (
            <p className="font-body text-sm text-text-muted">Todavía no hay opiniones del lugar.</p>
          ) : (
            reviewsQ.data?.data.map((r) => <ReviewItem key={r.id} review={r} />)
          )}
        </section>
      )}
    </main>
  );
}
