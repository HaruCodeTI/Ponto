import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios.' }, { status: 400 });
    }

    // Verifica se email já existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado.' }, { status: 409 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Cria usuário (role inicial EMPLOYEE) - email não verificado
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'EMPLOYEE',
        // emailVerified: null - não verificado por padrão
      },
    });

    // Gera token de verificação
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
      // Não falha o registro se o email falhar, apenas loga o erro
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Conta criada com sucesso! Verifique seu email para ativar sua conta.' 
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return NextResponse.json({ error: 'Erro ao registrar usuário.' }, { status: 500 });
  }
} 