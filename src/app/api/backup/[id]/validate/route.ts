// Temporariamente desabilitado para resolver problemas de build do Prisma
/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateBackup } from '@/lib/backup';

export async function POST(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const validationResult = await validateBackup(context.params.id);

    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Erro ao validar backup:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
*/

export async function POST() {
  return new Response('Backup Validate API temporarily disabled', { status: 503 });
} 