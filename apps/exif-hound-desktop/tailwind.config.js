/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          black: 'var(--app-black)',
          dark: 'var(--app-dark)',
          gray: 'var(--app-gray)',
          'gray-light': 'var(--app-gray-light)',
          'gray-lighter': 'var(--app-gray-lighter)',
          white: 'var(--app-white)',
          accent: 'var(--app-accent)',
          'accent-dim': 'var(--app-accent-dim)'
        }
      },
      boxShadow: {
        'inner-light': 'inset 0 0 20px rgba(128, 128, 128, 0.1)',
        'inner-white': 'inset 0 0 30px rgba(128, 128, 128, 0.05)'
      },
      opacity: {
        '85': '0.85',
        '95': '0.95',
      },
      borderOpacity: {
        '15': '0.15',
      }
    },
  },
  plugins: [],
};