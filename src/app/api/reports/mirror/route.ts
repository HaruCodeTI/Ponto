import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, employeeId, month } = body;

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

    if (!month) {
      return NextResponse.json(
        { success: false, error: "Mês é obrigatório (formato: YYYY-MM)" },
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
        company: {
          select: {
            name: true,
            cnpj: true,
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

    // Calcular período do mês
    const [year, monthNum] = month.split("-");
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
    endDate.setDate(endDate.getDate() + 1);

    // Buscar registros de ponto do mês
    const timeRecords = await prisma.timeRecord.findMany({
      where: {
        employeeId: employeeId,
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Gerar espelho de ponto
    const mirrorData = generateMirrorData(employee, timeRecords, month);

    return NextResponse.json({
      success: true,
      data: mirrorData,
    });
  } catch (error) {
    console.error("Erro ao gerar espelho de ponto:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function generateMirrorData(employee: any, records: any[], month: string) {
  const dailyMap = new Map();

  // Processar registros por dia
  records.forEach((record) => {
    const date = new Date(record.createdAt);
    const dateKey = date.toISOString().split("T")[0];

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
        totalHours: 0,
        observations: "",
      });
    }

    const dayRecord = dailyMap.get(dateKey);
    dayRecord.records.push({
      id: record.id,
      type: record.type,
      time: date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: record.createdAt,
    });

    // Processar horários
    if (record.type === "ENTRY") {
      dayRecord.entryTime = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (record.type === "EXIT") {
      dayRecord.exitTime = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (record.type === "BREAK_START") {
      dayRecord.breakStartTime = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (record.type === "BREAK_END") {
      dayRecord.breakEndTime = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  });

  // Calcular horas trabalhadas e observações para cada dia
  const dailyEntries = Array.from(dailyMap.values()).map((day) => {
    let totalHours = 0;
    let observations = "";

    if (day.entryTime && day.exitTime) {
      const entryTime = new Date(day.date + " " + day.entryTime);
      const exitTime = new Date(day.date + " " + day.exitTime);

      if (exitTime < entryTime) {
        exitTime.setDate(exitTime.getDate() + 1);
      }

      let workedMinutes = Math.floor((exitTime.getTime() - entryTime.getTime()) / (1000 * 60));

      // Descontar pausa
      if (day.breakStartTime && day.breakEndTime) {
        const breakStart = new Date(day.date + " " + day.breakStartTime);
        const breakEnd = new Date(day.date + " " + day.breakEndTime);

        if (breakEnd < breakStart) {
          breakEnd.setDate(breakEnd.getDate() + 1);
        }

        const breakMinutes = Math.floor((breakEnd.getTime() - breakStart.getTime()) / (1000 * 60));
        workedMinutes -= breakMinutes;
      }

      totalHours = Math.round((workedMinutes / 60) * 100) / 100;

      // Verificar observações
      if (entryTime.getHours() > 8 || (entryTime.getHours() === 8 && entryTime.getMinutes() > 10)) {
        observations += "Atraso na entrada. ";
      }
      if (exitTime.getHours() < 17) {
        observations += "Saída antecipada. ";
      }
      if (totalHours > 8) {
        observations += "Horas extras. ";
      }
      if (totalHours < 8 && day.dayOfWeek >= 1 && day.dayOfWeek <= 5) {
        observations += "Jornada incompleta. ";
      }
    } else {
      if (day.dayOfWeek >= 1 && day.dayOfWeek <= 5) {
        observations = "Falta.";
      } else {
        observations = "Dia não trabalhado.";
      }
    }

    return {
      ...day,
      totalHours,
      observations: observations.trim() || "Normal",
    };
  });

  // Ordenar por data
  dailyEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calcular totais
  const totalWorkDays = dailyEntries.filter((day) => day.entryTime && day.exitTime).length;
  const totalHours = dailyEntries.reduce((sum, day) => sum + day.totalHours, 0);
  const totalAbsences = dailyEntries.filter((day) => !day.entryTime && day.dayOfWeek >= 1 && day.dayOfWeek <= 5).length;

  return {
    employee: {
      id: employee.id,
      name: employee.user.name,
      email: employee.user.email,
      position: employee.position,
      cpf: employee.cpf,
    },
    company: {
      name: employee.company.name,
      cnpj: employee.company.cnpj,
    },
    month: {
      period: month,
      periodFormatted: new Date(month + "-01").toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
      totalWorkDays,
      totalHours: Math.round(totalHours * 100) / 100,
      totalAbsences,
    },
    dailyEntries,
    generatedAt: new Date().toISOString(),
  };
} 