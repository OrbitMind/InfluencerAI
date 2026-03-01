// ============================================
// SOCIAL PUBLISHING TYPES (Sprint 7)
// ============================================

import { SocialAccount, ScheduledPost } from '@prisma/client'

// ============================================
// OAUTH & AUTHENTICATION
// ============================================

export interface SocialTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scopes?: string
}

export interface SocialProfile {
  platformUserId: string
  username?: string
  displayName?: string
  avatarUrl?: string
}

// ============================================
// PUBLISHING
// ============================================

export interface PublishParams {
  socialAccountId: string
  mediaUrl: string
  mediaType: 'image' | 'video' | 'carousel'
  caption?: string
  hashtags?: string
}

export interface PublishResult {
  platformPostId: string
  platformPostUrl: string
}

// ============================================
// SCHEDULING
// ============================================

export interface SchedulePostDTO {
  socialAccountId: string
  campaignId?: string
  mediaUrl: string
  mediaType: 'image' | 'video' | 'carousel'
  caption?: string
  hashtags?: string
  scheduledFor: Date
}

export interface ScheduleFilters {
  status?: 'scheduled' | 'publishing' | 'published' | 'failed' | 'canceled'
  platform?: 'instagram' | 'tiktok' | 'youtube'
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProcessResult {
  processed: number
  published: number
  failed: number
  errors?: Array<{ postId: string; error: string }>
}

// ============================================
// TIME SUGGESTIONS
// ============================================

export interface SuggestedTime {
  dayOfWeek: string
  time: string
  engagementLevel: 'high' | 'medium' | 'low'
  description?: string
}

// ============================================
// PLATFORM CONFIGURATIONS
// ============================================

export interface PlatformConfig {
  id: 'instagram' | 'tiktok' | 'youtube' | 'whatsapp'
  name: string
  icon: string
  types: string[]
  oauthRequired: boolean
  apiDocs: string
  captionMaxLength: number
  hashtagMaxCount: number
  status: 'active' | 'stub' // 'active' = fully implemented, 'stub' = coming soon
}

export const SUPPORTED_PLATFORMS: PlatformConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    types: ['feed', 'reels', 'story'],
    oauthRequired: true,
    apiDocs: 'https://developers.facebook.com/docs/instagram-api/',
    captionMaxLength: 2200,
    hashtagMaxCount: 30,
    status: 'active',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    types: ['video'],
    oauthRequired: true,
    apiDocs: 'https://developers.tiktok.com/',
    captionMaxLength: 150,
    hashtagMaxCount: 30,
    status: 'active',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    types: ['shorts', 'video'],
    oauthRequired: true,
    apiDocs: 'https://developers.google.com/youtube/v3/',
    captionMaxLength: 5000,
    hashtagMaxCount: 15,
    status: 'active',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Status',
    icon: '💬',
    types: ['status'],
    oauthRequired: false,
    apiDocs: '',
    captionMaxLength: 0, // No caption in share link
    hashtagMaxCount: 0,
    status: 'active',
  },
] as const

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export interface SocialAccountWithPosts extends SocialAccount {
  scheduledPosts: ScheduledPost[]
  _count?: {
    scheduledPosts: number
  }
}

export interface ScheduledPostWithRelations extends ScheduledPost {
  socialAccount: SocialAccount
  campaign?: {
    id: string
    name: string
  } | null
}

// ============================================
// INSTAGRAM SPECIFIC
// ============================================

export interface InstagramPublishParams {
  accessToken: string
  mediaUrl: string
  mediaType: 'REELS' | 'IMAGE' | 'STORIES'
  caption?: string
  userId: string // Instagram Business Account ID
}

export interface InstagramContainerResponse {
  id: string // Container ID
}

export interface InstagramPublishResponse {
  id: string // Media ID (post ID)
}

// ============================================
// TIKTOK SPECIFIC (Stub)
// ============================================

export interface TikTokPublishParams {
  accessToken: string
  videoUrl: string
  caption?: string
}

// ============================================
// YOUTUBE SPECIFIC (Stub)
// ============================================

export interface YouTubePublishParams {
  accessToken: string
  videoUrl: string
  title: string
  description?: string
  isShort: boolean
}

// ============================================
// ERROR TYPES
// ============================================

export class SocialPublishError extends Error {
  constructor(
    message: string,
    public platform: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'SocialPublishError'
  }
}

export class TokenExpiredError extends Error {
  constructor(message: string = 'Token expired') {
    super(message)
    this.name = 'TokenExpiredError'
  }
}

// ============================================
// STATUS TYPES
// ============================================

export type PostStatus = 'scheduled' | 'publishing' | 'published' | 'failed' | 'canceled'

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  scheduled: 'Agendado',
  publishing: 'Publicando',
  published: 'Publicado',
  failed: 'Falhou',
  canceled: 'Cancelado',
}

export const POST_STATUS_COLORS: Record<PostStatus, string> = {
  scheduled: 'blue',
  publishing: 'yellow',
  published: 'green',
  failed: 'red',
  canceled: 'gray',
}

// ============================================
// WHATSAPP SHARE (Sprint 9)
// ============================================

export interface WhatsAppShareParams {
  text?: string
  mediaUrl?: string
  phoneNumber?: string // With country code, without +
}

export interface WhatsAppMedia {
  optimizedUrl: string
  originalUrl: string
  fileSize: number
  duration?: number
  format: string
  needsTrim: boolean
  instructions: string[]
}
