import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreditService } from '@/lib/services/billing/credit.service'
import { CreditRepository } from '@/lib/repositories/credit.repository'
import { CREDIT_COSTS } from '@/lib/types/billing'

vi.mock('@/lib/repositories/credit.repository')

describe('CreditService', () => {
  let creditService: CreditService
  let mockRepository: any

  beforeEach(() => {
    mockRepository = {
      getBalance: vi.fn(),
      addCredits: vi.fn(),
      consumeCredits: vi.fn(),
      getTransactions: vi.fn(),
    }
    vi.mocked(CreditRepository).mockImplementation(() => mockRepository)
    creditService = new CreditService()
  })

  describe('getBalance', () => {
    it('retorna saldo do repositório', async () => {
      mockRepository.getBalance.mockResolvedValue({ balance: 100 })

      const result = await creditService.getBalance('user-1')

      expect(result).toBe(100)
      expect(mockRepository.getBalance).toHaveBeenCalledWith('user-1')
    })

    it('retorna 0 se saldo não existir', async () => {
      mockRepository.getBalance.mockResolvedValue({ balance: 0 })

      const result = await creditService.getBalance('user-1')

      expect(result).toBe(0)
    })
  })

  describe('consumeCredits', () => {
    it('consome créditos para operação image', async () => {
      const mockBalance = { balance: 90 }
      mockRepository.consumeCredits.mockResolvedValue(mockBalance)

      const result = await creditService.consumeCredits('user-1', 'image')

      expect(mockRepository.consumeCredits).toHaveBeenCalledWith(
        'user-1',
        CREDIT_COSTS.image,
        'usage',
        'Geração de imagem',
        { operationType: 'image' }
      )
      expect(result).toBe(mockBalance)
    })

    it('consome créditos para operação video', async () => {
      const mockBalance = { balance: 87 }
      mockRepository.consumeCredits.mockResolvedValue(mockBalance)

      const result = await creditService.consumeCredits('user-1', 'video')

      expect(mockRepository.consumeCredits).toHaveBeenCalledWith(
        'user-1',
        CREDIT_COSTS.video,
        'usage',
        'Geração de vídeo',
        { operationType: 'video' }
      )
      expect(result).toBe(mockBalance)
    })

    it('consome créditos para operação audio', async () => {
      mockRepository.consumeCredits.mockResolvedValue({ balance: 99 })

      await creditService.consumeCredits('user-1', 'audio')

      expect(mockRepository.consumeCredits).toHaveBeenCalledWith(
        'user-1',
        CREDIT_COSTS.audio,
        'usage',
        'Geração de áudio',
        { operationType: 'audio' }
      )
    })

    it('consome créditos para operação lip-sync', async () => {
      mockRepository.consumeCredits.mockResolvedValue({ balance: 98 })

      await creditService.consumeCredits('user-1', 'lip-sync')

      expect(mockRepository.consumeCredits).toHaveBeenCalledWith(
        'user-1',
        CREDIT_COSTS['lip-sync'],
        'usage',
        'Lip sync',
        { operationType: 'lip-sync' }
      )
    })

    it('lança erro se saldo insuficiente', async () => {
      mockRepository.consumeCredits.mockRejectedValue(
        new Error('Créditos insuficientes')
      )

      await expect(
        creditService.consumeCredits('user-1', 'video')
      ).rejects.toThrow('Créditos insuficientes')
    })
  })

  describe('addCredits', () => {
    it('adiciona créditos com tipo purchase', async () => {
      const mockBalance = { balance: 200 }
      mockRepository.addCredits.mockResolvedValue(mockBalance)

      const result = await creditService.addCredits(
        'user-1',
        100,
        'purchase',
        'Compra de créditos',
        { stripePaymentId: 'pi_123' }
      )

      expect(mockRepository.addCredits).toHaveBeenCalledWith(
        'user-1',
        100,
        'purchase',
        'Compra de créditos',
        { stripePaymentId: 'pi_123' }
      )
      expect(result).toBe(mockBalance)
    })

    it('adiciona créditos com tipo bonus', async () => {
      mockRepository.addCredits.mockResolvedValue({ balance: 150 })

      await creditService.addCredits('user-1', 50, 'bonus', 'Bônus de boas-vindas')

      expect(mockRepository.addCredits).toHaveBeenCalledWith(
        'user-1',
        50,
        'bonus',
        'Bônus de boas-vindas',
        undefined
      )
    })

    it('adiciona créditos com tipo subscription', async () => {
      mockRepository.addCredits.mockResolvedValue({ balance: 300 })

      await creditService.addCredits(
        'user-1',
        200,
        'subscription',
        'Renovação mensal - Plano Starter'
      )

      expect(mockRepository.addCredits).toHaveBeenCalledWith(
        'user-1',
        200,
        'subscription',
        'Renovação mensal - Plano Starter',
        undefined
      )
    })
  })

  describe('initializeCredits', () => {
    it('adiciona 50 créditos iniciais', async () => {
      mockRepository.addCredits.mockResolvedValue({ balance: 50 })

      await creditService.initializeCredits('user-1')

      expect(mockRepository.addCredits).toHaveBeenCalledWith(
        'user-1',
        50,
        'bonus',
        'Créditos iniciais de boas-vindas',
        undefined
      )
    })
  })

  describe('estimateCost', () => {
    it('calcula custo para apenas image', () => {
      const cost = creditService.estimateCost(['image'])
      expect(cost).toBe(CREDIT_COSTS.image)
    })

    it('calcula custo para image + video', () => {
      const cost = creditService.estimateCost(['image', 'video'])
      expect(cost).toBe(CREDIT_COSTS.image + CREDIT_COSTS.video)
    })

    it('calcula custo para pipeline completo sem lip-sync', () => {
      const cost = creditService.estimateCost(['image', 'video', 'audio', 'compose', 'captions'])
      expect(cost).toBe(CREDIT_COSTS.image + CREDIT_COSTS.video + CREDIT_COSTS.audio)
    })

    it('calcula custo para pipeline com lip-sync', () => {
      const cost = creditService.estimateCost([
        'image',
        'video',
        'audio',
        'lip-sync',
        'compose',
        'captions',
      ])
      expect(cost).toBe(
        CREDIT_COSTS.image +
          CREDIT_COSTS.video +
          CREDIT_COSTS.audio +
          CREDIT_COSTS['lip-sync']
      )
    })

    it('não cobra por compose e captions (grátis)', () => {
      const cost = creditService.estimateCost(['compose', 'captions'])
      expect(cost).toBe(0)
    })

    it('retorna 0 para array vazio', () => {
      const cost = creditService.estimateCost([])
      expect(cost).toBe(0)
    })
  })

  describe('hasEnoughCredits', () => {
    it('retorna true quando tem créditos suficientes', async () => {
      mockRepository.getBalance.mockResolvedValue({ balance: 100 })

      const result = await creditService.hasEnoughCredits('user-1', ['image', 'video'])

      expect(result).toBe(true)
    })

    it('retorna false quando não tem créditos suficientes', async () => {
      mockRepository.getBalance.mockResolvedValue({ balance: 2 })

      const result = await creditService.hasEnoughCredits('user-1', ['image', 'video'])

      expect(result).toBe(false)
    })

    it('retorna true para operações gratuitas mesmo com 0 créditos', async () => {
      mockRepository.getBalance.mockResolvedValue({ balance: 0 })

      const result = await creditService.hasEnoughCredits('user-1', ['compose', 'captions'])

      expect(result).toBe(true)
    })
  })

  describe('getTransactions', () => {
    it('retorna transações do repositório', async () => {
      const mockTransactions = [
        { id: '1', amount: -10, type: 'usage' },
        { id: '2', amount: 100, type: 'purchase' },
      ]
      mockRepository.getTransactions.mockResolvedValue({
        transactions: mockTransactions,
        total: 2,
      })

      const result = await creditService.getTransactions('user-1', { page: 1, limit: 20 })

      expect(mockRepository.getTransactions).toHaveBeenCalledWith('user-1', { page: 1, limit: 20 })
      expect(result.transactions).toEqual(mockTransactions)
      expect(result.total).toBe(2)
    })
  })
})
