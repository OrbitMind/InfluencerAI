import { CommunityRepository } from '@/lib/repositories/community.repository'
import type { ContestData } from '@/lib/types/community'

/**
 * ContestService (SRP)
 * Responsabilidade única: consulta e gerenciamento de contests da comunidade.
 */
export class ContestService {
  private repository = new CommunityRepository()

  async listActive(): Promise<ContestData[]> {
    return this.repository.findContests(true)
  }

  async listAll(): Promise<ContestData[]> {
    return this.repository.findContests(false)
  }

  async get(id: string): Promise<ContestData> {
    const contest = await this.repository.findContest(id)
    if (!contest) throw new Error('Contest não encontrado')
    return contest
  }
}
