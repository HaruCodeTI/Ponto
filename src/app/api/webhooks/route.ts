import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createWebhook } from '@/lib/external-integrations';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      companyId, 
      name, 
      description, 
      url, 
      events, 
      headers, 
      timeout, 
      retryConfig, 
      metadata 
    } = body;

    if (!companyId || !name || !url || !events || events.length === 0) {
      return NextResponse.json(
        { error: 'companyId, name, url e events são obrigatórios' }, 
        { status: 400 }
      );
    }

    const webhook = await createWebhook({
      companyId,
      name,
      description,
      url,
      events,
      headers,
      timeout,
      retryConfig,
      metadata
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereClause: any = {};
    if (companyId) whereClause.companyId = companyId;
    if (isActive !== null) whereClause.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      prisma.webhook.findMany({
        where: whereClause,
        include: {
          deliveries: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.webhook.count({ where: whereClause })
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Erro ao buscar webhooks:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 