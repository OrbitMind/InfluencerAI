import { prisma } from '@/lib/db'
import type { ProductAssetData, CreateProductAssetDTO, ProductAssetFilters } from '@/lib/types/fashion'

export class ProductAssetRepository {
  async findByUserId(
    userId: string,
    filters: ProductAssetFilters = {}
  ): Promise<{ items: ProductAssetData[]; total: number }> {
    const { category, search, page = 1, limit = 12 } = filters
    const skip = (page - 1) * limit

    const where = {
      userId,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { brandName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [items, total] = await prisma.$transaction([
      prisma.productAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productAsset.count({ where }),
    ])

    return {
      items: items.map((item) => ({
        ...item,
        metadata: item.metadata as Record<string, unknown> | null,
      })),
      total,
    }
  }

  async findById(userId: string, id: string): Promise<ProductAssetData | null> {
    const item = await prisma.productAsset.findFirst({ where: { id, userId } })
    if (!item) return null
    return { ...item, metadata: item.metadata as Record<string, unknown> | null }
  }

  async create(userId: string, data: CreateProductAssetDTO): Promise<ProductAssetData> {
    const item = await prisma.productAsset.create({
      data: { userId, ...data },
    })
    return { ...item, metadata: item.metadata as Record<string, unknown> | null }
  }

  async updateBgRemoved(
    userId: string,
    id: string,
    bgRemovedUrl: string,
    bgRemovedId: string
  ): Promise<ProductAssetData> {
    const item = await prisma.productAsset.update({
      where: { id },
      data: { bgRemovedUrl, bgRemovedId },
    })
    return { ...item, metadata: item.metadata as Record<string, unknown> | null }
  }

  async delete(userId: string, id: string): Promise<void> {
    await prisma.productAsset.deleteMany({ where: { id, userId } })
  }
}
