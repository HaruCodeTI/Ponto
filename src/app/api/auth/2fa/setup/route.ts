import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateTwoFactorSecret, generateTwoFactorQRCode, generateBackupCodes } from '@/lib/two-factor';

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA já está ativado.' }, { status: 400 });
    }

    // Gera secret e códigos de backup
    const secret = generateTwoFactorSecret();
    const backupCodes = generateBackupCodes();
    const qrCode = await generateTwoFactorQRCode(secret, user.email);

    // Salva secret temporariamente (será confirmado após verificação)
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        twoFactorSecret: secret,
        // Backup codes serão salvos como JSON string
        // Em produção, considere criptografar
      },
    });

    return NextResponse.json({
      secret,
      qrCode,
      backupCodes,
      message: 'Configure seu app de autenticação com o QR Code ou secret.',
    });
  } catch (error) {
    console.error('Erro ao configurar 2FA:', error);
    return NextResponse.json({ error: 'Erro ao configurar 2FA.' }, { status: 500 });
  }
} 