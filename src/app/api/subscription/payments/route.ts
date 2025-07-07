import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Obter histórico de pagamentos da empresa
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

    // Buscar pagamentos da empresa
    const payments = await prisma.payment.findMany({
      where: {
        companyId: user.company.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limitar a 50 pagamentos mais recentes
    });

    // Formatar dados para a interface
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      date: payment.paidAt || payment.createdAt,
      description: `Pagamento ${payment.month} - ${payment.payrollRef || 'Folha de pagamento'}`,
      invoiceUrl: payment.payrollRef ? `/api/payments/${payment.id}/invoice` : undefined,
      receiptUrl: payment.paidAt ? `/api/payments/${payment.id}/receipt` : undefined
    }));

    return NextResponse.json({ 
      payments: formattedPayments,
      total: payments.length
    });
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 