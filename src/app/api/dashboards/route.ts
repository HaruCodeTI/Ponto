import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  createExecutiveDashboard, 
  findExecutiveDashboards 
} from '@/lib/executive-reports';

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
      isDefault, 
      isPublic, 
      layout, 
      filters, 
      refreshInterval 
    } = body;

    if (!companyId || !name) {
      return NextResponse.json(
        { error: 'companyId e name são obrigatórios' }, 
        { status: 400 }
      );
    }

    const dashboard = await createExecutiveDashboard({
      companyId,
      name,
      description,
      isDefault,
      isPublic,
      layout,
      filters,
      refreshInterval,
      createdBy: session.user.email
    });

    return NextResponse.json(dashboard, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar dashboard:', error);
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
    const createdBy = searchParams.get('createdBy');
    const isDefault = searchParams.get('isDefault');
    const isPublic = searchParams.get('isPublic');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filters: any = {};
    if (companyId) filters.companyId = companyId;
    if (createdBy) filters.createdBy = createdBy;
    if (isDefault !== null) filters.isDefault = isDefault === 'true';
    if (isPublic !== null) filters.isPublic = isPublic === 'true';

    const result = await findExecutiveDashboards(filters, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar dashboards:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 