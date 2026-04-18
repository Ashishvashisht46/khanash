/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        panel: 'rgb(var(--panel-rgb) / <alpha-value>)',
        panelAlt: 'rgb(var(--panel-alt-rgb) / <alpha-value>)',
        panelSoft: 'rgb(var(--panel-soft-rgb) / <alpha-value>)',
        line: 'rgb(var(--line-rgb) / <alpha-value>)',
        lineStrong: 'rgb(var(--line-strong-rgb) / <alpha-value>)',
        text: {
          primary: 'rgb(var(--text-primary-rgb) / <alpha-value>)',
          muted: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
          soft: 'rgb(var(--text-soft-rgb) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand-rgb) / <alpha-value>)',
          strong: 'rgb(var(--brand-strong-rgb) / <alpha-value>)',
          soft: 'rgb(var(--brand-soft-rgb) / <alpha-value>)',
          deep: 'rgb(var(--brand-deep-rgb) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          strong: 'rgb(var(--accent-strong-rgb) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft-rgb) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--gold-rgb) / <alpha-value>)',
          light: 'rgb(var(--gold-light-rgb) / <alpha-value>)',
          dark: 'rgb(var(--gold-dark-rgb) / <alpha-value>)',
        },
        navy: {
          DEFAULT: 'rgb(var(--navy-rgb) / <alpha-value>)',
          light: 'rgb(var(--navy-light-rgb) / <alpha-value>)',
          mid: 'rgb(var(--navy-mid-rgb) / <alpha-value>)',
        },
        success: 'rgb(var(--success-rgb) / <alpha-value>)',
        warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
        danger: 'rgb(var(--danger-rgb) / <alpha-value>)',
        info: 'rgb(var(--info-rgb) / <alpha-value>)',
        purple: 'rgb(var(--purple-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        shell: '0 22px 70px rgb(var(--shadow-rgb) / 0.45)',
        card: '0 18px 48px rgb(var(--shadow-rgb) / 0.34)',
        glow: '0 0 0 1px rgb(var(--brand-rgb) / 0.18), 0 20px 60px rgb(var(--brand-strong-rgb) / 0.18)',
      },
      backgroundImage: {
        'app-gradient': 'var(--app-gradient)',
        'card-gradient': 'var(--surface-gradient)',
        'brand-gradient': 'var(--brand-gradient)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseSoft: 'pulseSoft 3.6s ease-in-out infinite',
        gridPan: 'gridPan 18s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        gridPan: {
          '0%': { backgroundPosition: '0 0, 0 0' },
          '100%': { backgroundPosition: '120px 120px, 0 0' },
        },
      },
    },
  },
  plugins: [],
};
