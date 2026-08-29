/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#07070a',
          900: '#0c0c10',
          850: '#121218',
          800: '#18181f',
          700: '#232330',
        },
        crimson: {
          400: '#ff5566',
          500: '#e6273f',
          600: '#c41230',
          700: '#9c0e26',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'fade-bottom': 'linear-gradient(to top, #07070a 0%, rgba(7,7,10,0.6) 40%, transparent 100%)',
        'fade-left': 'linear-gradient(to right, #07070a 10%, transparent 60%)',
      },
    },
  },
  plugins: [],
};
