import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Obter métodos de pagamento do cliente
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar empresa do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Buscar assinatura ativa para obter customer ID
    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId: user.company.id,
        status: { in: ['ACTIVE', 'TRIAL'] }
      }
    });

    if (!subscription) {
      return NextResponse.json({ 
        paymentMethods: [],
        message: 'Nenhuma assinatura ativa encontrada'
      });
    }

    // Buscar métodos de pagamento do Stripe (se tivermos customer ID)
    // Por enquanto, retornar array vazio
    const paymentMethods: any[] = [];

    return NextResponse.json({ 
      paymentMethods,
      message: 'Métodos de pagamento carregados'
    });
  } catch (error) {
    console.error('Erro ao buscar métodos de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Adicionar método de pagamento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentMethodId, setAsDefault = false } = body;

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'ID do método de pagamento é obrigatório' }, { status: 400 });
    }

    // Buscar empresa do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Buscar assinatura ativa
    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId: user.company.id,
        status: { in: ['ACTIVE', 'TRIAL'] }
      }
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada' }, { status: 404 });
    }

    // Aqui você implementaria a lógica para adicionar o método de pagamento ao Stripe
    // Por enquanto, retornar sucesso simulado
    const paymentMethod = {
      id: paymentMethodId,
      type: 'card',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2025,
      isDefault: setAsDefault
    };

    return NextResponse.json({ 
      paymentMethod,
      message: 'Método de pagamento adicionado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao adicionar método de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover método de pagamento
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'ID do método de pagamento é obrigatório' }, { status: 400 });
    }

    // Buscar empresa do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Aqui você implementaria a lógica para remover o método de pagamento do Stripe
    // Por enquanto, retornar sucesso simulado

    return NextResponse.json({ 
      message: 'Método de pagamento removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover método de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 