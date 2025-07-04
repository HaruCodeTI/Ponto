import { TimeRecord } from "@/types/time-record";
import { createTimeRecordAuditLog } from "@/lib/time-record";

/**
 * Configurações para registros imutáveis
 */
export interface ImmutableRecordConfig {
  allowAdjustments: boolean; // Se permite ajustes com justificativa
  requireApproval: boolean; // Se requer aprovação para ajustes
  maxAdjustmentDays: number; // Máximo de dias para ajuste
  requireEvidence: boolean; // Se requer evidência para ajuste
  enableAuditTrail: boolean; // Se mantém trilha de auditoria
  complianceMode: boolean; // Modo compliance (mais restritivo)
}

/**
 * Configurações padrão para registros imutáveis
 */
export const DEFAULT_IMMUTABLE_CONFIG: ImmutableRecordConfig = {
  allowAdjustments: true,
  requireApproval: true,
  maxAdjustmentDays: 7, // 7 dias para ajuste
  requireEvidence: true,
  enableAuditTrail: true,
  complianceMode: true, // Ativo por padrão para compliance
};

/**
 * Tipo para justificativa de ajuste
 */
export interface AdjustmentJustification {
  id: string;
  originalRecordId: string;
  reason: 'CORRECTION' | 'SYSTEM_ERROR' | 'HUMAN_ERROR' | 'TECHNICAL_ISSUE' | 'OTHER';
  description: string;
  evidence?: string; // URL de arquivo de evidência
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  newData: Partial<TimeRecord>;
  auditTrail: {
    originalRecord: TimeRecord;
    changes: Record<string, { from: unknown; to: unknown }>;
    timestamp: string;
  };
}

/**
 * Tipo para resposta de operação imutável
 */
export interface ImmutableOperationResult {
  success: boolean;
  allowed: boolean;
  reason?: string;
  requiresJustification?: boolean;
  justification?: AdjustmentJustification;
  auditLog?: unknown;
}

/**
 * Verifica se um registro pode ser modificado
 */
export function canModifyRecord(
  record: TimeRecord,
  config: ImmutableRecordConfig = DEFAULT_IMMUTABLE_CONFIG
): ImmutableOperationResult {
  const recordDate = new Date(record.timestamp);
  const now = new Date();
  const daysDifference = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

  // Se não permite ajustes, bloqueia
  if (!config.allowAdjustments) {
    return {
      success: false,
      allowed: false,
      reason: "Ajustes não são permitidos nesta configuração",
    };
  }

  // Se excede o limite de dias
  if (daysDifference > config.maxAdjustmentDays) {
    return {
      success: false,
      allowed: false,
      reason: `Ajuste permitido apenas até ${config.maxAdjustmentDays} dias após o registro`,
    };
  }

  // Se está em modo compliance, requer justificativa
  if (config.complianceMode) {
    return {
      success: true,
      allowed: true,
      requiresJustification: true,
      reason: "Modo compliance ativo - justificativa obrigatória",
    };
  }

  return {
    success: true,
    allowed: true,
    requiresJustification: config.requireApproval,
  };
}

/**
 * Cria justificativa para ajuste
 */
export async function createAdjustmentJustification(
  originalRecord: TimeRecord,
  newData: Partial<TimeRecord>,
  justification: {
    reason: AdjustmentJustification['reason'];
    description: string;
    evidence?: string;
    requestedBy: string;
  },
  config: ImmutableRecordConfig = DEFAULT_IMMUTABLE_CONFIG
): Promise<AdjustmentJustification> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  
  // Identifica mudanças
  Object.keys(newData).forEach(key => {
    const originalValue = ((originalRecord as unknown) as Record<string, unknown>)[key];
    const newValue = ((newData as unknown) as Record<string, unknown>)[key];
    
    if (originalValue !== newValue) {
      changes[key] = { from: originalValue, to: newValue };
    }
  });

  const adjustment: AdjustmentJustification = {
    id: generateAdjustmentId(),
    originalRecordId: originalRecord.id,
    reason: justification.reason,
    description: justification.description,
    evidence: justification.evidence,
    requestedBy: justification.requestedBy,
    requestedAt: new Date().toISOString(),
    status: config.requireApproval ? 'PENDING' : 'APPROVED',
    newData,
    auditTrail: {
      originalRecord,
      changes,
      timestamp: new Date().toISOString(),
    },
  };

  // Log de auditoria
  if (config.enableAuditTrail) {
    await createTimeRecordAuditLog({
      userId: justification.requestedBy,
      employeeId: originalRecord.employeeId,
      companyId: originalRecord.companyId,
      action: 'TIME_RECORD_ATTEMPT',
      status: 'PENDING',
      details: `Solicitação de ajuste para registro ${originalRecord.id}: ${justification.description}`,
      metadata: {
        adjustmentId: adjustment.id,
        reason: justification.reason,
        changes: Object.keys(changes),
      },
    });
  }

  return adjustment;
}

/**
 * Aprova justificativa de ajuste
 */
export async function approveAdjustment(
  adjustment: AdjustmentJustification,
  approvedBy: string,
  config: ImmutableRecordConfig = DEFAULT_IMMUTABLE_CONFIG
): Promise<AdjustmentJustification> {
  const updatedAdjustment: AdjustmentJustification = {
    ...adjustment,
    approvedBy,
    approvedAt: new Date().toISOString(),
    status: 'APPROVED',
  };

  // Log de auditoria
  if (config.enableAuditTrail) {
    await createTimeRecordAuditLog({
      userId: approvedBy,
      employeeId: adjustment.auditTrail.originalRecord.employeeId,
      companyId: adjustment.auditTrail.originalRecord.companyId,
      action: 'TIME_RECORD_SUCCESS',
      status: 'SUCCESS',
      details: `Ajuste aprovado para registro ${adjustment.originalRecordId}`,
      metadata: {
        adjustmentId: adjustment.id,
        approvedBy,
        changes: Object.keys(adjustment.auditTrail.changes),
      },
    });
  }

  return updatedAdjustment;
}

/**
 * Rejeita justificativa de ajuste
 */
export async function rejectAdjustment(
  adjustment: AdjustmentJustification,
  rejectedBy: string,
  rejectionReason: string,
  config: ImmutableRecordConfig = DEFAULT_IMMUTABLE_CONFIG
): Promise<AdjustmentJustification> {
  const updatedAdjustment: AdjustmentJustification = {
    ...adjustment,
    approvedBy: rejectedBy,
    approvedAt: new Date().toISOString(),
    status: 'REJECTED',
    rejectionReason,
  };

  // Log de auditoria
  if (config.enableAuditTrail) {
    await createTimeRecordAuditLog({
      userId: rejectedBy,
      employeeId: adjustment.auditTrail.originalRecord.employeeId,
      companyId: adjustment.auditTrail.originalRecord.companyId,
      action: 'TIME_RECORD_FAILED',
      status: 'FAILED',
      details: `Ajuste rejeitado para registro ${adjustment.originalRecordId}: ${rejectionReason}`,
      metadata: {
        adjustmentId: adjustment.id,
        rejectedBy,
        rejectionReason,
      },
    });
  }

  return updatedAdjustment;
}

/**
 * Aplica ajuste aprovado ao registro
 */
export async function applyAdjustment(
  originalRecord: TimeRecord,
  adjustment: AdjustmentJustification,
  appliedBy: string,
  config: ImmutableRecordConfig = DEFAULT_IMMUTABLE_CONFIG
): Promise<TimeRecord> {
  if (adjustment.status !== 'APPROVED') {
    throw new Error('Apenas ajustes aprovados podem ser aplicados');
  }

  // Cria novo registro com os dados ajustados
  const adjustedRecord: TimeRecord = {
    ...originalRecord,
    ...adjustment.newData,
    id: generateAdjustedRecordId(originalRecord.id),
    hash: generateAdjustedHash(originalRecord, adjustment),
    createdAt: new Date().toISOString(),
  };

  // Log de auditoria
  if (config.enableAuditTrail) {
    await createTimeRecordAuditLog({
      userId: appliedBy,
      employeeId: originalRecord.employeeId,
      companyId: originalRecord.companyId,
      action: 'TIME_RECORD_SUCCESS',
      status: 'SUCCESS',
      details: `Ajuste aplicado ao registro ${originalRecord.id}`,
      metadata: {
        originalRecordId: originalRecord.id,
        adjustedRecordId: adjustedRecord.id,
        adjustmentId: adjustment.id,
        appliedBy,
        changes: Object.keys(adjustment.auditTrail.changes),
      },
    });
  }

  return adjustedRecord;
}

/**
 * Gera ID único para ajuste
 */
function generateAdjustmentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `adj_${timestamp}_${random}`;
}

/**
 * Gera ID para registro ajustado
 */
function generateAdjustedRecordId(originalId: string): string {
  const timestamp = Date.now().toString(36);
  return `${originalId}_adj_${timestamp}`;
}

/**
 * Gera hash para registro ajustado
 */
function generateAdjustedHash(originalRecord: TimeRecord, adjustment: AdjustmentJustification): string {
  const base = `${originalRecord.hash}_${adjustment.id}_${adjustment.approvedAt}`;
  return Buffer.from(base).toString("base64").replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Valida se uma justificativa é válida
 */
export function validateJustification(justification: Partial<AdjustmentJustification>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!justification.reason) {
    errors.push("Motivo do ajuste é obrigatório");
  }

  if (!justification.description || justification.description.trim().length < 10) {
    errors.push("Descrição deve ter pelo menos 10 caracteres");
  }

  if (!justification.requestedBy) {
    errors.push("Solicitante é obrigatório");
  }

  if (!justification.newData || Object.keys(justification.newData).length === 0) {
    errors.push("Dados do ajuste são obrigatórios");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gera relatório de ajustes
 */
export function generateAdjustmentReport(adjustments: AdjustmentJustification[]): string {
  let report = `=== RELATÓRIO DE AJUSTES ===\n\n`;
  report += `Data de Geração: ${new Date().toLocaleString('pt-BR')}\n`;
  report += `Total de Ajustes: ${adjustments.length}\n\n`;

  // Estatísticas
  const stats = {
    pending: adjustments.filter(adj => adj.status === 'PENDING').length,
    approved: adjustments.filter(adj => adj.status === 'APPROVED').length,
    rejected: adjustments.filter(adj => adj.status === 'REJECTED').length,
  };

  report += `=== ESTATÍSTICAS ===\n`;
  report += `Pendentes: ${stats.pending}\n`;
  report += `Aprovados: ${stats.approved}\n`;
  report += `Rejeitados: ${stats.rejected}\n\n`;

  // Ajustes detalhados
  report += `=== AJUSTES DETALHADOS ===\n`;
  adjustments.forEach((adjustment, index) => {
    report += `${index + 1}. Registro: ${adjustment.originalRecordId}\n`;
    report += `   Status: ${adjustment.status}\n`;
    report += `   Motivo: ${adjustment.reason}\n`;
    report += `   Solicitante: ${adjustment.requestedBy}\n`;
    report += `   Data: ${new Date(adjustment.requestedAt).toLocaleString('pt-BR')}\n`;
    if (adjustment.approvedBy) {
      report += `   Aprovado por: ${adjustment.approvedBy}\n`;
    }
    if (adjustment.rejectionReason) {
      report += `   Motivo da rejeição: ${adjustment.rejectionReason}\n`;
    }
    report += `   Descrição: ${adjustment.description}\n`;
    report += `   Mudanças: ${Object.keys(adjustment.auditTrail.changes).join(', ')}\n\n`;
  });

  return report;
} 