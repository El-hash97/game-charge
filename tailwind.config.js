/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#080808',
        bg2:      '#101010',
        bg3:      '#181818',
        bg4:      '#140202',
        'border-dark': '#1e1e1e',
        'border-r': '#3a1010',
        red:      '#e02020',
        'red2':   '#ff4444',
        green:    '#22c55e',
        yellow:   '#f0b429',
        blue:     '#3b82f6',
        text:     '#f0f0f0',
        'text2':  '#666666',
        'text3':  '#333333',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
