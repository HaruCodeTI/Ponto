import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'EMPLOYEE',
        // emailVerified: null - não verificado por padrão
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Conta criada com sucesso! Verifique seu email para ativar sua conta.' 
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao registrar usuário.' }, { status: 500 });
  }
} 