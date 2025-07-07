import { prisma } from './prisma';

/**
 * Valida formato de CPF
 */
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  // Verifica se os dígitos calculados são iguais aos do CPF
  return parseInt(cleanCPF.charAt(9)) === digit1 && parseInt(cleanCPF.charAt(10)) === digit2;
}

/**
 * Valida formato de PIS
 */
export function validatePIS(pis: string): boolean {
  // Remove caracteres não numéricos
  const cleanPIS = pis.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanPIS.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanPIS)) return false;
  
  // Calcula dígito verificador
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanPIS.charAt(i)) * weights[i];
  }
  
  let remainder = sum % 11;
  let digit = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cleanPIS.charAt(10)) === digit;
}

/**
 * Valida formato de matrícula
 */
export function validateRegistration(registration: string): boolean {
  // Matrícula deve ter pelo menos 3 caracteres e no máximo 20
  return registration.length >= 3 && registration.length <= 20;
}

/**
 * Formata CPF para exibição
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata PIS para exibição
 */
export function formatPIS(pis: string): string {
  const cleanPIS = pis.replace(/\D/g, '');
  return cleanPIS.replace(/(\d{3})(\d{5})(\d{2})(\d{1})/, '$1.$2.$3-$4');
}

/**
 * Busca funcionário por CPF
 */
export async function findEmployeeByCPF(cpf: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { cpf },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
    });
    return employee;
  } catch (error) {
    console.error('Erro ao buscar funcionário por CPF:', error);
    return null;
  }
}

/**
 * Busca funcionário por matrícula
 */
export async function findEmployeeByRegistration(registration: string) {
  try {
    // Temporariamente comentado até a migração ser aplicada
    // const employee = await prisma.employee.findUnique({
    //   where: { registration },
    //   include: {
    //     user: {
    //       select: {
    //         name: true,
    //         email: true,
    //       },
    //     },
    //     company: {
    //       select: {
    //         name: true,
    //       },
    //     },
    //   },
    // });
    // return employee;
    console.log('Busca por matrícula:', registration);
    return null;
  } catch (error) {
    console.error('Erro ao buscar funcionário por matrícula:', error);
    return null;
  }
}

/**
 * Busca funcionário por PIS
 */
export async function findEmployeeByPIS(pis: string) {
  try {
    // Temporariamente comentado até a migração ser aplicada
    // const employee = await prisma.employee.findUnique({
    //   where: { pis },
    //   include: {
    //     user: {
    //       select: {
    //         name: true,
    //         email: true,
    //       },
    //     },
    //     company: {
    //       select: {
    //         name: true,
    //       },
    //     },
    //   },
    // });
    // return employee;
    console.log('Busca por PIS:', pis);
    return null;
  } catch (error) {
    console.error('Erro ao buscar funcionário por PIS:', error);
    return null;
  }
}

/**
 * Busca funcionário por qualquer identificador único
 */
export async function findEmployeeByIdentifier(identifier: string) {
  // Remove formatação
  const cleanIdentifier = identifier.replace(/\D/g, '');
  
  // Tenta encontrar por CPF
  if (cleanIdentifier.length === 11) {
    const employee = await findEmployeeByCPF(cleanIdentifier);
    if (employee) return { employee, type: 'CPF' };
  }
  
  // Tenta encontrar por PIS
  if (cleanIdentifier.length === 11) {
    const employee = await findEmployeeByPIS(cleanIdentifier);
    if (employee) return { employee, type: 'PIS' };
  }
  
  // Tenta encontrar por matrícula
  const employee = await findEmployeeByRegistration(identifier);
  if (employee) return { employee, type: 'REGISTRATION' };
  
  return null;
}

/**
 * Verifica se identificador já existe
 */
export async function checkIdentifierExists(identifier: string, type: 'CPF' | 'PIS' | 'REGISTRATION', excludeId?: string) {
  try {
    const where: any = {};
    
    switch (type) {
      case 'CPF':
        where.cpf = identifier;
        break;
      case 'PIS':
        where.pis = identifier;
        break;
      case 'REGISTRATION':
        where.registration = identifier;
        break;
    }
    
    if (excludeId) {
      where.id = { not: excludeId };
    }
    
    const existing = await prisma.employee.findFirst({ where });
    return !!existing;
  } catch (error) {
    console.error('Erro ao verificar identificador:', error);
    return false;
  }
} 