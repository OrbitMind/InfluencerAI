import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const systemTemplates = [
  {
    name: 'Review de Produto',
    slug: 'product-review',
    description: 'Influenciador apresentando e avaliando um produto com destaque para benefícios.',
    category: 'product',
    icon: 'Package',
    imagePromptTemplate:
      '{{persona_base}}, holding and showcasing a {{product_name}}, professional product photography style, warm lighting, clean background, social media ready, {{additional_details}}',
    videoPromptTemplate:
      '{{persona_base}}, reviewing and demonstrating a {{product_name}}, speaking to camera, enthusiastic expression, studio lighting, professional setting',
    narrationTemplate:
      'Oi gente! Hoje eu vou mostrar pra vocês esse {{product_name}} incrível. {{product_description}}. {{call_to_action}}',
    defaultImageModel: 'black-forest-labs/flux-schnell',
    defaultVideoModel: 'minimax/video-01',
    defaultAspectRatio: '1:1',
    defaultVideoDuration: 5,
    overlayConfig: {
      enabled: true,
      position: 'bottom-center',
      fontSize: 32,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#00000080',
      opacity: 0.9,
      padding: 16,
    },
    variables: [
      { name: 'product_name', label: 'Nome do Produto', required: true, type: 'text', placeholder: 'Ex: Sérum Facial Vitamina C' },
      { name: 'product_description', label: 'Descrição do Produto', required: true, type: 'textarea', placeholder: 'Descreva os benefícios e características' },
      { name: 'call_to_action', label: 'Call to Action', required: false, type: 'text', placeholder: 'Ex: Link na bio!', defaultValue: 'Corre lá no link da bio pra garantir o seu!' },
      { name: 'additional_details', label: 'Detalhes Adicionais', required: false, type: 'textarea', placeholder: 'Detalhes extras para a imagem' },
    ],
  },
  {
    name: 'Post Lifestyle',
    slug: 'lifestyle-post',
    description: 'Conteúdo de estilo de vida mostrando o dia a dia do influenciador.',
    category: 'lifestyle',
    icon: 'Heart',
    imagePromptTemplate:
      '{{persona_base}}, in a {{scenario}} setting, lifestyle photography, natural lighting, candid pose, Instagram aesthetic, {{mood}} mood, {{additional_details}}',
    videoPromptTemplate:
      '{{persona_base}}, in a {{scenario}} setting, lifestyle vlog style, natural movement, warm tones',
    narrationTemplate:
      'Mais um dia incrível por aqui! {{scenario_description}}. {{message}}',
    defaultImageModel: 'black-forest-labs/flux-schnell',
    defaultVideoModel: 'minimax/video-01',
    defaultAspectRatio: '4:5',
    defaultVideoDuration: 5,
    overlayConfig: {
      enabled: false,
      position: 'bottom-center',
      fontSize: 28,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#00000060',
      opacity: 0.8,
      padding: 12,
    },
    variables: [
      { name: 'scenario', label: 'Cenário', required: true, type: 'select', options: ['café', 'praia', 'academia', 'escritório', 'restaurante', 'viagem', 'casa'] },
      { name: 'scenario_description', label: 'Descrição do Cenário', required: false, type: 'textarea', placeholder: 'Conte sobre o momento' },
      { name: 'mood', label: 'Mood', required: false, type: 'select', options: ['relaxed', 'energetic', 'cozy', 'adventurous', 'elegant'], defaultValue: 'relaxed' },
      { name: 'message', label: 'Mensagem', required: false, type: 'textarea', placeholder: 'Mensagem para os seguidores' },
    ],
  },
  {
    name: 'Unboxing',
    slug: 'unboxing',
    description: 'Experiência de desembalar um produto com reação genuína.',
    category: 'product',
    icon: 'Gift',
    imagePromptTemplate:
      '{{persona_base}}, excitedly unboxing a {{product_name}}, surprise expression, product packaging visible, well-lit table, top-down perspective, {{additional_details}}',
    videoPromptTemplate:
      '{{persona_base}}, opening a package containing {{product_name}}, genuine excitement, close-up hands and face, bright lighting',
    narrationTemplate:
      'Gente, olha o que chegou! Vou abrir aqui com vocês esse {{product_name}}. {{first_impression}}. {{call_to_action}}',
    defaultImageModel: 'black-forest-labs/flux-schnell',
    defaultVideoModel: 'minimax/video-01',
    defaultAspectRatio: '9:16',
    defaultVideoDuration: 5,
    overlayConfig: {
      enabled: true,
      position: 'top-center',
      fontSize: 36,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#FF000090',
      opacity: 0.95,
      padding: 16,
    },
    variables: [
      { name: 'product_name', label: 'Nome do Produto', required: true, type: 'text', placeholder: 'Ex: iPhone 16 Pro' },
      { name: 'first_impression', label: 'Primeira Impressão', required: false, type: 'textarea', placeholder: 'Sua reação ao abrir' },
      { name: 'call_to_action', label: 'Call to Action', required: false, type: 'text', placeholder: 'Ex: Comenta aqui se vocês também querem!', defaultValue: 'Comenta aqui se vocês também querem!' },
      { name: 'additional_details', label: 'Detalhes da Imagem', required: false, type: 'textarea', placeholder: 'Detalhes adicionais para a imagem' },
    ],
  },
  {
    name: 'Dica Rápida / Tutorial',
    slug: 'tutorial-tip',
    description: 'Compartilhar uma dica rápida ou mini tutorial educativo.',
    category: 'educational',
    icon: 'Lightbulb',
    imagePromptTemplate:
      '{{persona_base}}, teaching or demonstrating {{topic}}, educational pose, pointing or gesturing, clean background with text space, professional lighting, {{additional_details}}',
    videoPromptTemplate:
      '{{persona_base}}, explaining {{topic}}, speaking to camera with hand gestures, educational content creator style, bright setting',
    narrationTemplate:
      'Dica rápida pra vocês! {{tip_content}}. Salva esse post pra não esquecer! {{extra_tip}}',
    defaultImageModel: 'black-forest-labs/flux-schnell',
    defaultVideoModel: 'minimax/video-01',
    defaultAspectRatio: '1:1',
    defaultVideoDuration: 5,
    overlayConfig: {
      enabled: true,
      position: 'top-center',
      fontSize: 30,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#4A90D9E0',
      opacity: 0.95,
      padding: 14,
    },
    variables: [
      { name: 'topic', label: 'Tópico', required: true, type: 'text', placeholder: 'Ex: Como hidratar a pele no inverno' },
      { name: 'tip_content', label: 'Conteúdo da Dica', required: true, type: 'textarea', placeholder: 'Explique a dica em detalhes' },
      { name: 'extra_tip', label: 'Dica Extra', required: false, type: 'textarea', placeholder: 'Informação adicional' },
      { name: 'additional_details', label: 'Detalhes da Imagem', required: false, type: 'textarea', placeholder: 'Detalhes visuais adicionais' },
    ],
  },
  {
    name: 'Antes e Depois',
    slug: 'before-after',
    description: 'Mostrar transformação ou resultados de um produto/serviço.',
    category: 'product',
    icon: 'ArrowLeftRight',
    imagePromptTemplate:
      '{{persona_base}}, showing transformation results, {{result_description}}, confident pose, bright lighting, social media before-and-after style, {{additional_details}}',
    videoPromptTemplate:
      '{{persona_base}}, revealing transformation results, dramatic reveal moment, confident expression, well-lit environment',
    narrationTemplate:
      'Vocês pediram e aqui está! O resultado depois de usar {{product_name}}. {{result_description}}. {{call_to_action}}',
    defaultImageModel: 'black-forest-labs/flux-schnell',
    defaultVideoModel: 'minimax/video-01',
    defaultAspectRatio: '4:5',
    defaultVideoDuration: 5,
    overlayConfig: {
      enabled: true,
      position: 'bottom-center',
      fontSize: 28,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#00000080',
      opacity: 0.9,
      padding: 14,
    },
    variables: [
      { name: 'product_name', label: 'Produto/Serviço', required: true, type: 'text', placeholder: 'Ex: Tratamento capilar XYZ' },
      { name: 'result_description', label: 'Descrição do Resultado', required: true, type: 'textarea', placeholder: 'Descreva a transformação' },
      { name: 'time_period', label: 'Período', required: false, type: 'text', placeholder: 'Ex: 30 dias', defaultValue: '30 dias' },
      { name: 'call_to_action', label: 'Call to Action', required: false, type: 'text', placeholder: 'Ex: Quer saber mais? Link na bio!', defaultValue: 'Quer saber mais? Link na bio!' },
    ],
  },
  {
    name: 'Story Interativo',
    slug: 'interactive-story',
    description: 'Conteúdo para stories com engajamento e interação.',
    category: 'entertainment',
    icon: 'MessageCircle',
    imagePromptTemplate:
      '{{persona_base}}, engaging with camera, expressive face, {{emotion}} expression, story-format vertical composition, vibrant colors, casual setting, {{additional_details}}',
    videoPromptTemplate:
      '{{persona_base}}, talking directly to camera in story format, {{emotion}} expression, close-up, vertical video, casual setting',
    narrationTemplate:
      '{{greeting}}! {{question_or_poll}}. Responde aí nos comentários! {{closing}}',
    defaultImageModel: 'black-forest-labs/flux-schnell',
    defaultVideoModel: 'minimax/video-01',
    defaultAspectRatio: '9:16',
    defaultVideoDuration: 5,
    overlayConfig: {
      enabled: true,
      position: 'center',
      fontSize: 34,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#9B59B6D0',
      opacity: 0.95,
      padding: 20,
    },
    variables: [
      { name: 'greeting', label: 'Saudação', required: false, type: 'text', placeholder: 'Ex: E aí galera', defaultValue: 'E aí galera' },
      { name: 'question_or_poll', label: 'Pergunta / Enquete', required: true, type: 'textarea', placeholder: 'Ex: Vocês preferem café ou chá de manhã?' },
      { name: 'emotion', label: 'Emoção', required: false, type: 'select', options: ['happy', 'curious', 'surprised', 'excited', 'thoughtful'], defaultValue: 'curious' },
      { name: 'closing', label: 'Fechamento', required: false, type: 'text', placeholder: 'Ex: Me conta nos comentários!' },
    ],
  },
  {
    name: 'Promoção Direta',
    slug: 'direct-promo',
    description: 'Conteúdo promocional direto com oferta e urgência.',
    category: 'promotional',
    icon: 'Megaphone',
    imagePromptTemplate:
      '{{persona_base}}, promotional pose with {{product_name}}, bold and confident, eye-catching composition, studio lighting, commercial photography style, {{additional_details}}',
    videoPromptTemplate:
      '{{persona_base}}, presenting {{product_name}} promotion, energetic and persuasive, commercial style, dynamic camera angle',
    narrationTemplate:
      'Atenção! {{promo_headline}}. {{product_description}}. {{urgency}}. {{call_to_action}}',
    defaultImageModel: 'black-forest-labs/flux-schnell',
    defaultVideoModel: 'minimax/video-01',
    defaultAspectRatio: '1:1',
    defaultVideoDuration: 5,
    overlayConfig: {
      enabled: true,
      position: 'bottom-center',
      fontSize: 36,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#E74C3CE0',
      opacity: 0.95,
      padding: 18,
    },
    variables: [
      { name: 'product_name', label: 'Produto', required: true, type: 'text', placeholder: 'Ex: Curso de Marketing Digital' },
      { name: 'promo_headline', label: 'Título da Promo', required: true, type: 'text', placeholder: 'Ex: Desconto de 50% só hoje!' },
      { name: 'product_description', label: 'Descrição', required: true, type: 'textarea', placeholder: 'Detalhes do produto/oferta' },
      { name: 'urgency', label: 'Urgência', required: false, type: 'text', placeholder: 'Ex: Só até meia-noite!', defaultValue: 'Corre que é por tempo limitado!' },
      { name: 'call_to_action', label: 'Call to Action', required: false, type: 'text', placeholder: 'Ex: Link na bio!', defaultValue: 'Clica no link da bio agora!' },
    ],
  },
  {
    name: 'Conteúdo Fitness',
    slug: 'fitness-content',
    description: 'Conteúdo de treino, exercícios e estilo de vida fitness.',
    category: 'fitness',
    icon: 'Dumbbell',
    imagePromptTemplate:
      '{{persona_base}}, in athletic wear, {{exercise_type}} pose, gym or outdoor fitness setting, dynamic composition, energetic, motivational, {{additional_details}}',
    videoPromptTemplate:
      '{{persona_base}}, performing {{exercise_type}}, athletic movement, gym or outdoor setting, dynamic camera, fitness content creator style',
    narrationTemplate:
      'Bora treinar! Hoje o treino é {{exercise_type}}. {{exercise_tip}}. {{motivation}}',
    defaultImageModel: 'black-forest-labs/flux-schnell',
    defaultVideoModel: 'minimax/video-01',
    defaultAspectRatio: '9:16',
    defaultVideoDuration: 5,
    overlayConfig: {
      enabled: true,
      position: 'bottom-center',
      fontSize: 32,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#27AE60D0',
      opacity: 0.9,
      padding: 16,
    },
    variables: [
      { name: 'exercise_type', label: 'Tipo de Exercício', required: true, type: 'select', options: ['treino de força', 'cardio', 'yoga', 'pilates', 'funcional', 'alongamento', 'HIIT'] },
      { name: 'exercise_tip', label: 'Dica do Exercício', required: false, type: 'textarea', placeholder: 'Explique a execução ou dica' },
      { name: 'motivation', label: 'Frase Motivacional', required: false, type: 'text', placeholder: 'Ex: Sem desculpas, só resultados!', defaultValue: 'Sem desculpas, só resultados!' },
      { name: 'additional_details', label: 'Detalhes da Imagem', required: false, type: 'textarea', placeholder: 'Detalhes visuais adicionais' },
    ],
  },
];

async function main() {
  console.log('Seeding campaign templates...');

  for (const template of systemTemplates) {
    await prisma.campaignTemplate.upsert({
      where: { slug: template.slug },
      update: {
        name: template.name,
        description: template.description,
        category: template.category,
        icon: template.icon,
        imagePromptTemplate: template.imagePromptTemplate,
        videoPromptTemplate: template.videoPromptTemplate,
        narrationTemplate: template.narrationTemplate,
        defaultImageModel: template.defaultImageModel,
        defaultVideoModel: template.defaultVideoModel,
        defaultAspectRatio: template.defaultAspectRatio,
        defaultVideoDuration: template.defaultVideoDuration,
        overlayConfig: template.overlayConfig,
        variables: template.variables,
        isSystem: true,
        isActive: true,
      },
      create: {
        ...template,
        isSystem: true,
        isActive: true,
      },
    });
    console.log(`  ✓ ${template.name}`);
  }

  console.log(`\nSeeded ${systemTemplates.length} templates.`);

  // ============================================
  // Subscription Plans (Sprint 6)
  // ============================================
  console.log('\nSeeding subscription plans...');

  const subscriptionPlans = [
    {
      name: 'Gratuito',
      slug: 'free',
      description: 'Para começar a explorar a plataforma',
      priceMonthly: 0,
      creditsMonthly: 50,
      features: ['50 créditos/mês', '3 personas', '5 campanhas', '100 MB storage'],
      limits: { maxPersonas: 3, maxCampaigns: 5, maxStorageMb: 100 },
      sortOrder: 0,
    },
    {
      name: 'Starter',
      slug: 'starter',
      description: 'Para criadores de conteúdo iniciantes',
      priceMonthly: 2990,
      creditsMonthly: 200,
      features: ['200 créditos/mês', '10 personas', '20 campanhas', '500 MB storage', 'Suporte prioritário'],
      limits: { maxPersonas: 10, maxCampaigns: 20, maxStorageMb: 500 },
      sortOrder: 1,
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'Para profissionais de marketing digital',
      priceMonthly: 7990,
      creditsMonthly: 600,
      features: ['600 créditos/mês', '30 personas', '50 campanhas', '2 GB storage', 'Lip Sync', 'Suporte prioritário'],
      limits: { maxPersonas: 30, maxCampaigns: 50, maxStorageMb: 2048 },
      sortOrder: 2,
    },
    {
      name: 'Agência',
      slug: 'agency',
      description: 'Para agências e equipes grandes',
      priceMonthly: 19990,
      creditsMonthly: 2000,
      features: ['2000 créditos/mês', 'Personas ilimitadas', 'Campanhas ilimitadas', '10 GB storage', 'Lip Sync', 'API access', 'Suporte dedicado'],
      limits: { maxPersonas: 999, maxCampaigns: 999, maxStorageMb: 10240 },
      sortOrder: 3,
    },
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        creditsMonthly: plan.creditsMonthly,
        features: plan.features,
        limits: plan.limits,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
      create: {
        ...plan,
        isActive: true,
      },
    });
    console.log(`  ✓ ${plan.name}`);
  }

  console.log(`\nSeeded ${subscriptionPlans.length} subscription plans.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
