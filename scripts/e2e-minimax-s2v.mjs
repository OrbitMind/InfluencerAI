/**
 * E2E: MiniMax video-01 S2V-01 (Subject-to-Video)
 *
 * Testa se o MiniMax aceita a foto da persona via `subject_reference`
 * sem disparar filtro de deepfake (ao contrário do Veo 3.1 com E005).
 *
 * S2V-01: o modelo mantém a identidade do rosto ao longo do vídeo.
 * Vídeos fixos em 6s / 720p / 25fps.
 *
 * Uso: node scripts/e2e-minimax-s2v.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'

const BASE_URL = 'http://localhost:3000'
const AUTH_STATE_FILE = resolve('scripts/.auth-state.json')

const MODEL_ID   = 'minimax/video-01'
const PERSONA_ID = 'cmm8fl97000062w3g0371sry3'

// Prompt UGC — sem especificar duração (MiniMax S2V fixa em 6s)
// Fala calibrada: ~13 palavras × (60s ÷ 135 wpm) ≈ 5,7s — cabe nos 6s
const PROMPT = `Vertical smartphone selfie video, slightly handheld, authentic UGC style. The woman from the reference photo sits casually in a bathroom, warm natural side-light. She holds a La Roche-Posay Effaclar serum bottle — white matte frosted glass, navy blue label — at chest level, fully visible. She looks into the camera and says naturally in Brazilian Portuguese:

"Esse sérum é incrível! Uso todo dia e minha pele nunca foi tão bonita. Amei!"

Warm voice, natural inflection like a message to a friend. Her free hand gestures naturally. Blurred white tiles in the background. Vertical 9:16 format.`

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
  console.log('🎬 E2E — MiniMax S2V-01 com Valentina Cruz (subject_reference)')
  console.log('================================================================')

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
  console.log(`\n→ Buscando persona ${PERSONA_ID}...`)
  const personaRes = await context.request.get(`${BASE_URL}/api/personas/${PERSONA_ID}`)
  const personaJson = await personaRes.json()

  if (!personaJson.success) {
    console.error('❌ Falha ao buscar persona:', personaJson.error)
    await browser.close()
    process.exit(1)
  }

  const persona = personaJson.data
  const personaImageUrl = persona.referenceImageUrl

  if (!personaImageUrl) {
    console.error('❌ Persona sem imagem de referência')
    await browser.close()
    process.exit(1)
  }

  console.log(`✅ Persona: ${persona.name}`)
  console.log(`   Imagem : ${personaImageUrl}`)

  // ─── Passo 1: criar predição (S2V via subject_reference) ─────────────────
  // A rota /api/replicate/generate-video mapeia imageUrl → imageParamName
  // passando 'subject_reference' ativamos o modo S2V-01 do MiniMax
  console.log('\n→ Criando predição MiniMax S2V-01...')
  console.log('   subject_reference → imagem da persona (sem deepfake filter)')

  const createRes = await context.request.post(`${BASE_URL}/api/replicate/generate-video`, {
    data: {
      modelId: MODEL_ID,
      prompt: PROMPT,
      imageUrl: personaImageUrl,
      imageParamName: 'subject_reference',  // ← ativa S2V-01
      personaId: PERSONA_ID,
      // Sem duration — MiniMax S2V fixa em 6s
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

  // ─── Passo 2: polling ─────────────────────────────────────────────────────
  console.log('\n⏳ Aguardando processamento MiniMax (estimativa: 3-6 min)...')

  let outputUrl = null
  const deadline = Date.now() + 15 * 60 * 1000 // 15 min

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
      console.log('\n💡 Se for erro de filtro, o MiniMax também rejeita — comparar com E005 do Veo.')
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

  console.log('\n✅ Vídeo MiniMax S2V-01 gerado!')
  console.log(`   URL: ${outputUrl}`)

  // ─── Passo 3: download ────────────────────────────────────────────────────
  const videoRes = await context.request.get(outputUrl)
  const buffer = await videoRes.body()
  const outPath = join('scripts', `minimax-s2v-${Date.now()}.mp4`)
  writeFileSync(outPath, buffer)

  const sizeMB = (buffer.length / 1024 / 1024).toFixed(2)
  console.log(`✅ Salvo em: ${resolve(outPath)}`)
  console.log(`   Tamanho: ${sizeMB} MB`)

  await browser.close()
  console.log('\n🎉 Pronto! Compare com o resultado do Veo 3.1 (text-to-video).')
  console.log('   Critérios: identidade da persona, qualidade da voz, coerência visual.')
}

main().catch(err => {
  console.error('Erro fatal:', err.message)
  process.exit(1)
})
