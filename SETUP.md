# 🚀 Setup - InfluencerAI

Guia completo para configurar e executar o projeto InfluencerAI com autenticação e persistência.

---

## 📋 Pré-requisitos

- **Node.js** 18+ e npm
- **PostgreSQL** (recomendado: Supabase gratuito)
- Contas nas plataformas de OAuth (Google, GitHub)
- Conta no Cloudinary (gratuita)
- Servidor SMTP para Magic Links (Gmail, SendGrid, etc.)

---

## 🔧 Passo 1: Instalação de Dependências

```bash
npm install
```

Dependências principais instaladas:
- `next-auth` - Autenticação
- `@prisma/client` e `prisma` - ORM e banco de dados
- `bcryptjs` - Hash de senhas
- `cloudinary` - Storage de mídia
- `zod` - Validação de dados
- `sonner` - Notificações toast

---

## 🗄️ Passo 2: Configurar Banco de Dados

### 2.1 Criar banco PostgreSQL no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie a **Connection String** (formato: `postgresql://...`)

### 2.2 Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o `.env` e configure:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

### 2.3 Gerar chave de criptografia

```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Cole o resultado no `.env`:

```bash
ENCRYPTION_KEY="resultado-aqui-64-caracteres"
```

### 2.4 Executar migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Isso criará todas as tabelas necessárias:
- `users` - Usuários
- `accounts` - Contas OAuth
- `sessions` - Sessões
- `verification_tokens` - Magic links
- `api_keys` - API keys criptografadas
- `generations` - Histórico de gerações

---

## 🔐 Passo 3: Configurar Autenticação

### 3.1 NextAuth Secret

Gere um secret aleatório:

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Configure no `.env`:

```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="resultado-aqui"
```

### 3.2 Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie um novo projeto (ou use existente)
3. Vá em **APIs e Serviços > Credenciais**
4. Clique em **Criar credenciais > ID do cliente OAuth**
5. Tipo: **Aplicativo da Web**
6. **URIs de redirecionamento autorizados**:
   - `http://localhost:3000/api/auth/callback/google` (desenvolvimento)
   - `https://seu-dominio.com/api/auth/callback/google` (produção)

Configure no `.env`:

```bash
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret"
```

### 3.3 GitHub OAuth

1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique em **New OAuth App**
3. Preencha:
   - **Application name**: InfluencerAI
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copie **Client ID** e **Client Secret**

Configure no `.env`:

```bash
GITHUB_ID="seu-github-client-id"
GITHUB_SECRET="seu-github-secret"
```

### 3.4 Magic Link (Email sem senha)

#### Opção 1: Gmail (desenvolvimento)

1. Ative **Verificação em duas etapas** na sua conta Google
2. Gere uma **Senha de app** em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Configure no `.env`:

```bash
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="seu-email@gmail.com"
EMAIL_SERVER_PASSWORD="senha-de-app-gerada"
EMAIL_FROM="noreply@influencerai.com"
```

#### Opção 2: SendGrid (produção)

1. Crie conta no [SendGrid](https://sendgrid.com)
2. Crie uma API Key
3. Configure:

```bash
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASSWORD="sua-api-key-sendgrid"
EMAIL_FROM="noreply@seu-dominio.com"
```

---

## ☁️ Passo 4: Configurar Cloudinary

1. Crie conta no [Cloudinary](https://cloudinary.com)
2. Acesse o Dashboard
3. Copie as credenciais (Cloud Name, API Key, API Secret)

Configure no `.env`:

```bash
CLOUDINARY_CLOUD_NAME="seu-cloud-name"
CLOUDINARY_API_KEY="seu-api-key"
CLOUDINARY_API_SECRET="seu-api-secret"
STORAGE_PROVIDER="cloudinary"
```

**Plano gratuito**: 25 GB de storage + 25 GB de bandwidth/mês

---

## ▶️ Passo 5: Executar o Projeto

### Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

### Produção

```bash
npm run build
npm start
```

---

## 🧪 Passo 6: Testar a Implementação

### 6.1 Criar conta de teste

1. Acesse http://localhost:3000/register
2. Crie uma conta com email e senha
3. Ou use login social (Google/GitHub)

### 6.2 Configurar API Key do Replicate

1. Faça login
2. Acesse `/dashboard/settings`
3. Adicione sua API key do Replicate
4. A chave será criptografada com AES-256-GCM

### 6.3 Gerar uma imagem

1. Acesse `/dashboard/image-generator`
2. Digite um prompt
3. Clique em "Gerar"
4. A imagem será:
   - Gerada pelo Replicate
   - Enviada para Cloudinary
   - Salva no banco vinculada ao seu usuário

### 6.4 Verificar histórico

1. Acesse `/dashboard/history`
2. Veja todas as suas gerações
3. Cada geração tem URL permanente do Cloudinary

---

## 📐 Arquitetura Implementada

### Princípios SOLID

✅ **Single Responsibility Principle (SRP)**
- `ApiKeyService` → Apenas lógica de API keys
- `GenerationService` → Apenas lógica de gerações
- `CloudinaryStorageService` → Apenas storage

✅ **Open/Closed Principle (OCP)**
- Interfaces permitem adicionar novos providers sem modificar código

✅ **Liskov Substitution Principle (LSP)**
- Qualquer `IStorageService` pode substituir outro

✅ **Interface Segregation Principle (ISP)**
- Interfaces específicas ao invés de uma genérica

✅ **Dependency Inversion Principle (DIP)**
- Services dependem de abstrações (interfaces)

### Estrutura de Camadas

```
┌─────────────────────────────────────┐
│         API Routes (Controllers)     │  ← Roteamento
├─────────────────────────────────────┤
│         Service Layer               │  ← Lógica de negócio
├─────────────────────────────────────┤
│         Repository Layer            │  ← Acesso a dados
├─────────────────────────────────────┤
│         Database (Prisma)           │  ← Persistência
└─────────────────────────────────────┘
```

---

## 🔒 Segurança Implementada

### API Keys
- Criptografia **AES-256-GCM**
- IV único por chave
- Authentication tags
- Nunca expostas ao cliente

### Senhas
- Hash com **bcrypt** (12 rounds)
- Nunca retornadas em queries
- Comparação segura

### Autenticação
- **JWT** sessions (30 dias)
- CSRF protection (NextAuth)
- Middleware protege rotas automaticamente

---

## 🚀 Deploy (Produção)

### Vercel (Recomendado)

1. Faça push para GitHub
2. Importe projeto no [Vercel](https://vercel.com)
3. Configure variáveis de ambiente
4. Deploy automático!

### Variáveis obrigatórias no Vercel:

```
DATABASE_URL
NEXTAUTH_URL=https://seu-app.vercel.app
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_ID
GITHUB_SECRET
EMAIL_SERVER_HOST
EMAIL_SERVER_PORT
EMAIL_SERVER_USER
EMAIL_SERVER_PASSWORD
EMAIL_FROM
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
STORAGE_PROVIDER
ENCRYPTION_KEY
```

---

## 🔄 Migração Futura para S3

Quando o projeto crescer, trocar para S3 é simples:

1. Configure variáveis AWS no `.env`:

```bash
STORAGE_PROVIDER="s3"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="..."
CLOUDFRONT_DOMAIN="..." # Opcional
```

2. O código já está preparado! A factory pattern troca automaticamente.

---

## 🐛 Troubleshooting

### Erro: "ENCRYPTION_KEY não configurada"
- Gere uma chave com `openssl rand -hex 32`
- Cole no `.env` com exatamente 64 caracteres hex

### Erro: "API key do Replicate não configurada"
- Faça login no dashboard
- Vá em Settings
- Adicione sua API key do Replicate

### Erro: "Prisma Client not generated"
```bash
npx prisma generate
```

### Erro: "Email not sent" (Magic Link)
- Verifique credenciais SMTP no `.env`
- Gmail: Use senha de app, não a senha normal
- Verifique porta (587 para TLS, 465 para SSL)

### Erro: "Cloudinary upload failed"
- Verifique credenciais no `.env`
- Teste no dashboard do Cloudinary

---

## 📚 Recursos Úteis

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Replicate Docs](https://replicate.com/docs)

---

## ✅ Checklist de Setup

- [ ] Banco PostgreSQL criado
- [ ] `.env` configurado
- [ ] Chave de criptografia gerada
- [ ] NextAuth secret gerado
- [ ] Google OAuth configurado
- [ ] GitHub OAuth configurado
- [ ] Magic Link (Email) configurado
- [ ] Cloudinary configurado
- [ ] `npm install` executado
- [ ] `npx prisma migrate dev` executado
- [ ] Servidor rodando (`npm run dev`)
- [ ] Conta de teste criada
- [ ] API key do Replicate adicionada
- [ ] Geração de teste funcionando

---

**Pronto! Seu InfluencerAI está configurado com autenticação completa, persistência segura e storage permanente! 🎉**
