import { prisma } from '@/lib/db';

/**
 * Repository para gerenciamento de Gerações
 * Data Access Layer - Camada de acesso a dados
 *
 * Princípios aplicados:
 * - Single Responsibility: Apenas operações de banco relacionadas a Gerações
 * - Separation of Concerns: Lógica de negócio fica nos Services
 */
export class GenerationRepository {
  async create(data: {
    userId: string;
    type: 'image' | 'video';
    modelId: string;
    prompt: string;
    settings?: object;
    outputUrl: string;
    publicId: string;
    thumbnailUrl?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    duration?: number;
    personaId?: string;
  }) {
    return prisma.generation.create({ data });
  }

  async findByUser(userId: string, options?: {
    type?: 'image' | 'video';
    limit?: number;
    offset?: number;
  }) {
    const { type, limit = 20, offset = 0 } = options || {};

    return prisma.generation.findMany({
      where: {
        userId,
        ...(type && { type })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  async findById(id: string, userId: string) {
    return prisma.generation.findFirst({
      where: { id, userId }
    });
  }

  async delete(id: string, userId: string) {
    return prisma.generation.delete({
      where: { id, userId }
    });
  }

  async count(userId: string, type?: 'image' | 'video') {
    return prisma.generation.count({
      where: {
        userId,
        ...(type && { type })
      }
    });
  }
}
