import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateKPIValue } from '@/lib/executive-reports';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { period } = body;

    if (!period) {
      return NextResponse.json(
        { error: 'period é obrigatório' }, 
        { status: 400 }
      );
    }

    const kpiValue = await calculateKPIValue(params.id, period);

    return NextResponse.json(kpiValue, { status: 201 });
  } catch (error) {
    console.error('Erro ao calcular KPI:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 