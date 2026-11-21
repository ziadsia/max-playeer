/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        max: { bg: '#04060c', panel: '#080d1c', card: '#0c1430', line: '#17224a', blue: '#2563ff', glow: '#5b9bff' },
      },
      fontFamily: { sans: ['Cairo', 'Segoe UI', 'Tahoma', 'sans-serif'] },
      keyframes: {
        fade: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { fade: 'fade .35s ease-out' },
    },
  },
  plugins: [],
};
