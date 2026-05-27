/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f0d0b',
        surface: '#1a1612',
        border: '#2e2820',
        text: '#f0e8dc',
        muted: '#8a7c6e',
        accent: '#c4843a',
        accentHover: '#d9953f',
        sold: '#6b5a4e',
        success: '#4a7c59',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 24px 80px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [],
};
