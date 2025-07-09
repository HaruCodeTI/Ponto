# Configuração Docker - Projeto Ponto

## Visão Geral

Este projeto está configurado para rodar com Docker, incluindo:
- **Next.js App** (porta 3000)
- **PostgreSQL** (porta 5432)
- **Redis** (porta 6379)

## Pré-requisitos

- Docker
- Docker Compose

## Configuração Rápida

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Database
DATABASE_URL="postgresql://ponto_user:ponto_password@postgres:5432/ponto"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Redis
REDIS_URL="redis://redis:6379"

# Resend (Email Service) - RECOMENDADO
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Email (Alternativa ao Resend)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Stripe (opcional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Google Maps (opcional)
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Security
JWT_SECRET="your-jwt-secret-here"
ENCRYPTION_KEY="your-32-character-encryption-key"

# App Configuration
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
```

### 2. Configuração do Resend (Email)

1. Acesse [resend.com](https://resend.com) e crie uma conta
2. Obtenha sua API key no dashboard
3. Configure um domínio verificado (ou use o domínio de teste)
4. Adicione a API key no arquivo `.env`:
   ```bash
   RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

### 3. Executar em Produção

```bash
# Build e iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Parar serviços
docker-compose down
```

### 4. Executar em Desenvolvimento

```bash
# Iniciar apenas banco e Redis
docker-compose up -d postgres redis

# Executar app em modo desenvolvimento
docker-compose --profile dev up app-dev
```

## Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver status dos containers
docker-compose ps

# Reiniciar um serviço específico
docker-compose restart app

# Ver logs de um serviço específico
docker-compose logs -f postgres

# Parar e remover containers
docker-compose down

# Parar e remover containers + volumes
docker-compose down -v
```

### Banco de Dados

```bash
# Executar migrations
docker-compose exec app npx prisma migrate deploy

# Resetar banco
docker-compose exec app npx prisma migrate reset

# Abrir Prisma Studio
docker-compose exec app npx prisma studio

# Backup do banco
docker-compose exec postgres pg_dump -U ponto_user ponto > backup.sql
```

### Desenvolvimento

```bash
# Instalar dependências
docker-compose exec app-dev npm install

# Executar lint
docker-compose exec app-dev npm run lint

# Executar build
docker-compose exec app-dev npm run build
```

## Estrutura dos Arquivos Docker

- `Dockerfile` - Build de produção otimizado
- `Dockerfile.dev` - Build para desenvolvimento
- `docker-compose.yml` - Orquestração dos serviços
- `.dockerignore` - Arquivos ignorados no build

## Volumes

- `postgres_data` - Dados do PostgreSQL
- `redis_data` - Dados do Redis

## Redes

- `ponto-network` - Rede interna para comunicação entre serviços

## Portas

- **3000** - Aplicação Next.js (produção)
- **3001** - Aplicação Next.js (desenvolvimento)
- **5432** - PostgreSQL
- **6379** - Redis

## Troubleshooting

### Problema: Container não inicia
```bash
# Verificar logs
docker-compose logs app

# Verificar se as portas estão livres
netstat -tulpn | grep :3000
```

### Problema: Banco não conecta
```bash
# Verificar se PostgreSQL está rodando
docker-compose exec postgres pg_isready -U ponto_user

# Verificar logs do PostgreSQL
docker-compose logs postgres
```

### Problema: Build falha
```bash
# Limpar cache do Docker
docker system prune -a

# Rebuild sem cache
docker-compose build --no-cache
```

### Problema: Emails não são enviados
```bash
# Verificar se RESEND_API_KEY está configurada
echo $RESEND_API_KEY

# Verificar logs da aplicação
docker-compose logs app | grep -i email
```

## Deploy em Produção

Para deploy em produção, considere:

1. **Variáveis de Ambiente**: Use um gerenciador de secrets
2. **SSL/TLS**: Configure reverse proxy (nginx/traefik)
3. **Backup**: Configure backup automático do PostgreSQL
4. **Monitoramento**: Adicione health checks e logging
5. **Escalabilidade**: Configure load balancer se necessário

## Exemplo de Deploy com Nginx

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - ponto-network
``` 