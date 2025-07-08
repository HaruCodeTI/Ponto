import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  executeDataPurge, 
  findDataPurges
} from '@/lib/data-retention';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { policyId, companyId } = body;

    if (!policyId) {
      return NextResponse.json(
        { error: 'ID da política é obrigatório' },
        { status: 400 }
      );
    }

    const purge = await executeDataPurge(
      policyId,
      companyId,
      session.user.id
    );

    return NextResponse.json(purge);
  } catch (error) {
    console.error('Erro ao executar expurgo:', error);
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
    const policyId = searchParams.get('policyId');
    const entityType = searchParams.get('entityType');
    const status = searchParams.get('status');
    const companyId = searchParams.get('companyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filters: any = {};
    if (policyId) filters.policyId = policyId;
    if (entityType) filters.entityType = entityType;
    if (status) filters.status = status;
    if (companyId) filters.companyId = companyId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const result = await findDataPurges(filters, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar operações de expurgo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 