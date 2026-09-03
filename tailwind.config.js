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
        // Theme-aware semantic colors — flip automatically between dark and
        // light via CSS variables (see index.css), while still supporting
        // Tailwind's opacity modifiers (e.g. text-ink/50, border-line/10).
        page: 'rgb(var(--color-page) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        elevated: 'rgb(var(--color-elevated) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'fade-bottom': 'linear-gradient(to top, rgb(var(--color-page)) 0%, rgb(var(--color-page) / 0.6) 40%, transparent 100%)',
        'fade-left': 'linear-gradient(to right, rgb(var(--color-page)) 10%, transparent 60%)',
      },
    },
  },
  plugins: [],
};
