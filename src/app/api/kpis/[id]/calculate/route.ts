// Temporariamente desabilitado para resolver problemas de build do Prisma
/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateKPIValue } from '@/lib/executive-reports';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { period } = body;

    if (!period) {
      return NextResponse.json(
        { error: 'Período é obrigatório' },
        { status: 400 }
      );
    }

    const value = await calculateKPIValue(params.id, period);

    return NextResponse.json(value, { status: 201 });
  } catch (error) {
    console.error('Erro ao calcular KPI:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
*/

export async function POST() {
  return new Response('KPI Calculate API temporarily disabled', { status: 503 });
} 