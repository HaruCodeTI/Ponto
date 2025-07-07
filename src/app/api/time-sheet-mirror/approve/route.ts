import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { approveTimeSheetMirror } from '@/lib/time-sheet-mirror';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { mirrorId, notes } = body;

    if (!mirrorId) {
      return NextResponse.json(
        { error: 'ID do espelho é obrigatório' },
        { status: 400 }
      );
    }

    const mirror = await approveTimeSheetMirror(
      mirrorId,
      session.user.id,
      notes
    );

    return NextResponse.json(mirror);
  } catch (error) {
    console.error('Erro ao aprovar espelho de ponto:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 