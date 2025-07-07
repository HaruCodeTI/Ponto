import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAIModel, findAIModels } from '@/lib/ai-ml';

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
    const isActive = searchParams.get('isActive');

    const filters: any = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (isActive !== null) filters.isActive = isActive === 'true';

    const result = await findAIModels(filters, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar modelos de IA:', error);
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
    const { name, description, type, version, config, metadata } = body;

    if (!name || !type || !version) {
      return NextResponse.json(
        { error: 'Nome, tipo e versão são obrigatórios' },
        { status: 400 }
      );
    }

    const model = await createAIModel({
      companyId: session.user.companyId || '',
      name,
      description,
      type,
      version,
      config,
      metadata
    });

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar modelo de IA:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 