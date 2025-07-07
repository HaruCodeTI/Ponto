import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  createRetentionPolicy, 
  findRetentionPolicies,
  updateRetentionPolicy,
  deleteRetentionPolicy
} from '@/lib/data-retention';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, entityType, retentionPeriod, companyId, description } = body;

    if (!name || !entityType || !retentionPeriod) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const policy = await createRetentionPolicy(
      name,
      entityType,
      retentionPeriod,
      session.user.id,
      companyId,
      description
    );

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Erro ao criar política de retenção:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const companyId = searchParams.get('companyId');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filters: any = {};
    if (entityType) filters.entityType = entityType;
    if (companyId) filters.companyId = companyId;
    if (isActive !== null) filters.isActive = isActive === 'true';

    const result = await findRetentionPolicies(filters, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar políticas de retenção:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da política é obrigatório' },
        { status: 400 }
      );
    }

    const policy = await updateRetentionPolicy(id, updates);

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Erro ao atualizar política de retenção:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da política é obrigatório' },
        { status: 400 }
      );
    }

    await deleteRetentionPolicy(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar política de retenção:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 