import { z } from 'zod'

export const captionStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().min(8).max(120).optional(),
  fontWeight: z.number().min(100).max(900).optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  backgroundOpacity: z.number().min(0).max(1).optional(),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().min(0).max(10).optional(),
  position: z.enum(['top', 'center', 'bottom']).optional(),
  animation: z.enum(['fade-in', 'slide-up', 'pop-scale', 'typewriter', 'bounce', 'none']).optional(),
  animationDuration: z.number().min(0).max(5).optional(),
  letterSpacing: z.number().min(-5).max(20).optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  borderRadius: z.number().min(0).max(50).optional(),
})

export const templateVariableSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean(),
  type: z.enum(['text', 'textarea', 'select']),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
})

export const overlayConfigSchema = z.object({
  enabled: z.boolean(),
  position: z.enum(['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right']),
  fontSize: z.number().min(8).max(120),
  fontFamily: z.string(),
  color: z.string(),
  backgroundColor: z.string(),
  opacity: z.number().min(0).max(1),
  padding: z.number().min(0).max(100),
  text: z.string().optional(),
})

export const createTemplateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1),
  icon: z.string().optional(),
  imagePromptTemplate: z.string().optional(),
  videoPromptTemplate: z.string().optional(),
  narrationTemplate: z.string().optional(),
  defaultImageModel: z.string().optional(),
  defaultVideoModel: z.string().optional(),
  defaultAspectRatio: z.string().optional(),
  defaultVideoDuration: z.number().int().min(1).max(60).optional(),
  overlayConfig: overlayConfigSchema.optional(),
  variables: z.array(templateVariableSchema).default([]),
  isSystem: z.boolean().default(false),
})

export const createCampaignSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  description: z.string().max(500).optional(),
  personaId: z.string().min(1, 'Selecione uma persona'),
  templateId: z.string().min(1, 'Selecione um template'),
  variables: z.record(z.string()).optional(),
  captionPresetId: z.string().optional(),
  captionCustomStyle: captionStyleSchema.optional(),
  captionSegmentationMode: z.enum(['word', 'sentence', 'timed']).optional(),
  useLipSync: z.boolean().optional(),
  lipSyncModel: z.enum(['sadtalker', 'wav2lip', 'liveportrait']).optional(),
})

export const updateCampaignSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  variables: z.record(z.string()).optional(),
  captionPresetId: z.string().optional(),
  captionCustomStyle: captionStyleSchema.optional(),
  captionSegmentationMode: z.enum(['word', 'sentence', 'timed']).optional(),
  useLipSync: z.boolean().optional(),
  lipSyncModel: z.enum(['sadtalker', 'wav2lip', 'liveportrait']).optional(),
})

export const executeCampaignSchema = z.object({
  steps: z.array(z.enum(['image', 'video', 'audio', 'lip-sync', 'compose', 'captions'])).optional(),
  imageModel: z.string().optional(),
  videoModel: z.string().optional(),
  faceConsistencyStrategy: z.string().optional(),
  aspectRatio: z.string().optional(),
  videoDuration: z.number().int().min(1).max(60).optional(),
  captionPresetId: z.string().optional(),
  captionCustomStyle: captionStyleSchema.optional(),
  useLipSync: z.boolean().optional(),
  lipSyncModel: z.enum(['sadtalker', 'wav2lip', 'liveportrait']).optional(),
})

export const campaignFiltersSchema = z.object({
  status: z.enum(['draft', 'running', 'completed', 'failed']).optional(),
  personaId: z.string().optional(),
  templateId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
  orderBy: z.enum(['createdAt', 'name', 'updatedAt']).default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
})
