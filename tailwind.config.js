/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0B3D91',
          blueDark: '#082C6B',
          accent: '#FFB703',
        },
      },
    },
  },
  plugins: [],
};
