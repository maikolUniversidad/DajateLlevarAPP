import type { Service } from '@dejatellevar/contracts';
import { Badge, FidelityMeter, MoneyDisplay } from '@dejatellevar/ui';
import Link from 'next/link';

const MODALITY_LABEL: Record<string, string> = {
  scheduled: 'Con cita',
  capacity: 'Con cupo',
  on_demand: 'Bajo demanda',
  digital: 'Digital',
};

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/servicio/${service.id}`}
      className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg text-text">{service.name}</h3>
        {service.risk_category === 'high' && <Badge tone="warning">Riesgo</Badge>}
      </div>

      {service.short_description && (
        <p className="font-body text-sm text-text-muted line-clamp-2">
          {service.short_description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {service.base_price ? (
            <MoneyDisplay value={service.base_price} from={service.pricing_mode === 'from'} />
          ) : (
            <span className="font-body text-sm text-text-muted">Por cotización</span>
          )}
        </div>
        <Badge tone="info">{MODALITY_LABEL[service.modality] ?? service.modality}</Badge>
      </div>

      <FidelityMeter score={service.fidelity} variant="compact" />
    </Link>
  );
}
