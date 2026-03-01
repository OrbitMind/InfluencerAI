import { prisma } from '@/lib/db'
import type { MoodboardData, MoodboardItemData, CreateMoodboardItemDTO, UpdateMoodboardDTO } from '@/lib/types/moodboard'

export class MoodboardRepository {
  async findByPersonaId(personaId: string): Promise<MoodboardData | null> {
    const moodboard = await prisma.moodboard.findUnique({
      where: { personaId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!moodboard) return null

    return {
      ...moodboard,
      colorPalette: moodboard.colorPalette as string[] | null,
    }
  }

  async upsert(personaId: string, data: UpdateMoodboardDTO = {}): Promise<MoodboardData> {
    const moodboard = await prisma.moodboard.upsert({
      where: { personaId },
      create: {
        personaId,
        colorPalette: data.colorPalette ?? [],
        styleTags: data.styleTags ?? [],
      },
      update: {
        ...(data.colorPalette !== undefined && { colorPalette: data.colorPalette }),
        ...(data.styleTags !== undefined && { styleTags: data.styleTags }),
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return {
      ...moodboard,
      colorPalette: moodboard.colorPalette as string[] | null,
    }
  }

  async updateAiSummary(personaId: string, aiSummary: string): Promise<void> {
    await prisma.moodboard.update({
      where: { personaId },
      data: { aiSummary },
    })
  }

  async addItem(personaId: string, data: CreateMoodboardItemDTO): Promise<MoodboardItemData> {
    const moodboard = await this.upsert(personaId)

    const lastItem = await prisma.moodboardItem.findFirst({
      where: { moodboardId: moodboard.id },
      orderBy: { sortOrder: 'desc' },
    })

    return prisma.moodboardItem.create({
      data: {
        moodboardId: moodboard.id,
        imageUrl: data.imageUrl,
        publicId: data.publicId,
        caption: data.caption ?? null,
        category: data.category ?? null,
        sortOrder: (lastItem?.sortOrder ?? -1) + 1,
      },
    })
  }

  async removeItem(moodboardId: string, itemId: string): Promise<void> {
    await prisma.moodboardItem.deleteMany({
      where: { id: itemId, moodboardId },
    })
  }

  async reorderItems(items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        prisma.moodboardItem.update({ where: { id }, data: { sortOrder } })
      )
    )
  }

  async deleteByPersonaId(personaId: string): Promise<void> {
    await prisma.moodboard.deleteMany({ where: { personaId } })
  }
}
