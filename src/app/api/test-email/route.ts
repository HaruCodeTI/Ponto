import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 });
    }

    // Testa envio de email simples
    const result = await sendEmail({
      to: email,
      subject: 'Teste de Email - Sistema Ponto',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Teste de Email</h2>
          <p>Este é um email de teste para verificar se o Resend está funcionando corretamente.</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Ambiente:</strong> ${process.env.NODE_ENV}</p>
          <p><strong>URL Base:</strong> ${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'https://ponto-orpin.vercel.app'}</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Sistema de Ponto Eletrônico<br>
            Email de teste
          </p>
        </div>
      `,
    });

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email de teste enviado com sucesso!',
        data: result.data
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao enviar email de teste.',
        details: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro no teste de email:', error);
    return NextResponse.json({ 
      error: 'Erro interno no teste de email.',
      details: error
    }, { status: 500 });
  }
} 