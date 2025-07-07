import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNFCCard, deactivateNFCCard } from '@/lib/nfc';

// Listar cartões NFC
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    const where: { employeeId?: string } = {};
    if (employeeId) {
      where.employeeId = employeeId;
    }

    const cards = await prisma.nFCCard.findMany({
      where,
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Erro ao listar cartões NFC:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// Criar novo cartão NFC
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { employeeId, cardNumber } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'ID do funcionário é obrigatório.' }, { status: 400 });
    }

    const card = await createNFCCard(employeeId, cardNumber);

    if (!card) {
      return NextResponse.json({ error: 'Erro ao criar cartão NFC.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      card,
      message: 'Cartão NFC criado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar cartão NFC:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// Desativar cartão NFC
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return NextResponse.json({ error: 'ID do cartão é obrigatório.' }, { status: 400 });
    }

    const success = await deactivateNFCCard(cardId);

    if (!success) {
      return NextResponse.json({ error: 'Erro ao desativar cartão NFC.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cartão NFC desativado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao desativar cartão NFC:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
} 