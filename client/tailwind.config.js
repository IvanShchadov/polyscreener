/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        surface: {
          body: '#0a0b0f',
          card: '#12141c',
          raised: '#1a1d28',
        },
        accent: '#6c5ce7',
      },
    },
  },
  plugins: [],
};
