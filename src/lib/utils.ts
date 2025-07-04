import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Valida CNPJ brasileiro (apenas números, com ou sem máscara)
 * @param cnpj string
 * @returns boolean
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return false;
  if (/^([0-9])\1+$/.test(cleaned)) return false;
  let tamanho = cleaned.length - 2;
  let numeros = cleaned.substring(0, tamanho);
  let digitos = cleaned.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  tamanho = tamanho + 1;
  numeros = cleaned.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;
  return true;
}

/**
 * Valida CPF brasileiro (apenas números, com ou sem máscara)
 * @param cpf string
 * @returns boolean
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^([0-9])\1+$/.test(cleaned)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let resto = soma % 11;
  let digito1 = resto < 2 ? 0 : 11 - resto;
  if (digito1 !== parseInt(cleaned.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  resto = soma % 11;
  let digito2 = resto < 2 ? 0 : 11 - resto;
  if (digito2 !== parseInt(cleaned.charAt(10))) return false;
  return true;
}
