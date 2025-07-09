// Temporariamente desabilitado para resolver problemas de build do Prisma
/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  createBusinessKPI, 
  findBusinessKPIs 
} from '@/lib/executive-reports';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category');

    const filters: any = { companyId: session.user.companyId };
    if (category) filters.category = category;

    const result = await findBusinessKPIs(filters, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar KPIs:', error);
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
    const { name, description, category, formula, unit, target, threshold, dataSource, refreshInterval, metadata } = body;

    if (!name || !category || !formula || !dataSource) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const kpi = await createBusinessKPI({
      companyId: session.user.companyId,
      name,
      description,
      category,
      formula,
      unit,
      target,
      threshold,
      dataSource,
      refreshInterval,
      metadata
    });

    return NextResponse.json(kpi, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar KPI:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
*/

export async function GET() {
  return new Response('KPIs API temporarily disabled', { status: 503 });
}

export async function POST() {
  return new Response('KPIs API temporarily disabled', { status: 503 });
} 