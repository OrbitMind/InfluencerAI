import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SubscriptionService } from '@/lib/services/billing/subscription.service'
import { SubscriptionRepository } from '@/lib/repositories/subscription.repository'
import { createMockSubscriptionPlan } from '../factories'

vi.mock('@/lib/repositories/subscription.repository')

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService
  let mockRepository: any

  beforeEach(() => {
    mockRepository = {
      findByUser: vi.fn(),
      getPlans: vi.fn(),
      getPlanBySlug: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsertByUser: vi.fn(),
    }
    vi.mocked(SubscriptionRepository).mockImplementation(() => mockRepository)
    subscriptionService = new SubscriptionService()
  })

  describe('getUserSubscription', () => {
    it('retorna subscription com plan details', async () => {
      const mockSub = {
        id: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        stripeSubscriptionId: 'sub_stripe_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        cancelAtPeriodEnd: false,
        plan: createMockSubscriptionPlan(),
      }
      mockRepository.findByUser.mockResolvedValue(mockSub)

      const result = await subscriptionService.getUserSubscription('user-1')

      expect(result).toMatchObject({
        id: 'sub-1',
        status: 'active',
        cancelAtPeriodEnd: false,
        stripeCustomerId: 'cus_123',
      })
    })

    it('retorna null se não tem subscription', async () => {
      mockRepository.findByUser.mockResolvedValue(null)

      const result = await subscriptionService.getUserSubscription('user-1')

      expect(result).toBeNull()
    })
  })

  describe('getPlans', () => {
    it('retorna lista de planos ativos', async () => {
      const mockPlans = [
        createMockSubscriptionPlan({ slug: 'starter' }),
        createMockSubscriptionPlan({ slug: 'pro' }),
      ]
      mockRepository.getPlans.mockResolvedValue(mockPlans)

      const result = await subscriptionService.getPlans()

      expect(result).toHaveLength(2)
      expect(mockRepository.getPlans).toHaveBeenCalled()
    })
  })

  describe('getPlanBySlug', () => {
    it('retorna plano específico', async () => {
      const mockPlan = createMockSubscriptionPlan({ slug: 'pro' })
      mockRepository.getPlanBySlug.mockResolvedValue(mockPlan)

      const result = await subscriptionService.getPlanBySlug('pro')

      expect(result).toBeDefined()
      expect(mockRepository.getPlanBySlug).toHaveBeenCalledWith('pro')
    })

    it('retorna null se plano não existe', async () => {
      mockRepository.getPlanBySlug.mockResolvedValue(null)

      const result = await subscriptionService.getPlanBySlug('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('checkPlanLimit', () => {
    it('retorna objeto com allowed, current e limit', async () => {
      const mockSub = {
        plan: createMockSubscriptionPlan({
          limits: { maxPersonas: 5, maxCampaigns: 20, maxStorageMb: 100 },
        }),
      }
      mockRepository.findByUser.mockResolvedValue(mockSub)

      const result = await subscriptionService.checkPlanLimit('user-1', 'personas')

      expect(result).toHaveProperty('allowed')
      expect(result).toHaveProperty('current')
      expect(result).toHaveProperty('limit')
      expect(result.limit).toBe(5)
    })

    it('usa limite padrão (3) se não tem subscription', async () => {
      mockRepository.findByUser.mockResolvedValue(null)

      const result = await subscriptionService.checkPlanLimit('user-1', 'personas')

      expect(result.limit).toBe(3)
    })
  })

  describe('createOrUpdateSubscription', () => {
    it('chama repository com userId, planId e stripeData', async () => {
      mockRepository.upsertByUser.mockResolvedValue({ id: 'sub-1' })

      await subscriptionService.createOrUpdateSubscription('user-1', 'plan-1', {
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
      })

      expect(mockRepository.upsertByUser).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ planId: 'plan-1', status: 'active' })
      )
    })
  })

  describe('cancelSubscription', () => {
    it('marca subscription como cancel at period end', async () => {
      const mockSub = { id: 'sub-1', cancelAtPeriodEnd: false }
      mockRepository.findByUser.mockResolvedValue(mockSub)
      mockRepository.update.mockResolvedValue({ ...mockSub, cancelAtPeriodEnd: true })

      await subscriptionService.cancelSubscription('user-1')

      expect(mockRepository.update).toHaveBeenCalledWith('sub-1', {
        cancelAtPeriodEnd: true,
      })
    })

    it('retorna silenciosamente se não tem subscription', async () => {
      mockRepository.findByUser.mockResolvedValue(null)

      await expect(subscriptionService.cancelSubscription('user-1')).resolves.toBeUndefined()
    })
  })
})
