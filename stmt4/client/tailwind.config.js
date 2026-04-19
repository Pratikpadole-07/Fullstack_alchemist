/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bridge: {
          950: '#0b1220',
          900: '#0f172a',
          800: '#152238',
          accent: '#38bdf8',
          mint: '#34d399',
          warn: '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
