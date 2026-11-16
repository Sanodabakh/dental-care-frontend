/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1769AA', dark: '#12304A', light: '#2185c9', 50: '#EAF4FB' },
        teal: { DEFAULT: '#17A6A1', light: '#E5F6F4' },
        surface: { DEFAULT: '#F5F8FC', card: '#FFFFFF' },
        ink: { DEFAULT: '#253449', muted: '#718096', light: '#9AA6B4' },
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        border: '#E8EDF3',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '0.7rem' },
      boxShadow: {
        card: '0 2px 7px rgba(37, 52, 73, 0.06)',
        modal: '0 20px 70px rgba(28, 52, 68, 0.15)',
      },
    },
  },
  plugins: [],
}