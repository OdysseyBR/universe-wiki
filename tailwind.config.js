/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Linux Libertine"', '"Georgia"', 'serif'],
        body: ['"Linux Libertine"', '"Georgia"', 'serif'],
        sans: ['"Noto Sans"', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        wiki: {
          charcoal: '#353535',
          navy:     '#284B63',
          teal:     '#3C6E71',
          red:      '#D02B1C',
          gold:     '#D4B60E',
          silver:   '#D9D9D9',
          white:    '#FFFFFF',
          // Derivados
          'navy-light':  '#3a6a8a',
          'navy-dark':   '#1a3347',
          'teal-light':  '#4d8a8d',
          'teal-dark':   '#2a4f51',
          'bg-main':     '#f8f9fa',
          'bg-sidebar':  '#f3f4f6',
          'bg-infobox':  '#eaf1f8',
          'border':      '#c8ccd1',
          'border-dark': '#a2a9b1',
          'text':        '#202122',
          'text-muted':  '#54595d',
          'link':        '#284B63',
          'link-hover':  '#3C6E71',
          'link-new':    '#D02B1C',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
      }
    }
  },
  plugins: []
}
