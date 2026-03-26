# ═══════════════════════════════════════════════════════════════════════════
# DOCKERFILE — Frontend React (Nginx)
# ═══════════════════════════════════════════════════════════════════════════
#
# 📚 CONCEITO: Como deployar um SPA React?
#
# O React build gera apenas arquivos estáticos (HTML, JS, CSS).
# Para servir esses arquivos, usamos um servidor web estático.
# Nginx é a escolha padrão: extremamente eficiente para arquivos estáticos.
#
# Fluxo:
# 1. Stage "builder": Node.js compila o React (npm run build → dist/)
# 2. Stage "production": Nginx serve o dist/ gerado
# A imagem final NÃO tem Node.js — apenas Nginx (~25MB!)

# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build args: variáveis passadas em tempo de build
# docker build --build-arg VITE_API_URL=https://api.taskflow.com .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build  # gera a pasta dist/

# ─── Stage 2: Serve com Nginx ────────────────────────────────────────────────
FROM nginx:alpine AS production

# Copia o build do React para o diretório padrão do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração customizada do Nginx para SPAs
# 📚 CONCEITO: Por que precisamos de configuração para SPA?
# Em um SPA, todas as rotas são gerenciadas pelo React Router no client.
# Se o usuário acessar diretamente /projects/123, o Nginx tenta encontrar
# o arquivo /projects/123/index.html — que não existe!
# A config try_files redireciona tudo para index.html, deixando o React Router
# lidar com a rota.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
