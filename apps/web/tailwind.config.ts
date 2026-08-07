import uiPreset from '@dejatellevar/ui/tailwind-preset';
import type { Config } from 'tailwindcss';

export default {
  presets: [uiPreset],
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
} satisfies Config;
