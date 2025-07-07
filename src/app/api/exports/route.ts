import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createDataExport } from '@/lib/executive-reports';

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
      dataSource, 
      filters, 
      columns, 
      format 
    } = body;

    if (!companyId || !name || !dataSource || !columns || !format) {
      return NextResponse.json(
        { error: 'companyId, name, dataSource, columns e format são obrigatórios' }, 
        { status: 400 }
      );
    }

    const export_ = await createDataExport({
      companyId,
      name,
      description,
      dataSource,
      filters: filters || {},
      columns,
      format,
      requestedBy: session.user.email
    });

    return NextResponse.json(export_, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar exportação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 