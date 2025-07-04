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

    // Filtro de período
    let whereClause: any = {
      companyId,
    };
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }
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
      // Mês atual
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setDate(end.getDate() + 1);
      whereClause.createdAt = {
        gte: start,
        lt: end,
      };
    }

    // Buscar funcionários da empresa
    const employees = await prisma.employee.findMany({
      where: { companyId },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    // Buscar registros de ponto no período
    const timeRecords = await prisma.timeRecord.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
    });

    // Agrupar registros por funcionário
    const recordsByEmployee: Record<string, any[]> = {};
    timeRecords.forEach((record) => {
      if (!recordsByEmployee[record.employeeId]) {
        recordsByEmployee[record.employeeId] = [];
      }
      recordsByEmployee[record.employeeId].push(record);
    });

    // Calcular métricas de produtividade
    const productivity = employees.map((employee) => {
      const records = recordsByEmployee[employee.id] || [];
      return analyzeProductivity(employee, records);
    });

    return NextResponse.json({
      success: true,
      data: productivity,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de produtividade:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function analyzeProductivity(employee: any, records: any[]) {
  // Mapear registros por dia
  const dailyMap = new Map();
  records.forEach((record) => {
    const date = new Date(record.createdAt);
    const dateKey = date.toISOString().split("T")[0];
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, []);
    }
    dailyMap.get(dateKey).push(record);
  });

  let daysWorked = 0;
  let totalContractedHours = 0;
  let totalWorkedHours = 0;
  let totalOvertime = 0;
  let totalDelays = 0;
  let totalEarlyDepartures = 0;
  let totalAbsences = 0;


  dailyMap.forEach((dayRecords, dateKey) => {
    // Jornada padrão: 8h/dia (segunda a sexta)
    const date = new Date(dateKey);
    const dayOfWeek = date.getDay();
    let contractedHours = 0;
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      contractedHours = 8;
    }
    totalContractedHours += contractedHours;

    // Encontrar entrada e saída
    const entry = dayRecords.find((r: any) => r.type === "ENTRY");
    const exit = dayRecords.find((r: any) => r.type === "EXIT");
    if (entry && exit) {
      daysWorked++;
      const entryTime = new Date(entry.createdAt);
      const exitTime = new Date(exit.createdAt);
      let workedMinutes = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60);
      // Pausa
      const breakStart = dayRecords.find((r: any) => r.type === "BREAK_START");
      const breakEnd = dayRecords.find((r: any) => r.type === "BREAK_END");
      if (breakStart && breakEnd) {
        const breakStartTime = new Date(breakStart.createdAt);
        const breakEndTime = new Date(breakEnd.createdAt);
        workedMinutes -= (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60);
      }
      const workedHours = workedMinutes / 60;
      totalWorkedHours += workedHours;
      // Horas extras
      if (workedHours > contractedHours) {
        totalOvertime += workedHours - contractedHours;
      }
      // Atrasos (entrada após 08:10)
      if (entryTime.getHours() > 8 || (entryTime.getHours() === 8 && entryTime.getMinutes() > 10)) {
        totalDelays++;
      }
      // Saídas antecipadas (antes de 17:00)
      if (exitTime.getHours() < 17) {
        totalEarlyDepartures++;
      }
    } else {
      // Ausência
      if (contractedHours > 0) {
        totalAbsences++;
      }
    }
  });

  // Eficiência: horas trabalhadas / contratadas
  const efficiency = totalContractedHours > 0 ? Math.round((totalWorkedHours / totalContractedHours) * 100) : 0;
  // Presença: dias trabalhados / dias úteis
  const presenceRate = (daysWorked + totalAbsences) > 0 ? Math.round((daysWorked / (daysWorked + totalAbsences)) * 100) : 0;

  return {
    id: employee.id,
    name: employee.user.name,
    email: employee.user.email,
    position: employee.position,
    workSchedule: employee.workSchedule,
    daysWorked,
    totalContractedHours,
    totalWorkedHours,
    totalOvertime,
    totalDelays,
    totalEarlyDepartures,
    totalAbsences,
    efficiency,
    presenceRate,
  };
} 