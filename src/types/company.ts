// Tipos auxiliares para campos específicos

/** Tipos de operação da empresa */
export type OperationType = 'PRESENCIAL' | 'HOME_OFFICE' | 'HYBRID';

/** Planos disponíveis */
export type Plan = 'BASIC' | 'PROFESSIONAL' | 'PREMIUM';

/** Interface principal da empresa */
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  latitude?: number;
  longitude?: number;
  operationType: OperationType;
  employeeCount: number;
  plan: Plan;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
} 