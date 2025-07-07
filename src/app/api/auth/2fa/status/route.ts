import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled || false,
      setupComplete: !!(user.twoFactorSecret && user.twoFactorEnabled),
    });
  } catch (error) {
    console.error('Erro ao obter status 2FA:', error);
    return NextResponse.json({ error: 'Erro ao obter status 2FA.' }, { status: 500 });
  }
} 