import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyTimeReceipt } from '@/lib/time-receipt';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { receiptId } = body;

    if (!receiptId) {
      return NextResponse.json(
        { error: 'ID do comprovante é obrigatório' },
        { status: 400 }
      );
    }

    const receipt = await verifyTimeReceipt(receiptId, session.user.id);

    return NextResponse.json(receipt);
  } catch (error) {
    console.error('Erro ao verificar comprovante:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 