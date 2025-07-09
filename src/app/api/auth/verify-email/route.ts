import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 });
    }

    // Verifica se usuário existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Verifica se email já está verificado
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email já está verificado.' }, { status: 400 });
    }

    // Gera token único
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Remove tokens antigos
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    });

    // Cria novo token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Envia email de verificação usando Resend
    const emailResult = await sendVerificationEmail(email, token);
    
    if (!emailResult.success) {
      console.error('Erro ao enviar email de verificação:', emailResult.error);
      return NextResponse.json({ error: 'Erro ao enviar email de verificação.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email de verificação enviado com sucesso.' 
    });
  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error);
    return NextResponse.json({ error: 'Erro ao enviar email de verificação.' }, { status: 500 });
  }
} 