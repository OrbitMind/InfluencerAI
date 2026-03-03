/**
 * E2E: Kling v2.1 Pro via fal.ai (image-to-video)
 *
 * Testa se o Kling aceita a foto da persona sem filtro de deepfake.
 * Diferente do Veo 3.1 (E005), o Kling não aplica filtro de likeness —
 * apenas filtra conteúdo político/NSFW.
 *
 * Pré-requisito: FAL_KEY no .env.local
 *   FAL_KEY=your_key_here
 *
 * Uso: node scripts/e2e-kling-fal.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

const BASE_URL = 'http://localhost:3000'
const AUTH_STATE_FILE = resolve('scripts/.auth-state.json')

// Lê FAL_KEY do .env.local
function loadFalKey() {
  try {
    const env = readFileSync(resolve('.env.local'), 'utf-8')
    const match = env.match(/^FAL_KEY=(.+)$/m)
    return match?.[1]?.trim() ?? null
  } catch {
    return null
  }
}

const FAL_KEY = loadFalKey() ?? process.env.FAL_KEY

const PERSONA_ID = 'cmm8fl97000062w3g0371sry3'

// Kling v2.1 Pro: aceita 5s ou 10s, aspect_ratio 9:16 para vertical
const DURATION     = '5'    // '5' ou '10' — Kling fixa em 5 ou 10s
const ASPECT_RATIO = '9:16' // vertical tipo Reels/TikTok

// Prompt UGC — fala em PT-BR calibrada para 5s (~11 palavras × 60/135 ≈ 4,9s)
const PROMPT = `Vertical smartphone selfie video, slightly handheld, authentic UGC style. The woman from the reference photo sits in a bathroom with warm natural side-light. She holds a La Roche-Posay Effaclar serum bottle — white matte frosted glass, navy blue label — at chest level, fully visible. She looks into the camera and speaks warmly in Brazilian Portuguese: "Esse sérum mudou minha pele! Uso todo dia. Recomendo demais!" Natural inflection, small hand gesture. White tiles background. Authentic, not commercial.`

const FAL_API_BASE = 'https://queue.fal.run'
const MODEL_PATH = 'fal-ai/kling-video/v2.1/pro/image-to-video'

async function falSubmit(imageUrl) {
  const res = await fetch(`${FAL_API_BASE}/${MODEL_PATH}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: PROMPT,
      image_url: imageUrl,
      duration: DURATION,
      aspect_ratio: ASPECT_RATIO,
      negative_prompt: 'blur, distort, low quality, unnatural movement',
      cfg_scale: 0.5,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`fal.ai submit failed ${res.status}: ${body}`)
  }

  return await res.json() // { request_id, status_url, response_url }
}

async function falStatus(requestId) {
  const res = await fetch(`${FAL_API_BASE}/${MODEL_PATH}/requests/${requestId}/status`, {
    headers: { 'Authorization': `Key ${FAL_KEY}` },
  })
  return await res.json() // { status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" }
}

async function falResult(requestId) {
  const res = await fetch(`${FAL_API_BASE}/${MODEL_PATH}/requests/${requestId}`, {
    headers: { 'Authorization': `Key ${FAL_KEY}` },
  })
  return await res.json() // { video: { url: "..." } }
}

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
  console.log('🎬 E2E — Kling v2.1 Pro via fal.ai com Valentina Cruz')
  console.log('========================================================')

  if (!FAL_KEY) {
    console.error('❌ FAL_KEY não encontrada.')
    console.error('   Adicione no .env.local: FAL_KEY=your_key_here')
    console.error('   Obtenha em: https://fal.ai/dashboard/keys')
    process.exit(1)
  }

  console.log(`✓ FAL_KEY configurada (${FAL_KEY.substring(0, 8)}...)`)

  const browser = await chromium.launch({ headless: true })

  if (!existsSync(AUTH_STATE_FILE)) {
    await browser.close()
    const visibleBrowser = await chromium.launch({ headless: false, args: ['--start-maximized'] })
    await doLogin(visibleBrowser)
    await visibleBrowser.close()
    return main()
  }

  console.log('✓ Sessão Next.js encontrada')
  const context = await browser.newContext({ storageState: AUTH_STATE_FILE })

  // ─── Passo 0: buscar imagem da persona ───────────────────────────────────
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
  await browser.close()

  // ─── Passo 1: submeter job no fal.ai ─────────────────────────────────────
  console.log(`\n→ Submetendo job no fal.ai (Kling v2.1 Pro)...`)
  console.log(`   image_url = persona reference (sem deepfake filter esperado)`)
  console.log(`   duration  = ${DURATION}s | aspect_ratio = ${ASPECT_RATIO}`)

  let submitData
  try {
    submitData = await falSubmit(personaImageUrl)
  } catch (err) {
    console.error('❌ Falha ao submeter:', err.message)
    process.exit(1)
  }

  const { request_id } = submitData
  console.log(`✅ Job submetido: ${request_id}`)

  // ─── Passo 2: polling no fal.ai ──────────────────────────────────────────
  console.log('\n⏳ Aguardando processamento Kling (estimativa: 2-5 min)...')

  let videoUrl = null
  const deadline = Date.now() + 12 * 60 * 1000 // 12 min

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 4_000))

    let statusData
    try {
      statusData = await falStatus(request_id)
    } catch {
      process.stdout.write('?')
      continue
    }

    const st = statusData.status

    if (st === 'COMPLETED') {
      const resultData = await falResult(request_id)
      videoUrl = resultData?.video?.url ?? resultData?.videos?.[0]?.url ?? null
      if (!videoUrl) {
        console.error('\n❌ Job completo mas sem URL de vídeo:', JSON.stringify(resultData).substring(0, 300))
        process.exit(1)
      }
      break
    }

    if (st === 'FAILED' || st === 'ERROR') {
      console.error('\n❌ Job falhou:', JSON.stringify(statusData).substring(0, 300))
      console.log('\n💡 Se houver erro de filtro, comparar com o erro E005 do Veo 3.1.')
      process.exit(1)
    }

    process.stdout.write(st === 'IN_PROGRESS' ? '▓' : '░')
  }

  if (!videoUrl) {
    console.error('\n❌ Timeout sem resultado')
    process.exit(1)
  }

  console.log('\n✅ Vídeo Kling v2.1 gerado!')
  console.log(`   URL: ${videoUrl}`)

  // ─── Passo 3: download ────────────────────────────────────────────────────
  console.log('\n→ Baixando vídeo...')
  const videoRes = await fetch(videoUrl)
  const buffer = Buffer.from(await videoRes.arrayBuffer())
  const outPath = join('scripts', `kling-fal-${Date.now()}.mp4`)
  writeFileSync(outPath, buffer)

  const sizeMB = (buffer.length / 1024 / 1024).toFixed(2)
  console.log(`✅ Salvo em: ${resolve(outPath)}`)
  console.log(`   Tamanho: ${sizeMB} MB`)

  console.log('\n🎉 Pronto! Compare os 3 resultados:')
  console.log('   1. Veo 3.1 text-to-video (sem persona) — valentina-instagram-*.mp4')
  console.log('   2. MiniMax S2V-01 (persona via subject_reference) — minimax-s2v-*.mp4')
  console.log('   3. Kling v2.1 Pro fal.ai (persona via image_url) — kling-fal-*.mp4')
}

main().catch(err => {
  console.error('Erro fatal:', err.message)
  process.exit(1)
})
