import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTwoFactorToken } from '@/lib/two-factor';
// import { signIn } from 'next-auth/react'; // Removido pois não está sendo usado

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ error: 'Email e token são obrigatórios.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA não configurado.' }, { status: 400 });
    }

    // Verifica o token
    const isValid = verifyTwoFactorToken(user.twoFactorSecret, token);

    if (!isValid) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
    }

    // Se chegou aqui, 2FA está correto
    // O NextAuth já validou email/senha, agora só precisa confirmar 2FA
    return NextResponse.json({
      success: true,
      message: '2FA verificado com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao verificar 2FA no login:', error);
    return NextResponse.json({ error: 'Erro ao verificar 2FA.' }, { status: 500 });
  }
} 