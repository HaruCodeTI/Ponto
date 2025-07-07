import { NextRequest, NextResponse } from "next/server";
import { requireRole } from '@/lib/auth-middleware';

/**
 * GET /api/audit-logs/stats
 * Obtém estatísticas de logs de auditoria
 */
export async function GET(request: NextRequest) {
  // Verificar se é admin
  const authCheck = await requireRole(request, ['ADMIN']);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();

    // Temporariamente comentado até a migração ser aplicada
    // Estatísticas gerais
    // const totalLogs = await prisma.auditLog.count({
    //   where: {
    //     timestamp: {
    //       gte: startDate,
    //       lte: endDate,
    //     },
    //   },
    // });

    // Logs por ação
    // const logsByAction = await prisma.auditLog.groupBy({
    //   by: ['action'],
    //   where: {
    //     timestamp: {
    //       gte: startDate,
    //       lte: endDate,
    //     },
    //   },
    //   _count: {
    //     action: true,
    //   },
    //   orderBy: {
    //     _count: {
    //       action: 'desc',
    //     },
    //   },
    //   take: 10,
    // });

    // Logs por recurso
    // const logsByResource = await prisma.auditLog.groupBy({
    //   by: ['resource'],
    //   where: {
    //     timestamp: {
    //       gte: startDate,
    //       lte: endDate,
    //     },
    //   },
    //   _count: {
    //     resource: true,
    //   },
    //   orderBy: {
    //     _count: {
    //       resource: 'desc',
    //     },
    //   },
    //   take: 10,
    // });

    // Logs por usuário
    // const logsByUser = await prisma.auditLog.groupBy({
    //   by: ['userEmail'],
    //   where: {
    //     timestamp: {
    //       gte: startDate,
    //       lte: endDate,
    //     },
    //   },
    //   _count: {
    //     userEmail: true,
    //   },
    //   orderBy: {
    //     _count: {
    //       userEmail: 'desc',
    //     },
    //   },
    //   take: 10,
    // });

    // Logs por dia (últimos 30 dias)
    // const logsByDay = await prisma.$queryRaw`
    //   SELECT 
    //     DATE(timestamp) as date,
    //     COUNT(*) as count
    //   FROM "AuditLog"
    //   WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
    //   GROUP BY DATE(timestamp)
    //   ORDER BY date DESC
    //   LIMIT 30
    // `;

    // Tentativas de acesso negado
    // const accessDeniedCount = await prisma.auditLog.count({
    //   where: {
    //     action: 'ACCESS_DENIED',
    //     timestamp: {
    //       gte: startDate,
    //       lte: endDate,
    //     },
    //   },
    // });

    // Dados temporários para teste
    const totalLogs = 0;
    const logsByAction: any[] = [];
    const logsByResource: any[] = [];
    const logsByUser: any[] = [];
    const logsByDay: any[] = [];
    const accessDeniedCount = 0;

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        totalLogs,
        accessDeniedCount,
        logsByAction: logsByAction.map(item => ({
          action: item.action,
          count: item._count.action,
        })),
        logsByResource: logsByResource.map(item => ({
          resource: item.resource,
          count: item._count.resource,
        })),
        logsByUser: logsByUser.map(item => ({
          userEmail: item.userEmail,
          count: item._count.userEmail,
        })),
        logsByDay,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de auditoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 