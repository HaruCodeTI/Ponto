import { prisma } from "@/lib/prisma";
import { 
  TimeRecordAdjustment, 
  CreateAdjustmentData, 
  ApproveAdjustmentData, 
  AdjustmentFilters, 
  AdjustmentResponse, 
  AdjustmentStats,
  AdjustmentConfig,
  ComplianceReason
} from "@/types/time-record";
// import { createAuditLog } from "@/lib/audit-logs";

/**
 * Configuração padrão de ajustes
 */
export const DEFAULT_ADJUSTMENT_CONFIG: AdjustmentConfig = {
  companyId: "",
  allowAdjustments: true,
  requireApproval: true,
  maxAdjustmentDays: 7, // 7 dias após o registro
  requireEvidence: true,
  allowedReasons: [
    'FORGOT_TO_REGISTER',
    'TECHNICAL_FAILURE',
    'SYSTEM_ERROR',
    'POWER_OUTAGE',
    'NETWORK_ISSUE',
    'DEVICE_MALFUNCTION',
    'HUMAN_ERROR',
    'MEDICAL_EMERGENCY',
    'FAMILY_EMERGENCY',
    'PUBLIC_TRANSPORT_DELAY',
    'WEATHER_CONDITIONS',
    'OTHER'
  ],
  autoApprovalLimit: 60, // 60 minutos para auto-aprovação
  notificationRecipients: [],
  complianceMode: true,
  retentionPeriod: 1825, // 5 anos
};

/**
 * Valida se um ajuste pode ser solicitado
 */
export function validateAdjustmentRequest(
  originalRecord: any,
  adjustmentData: CreateAdjustmentData,
  config: AdjustmentConfig
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar se ajustes são permitidos
  if (!config.allowAdjustments) {
    errors.push("Ajustes não são permitidos nesta empresa");
    return { isValid: false, errors, warnings };
  }

  // Verificar limite de dias
  const recordDate = new Date(originalRecord.timestamp);
  const adjustmentDate = new Date(adjustmentData.adjustedTimestamp);
  const daysDifference = Math.floor(
    (adjustmentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDifference > config.maxAdjustmentDays) {
    errors.push(`Ajuste permitido apenas até ${config.maxAdjustmentDays} dias após o registro`);
  }

  // Verificar se o motivo é permitido
  if (adjustmentData.complianceReason && !config.allowedReasons.includes(adjustmentData.complianceReason as ComplianceReason)) {
    errors.push("Motivo de compliance não permitido");
  }

  // Verificar se evidência é obrigatória
  if (config.requireEvidence && !adjustmentData.evidence) {
    errors.push("Evidência é obrigatória para este tipo de ajuste");
  }

  // Verificar se a justificativa é válida
  if (!adjustmentData.reason || adjustmentData.reason.trim().length < 10) {
    errors.push("Justificativa deve ter pelo menos 10 caracteres");
  }

  // Verificar se o novo timestamp é razoável
  const timeDifference = Math.abs(adjustmentDate.getTime() - recordDate.getTime());
  const maxTimeDifference = 24 * 60 * 60 * 1000; // 24 horas

  if (timeDifference > maxTimeDifference) {
    warnings.push("Diferença de tempo muito grande - verifique se está correto");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Cria um ajuste de registro de ponto
 */
export async function createTimeRecordAdjustment(
  adjustmentData: CreateAdjustmentData,
  config: AdjustmentConfig = DEFAULT_ADJUSTMENT_CONFIG
): Promise<{ success: boolean; adjustment?: TimeRecordAdjustment; error?: string }> {
  try {
    // Buscar registro original
    const originalRecord = await prisma.timeRecord.findUnique({
      where: { id: adjustmentData.originalRecordId }
    });

    if (!originalRecord) {
      return { success: false, error: "Registro original não encontrado" };
    }

    // Validar solicitação
    const validation = validateAdjustmentRequest(originalRecord, adjustmentData, config);
    if (!validation.isValid) {
      return { 
        success: false, 
        error: `Validação falhou: ${validation.errors.join(', ')}` 
      };
    }

    // TODO: Implementar após migração do Prisma
    // Por enquanto, retorna sucesso simulado
    const mockAdjustment: TimeRecordAdjustment = {
      id: `adj_${Date.now()}`,
      originalRecordId: adjustmentData.originalRecordId,
      originalRecord: {
        ...originalRecord,
        timestamp: originalRecord.timestamp.toISOString(),
        createdAt: originalRecord.createdAt.toISOString(),
        integrityHash: 'temp_hash', // Temporário até migração
        integrityTimestamp: new Date().toISOString(), // Temporário até migração
        latitude: originalRecord.latitude ?? undefined,
        longitude: originalRecord.longitude ?? undefined,
        ipAddress: originalRecord.ipAddress ?? undefined,
        deviceInfo: originalRecord.deviceInfo ?? undefined,
        photoUrl: originalRecord.photoUrl ?? undefined,
        nfcTag: originalRecord.nfcTag ?? undefined,
      },
      adjustedTimestamp: adjustmentData.adjustedTimestamp,
      adjustedType: adjustmentData.adjustedType,
      reason: adjustmentData.reason,
      evidence: adjustmentData.evidence,
      approvedBy: '',
      approvedAt: new Date(0).toISOString(),
      approvalStatus: 'PENDING',
      requestedBy: adjustmentData.requestedBy,
      requestedAt: new Date().toISOString(),
      companyId: adjustmentData.companyId,
      complianceReason: adjustmentData.complianceReason,
      legalBasis: adjustmentData.legalBasis,
      retentionPeriod: config.retentionPeriod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { success: true, adjustment: mockAdjustment };
  } catch (error) {
    console.error('Erro ao criar ajuste:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    };
  }
}

/**
 * Aprova ou rejeita um ajuste
 */
export async function approveTimeRecordAdjustment(
  approvalData: ApproveAdjustmentData
): Promise<{ success: boolean; adjustment?: TimeRecordAdjustment; error?: string }> {
  try {
    // TODO: Implementar após migração do Prisma
    // Por enquanto, retorna sucesso simulado
    const mockAdjustment: TimeRecordAdjustment = {
      id: approvalData.adjustmentId,
      originalRecordId: 'mock_record_id',
      originalRecord: {
        id: 'mock_record_id',
        type: 'ENTRY',
        timestamp: new Date().toISOString(),
        latitude: undefined,
        longitude: undefined,
        ipAddress: undefined,
        deviceInfo: undefined,
        photoUrl: undefined,
        nfcTag: undefined,
        hash: 'mock_hash',
        integrityHash: 'mock_integrity_hash',
        integrityTimestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        userId: 'mock_user',
        employeeId: 'mock_employee',
        companyId: 'mock_company',
      },
      adjustedTimestamp: new Date().toISOString(),
      adjustedType: undefined,
      reason: 'Mock reason',
      evidence: undefined,
      approvedBy: approvalData.approvedBy,
      approvedAt: new Date().toISOString(),
      approvalStatus: approvalData.approvalStatus,
      requestedBy: 'mock_requested_by',
      requestedAt: new Date().toISOString(),
      companyId: 'mock_company',
      complianceReason: undefined,
      legalBasis: undefined,
      retentionPeriod: 1825,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { success: true, adjustment: mockAdjustment };
  } catch (error) {
    console.error('Erro ao aprovar ajuste:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    };
  }
}

/**
 * Busca ajustes com filtros
 */
export async function getTimeRecordAdjustments(
  filters: AdjustmentFilters
): Promise<AdjustmentResponse> {
  try {
    // TODO: Implementar após migração do Prisma
    // Por enquanto, retorna dados simulados
    const mockAdjustments: TimeRecordAdjustment[] = [
      {
        id: 'adj_1',
        originalRecordId: 'record_1',
        originalRecord: {
          id: 'record_1',
          type: 'ENTRY',
          timestamp: new Date().toISOString(),
          latitude: undefined,
          longitude: undefined,
          ipAddress: undefined,
          deviceInfo: undefined,
          photoUrl: undefined,
          nfcTag: undefined,
          hash: 'mock_hash_1',
          integrityHash: 'mock_integrity_hash_1',
          integrityTimestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          userId: 'user_1',
          employeeId: 'emp_1',
          companyId: 'company_1',
        },
        adjustedTimestamp: new Date(Date.now() + 300000).toISOString(), // +5 min
        adjustedType: undefined,
        reason: 'Esqueci de registrar o ponto',
        evidence: undefined,
        approvedBy: '',
        approvedAt: new Date(0).toISOString(),
        approvalStatus: 'PENDING',
        requestedBy: 'user_1',
        requestedAt: new Date().toISOString(),
        companyId: 'company_1',
        complianceReason: 'FORGOT_TO_REGISTER',
        legalBasis: undefined,
        retentionPeriod: 1825,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    return {
      adjustments: mockAdjustments,
      total: mockAdjustments.length,
      page: 1,
      limit: filters.limit || 20,
      hasMore: false
    };
  } catch (error) {
    console.error('Erro ao buscar ajustes:', error);
    throw new Error('Erro ao buscar ajustes');
  }
}

/**
 * Gera estatísticas de ajustes
 */
export async function getAdjustmentStats(
  _companyId: string,
  _startDate?: string,
  _endDate?: string
): Promise<AdjustmentStats> {
  try {
    // TODO: Implementar após migração do Prisma
    // Por enquanto, retorna dados simulados
    return {
      totalAdjustments: 5,
      pendingAdjustments: 2,
      approvedAdjustments: 2,
      rejectedAdjustments: 1,
      averageProcessingTime: 4.5, // horas
      adjustmentsByReason: {
        'FORGOT_TO_REGISTER': 3,
        'TECHNICAL_FAILURE': 1,
        'HUMAN_ERROR': 1,
      },
      adjustmentsByMonth: {
        '2024-01': 2,
        '2024-02': 3,
      },
      complianceRate: 80.0, // 80%
    };
  } catch (error) {
    console.error('Erro ao gerar estatísticas:', error);
    throw new Error('Erro ao gerar estatísticas de ajustes');
  }
}

/**
 * Obtém configuração de ajustes de uma empresa
 */
export async function getAdjustmentConfig(companyId: string): Promise<AdjustmentConfig> {
  // Em produção, isso viria do banco de dados
  // Por enquanto, retorna configuração padrão
  return {
    ...DEFAULT_ADJUSTMENT_CONFIG,
    companyId
  };
}

/**
 * Atualiza configuração de ajustes de uma empresa
 */
export async function updateAdjustmentConfig(
  companyId: string, 
  config: Partial<AdjustmentConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Em produção, salvaria no banco de dados
    // Por enquanto, apenas simula
    console.log(`Configuração de ajustes atualizada para empresa ${companyId}:`, config);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    };
  }
} 