import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  calculateEmployeeBilling, 
  comparePlanCosts, 
  generateBillingReport
} from '@/lib/salary-calculations';

// GET - Calcular cobrança por funcionário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeCount = parseInt(searchParams.get('employeeCount') || '0');
    const planId = searchParams.get('planId') || 'BASIC';
    const billingPeriod = searchParams.get('billingPeriod') as 'monthly' | 'yearly' || 'monthly';

    if (employeeCount <= 0) {
      return NextResponse.json({ error: 'Número de funcionários deve ser maior que 0' }, { status: 400 });
    }

    // Buscar empresa do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Calcular cobrança para o plano solicitado
    const billing = calculateEmployeeBilling(planId, employeeCount, billingPeriod);
    
    // Comparar com outros planos
    const breakdowns = comparePlanCosts(employeeCount, billingPeriod);
    
    // Gerar relatório completo
    const report = generateBillingReport(employeeCount, billingPeriod);

    return NextResponse.json({
      billing,
      breakdowns,
      report,
      currentCompany: {
        id: user.company.id,
        name: user.company.name,
        currentPlan: user.company.plan,
        currentEmployeeCount: employeeCount
      }
    });
  } catch (error) {
    console.error('Erro ao calcular cobrança:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Simular upgrade de plano
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { targetPlanId, employeeCount, billingPeriod = 'monthly' } = body;

    if (!targetPlanId || !employeeCount) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 });
    }

    // Buscar empresa do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    const currentPlanId = user.company.plan;
    
    // Calcular cobrança atual vs nova
    const currentBilling = calculateEmployeeBilling(currentPlanId, employeeCount, billingPeriod);
    const targetBilling = calculateEmployeeBilling(targetPlanId, employeeCount, billingPeriod);
    
    // Calcular diferença
    const costDifference = targetBilling.totalCost - currentBilling.totalCost;
    const percentageChange = currentBilling.totalCost > 0 ? (costDifference / currentBilling.totalCost) * 100 : 0;

    // Verificar se é upgrade ou downgrade
    const isUpgrade = ['BASIC', 'PROFESSIONAL', 'PREMIUM'].indexOf(targetPlanId) > 
                     ['BASIC', 'PROFESSIONAL', 'PREMIUM'].indexOf(currentPlanId);

    return NextResponse.json({
      currentPlan: {
        id: currentPlanId,
        billing: currentBilling
      },
      targetPlan: {
        id: targetPlanId,
        billing: targetBilling
      },
      comparison: {
        costDifference,
        percentageChange,
        isUpgrade,
        monthlyDifference: billingPeriod === 'monthly' ? costDifference : costDifference / 12,
        yearlyDifference: billingPeriod === 'yearly' ? costDifference : costDifference * 12
      },
      recommendation: {
        shouldUpgrade: isUpgrade && costDifference <= 0,
        reason: isUpgrade 
          ? costDifference <= 0 
            ? 'Upgrade recomendado - custo menor ou igual'
            : 'Upgrade disponível - custo adicional'
          : 'Downgrade - redução de funcionalidades'
      }
    });
  } catch (error) {
    console.error('Erro ao simular upgrade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 