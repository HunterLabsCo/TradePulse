/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lime: '#39FF14',
        electric: '#00C2FF',
        surface: '#111111',
        elevated: '#1a1a1a',
        'border-subtle': '#222222',
        'border-default': '#333333',
        'text-secondary': '#aaaaaa',
        'text-muted': '#666666',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        heading: ['Syne', 'sans-serif'],
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 16px rgba(57, 255, 20, 0.3)' },
          '50%': { boxShadow: '0 0 32px rgba(57, 255, 20, 0.6)' },
        },
        'scan-line': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'scan-line': 'scan-line 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
