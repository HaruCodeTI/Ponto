import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, employeeId, startDate, endDate, month } = body;

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

    // Filtro por período
    if (month) {
      const [year, monthNum] = month.split("-");
      const start = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const end = new Date(parseInt(year), parseInt(monthNum), 0);
      end.setDate(end.getDate() + 1);

      whereClause.createdAt = {
        gte: start,
        lt: end,
      };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);

      whereClause.createdAt = {
        gte: start,
        lt: end,
      };
    } else {
      // Se nenhum período foi fornecido, usar o mês atual
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setDate(end.getDate() + 1);

      whereClause.createdAt = {
        gte: start,
        lt: end,
      };
    }

    // Buscar registros de ponto
    const timeRecords = await prisma.timeRecord.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "asc",
      },
    });

    // Processar análise de jornada
    const workScheduleAnalysis = analyzeWorkSchedule(timeRecords, employee);

    // Determinar período do relatório
    const reportPeriod = month 
      ? new Date(month + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      : startDate && endDate
      ? `${new Date(startDate).toLocaleDateString("pt-BR")} a ${new Date(endDate).toLocaleDateString("pt-BR")}`
      : new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

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
          startDate: startDate || month + "-01" || new Date().toISOString().split('T')[0],
          endDate: endDate || month + "-31" || new Date().toISOString().split('T')[0],
          reportPeriod,
        },
        workScheduleAnalysis,
        summary: {
          totalDays: workScheduleAnalysis.totalDays,
          workDays: workScheduleAnalysis.workDays,
          complianceRate: workScheduleAnalysis.complianceRate,
          totalContractedHours: workScheduleAnalysis.totalContractedHours,
          totalWorkedHours: workScheduleAnalysis.totalWorkedHours,
          totalOvertime: workScheduleAnalysis.totalOvertime,
          totalShortage: workScheduleAnalysis.totalShortage,
          averageDeviation: workScheduleAnalysis.averageDeviation,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao gerar análise de jornada:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function analyzeWorkSchedule(timeRecords: any[], employee: any) {
  const dailyMap = new Map();
  const weeklyMap = new Map();

  // Processar registros por dia
  timeRecords.forEach(record => {
    const date = new Date(record.createdAt);
    const dateKey = date.toISOString().split('T')[0];

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        dateFormatted: date.toLocaleDateString("pt-BR"),
        dayOfWeek: date.getDay(),
        dayName: date.toLocaleDateString("pt-BR", { weekday: "long" }),
        records: [],
        entryTime: null,
        exitTime: null,
        breakStartTime: null,
        breakEndTime: null,
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
        contractedHours: 0,
        deviation: 0,
        status: "incomplete",
      });
    }

    const dayRecord = dailyMap.get(dateKey);
    dayRecord.records.push({
      id: record.id,
      type: record.type,
      time: date.toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      }),
      timestamp: record.createdAt,
    });

    // Processar horários
    if (record.type === "ENTRY") {
      dayRecord.entryTime = date.toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } else if (record.type === "EXIT") {
      dayRecord.exitTime = date.toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } else if (record.type === "BREAK_START") {
      dayRecord.breakStartTime = date.toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } else if (record.type === "BREAK_END") {
      dayRecord.breakEndTime = date.toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    }
  });

  // Calcular métricas para cada dia
  const dailyAnalysis = Array.from(dailyMap.values()).map(day => {
    const calculations = calculateDayMetrics(day, employee);
    return {
      ...day,
      ...calculations,
    };
  });

      // Calcular métricas semanais
    dailyAnalysis.forEach(day => {
      const weekKey = getWeekKey(new Date(day.date));
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          week: weekKey,
          weekFormatted: formatWeek(weekKey),
          days: [],
          totalContractedHours: 0,
          totalWorkedHours: 0,
          totalOvertime: 0,
          totalShortage: 0,
          complianceRate: 0,
        });
      }

      const weekData = weeklyMap.get(weekKey);
      if (weekData) {
        weekData.days.push(day);
        weekData.totalContractedHours += day.contractedHours;
        weekData.totalWorkedHours += day.totalWorkMinutes / 60;
        weekData.totalOvertime += Math.max(0, (day.totalWorkMinutes / 60) - day.contractedHours);
        weekData.totalShortage += Math.max(0, day.contractedHours - (day.totalWorkMinutes / 60));
      }
    });

  // Calcular compliance rate semanal
  const weeklyAnalysis = Array.from(weeklyMap.values()).map(week => {
    week.complianceRate = week.totalContractedHours > 0 
      ? Math.round(((week.totalWorkedHours / week.totalContractedHours) * 100) * 100) / 100
      : 0;
    return week;
  });

  // Calcular totais gerais
  const totalDays = dailyAnalysis.length;
  const workDays = dailyAnalysis.filter(day => day.contractedHours > 0).length;
  const totalContractedHours = dailyAnalysis.reduce((sum, day) => sum + day.contractedHours, 0);
  const totalWorkedHours = dailyAnalysis.reduce((sum, day) => sum + (day.totalWorkMinutes / 60), 0);
  const totalOvertime = Math.max(0, totalWorkedHours - totalContractedHours);
  const totalShortage = Math.max(0, totalContractedHours - totalWorkedHours);
  const complianceRate = totalContractedHours > 0 
    ? Math.round(((totalWorkedHours / totalContractedHours) * 100) * 100) / 100
    : 0;
  const averageDeviation = totalDays > 0 
    ? dailyAnalysis.reduce((sum, day) => sum + Math.abs(day.deviation), 0) / totalDays
    : 0;

  return {
    daily: dailyAnalysis.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    weekly: weeklyAnalysis.sort((a, b) => a.week.localeCompare(b.week)),
    totalDays,
    workDays,
    complianceRate,
    totalContractedHours,
    totalWorkedHours,
    totalOvertime,
    totalShortage,
    averageDeviation,
    totalContractedHoursFormatted: formatHours(totalContractedHours),
    totalWorkedHoursFormatted: formatHours(totalWorkedHours),
    totalOvertimeFormatted: formatHours(totalOvertime),
    totalShortageFormatted: formatHours(totalShortage),
    averageDeviationFormatted: formatHours(averageDeviation),
  };
}

function calculateDayMetrics(day: any, employee: any) {
  const toleranceMinutes = employee.toleranceMinutes || 0;

  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;
  let contractedHours = 0;

      // Jornada padrão de 8h para dias úteis (segunda a sexta)
    if (day.dayOfWeek >= 1 && day.dayOfWeek <= 5) {
      contractedHours = 8;
    }

  // Calcular tempo de trabalho efetivo
  if (day.entryTime && day.exitTime) {
    const entryTime = new Date(day.date + " " + day.entryTime);
    const exitTime = new Date(day.date + " " + day.exitTime);
    
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

  // Calcular desvio
  const workedHours = totalWorkMinutes / 60;
  const deviation = workedHours - contractedHours;

  // Determinar status
  let status = "incomplete";
  if (day.entryTime && day.exitTime) {
    if (Math.abs(deviation) <= (toleranceMinutes / 60)) {
      status = "compliant";
    } else if (deviation > 0) {
      status = "overtime";
    } else {
      status = "shortage";
    }
  }

  return {
    totalWorkMinutes,
    totalBreakMinutes,
    contractedHours,
    deviation,
    status,
    totalWorkFormatted: formatMinutes(totalWorkMinutes),
    totalBreakFormatted: formatMinutes(totalBreakMinutes),
    contractedHoursFormatted: formatHours(contractedHours),
    deviationFormatted: formatHours(deviation),
  };
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function formatWeek(weekKey: string): string {
  const [year, week] = weekKey.split('-W');
  return `Semana ${week} de ${year}`;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
}

function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}min`;
} 