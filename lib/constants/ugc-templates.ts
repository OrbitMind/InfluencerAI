import type { UGCTemplateDefinition } from '@/lib/types/ugc'

export const UGC_TEMPLATES: UGCTemplateDefinition[] = [
  {
    slug: 'ugc-unboxing',
    name: 'Unboxing',
    description: 'Reação autêntica ao abrir um produto pela primeira vez',
    subcategory: 'unboxing',
    icon: '📦',
    imagePromptTemplate:
      '{{persona_base}}, holding a {{product_name}} box with excited expression, unboxing moment, natural lighting, close-up shot, authentic UGC style',
    videoPromptTemplate:
      '{{persona_base}}, opening {{product_name}} packaging with genuine excitement, revealing the product, talking to camera, handheld feel, authentic home setting, UGC style, {{camera_movement}}',
    narrationTemplate:
      'Gente, acabou de chegar o meu {{product_name}} e eu precisei fazer esse vídeo aqui pra vocês! Olha que incrível isso aqui...',
    defaultCameraMovement: 'zoom_in',
    variables: [
      { name: 'product_name', label: 'Nome do Produto', required: true, type: 'text', placeholder: 'Ex: iPhone 16 Pro' },
      { name: 'brand_name', label: 'Marca', required: false, type: 'text', placeholder: 'Ex: Apple' },
    ],
  },
  {
    slug: 'ugc-review',
    name: 'Review / Avaliação',
    description: 'Avaliação honesta e detalhada de um produto ou serviço',
    subcategory: 'review',
    icon: '⭐',
    imagePromptTemplate:
      '{{persona_base}}, holding {{product_name}}, honest review pose, neutral background, professional yet approachable, direct eye contact, authentic UGC style',
    videoPromptTemplate:
      '{{persona_base}}, reviewing {{product_name}} with detailed demonstration, showing product features, honest talking head style, good lighting, static camera for credibility',
    narrationTemplate:
      'Faz {{time_used}} que estou usando o {{product_name}} e hoje vou dar minha avaliação honesta. Pontos positivos, negativos, e se vale a pena comprar.',
    defaultCameraMovement: 'static',
    variables: [
      { name: 'product_name', label: 'Produto', required: true, type: 'text', placeholder: 'Ex: Moisturizer XYZ' },
      { name: 'time_used', label: 'Tempo de uso', required: false, type: 'text', placeholder: 'Ex: 30 dias' },
      { name: 'rating', label: 'Nota (1-5)', required: false, type: 'select', options: ['5', '4', '3', '2', '1'] },
    ],
  },
  {
    slug: 'ugc-testimonial',
    name: 'Testemunho',
    description: 'Depoimento pessoal sobre transformação ou resultado',
    subcategory: 'testimonial',
    icon: '💬',
    imagePromptTemplate:
      '{{persona_base}}, warm confident smile, testimonial portrait, soft natural light, relatable authentic expression, UGC lifestyle',
    videoPromptTemplate:
      '{{persona_base}}, sharing personal story about {{transformation}}, emotional and genuine talking head, warm home background, slow zoom in, authentic testimonial style',
    narrationTemplate:
      'Antes de usar {{product_name}}, eu {{before_situation}}. Depois de {{time_period}}, {{after_result}}. Não acreditava que ia funcionar mas...',
    defaultCameraMovement: 'zoom_in',
    variables: [
      { name: 'product_name', label: 'Produto/Serviço', required: true, type: 'text', placeholder: 'Ex: Curso de Marketing' },
      { name: 'transformation', label: 'Transformação', required: true, type: 'textarea', placeholder: 'Ex: perda de peso, crescimento profissional' },
      { name: 'before_situation', label: 'Situação antes', required: false, type: 'textarea', placeholder: 'Ex: me sentia insegura' },
      { name: 'after_result', label: 'Resultado depois', required: false, type: 'textarea', placeholder: 'Ex: perdi 10kg em 2 meses' },
      { name: 'time_period', label: 'Período', required: false, type: 'text', placeholder: 'Ex: 60 dias' },
    ],
  },
  {
    slug: 'ugc-pov',
    name: 'POV — Ponto de Vista',
    description: 'Câmera subjetiva em primeira pessoa, imersivo e envolvente',
    subcategory: 'pov',
    icon: '🤳',
    imagePromptTemplate:
      '{{persona_base}}, POV selfie angle, {{activity}} setting, first-person perspective, candid authentic moment, natural lighting',
    videoPromptTemplate:
      'POV: {{pov_scenario}}, first person perspective, {{persona_base}} visible in frame or implied, handheld shaky cam, immersive and relatable, {{camera_movement}}',
    defaultCameraMovement: 'dolly_in',
    variables: [
      { name: 'pov_scenario', label: 'Cenário POV', required: true, type: 'textarea', placeholder: 'Ex: você está usando o produto pela primeira vez no café' },
      { name: 'activity', label: 'Atividade', required: false, type: 'text', placeholder: 'Ex: café da manhã, academia, home office' },
    ],
  },
  {
    slug: 'ugc-day-in-life',
    name: 'Day in My Life',
    description: 'Sequência de cenas mostrando o cotidiano com o produto integrado',
    subcategory: 'day-in-life',
    icon: '🌅',
    imagePromptTemplate:
      '{{persona_base}}, morning routine vibe, {{time_of_day}} setting, lifestyle photography, authentic daily life moment, soft warm lighting',
    videoPromptTemplate:
      '{{persona_base}}, daily routine montage style, naturally using {{product_name}} throughout the day, authentic lifestyle shots, variety of angles and settings, vlog aesthetic',
    narrationTemplate:
      'Vem comigo num dia na minha vida com {{product_name}}! Da manhã até a noite, como uso esse produto no meu dia a dia.',
    defaultCameraMovement: 'pan_right',
    variables: [
      { name: 'product_name', label: 'Produto', required: true, type: 'text', placeholder: 'Ex: Perfume Chanel' },
      { name: 'time_of_day', label: 'Período do dia', required: false, type: 'select', options: ['manhã', 'tarde', 'noite', 'dia todo'] },
    ],
  },
  {
    slug: 'ugc-before-after',
    name: 'Before & After',
    description: 'Comparativo visual mostrando transformação com o produto',
    subcategory: 'before-after',
    icon: '✨',
    imagePromptTemplate:
      '{{persona_base}}, split screen composition, before and after transformation, {{transformation_type}}, dramatic lighting change, compelling visual contrast',
    videoPromptTemplate:
      '{{persona_base}}, before and after reveal, starting with {{before_state}} then transforming to {{after_state}} using {{product_name}}, satisfying reveal moment, dramatic transition',
    narrationTemplate:
      'Antes: {{before_state}}. Depois de usar {{product_name}}: {{after_state}}. A diferença é real!',
    defaultCameraMovement: 'zoom_out',
    variables: [
      { name: 'product_name', label: 'Produto', required: true, type: 'text', placeholder: 'Ex: Sérum Facial' },
      { name: 'before_state', label: 'Estado antes', required: true, type: 'textarea', placeholder: 'Ex: pele opaca e com manchas' },
      { name: 'after_state', label: 'Estado depois', required: true, type: 'textarea', placeholder: 'Ex: pele luminosa e uniforme' },
      { name: 'transformation_type', label: 'Tipo de transformação', required: false, type: 'select', options: ['skin', 'hair', 'body', 'space', 'outfit'] },
    ],
  },
  {
    slug: 'ugc-grwm',
    name: 'Get Ready With Me',
    description: 'Tutorial de preparação integrando produtos de forma natural',
    subcategory: 'grwm',
    icon: '💄',
    imagePromptTemplate:
      '{{persona_base}}, getting ready scene, mirror selfie angle, beauty products visible, morning routine aesthetic, warm bathroom lighting, authentic GRWM style',
    videoPromptTemplate:
      '{{persona_base}}, get ready with me style video, applying {{product_category}} products step by step, talking to camera between steps, close-up product shots, natural lighting, tilt down movement',
    narrationTemplate:
      'Vem se arrumar comigo! Hoje vou mostrar minha rotina com {{product_name}}. Passo a passo, sem segredos.',
    defaultCameraMovement: 'tilt_down',
    variables: [
      { name: 'product_name', label: 'Produto principal', required: true, type: 'text', placeholder: 'Ex: Paleta de Sombras' },
      { name: 'product_category', label: 'Categoria', required: false, type: 'select', options: ['skincare', 'makeup', 'hair', 'body', 'fragrance'] },
      { name: 'occasion', label: 'Ocasião', required: false, type: 'text', placeholder: 'Ex: trabalho, balada, encontro' },
    ],
  },
]
