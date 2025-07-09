// Temporariamente desabilitado para resolver problemas de build do Prisma
/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBackupStats } from '@/lib/backup';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const stats = await getBackupStats(session.user.companyId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de backup:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
*/

export async function GET() {
  return new Response('Backup Stats API temporarily disabled', { status: 503 });
} 