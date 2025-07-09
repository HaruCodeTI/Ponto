#!/bin/bash

# Script de configuração Docker para o projeto Ponto
set -e

echo "🚀 Configurando Docker para o projeto Ponto..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Instale o Docker Compose primeiro."
    exit 1
fi

# Verificar se arquivo .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://ponto_user:ponto_password@postgres:5432/ponto"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Redis
REDIS_URL="redis://redis:6379"

# Security
JWT_SECRET="$(openssl rand -base64 32)"
ENCRYPTION_KEY="$(openssl rand -hex 16)"

# App Configuration
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
EOF
    echo "✅ Arquivo .env criado com secrets gerados automaticamente"
else
    echo "✅ Arquivo .env já existe"
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down 2>/dev/null || true

# Remover imagens antigas
echo "🧹 Limpando imagens antigas..."
docker system prune -f

# Build das imagens
echo "🔨 Fazendo build das imagens..."
docker-compose build

# Iniciar serviços
echo "🚀 Iniciando serviços..."
docker-compose up -d postgres redis

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
until docker-compose exec -T postgres pg_isready -U ponto_user -d ponto; do
    echo "Aguardando PostgreSQL..."
    sleep 2
done

# Executar migrations
echo "📊 Executando migrations..."
docker-compose exec -T postgres psql -U ponto_user -d ponto -f /docker-entrypoint-initdb.d/init.sql 2>/dev/null || true

# Iniciar aplicação
echo "🌐 Iniciando aplicação..."
docker-compose up -d app

# Aguardar aplicação estar pronta
echo "⏳ Aguardando aplicação estar pronta..."
until curl -f http://localhost:3000 >/dev/null 2>&1; do
    echo "Aguardando aplicação..."
    sleep 5
done

echo "✅ Configuração concluída!"
echo ""
echo "📋 Serviços disponíveis:"
echo "   🌐 Aplicação: http://localhost:3000"
echo "   🗄️  PostgreSQL: localhost:5432"
echo "   🔴 Redis: localhost:6379"
echo ""
echo "📝 Comandos úteis:"
echo "   Ver logs: docker-compose logs -f"
echo "   Parar: docker-compose down"
echo "   Reiniciar: docker-compose restart"
echo ""
echo "🎉 Projeto rodando com Docker!" 