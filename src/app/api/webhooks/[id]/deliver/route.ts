import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deliverWebhook } from '@/lib/external-integrations';

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
    const { event, payload } = body;

    if (!event || !payload) {
      return NextResponse.json(
        { error: 'event e payload são obrigatórios' }, 
        { status: 400 }
      );
    }

    const delivery = await deliverWebhook(params.id, event, payload);

    return NextResponse.json(delivery, { status: 201 });
  } catch (error) {
    console.error('Erro ao entregar webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 