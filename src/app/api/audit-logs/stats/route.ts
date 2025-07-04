import { NextRequest, NextResponse } from "next/server";
import { getAuditLogStats } from "@/lib/time-record";
import { 
  AuditLogFilters, 
  TimeRecordAuditLog, 
  AttemptStatus, 
  AuthenticationMethod 
} from "@/types/time-record";

/**
 * GET /api/audit-logs/stats
 * Obtém estatísticas de logs de auditoria
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extrai filtros da query string
    const filters: Omit<AuditLogFilters, 'limit' | 'offset'> = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      userId: searchParams.get('userId') || undefined,
      employeeId: searchParams.get('employeeId') || undefined,
      companyId: searchParams.get('companyId') || undefined,
      action: searchParams.get('action') as TimeRecordAuditLog['action'] || undefined,
      status: searchParams.get('status') as AttemptStatus || undefined,
      authenticationMethod: searchParams.get('authenticationMethod') as AuthenticationMethod || undefined,
      deviceType: searchParams.get('deviceType') as 'MOBILE' | 'DESKTOP' | 'TERMINAL' || undefined,
    };

    // Obtém estatísticas
    const stats = await getAuditLogStats(filters);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas de auditoria:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 