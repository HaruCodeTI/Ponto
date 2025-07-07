import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testAPIEndpoint } from '@/lib/external-integrations';

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
    const { endpointId } = body;

    if (!endpointId) {
      return NextResponse.json(
        { error: 'endpointId é obrigatório' }, 
        { status: 400 }
      );
    }

    const result = await testAPIEndpoint(params.id, endpointId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao testar API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 