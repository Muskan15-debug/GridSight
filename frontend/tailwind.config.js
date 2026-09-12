/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#F59E0B',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        background: '#0F172A',
        card: '#1E293B',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        border: '#334155',
      },
    },
  },
  plugins: [],
}
