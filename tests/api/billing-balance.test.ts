import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/billing/balance/route'
import { createMockRequest, mockAuthSession } from '../helpers/api-test-helper'
import { CreditService } from '@/lib/services/billing/credit.service'
import { SubscriptionService } from '@/lib/services/billing/subscription.service'
import { CREDIT_COSTS } from '@/lib/types/billing'

vi.mock('@/lib/services/billing/credit.service')
vi.mock('@/lib/services/billing/subscription.service')

describe('GET /api/billing/balance', () => {
  let mockCreditService: any
  let mockSubscriptionService: any

  beforeEach(() => {
    mockCreditService = {
      getBalance: vi.fn(),
    }
    mockSubscriptionService = {
      getUserSubscription: vi.fn(),
    }

    vi.mocked(CreditService).mockImplementation(() => mockCreditService)
    vi.mocked(SubscriptionService).mockImplementation(() => mockSubscriptionService)

    vi.clearAllMocks()
  })

  it('retorna saldo e subscription do usuário autenticado', async () => {
    mockAuthSession('user-1')
    mockCreditService.getBalance.mockResolvedValue(150)
    mockSubscriptionService.getUserSubscription.mockResolvedValue({
      planSlug: 'starter',
      planName: 'Starter',
      status: 'active',
    })

    const req = createMockRequest({
      url: 'http://localhost:3000/api/billing/balance',
    })

    const response = await GET(req, { userId: 'user-1' })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      balance: 150,
      subscription: {
        planSlug: 'starter',
        planName: 'Starter',
        status: 'active',
      },
      costs: CREDIT_COSTS,
    })
  })

  it('retorna saldo 0 se usuário não tem balance', async () => {
    mockAuthSession('user-1')
    mockCreditService.getBalance.mockResolvedValue(0)
    mockSubscriptionService.getUserSubscription.mockResolvedValue(null)

    const req = createMockRequest({
      url: 'http://localhost:3000/api/billing/balance',
    })

    const response = await GET(req, { userId: 'user-1' })
    const data = await response.json()

    expect(data.balance).toBe(0)
    expect(data.subscription).toBeNull()
  })

  it('retorna erro 500 se service falha', async () => {
    mockAuthSession('user-1')
    mockCreditService.getBalance.mockRejectedValue(new Error('Database error'))

    const req = createMockRequest({
      url: 'http://localhost:3000/api/billing/balance',
    })

    const response = await GET(req, { userId: 'user-1' })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Failed to get balance')
  })
})
