import { type VariantProps, cva } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

const badge = cva(
  'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-body text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-niebla text-carbon',
        success: 'bg-brote/15 text-brote',
        warning: 'bg-barro/15 text-barro',
        danger: 'bg-tinto/15 text-tinto',
        accent: 'bg-lila/20 text-carbon',
        info: 'bg-violeta/15 text-violeta',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badge> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
