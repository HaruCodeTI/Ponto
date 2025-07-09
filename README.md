# Sistema de Ponto Eletrônico

Sistema completo de ponto eletrônico desenvolvido com Next.js, TypeScript, Prisma e PostgreSQL.

## 🚀 Início Rápido

### Com Docker (Recomendado)

```bash
# Configuração inicial
./scripts/docker-setup.sh

# Ou manualmente:
docker-compose up -d
```

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar banco de dados
npx prisma generate
npx prisma migrate deploy

# Executar em desenvolvimento
npm run dev
```

## 🐳 Docker

### Produção
```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

### Desenvolvimento
```bash
# Iniciar ambiente de desenvolvimento
./scripts/docker-dev.sh

# Ou manualmente:
docker-compose up -d postgres redis
docker-compose --profile dev up app-dev
```

## 📋 Serviços

- **🌐 Aplicação**: http://localhost:3000 (produção) / http://localhost:3001 (dev)
- **🗄️ PostgreSQL**: localhost:5432
- **🔴 Redis**: localhost:6379

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco**: PostgreSQL
- **Cache**: Redis
- **UI**: TailwindCSS, Shadcn UI, Radix UI
- **Autenticação**: NextAuth.js
- **Pagamentos**: Stripe

## 📁 Estrutura

```
src/
├── app/                 # App Router (Next.js 15)
│   ├── api/            # API Routes
│   ├── auth/           # Páginas de autenticação
│   └── ...             # Outras páginas
├── components/         # Componentes React
├── lib/               # Utilitários e configurações
└── types/             # Tipos TypeScript
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev
npm run build
npm run lint

# Banco de dados
npx prisma studio
npx prisma migrate dev
npx prisma generate

# Docker
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## 📚 Documentação

- [Configuração Docker](DOCKER_SETUP.md)
- [Setup do Projeto](SETUP.md)
- [Configuração Stripe](STRIPE_SETUP.md)

## 🚀 Deploy

O projeto está configurado para deploy em produção com Docker. Veja [DOCKER_SETUP.md](DOCKER_SETUP.md) para detalhes.

## 📄 Licença

Este projeto é privado e proprietário.
