export type CommunityMediaType = 'image' | 'video'

export interface CommunityPostData {
  id: string
  userId: string
  user: { name: string | null; image: string | null }
  generationId: string | null
  campaignId: string | null
  title: string | null
  description: string | null
  mediaUrl: string
  mediaType: CommunityMediaType
  thumbnailUrl: string | null
  isPublic: boolean
  tags: string[]
  likes: number
  views: number
  contestId: string | null
  contest: ContestData | null
  createdAt: Date
  updatedAt: Date
}

export interface ContestData {
  id: string
  title: string
  description: string
  prize: string
  theme: string
  startsAt: Date
  endsAt: Date
  isActive: boolean
  winnerId: string | null
  _count?: { entries: number }
  createdAt: Date
  updatedAt: Date
}

export interface CreateCommunityPostDTO {
  generationId?: string
  campaignId?: string
  title?: string
  description?: string
  mediaUrl: string
  mediaType: CommunityMediaType
  thumbnailUrl?: string
  tags?: string[]
  contestId?: string
}

export interface CommunityFilters {
  tags?: string[]
  contestId?: string
  userId?: string
  search?: string
  page?: number
  limit?: number
  orderBy?: 'createdAt' | 'likes' | 'views'
  orderDir?: 'asc' | 'desc'
}
