import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuditStats } from '@/lib/audit-logs';

/**
 * GET /api/audit-logs/stats
 * Obtém estatísticas de logs de auditoria
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const stats = await getAuditStats(companyId || undefined);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de auditoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 