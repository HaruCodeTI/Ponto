import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// import { createCheckoutSession } from '@/lib/stripe'; // Temporariamente comentado

// POST /api/payment/checkout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, employeeCount, successUrl, cancelUrl } = body;
    if (!planId || !employeeCount || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 });
    }

    // Temporariamente comentado até configuração do Stripe
    // const sessionStripe = await createCheckoutSession({
    //   customerEmail: session.user.email,
    //   planId,
    //   employeeCount,
    //   successUrl,
    //   cancelUrl
    // });

    // return NextResponse.json({ url: sessionStripe.url });
    
    return NextResponse.json({ 
      error: 'Checkout temporariamente indisponível - configuração do Stripe pendente' 
    }, { status: 503 });
  } catch (error) {
    console.error('Erro ao criar checkout Stripe:', error);
    return NextResponse.json({ error: 'Erro ao criar checkout' }, { status: 500 });
  }
} 