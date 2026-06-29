/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pokedex: {
          dark: '#0f172a',
          panel: '#111827',
          slab: '#1e293b',
          line: '#334155',
          red: '#dc2626',
          gold: '#fbbf24',
          silver: '#cbd5e1',
          bronze: '#fb923c',
        },
      },
      boxShadow: {
        holo: '0 24px 80px rgba(15,23,42,.55), inset 0 0 0 1px rgba(255,255,255,.08)',
        glow: '0 0 60px rgba(220,38,38,.22)',
      },
      backgroundImage: {
        'premium-grid': 'linear-gradient(rgba(148,163,184,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.08) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
