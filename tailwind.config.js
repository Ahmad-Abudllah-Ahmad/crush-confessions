/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#f8f0fe',
          100: '#f0e4fc',
          200: '#e0c1f4',
          300: '#d1a0ec',
          400: '#bf7ee3',
          500: '#aa5ada',
          600: '#9039ce',
          700: '#7b2cbf',
          800: '#5a189a',
          900: '#3c096c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'lg': 'var(--radius)',
        'md': 'calc(var(--radius) - 2px)',
        'sm': 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'custom': '0 4px 14px 0 rgba(123, 44, 191, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'float-medium': 'float-medium 5s ease-in-out infinite',
        'twinkle': 'twinkle 5s ease-in-out infinite',
        'shooting': 'shooting 10s linear infinite',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'float-medium': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.8' },
        },
        'shooting': {
          '0%': { 
            transform: 'translateX(0) translateY(0) rotate(-45deg)',
            opacity: '1'
          },
          '100%': { 
            transform: 'translateX(-100vw) translateY(100vh) rotate(-45deg)',
            opacity: '0'
          },
        },
      },
    },
  },
  plugins: [],
} 