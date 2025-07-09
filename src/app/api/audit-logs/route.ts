import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findAuditLogs, createAuditLog } from '@/lib/audit-logs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const resourceType = searchParams.get('resourceType');
    const resourceId = searchParams.get('resourceId');
    const action = searchParams.get('action');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const ipAddress = searchParams.get('ipAddress');
    const _page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filters: any = {};
    if (companyId) filters.companyId = companyId;
    if (userId) filters.userId = userId;
    if (category) filters.category = category;
    if (severity) filters.severity = severity;
    if (status) filters.status = status;
    if (resourceType) filters.resourceType = resourceType;
    if (resourceId) filters.resourceId = resourceId;
    if (action) filters.action = action;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);
    if (ipAddress) filters.ipAddress = ipAddress;
    filters.limit = limit;

    const result = await findAuditLogs(session.user.companyId || companyId || '', filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyId,
      userId,
      employeeId,
      action,
      category,
      severity,
      status,
      resourceType,
      resourceId,
      _oldValues,
      _newValues,
      metadata,
      ipAddress,
      userAgent
    } = body;

    if (!companyId || !action || !category || !severity || !status) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const auditLog = await createAuditLog({
      companyId,
      userId,
      employeeId,
      action,
      category,
      severity,
      status,
      resourceType,
      resourceId,
      metadata,
      ipAddress,
      userAgent
    });

    return NextResponse.json(auditLog, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 