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

      expect(result).toEqual({
        id: 'sub-1',
        planSlug: 'starter',
        planName: 'Starter',
        status: 'active',
        currentPeriodStart: mockSub.currentPeriodStart,
        currentPeriodEnd: mockSub.currentPeriodEnd,
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

      expect(result).toEqual(mockPlans)
      expect(mockRepository.getPlans).toHaveBeenCalled()
    })
  })

  describe('getPlanBySlug', () => {
    it('retorna plano específico', async () => {
      const mockPlan = createMockSubscriptionPlan({ slug: 'pro' })
      mockRepository.getPlanBySlug.mockResolvedValue(mockPlan)

      const result = await subscriptionService.getPlanBySlug('pro')

      expect(result).toEqual(mockPlan)
      expect(mockRepository.getPlanBySlug).toHaveBeenCalledWith('pro')
    })

    it('retorna null se plano não existe', async () => {
      mockRepository.getPlanBySlug.mockResolvedValue(null)

      const result = await subscriptionService.getPlanBySlug('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('checkPlanLimit', () => {
    it('retorna true se dentro do limite de personas', async () => {
      const mockSub = {
        plan: createMockSubscriptionPlan({
          limits: { personas: 5, campaigns: 20 },
        }),
      }
      mockRepository.findByUser.mockResolvedValue(mockSub)

      const result = await subscriptionService.checkPlanLimit('user-1', 'personas', 3)

      expect(result).toBe(true)
    })

    it('retorna false se excede limite de personas', async () => {
      const mockSub = {
        plan: createMockSubscriptionPlan({
          limits: { personas: 5, campaigns: 20 },
        }),
      }
      mockRepository.findByUser.mockResolvedValue(mockSub)

      const result = await subscriptionService.checkPlanLimit('user-1', 'personas', 6)

      expect(result).toBe(false)
    })

    it('retorna true se não tem subscription (free tier)', async () => {
      mockRepository.findByUser.mockResolvedValue(null)

      const result = await subscriptionService.checkPlanLimit('user-1', 'personas', 3)

      expect(result).toBe(true)
    })

    it('retorna true se limite não definido no plano', async () => {
      const mockSub = {
        plan: createMockSubscriptionPlan({
          limits: {},
        }),
      }
      mockRepository.findByUser.mockResolvedValue(mockSub)

      const result = await subscriptionService.checkPlanLimit('user-1', 'personas', 100)

      expect(result).toBe(true)
    })
  })

  describe('createOrUpdateSubscription', () => {
    it('cria ou atualiza subscription', async () => {
      const data = {
        planId: 'plan-1',
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
      }
      const mockSub = { id: 'sub-1', ...data }
      mockRepository.upsertByUser.mockResolvedValue(mockSub)

      const result = await subscriptionService.createOrUpdateSubscription('user-1', data)

      expect(result).toEqual(mockSub)
      expect(mockRepository.upsertByUser).toHaveBeenCalledWith('user-1', data)
    })
  })

  describe('cancelSubscription', () => {
    it('marca subscription como cancel at period end', async () => {
      const mockSub = {
        id: 'sub-1',
        cancelAtPeriodEnd: false,
      }
      mockRepository.findByUser.mockResolvedValue(mockSub)
      mockRepository.update.mockResolvedValue({
        ...mockSub,
        cancelAtPeriodEnd: true,
      })

      const result = await subscriptionService.cancelSubscription('user-1')

      expect(mockRepository.update).toHaveBeenCalledWith('sub-1', {
        cancelAtPeriodEnd: true,
      })
      expect(result.cancelAtPeriodEnd).toBe(true)
    })

    it('lança erro se não tem subscription', async () => {
      mockRepository.findByUser.mockResolvedValue(null)

      await expect(subscriptionService.cancelSubscription('user-1')).rejects.toThrow(
        'Subscription not found'
      )
    })
  })
})
