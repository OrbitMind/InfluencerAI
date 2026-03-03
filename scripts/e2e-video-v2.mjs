/**
 * E2E v2: Geração de vídeo via API direta (autenticado via sessão Playwright)
 * Usa a imagem real da persona Valentina Cruz como referência.
 * Resultado: vídeo realista estilo Instagram.
 *
 * Uso: node scripts/e2e-video-v2.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'

const BASE_URL = 'http://localhost:3000'
const AUTH_STATE_FILE = resolve('scripts/.auth-state.json')

// ─── Configuração da geração ──────────────────────────────────────────────────
const MODEL_ID    = 'google/veo-3.1'
const PERSONA_ID  = 'cmm8fl97000062w3g0371sry3'
const DURATION    = 8      // Máximo suportado pelo Veo 3

// Produto: La Roche-Posay Effaclar Ultra Concentrated Serum
// Descrito no prompt — a persona segura o frasco em mãos
// A imagem de referência usada é a da PERSONA (não do produto)

// Calibragem de fala em PT-BR (tom natural, como mensagem de voz para amiga):
// "Cara, esse sérum aqui... mudou minha pele demais. Tô usando todo dia e o resultado é surreal. Amei!"
// = 18 palavras × (60s ÷ 135 wpm) ≈ 8,0 segundos — cabe perfeitamente
//
// Estratégia UGC anti-IA:
// - Persona real como imagem-semente (image-to-video)
// - Vertical smartphone (9:16) — parece TikTok/Reels, não anúncio
// - Handheld leve — câmera não perfeitamente estável
// - Banheiro real com objetos cotidianos no fundo
// - Iluminação natural lateral — NÃO softbox estúdio
// - Tom coloquial e espontâneo com inflexão real
// - Fala com hesitação natural, como quem está genuinamente animada
// Sem imageUrl — foto real de rosto sempre dispara E005 (deepfake filter) no Veo 3.1
// Solução: text-to-video puro com descrição física detalhada da persona
const PROMPT = `Vertical smartphone selfie video, slightly handheld, cinematic 4K, authentic UGC style. A young Brazilian woman, mid-20s — warm light brown skin, long dark wavy hair loosely down, almond-shaped brown eyes, natural makeup with just mascara and lip gloss, small nose — sits casually in front of a bathroom mirror. Warm natural side-light from a frosted window. She holds a La Roche-Posay Effaclar serum bottle — white matte frosted glass, transparent dropper cap, dark navy blue label with white text "EFFACLAR" — loosely in her right hand at chest level, fully visible throughout. She looks directly into the phone camera with genuine warm energy and speaks naturally in Brazilian Portuguese:

"Cara, esse sérum aqui… mudou minha pele demais. Tô usando todo dia e o resultado é surreal. Amei!"

Voice delivery: exactly like a voice message to a best friend — warm, spontaneous inflection, a tiny natural pause at the ellipsis, a light laugh finishing the last word. NOT commercial voiceover. Her free left hand makes a small genuine gesture mid-sentence. Background: softly blurred white subway tiles, a few everyday items on the bathroom shelf. Natural ambient sound, slightly warm acoustic. Vertical 9:16 format.`

async function doLogin(browser) {
  console.log('\n🔐 Login necessário — janela vai abrir (5 min)...')
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.bringToFront()
  await page.waitForURL(/\/dashboard/, { timeout: 300_000 })
  await ctx.storageState({ path: AUTH_STATE_FILE })
  console.log('✓ Sessão salva')
  await ctx.close()
}

async function main() {
  console.log('🎬 E2E v2 — Vídeo Instagram com Valentina Cruz (persona real)')
  console.log('=============================================================')

  const browser = await chromium.launch({ headless: true })

  if (!existsSync(AUTH_STATE_FILE)) {
    await browser.close()
    const visibleBrowser = await chromium.launch({ headless: false, args: ['--start-maximized'] })
    await doLogin(visibleBrowser)
    await visibleBrowser.close()
    return main()
  }

  console.log('✓ Sessão encontrada — modo headless')
  const context = await browser.newContext({ storageState: AUTH_STATE_FILE })

  // ─── Passo 0: buscar imagem de referência da persona ─────────────────────
  console.log(`\n→ Buscando dados da persona ${PERSONA_ID}...`)
  const personaRes = await context.request.get(`${BASE_URL}/api/personas/${PERSONA_ID}`)
  const personaJson = await personaRes.json()

  if (!personaJson.success) {
    console.error('❌ Falha ao buscar persona:', personaJson.error ?? JSON.stringify(personaJson).substring(0, 200))
    await browser.close()
    process.exit(1)
  }

  const persona = personaJson.data
  const personaImageUrl = persona.referenceImageUrl ?? null

  if (!personaImageUrl) {
    console.error('❌ Persona não tem imagem de referência. Adicione uma em /dashboard/personas')
    await browser.close()
    process.exit(1)
  }

  console.log(`✅ Persona: ${persona.name}`)
  console.log(`   Imagem : ${personaImageUrl}`)

  // ─── Passo 1: criar predição ─────────────────────────────────────────────
  console.log('\n→ Criando predição no Replicate...')
  console.log(`  Modelo  : ${MODEL_ID}`)
  console.log(`  Prompt  : ${PROMPT.substring(0, 100)}...`)

  const createRes = await context.request.post(`${BASE_URL}/api/replicate/generate-video`, {
    data: {
      modelId: MODEL_ID,
      prompt: PROMPT,
      // imageUrl não enviado — foto de rosto dispara E005 no Veo 3.1 (deepfake filter)
      // persona é descrita textualmente no prompt
      personaId: PERSONA_ID,
      duration: DURATION,
    },
  })

  const createJson = await createRes.json()
  if (!createJson.success) {
    console.error('❌ Falha ao criar predição:', createJson.error)
    await browser.close()
    process.exit(1)
  }

  const { predictionId } = createJson.data
  console.log(`✅ Predição criada: ${predictionId}`)

  // ─── Passo 2: polling de status ──────────────────────────────────────────
  console.log('\n⏳ Aguardando processamento (Veo 3.1: ~3-5 min)...')

  let outputUrl = null
  const deadline = Date.now() + 12 * 60 * 1000 // 12 min

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 4_000))

    const params = new URLSearchParams({
      id: predictionId,
      modelId: MODEL_ID,
      prompt: PROMPT,
      personaId: PERSONA_ID,
      type: 'video',
    })

    const statusRes = await context.request.get(`${BASE_URL}/api/replicate/prediction-status?${params}`)
    const statusJson = await statusRes.json()

    if (!statusJson.success) {
      console.error('\n❌ Erro ao verificar status:', statusJson.error)
      break
    }

    const { status, outputUrl: url, error } = statusJson.data

    if (status === 'failed' || status === 'canceled') {
      console.error(`\n❌ Predição ${status}: ${error}`)
      await browser.close()
      process.exit(1)
    }

    if ((status === 'succeeded' || status === 'done') && url) {
      outputUrl = url
      break
    }

    process.stdout.write(status === 'processing' ? '▓' : '░')
  }

  if (!outputUrl) {
    console.error('\n❌ Timeout sem resultado')
    await browser.close()
    process.exit(1)
  }

  console.log('\n✅ Vídeo gerado e salvo no Cloudinary!')
  console.log(`   URL: ${outputUrl}`)

  // ─── Passo 3: download ────────────────────────────────────────────────────
  console.log('\n→ Baixando vídeo...')
  const videoRes = await context.request.get(outputUrl)
  const buffer = await videoRes.body()
  const outPath = join('scripts', `valentina-instagram-${Date.now()}.mp4`)
  writeFileSync(outPath, buffer)

  const sizeMB = (buffer.length / 1024 / 1024).toFixed(2)
  console.log(`✅ Salvo em: ${resolve(outPath)}`)
  console.log(`   Tamanho: ${sizeMB} MB`)

  await browser.close()
  console.log('\n🎉 Pronto! Abra o arquivo .mp4 para ver o resultado.')
}

main().catch(err => {
  console.error('Erro fatal:', err.message)
  process.exit(1)
})
