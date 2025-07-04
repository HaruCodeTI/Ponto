import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, employeeId, startDate, endDate, date } = body;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "ID do funcionário é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o funcionário pertence à empresa
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: companyId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Funcionário não encontrado" },
        { status: 404 }
      );
    }

    let whereClause: any = {
      employeeId: employeeId,
    };

    // Se uma data específica foi fornecida, usar ela
    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      whereClause.createdAt = {
        gte: targetDate,
        lt: nextDate,
      };
    } else if (startDate && endDate) {
      // Se um período foi fornecido
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Incluir o dia final

      whereClause.createdAt = {
        gte: start,
        lt: end,
      };
    } else {
      // Se nenhuma data foi fornecida, usar o dia atual
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      whereClause.createdAt = {
        gte: today,
        lt: tomorrow,
      };
    }

    // Buscar registros de ponto
    const timeRecords = await prisma.timeRecord.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "asc",
      },
    });

    // Processar registros por dia
    const dailyRecords = processDailyRecords(timeRecords, employee);

    // Calcular totais
    const totals = calculateTotals(dailyRecords);

    // Determinar período do relatório
    const reportPeriod = date 
      ? new Date(date).toLocaleDateString("pt-BR")
      : startDate && endDate
      ? `${new Date(startDate).toLocaleDateString("pt-BR")} a ${new Date(endDate).toLocaleDateString("pt-BR")}`
      : new Date().toLocaleDateString("pt-BR");

    const response = {
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: employee.user.name,
          email: employee.user.email,
          position: employee.position,
          workSchedule: employee.workSchedule,
          salary: employee.salary,
          toleranceMinutes: employee.toleranceMinutes,
        },
        period: {
          startDate: startDate || date,
          endDate: endDate || date,
          reportPeriod,
        },
        dailyRecords,
        totals,
        summary: {
          totalDays: dailyRecords.length,
          totalWorkDays: dailyRecords.filter(day => day.hasWorked).length,
          totalRegularHours: formatMinutes(totals.totalRegularMinutes),
          totalOvertimeHours: formatMinutes(totals.totalOvertimeMinutes),
          totalBreakHours: formatMinutes(totals.totalBreakMinutes),
          totalDelayMinutes: totals.totalDelayMinutes,
          totalEarlyDepartureMinutes: totals.totalEarlyDepartureMinutes,
          averageWorkHours: dailyRecords.length > 0 
            ? formatMinutes(Math.round(totals.totalRegularMinutes / dailyRecords.length))
            : "0h 0min",
          attendanceRate: dailyRecords.length > 0
            ? `${Math.round((dailyRecords.filter(day => day.hasWorked).length / dailyRecords.length) * 100)}%`
            : "0%",
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao gerar relatório individual:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function processDailyRecords(timeRecords: any[], employee: any) {
  const dailyMap = new Map();

  timeRecords.forEach(record => {
    const date = new Date(record.createdAt);
    const dateKey = date.toISOString().split('T')[0];

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        dateFormatted: date.toLocaleDateString("pt-BR"),
        dayOfWeek: date.toLocaleDateString("pt-BR", { weekday: "long" }),
        records: [],
        entryTime: null,
        exitTime: null,
        breakStartTime: null,
        breakEndTime: null,
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
        overtimeMinutes: 0,
        delayMinutes: 0,
        earlyDepartureMinutes: 0,
        hasWorked: false,
        isComplete: false,
        status: "incomplete",
      });
    }

    const dayRecord = dailyMap.get(dateKey);
    dayRecord.records.push({
      id: record.id,
      type: record.type,
      time: new Date(record.createdAt).toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      }),
      timestamp: record.createdAt,
      location: record.location,
      device: record.device,
    });

    // Processar horários
    if (record.type === "ENTRY") {
      dayRecord.entryTime = new Date(record.createdAt).toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
      dayRecord.hasWorked = true;
    } else if (record.type === "EXIT") {
      dayRecord.exitTime = new Date(record.createdAt).toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } else if (record.type === "BREAK_START") {
      dayRecord.breakStartTime = new Date(record.createdAt).toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } else if (record.type === "BREAK_END") {
      dayRecord.breakEndTime = new Date(record.createdAt).toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    }
  });

  // Calcular métricas para cada dia
  const dailyRecords = Array.from(dailyMap.values()).map(day => {
    const calculations = calculateDayMetrics(day, employee);
    return {
      ...day,
      ...calculations,
    };
  });

  return dailyRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function calculateDayMetrics(day: any, employee: any) {
  const expectedWorkMinutes = 8 * 60; // 8 horas por dia
  const toleranceMinutes = employee.toleranceMinutes || 0;

  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;
  let delayMinutes = 0;
  let earlyDepartureMinutes = 0;

  // Calcular tempo de trabalho
  if (day.entryTime && day.exitTime) {
    const entryTime = new Date(day.date + " " + day.entryTime);
    const exitTime = new Date(day.date + " " + day.exitTime);
    
    // Se a saída for no dia seguinte, ajustar
    if (exitTime < entryTime) {
      exitTime.setDate(exitTime.getDate() + 1);
    }

    totalWorkMinutes = Math.floor((exitTime.getTime() - entryTime.getTime()) / (1000 * 60));
  }

  // Calcular tempo de pausa
  if (day.breakStartTime && day.breakEndTime) {
    const breakStart = new Date(day.date + " " + day.breakStartTime);
    const breakEnd = new Date(day.date + " " + day.breakEndTime);
    
    if (breakEnd < breakStart) {
      breakEnd.setDate(breakEnd.getDate() + 1);
    }

    totalBreakMinutes = Math.floor((breakEnd.getTime() - breakStart.getTime()) / (1000 * 60));
    totalWorkMinutes -= totalBreakMinutes;
  }

  // Calcular atrasos e saídas antecipadas
  if (day.entryTime) {
    const entryTime = new Date(day.date + " " + day.entryTime);
    const expectedEntry = new Date(day.date + " 08:00"); // 8h como padrão
    
    if (entryTime > expectedEntry) {
      delayMinutes = Math.floor((entryTime.getTime() - expectedEntry.getTime()) / (1000 * 60));
      delayMinutes = Math.max(0, delayMinutes - toleranceMinutes);
    }
  }

  if (day.exitTime) {
    const exitTime = new Date(day.date + " " + day.exitTime);
    const expectedExit = new Date(day.date + " 17:00"); // 17h como padrão
    
    if (exitTime < expectedExit) {
      earlyDepartureMinutes = Math.floor((expectedExit.getTime() - exitTime.getTime()) / (1000 * 60));
    }
  }

  // Calcular horas extras
  const overtimeMinutes = Math.max(0, totalWorkMinutes - expectedWorkMinutes);

  // Determinar status
  let status = "incomplete";
  if (day.entryTime && day.exitTime) {
    status = "complete";
  } else if (day.entryTime) {
    status = "partial";
  }

  const isComplete = status === "complete";

  return {
    totalWorkMinutes,
    totalBreakMinutes,
    overtimeMinutes,
    delayMinutes,
    earlyDepartureMinutes,
    hasWorked: day.hasWorked,
    isComplete,
    status,
    totalWorkFormatted: formatMinutes(totalWorkMinutes),
    totalBreakFormatted: formatMinutes(totalBreakMinutes),
    overtimeFormatted: formatMinutes(overtimeMinutes),
    delayFormatted: formatMinutes(delayMinutes),
    earlyDepartureFormatted: formatMinutes(earlyDepartureMinutes),
  };
}

function calculateTotals(dailyRecords: any[]) {
  return dailyRecords.reduce((totals, day) => {
    totals.totalRegularMinutes += day.totalWorkMinutes;
    totals.totalOvertimeMinutes += day.overtimeMinutes;
    totals.totalBreakMinutes += day.totalBreakMinutes;
    totals.totalDelayMinutes += day.delayMinutes;
    totals.totalEarlyDepartureMinutes += day.earlyDepartureMinutes;
    return totals;
  }, {
    totalRegularMinutes: 0,
    totalOvertimeMinutes: 0,
    totalBreakMinutes: 0,
    totalDelayMinutes: 0,
    totalEarlyDepartureMinutes: 0,
  });
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
} 