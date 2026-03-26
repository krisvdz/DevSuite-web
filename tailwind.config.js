// 📚 CONCEITO: Tailwind CSS
//
// Tailwind é um framework CSS utility-first: em vez de classes semânticas
// (.card, .button), você usa classes utilitárias diretamente no HTML:
//
//   <div class="flex items-center gap-4 bg-white rounded-lg shadow-md p-4">
//
// Vantagens:
// - Sem CSS customizado para casos simples
// - Sem "naming hell" (como chamar este componente?)
// - Design consistente com sistema de tokens (spacing, cores, etc.)
// - PurgeCSS automático: remove classes não usadas do bundle final
//   (bundle de produção tem apenas os estilos realmente utilizados!)
//
// content: array de arquivos onde o Tailwind procura classes para incluir no CSS
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Personalizações do tema padrão
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
