/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50:  '#f4f0eb',
          100: '#e8dfd4',
          200: '#d0bfa9',
          300: '#b89e7e',
          400: '#9f7d54',
          500: '#7a5c35',
          600: '#5e4428',
          700: '#432e1c',
          800: '#2a1c10',
          900: '#150d07',
        },
        parchment: {
          50:  '#fdfaf5',
          100: '#f9f3e6',
          200: '#f3e7cc',
          300: '#ead4a6',
          400: '#debb7a',
          500: '#cfa04e',
        },
        accent: {
          400: '#e8734a',
          500: '#d4522a',
          600: '#b83e1a',
        },
        teal: {
          400: '#4ab8b0',
          500: '#2a9d93',
          600: '#1a7a72',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
