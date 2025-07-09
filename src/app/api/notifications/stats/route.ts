import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getNotificationStats } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');
    const employeeId = searchParams.get('employeeId');

    const stats = await getNotificationStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 