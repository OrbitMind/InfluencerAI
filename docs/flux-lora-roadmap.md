# Roadmap: Personas Sintéticas com Flux LoRA

## Problema que Resolve

O Veo 3.1 (e outros modelos de alto nível) aplicam filtro E005 em fotos reais de rostos humanos.
A solução definitiva é que cada **persona seja um modelo LoRA treinado**, não uma foto.
Um rosto sintético gerado por IA não corresponde a nenhuma pessoa real — sem likeness, sem filtro.

---

## Visão Geral da Arquitetura

```
Usuário define persona
    ↓
[Fase 1] Gera 20-30 imagens base com Flux.1-dev (Replicate)
    ↓
[Fase 2] Treina LoRA com ostris/flux-dev-lora-trainer (Replicate)
    ↓
[Fase 3] Armazena LoRA weights + trigger word na PersonaLoRA (DB)
    ↓
[Geração de Imagem] Flux.1-dev + LoRA weights → imagem da persona
    ↓
[Geração de Vídeo] Wan 2.5 I2V / MiniMax S2V → vídeo com a persona
```

---

## Fase 0: Schema Prisma

### Novo modelo `PersonaLoRA`

```prisma
model PersonaLoRA {
  id             String   @id @default(cuid())
  personaId      String   @unique
  persona        Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)

  // Treinamento
  replicateJobId String?  // ID do job de treinamento no Replicate
  status         String   @default("pending")
  // "pending" | "generating_seeds" | "training" | "ready" | "failed"

  // Resultado
  loraWeightsUrl String?  // URL do arquivo .safetensors no Cloudinary/Replicate
  triggerWord    String?  // ex: "valentinacvx" — palavra que ativa a persona no prompt
  baseModel      String   @default("black-forest-labs/flux-dev")

  // Metadados de qualidade
  seedImagesCount Int     @default(0)
  trainingSteps   Int     @default(1000)
  trainingLoss    Float?  // loss final do treinamento
  previewImageUrl String? // imagem de preview gerada com o LoRA

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("persona_loras")
}
```

### Extensão do modelo `Persona`

```prisma
model Persona {
  // ... campos existentes ...
  lora  PersonaLoRA?
}
```

---

## Fase 1: Geração de Imagens Semente

### Objetivo
Gerar 20-30 imagens de alta qualidade do rosto sintético para treinar o LoRA.
Não se usa foto real — o próprio Flux gera o rosto inicial com um prompt de personagem.

### Modelo
`black-forest-labs/flux-dev` no Replicate

### Prompt padrão para geração de sementes

```
A photorealistic portrait of {gender} {age_range}, {ethnicity} {skin_tone} skin,
{hair_color} {hair_style} hair, {eye_color} eyes, {face_shape} face.
Professional photography, natural lighting, sharp focus, 4K.
```

### Variações necessárias (20-30 imagens)
- 5 ângulos: frontal, 3/4 direita, 3/4 esquerda, perfil direito, levemente acima
- 3 iluminações: natural (dia), studio softbox, ambient indoor
- 4 expressões: neutro, sorriso leve, sorriso largo, sério
- 2 contextos: fundo neutro, fundo lifestyle (café, escritório)

### Serviço: `SeedImageGeneratorService`

```typescript
// lib/services/lora/seed-image-generator.service.ts

class SeedImageGeneratorService {
  async generateSeedImages(
    replicateKey: string,
    personaId: string,
    personaDefinition: PersonaDefinition
  ): Promise<string[]>  // array de URLs das imagens geradas
}
```

---

## Fase 2: Treinamento do LoRA

### Modelo de Treinamento
`ostris/flux-dev-lora-trainer` no Replicate

### Parâmetros de Treinamento (valores testados)

```typescript
const trainingInput = {
  input_images: zipUrl,          // ZIP com as 20-30 imagens semente
  trigger_word: triggerWord,     // ex: "valentinacvx"
  steps: 1000,                   // 800-1200 para faces
  learning_rate: 0.0004,
  batch_size: 1,
  resolution: "512,768,1024",
  caption_type: "cogvlm",        // captioning automático
  hf_repo_id: null,              // não salva no HuggingFace
  // output: URL do .safetensors no Replicate
}
```

### Tempo e Custo Estimado
- ~20-30 imagens, 1000 steps: **~15-30 minutos**
- Custo Replicate: **~$0.80-1.50 por treinamento**
- O LoRA é salvo como URL do Replicate (expira em 1h) → fazer download e upload para Cloudinary

### Serviço: `LoRATrainerService`

```typescript
// lib/services/lora/lora-trainer.service.ts

class LoRATrainerService {
  async startTraining(
    replicateKey: string,
    personaId: string,
    seedImageUrls: string[],
    triggerWord: string
  ): Promise<{ trainingJobId: string }>

  async getTrainingStatus(
    replicateKey: string,
    trainingJobId: string
  ): Promise<{ status: string; loraWeightsUrl?: string; loss?: number }>
}
```

---

## Fase 3: Geração de Imagem com LoRA

### Modelo
`black-forest-labs/flux-dev` com `extra_lora` + `extra_lora_scale`

### Input

```typescript
const input = {
  prompt: `${triggerWord} woman holding a La Roche-Posay serum bottle,
           photorealistic, natural lighting, 4K`,
  extra_lora: loraWeightsUrl,   // URL do .safetensors no Cloudinary
  extra_lora_scale: 0.85,       // 0.7-1.0: controle de influência do LoRA
  num_inference_steps: 28,
  guidance_scale: 3.5,
  aspect_ratio: "9:16",         // vertical para Reels/TikTok
}
```

### Serviço: `PersonaImageGeneratorService`

```typescript
// lib/services/lora/persona-image-generator.service.ts

class PersonaImageGeneratorService {
  async generatePersonaImage(
    replicateKey: string,
    personaId: string,
    prompt: string,
    options?: { aspectRatio?: string; loraScale?: number }
  ): Promise<string>  // URL da imagem gerada
}
```

---

## Fase 4: Pipeline de Vídeo com Persona Sintética

### Rota Completa

```
Prompt de vídeo (usuário)
    ↓
PersonaImageGeneratorService.generatePersonaImage()  → imagem da persona
    ↓
Wan2.5 I2V / MiniMax S2V-01                          → vídeo
    ↓
(opcional) ElevenLabs TTS                             → áudio
    ↓
(opcional) Wan 2.2 S2V lip-sync                       → vídeo com fala sincronizada
```

### Modelos de Vídeo por Caso de Uso

| Caso de Uso | Modelo | Parâmetro Imagem |
|-------------|--------|------------------|
| Cena com persona | `wan-video/wan-2.5-i2v-fast` | `image` |
| Persona falando (com prompt) | `minimax/video-01` S2V-01 | `subject_reference` |
| Persona falando (lip-sync real) | `wan-video/wan-2.2-s2v` | `image_url` + `audio_url` |
| Alta qualidade | `fal-ai/kling-video/v2.1/pro/image-to-video` | `image_url` |

---

## Fase 5: UI / UX

### Tela: "Criar Persona Sintética"

```
/dashboard/personas/new → tipo: Sintética

[1] Definir Aparência
    - Gênero, faixa etária, etnia
    - Tom de pele, cor do cabelo, estilo
    - Cor dos olhos, formato do rosto
    - Personalidade / vibe (casual, luxury, grunge, etc.)

[2] Preview do Rosto (geração instantânea com Flux)
    - Botão "Gerar novo rosto" (regenera seed)
    - Aprovação: "Gostei! Treinar LoRA"

[3] Treinamento (assíncrono, ~20-30 min)
    - Progress bar com etapas: Gerando imagens... → Treinando LoRA... → Pronto!
    - Notificação quando pronto (toast ou e-mail)

[4] Persona pronta
    - Preview com 4 imagens geradas pelo LoRA
    - Pode usar em qualquer geração de vídeo
```

### Tela: Gerador de Vídeo (existente)
- Indicador visual quando persona tem LoRA: badge "Sintética"
- Alerta quando persona não tem LoRA (apenas foto): "Filtro E005 pode bloquear no Veo 3.1"

---

## Fase 6: Persistência e Cache

### Repositório: `PersonaLoRARepository`

```typescript
// lib/repositories/persona-lora.repository.ts

class PersonaLoRARepository {
  findByPersonaId(personaId: string): Promise<PersonaLoRA | null>
  upsert(personaId: string, data: Partial<PersonaLoRA>): Promise<PersonaLoRA>
  updateStatus(id: string, status: string): Promise<void>
  saveWeights(id: string, loraWeightsUrl: string, triggerWord: string): Promise<void>
}
```

### Storage das LoRA Weights

Os arquivos `.safetensors` (~50-200 MB) devem ser armazenados em:
1. **Cloudinary** (atual storage do projeto) — suporta arquivos binários via raw upload
2. **Alternativa**: Supabase Storage (já temos Supabase para DB)
3. **NÃO usar** URLs do Replicate — expiram em 1 hora

---

## Fase 7: Validação e Qualidade

### Checklist de Qualidade do LoRA

```typescript
interface LoRAQualityCheck {
  trainingLoss: number         // < 0.05 = bom; > 0.1 = ruim
  triggerWordResponse: boolean // gerar com/sem trigger e comparar
  identityConsistency: number  // SSIM ou LPIPS entre imagens geradas
  overtfitCheck: boolean       // 5 gerações diferentes devem variar levemente
}
```

### Testes Automáticos Pós-Treinamento
1. Gerar 4 imagens com o trigger word → salvar como preview
2. Calcular variância entre elas (muito similares = overfitting)
3. Gerar 1 imagem sem o trigger word → deve ser face diferente

---

## Fase 8: API Routes

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/personas/[id]/lora` | `GET` | Buscar status do LoRA |
| `/api/personas/[id]/lora` | `POST` | Iniciar criação do LoRA |
| `/api/personas/[id]/lora/status` | `GET` | Polling do status de treinamento |
| `/api/personas/[id]/lora/generate` | `POST` | Gerar imagem usando o LoRA |
| `/api/personas/[id]/lora/preview` | `POST` | Gerar 4 previews pós-treinamento |

---

## Estimativas

### Custo por Persona Sintética

| Etapa | Custo |
|-------|-------|
| 25 imagens semente (Flux) | ~$0.15 |
| Treinamento LoRA (1000 steps) | ~$1.20 |
| 4 imagens preview | ~$0.03 |
| Storage LoRA weights | ~$0.01/mês |
| **Total criação** | **~$1.40** |

### Custo por Geração de Vídeo com Persona

| Modelo | Custo por Vídeo |
|--------|-----------------|
| Geração da imagem seed (Flux+LoRA) | ~$0.004 |
| Wan 2.5 I2V (cena) | ~$0.03 |
| MiniMax S2V-01 (falando) | ~$0.20 |
| ElevenLabs TTS (áudio, 30s) | ~$0.05 |
| Wan 2.2 S2V lip-sync | ~$0.10 |
| **Pipeline completo** | **~$0.40** |

---

## Ordem de Implementação

### Sprint 1 — Fundação (1-2 semanas)
1. Schema Prisma: `PersonaLoRA`
2. `PersonaLoRARepository`
3. `SeedImageGeneratorService` (Flux text-to-image com variações)
4. Rota `POST /api/personas/[id]/lora` (inicia geração de seeds + treinamento)
5. Rota `GET /api/personas/[id]/lora/status` (polling)

### Sprint 2 — Treinamento (1 semana)
6. `LoRATrainerService` (ostris/flux-dev-lora-trainer)
7. Download e upload do .safetensors para Cloudinary
8. Webhook/polling para quando treinamento terminar

### Sprint 3 — Geração com LoRA (1 semana)
9. `PersonaImageGeneratorService` (Flux + extra_lora)
10. Integrar com pipeline de vídeo (Wan 2.5 I2V / MiniMax S2V)
11. Rota `POST /api/personas/[id]/lora/generate`

### Sprint 4 — UI (1 semana)
12. Tela "Criar Persona Sintética"
13. Progress bar de treinamento com SSE ou polling
14. Badge "Sintética" no PersonaSelector
15. Galeria de previews pós-treinamento

### Sprint 5 — Integração Completa (1 semana)
16. Integrar ElevenLabs TTS no pipeline
17. Pipeline completo: prompt → imagem → vídeo → lip-sync
18. Rota `/api/video/persona-complete` (orquestra tudo)
19. Testes de qualidade automatizados

---

## Decisões Técnicas Abertas

| Decisão | Opções | Recomendação |
|---------|--------|-------------|
| Storage LoRA weights | Cloudinary vs Supabase Storage | Cloudinary (já integrado) |
| Trigger word padrão | UUID vs nome da persona | `{nome_sem_espacos}{id_curto}` ex: `valentina_a1b2` |
| Treinamento async | Webhook vs Polling | Polling (mais simples, já temos padrão) |
| Captioning automático | cogvlm vs blip vs llava | cogvlm (padrão do trainer) |
| Integração TTS | ElevenLabs vs Azure vs Google | ElevenLabs (qualidade PT-BR superior) |
| Provider de vídeo | Replicate vs fal.ai | Replicate (já integrado) + fal.ai para Kling |

---

## Concorrentes que já fazem isso

| Concorrente | Abordagem |
|-------------|-----------|
| Higgsfield AI | LoRA por personagem + vídeo próprio |
| HeyGen | Foto → avatar digital treinado |
| Runway | Character Reference (sem LoRA, via embedding) |
| Pika AI | "Pikaffect" characters com consistência via seed |
| D-ID | Foto → talking head (não usa LoRA) |

A diferença do InfluencerAI: **LoRA por persona** dá consistência muito superior ao Character Reference
do Runway, e é mais flexível que o talking head do D-ID.
