export type VideoIntention = 'product' | 'lifestyle' | 'social' | 'testimonial' | 'freestyle'

export interface IntentionFieldConfig {
  label: string
  placeholder: string
  required?: boolean
}

export interface VideoIntentionConfig {
  label: string
  description: string
  icon: string
  field1?: IntentionFieldConfig  // maps to productName
  field2?: IntentionFieldConfig  // maps to productDescription
  field3?: IntentionFieldConfig  // maps to callToAction (optional)
  field4: IntentionFieldConfig   // maps to additionalPrompt (always shown)
}

export const VIDEO_INTENTIONS: Record<VideoIntention, VideoIntentionConfig> = {
  product: {
    label: 'Produto',
    description: 'Divulgação e venda de um produto',
    icon: '🛒',
    field1: { label: 'Nome do Produto', placeholder: 'ex: Sérum Luminoso Glow', required: true },
    field2: { label: 'Descrição do Produto', placeholder: 'Descreva o produto e seus principais benefícios...', required: true },
    field3: { label: 'Chamada para Ação', placeholder: 'ex: Use o código GLOW20 para 20% de desconto!' },
    field4: { label: 'Instruções Adicionais', placeholder: 'Estilo visual, ambiente, ações da persona...' },
  },
  lifestyle: {
    label: 'Lifestyle',
    description: 'Vlog, rotina, dia a dia da persona',
    icon: '☀️',
    field1: { label: 'Tema do Vídeo', placeholder: 'ex: Rotina matinal, Dia de treino, Travel vlog', required: true },
    field2: { label: 'O que a persona está fazendo', placeholder: 'ex: Preparando café enquanto fala sobre produtividade...', required: true },
    field3: { label: 'Mensagem / Sentimento', placeholder: 'ex: Motivação, Paz, Energia positiva' },
    field4: { label: 'Instruções Adicionais', placeholder: 'Ambiente, iluminação, música de fundo...' },
  },
  social: {
    label: 'Conteúdo Social',
    description: 'Reels, Stories, TikTok',
    icon: '📱',
    field1: { label: 'Tema / Tendência', placeholder: 'ex: Transformação, Get ready with me, Trend dance', required: true },
    field2: { label: 'Mensagem Principal', placeholder: 'O que você quer comunicar ao público?', required: true },
    field3: { label: 'Hashtags / CTA', placeholder: 'ex: Salva esse vídeo! #beleza #lifestyle' },
    field4: { label: 'Estilo Visual', placeholder: 'Cortes rápidos, câmera lenta, estética Y2K...' },
  },
  testimonial: {
    label: 'Depoimento',
    description: 'Review autêntico de produto ou serviço',
    icon: '💬',
    field1: { label: 'Produto / Marca', placeholder: 'ex: Hidratante da marca X', required: true },
    field2: { label: 'Experiência Pessoal', placeholder: 'Como a persona usa e o que ela sentiu...', required: true },
    field3: { label: 'Recomendação', placeholder: 'Por que ela indica para as seguidoras?' },
    field4: { label: 'Instruções Adicionais', placeholder: 'Tom: natural, íntimo, animado...' },
  },
  freestyle: {
    label: 'Livre',
    description: 'Descreva o vídeo do seu jeito',
    icon: '✏️',
    field4: { label: 'Descreva o Vídeo', placeholder: 'Descreva exatamente o que você quer no vídeo...', required: true },
  },
}
