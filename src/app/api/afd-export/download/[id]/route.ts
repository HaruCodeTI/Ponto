import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const afdExport = await prisma.aFDExport.findUnique({
      where: { id: context.params.id }
    });

    if (!afdExport) {
      return NextResponse.json({ error: 'Exportação não encontrada' }, { status: 404 });
    }

    if (afdExport.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Simular geração de arquivo AFD
    const monthStr = afdExport.startDate.toISOString().slice(0,7);
    const fileContent = `AFD - ${monthStr}\nRegistros: ${afdExport.recordCount}\nStatus: ${afdExport.status}`;

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${afdExport.fileName}"`
      }
    });
  } catch (error) {
    console.error('Erro ao baixar arquivo AFD:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 