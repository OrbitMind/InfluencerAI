# InfluencerAI - Base de Conhecimento Completa

## 1. Visao Geral do Projeto

**Nome:** InfluencerAI
**Descricao:** Plataforma para criacao de influenciadores digitais com IA. Permite gerar imagens (avatares) e videos promocionais usando modelos de IA do Replicate, com refinamento de prompts via OpenAI ou Google Gemini.
**Stack principal:** Next.js 16, React 19, TypeScript, Prisma 7, PostgreSQL, TailwindCSS 4, NextAuth.js 4
**Tema padrao:** Dark mode
**Idioma da interface:** Portugues brasileiro
**Deploy:** Preparado para Vercel (usa Vercel Analytics)

---

## 2. Arquitetura e Padroes

O projeto segue principios SOLID com arquitetura em camadas:

- **Camada de Apresentacao:** Componentes React (components/) e paginas (app/)
- **Camada de Contexto:** React Context API para gerenciamento de estado global (lib/context/)
- **Camada de Hooks:** Custom hooks para logica de UI (lib/hooks/)
- **Camada de Servicos:** Logica de negocio (lib/services/)
- **Camada de Repositorios:** Acesso a dados via Prisma (lib/repositories/)
- **Camada de API:** Route handlers do Next.js (app/api/)

**Design Patterns utilizados:**
- Factory Pattern (StorageServiceFactory, PromptRefinerFactory)
- Strategy Pattern (prompt refiners OpenAI/Google)
- Singleton Pattern (servicos e conexao Prisma)
- Facade Pattern (usePromptRefinement)
- Composition Pattern (DashboardLayout com providers aninhados)
- Higher-Order Function (withAuth para protecao de rotas API)

---

## 3. Estrutura de Diretorios

```
app/
  page.tsx                          -> Landing page publica
  layout.tsx                        -> Root layout (SessionProvider + ThemeProvider + Toaster)
  globals.css                       -> Estilos globais (TailwindCSS)
  (auth)/
    layout.tsx                      -> Layout das paginas de autenticacao
    login/page.tsx                  -> Pagina de login
    register/page.tsx               -> Pagina de registro
    forgot-password/page.tsx        -> Pagina de esqueceu senha
    reset-password/page.tsx         -> Pagina de redefinir senha
    verify-email/page.tsx           -> Pagina de verificacao de email (magic link)
  dashboard/
    layout.tsx                      -> Layout do dashboard (Sidebar + Header + Providers)
    page.tsx                        -> Painel principal (stats, acoes rapidas, historico recente)
    image-generator/page.tsx        -> Pagina de geracao de imagens
    video-generator/page.tsx        -> Pagina de geracao de videos
    history/page.tsx                -> Historico de geracoes
    settings/page.tsx               -> Configuracoes
  api/
    auth/
      forgot-password/route.ts     -> POST: envia email de recuperacao
      reset-password/route.ts      -> POST: redefine senha com token
    history/
      route.ts                     -> GET: lista historico paginado
      [id]/route.ts                -> GET: busca geracao | DELETE: deleta geracao
    refine-prompt/route.ts         -> POST: refina prompt via OpenAI ou Gemini
    replicate/
      generate-image/route.ts      -> POST: gera imagem via Replicate
      generate-video/route.ts      -> POST: gera video via Replicate
      models/route.ts              -> GET: busca modelos disponiveis
    user/
      register/route.ts            -> POST: registra novo usuario
      profile/route.ts             -> GET: perfil | PATCH: atualiza perfil
      api-keys/
        route.ts                   -> GET: lista chaves | POST: salva chave
        [id]/route.ts              -> DELETE: deleta chave

components/
  auth/                            -> Componentes de autenticacao
  dashboard/                       -> Componentes do painel
  image-generator/                 -> Componentes do gerador de imagens
  video-generator/                 -> Componentes do gerador de videos
  layout/                          -> Header, Sidebar, MobileNav
  providers/                       -> SessionProvider, ThemeProvider
  settings/                        -> Componentes de configuracoes
  shared/                          -> Componentes reutilizaveis
  ui/                              -> Componentes shadcn/ui

lib/
  auth/config.ts                   -> Configuracao NextAuth
  db.ts                            -> Conexao Prisma (singleton)
  constants.ts                     -> Constantes globais
  context/                         -> React Contexts
  hooks/                           -> Custom hooks
  repositories/                    -> Data access layer
  services/                        -> Business logic layer
  types/                           -> TypeScript types/interfaces
  utils/                           -> Funcoes utilitarias

prisma/
  schema.prisma                    -> Schema do banco de dados

middleware.ts                      -> Protecao de rotas com NextAuth
```

---

## 4. Paginas e Rotas

### 4.1 Paginas Publicas

**/ (Landing Page)**
- Apresentacao do produto InfluencerAI
- Secoes: Hero, Features (Geracao de Imagem, Criacao de Video, Multiplos Modelos), Workflow em 2 etapas, Seguranca
- CTA para /dashboard e /dashboard/settings
- Header com logo e botao "Comecar"

### 4.2 Paginas de Autenticacao (grupo (auth))

Layout proprio com header simples (logo) e footer.

**/login**
- Login social (Google OAuth, GitHub OAuth)
- Tabs para alternar entre: Email/Senha e Magic Link
- Link para /register e /forgot-password

**/register**
- Registro social (Google, GitHub)
- Formulario: nome, email, senha (minimo 6 caracteres)
- Validacao com Zod
- Link para /login

**/forgot-password**
- Formulario com campo de email
- Envia link de recuperacao via Resend
- Nao revela se email existe (seguranca)

**/reset-password**
- Recebe token via query string
- Formulario para nova senha
- Token expira em 1 hora

**/verify-email**
- Tela de confirmacao apos envio de magic link

### 4.3 Paginas do Dashboard (protegidas)

Layout com Sidebar fixa (desktop), MobileNav (mobile), Header e 5 providers aninhados:
ReplicateProvider > OpenAIProvider > GoogleProvider > LLMProvider > GenerationProvider

**/dashboard**
- Cards de estatisticas: imagens geradas, videos criados, status da API
- Alerta caso API Replicate nao esteja configurada
- Acoes rapidas (links para gerador de imagem, video, configuracoes)
- Passos do workflow (1. Gerar Avatar, 2. Criar Video)
- Geracoes recentes

**/dashboard/image-generator**
- Painel completo de geracao de imagens
- Componentes: ModelSelector, PromptInput, AspectRatioSelector, ImagePreview
- Permite selecionar modelo, escrever prompt, escolher aspect ratio
- Botao de refinamento de prompt (usa OpenAI ou Gemini)
- Exibe preview da imagem gerada
- Modelo padrao: black-forest-labs/flux-schnell

**/dashboard/video-generator**
- Painel completo de geracao de videos
- Componentes: VideoModelSelector, ProductPromptInput, SourceImageSelector, VideoPreview
- Campos: nome do produto, descricao, call-to-action, prompt adicional
- Pode usar imagem gerada anteriormente como source
- Modelo padrao: tencent/hunyuan-video

**/dashboard/history**
- Grid de cards com todas as geracoes
- Filtro por tipo: Todos, Imagens, Videos
- Cada card mostra: preview (imagem/video), tipo, prompt, tempo relativo
- Botoes: download, limpar tudo
- Tempo relativo em portugues (date-fns com locale ptBR)

**/dashboard/settings**
- Secoes de configuracao organizadas em cards:
  1. **ReplicateApiSettings:** Configurar API key do Replicate
  2. **PromptRefinerSettings:** Configurar chaves OpenAI/Google e modelo de refinamento
  3. **AppearanceSettings:** Tema (claro/escuro/sistema)
  4. **DataManagementSettings:** Gerenciamento de dados
  5. **AboutSettings:** Informacoes do app

---

## 5. Sistema de Autenticacao

### Configuracao (NextAuth.js v4)

**Providers configurados:**
1. **Credentials** - Email e senha com hash bcrypt (fator 12)
2. **Google OAuth** - Requer GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
3. **GitHub OAuth** - Requer GITHUB_ID e GITHUB_SECRET
4. **Magic Link (Email)** - Via Resend, template HTML customizado

**Estrategia de sessao:** JWT (30 dias de duracao)

**Callbacks:**
- jwt: adiciona user.id ao token
- session: adiciona token.id ao session.user

**Paginas customizadas:**
- signIn: /login
- signOut: /
- error: /login
- verifyRequest: /verify-email

### Middleware de Protecao

O middleware do NextAuth protege TODAS as rotas exceto:
- /api/auth/* (rotas de auth do NextAuth)
- /api/user/register (registro publico)
- /_next/* (arquivos estaticos)
- /favicon.ico
- /login, /register, /verify-email
- / (homepage)

### Utilitario withAuth (Higher-Order Function)

Todas as API routes protegidas usam o wrapper withAuth que:
1. Verifica sessao via getServerSession
2. Extrai userId do token JWT
3. Passa userId no contexto para o handler
4. Retorna 401 se nao autenticado

---

## 6. Banco de Dados (PostgreSQL + Prisma 7)

### Conexao

Usa Prisma 7 com adapter PostgreSQL (@prisma/adapter-pg). Singleton com cache global para evitar multiplas instancias em dev (hot reload). Connection string via DATABASE_URL.

### Modelos

**User (tabela: users)**
- id (cuid), name, email (unique), emailVerified, image, password (hash bcrypt, opcional)
- Relacoes: accounts[], sessions[], apiKeys[], generations[]
- createdAt, updatedAt

**Account (tabela: accounts)**
- Modelo padrao do NextAuth para OAuth
- provider + providerAccountId (unique compound)
- Guarda tokens OAuth (access_token, refresh_token, id_token)
- Cascade delete com User

**Session (tabela: sessions)**
- Modelo padrao do NextAuth
- sessionToken (unique), expires
- Cascade delete com User

**VerificationToken (tabela: verification_tokens)**
- Para magic link: identifier + token (unique compound)
- expires para controle de validade

**PasswordResetToken (tabela: password_reset_tokens)**
- email, token (unique), expires
- Compound unique: email + token
- Tokens expiram em 1 hora

**ApiKey (tabela: api_keys)**
- userId, provider ("replicate" | "openai" | "google")
- Dados criptografados: encrypted (hex), iv (hex), authTag (hex)
- name (nome amigavel), lastUsed
- Index composto: userId + provider
- Cascade delete com User

**Generation (tabela: generations)**
- userId, type ("image" | "video"), modelId
- prompt (Text), settings (JSON)
- outputUrl (URL permanente no Cloudinary), publicId (para delete)
- thumbnailUrl (para videos), fileSize, width, height, duration
- Indices: userId+type, userId+createdAt
- Cascade delete com User

---

## 7. Camada de Servicos (Business Logic)

### 7.1 ApiKeyService
- **saveApiKey:** Salva ou atualiza chave de API para um provider. Se ja existir, deleta a antiga e cria nova (garante nova criptografia)
- **getApiKey:** Retorna chave descriptografada e atualiza lastUsed
- **deleteApiKey:** Remove chave
- **listApiKeys:** Lista todas as chaves sem expor dados sensiveis
- **hasApiKey:** Verifica se tem chave configurada para um provider

### 7.2 AESEncryptionService
- Criptografia AES-256-GCM (padrao militar)
- Chave de 256 bits derivada da env ENCRYPTION_KEY (64 hex chars)
- Cada criptografia gera IV aleatorio unico (16 bytes)
- Authentication tag para integridade dos dados
- Retorna: encrypted (hex), iv (hex), authTag (hex)

### 7.3 GenerationService
- **createGeneration:** Recebe URL temporaria do Replicate, faz upload para storage permanente (Cloudinary/S3), salva metadata no banco
- **getHistory:** Retorna historico paginado (default 20 por pagina), filtravel por tipo
- **deleteGeneration:** Remove do storage E do banco
- **getGeneration:** Busca geracao especifica
- **getStats:** Retorna contagem de imagens e videos

### 7.4 ImageGenerationService (client-side)
- Singleton que faz POST para /api/replicate/generate-image
- Recebe modelId, prompt, apiKey e opcoes opcionais
- Retorna APIResponse com dados da geracao

### 7.5 VideoGenerationService (client-side)
- Singleton que faz POST para /api/replicate/generate-video
- Recebe modelId, prompt, imageUrl (opcional), apiKey
- Retorna APIResponse com dados da geracao

### 7.6 ReplicateModelsService (server-side)
- Busca modelos da API Replicate (api.replicate.com/v1)
- Busca por colecoes: text-to-image, image-generation, diffusion-models (imagem); text-to-video, image-to-video, video-generation (video)
- Busca por texto com multiplas queries e paginacao (ate 15 paginas)
- fetchWithFallback: primeiro tenta colecoes, se poucos resultados usa busca por texto
- fetchAllModels: busca em paralelo colecoes + todas as queries

### 7.7 Pipeline de Processamento de Modelos (Catalogo Dinamico)
O sistema possui um catalogo dinamico que busca modelos em tempo real da API Replicate, resultando em aproximadamente 111 modelos de imagem e 78 modelos de video disponiveis para o usuario. Alem dos 5 modelos estaticos de imagem e 4 de video (usados como fallback), o sistema busca centenas de modelos da API e os processa em 4 etapas:

1. **ReplicateModelsService** - Busca modelos em paralelo de 3 colecoes por tipo + 5 queries de busca por tipo, com paginacao de ate 15 paginas por query
2. **ModelDeduplicatorService** - Remove modelos duplicados baseado em owner/name (Set de IDs unicos)
3. **ModelTransformerService** - Transforma para formato interno (TransformedModel) com nome formatado, descricao truncada (120 chars), filtra modelos sem latest_version
4. **ModelSorterService** - Ordena por popularidade (run_count decrescente), tambem suporta ordenacao por nome e provider

**ModelFilterService** (usado para filtragem adicional):
- Classifica modelos como "image" ou "video" por analise de keywords no nome, descricao e owner
- Keywords de video: video, vid, animation, movie, film, motion, animate, clip
- Keywords de imagem: image, img, photo, picture, diffusion, flux, sdxl, stable-diffusion
- Logica inteligente: verifica se e explicitamente "to-image" vs "to-video" para evitar classificacao errada

**Colecoes buscadas:**
- Imagem: text-to-image, image-generation, diffusion-models
- Video: text-to-video, image-to-video, video-generation

**Queries de busca:**
- Imagem: "image generation", "text-to-image", "stable diffusion", "flux", "image model"
- Video: "video generation", "text-to-video", "image-to-video", "video model", "video ai"

**Tipos do Replicate:**
- ReplicateModel: dados brutos da API (owner, name, description, run_count, cover_image_url, latest_version)
- TransformedModel: formato processado para UI (id como owner/name, nome formatado, runCount, coverImage)
- ReplicateCollectionResponse: resposta de colecao (slug, models[])
- ReplicateSearchResponse: resposta de busca com paginacao (results[], next, previous)

### 7.8 Prompt Refiners (Strategy Pattern)
Factory cria o refiner baseado no provider:

**OpenAIPromptRefiner:**
- Usa API OpenAI Chat Completions
- Modelo padrao: gpt-4o-mini
- System prompt especializado por tipo (imagem/video)
- Temperature 0.7, max 500 tokens

**GooglePromptRefiner:**
- Usa API Google Gemini (generateContent)
- Modelo padrao: gemini-1.5-flash
- Mesmo system prompt, adaptado para formato Gemini
- Temperature 0.7, max 500 tokens

### 7.9 Storage Services (Factory Pattern)

**CloudinaryStorageService (padrao):**
- Upload com auto-detect de tipo
- Organiza em pastas: influencer-ai/{userId}/
- Gera thumbnail automatico para videos (primeiro frame, 400px)
- Suporta transformacoes e otimizacao automatica

**S3StorageService (alternativo):**
- Upload para AWS S3 com ACL public-read
- Suporte a CloudFront como CDN
- Gera key unica: {userId}/{timestamp}-{random}.{ext}

Troca de provider via variavel de ambiente STORAGE_PROVIDER ('cloudinary' ou 's3').

---

## 8. React Contexts (Estado Global)

### 8.1 ReplicateContext
- Gerencia API key do Replicate
- Persiste em localStorage (chave: replicate_api_key)
- Expoe: apiKey, setApiKey, clearApiKey, isConfigured

### 8.2 OpenAIContext
- Gerencia API key do OpenAI
- Persiste em localStorage (chave: openai_api_key)
- Expoe: apiKey, setApiKey, clearApiKey, isConfigured

### 8.3 GoogleContext
- Gerencia API key do Google
- Persiste em localStorage (chave: google_api_key)
- Expoe: apiKey, setApiKey, clearApiKey, isConfigured

### 8.4 LLMContext
- Gerencia modelo de LLM selecionado para refinamento
- Persiste em localStorage (chave: refiner_model)
- Expoe: selectedModel, setSelectedModel
- Modelos disponiveis: GPT-4o Mini, GPT-4o, GPT-4 Turbo, Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini 2.0 Flash

### 8.5 GenerationContext
- Gerencia estado de geracao em memoria (nao persiste)
- generatedImageUrl: URL da ultima imagem gerada (compartilhada entre geradores)
- history: array de geracoes da sessao atual
- addToHistory: adiciona item com ID unico (crypto.randomUUID)
- clearHistory: limpa todo o historico

**Hierarquia de providers no DashboardLayout:**
ReplicateProvider > OpenAIProvider > GoogleProvider > LLMProvider > GenerationProvider

---

## 9. Custom Hooks

### 9.1 useImageGeneration
- Estado: modelId, prompt, isLoading, imageUrl, error, generatedAt, requestId
- Modelo padrao: black-forest-labs/flux-schnell
- Usa imageGenerationService para chamada API
- Ao gerar com sucesso: atualiza generatedImageUrl no contexto (para o gerador de video usar) e adiciona ao historico

### 9.2 useVideoGeneration
- Estado: modelId, productName, productDescription, callToAction, additionalPrompt, sourceImageUrl, isLoading, videoUrl, error
- Modelo padrao: tencent/hunyuan-video
- Monta prompt combinando: productName + productDescription + callToAction + additionalPrompt
- Pode usar generatedImageUrl do contexto como imagem source
- Usa videoGenerationService para chamada API

### 9.3 usePromptRefinement (Facade)
- Combina OpenAI, Google e LLM contexts
- Determina se pode refinar baseado no provider do modelo selecionado
- Retorna: canRefine, activeApiKey, activeProvider, selectedModel

### 9.4 useReplicateModels (Catalogo Dinamico)
- Busca modelos do Replicate via API GET /api/replicate/models com header x-replicate-api-key
- Recebe parametro type ("image" | "video") para filtrar
- Usa modelos estaticos como fallback (IMAGE_MODELS ou VIDEO_MODELS) quando nao tem API key ou em caso de erro
- Fetch automatico na primeira renderizacao quando apiKey esta disponivel (useEffect com ref hasFetched)
- Funcao searchModels: busca por texto na API (acionada ao pressionar Enter no campo de busca)
- Funcao refetch: recarrega todos os modelos do zero
- Retorna: models[], isLoading, error, searchModels(), refetch(), totalCount
- Na UI, o totalCount aparece como badge "X modelos" no seletor (ex: "111 modelos" para imagem, "78 modelos" para video)
- Os seletores ModelSelector e VideoModelSelector exibem: nome formatado, descricao, ID (owner/name), run count formatado (1.2M, 45.3K), e um botao "Atualizar" para refetch

### 9.5 usePromptRefiner
- Logica de refinamento de prompt via API /api/refine-prompt

---

## 10. API Routes (Endpoints)

### 10.1 Autenticacao

**POST /api/user/register** (publico)
- Body: { name, email, password }
- Validacao: nome obrigatorio, email valido, senha min 6 chars
- Verifica duplicidade de email
- Retorna usuario criado (sem senha)

**POST /api/auth/forgot-password** (publico)
- Body: { email }
- Gera token seguro (32 bytes hex), expira em 1 hora
- Envia email via Resend com link para /reset-password?token=xxx
- Sempre retorna sucesso (nao revela se email existe)

**POST /api/auth/reset-password** (publico)
- Body: { token, password }
- Valida token e expiracao
- Atualiza senha com hash bcrypt
- Deleta token apos uso

### 10.2 Perfil do Usuario

**GET /api/user/profile** (autenticado)
- Retorna dados do usuario (sem senha)

**PATCH /api/user/profile** (autenticado)
- Body: { name?, image? }
- Atualiza nome e/ou imagem

### 10.3 API Keys

**GET /api/user/api-keys** (autenticado)
- Lista todas as chaves do usuario
- Retorna: id, provider, name, lastUsed, createdAt (sem dados criptografados)

**POST /api/user/api-keys** (autenticado)
- Body: { provider: 'replicate'|'openai'|'google', apiKey, name? }
- Se ja existir chave para o provider, substitui (nova criptografia)
- Retorna: id, provider, name

**DELETE /api/user/api-keys/:id** (autenticado)
- Deleta chave especifica

### 10.4 Geracao de Conteudo

**POST /api/replicate/generate-image** (autenticado)
- Body: { modelId, prompt, aspectRatio?, width?, height? }
- Fluxo: busca API key do Replicate do usuario (descriptografada) > gera imagem via Replicate SDK > faz upload para Cloudinary > salva no banco
- Retorna: { id, imageUrl, prompt, modelId, createdAt }

**POST /api/replicate/generate-video** (autenticado)
- Body: { modelId, prompt, imageUrl?, duration? }
- Mesmo fluxo da imagem, adaptado para video
- Se imageUrl fornecida, passa como input.image para o modelo
- Retorna: { id, videoUrl, thumbnailUrl, prompt, modelId, createdAt }

**GET /api/replicate/models** (usa header x-replicate-api-key)
- Query params: type ('image'|'video'), query (busca por texto)
- Pipeline: busca modelos > deduplica > transforma > ordena por popularidade
- Retorna: { models[], total }

### 10.5 Refinamento de Prompt

**POST /api/refine-prompt** (publico, requer API key no body)
- Body: { prompt, type, apiKey?, googleApiKey?, model?, provider? }
- Usa PromptRefinerFactory para criar refiner do provider correto
- Provider padrao: openai
- Retorna: { refinedPrompt }

### 10.6 Historico

**GET /api/history** (autenticado)
- Query params: type? ('image'|'video'), page (default 1), limit (default 20, max 100)
- Retorna: items[] + pagination { page, limit, total, totalPages }

**GET /api/history/:id** (autenticado)
- Retorna geracao especifica do usuario

**DELETE /api/history/:id** (autenticado)
- Deleta geracao do storage (Cloudinary/S3) E do banco

---

## 11. Integracoes Externas

### 11.1 Replicate
- **Uso:** Geracao de imagens e videos com modelos de IA
- **SDK:** replicate v1.4.0
- **Autenticacao:** API key por usuario, armazenada criptografada no banco
- **Modelos de imagem padrao:** Flux Pro, Flux Schnell, Flux Dev (Black Forest Labs), Stable Diffusion 3 (Stability AI), SDXL Lightning (ByteDance)
- **Modelos de video padrao:** HunyuanVideo (Tencent), MiniMax Video, Luma Ray, Mochi 1 (Genmo)
- **Busca dinamica:** Tambem busca modelos dinamicamente via API Replicate (colecoes + busca por texto)

### 11.2 OpenAI
- **Uso:** Refinamento de prompts
- **Endpoint:** Chat Completions (v1/chat/completions)
- **Modelos disponiveis:** GPT-4o Mini (padrao), GPT-4o, GPT-4 Turbo
- **API key:** Armazenada em localStorage no client

### 11.3 Google Gemini
- **Uso:** Refinamento de prompts (alternativa ao OpenAI)
- **Endpoint:** generateContent via API REST
- **Modelos disponiveis:** Gemini 1.5 Flash (padrao), Gemini 1.5 Pro, Gemini 2.0 Flash
- **API key:** Armazenada em localStorage no client

### 11.4 Cloudinary (Storage padrao)
- **Uso:** Armazenamento permanente de imagens e videos gerados
- **Funcionalidades:** Upload, delete, transformacoes, thumbnails automaticos para video
- **Organizacao:** Pasta influencer-ai/{userId}/
- **Config:** CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

### 11.5 AWS S3 (Storage alternativo)
- **Uso:** Storage alternativo ao Cloudinary
- **Suporte a CloudFront** como CDN
- **Config:** AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, CLOUDFRONT_DOMAIN
- **Ativar:** STORAGE_PROVIDER=s3

### 11.6 Resend
- **Uso:** Envio de emails transacionais
- **Emails:** Magic link de login, recuperacao de senha
- **Templates:** HTML inline customizados com branding InfluencerAI
- **Config:** RESEND_API_KEY, EMAIL_FROM

### 11.7 Vercel Analytics
- Integrado no root layout
- Coleta analytics automaticamente

---

## 12. Variaveis de Ambiente Necessarias

```
# Banco de dados
DATABASE_URL=                      # Connection string PostgreSQL

# NextAuth
NEXTAUTH_URL=                      # URL base da aplicacao (ex: http://localhost:3000)
NEXTAUTH_SECRET=                   # Secret para JWT (gerar com: openssl rand -base64 32)

# OAuth - Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth - GitHub
GITHUB_ID=
GITHUB_SECRET=

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=                        # Ex: noreply@seudominio.com

# Criptografia de API Keys
ENCRYPTION_KEY=                    # 64 caracteres hex (gerar com: openssl rand -hex 32)

# Storage - Cloudinary (padrao)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Storage - S3 (alternativo)
STORAGE_PROVIDER=cloudinary        # ou 's3'
AWS_S3_BUCKET=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
CLOUDFRONT_DOMAIN=                 # Opcional
```

---

## 13. Fluxo Principal do Usuario

### Fluxo de Geracao de Imagem
1. Usuario faz login (credenciais, Google, GitHub ou magic link)
2. Configura API key do Replicate em /dashboard/settings
3. Acessa /dashboard/image-generator
4. Seleciona modelo de IA (ex: Flux Schnell)
5. Escreve prompt descrevendo o influenciador
6. (Opcional) Refina prompt com OpenAI/Gemini se configurado
7. Escolhe aspect ratio
8. Clica em gerar
9. Frontend envia POST para /api/replicate/generate-image
10. Backend busca API key do Replicate descriptografada do banco
11. Backend gera imagem via SDK Replicate
12. Backend faz upload para Cloudinary/S3
13. Backend salva metadata no banco (Generation)
14. Frontend recebe URL permanente e exibe preview
15. Imagem fica disponivel no historico

### Fluxo de Geracao de Video
1. (Opcional) Gera imagem primeiro - a URL fica salva no GenerationContext
2. Acessa /dashboard/video-generator
3. Seleciona modelo de video (ex: HunyuanVideo)
4. Preenche: nome do produto, descricao, CTA, prompt adicional
5. (Opcional) Seleciona imagem source (usa a gerada anteriormente ou URL custom)
6. Clica em gerar
7. Frontend monta prompt combinado e envia POST para /api/replicate/generate-video
8. Mesmo fluxo backend da imagem, adaptado para video
9. Cloudinary gera thumbnail automatico do primeiro frame
10. Frontend recebe URL do video + thumbnail

### Fluxo de Recuperacao de Senha
1. Usuario acessa /forgot-password
2. Informa email
3. Backend gera token seguro, salva no banco (1h expiracao)
4. Email enviado via Resend com link /reset-password?token=xxx
5. Usuario clica no link, informa nova senha
6. Backend valida token, atualiza senha com hash bcrypt, deleta token

---

## 14. Seguranca

- **Senhas:** Hash bcrypt com fator 12, nunca retornadas nas APIs
- **API Keys dos usuarios:** Criptografadas com AES-256-GCM no banco (encrypted + iv + authTag)
- **Chave de criptografia:** Derivada de ENCRYPTION_KEY (env), 256 bits
- **Sessoes:** JWT com duracao de 30 dias
- **Protecao de rotas:** Middleware NextAuth + wrapper withAuth nas API routes
- **Validacao de input:** Zod em todas as API routes
- **Tokens de reset:** crypto.randomBytes(32), expiracao de 1 hora
- **Enumeracao de emails:** API de forgot-password sempre retorna sucesso
- **Cascade delete:** Deletar usuario remove accounts, sessions, api keys e geracoes
- **Dados sensiveis:** API keys nunca retornadas na listagem (select explicito no Prisma)

---

## 15. Componentes Principais

### Layout
- **Header:** Logo InfluencerAI + navegacao
- **Sidebar:** Menu lateral fixo no desktop com links para dashboard, imagem, video, historico, configuracoes
- **MobileNav:** Menu hamburguer para mobile

### Auth
- **LoginForm:** Formulario email/senha com react-hook-form + Zod
- **RegisterForm:** Formulario de registro com validacao
- **SocialAuthButtons:** Botoes Google e GitHub OAuth
- **MagicLinkForm:** Campo de email para magic link

### Image Generator
- **ImageGeneratorPanel:** Painel principal orquestrando todos os subcomponentes
- **ModelSelector:** Dropdown com modelos de imagem (estaticos + dinamicos do Replicate)
- **PromptInput:** Textarea para prompt + botao de refinamento
- **AspectRatioSelector:** Selecao de proporcao da imagem
- **ImagePreview:** Exibicao da imagem gerada com opcoes de download

### Video Generator
- **VideoGeneratorPanel:** Painel principal orquestrando subcomponentes
- **VideoModelSelector:** Dropdown com modelos de video
- **ProductPromptInput:** Campos de produto (nome, descricao, CTA, prompt adicional)
- **SourceImageSelector:** Selecao de imagem source (URL ou imagem gerada)
- **VideoPreview:** Player de video com controles

### Settings
- **ReplicateApiSettings:** Input para API key do Replicate
- **PromptRefinerSettings:** Configuracao de OpenAI/Google keys + selecao de modelo LLM
- **AppearanceSettings:** Toggle de tema
- **DataManagementSettings:** Gerenciamento de dados locais
- **AboutSettings:** Versao e informacoes

### Shared
- **ApiKeyInput:** Input mascarado para chaves de API
- **ErrorMessage:** Exibicao padronizada de erros
- **LoadingSpinner:** Spinner de carregamento
- **ProgressIndicator:** Barra de progresso

### UI (shadcn/ui)
Biblioteca completa de componentes: Button, Card, Dialog, Tabs, Input, Select, Accordion, Toast, Dropdown, Sidebar, Badge, e muitos outros. Baseados em Radix UI + TailwindCSS.

---

## 16. Dependencias Principais

| Dependencia | Versao | Uso |
|---|---|---|
| next | 16.0.10 | Framework React fullstack |
| react | 19.2.0 | Biblioteca de UI |
| typescript | 5.x | Tipagem estatica |
| prisma | 7.3.0 | ORM para PostgreSQL |
| next-auth | 4.24.13 | Autenticacao |
| replicate | 1.4.0 | SDK da API Replicate |
| cloudinary | 2.9.0 | SDK do Cloudinary |
| resend | 6.9.1 | Envio de emails |
| bcryptjs | 3.0.3 | Hash de senhas |
| zod | 3.25.76 | Validacao de schemas |
| react-hook-form | 7.60.0 | Gerenciamento de formularios |
| tailwindcss | 4.1.9 | Framework CSS |
| lucide-react | 0.454.0 | Icones |
| date-fns | 4.1.0 | Formatacao de datas |
| recharts | 2.15.4 | Graficos |
| next-themes | 0.4.6 | Gerenciamento de temas |
| sonner | 1.7.4 | Toast notifications |
| @vercel/analytics | 1.3.1 | Analytics |

---

## 17. Modelos de IA Disponiveis

### Catalogo Dinamico do Replicate (~111 imagem, ~78 video)

O sistema possui um catalogo dinamico que busca modelos em tempo real da API Replicate. Ao carregar a pagina do gerador de imagem ou video, o hook useReplicateModels faz uma requisicao automatica para GET /api/replicate/models, que busca em paralelo modelos de 3 colecoes + 5 queries de busca, depois deduplica, transforma e ordena por popularidade. O resultado e exibido em um dropdown com badge mostrando o total (ex: "111 modelos" para imagem, "78 modelos" para video). O usuario tambem pode buscar modelos adicionais digitando no campo de busca e pressionando Enter.

Se a API key do Replicate nao estiver configurada ou ocorrer erro, o sistema usa os modelos estaticos como fallback.

### Modelos de Imagem - Fallback Estatico (5 modelos)

1. **Flux Pro** (black-forest-labs/flux-pro) - Alta qualidade
2. **Flux Schnell** (black-forest-labs/flux-schnell) - Rapido (PADRAO)
3. **Flux Dev** (black-forest-labs/flux-dev) - Desenvolvimento
4. **Stable Diffusion 3** (stability-ai/stable-diffusion-3) - Ultima versao SD
5. **SDXL Lightning** (bytedance/sdxl-lightning-4step) - Ultra rapido em 4 passos

### Modelos de Video - Fallback Estatico (4 modelos)

1. **HunyuanVideo** (tencent/hunyuan-video) - Open source da Tencent (PADRAO)
2. **MiniMax Video** (minimax/video-01) - Alta qualidade
3. **Luma Ray** (luma/ray) - Fotorrealista
4. **Mochi 1** (genmo/mochi-1-preview) - Open source

### Modelos de Refinamento de Prompt (LLM - 6 modelos)

1. **GPT-4o Mini** (OpenAI) - Rapido e economico (PADRAO)
2. **GPT-4o** (OpenAI) - Mais inteligente
3. **GPT-4 Turbo** (OpenAI) - Alta performance
4. **Gemini 1.5 Flash** (Google) - Rapido
5. **Gemini 1.5 Pro** (Google) - Mais capaz
6. **Gemini 2.0 Flash** (Google) - Experimental

---

## 18. System Prompts de Refinamento

### Para Imagens
O refiner transforma descricoes simples em prompts detalhados incluindo: iluminacao, composicao, estilo fotografico, caracteristicas faciais, expressoes, poses, vestuario, acessorios, cenario e termos tecnicos de fotografia. Responde em ingles para melhor compatibilidade com modelos.

### Para Videos
O refiner otimiza prompts para video incluindo: movimentos, expressoes faciais, gestos, iluminacao, angulos de camera, transicoes, foco no produto e mensagem de marketing. Mantem tom natural e envolvente.

---

## 19. Observacoes Tecnicas

- **Armazenamento hibrido de API keys:** As chaves do Replicate, OpenAI e Google sao armazenadas TANTO em localStorage (client-side, para uso imediato nos contextos) QUANTO criptografadas no banco (server-side, para uso nas API routes autenticadas). As API routes de geracao buscam a chave do banco, nao do client.
- **API de modelos Replicate usa header:** A rota GET /api/replicate/models recebe a API key via header x-replicate-api-key, nao via sessao do banco. Isso indica que essa rota pode estar usando a chave do localStorage diretamente.
- **API de refinamento e publica:** A rota POST /api/refine-prompt nao usa withAuth, recebe API keys diretamente no body. O refinamento acontece server-side mas com chaves do client.
- **Prisma 7 com adapter:** Usa o novo pattern do Prisma 7 com PrismaPg adapter ao inves de connection string direto no PrismaClient.
- **Next.js 16:** Versao mais recente do Next.js, usa App Router exclusivamente.
- **React 19:** Usa recursos mais recentes do React.
