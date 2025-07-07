import { NextRequest, NextResponse } from 'next/server';
// import { headers } from 'next/headers'; // Temporariamente comentado
// import Stripe from 'stripe'; // Temporariamente comentado
// import { prisma } from '@/lib/prisma'; // Temporariamente comentado
// import { stripe } from '@/lib/stripe'; // Temporariamente comentado

// const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // Temporariamente comentado

export async function POST(request: NextRequest) {
  // Temporariamente comentado até configuração do Stripe
  return NextResponse.json({ 
    error: 'Webhook temporariamente indisponível - configuração do Stripe pendente' 
  }, { status: 503 });

  // try {
  //   const body = await request.text();
  //   const headersList = await headers();
  //   const signature = headersList.get('stripe-signature');

  //   if (!signature || !webhookSecret) {
  //     return NextResponse.json(
  //       { error: 'Webhook signature verification failed' },
  //       { status: 400 }
  //     );
  //   }

  //   let event: Stripe.Event;

  //   try {
  //     event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  //   } catch (err) {
  //     console.error('Webhook signature verification failed:', err);
  //     return NextResponse.json(
  //       { error: 'Webhook signature verification failed' },
  //       { status: 400 }
  //     );
  //   }

  //   switch (event.type) {
  //     case 'checkout.session.completed':
  //       await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
  //       break;

  //     case 'customer.subscription.created':
  //       await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
  //       break;

  //     case 'customer.subscription.updated':
  //       await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
  //       break;

  //     case 'customer.subscription.deleted':
  //       await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
  //       break;

  //     case 'invoice.payment_succeeded':
  //       await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
  //       break;

  //     case 'invoice.payment_failed':
  //       await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
  //       break;

  //     default:
  //       console.log(`Unhandled event type: ${event.type}`);
  //   }

  //   return NextResponse.json({ received: true });
  // } catch (error) {
  //   console.error('Webhook error:', error);
  //   return NextResponse.json(
  //     { error: 'Webhook processing failed' },
  //     { status: 500 }
  //   );
  // }
}

// async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
//   if (!session.customer || !session.subscription || !session.metadata?.companyId) {
//     console.error('Missing required session data');
//     return;
//   }

//   const companyId = session.metadata.companyId;
//   const subscriptionId = session.subscription as string;
//   const plan = session.metadata.plan || 'BASIC';

//   try {
//     // Buscar assinatura do Stripe para obter detalhes
//     const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
//     // Criar nova assinatura no banco
//     await (prisma as any).subscription.create({
//       data: {
//         companyId,
//         plan: plan as any,
//         status: 'ACTIVE',
//         currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
//         currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
//         trialEnd: (stripeSubscription as any).trial_end ? new Date((stripeSubscription as any).trial_end * 1000) : null,
//         cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end,
//         employeeCount: parseInt(session.metadata.employeeCount || '1'),
//         monthlyAmount: parseFloat(session.metadata.amount || '0'),
//       },
//     });

//     console.log(`Subscription activated for company ${companyId}`);
//   } catch (error) {
//     console.error('Error creating company subscription:', error);
//   }
// }

// async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
//   try {
//     // Buscar assinatura no banco pelo ID do Stripe (seria necessário adicionar campo)
//     console.log(`Subscription created: ${subscription.id}`);
//   } catch (error) {
//     console.error('Error handling subscription created:', error);
//   }
// }

// async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
//   try {
//     // Atualizar assinatura no banco
//     console.log(`Subscription updated: ${subscription.id}`);
//   } catch (error) {
//     console.error('Error handling subscription updated:', error);
//   }
// }

// async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
//   try {
//     // Cancelar assinatura no banco
//     console.log(`Subscription deleted: ${subscription.id}`);
//   } catch (error) {
//     console.error('Error handling subscription deleted:', error);
//   }
// }

// async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
//   try {
//     console.log(`Payment succeeded, invoice: ${invoice.id}`);
//   } catch (error) {
//     console.error('Error handling invoice payment succeeded:', error);
//   }
// }

// async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
//   try {
//     console.log(`Payment failed, invoice: ${invoice.id}`);
//   } catch (error) {
//     console.error('Error handling invoice payment failed:', error);
//   }
// } 