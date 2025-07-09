// Temporariamente desabilitado para resolver problemas de build do Prisma
/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  createReportTemplate, 
  findGeneratedReports 
} from '@/lib/executive-reports';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const filters: any = { companyId: session.user.companyId };
    if (type) filters.type = type;
    if (status) filters.status = status;

    const result = await findGeneratedReports(filters, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, format, schedule, config } = body;

    if (!name || !type || !format || !config) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const template = await createReportTemplate({
      companyId: session.user.companyId,
      name,
      description,
      type,
      format,
      schedule,
      config,
      createdBy: session.user.id
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar template de relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
*/

export async function GET() {
  return new Response('Reports API temporarily disabled', { status: 503 });
}

export async function POST() {
  return new Response('Reports API temporarily disabled', { status: 503 });
} 