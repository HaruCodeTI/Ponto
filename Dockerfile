# Dockerfile para o projeto Ponto
FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar dependências
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Instalar dependências de desenvolvimento
FROM base AS dev-deps
RUN npm ci

# Builder stage
FROM base AS builder
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# Gerar Prisma client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copiar Prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Definir permissões
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expor porta
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando para executar a aplicação
CMD ["node", "server.js"]