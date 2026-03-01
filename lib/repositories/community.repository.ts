import { prisma } from '@/lib/db'
import type { CommunityPostData, ContestData, CreateCommunityPostDTO, CommunityFilters } from '@/lib/types/community'

export class CommunityRepository {
  async findPublic(
    filters: CommunityFilters = {}
  ): Promise<{ items: CommunityPostData[]; total: number }> {
    const { tags, contestId, search, page = 1, limit = 12, orderBy = 'createdAt', orderDir = 'desc' } = filters
    const skip = (page - 1) * limit

    const where = {
      isPublic: true,
      ...(contestId && { contestId }),
      ...(tags?.length && { tags: { hasSome: tags } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { tags: { hasSome: [search] } },
        ],
      }),
    }

    const [items, total] = await prisma.$transaction([
      prisma.communityPost.findMany({
        where,
        include: {
          user: { select: { name: true, image: true } },
          contest: true,
        },
        orderBy: { [orderBy]: orderDir },
        skip,
        take: limit,
      }),
      prisma.communityPost.count({ where }),
    ])

    return { items: items as unknown as CommunityPostData[], total }
  }

  async findByUser(
    userId: string,
    filters: CommunityFilters = {}
  ): Promise<{ items: CommunityPostData[]; total: number }> {
    const { page = 1, limit = 12 } = filters
    const skip = (page - 1) * limit

    const where = { userId }

    const [items, total] = await prisma.$transaction([
      prisma.communityPost.findMany({
        where,
        include: {
          user: { select: { name: true, image: true } },
          contest: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.communityPost.count({ where }),
    ])

    return { items: items as unknown as CommunityPostData[], total }
  }

  async findById(id: string): Promise<CommunityPostData | null> {
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, image: true } },
        contest: true,
      },
    })
    return post as unknown as CommunityPostData | null
  }

  async create(userId: string, data: CreateCommunityPostDTO): Promise<CommunityPostData> {
    const post = await prisma.communityPost.create({
      data: { userId, isPublic: true, ...data },
      include: {
        user: { select: { name: true, image: true } },
        contest: true,
      },
    })
    return post as unknown as CommunityPostData
  }

  async update(
    userId: string,
    id: string,
    data: Partial<{ title: string; description: string; tags: string[]; isPublic: boolean }>
  ): Promise<CommunityPostData> {
    const post = await prisma.communityPost.update({
      where: { id },
      data,
      include: {
        user: { select: { name: true, image: true } },
        contest: true,
      },
    })
    return post as unknown as CommunityPostData
  }

  async delete(userId: string, id: string): Promise<void> {
    await prisma.communityPost.deleteMany({ where: { id, userId } })
  }

  async incrementLikes(id: string): Promise<void> {
    await prisma.communityPost.update({
      where: { id },
      data: { likes: { increment: 1 } },
    })
  }

  async incrementViews(id: string): Promise<void> {
    await prisma.communityPost.update({
      where: { id },
      data: { views: { increment: 1 } },
    })
  }

  async findContests(onlyActive = true): Promise<ContestData[]> {
    const contests = await prisma.contest.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      include: { _count: { select: { entries: true } } },
      orderBy: { endsAt: 'asc' },
    })
    return contests as unknown as ContestData[]
  }

  async findContest(id: string): Promise<ContestData | null> {
    const contest = await prisma.contest.findUnique({
      where: { id },
      include: { _count: { select: { entries: true } } },
    })
    return contest as unknown as ContestData | null
  }
}
