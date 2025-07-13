// Tipos auxiliares para campos específicos

/** Tipos de operação da empresa */
export type OperationType = 'PRESENCIAL' | 'HOME_OFFICE' | 'HYBRID';

/** Planos disponíveis */
export type Plan = 'BASIC' | 'PROFESSIONAL' | 'PREMIUM';

/** Recursos disponíveis nos planos */
export interface PlanFeatures {
  maxEmployees: number;
  maxLocations: number;
  biometricAuth: boolean;
  nfcAuth: boolean;
  advancedReports: boolean;
  emailScheduling: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  auditLogs: boolean;
  backupRetention: number; // dias
  integrations: string[];
}

/** Configuração de preços dos planos */
export interface PlanPricing {
  monthlyPrice: number;
  yearlyPrice: number;
  pricePerEmployee: number;
  setupFee: number;
  currency: string;
}

/** Configuração completa de um plano */
export interface PlanConfig {
  id: Plan;
  name: string;
  description: string;
  features: PlanFeatures;
  pricing: PlanPricing;
  popular?: boolean;
}

/** Status da assinatura */
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIAL' | 'EXPIRED';

/** Interface da assinatura */
export interface Subscription {
  id: string;
  companyId: string;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  employeeCount: number;
  monthlyAmount: number;
  createdAt: string;
  updatedAt: string;
}

/** Interface principal da empresa */
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  cep?: string;
  latitude?: number;
  longitude?: number;
  operationType: OperationType;
  employeeCount: number;
  plan: Plan;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
} 