import type { Config } from 'tailwindcss';

/**
 * Preset de Tailwind derivado de los tokens (§1). Los colores apuntan a las
 * variables CSS de tokens.css, de modo que el modo oscuro funciona solo.
 */
const preset: Omit<Config, 'content'> = {
  theme: {
    extend: {
      colors: {
        paja: 'var(--paja)',
        niebla: 'var(--niebla)',
        carbon: 'var(--carbon)',
        humo: 'var(--humo)',
        monte: 'var(--monte)',
        rio: 'var(--rio)',
        maiz: 'var(--maiz)',
        tinto: 'var(--tinto)',
        brote: 'var(--brote)',
        barro: 'var(--barro)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        primary: {
          DEFAULT: 'var(--primary)',
          contrast: 'var(--primary-contrast)',
        },
        accent: 'var(--accent)',
        border: 'var(--border-color)',
        'border-strong': 'var(--border-strong)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        pop: 'var(--shadow-pop)',
        modal: 'var(--shadow-modal)',
      },
    },
  },
  plugins: [],
};

export default preset;
