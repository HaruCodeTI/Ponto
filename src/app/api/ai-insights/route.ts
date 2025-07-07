import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAIInsight } from '@/lib/ai-ml';
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
    const impact = searchParams.get('impact');
    const isRead = searchParams.get('isRead');
    const isActioned = searchParams.get('isActioned');

    const whereClause: any = { companyId: session.user.companyId };
    if (type) whereClause.type = type;
    if (impact) whereClause.impact = impact;
    if (isRead !== null) whereClause.isRead = isRead === 'true';
    if (isActioned !== null) whereClause.isActioned = isActioned === 'true';

    const [insights, total] = await Promise.all([
      prisma.aIInsight.findMany({
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
      prisma.aIInsight.count({ where: whereClause })
    ]);

    return NextResponse.json({
      data: insights,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Erro ao buscar insights:', error);
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
    const { modelId, type, title, description, data, confidence, impact, recommendations } = body;

    if (!type || !title || !description || !data || !impact) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tipo, título, descrição, dados e impacto' },
        { status: 400 }
      );
    }

    const insight = await createAIInsight({
      companyId: session.user.companyId || '',
      modelId,
      type,
      title,
      description,
      data,
      confidence: confidence || 0.8,
      impact,
      recommendations: recommendations || []
    });

    return NextResponse.json(insight, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar insight:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 