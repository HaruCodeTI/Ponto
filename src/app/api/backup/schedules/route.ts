// Temporariamente desabilitado para resolver problemas de build do Prisma
/*
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getBackupSchedules, 
  createBackupSchedule 
} from '@/lib/backup';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const schedules = await getBackupSchedules(companyId || undefined);

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Erro ao buscar agendamentos de backup:', error);
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
    const { companyId, type, frequency, time, days, retentionDays } = body;

    if (!companyId || !type || !frequency || !time || !days) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const schedule = await createBackupSchedule(companyId, {
      type,
      frequency,
      time,
      days,
      retentionDays
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar agendamento de backup:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
*/

export async function GET() {
  return new Response('Backup Schedules API temporarily disabled', { status: 503 });
}

export async function POST() {
  return new Response('Backup Schedules API temporarily disabled', { status: 503 });
} 