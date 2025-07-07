import { NextRequest, NextResponse } from "next/server";
import { 
  createSecurityAuditLog,
  createSystemAuditLog
} from "@/lib/audit-logs";
import { 
  TimeRecordAuditLog
} from "@/types/time-record";
import { requireRole } from '@/lib/auth-middleware';
import { getAuditLogs } from '@/lib/authorization';

/**
 * GET /api/audit-logs
 * Busca logs de auditoria com filtros
 */
export async function GET(request: NextRequest) {
  // Verificar se é admin
  const authCheck = await requireRole(request, ['ADMIN']);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resource: searchParams.get('resource') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
    };

    const logs = await getAuditLogs(filters);

    return NextResponse.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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