/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Inter', 'Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0A0F1F',
          900: '#0D1530',
          800: '#111B3D',
        },
      },
      boxShadow: {
        glass: '0 10px 30px rgba(2, 6, 23, 0.18)',
        soft: '0 12px 50px rgba(2, 6, 23, 0.12)',
      },
      backgroundImage: {
        'hero-gradient':
          'radial-gradient(1200px 600px at 20% 10%, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0.0) 60%), radial-gradient(900px 500px at 80% 0%, rgba(168,85,247,0.35) 0%, rgba(168,85,247,0.0) 55%), linear-gradient(180deg, #070B17 0%, #070B17 50%, #0B1022 100%)',
        'card-gradient':
          'radial-gradient(600px 180px at 20% 10%, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0) 60%), radial-gradient(600px 180px at 80% 0%, rgba(168,85,247,0.16) 0%, rgba(168,85,247,0) 60%), linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}

