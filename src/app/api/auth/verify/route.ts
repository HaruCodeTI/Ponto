import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório.' }, { status: 400 });
    }

    // Busca token válido
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
    }

    // Verifica se token expirou
    if (verificationToken.expires < new Date()) {
      // Remove token expirado
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json({ error: 'Token expirado.' }, { status: 400 });
    }

    // Busca usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Marca email como verificado
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Remove token usado
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email verificado com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return NextResponse.json({ error: 'Erro ao verificar email.' }, { status: 500 });
  }
} 