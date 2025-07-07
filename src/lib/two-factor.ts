import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Gera um secret único para 2FA
 */
export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Gera QR Code para configuração do 2FA
 */
export async function generateTwoFactorQRCode(
  secret: string, 
  email: string, 
  issuer: string = 'Ponto'
): Promise<string> {
  const otpauth = authenticator.keyuri(email, issuer, secret);
  return QRCode.toDataURL(otpauth);
}

/**
 * Gera códigos de backup para 2FA
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

/**
 * Verifica se um token 2FA é válido
 */
export function verifyTwoFactorToken(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * Verifica se um código de backup é válido
 */
export function verifyBackupCode(backupCodes: string[], code: string): boolean {
  return backupCodes.includes(code.toUpperCase());
}

/**
 * Remove um código de backup usado
 */
export function removeBackupCode(backupCodes: string[], code: string): string[] {
  return backupCodes.filter(c => c !== code.toUpperCase());
} 