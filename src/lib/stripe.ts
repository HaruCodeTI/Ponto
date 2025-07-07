import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Cria uma sessão de checkout para assinatura de plano
 */
export async function createCheckoutSession({
  customerEmail,
  planId,
  employeeCount,
  successUrl,
  cancelUrl
}: {
  customerEmail: string;
  planId: string;
  employeeCount: number;
  successUrl: string;
  cancelUrl: string;
}) {
  // Definir preço do plano (exemplo: price_123)
  // Em produção, use IDs reais do Stripe
  const priceId = getStripePriceId(planId);
  if (!priceId) throw new Error('Plano não disponível para checkout');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: customerEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        planId,
        employeeCount: String(employeeCount),
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Mapeia o plano do sistema para o priceId do Stripe
 * (Ajuste conforme os preços criados no Stripe Dashboard)
 */
export function getStripePriceId(planId: string): string | null {
  const priceMap: Record<string, string> = {
    BASIC: process.env.STRIPE_PRICE_BASIC || '',
    PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL || '',
    PREMIUM: process.env.STRIPE_PRICE_PREMIUM || '',
  };
  return priceMap[planId] || null;
}

/**
 * Verifica assinatura ativa de um cliente
 */
export async function getActiveSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });
  return subscriptions.data[0] || null;
} 