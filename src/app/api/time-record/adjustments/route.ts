import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  createAdjustmentJustification, 
  applyAdjustment,
  validateJustification,
  canModifyRecord,
  DEFAULT_IMMUTABLE_CONFIG,
  AdjustmentJustification
} from "@/lib/immutable-records";
import { TimeRecord } from "@/types/time-record";
import { 
  createAdjustmentRequestNotification,
  sendNotification 
} from "@/lib/notifications";

/**
 * POST - Solicitar ajuste de registro
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { 
      originalRecordId, 
      newData, 
      reason, 
      description, 
      evidence, 
      requestedBy,
      config = DEFAULT_IMMUTABLE_CONFIG 
    } = body;

    // Busca registro original
    const originalRecordRaw = await prisma.timeRecord.findUnique({
      where: { id: originalRecordId }
    });

    if (!originalRecordRaw) {
      return NextResponse.json({ 
        success: false, 
        error: "Registro não encontrado" 
      }, { status: 404 });
    }

    // Converte para TimeRecord
    const originalRecord: TimeRecord = {
      ...originalRecordRaw,
      timestamp: originalRecordRaw.timestamp.toISOString(),
      createdAt: originalRecordRaw.createdAt.toISOString(),
      latitude: originalRecordRaw.latitude ?? undefined,
      longitude: originalRecordRaw.longitude ?? undefined,
      ipAddress: originalRecordRaw.ipAddress ?? undefined,
      deviceInfo: originalRecordRaw.deviceInfo ?? undefined,
      photoUrl: originalRecordRaw.photoUrl ?? undefined,
      nfcTag: originalRecordRaw.nfcTag ?? undefined,
    };

    // Verifica se pode ser modificado
    const canModify = canModifyRecord(originalRecord, config);
    if (!canModify.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: canModify.reason 
      }, { status: 403 });
    }

    // Valida justificativa
    const validation = validateJustification({
      reason,
      description,
      requestedBy,
      newData,
    });

    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: "Justificativa inválida",
        details: validation.errors 
      }, { status: 400 });
    }

    // Cria justificativa
    const adjustment = await createAdjustmentJustification(
      originalRecord,
      newData,
      { reason, description, evidence, requestedBy },
      config
    );

    // Enviar notificação de solicitação de ajuste
    try {
      const notification = createAdjustmentRequestNotification(
        adjustment.id,
        originalRecord.id,
        requestedBy,
        originalRecord.employeeId,
        originalRecord.companyId,
        reason
      );
      await sendNotification(notification);
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
    }

    // Se não requer aprovação, aplica automaticamente
    if (!config.requireApproval) {
      const adjustedRecord = await applyAdjustment(
        originalRecord,
        adjustment,
        requestedBy,
        config
      );

      return NextResponse.json({ 
        success: true, 
        data: {
          adjustment,
          adjustedRecord,
          autoApplied: true
        }
      }, { status: 201 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        adjustment,
        requiresApproval: true
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Erro ao solicitar ajuste:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
}

/**
 * GET - Listar ajustes
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Em produção, isso seria armazenado no banco
    // Por enquanto, retorna dados simulados
    const mockAdjustments: AdjustmentJustification[] = [
      {
        id: "adj_1",
        originalRecordId: "record_1",
        reason: "SYSTEM_ERROR",
        description: "Erro no sistema causou registro incorreto",
        requestedBy: "user_1",
        requestedAt: new Date().toISOString(),
        status: "PENDING",
        newData: { timestamp: new Date().toISOString() },
        auditTrail: {
          originalRecord: {} as TimeRecord,
          changes: { timestamp: { from: "2024-01-01T08:00:00Z", to: "2024-01-01T08:05:00Z" } },
          timestamp: new Date().toISOString(),
        },
      }
    ];

    const filteredAdjustments = mockAdjustments.filter(adj => {
      if (status && adj.status !== status) return false;
      if (employeeId && adj.auditTrail.originalRecord.employeeId !== employeeId) return false;
      if (companyId && adj.auditTrail.originalRecord.companyId !== companyId) return false;
      return true;
    });

    return NextResponse.json({
      success: true,
      data: {
        adjustments: filteredAdjustments.slice(offset, offset + limit),
        total: filteredAdjustments.length,
        page: Math.floor(offset / limit) + 1,
        limit,
        hasMore: offset + limit < filteredAdjustments.length,
      }
    });

  } catch (error) {
    console.error("Erro ao listar ajustes:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
} 