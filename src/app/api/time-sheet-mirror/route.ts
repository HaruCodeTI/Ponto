import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  generateTimeSheetMirror, 
  findTimeSheetMirrors 
} from '@/lib/time-sheet-mirror';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, companyId, month, year } = body;

    if (!employeeId || !companyId || !month || !year) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Mês deve estar entre 1 e 12' },
        { status: 400 }
      );
    }

    if (year < 2020 || year > 2030) {
      return NextResponse.json(
        { error: 'Ano deve estar entre 2020 e 2030' },
        { status: 400 }
      );
    }

    const mirror = await generateTimeSheetMirror(
      employeeId,
      companyId,
      month,
      year
    );

    return NextResponse.json(mirror);
  } catch (error) {
    console.error('Erro ao gerar espelho de ponto:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
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
    const employeeId = searchParams.get('employeeId');
    const companyId = searchParams.get('companyId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filters: any = {};
    if (employeeId) filters.employeeId = employeeId;
    if (companyId) filters.companyId = companyId;
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const result = await findTimeSheetMirrors(filters, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar espelhos de ponto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 