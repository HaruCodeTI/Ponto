import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Não revela se o email existe
      return NextResponse.json({ success: true });
    }
    // Gera token único
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutos
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });
    // Simula envio de email (log)
    console.log(`Link de redefinição: http://localhost:3000/auth/reset-password?token=${token}`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao solicitar recuperação.' }, { status: 500 });
  }
} 