# Backend - Credenciais e Informações Importantes

## 🔐 Credenciais de Teste

### Usuário Admin
- **Email:** `admin@admin.com`
- **Senha:** `admin`
- **Role:** `ADMIN`

### Usuário Comum
- **Email:** `user@user.com`
- **Senha:** `user`
- **Role:** `EMPLOYEE`

## 🌐 Endpoints Disponíveis

### Health Check
- **GET** `/api/health` - Status do servidor e conexão com banco

### Autenticação
- **POST** `/api/auth/login` - Login com email/senha
- **GET** `/api/auth/me` - Dados do usuário autenticado (protegido)

### Upload
- **POST** `/api/upload` - Upload de arquivos para S3 (protegido)

## 🔧 Configurações

### Porta
- **Backend:** `3001`

### Banco de Dados
- **Tipo:** PostgreSQL
- **URL:** `DATABASE_URL` (variável de ambiente)

### Middlewares Ativos
- ✅ Helmet (segurança)
- ✅ Compression (compressão)
- ✅ Morgan (logs)
- ✅ Rate Limiting (limitação de taxa)
- ✅ CORS (Cross-Origin Resource Sharing)
- ✅ Validation Pipe (validação global)

## 🚀 Como Executar

```bash
# Desenvolvimento
npx ts-node src/main.ts

# Build
npm run build

# Testes
npm run test
npm run test:e2e
```

## 📝 Notas Importantes

- Todas as rotas de autenticação e upload requerem JWT válido
- Headers de CORS configurados para `http://localhost:3000`
- Rate limiting: 100 requests por 15 minutos por IP
- Logs em formato `dev` (Morgan)
- Validação automática de DTOs com class-validator 