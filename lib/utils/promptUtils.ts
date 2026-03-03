/**
 * Utilitários para prompts
 * Princípio: Single Responsibility Principle (SRP)
 * Responsabilidade: fornecer constantes e funções relacionadas a prompts
 */

const IMAGE_SYSTEM_PROMPT = `Você é um especialista em criar prompts para geração de imagens de IA de influenciadores digitais.
Seu trabalho é pegar a descrição do usuário e transformá-la em um prompt detalhado e otimizado para modelos como Flux e Stable Diffusion.
O prompt refinado deve:
- Ser extremamente descritivo e visual
- Incluir detalhes sobre iluminação, composição e estilo fotográfico
- Especificar características faciais, expressões e poses
- Incluir detalhes de vestuário, acessórios e cenário
- Usar termos técnicos de fotografia quando apropriado
Responda APENAS com o prompt refinado em inglês (para melhor compatibilidade com os modelos), sem explicações adicionais.`

const VIDEO_SYSTEM_PROMPT = `Você é um especialista em criar prompts para geração de vídeos de IA com influenciadores digitais promovendo produtos.
Seu trabalho é pegar a descrição do usuário e transformá-la em um prompt detalhado e otimizado para modelos de geração de vídeo.
O prompt refinado deve:
- Ser extremamente descritivo e visual
- Incluir detalhes sobre movimentos, expressões faciais e gestos
- Especificar iluminação, ângulos de câmera e transições
- Manter o foco no produto e na mensagem de marketing
- Ser natural e envolvente
Responda APENAS com o prompt refinado, sem explicações adicionais.`

/**
 * Retorna o system prompt apropriado baseado no tipo
 */
export function getSystemPrompt(type: 'image' | 'video'): string {
  return type === 'video' ? VIDEO_SYSTEM_PROMPT : IMAGE_SYSTEM_PROMPT
}

/**
 * Constrói um prompt completo para vídeo de produto (legado)
 */
export function buildProductVideoPrompt(
  productName: string,
  productDescription: string,
  callToAction: string,
  additionalPrompt: string
): string {
  return `${productName}: ${productDescription}. ${callToAction}. ${additionalPrompt}`.trim()
}

/**
 * Constrói o prompt de vídeo baseado na intenção selecionada
 */
export function buildVideoPrompt(
  intention: import('@/lib/constants/video-intentions').VideoIntention,
  field1: string,
  field2: string,
  field3: string,
  field4: string
): string {
  const parts: string[] = []

  switch (intention) {
    case 'product':
      if (field1) parts.push(field1)
      if (field2) parts.push(field2)
      if (field3) parts.push(field3)
      if (field4) parts.push(field4)
      break
    case 'lifestyle':
      if (field1) parts.push(`Lifestyle video: ${field1}`)
      if (field2) parts.push(field2)
      if (field3) parts.push(`Mood: ${field3}`)
      if (field4) parts.push(field4)
      break
    case 'social':
      if (field1) parts.push(`Social media content: ${field1}`)
      if (field2) parts.push(field2)
      if (field3) parts.push(field3)
      if (field4) parts.push(`Visual style: ${field4}`)
      break
    case 'testimonial':
      if (field1) parts.push(`Honest review of ${field1}`)
      if (field2) parts.push(field2)
      if (field3) parts.push(field3)
      if (field4) parts.push(field4)
      break
    case 'freestyle':
      if (field4) parts.push(field4)
      break
  }

  return parts.filter(Boolean).join('. ').trim()
}
