import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreditRepository } from '@/lib/repositories/credit.repository'
import { prisma } from '@/lib/db'

describe('CreditRepository', () => {
  let repository: CreditRepository

  beforeEach(() => {
    repository = new CreditRepository()
    vi.clearAllMocks()
  })

  describe('getBalance', () => {
    it('retorna balance existente', async () => {
      const mockBalance = { id: 'bal-1', userId: 'user-1', balance: 100, updatedAt: new Date() }
      vi.mocked(prisma.creditBalance.findUnique).mockResolvedValue(mockBalance)

      const result = await repository.getBalance('user-1')

      expect(result).toEqual(mockBalance)
      expect(prisma.creditBalance.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
    })

    it('cria balance se não existir (upsert)', async () => {
      const mockBalance = { id: 'bal-1', userId: 'user-1', balance: 0, updatedAt: new Date() }
      vi.mocked(prisma.creditBalance.upsert).mockResolvedValue(mockBalance)

      const result = await repository.getBalance('user-1')

      expect(result).toEqual(mockBalance)
    })
  })

  describe('addCredits', () => {
    it('adiciona créditos e cria transação em transaction', async () => {
      const mockBalance = { balance: 150 }
      const mockTransaction = { id: 'tx-1' }

      const mockPrismaTx = {
        creditBalance: {
          update: vi.fn().mockResolvedValue(mockBalance),
        },
        creditTransaction: {
          create: vi.fn().mockResolvedValue(mockTransaction),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) =>
        callback(mockPrismaTx)
      )

      const result = await repository.addCredits(
        'user-1',
        50,
        'purchase',
        'Compra de créditos',
        { stripePaymentId: 'pi_123' }
      )

      expect(result).toEqual(mockBalance)
      expect(mockPrismaTx.creditBalance.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { balance: { increment: 50 } },
      })
      expect(mockPrismaTx.creditTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          amount: 50,
          type: 'purchase',
          description: 'Compra de créditos',
          balanceAfter: 150,
          metadata: { stripePaymentId: 'pi_123' },
        },
      })
    })
  })

  describe('consumeCredits', () => {
    it('consome créditos quando há saldo suficiente', async () => {
      const mockBalance = { balance: 50 }
      const mockBalanceAfter = { balance: 40 }

      const mockPrismaTx = {
        creditBalance: {
          findUnique: vi.fn().mockResolvedValue(mockBalance),
          update: vi.fn().mockResolvedValue(mockBalanceAfter),
        },
        creditTransaction: {
          create: vi.fn(),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) =>
        callback(mockPrismaTx)
      )

      const result = await repository.consumeCredits(
        'user-1',
        10,
        'usage',
        'Image generation'
      )

      expect(result).toEqual(mockBalanceAfter)
      expect(mockPrismaTx.creditBalance.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { balance: { decrement: 10 } },
      })
    })

    it('lança erro quando saldo insuficiente', async () => {
      const mockBalance = { balance: 5 }

      const mockPrismaTx = {
        creditBalance: {
          findUnique: vi.fn().mockResolvedValue(mockBalance),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) =>
        callback(mockPrismaTx)
      )

      await expect(
        repository.consumeCredits('user-1', 10, 'usage', 'Video generation')
      ).rejects.toThrow('Créditos insuficientes')
    })

    it('cria balance com saldo 0 se não existir', async () => {
      const mockPrismaTx = {
        creditBalance: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockResolvedValue({ balance: 0 }),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) =>
        callback(mockPrismaTx)
      )

      await expect(
        repository.consumeCredits('user-1', 10, 'usage', 'Test')
      ).rejects.toThrow('Créditos insuficientes')

      expect(mockPrismaTx.creditBalance.upsert).toHaveBeenCalled()
    })
  })

  describe('getTransactions', () => {
    it('retorna transações paginadas', async () => {
      const mockTransactions = [
        { id: 'tx-1', amount: -10, type: 'usage' },
        { id: 'tx-2', amount: 100, type: 'purchase' },
      ]
      vi.mocked(prisma.creditTransaction.findMany).mockResolvedValue(mockTransactions as any)
      vi.mocked(prisma.creditTransaction.count).mockResolvedValue(2)

      const result = await repository.getTransactions('user-1', { page: 1, limit: 20 })

      expect(result.transactions).toEqual(mockTransactions)
      expect(result.total).toBe(2)
      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('aplica paginação corretamente', async () => {
      vi.mocked(prisma.creditTransaction.findMany).mockResolvedValue([])
      vi.mocked(prisma.creditTransaction.count).mockResolvedValue(50)

      await repository.getTransactions('user-1', { page: 3, limit: 10 })

      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 20, // (page - 1) * limit = (3 - 1) * 10
        take: 10,
      })
    })
  })
})
