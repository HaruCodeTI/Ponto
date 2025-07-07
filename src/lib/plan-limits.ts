import { PlanFeatures } from '@/types/company';
import { getPlanConfig } from '@/content/plans';

export interface PlanLimitValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  exceededLimits: {
    employees?: { current: number; limit: number; extra: number };
    locations?: { current: number; limit: number; extra: number };
  };
}

export interface PlanUsage {
  employees: number;
  locations: number;
  timeRecords: number;
  reports: number;
  integrations: string[];
}

/**
 * Valida se uma empresa está dentro dos limites do seu plano
 */
export function validatePlanLimits(
  planId: string, 
  usage: PlanUsage
): PlanLimitValidation {
  const plan = getPlanConfig(planId);
  if (!plan) {
    return {
      isValid: false,
      errors: ['Plano não encontrado'],
      warnings: [],
      exceededLimits: {}
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const exceededLimits: PlanLimitValidation['exceededLimits'] = {};

  // Validar limite de funcionários
  if (usage.employees > plan.features.maxEmployees) {
    const extra = usage.employees - plan.features.maxEmployees;
    exceededLimits.employees = {
      current: usage.employees,
      limit: plan.features.maxEmployees,
      extra
    };
    
    if (plan.features.maxEmployees === 999) {
      warnings.push(`Você tem ${usage.employees} funcionários. Considere um plano mais adequado.`);
    } else {
      errors.push(`Limite de funcionários excedido: ${usage.employees}/${plan.features.maxEmployees} (${extra} extras)`);
    }
  }

  // Validar limite de localizações
  if (usage.locations > plan.features.maxLocations) {
    const extra = usage.locations - plan.features.maxLocations;
    exceededLimits.locations = {
      current: usage.locations,
      limit: plan.features.maxLocations,
      extra
    };
    
    if (plan.features.maxLocations === 999) {
      warnings.push(`Você tem ${usage.locations} localizações. Considere um plano mais adequado.`);
    } else {
      errors.push(`Limite de localizações excedido: ${usage.locations}/${plan.features.maxLocations} (${extra} extras)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    exceededLimits
  };
}

/**
 * Verifica se uma funcionalidade está disponível no plano
 */
export function isFeatureAvailable(planId: string, feature: keyof PlanFeatures): boolean {
  const plan = getPlanConfig(planId);
  if (!plan) return false;
  
  return plan.features[feature] === true;
}

/**
 * Obtém o limite de uma funcionalidade específica
 */
export function getFeatureLimit(planId: string, feature: keyof PlanFeatures): number | boolean | string[] {
  const plan = getPlanConfig(planId);
  if (!plan) return 0;
  
  return plan.features[feature];
}

/**
 * Verifica se uma integração está disponível no plano
 */
export function isIntegrationAvailable(planId: string, integration: string): boolean {
  const plan = getPlanConfig(planId);
  if (!plan) return false;
  
  return plan.features.integrations.includes(integration);
}

/**
 * Calcula o uso percentual de um recurso
 */
export function calculateUsagePercentage(current: number, limit: number): number {
  if (limit === 999) return 0; // Ilimitado
  if (limit === 0) return 100; // Sem limite definido
  
  return Math.min((current / limit) * 100, 100);
}

/**
 * Obtém recomendações de upgrade baseadas no uso atual
 */
export function getUpgradeRecommendations(
  currentPlanId: string, 
  usage: PlanUsage
): { recommended: string; reasons: string[] } {
  const currentPlan = getPlanConfig(currentPlanId);
  if (!currentPlan) {
    return { recommended: 'BASIC', reasons: ['Plano atual não encontrado'] };
  }

  const reasons: string[] = [];
  let recommended = currentPlanId;

  // Verificar se está excedendo limites
  if (usage.employees > currentPlan.features.maxEmployees && currentPlan.features.maxEmployees !== 999) {
    reasons.push(`Limite de funcionários excedido (${usage.employees}/${currentPlan.features.maxEmployees})`);
  }

  if (usage.locations > currentPlan.features.maxLocations && currentPlan.features.maxLocations !== 999) {
    reasons.push(`Limite de localizações excedido (${usage.locations}/${currentPlan.features.maxLocations})`);
  }

  // Verificar se precisa de recursos avançados
  if (usage.reports > 100 && !currentPlan.features.advancedReports) {
    reasons.push('Muitos relatórios gerados - considere relatórios avançados');
  }

  if (usage.integrations.length > 2 && !currentPlan.features.apiAccess) {
    reasons.push('Múltiplas integrações - API de integração recomendada');
  }

  // Determinar plano recomendado
  if (currentPlanId === 'BASIC') {
    if (reasons.length > 0) {
      recommended = 'PROFESSIONAL';
    }
  } else if (currentPlanId === 'PROFESSIONAL') {
    if (usage.employees > 100 || usage.locations > 10) {
      recommended = 'PREMIUM';
      reasons.push('Empresa de grande porte - plano Premium recomendado');
    }
  }

  return { recommended, reasons };
}

/**
 * Verifica se uma ação pode ser executada baseada no plano
 */
export function canPerformAction(
  planId: string, 
  action: 'create_employee' | 'create_location' | 'use_biometric' | 'use_nfc' | 'use_advanced_reports' | 'use_email_scheduling' | 'use_api' | 'use_audit_logs' | 'use_white_label' | 'use_custom_branding'
): boolean {
  const plan = getPlanConfig(planId);
  if (!plan) return false;

  const actionMap: Record<string, keyof PlanFeatures> = {
    create_employee: 'maxEmployees',
    create_location: 'maxLocations',
    use_biometric: 'biometricAuth',
    use_nfc: 'nfcAuth',
    use_advanced_reports: 'advancedReports',
    use_email_scheduling: 'emailScheduling',
    use_api: 'apiAccess',
    use_audit_logs: 'auditLogs',
    use_white_label: 'whiteLabel',
    use_custom_branding: 'customBranding'
  };

  const feature = actionMap[action];
  if (!feature) return false;

  return plan.features[feature] === true;
}

/**
 * Obtém mensagem de erro para ação não permitida
 */
export function getActionErrorMessage(planId: string, action: string): string {
  const plan = getPlanConfig(planId);
  if (!plan) return 'Plano não encontrado';

  const messages: Record<string, string> = {
    create_employee: `Limite de funcionários atingido (${plan.features.maxEmployees}). Faça upgrade do plano.`,
    create_location: `Limite de localizações atingido (${plan.features.maxLocations}). Faça upgrade do plano.`,
    use_biometric: 'Autenticação biométrica não disponível no seu plano. Faça upgrade para Profissional ou Premium.',
    use_nfc: 'Autenticação NFC não disponível no seu plano. Faça upgrade para Profissional ou Premium.',
    use_advanced_reports: 'Relatórios avançados não disponíveis no seu plano. Faça upgrade para Profissional ou Premium.',
    use_email_scheduling: 'Agendamento por email não disponível no seu plano. Faça upgrade para Profissional ou Premium.',
    use_api: 'API de integração não disponível no seu plano. Faça upgrade para Profissional ou Premium.',
    use_audit_logs: 'Logs de auditoria não disponíveis no seu plano. Faça upgrade para Profissional ou Premium.',
    use_white_label: 'White Label não disponível no seu plano. Faça upgrade para Premium.',
    use_custom_branding: 'Marca personalizada não disponível no seu plano. Faça upgrade para Premium.'
  };

  return messages[action] || 'Ação não permitida no seu plano atual.';
} 