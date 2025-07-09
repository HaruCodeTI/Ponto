import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findSecurityAlerts, createSecurityAlert } from '@/lib/audit-logs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filters: any = {};
    if (companyId) filters.companyId = companyId;
    if (type) filters.type = type;
    if (severity) filters.severity = severity;
    if (status) filters.status = status;

    const result = await findSecurityAlerts(companyId || session.user.companyId || '');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar alertas de segurança:', error);
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
    const { companyId, type, severity, title, description, source, metadata } = body;

    if (!companyId || !type || !severity || !title || !description || !source) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const alert = await createSecurityAlert({
      companyId,
      type,
      severity,
      title,
      description,
      source,
      metadata
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar alerta de segurança:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 