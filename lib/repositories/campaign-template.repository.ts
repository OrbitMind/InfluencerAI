import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export interface TemplateFilters {
  category?: string;
  search?: string;
  isActive?: boolean;
}

export class CampaignTemplateRepository {
  private readonly include = {
    _count: { select: { campaigns: true } },
  };

  async findAll(filters?: TemplateFilters) {
    const where: Record<string, unknown> = { isActive: true };

    if (filters?.category) where.category = filters.category;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.campaignTemplate.findMany({
      where,
      include: this.include,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.campaignTemplate.findUnique({
      where: { id },
      include: this.include,
    });
  }

  async findBySlug(slug: string) {
    return prisma.campaignTemplate.findUnique({
      where: { slug },
      include: this.include,
    });
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    category: string;
    icon?: string;
    imagePromptTemplate?: string;
    videoPromptTemplate?: string;
    narrationTemplate?: string;
    defaultImageModel?: string;
    defaultVideoModel?: string;
    defaultAspectRatio?: string;
    defaultVideoDuration?: number;
    overlayConfig?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    variables?: Prisma.InputJsonValue;
    isSystem?: boolean;
  }) {
    return prisma.campaignTemplate.create({
      data,
      include: this.include,
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return prisma.campaignTemplate.update({
      where: { id },
      data,
      include: this.include,
    });
  }

  async delete(id: string) {
    await prisma.campaignTemplate.delete({
      where: { id },
    });
  }
}
