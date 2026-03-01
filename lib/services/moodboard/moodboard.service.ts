import { MoodboardRepository } from '@/lib/repositories/moodboard.repository'
import type { MoodboardData, MoodboardItemData, CreateMoodboardItemDTO, UpdateMoodboardDTO } from '@/lib/types/moodboard'

/**
 * MoodboardService (SRP)
 * Responsabilidade única: operações CRUD do moodboard e seus itens.
 * Geração de AI summary é responsabilidade de MoodboardAiService.
 */
export class MoodboardService {
  private repository = new MoodboardRepository()

  async getMoodboard(personaId: string): Promise<MoodboardData> {
    const existing = await this.repository.findByPersonaId(personaId)
    if (existing) return existing
    return this.repository.upsert(personaId)
  }

  async updateMoodboard(personaId: string, data: UpdateMoodboardDTO): Promise<MoodboardData> {
    return this.repository.upsert(personaId, data)
  }

  async addItem(personaId: string, data: CreateMoodboardItemDTO): Promise<MoodboardItemData> {
    return this.repository.addItem(personaId, data)
  }

  async removeItem(personaId: string, itemId: string): Promise<void> {
    const moodboard = await this.getMoodboard(personaId)
    await this.repository.removeItem(moodboard.id, itemId)
  }

  async reorderItems(items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await this.repository.reorderItems(items)
  }
}
