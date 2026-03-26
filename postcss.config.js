// PostCSS processa o CSS antes de chegar ao browser
// Tailwind é um plugin PostCSS — ele lê seus arquivos e gera o CSS
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},  // adiciona prefixos de browser (-webkit-, -moz-, etc.)
  },
}
