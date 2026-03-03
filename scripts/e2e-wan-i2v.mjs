/**
 * E2E: Wan 2.5 I2V (Image-to-Video)
 *
 * Testa Wan 2.5 com a foto da persona como imagem semente.
 * Modelo open-weight — sem filtro de deepfake.
 *
 * Uso: node scripts/e2e-wan-i2v.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'

const BASE_URL = 'http://localhost:3000'
const AUTH_STATE_FILE = resolve('scripts/.auth-state.json')

const MODEL_ID   = 'wan-video/wan-2.5-i2v-fast'
const PERSONA_ID = 'cmm8fl97000062w3g0371sry3'

const PROMPT = `A young Brazilian woman holds a La Roche-Posay Effaclar serum bottle — white matte frosted glass, navy blue label — at chest level. She smiles warmly at the camera and naturally gestures with her free hand. Bathroom setting, warm natural side-light. Authentic UGC style, vertical 9:16, handheld smartphone feel.`

async function doLogin(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.bringToFront()
  await page.waitForURL(/\/dashboard/, { timeout: 300_000 })
  await ctx.storageState({ path: AUTH_STATE_FILE })
  await ctx.close()
}

async function main() {
  console.log('🎬 E2E — Wan 2.5 I2V com Valentina Cruz (image_url)')
  console.log('=====================================================')

  const browser = await chromium.launch({ headless: true })

  if (!existsSync(AUTH_STATE_FILE)) {
    await browser.close()
    const v = await chromium.launch({ headless: false, args: ['--start-maximized'] })
    await doLogin(v)
    await v.close()
    return main()
  }

  const context = await browser.newContext({ storageState: AUTH_STATE_FILE })

  // Buscar persona
  const personaRes = await context.request.get(`${BASE_URL}/api/personas/${PERSONA_ID}`)
  const personaJson = await personaRes.json()
  if (!personaJson.success) { console.error('❌', personaJson.error); await browser.close(); process.exit(1) }

  const personaImageUrl = personaJson.data.referenceImageUrl
  console.log(`✅ Persona: ${personaJson.data.name}`)
  console.log(`   Imagem : ${personaImageUrl}`)

  // Criar predição — Wan 2.5 I2V usa 'image' como param
  console.log('\n→ Criando predição Wan 2.5 I2V...')
  const createRes = await context.request.post(`${BASE_URL}/api/replicate/generate-video`, {
    data: {
      modelId: MODEL_ID,
      prompt: PROMPT,
      imageUrl: personaImageUrl,
      imageParamName: 'image',
      personaId: PERSONA_ID,
    },
  })

  const createJson = await createRes.json()
  if (!createJson.success) {
    console.error('❌ Falha:', createJson.error)
    await browser.close()
    process.exit(1)
  }

  const { predictionId } = createJson.data
  console.log(`✅ Predição criada: ${predictionId}`)
  console.log('\n⏳ Aguardando Wan 2.5 (estimativa: 3-8 min)...')

  let outputUrl = null
  const deadline = Date.now() + 15 * 60 * 1000

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 4_000))
    const params = new URLSearchParams({ id: predictionId, modelId: MODEL_ID, prompt: PROMPT, personaId: PERSONA_ID, type: 'video' })
    const statusRes = await context.request.get(`${BASE_URL}/api/replicate/prediction-status?${params}`)
    const statusJson = await statusRes.json()

    if (!statusJson.success) { console.error('\n❌', statusJson.error); break }
    const { status, outputUrl: url, error } = statusJson.data

    if (status === 'failed' || status === 'canceled') {
      console.error(`\n❌ ${status}: ${error}`)
      await browser.close()
      process.exit(1)
    }
    if ((status === 'succeeded' || status === 'done') && url) { outputUrl = url; break }
    process.stdout.write(status === 'processing' ? '▓' : '░')
  }

  if (!outputUrl) { console.error('\n❌ Timeout'); await browser.close(); process.exit(1) }

  console.log('\n✅ Vídeo Wan 2.5 I2V gerado!')
  console.log(`   URL: ${outputUrl}`)

  const videoRes = await context.request.get(outputUrl)
  const buffer = await videoRes.body()
  const outPath = join('scripts', `wan-i2v-${Date.now()}.mp4`)
  writeFileSync(outPath, buffer)

  const sizeMB = (buffer.length / 1024 / 1024).toFixed(2)
  console.log(`✅ Salvo: ${resolve(outPath)} (${sizeMB} MB)`)
  await browser.close()
}

main().catch(err => { console.error('Erro fatal:', err.message); process.exit(1) })
