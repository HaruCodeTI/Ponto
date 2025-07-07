import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getKPITrend } from '@/lib/executive-reports';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periods = parseInt(searchParams.get('periods') || '12');

    const trend = await getKPITrend(params.id, periods);

    return NextResponse.json(trend);
  } catch (error) {
    console.error('Erro ao buscar tendência do KPI:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 