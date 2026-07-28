/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:               'rgb(var(--color-bg) / <alpha-value>)',
        surface:          'rgb(var(--color-surface) / <alpha-value>)',
        'surface-overlay':'rgb(var(--color-surface-overlay) / <alpha-value>)',
        'surface-raised': 'rgb(var(--color-surface-raised) / <alpha-value>)',
        border:           'rgb(var(--color-border) / <alpha-value>)',
        text:             'rgb(var(--color-text) / <alpha-value>)',
        muted:            'rgb(var(--color-muted) / <alpha-value>)',
        accent:           'rgb(var(--color-accent) / <alpha-value>)',
        accentHover:      'rgb(var(--color-accent-hover) / <alpha-value>)',
        sold:             'rgb(var(--color-sold) / <alpha-value>)',
        success:          'rgb(var(--color-success) / <alpha-value>)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body:    'var(--font-body)',
      },
      borderRadius: {
        hero:    'var(--radius-hero)',
        card:    'var(--radius-card)',
        section: 'var(--radius-section)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
      },
    },
  },
  plugins: [],
};
