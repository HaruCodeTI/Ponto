# Configuração do Sistema de Ponto

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ponto_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google Maps API
GOOGLE_MAPS_API_KEY="your-google-maps-api-key-here"
```

## Gerar Chave Secreta

Para gerar uma chave secreta para o NextAuth:

```bash
openssl rand -base64 32
```

## Configurar Google Maps API

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a Maps JavaScript API
4. Crie uma chave de API
5. Configure restrições de domínio para segurança
6. Adicione a chave no arquivo `.env`

## Configurar Banco de Dados

1. Configure sua conexão PostgreSQL
2. Execute as migrações:

```bash
npx prisma migrate dev --name init
```

## Próximos Passos

1. Configurar banco de dados PostgreSQL
2. Configurar Google Maps API
3. Executar migrações do Prisma
4. Criar usuário administrador inicial
5. Testar autenticação e geolocalização
