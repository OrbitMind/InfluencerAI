import type {
  User,
  Persona,
  Campaign,
  CampaignTemplate,
  CreditBalance,
  CreditTransaction,
  Generation,
  SubscriptionPlan,
} from '@prisma/client'

let userIdCounter = 1
let personaIdCounter = 1
let campaignIdCounter = 1
let templateIdCounter = 1
let generationIdCounter = 1

export function createMockUser(overrides?: Partial<User>): User {
  const id = `user-${userIdCounter++}`
  return {
    id,
    name: 'Test User',
    email: `test-${id}@example.com`,
    emailVerified: new Date(),
    image: null,
    password: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockPersona(overrides?: Partial<Persona>): Persona {
  const id = `persona-${personaIdCounter++}`
  return {
    id,
    userId: 'user-1',
    name: 'Test Persona',
    slug: `test-persona-${personaIdCounter}`,
    bio: null,
    gender: 'female',
    ageRange: '25-35',
    ethnicity: 'caucasian',
    bodyType: 'athletic',
    hairColor: 'blonde',
    hairStyle: 'long',
    eyeColor: 'blue',
    distinctiveFeatures: null,
    styleDescription: null,
    niche: 'fitness',
    targetPlatform: 'instagram',
    contentTone: null,
    language: 'pt-BR',
    referenceImageUrl: null,
    referenceImageId: null,
    voiceId: null,
    voiceProvider: null,
    voiceName: null,
    voicePreviewUrl: null,
    voiceSettings: null,
    basePrompt: 'A 25-35 year old caucasian female with athletic body type',
    isActive: true,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockCampaign(overrides?: Partial<Campaign>): Campaign {
  const id = `campaign-${campaignIdCounter++}`
  return {
    id,
    userId: 'user-1',
    name: 'Test Campaign',
    description: 'Test campaign description',
    personaId: 'persona-1',
    templateId: 'template-1',
    variables: { product_name: 'Test Product' },
    status: 'draft',
    errorMessage: null,
    imageUrl: null,
    imagePublicId: null,
    videoUrl: null,
    videoPublicId: null,
    videoThumbnailUrl: null,
    audioUrl: null,
    audioPublicId: null,
    composedImageUrl: null,
    composedImagePublicId: null,
    captionPresetId: null,
    captionCustomStyle: null,
    captionSegmentationMode: 'timed',
    subtitleData: null,
    srtUrl: null,
    composedVideoUrl: null,
    composedVideoPublicId: null,
    useLipSync: false,
    lipSyncModel: null,
    lipSyncVideoUrl: null,
    lipSyncVideoPublicId: null,
    executionLog: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockTemplate(overrides?: Partial<CampaignTemplate>): CampaignTemplate {
  const id = `template-${templateIdCounter++}`
  return {
    id,
    name: 'Test Template',
    slug: `test-template-${templateIdCounter}`,
    description: 'A test template',
    category: 'product-demo',
    icon: null,
    imagePromptTemplate: '{{persona_base_prompt}} showcasing {{product_name}}',
    videoPromptTemplate: '{{persona_base_prompt}} demonstrating {{product_name}}',
    narrationTemplate: 'Check out this amazing {{product_name}}!',
    defaultImageModel: null,
    defaultVideoModel: null,
    defaultAspectRatio: null,
    defaultVideoDuration: null,
    defaultCameraMovement: null,
    overlayConfig: null,
    variables: { product_name: { type: 'text', label: 'Product Name', required: true } },
    isSystem: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockCreditBalance(overrides?: Partial<CreditBalance>): CreditBalance {
  return {
    id: 'balance-1',
    userId: 'user-1',
    balance: 100,
    updatedAt: new Date(),
    ...overrides,
  }
}

export function createMockCreditTransaction(
  overrides?: Partial<CreditTransaction>
): CreditTransaction {
  return {
    id: 'transaction-1',
    userId: 'user-1',
    amount: -10,
    type: 'usage',
    description: 'Image generation',
    metadata: { operationType: 'image' },
    balanceAfter: 90,
    createdAt: new Date(),
    ...overrides,
  }
}

export function createMockGeneration(overrides?: Partial<Generation>): Generation {
  const id = `generation-${generationIdCounter++}`
  return {
    id,
    userId: 'user-1',
    type: 'image',
    modelId: 'flux-dev',
    prompt: 'A test prompt',
    settings: { width: 1024, height: 1024 },
    outputUrl: 'https://res.cloudinary.com/mock/output.png',
    publicId: 'mock-output-id',
    thumbnailUrl: null,
    fileSize: null,
    width: null,
    height: null,
    duration: null,
    personaId: null,
    createdAt: new Date(),
    ...overrides,
  }
}

export function createMockSubscriptionPlan(
  overrides?: Partial<SubscriptionPlan>
): SubscriptionPlan {
  return {
    id: 'plan-1',
    name: 'Starter',
    slug: 'starter',
    description: 'Starter plan',
    priceMonthly: 2990,
    creditsMonthly: 200,
    features: ['200 créditos mensais', 'Suporte por email'],
    limits: { personas: 5, campaigns: 20 },
    stripePriceId: 'price_123',
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// Reset counters (útil para testes)
export function resetFactoryCounters() {
  userIdCounter = 1
  personaIdCounter = 1
  campaignIdCounter = 1
  templateIdCounter = 1
  generationIdCounter = 1
}
