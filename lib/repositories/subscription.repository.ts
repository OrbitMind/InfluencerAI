import { prisma } from '@/lib/db';

/**
 * Repository para gerenciamento de Assinaturas
 * Data Access Layer
 */
export class SubscriptionRepository {
  /**
   * Busca assinatura do usuário com plano incluso
   */
  async findByUser(userId: string) {
    return prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  /**
   * Cria uma nova assinatura
   */
  async create(
    userId: string,
    data: {
      planId: string;
      stripeSubscriptionId?: string;
      stripeCustomerId?: string;
      status?: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
    }
  ) {
    return prisma.subscription.create({
      data: {
        userId,
        ...data,
      },
      include: { plan: true },
    });
  }

  /**
   * Atualiza uma assinatura existente
   */
  async update(
    id: string,
    data: {
      planId?: string;
      stripeSubscriptionId?: string;
      stripeCustomerId?: string;
      status?: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd?: boolean;
    }
  ) {
    return prisma.subscription.update({
      where: { id },
      data,
      include: { plan: true },
    });
  }

  /**
   * Atualiza ou cria assinatura pelo userId (upsert)
   */
  async upsertByUser(
    userId: string,
    data: {
      planId: string;
      stripeSubscriptionId?: string;
      stripeCustomerId?: string;
      status?: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
    }
  ) {
    return prisma.subscription.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
      include: { plan: true },
    });
  }

  /**
   * Busca assinatura pelo Stripe Subscription ID
   */
  async findByStripeSubscriptionId(stripeSubscriptionId: string) {
    return prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
      include: { plan: true },
    });
  }

  /**
   * Busca assinatura pelo Stripe Customer ID
   */
  async findByStripeCustomerId(stripeCustomerId: string) {
    return prisma.subscription.findFirst({
      where: { stripeCustomerId },
      include: { plan: true },
    });
  }

  /**
   * Lista todos os planos ativos
   */
  async getPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Busca plano por slug
   */
  async getPlanBySlug(slug: string) {
    return prisma.subscriptionPlan.findUnique({
      where: { slug },
    });
  }
}
