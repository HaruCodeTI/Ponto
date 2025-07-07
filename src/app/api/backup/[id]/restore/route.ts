import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { restoreBackup } from '@/lib/backup';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, dropExisting, createMissing, preserveData } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    const restoreJob = await restoreBackup(params.id, companyId, {
      dropExisting,
      createMissing,
      preserveData
    });

    return NextResponse.json(restoreJob, { status: 201 });
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 