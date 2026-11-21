/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        mist: '#F3F0FA',
        pearl: '#FAF9FE',
        royal: {
          50: '#F6F3FE',
          100: '#EDE7FC',
          200: '#DBD0F8',
          300: '#BFA9F3',
          400: '#9F7BEA',
          500: '#7C51DA',
          600: '#5D2EC2',
          700: '#491FA3',
          800: '#3B1786',
          900: '#270E5C',
        },
        ink: {
          DEFAULT: '#1D1633',
          muted: '#5E5675',
          subtle: '#8B83A3',
        },
      },
      boxShadow: {
        card: '0 6px 24px -10px rgba(59, 23, 134, 0.09), 0 1px 3px rgba(59, 23, 134, 0.04)',
        'card-hover': '0 14px 32px -12px rgba(59, 23, 134, 0.16), 0 2px 8px rgba(124, 81, 218, 0.08)',
        pill: '0 2px 10px -2px rgba(59, 23, 134, 0.10)',
      },
    },
  },
  plugins: [],
};
