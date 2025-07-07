import { PlanConfig } from '@/types/company';

export const plansConfig: PlanConfig[] = [
  {
    id: 'BASIC',
    name: 'Básico',
    description: 'Ideal para pequenas empresas que estão começando com controle de ponto',
    features: {
      maxEmployees: 10,
      maxLocations: 1,
      biometricAuth: false,
      nfcAuth: false,
      advancedReports: false,
      emailScheduling: false,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false,
      customBranding: false,
      auditLogs: false,
      backupRetention: 30,
      integrations: ['Excel', 'CSV']
    },
    pricing: {
      monthlyPrice: 49.90,
      yearlyPrice: 499.00, // 2 meses grátis
      pricePerEmployee: 0,
      setupFee: 0,
      currency: 'BRL'
    }
  },
  {
    id: 'PROFESSIONAL',
    name: 'Profissional',
    description: 'Para empresas em crescimento que precisam de recursos avançados',
    popular: true,
    features: {
      maxEmployees: 50,
      maxLocations: 3,
      biometricAuth: true,
      nfcAuth: true,
      advancedReports: true,
      emailScheduling: true,
      apiAccess: true,
      whiteLabel: false,
      prioritySupport: false,
      customBranding: false,
      auditLogs: true,
      backupRetention: 90,
      integrations: ['Excel', 'CSV', 'PDF', 'AFD', 'API']
    },
    pricing: {
      monthlyPrice: 99.90,
      yearlyPrice: 999.00, // 2 meses grátis
      pricePerEmployee: 2.90,
      setupFee: 0,
      currency: 'BRL'
    }
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    description: 'Solução completa para grandes empresas com necessidades específicas',
    features: {
      maxEmployees: 999,
      maxLocations: 999,
      biometricAuth: true,
      nfcAuth: true,
      advancedReports: true,
      emailScheduling: true,
      apiAccess: true,
      whiteLabel: true,
      prioritySupport: true,
      customBranding: true,
      auditLogs: true,
      backupRetention: 365,
      integrations: ['Excel', 'CSV', 'PDF', 'AFD', 'API', 'ERP', 'RH']
    },
    pricing: {
      monthlyPrice: 199.90,
      yearlyPrice: 1999.00, // 2 meses grátis
      pricePerEmployee: 1.90,
      setupFee: 299.00,
      currency: 'BRL'
    }
  }
];

export const getPlanConfig = (planId: string): PlanConfig | undefined => {
  return plansConfig.find(plan => plan.id === planId);
};

export const getPlanFeatures = (planId: string) => {
  const plan = getPlanConfig(planId);
  return plan?.features;
};

export const getPlanPricing = (planId: string) => {
  const plan = getPlanConfig(planId);
  return plan?.pricing;
};

export const calculateMonthlyPrice = (planId: string, employeeCount: number): number => {
  const plan = getPlanConfig(planId);
  if (!plan) return 0;

  const basePrice = plan.pricing.monthlyPrice;
  const pricePerEmployee = plan.pricing.pricePerEmployee;
  
  // Calcular preço por funcionário apenas se exceder o limite do plano
  const maxEmployees = plan.features.maxEmployees;
  const extraEmployees = Math.max(0, employeeCount - maxEmployees);
  
  return basePrice + (extraEmployees * pricePerEmployee);
};

export const calculateYearlyPrice = (planId: string, employeeCount: number): number => {
  const plan = getPlanConfig(planId);
  if (!plan) return 0;

  const basePrice = plan.pricing.yearlyPrice;
  const pricePerEmployee = plan.pricing.pricePerEmployee;
  
  // Calcular preço por funcionário apenas se exceder o limite do plano
  const maxEmployees = plan.features.maxEmployees;
  const extraEmployees = Math.max(0, employeeCount - maxEmployees);
  
  return basePrice + (extraEmployees * pricePerEmployee * 12);
};

export const getPlanComparison = () => {
  return plansConfig.map(plan => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    popular: plan.popular,
    features: plan.features,
    pricing: plan.pricing
  }));
}; 