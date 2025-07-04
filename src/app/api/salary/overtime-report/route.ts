import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatMinutes } from "@/lib/salary-calculations";

/**
 * Gera relatório de horas extras por funcionário e período
 */
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

    if (records.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Nenhum registro de ponto encontrado para o período especificado"
      }, { status: 404 });
    }

    // Formata registros para TimeRecordAggregatedData
    const formattedRecords = records.map(record => ({
      ...record,
      timestamp: record.timestamp.toISOString(),
      createdAt: record.createdAt.toISOString(),
      latitude: record.latitude ?? undefined,
      longitude: record.longitude ?? undefined,
      ipAddress: record.ipAddress ?? undefined,
      deviceInfo: record.deviceInfo ?? undefined,
      photoUrl: record.photoUrl ?? undefined,
      nfcTag: record.nfcTag ?? undefined,
    }));

    // Agrupa por dia
    const recordsByDate: Record<string, typeof formattedRecords> = {};
    formattedRecords.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!recordsByDate[date]) {
        recordsByDate[date] = [];
      }
      recordsByDate[date].push(record);
    });

    // Calcula horas extras por dia
    const overtimeByDay = Object.entries(recordsByDate).map(([date, dayRecords]) => {
      // Cálculo simples: considera horas extras acima de 8h/dia
      const entry = dayRecords.find(r => r.type === 'ENTRY');
      const exit = dayRecords.find(r => r.type === 'EXIT');
      if (!entry || !exit) return null;
      const entryTime = new Date(entry.timestamp);
      const exitTime = new Date(exit.timestamp);
      let totalMinutes = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60);
      // Subtrai intervalo se existir
      const breakStart = dayRecords.find(r => r.type === 'BREAK_START');
      const breakEnd = dayRecords.find(r => r.type === 'BREAK_END');
      if (breakStart && breakEnd) {
        const breakStartTime = new Date(breakStart.timestamp);
        const breakEndTime = new Date(breakEnd.timestamp);
        totalMinutes -= (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60);
      }
      const overtimeMinutes = Math.max(0, totalMinutes - 8 * 60);
      return {
        date,
        overtimeMinutes,
        overtime: formatMinutes(overtimeMinutes),
      };
    }).filter(Boolean);

    // Total de horas extras no período
    const totalOvertimeMinutes = overtimeByDay.reduce((sum, d) => sum + (d?.overtimeMinutes || 0), 0);

    // Alerta se excedeu limite legal mensal (44h)
    const exceeded = totalOvertimeMinutes / 60 > 44;
    const recommendations = [];
    if (exceeded) {
      recommendations.push('Horas extras excedem limite legal mensal (44h)');
    }

    return NextResponse.json({
      success: true,
      data: {
        employeeId,
        startDate,
        endDate,
        overtimeByDay,
        totalOvertimeMinutes,
        totalOvertime: formatMinutes(totalOvertimeMinutes),
        exceeded,
        recommendations,
      }
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 });
  }
} 