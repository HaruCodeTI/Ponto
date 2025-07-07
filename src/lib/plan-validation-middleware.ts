import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canPerformAction, getActionErrorMessage, validatePlanLimits, PlanUsage } from './plan-limits';

export interface ValidationResult {
  allowed: boolean;
  message?: string;
  requiresUpgrade?: boolean;
}

/**
 * Middleware para validar se uma ação pode ser executada baseada no plano
 */
export async function validatePlanAction(
  request: NextRequest,
  action: 'create_employee' | 'create_location' | 'use_biometric' | 'use_nfc' | 'use_advanced_reports' | 'use_email_scheduling' | 'use_api' | 'use_audit_logs' | 'use_white_label' | 'use_custom_branding'
): Promise<ValidationResult> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return {
        allowed: false,
        message: 'Não autorizado'
      };
    }

    // Buscar empresa do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    });

    if (!user?.company) {
      return {
        allowed: false,
        message: 'Empresa não encontrada'
      };
    }

    // Verificar se a ação é permitida no plano
    const isActionAllowed = canPerformAction(user.company.plan, action);
    
    if (!isActionAllowed) {
      return {
        allowed: false,
        message: getActionErrorMessage(user.company.plan, action),
        requiresUpgrade: true
      };
    }

    // Para ações que envolvem criação de recursos, verificar limites
    if (action === 'create_employee' || action === 'create_location') {
      const usage = await getCompanyUsage(user.company.id);
      const validation = validatePlanLimits(user.company.plan, usage);
      
      if (!validation.isValid) {
        return {
          allowed: false,
          message: validation.errors[0] || 'Limite do plano excedido',
          requiresUpgrade: true
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Erro na validação do plano:', error);
    return {
      allowed: false,
      message: 'Erro interno na validação'
    };
  }
}

/**
 * Obter uso atual da empresa
 */
async function getCompanyUsage(companyId: string): Promise<PlanUsage> {
  // Contar funcionários
  const employeeCount = await prisma.employee.count({
    where: { companyId }
  });

  // Contar registros de ponto (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const timeRecordsCount = await prisma.timeRecord.count({
    where: {
      companyId,
      createdAt: {
        gte: thirtyDaysAgo
      }
    }
  });

  // Contar relatórios gerados (últimos 30 dias)
  const reportsCount = Math.ceil(timeRecordsCount / 100); // Estimativa

  // Localizações (por enquanto fixo em 1)
  const locationsCount = 1;

  // Integrações (por enquanto vazio)
  const integrations: string[] = [];

  return {
    employees: employeeCount,
    locations: locationsCount,
    timeRecords: timeRecordsCount,
    reports: reportsCount,
    integrations
  };
}

/**
 * Middleware para validar criação de funcionário
 */
export async function validateEmployeeCreation(request: NextRequest): Promise<ValidationResult> {
  return validatePlanAction(request, 'create_employee');
}

/**
 * Middleware para validar criação de localização
 */
export async function validateLocationCreation(request: NextRequest): Promise<ValidationResult> {
  return validatePlanAction(request, 'create_location');
}

/**
 * Middleware para validar uso de autenticação biométrica
 */
export async function validateBiometricUsage(request: NextRequest): Promise<ValidationResult> {
  return validatePlanAction(request, 'use_biometric');
}

/**
 * Middleware para validar uso de NFC
 */
export async function validateNFCUsage(request: NextRequest): Promise<ValidationResult> {
  return validatePlanAction(request, 'use_nfc');
}

/**
 * Middleware para validar uso de relatórios avançados
 */
export async function validateAdvancedReportsUsage(request: NextRequest): Promise<ValidationResult> {
  return validatePlanAction(request, 'use_advanced_reports');
}

/**
 * Middleware para validar uso de agendamento por email
 */
export async function validateEmailSchedulingUsage(request: NextRequest): Promise<ValidationResult> {
  return validatePlanAction(request, 'use_email_scheduling');
}

/**
 * Middleware para validar uso de API
 */
export async function validateAPIUsage(request: NextRequest): Promise<ValidationResult> {
  return validatePlanAction(request, 'use_api');
}

/**
 * Middleware para validar uso de logs de auditoria
 */
export async function validateAuditLogsUsage(request: NextRequest): Promise<ValidationResult> {
  return validatePlanAction(request, 'use_audit_logs');
}

/**
 * Middleware para validar uso de white label
 */
export async function validateWhiteLabelUsage(request: NextRequest): Promise<ValidationResult> {
  return validatePlanAction(request, 'use_white_label');
}

/**
 * Middleware para validar uso de marca personalizada
 */
export async function validateCustomBrandingUsage(request: NextRequest): Promise<ValidationResult> {
  return validatePlanAction(request, 'use_custom_branding');
} 