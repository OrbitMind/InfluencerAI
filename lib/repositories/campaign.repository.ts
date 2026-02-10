import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { CampaignFilters } from '@/lib/types/campaign';

const campaignInclude = {
  persona: {
    select: { id: true, name: true, referenceImageUrl: true, voiceId: true, voiceName: true },
  },
  template: {
    select: { id: true, name: true, category: true, icon: true },
  },
};

const campaignIncludeFull = {
  ...campaignInclude,
  template: true,
};

export class CampaignRepository {
  async create(userId: string, data: {
    name: string;
    description?: string;
    personaId: string;
    templateId: string;
    variables?: Record<string, string>;
    captionPresetId?: string;
    captionCustomStyle?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
    captionSegmentationMode?: string;
    useLipSync?: boolean;
    lipSyncModel?: string;
  }) {
    return prisma.campaign.create({
      data: {
        userId,
        ...data,
      },
      include: campaignInclude,
    });
  }

  async findById(id: string, userId: string) {
    return prisma.campaign.findFirst({
      where: { id, userId },
      include: campaignIncludeFull,
    });
  }

  async findAllByUser(userId: string, filters?: CampaignFilters) {
    const {
      status,
      personaId,
      templateId,
      search,
      page = 1,
      limit = 12,
      orderBy = 'createdAt',
      orderDir = 'desc',
    } = filters || {};

    const where: Record<string, unknown> = { userId };

    if (status) where.status = status;
    if (personaId) where.personaId = personaId;
    if (templateId) where.templateId = templateId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const offset = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: campaignInclude,
        orderBy: { [orderBy]: orderDir },
        take: limit,
        skip: offset,
      }),
      prisma.campaign.count({ where }),
    ]);

    return { campaigns, total };
  }

  async update(id: string, userId: string, data: Record<string, unknown>) {
    return prisma.campaign.update({
      where: { id, userId },
      data,
      include: campaignInclude,
    });
  }

  async updateStatus(id: string, userId: string, status: string, extra?: Record<string, unknown>) {
    return prisma.campaign.update({
      where: { id, userId },
      data: { status, ...extra },
      include: campaignInclude,
    });
  }

  async delete(id: string, userId: string) {
    await prisma.campaign.delete({
      where: { id, userId },
    });
  }
}
