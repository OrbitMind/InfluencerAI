import { CreditRepository } from '@/lib/repositories/credit.repository';
import {
  CREDIT_COSTS,
  INITIAL_FREE_CREDITS,
  type CreditOperationType,
  type TransactionType,
} from '@/lib/types/billing';

/**
 * Serviço para gerenciamento de Créditos
 * Service Layer — lógica de negócio
 */
export class CreditService {
  private repository = new CreditRepository();

  /**
   * Retorna o saldo atual do usuário
   */
  async getBalance(userId: string): Promise<number> {
    const { balance } = await this.repository.getBalance(userId);
    return balance;
  }

  /**
   * Consome créditos para uma operação específica
   */
  async consumeCredits(
    userId: string,
    operationType: CreditOperationType,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const cost = CREDIT_COSTS[operationType];
    if (cost <= 0) return;

    await this.repository.consumeCredits(
      userId,
      cost,
      'usage',
      `Geração: ${operationType}`,
      { operationType, ...metadata }
    );
  }

  /**
   * Adiciona créditos ao saldo do usuário
   */
  async addCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.repository.addCredits(userId, amount, type, description, metadata);
  }

  /**
   * Inicializa créditos gratuitos para novo usuário
   */
  async initializeCredits(userId: string): Promise<void> {
    await this.repository.addCredits(
      userId,
      INITIAL_FREE_CREDITS,
      'bonus',
      'Créditos iniciais gratuitos'
    );
  }

  /**
   * Lista transações com paginação
   */
  async getTransactions(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      type?: TransactionType;
    }
  ) {
    const { page = 1, limit = 20 } = options || {};
    const { transactions, total } = await this.repository.getTransactions(userId, options);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Estima custo total para um conjunto de steps
   */
  estimateCost(steps: string[]): number {
    return steps.reduce((total, step) => {
      const cost = CREDIT_COSTS[step as CreditOperationType] ?? 0;
      return total + cost;
    }, 0);
  }

  /**
   * Verifica se o usuário tem créditos suficientes para os steps
   */
  async hasEnoughCredits(userId: string, steps: string[]): Promise<boolean> {
    const cost = this.estimateCost(steps);
    if (cost <= 0) return true;
    const balance = await this.getBalance(userId);
    return balance >= cost;
  }
}
