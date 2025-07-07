import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getNotificationPreferences, 
  updateNotificationPreferences 
} from '@/lib/notifications';

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

    if (!companyId) {
      return NextResponse.json(
        { error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    const preferences = await getNotificationPreferences(
      companyId,
      userId || undefined,
      employeeId || undefined
    );

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Erro ao buscar preferências de notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, userId, employeeId, ...data } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    const preferences = await updateNotificationPreferences(
      companyId,
      data,
      userId || undefined,
      employeeId || undefined
    );

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Erro ao atualizar preferências de notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 