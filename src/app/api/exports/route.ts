// Temporariamente desabilitado para resolver problemas de build do Prisma
/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createDataExport } from '@/lib/executive-reports';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, dataSource, filters, columns, format } = body;

    if (!name || !dataSource || !filters || !columns || !format) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const export_ = await createDataExport({
      companyId: session.user.companyId,
      name,
      description,
      dataSource,
      filters,
      columns,
      format,
      requestedBy: session.user.id
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
*/

export async function POST() {
  return new Response('Exports API temporarily disabled', { status: 503 });
} 