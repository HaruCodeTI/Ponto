import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { makePrediction } from '@/lib/ai-ml';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { input, options } = body;

    if (!input) {
      return NextResponse.json(
        { error: 'Dados de entrada são obrigatórios' },
        { status: 400 }
      );
    }

    const prediction = await makePrediction({
      modelId: params.id,
      input,
      options
    });

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Erro ao fazer predição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 