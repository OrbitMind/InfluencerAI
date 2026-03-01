import { prisma } from '@/lib/db'
import { UGC_TEMPLATES } from '@/lib/constants/ugc-templates'

/**
 * UGCSeedService (SRP)
 * Responsabilidade única: inserir templates UGC pré-definidos no banco de dados.
 * Operação idempotente — usa upsert por slug.
 */
export class UGCSeedService {
  async seedUGCTemplates(): Promise<{ created: number; updated: number }> {
    let created = 0
    let updated = 0

    for (const template of UGC_TEMPLATES) {
      const existing = await prisma.campaignTemplate.findUnique({
        where: { slug: template.slug },
      })

      const data = {
        name: template.name,
        slug: template.slug,
        description: template.description,
        category: 'ugc',
        icon: template.icon,
        imagePromptTemplate: template.imagePromptTemplate,
        videoPromptTemplate: template.videoPromptTemplate,
        narrationTemplate: template.narrationTemplate ?? null,
        defaultCameraMovement: template.defaultCameraMovement,
        variables: template.variables,
        isSystem: true,
        isActive: true,
      }

      if (existing) {
        await prisma.campaignTemplate.update({ where: { slug: template.slug }, data })
        updated++
      } else {
        await prisma.campaignTemplate.create({ data })
        created++
      }
    }

    return { created, updated }
  }

  async getUGCTemplates() {
    return prisma.campaignTemplate.findMany({
      where: { category: 'ugc', isActive: true },
      orderBy: { createdAt: 'asc' },
    })
  }
}
