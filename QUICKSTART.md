# 🚀 Quick Start - InfluencerAI

Guia rápido para começar a usar o projeto em **5 minutos**.

---

## ⚡ Setup Rápido

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o `.env.example` para `.env`:

```bash
cp .env.example .env
```

### 3. Configurar DATABASE_URL

Edite o `.env` e adicione sua connection string do PostgreSQL (Supabase):

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### 4. Gerar chaves secretas

**No terminal**:

```bash
# Gerar NEXTAUTH_SECRET
openssl rand -base64 32

# Gerar ENCRYPTION_KEY
openssl rand -hex 32
```

Cole os resultados no `.env`:

```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cole-aqui-o-base64"
ENCRYPTION_KEY="cole-aqui-o-hex-64-chars"
```

### 5. Configurar OAuth (Mínimo: Google)

#### Google OAuth (5 min)

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Criar credenciais → ID do cliente OAuth
3. Tipo: Aplicativo da Web
4. URI de redirecionamento: `http://localhost:3000/api/auth/callback/google`
5. Copie Client ID e Client Secret

Cole no `.env`:

```bash
GOOGLE_CLIENT_ID="seu-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-secret"
```

### 6. Configurar Cloudinary

1. Crie conta gratuita: https://cloudinary.com
2. No Dashboard, copie: Cloud Name, API Key, API Secret

Cole no `.env`:

```bash
CLOUDINARY_CLOUD_NAME="seu-cloud-name"
CLOUDINARY_API_KEY="sua-api-key"
CLOUDINARY_API_SECRET="seu-api-secret"
STORAGE_PROVIDER="cloudinary"
```

### 7. Executar migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 8. Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 🎯 Primeiro Uso

### 1. Criar conta

1. Acesse http://localhost:3000/register
2. Crie uma conta com email/senha
3. Ou use "Continuar com Google"

### 2. Configurar API Key do Replicate

1. Faça login
2. Vá para Settings (ainda não há página, mas a API está pronta)
3. Via API (por enquanto):

```bash
curl -X POST http://localhost:3000/api/user/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "replicate",
    "apiKey": "r8_sua_api_key_aqui",
    "name": "Minha API Key Replicate"
  }'
```

**Ou crie uma página de settings** seguindo o padrão dos outros componentes!

### 3. Gerar primeira imagem

1. Acesse `/dashboard/image-generator`
2. Digite um prompt
3. Gere!

A imagem será:
- ✅ Gerada pelo Replicate
- ✅ Armazenada no Cloudinary (permanente)
- ✅ Salva no seu histórico

---

## 📝 Configurações Opcionais

### GitHub OAuth (Opcional)

```bash
GITHUB_ID="seu-client-id"
GITHUB_SECRET="seu-secret"
```

### Magic Link - Gmail (Opcional)

```bash
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="seu-email@gmail.com"
EMAIL_SERVER_PASSWORD="senha-de-app"
EMAIL_FROM="noreply@influencerai.com"
```

---

## 🐛 Problemas Comuns

### "Prisma Client not generated"

```bash
npx prisma generate
```

### "ENCRYPTION_KEY não configurada"

Deve ter exatamente 64 caracteres hex:

```bash
openssl rand -hex 32
```

### "API key do Replicate não configurada"

Configure via API (veja acima) ou crie uma página de settings.

---

## ✅ Checklist Mínimo

- [ ] `npm install`
- [ ] `.env` configurado (DATABASE_URL, NEXTAUTH_SECRET, ENCRYPTION_KEY)
- [ ] Google OAuth configurado
- [ ] Cloudinary configurado
- [ ] `npx prisma migrate dev`
- [ ] `npm run dev`
- [ ] Conta criada
- [ ] API key do Replicate adicionada

---

## 🎉 Pronto!

Seu InfluencerAI está funcionando com:

✅ Autenticação multi-provider
✅ Senhas criptografadas (bcrypt)
✅ API keys criptografadas (AES-256-GCM)
✅ Storage permanente (Cloudinary)
✅ Histórico por usuário
✅ Arquitetura SOLID

**Para setup completo**, veja: [SETUP.md](./SETUP.md)
**Para detalhes da implementação**, veja: [IMPLEMENTACAO-COMPLETA.md](./IMPLEMENTACAO-COMPLETA.md)
