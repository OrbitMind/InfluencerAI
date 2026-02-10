// ============================================
// Tipos e constantes de Billing (Sprint 6)
// ============================================

/**
 * Custo em créditos por tipo de operação
 */
export interface CreditCost {
  image: number;
  video: number;
  audio: number;
  'lip-sync': number;
  compose: number;
  captions: number;
  composition: number;  // Sprint 9 - video concat/merge
}

export const CREDIT_COSTS: CreditCost = {
  image: 1,
  video: 3,
  audio: 1,
  'lip-sync': 2,
  compose: 0,
  captions: 0,
  composition: 2,  // Video concatenation/merge
};

export type CreditOperationType = keyof CreditCost;

export type TransactionType = 'usage' | 'purchase' | 'subscription' | 'bonus' | 'refund';

export interface PlanLimits {
  maxPersonas: number;
  maxCampaigns: number;
  maxStorageMb: number;
}

export interface PlanInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;       // centavos BRL
  creditsMonthly: number;
  features: string[];
  limits: PlanLimits;
  stripePriceId: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface SubscriptionInfo {
  id: string;
  planId: string;
  status: string;
  stripeCustomerId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  plan: PlanInfo;
}

export interface CreditTransactionData {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  metadata: Record<string, unknown> | null;
  balanceAfter: number;
  createdAt: Date;
}

export interface BillingOverview {
  balance: number;
  subscription: SubscriptionInfo | null;
  recentTransactions: CreditTransactionData[];
}

export const INITIAL_FREE_CREDITS = 50;

/**
 * Definições dos planos de assinatura
 * priceMonthly em centavos BRL
 */
export const PLAN_DEFINITIONS = [
  {
    name: 'Gratuito',
    slug: 'free',
    description: 'Para começar a explorar a plataforma',
    priceMonthly: 0,
    creditsMonthly: 50,
    features: ['50 créditos/mês', '3 personas', '5 campanhas', '100 MB storage'],
    limits: { maxPersonas: 3, maxCampaigns: 5, maxStorageMb: 100 },
    sortOrder: 0,
  },
  {
    name: 'Starter',
    slug: 'starter',
    description: 'Para criadores de conteúdo iniciantes',
    priceMonthly: 2990,
    creditsMonthly: 200,
    features: ['200 créditos/mês', '10 personas', '20 campanhas', '500 MB storage', 'Suporte prioritário'],
    limits: { maxPersonas: 10, maxCampaigns: 20, maxStorageMb: 500 },
    sortOrder: 1,
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'Para profissionais de marketing digital',
    priceMonthly: 7990,
    creditsMonthly: 600,
    features: ['600 créditos/mês', '30 personas', '50 campanhas', '2 GB storage', 'Lip Sync', 'Suporte prioritário'],
    limits: { maxPersonas: 30, maxCampaigns: 50, maxStorageMb: 2048 },
    sortOrder: 2,
  },
  {
    name: 'Agência',
    slug: 'agency',
    description: 'Para agências e equipes grandes',
    priceMonthly: 19990,
    creditsMonthly: 2000,
    features: ['2000 créditos/mês', 'Personas ilimitadas', 'Campanhas ilimitadas', '10 GB storage', 'Lip Sync', 'API access', 'Suporte dedicado'],
    limits: { maxPersonas: 999, maxCampaigns: 999, maxStorageMb: 10240 },
    sortOrder: 3,
  },
] as const;
