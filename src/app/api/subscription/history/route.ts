import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Obter histórico de assinaturas da empresa
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

    // Buscar todas as assinaturas da empresa
    const subscriptions = await prisma.subscription.findMany({
      where: {
        companyId: user.company.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatar dados para a interface
    const formattedSubscriptions = subscriptions.map(subscription => {
      let reason = '';
      
      // Determinar motivo da mudança baseado no contexto
      if (subscription.status === 'CANCELED') {
        reason = 'Assinatura cancelada pelo usuário';
      } else if (subscription.status === 'PAST_DUE') {
        reason = 'Pagamento em atraso';
      } else if (subscription.status === 'TRIAL') {
        reason = 'Período de teste';
      } else if (subscription.status === 'ACTIVE') {
        reason = 'Assinatura ativa';
      }

      return {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.currentPeriodStart,
        endDate: subscription.currentPeriodEnd,
        employeeCount: subscription.employeeCount,
        monthlyAmount: subscription.monthlyAmount,
        reason
      };
    });

    return NextResponse.json({ 
      subscriptions: formattedSubscriptions,
      total: subscriptions.length
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de assinaturas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 