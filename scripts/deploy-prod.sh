#!/bin/bash

# Script de deploy em produção
set -e

echo "🚀 Iniciando deploy em produção..."

# Verificar se arquivo .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado. Crie o arquivo .env com as variáveis de produção."
    exit 1
fi

# Verificar variáveis obrigatórias
required_vars=("POSTGRES_PASSWORD" "NEXTAUTH_URL" "NEXTAUTH_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Variável $var não está definida no arquivo .env"
        exit 1
    fi
done

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Remover imagens antigas
echo "🧹 Limpando imagens antigas..."
docker system prune -f

# Build das imagens
echo "🔨 Fazendo build das imagens..."
docker-compose -f docker-compose.prod.yml build

# Iniciar serviços
echo "🚀 Iniciando serviços..."
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
until docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U ponto_user -d ponto; do
    echo "Aguardando PostgreSQL..."
    sleep 5
done

# Executar migrations
echo "📊 Executando migrations..."
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U ponto_user -d ponto -f /docker-entrypoint-initdb.d/init.sql 2>/dev/null || true

# Iniciar aplicação
echo "🌐 Iniciando aplicação..."
docker-compose -f docker-compose.prod.yml up -d app

# Aguardar aplicação estar pronta
echo "⏳ Aguardando aplicação estar pronta..."
until curl -f http://localhost:3000/api/health >/dev/null 2>&1; do
    echo "Aguardando aplicação..."
    sleep 10
done

# Iniciar Nginx (se certificados SSL existirem)
if [ -f "./ssl/cert.pem" ] && [ -f "./ssl/key.pem" ]; then
    echo "🔒 Iniciando Nginx com SSL..."
    docker-compose -f docker-compose.prod.yml up -d nginx
else
    echo "⚠️  Certificados SSL não encontrados. Nginx não será iniciado."
    echo "   Para configurar SSL, coloque os certificados em ./ssl/cert.pem e ./ssl/key.pem"
fi

echo "✅ Deploy concluído!"
echo ""
echo "📋 Serviços disponíveis:"
echo "   🌐 Aplicação: http://localhost:3000"
if [ -f "./ssl/cert.pem" ] && [ -f "./ssl/key.pem" ]; then
    echo "   🔒 HTTPS: https://localhost"
fi
echo "   🗄️  PostgreSQL: localhost:5432"
echo "   🔴 Redis: localhost:6379"
echo ""
echo "📝 Comandos úteis:"
echo "   Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Parar: docker-compose -f docker-compose.prod.yml down"
echo "   Reiniciar: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🎉 Deploy em produção concluído!" 