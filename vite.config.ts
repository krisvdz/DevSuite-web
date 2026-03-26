// ═══════════════════════════════════════════════════════════════════════════
// VITE CONFIG — Configuração do bundler
// ═══════════════════════════════════════════════════════════════════════════
//
// 📚 CONCEITO: Por que Vite em vez de Create React App?
//
// O CRA usa Webpack por baixo — funciona, mas é lento para projetos grandes.
// Vite usa ES Modules nativos do browser em dev (sem bundle!) e Rollup em build.
// Resultado: servidor de dev inicia em <300ms e hot reload em <50ms.
//
// 📚 CONCEITO: Bundlers
// Em produção, os módulos precisam ser "empacotados" (bundled) para:
// - Reduzir o número de requisições HTTP
// - Minificar o código (remover espaços, renomear variáveis)
// - Tree-shaking: remover código não utilizado
// - Code splitting: dividir em chunks para lazy loading
//
// 📚 CONCEITO: Proxy de Desenvolvimento
// O browser tem Same-Origin Policy: não pode fazer requests para outra origem.
// Em dev, o Vite pode fazer proxy das chamadas /api/* para o backend,
// eliminando a necessidade de configurar CORS durante o desenvolvimento local.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(), // Habilita Fast Refresh (HMR para React) e suporte a JSX/TSX
  ],

  server: {
    port: 5173,
    // Proxy: redireciona /api/* para o backend durante desenvolvimento
    // Assim o browser não vê duas origens diferentes
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        // Opcional: reescreve o path se necessário
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },

  build: {
    // Code splitting: separa o código em chunks para melhor cache
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa bibliotecas grandes em chunks separados
          // Usuário que visita pela 2ª vez não precisa baixar novamente!
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'query': ['@tanstack/react-query'],
        },
      },
    },
    // Gera relatório de tamanhos dos bundles
    reportCompressedSize: true,
  },

  // Aliases de import (evita ../../../../../../components)
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
