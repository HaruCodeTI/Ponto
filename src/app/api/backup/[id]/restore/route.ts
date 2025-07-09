// Temporariamente desabilitado para resolver problemas de build do Prisma
/*
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
    const { options } = body;

    const restoreJob = await restoreBackup(params.id, session.user.companyId || '', options);

    return NextResponse.json(restoreJob, { status: 201 });
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
*/

export async function POST() {
  return new Response('Backup Restore API temporarily disabled', { status: 503 });
} 