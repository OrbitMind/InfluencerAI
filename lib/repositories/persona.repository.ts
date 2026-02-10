import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { CreatePersonaDTO, UpdatePersonaDTO, PersonaFilters } from '@/lib/types/persona';

export class PersonaRepository {
  async create(userId: string, data: CreatePersonaDTO & { slug: string; basePrompt?: string }) {
    return prisma.persona.create({
      data: {
        userId,
        ...data,
      },
      include: {
        assets: true,
        _count: { select: { generations: true } },
      },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.persona.findFirst({
      where: { id, userId },
      include: {
        assets: { orderBy: { createdAt: 'desc' } },
        _count: { select: { generations: true } },
      },
    });
  }

  async findBySlug(slug: string, userId: string) {
    return prisma.persona.findFirst({
      where: { slug, userId },
      include: {
        assets: { orderBy: { createdAt: 'desc' } },
        _count: { select: { generations: true } },
      },
    });
  }

  async slugExists(slug: string, userId: string): Promise<boolean> {
    const count = await prisma.persona.count({
      where: { slug, userId },
    });
    return count > 0;
  }

  async findAllByUser(userId: string, filters?: PersonaFilters) {
    const {
      niche,
      targetPlatform,
      isActive,
      isArchived = false,
      search,
      page = 1,
      limit = 12,
      orderBy = 'createdAt',
      orderDir = 'desc',
    } = filters || {};

    const where: Record<string, unknown> = { userId };

    if (niche) where.niche = niche;
    if (targetPlatform) where.targetPlatform = targetPlatform;
    if (isActive !== undefined) where.isActive = isActive;
    if (isArchived !== undefined) where.isArchived = isArchived;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    const offset = (page - 1) * limit;

    const [personas, total] = await Promise.all([
      prisma.persona.findMany({
        where,
        include: {
          assets: { orderBy: { createdAt: 'desc' }, take: 5 },
          _count: { select: { generations: true } },
        },
        orderBy: { [orderBy]: orderDir },
        take: limit,
        skip: offset,
      }),
      prisma.persona.count({ where }),
    ]);

    return { personas, total };
  }

  async update(id: string, userId: string, data: UpdatePersonaDTO & {
    slug?: string;
    basePrompt?: string;
    referenceImageUrl?: string;
    referenceImageId?: string | null;
    voiceProvider?: string | null;
    voiceId?: string | null;
    voiceName?: string | null;
    voicePreviewUrl?: string | null;
    voiceSettings?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
  }) {
    return prisma.persona.update({
      where: { id, userId },
      data,
      include: {
        assets: { orderBy: { createdAt: 'desc' } },
        _count: { select: { generations: true } },
      },
    });
  }

  async delete(id: string, userId: string) {
    await prisma.persona.delete({
      where: { id, userId },
    });
  }

  async archive(id: string, userId: string, isArchived: boolean) {
    return prisma.persona.update({
      where: { id, userId },
      data: { isArchived, isActive: !isArchived },
      include: {
        assets: { orderBy: { createdAt: 'desc' } },
        _count: { select: { generations: true } },
      },
    });
  }

  async countByUser(userId: string) {
    return prisma.persona.count({ where: { userId } });
  }
}
