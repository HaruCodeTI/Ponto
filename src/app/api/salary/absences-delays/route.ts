import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatMinutes } from "@/lib/salary-calculations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, startDate, endDate } = body;

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json({
        success: false,
        error: "employeeId, startDate e endDate são obrigatórios"
      }, { status: 400 });
    }

    // Busca registros de ponto do funcionário no período
    const records = await prisma.timeRecord.findMany({
      where: {
        employeeId,
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Agrupa por dia
    const recordsByDate: Record<string, typeof records> = {};
    records.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!recordsByDate[date]) {
        recordsByDate[date] = [];
      }
      recordsByDate[date].push(record);
    });

    // Gera relatório diário
    const days = Object.keys(recordsByDate);
    const delays: Array<{date: string, delayMinutes: number, delay: string, entryTime: string}> = [];
    const earlyDepartures: Array<{date: string, earlyMinutes: number, earlyDeparture: string, exitTime: string}> = [];
    const absences: Array<{date: string, reason: string}> = [];

    for (const date of days) {
      const dayRecords = recordsByDate[date];
      const entry = dayRecords.find(r => r.type === 'ENTRY');
      const exit = dayRecords.find(r => r.type === 'EXIT');
      // Atraso
      if (entry) {
        const entryTime = new Date(entry.timestamp);
        const expectedEntry = new Date(entryTime);
        expectedEntry.setHours(8, 0, 0, 0);
        const delayMinutes = (entryTime.getTime() - expectedEntry.getTime()) / (1000 * 60);
        if (delayMinutes > 0) {
          delays.push({ date, delayMinutes, delay: formatMinutes(delayMinutes), entryTime: entry.timestamp.toISOString() });
        }
      }
      // Saída antecipada
      if (exit) {
        const exitTime = new Date(exit.timestamp);
        const expectedExit = new Date(exitTime);
        expectedExit.setHours(17, 0, 0, 0);
        const earlyMinutes = (expectedExit.getTime() - exitTime.getTime()) / (1000 * 60);
        if (earlyMinutes > 0) {
          earlyDepartures.push({ date, earlyMinutes, earlyDeparture: formatMinutes(earlyMinutes), exitTime: exit.timestamp.toISOString() });
        }
      }
      // Falta (sem entrada ou saída)
      if (!entry || !exit) {
        absences.push({ date, reason: !entry ? 'Sem entrada' : 'Sem saída' });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        employeeId,
        startDate,
        endDate,
        delays,
        earlyDepartures,
        absences,
        totalDelays: delays.length,
        totalEarlyDepartures: earlyDepartures.length,
        totalAbsences: absences.length,
      }
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 });
  }
} 