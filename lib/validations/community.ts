import { z } from 'zod'

export const createCommunityPostSchema = z.object({
  generationId: z.string().optional(),
  campaignId: z.string().optional(),
  title: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  mediaUrl: z.string().url('URL de mídia inválida'),
  mediaType: z.enum(['image', 'video']),
  thumbnailUrl: z.string().url().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
  contestId: z.string().optional(),
})

export const updateCommunityPostSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  isPublic: z.boolean().optional(),
})

export const communityFiltersSchema = z.object({
  tags: z.array(z.string()).optional(),
  contestId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  orderBy: z.enum(['createdAt', 'likes', 'views']).default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateCommunityPostInput = z.infer<typeof createCommunityPostSchema>
export type UpdateCommunityPostInput = z.infer<typeof updateCommunityPostSchema>
export type CommunityFiltersInput = z.infer<typeof communityFiltersSchema>
