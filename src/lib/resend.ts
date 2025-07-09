import { Resend } from 'resend';

// Verifica se a API key está disponível
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from = 'Ponto <noreply@seudominio.com>' }: EmailData) {
  if (!resend) {
    console.warn('Resend não configurado. Email não será enviado.');
    console.log('Email que seria enviado:', { to, subject, html });
    return { success: false, error: 'Resend não configurado' };
  }

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    console.log('Email enviado com sucesso:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Verificação de Email</h2>
      <p>Olá!</p>
      <p>Para verificar seu email, clique no link abaixo:</p>
      <a href="${verificationUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
        Verificar Email
      </a>
      <p>Ou copie e cole este link no seu navegador:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      <p><strong>Este link expira em 24 horas.</strong></p>
      <p>Se você não solicitou esta verificação, ignore este email.</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        Sistema de Ponto Eletrônico<br>
        Este é um email automático, não responda.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Verifique seu email - Sistema de Ponto',
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Redefinir Senha</h2>
      <p>Olá!</p>
      <p>Você solicitou a redefinição da sua senha. Clique no link abaixo para criar uma nova senha:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
        Redefinir Senha
      </a>
      <p>Ou copie e cole este link no seu navegador:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p><strong>Este link expira em 1 hora.</strong></p>
      <p>Se você não solicitou a redefinição de senha, ignore este email.</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        Sistema de Ponto Eletrônico<br>
        Este é um email automático, não responda.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Redefinir Senha - Sistema de Ponto',
    html,
  });
}

export async function sendReportEmail(email: string, reportData: any) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Relatório de Ponto</h2>
      <p>Olá!</p>
      <p>Seu relatório de ponto foi gerado com sucesso.</p>
      <p><strong>Tipo:</strong> ${reportData.type}</p>
      <p><strong>Período:</strong> ${reportData.period}</p>
      <p><strong>Funcionários:</strong> ${reportData.employeeCount}</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        Sistema de Ponto Eletrônico<br>
        Este é um email automático, não responda.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Relatório de Ponto - ${reportData.type}`,
    html,
  });
}

export { resend }; 