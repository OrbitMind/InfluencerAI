import { CommunityRepository } from '@/lib/repositories/community.repository'
import type { CommunityPostData, CreateCommunityPostDTO, CommunityFilters } from '@/lib/types/community'

/**
 * CommunityPostService (SRP)
 * Responsabilidade única: gerenciamento de posts públicos da comunidade.
 */
export class CommunityPostService {
  private repository = new CommunityRepository()

  async listPublic(filters: CommunityFilters = {}): Promise<{ items: CommunityPostData[]; total: number; page: number; pages: number }> {
    const { page = 1, limit = 12 } = filters
    const { items, total } = await this.repository.findPublic(filters)
    return { items, total, page, pages: Math.ceil(total / limit) }
  }

  async listByUser(userId: string, filters: CommunityFilters = {}): Promise<{ items: CommunityPostData[]; total: number }> {
    return this.repository.findByUser(userId, filters)
  }

  async get(id: string): Promise<CommunityPostData> {
    const post = await this.repository.findById(id)
    if (!post) throw new Error('Post não encontrado')
    await this.repository.incrementViews(id)
    return post
  }

  async create(userId: string, data: CreateCommunityPostDTO): Promise<CommunityPostData> {
    return this.repository.create(userId, data)
  }

  async update(
    userId: string,
    id: string,
    data: Partial<{ title: string; description: string; tags: string[]; isPublic: boolean }>
  ): Promise<CommunityPostData> {
    const post = await this.repository.findById(id)
    if (!post) throw new Error('Post não encontrado')
    if (post.userId !== userId) throw new Error('Acesso negado')
    return this.repository.update(userId, id, data)
  }

  async delete(userId: string, id: string): Promise<void> {
    const post = await this.repository.findById(id)
    if (!post) throw new Error('Post não encontrado')
    if (post.userId !== userId) throw new Error('Acesso negado')
    await this.repository.delete(userId, id)
  }

  async like(id: string): Promise<void> {
    const post = await this.repository.findById(id)
    if (!post) throw new Error('Post não encontrado')
    await this.repository.incrementLikes(id)
  }
}
