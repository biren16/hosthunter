/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg:      'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        ink:     'rgb(var(--color-ink) / <alpha-value>)',
        muted:   'rgb(var(--color-muted) / <alpha-value>)',
        signal:  'rgb(var(--color-signal) / <alpha-value>)',
        alert:   'rgb(var(--color-alert) / <alpha-value>)',
        depth:   'rgb(var(--color-depth) / <alpha-value>)',
        invert:  'rgb(var(--color-invert) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
        body:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
