import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { detectAnomaly } from '@/lib/ai-ml';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const isResolved = searchParams.get('isResolved');

    const whereClause: any = { companyId: session.user.companyId };
    if (type) whereClause.anomalyType = type;
    if (severity) whereClause.severity = severity;
    if (isResolved !== null) whereClause.isResolved = isResolved === 'true';

    const [anomalies, total] = await Promise.all([
      prisma.anomalyDetection.findMany({
        where: whereClause,
        include: {
          model: {
            select: { name: true, type: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.anomalyDetection.count({ where: whereClause })
    ]);

    return NextResponse.json({
      data: anomalies,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Erro ao buscar anomalias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { modelId, dataSource, anomalyType, description, data, threshold } = body;

    if (!modelId || !dataSource || !anomalyType || !description || !data) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const anomaly = await detectAnomaly({
      companyId: session.user.companyId || '',
      modelId,
      dataSource,
      anomalyType,
      description,
      data,
      threshold: threshold || 0.5
    });

    return NextResponse.json(anomaly, { status: 201 });
  } catch (error) {
    console.error('Erro ao detectar anomalia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 