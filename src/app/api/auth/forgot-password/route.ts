import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { sendPasswordResetEmail } from '@/lib/resend';

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
    
    // Envia email de redefinição de senha usando Resend
    const emailResult = await sendPasswordResetEmail(email, token);
    
    if (!emailResult.success) {
      console.error('Erro ao enviar email de redefinição:', emailResult.error);
      return NextResponse.json({ error: 'Erro ao enviar email de redefinição.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao solicitar recuperação:', error);
    return NextResponse.json({ error: 'Erro ao solicitar recuperação.' }, { status: 500 });
  }
} 