// Temporariamente desabilitado para resolver problemas de build do Prisma
/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateReport } from '@/lib/executive-reports';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, name, type, format } = body;

    if (!name || !type || !format) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const report = await generateReport({
      companyId: session.user.companyId,
      templateId,
      name,
      type,
      format,
      generatedBy: session.user.id
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
*/

export async function POST() {
  return new Response('Generate Reports API temporarily disabled', { status: 503 });
} 