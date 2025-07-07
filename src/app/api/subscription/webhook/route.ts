import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

export async function POST(_request: NextRequest) {
  try {
    const body = await _request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'customer.subscription.created':
        // Lógica para nova assinatura
        break;
      case 'customer.subscription.updated':
        // Lógica para atualização de assinatura
        break;
      case 'customer.subscription.deleted':
        // Lógica para cancelamento de assinatura
        break;
      case 'invoice.payment_succeeded':
        // Lógica para pagamento bem-sucedido
        break;
      case 'invoice.payment_failed':
        // Lógica para pagamento falhou
        break;
      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 