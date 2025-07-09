#!/bin/bash

# Script de desenvolvimento Docker para o projeto Ponto
set -e

echo "🔧 Iniciando ambiente de desenvolvimento..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado."
    exit 1
fi

# Verificar se arquivo .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado. Execute ./scripts/docker-setup.sh primeiro."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down 2>/dev/null || true

# Iniciar apenas banco e Redis
echo "🚀 Iniciando banco de dados e Redis..."
docker-compose up -d postgres redis

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
until docker-compose exec -T postgres pg_isready -U ponto_user -d ponto; do
    echo "Aguardando PostgreSQL..."
    sleep 2
done

# Executar migrations se necessário
echo "📊 Verificando migrations..."
docker-compose exec -T postgres psql -U ponto_user -d ponto -f /docker-entrypoint-initdb.d/init.sql 2>/dev/null || true

# Iniciar aplicação em modo desenvolvimento
echo "🌐 Iniciando aplicação em modo desenvolvimento..."
docker-compose --profile dev up app-dev

echo "✅ Ambiente de desenvolvimento iniciado!"
echo ""
echo "📋 Serviços disponíveis:"
echo "   🌐 Aplicação: http://localhost:3001"
echo "   🗄️  PostgreSQL: localhost:5432"
echo "   🔴 Redis: localhost:6379"
echo ""
echo "📝 Comandos úteis:"
echo "   Ver logs: docker-compose logs -f app-dev"
echo "   Parar: docker-compose down"
echo "   Executar comando: docker-compose exec app-dev npm run <comando>" 