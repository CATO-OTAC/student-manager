/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#004ac6',
        'primary-container': '#2563eb',
        'on-primary-container': '#eeefff',
        'primary-fixed': '#dbeafe',
        secondary: '#855300',
        'secondary-container': '#fea619',
        'on-secondary-container': '#2c1a00',
        'secondary-fixed': '#fef3c7',
        surface: '#f8f9fa',
        'on-surface': '#191c1d',
        outline: '#737686',
        'outline-variant': '#c3c6d7',
        'surface-variant': '#e8eaf0',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error-container': '#410002',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
