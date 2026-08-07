import { type VariantProps, cva } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-body font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violeta',
  {
    variants: {
      variant: {
        // Una sola acción primaria por pantalla (§1.2).
        primary: 'bg-primary text-primary-contrast hover:opacity-90',
        secondary: 'border border-border-strong bg-surface text-text hover:bg-surface-raised',
        ghost: 'text-text hover:bg-surface-raised',
        destructive: 'bg-tinto text-white hover:opacity-90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-base', // 44px: objetivo táctil mínimo en móvil (§1.7)
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}
