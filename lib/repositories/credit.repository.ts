import { prisma } from '@/lib/db';
import type { TransactionType } from '@/lib/types/billing';

/**
 * Repository para gerenciamento de Créditos
 * Data Access Layer — operações atômicas de saldo e transações
 */
export class CreditRepository {
  /**
   * Retorna o saldo atual do usuário (cria registro se não existir)
   */
  async getBalance(userId: string): Promise<{ balance: number }> {
    const record = await prisma.creditBalance.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
      select: { balance: true },
    });
    return { balance: record.balance };
  }

  /**
   * Adiciona créditos ao saldo (atômico)
   * Usado para: compra, assinatura, bônus, reembolso
   */
  async addCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    metadata?: Record<string, unknown>
  ) {
    return prisma.$transaction(async (tx) => {
      // Upsert balance
      const balance = await tx.creditBalance.upsert({
        where: { userId },
        update: { balance: { increment: amount } },
        create: { userId, balance: amount },
      });

      // Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          type,
          description,
          metadata: metadata ? (metadata as import('@prisma/client').Prisma.InputJsonValue) : undefined,
          balanceAfter: balance.balance,
        },
      });

      return { balance: balance.balance, transaction };
    });
  }

  /**
   * Consome créditos do saldo (atômico)
   * Lança erro se saldo insuficiente
   */
  async consumeCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    metadata?: Record<string, unknown>
  ) {
    return prisma.$transaction(async (tx) => {
      // Get current balance
      const current = await tx.creditBalance.upsert({
        where: { userId },
        update: {},
        create: { userId, balance: 0 },
      });

      if (current.balance < amount) {
        throw new Error('Créditos insuficientes');
      }

      // Decrement balance
      const balance = await tx.creditBalance.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });

      // Create transaction record (negative amount)
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type,
          description,
          metadata: metadata ? (metadata as import('@prisma/client').Prisma.InputJsonValue) : undefined,
          balanceAfter: balance.balance,
        },
      });

      return { balance: balance.balance, transaction };
    });
  }

  /**
   * Lista transações do usuário com paginação
   */
  async getTransactions(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      type?: TransactionType;
    }
  ) {
    const { page = 1, limit = 20, type } = options || {};
    const offset = (page - 1) * limit;

    const where = {
      userId,
      ...(type ? { type } : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.creditTransaction.count({ where }),
    ]);

    return { transactions, total };
  }
}
