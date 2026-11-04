/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        cyber: {
          950: '#05080f',
          900: '#0a101c',
          800: '#111a2b',
          700: '#1b2740',
          accent: '#22d3ee',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34,211,238,.25), 0 8px 32px -8px rgba(34,211,238,.25)',
      },
    },
  },
  plugins: [],
};