import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PlanUsage } from '@/lib/plan-limits';

// GET - Obter uso atual da empresa
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

    // Contar funcionários
    const employeeCount = await prisma.employee.count({
      where: { companyId: user.company.id }
    });

    // Contar registros de ponto (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timeRecordsCount = await prisma.timeRecord.count({
      where: {
        companyId: user.company.id,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Contar relatórios gerados (últimos 30 dias)
    // Como não temos uma tabela específica para relatórios, vamos estimar
    // baseado nos registros de ponto e outras atividades
    const reportsCount = Math.ceil(timeRecordsCount / 100); // Estimativa

    // Localizações (por enquanto fixo em 1, mas pode ser expandido)
    const locationsCount = 1;

    // Integrações (por enquanto vazio, mas pode ser expandido)
    const integrations: string[] = [];

    const usage: PlanUsage = {
      employees: employeeCount,
      locations: locationsCount,
      timeRecords: timeRecordsCount,
      reports: reportsCount,
      integrations
    };

    return NextResponse.json({ usage });
  } catch (error) {
    console.error('Erro ao buscar uso da empresa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 