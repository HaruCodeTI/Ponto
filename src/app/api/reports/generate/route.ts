import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateReport } from '@/lib/executive-reports';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      companyId, 
      templateId, 
      name, 
      type, 
      format 
    } = body;

    if (!companyId || !name || !type || !format) {
      return NextResponse.json(
        { error: 'companyId, name, type e format são obrigatórios' }, 
        { status: 400 }
      );
    }

    const report = await generateReport({
      companyId,
      templateId,
      name,
      type,
      format,
      generatedBy: session.user.email
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