import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

interface CreateAssetInput {
  personaId: string
  type: string
  url: string
  publicId?: string
  prompt?: string
  modelId?: string
  metadata?: Prisma.InputJsonValue
}

export class PersonaAssetRepository {
  async create(data: CreateAssetInput) {
    return prisma.personaAsset.create({ data });
  }

  async findByPersona(personaId: string, type?: string) {
    return prisma.personaAsset.findMany({
      where: {
        personaId,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.personaAsset.findUnique({ where: { id } });
  }

  async delete(id: string) {
    return prisma.personaAsset.delete({ where: { id } });
  }

  async toggleFavorite(id: string) {
    const asset = await prisma.personaAsset.findUnique({ where: { id } });
    if (!asset) throw new Error('Asset não encontrado');

    return prisma.personaAsset.update({
      where: { id },
      data: { isFavorite: !asset.isFavorite },
    });
  }

  async countByPersona(personaId: string) {
    return prisma.personaAsset.count({ where: { personaId } });
  }
}
