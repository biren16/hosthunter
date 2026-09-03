/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3EDE3",
        paper2: "#EAE0D2",
        cream: "#EAE0D2",
        bone: "#DDD0BF",
        parchment: "#CDBA9E",
        ink: "#0D0B09",
        carbon: "#0D0B09",
        brown: "#2A1D16",
        graphite: "#655E57",
        brass: "#B68A4A",
        copper: "#9A603B",
        stone: {
          50: "#F5EFE6",
          100: "#F0EAE1",
          200: "#E8E0D5",
          300: "#D8CFC0",
          400: "#B8AFA3",
          500: "#6F6861",
          600: "#6B6560",
          700: "#4A4743",
          800: "#1E1E1E",
          900: "#0B0B0B",
        },
        signal: "#B68A4A",
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        micro: "0.14em",
      },
      keyframes: {
        drift: { "0%": { transform: "translateX(-2%)" }, "50%": { transform: "translateX(2%)" }, "100%": { transform: "translateX(-2%)" } },
        pulseSubtle: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.45 } },
        draw: { "0%": { strokeDashoffset: "400" }, "100%": { strokeDashoffset: "0" } },
        "page-enter": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "module-enter": { "0%": { opacity: "0", transform: "translateY(5px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "evidence-reveal": { "0%": { opacity: "0", transform: "translateY(4px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        pulseSubtle: "pulseSubtle 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
