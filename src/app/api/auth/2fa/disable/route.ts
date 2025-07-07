import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyTwoFactorToken } from '@/lib/two-factor';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: '2FA não configurado.' }, { status: 400 });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA não está ativado.' }, { status: 400 });
    }

    // Verifica o token
    const isValid = verifyTwoFactorToken(user.twoFactorSecret, token);

    if (!isValid) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
    }

    // Desativa 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: '2FA desativado com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao desativar 2FA:', error);
    return NextResponse.json({ error: 'Erro ao desativar 2FA.' }, { status: 500 });
  }
} 