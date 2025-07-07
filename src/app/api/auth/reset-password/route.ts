import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function isStrongPassword(password: string): boolean {
  // Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 símbolo
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token e nova senha são obrigatórios.' }, { status: 400 });
    }
    if (!isStrongPassword(password)) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.' }, { status: 400 });
    }
    const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!reset || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 400 });
    }
    // Atualiza senha do usuário
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: reset.userId },
      data: { password: hashedPassword },
    });
    // Remove token
    await prisma.passwordResetToken.delete({ where: { token } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao redefinir senha.' }, { status: 500 });
  }
} 