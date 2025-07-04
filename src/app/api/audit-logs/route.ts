import { NextRequest, NextResponse } from "next/server";
import { 
  createSecurityAuditLog,
  createSystemAuditLog
} from "@/lib/audit-logs";
import { 
  TimeRecordAuditLog
} from "@/types/time-record";

/**
 * GET /api/audit-logs
 * Busca logs de auditoria com filtros
 */
export async function GET(_request: NextRequest) {
  try {
    // Por enquanto, retorna logs simulados
    // Em produção, isso seria uma consulta ao banco de dados
    const mockLogs: TimeRecordAuditLog[] = [
      {
        id: "1",
        timestamp: new Date().toISOString(),
        action: "TIME_RECORD_ATTEMPT",
        status: "SUCCESS",
        userId: "user1",
        employeeId: "emp1",
        companyId: "comp1",
        deviceInfo: {
          deviceId: "device1",
          deviceType: "MOBILE",
          userAgent: "Mozilla/5.0...",
          platform: "iOS",
          screenResolution: "375x667",
          timezone: "America/Sao_Paulo",
        },
        details: "Registro de ponto realizado com sucesso",
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        logs: mockLogs,
        total: mockLogs.length,
        limit: 100,
        offset: 0,
      },
    });

  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit-logs
 * Cria log de auditoria
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...payload } = body;

    if (!type || !payload.userId || !payload.employeeId || !payload.companyId) {
      return NextResponse.json({ 
        success: false, 
        error: "Tipo, userId, employeeId e companyId são obrigatórios" 
      }, { status: 400 });
    }

    let log: TimeRecordAuditLog;

    if (type === 'SECURITY') {
      log = await createSecurityAuditLog(payload);
    } else if (type === 'SYSTEM') {
      log = await createSystemAuditLog(payload);
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Tipo de log inválido. Use 'SECURITY' ou 'SYSTEM'" 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: log,
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
} 