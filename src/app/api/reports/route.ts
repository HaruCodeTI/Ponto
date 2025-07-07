import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  createReportTemplate, 
  generateReport, 
  findGeneratedReports 
} from '@/lib/executive-reports';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      companyId, 
      name, 
      description, 
      type, 
      format, 
      schedule, 
      config 
    } = body;

    if (!companyId || !name || !type || !format || !config) {
      return NextResponse.json(
        { error: 'companyId, name, type, format e config são obrigatórios' }, 
        { status: 400 }
      );
    }

    const template = await createReportTemplate({
      companyId,
      name,
      description,
      type,
      format,
      schedule,
      config,
      createdBy: session.user.email
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filters: any = {};
    if (companyId) filters.companyId = companyId;
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