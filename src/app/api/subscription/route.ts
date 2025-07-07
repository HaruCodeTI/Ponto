import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Plan, SubscriptionStatus } from '@/types/company';
import { getPlanConfig, calculateMonthlyPrice } from '@/content/plans';

// GET - Obter assinatura da empresa
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

    // Buscar assinatura ativa
    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId: user.company.id,
        status: { in: ['ACTIVE', 'TRIAL'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova assinatura
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, isYearly = false, employeeCount } = body;

    if (!plan || !employeeCount) {
      return NextResponse.json(
        { error: 'Plano e número de funcionários são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar plano
    const planConfig = getPlanConfig(plan);
    if (!planConfig) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    // Buscar empresa do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Verificar se já existe assinatura ativa
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        companyId: user.company.id,
        status: { in: ['ACTIVE', 'TRIAL'] }
      }
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Já existe uma assinatura ativa' },
        { status: 400 }
      );
    }

    // Calcular preço
    const monthlyPrice = calculateMonthlyPrice(plan, employeeCount);

    // Definir período
    const now = new Date();
    const currentPeriodStart = now;
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + (isYearly ? 12 : 1));

    // Criar assinatura
    const subscription = await prisma.subscription.create({
      data: {
        companyId: user.company.id,
        plan: plan as Plan,
        status: 'ACTIVE' as SubscriptionStatus,
        currentPeriodStart,
        currentPeriodEnd,
        employeeCount,
        monthlyAmount: monthlyPrice,
        cancelAtPeriodEnd: false
      }
    });

    // Atualizar plano da empresa
    await prisma.company.update({
      where: { id: user.company.id },
      data: { plan: plan as Plan }
    });

    return NextResponse.json({ 
      subscription,
      message: 'Assinatura criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar assinatura
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, employeeCount, cancelAtPeriodEnd } = body;

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
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Atualizar plano se fornecido
    if (plan) {
      const planConfig = getPlanConfig(plan);
      if (!planConfig) {
        return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
      }

      updateData.plan = plan as Plan;
      
      // Atualizar plano da empresa
      await prisma.company.update({
        where: { id: user.company.id },
        data: { plan: plan as Plan }
      });
    }

    // Atualizar número de funcionários se fornecido
    if (employeeCount !== undefined) {
      updateData.employeeCount = employeeCount;
      const currentPlan = plan || subscription.plan;
      updateData.monthlyAmount = calculateMonthlyPrice(currentPlan, employeeCount);
    }

    // Atualizar cancelamento se fornecido
    if (cancelAtPeriodEnd !== undefined) {
      updateData.cancelAtPeriodEnd = cancelAtPeriodEnd;
    }

    // Atualizar assinatura
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: updateData
    });

    return NextResponse.json({ 
      subscription: updatedSubscription,
      message: 'Assinatura atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar assinatura
export async function DELETE(_request: NextRequest) {
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

    // Buscar assinatura ativa
    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId: user.company.id,
        status: { in: ['ACTIVE', 'TRIAL'] }
      }
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    // Cancelar assinatura
    const canceledSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED' as SubscriptionStatus,
        cancelAtPeriodEnd: true
      }
    });

    return NextResponse.json({ 
      subscription: canceledSubscription,
      message: 'Assinatura cancelada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 