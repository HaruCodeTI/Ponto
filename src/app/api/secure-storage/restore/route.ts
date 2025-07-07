import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startRestore, findRestoreOperations } from '@/lib/disaster-recovery';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { backupId, entityTypes, companyId, dateRange } = body;
    if (!backupId || !entityTypes) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const restore = await startRestore(
      backupId,
      entityTypes,
      companyId,
      session.user.id,
      dateRange
    );

    return NextResponse.json(restore);
  } catch (error) {
    console.error('Erro ao iniciar restauração:', error);
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
    const status = searchParams.get('status');
    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filters: any = {};
    if (status) filters.status = status;
    if (companyId) filters.companyId = companyId;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const result = await findRestoreOperations(filters, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar operações de restauração:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 