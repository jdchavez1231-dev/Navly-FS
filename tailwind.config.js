/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          navy: '#0F172A',
        },
        boxShadow: {
          'card': '0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.07)',
          'card-blue': '0 4px 20px rgba(37,99,235,0.22), 0 1px 4px rgba(37,99,235,0.12)',
          'card-hover': '0 2px 6px rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.10)',
        },
      },
    },
    plugins: [],
  }