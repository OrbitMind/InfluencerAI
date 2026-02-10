import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/services/billing/stripe.service';

/**
 * POST /api/stripe/webhook
 * Endpoint para receber eventos do Stripe
 *
 * NÃO usa autenticação (Stripe chama diretamente)
 * Validação feita via signature do webhook
 */
export async function POST(req: NextRequest) {
  try {
    const stripeService = StripeService.getInstance();

    if (!stripeService.isConfigured()) {
      return NextResponse.json(
        { error: 'Stripe não configurado' },
        { status: 503 }
      );
    }

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Assinatura ausente' },
        { status: 400 }
      );
    }

    // Validate and construct event
    const event = stripeService.constructWebhookEvent(body, signature);

    // Process event
    await stripeService.handleWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Stripe webhook error:', error);
    const message = error instanceof Error ? error.message : 'Webhook error';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
