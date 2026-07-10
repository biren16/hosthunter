/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0A0A0F',
        surface: '#0F0F18',
        ink:     '#E2E6EA',
        muted:   '#525D6E',
        signal:  '#3ED6C4',
        alert:   '#E8785A',
        depth:   '#6C5CE7',
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
