import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink:   '#FF4DA6',
          orange: '#FFA500',
          yellow: '#FFD600',
          green:  '#22C55E',
          cyan:   '#00B4E6',
          purple: '#8B5CF6',
          navy:   '#1E1B4B',
          rose:   '#f43f5e',
        },
        surface: {
          pink:   '#fff0f8',
          orange: '#fff8f0',
          yellow: '#fffbeb',
          green:  '#f0fdf4',
          cyan:   '#f0f9ff',
          purple: '#f5f3ff',
          navy:   '#eef2ff',
          rose:   '#fff1f5',
        },
      },
      fontFamily: {
        sans:  ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        heebo: ['var(--font-heebo)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        btn:  '14px',
        pill: '999px',
      },
      boxShadow: {
        card:   '0 4px 20px rgba(0,0,0,0.07)',
        nav:    '0 8px 32px rgba(0,0,0,0.28)',
        'nav-lg': '0 14px 40px rgba(0,0,0,0.36)',
        pink:   '0 6px 24px rgba(255,77,166,0.42)',
        orange: '0 6px 24px rgba(255,165,0,0.42)',
        purple: '0 6px 24px rgba(139,92,246,0.42)',
        cyan:   '0 6px 24px rgba(0,180,230,0.42)',
        green:  '0 6px 24px rgba(34,197,94,0.42)',
        rose:   '0 6px 24px rgba(244,63,94,0.42)',
      },
      animation: {
        'wave-bar':   'waveBar var(--wave-dur, 1s) ease-in-out var(--wave-delay, 0s) infinite alternate',
        'float':      'floatUp 3s ease-in-out infinite',
        'float-slow': 'floatUp 4.5s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'fade-up':    'fadeUp 0.4s ease both',
        'blink':      'blink 1s ease-in-out infinite',
        'spin-slow':  'spin 2s linear infinite',
      },
      keyframes: {
        waveBar: {
          '0%':   { transform: 'scaleY(0.35)' },
          '100%': { transform: 'scaleY(1.25)' },
        },
        floatUp: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.05)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.15' },
        },
      },
    },
  },
  plugins: [],
}

export default config
