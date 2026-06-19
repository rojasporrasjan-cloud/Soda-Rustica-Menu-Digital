/** @type {import('tailwindcss').Config} */
// Config del menú. El tema (colores/fuentes) se migró del bloque inline
// que vivía en index.html cuando usábamos el CDN de Tailwind.
// Para recompilar el CSS después de tocar el diseño:  npm run build:css
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        ink:       '#0b1622',
        navy:      '#112236',
        steel:     '#1a3550',
        accent:    '#d62828',
        accentDk:  '#a4161a',
        wood:      '#b87333',
        woodL:     '#d9934a',
        gold:      '#f0c060',
        goldDim:   '#c9943a',
        cream:     '#f5eedf',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
