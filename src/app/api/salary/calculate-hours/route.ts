import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  calculateDailyWorkHours, 
  calculateWeeklyWorkHours, 
  calculateMonthlyWorkHours,
  DEFAULT_WORK_HOURS_CONFIG 
} from "@/lib/salary-calculations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      employeeId, 
      startDate, 
      endDate, 
      calculationType = 'DAILY',
      config = DEFAULT_WORK_HOURS_CONFIG 
    } = body;

    // Validação dos parâmetros
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

    // Converte registros do Prisma para o formato esperado
    const formattedRecords = records.map(record => ({
      ...record,
      timestamp: record.timestamp.toISOString(),
      createdAt: record.createdAt.toISOString(),
      integrityTimestamp: record.integrityTimestamp.toISOString(),
      latitude: record.latitude ?? undefined,
      longitude: record.longitude ?? undefined,
      ipAddress: record.ipAddress ?? undefined,
      deviceInfo: record.deviceInfo ?? undefined,
      photoUrl: record.photoUrl ?? undefined,
      nfcTag: record.nfcTag ?? undefined,
    }));

    // Agrupa registros por data
    const recordsByDate: Record<string, typeof formattedRecords> = {};
    formattedRecords.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!recordsByDate[date]) {
        recordsByDate[date] = [];
      }
      recordsByDate[date].push(record);
    });

    // Calcula horas trabalhadas conforme o tipo solicitado
    switch (calculationType) {
      case 'DAILY': {
        const dailyCalculations = Object.entries(recordsByDate).map(([_date, dayRecords]) => 
          calculateDailyWorkHours(dayRecords, config)
        );

        return NextResponse.json({
          success: true,
          data: {
            type: 'DAILY',
            employeeId,
            startDate,
            endDate,
            calculations: dailyCalculations,
            summary: {
              totalDays: dailyCalculations.length,
              completeDays: dailyCalculations.filter(d => d.isComplete).length,
              totalRegularMinutes: dailyCalculations.reduce((sum, d) => sum + d.regularMinutes, 0),
              totalOvertimeMinutes: dailyCalculations.reduce((sum, d) => sum + d.overtimeMinutes, 0),
              totalBreakMinutes: dailyCalculations.reduce((sum, d) => sum + d.breakMinutes, 0),
              totalDelayMinutes: dailyCalculations.reduce((sum, d) => sum + d.delayMinutes, 0),
              totalEarlyDepartureMinutes: dailyCalculations.reduce((sum, d) => sum + d.earlyDepartureMinutes, 0),
            }
          }
        });
      }

      case 'WEEKLY': {
        // Agrupa por semana
        const weeklyGroups: Record<string, typeof formattedRecords> = {};
        formattedRecords.forEach(record => {
          const date = new Date(record.timestamp);
          const weekStart = getWeekStart(date);
          const weekKey = weekStart.toISOString().split('T')[0];
          
          if (!weeklyGroups[weekKey]) {
            weeklyGroups[weekKey] = [];
          }
          weeklyGroups[weekKey].push(record);
        });

        const weeklyCalculations = Object.entries(weeklyGroups).map(([_weekStart, weekRecords]) => {
          // Agrupa registros da semana por dia
          const weekRecordsByDate: Record<string, typeof weekRecords> = {};
          weekRecords.forEach(record => {
            const date = new Date(record.timestamp).toISOString().split('T')[0];
            if (!weekRecordsByDate[date]) {
              weekRecordsByDate[date] = [];
            }
            weekRecordsByDate[date].push(record);
          });

                      const dailyCalculations = Object.entries(weekRecordsByDate).map(([_date, dayRecords]) => 
              calculateDailyWorkHours(dayRecords, config)
            );

          return calculateWeeklyWorkHours(dailyCalculations, config);
        });

        return NextResponse.json({
          success: true,
          data: {
            type: 'WEEKLY',
            employeeId,
            startDate,
            endDate,
            calculations: weeklyCalculations,
            summary: {
              totalWeeks: weeklyCalculations.length,
              totalDays: weeklyCalculations.reduce((sum, w) => sum + w.workDays, 0),
              totalRegularMinutes: weeklyCalculations.reduce((sum, w) => sum + w.totalRegularMinutes, 0),
              totalOvertimeMinutes: weeklyCalculations.reduce((sum, w) => sum + w.totalOvertimeMinutes, 0),
              totalBreakMinutes: weeklyCalculations.reduce((sum, w) => sum + w.totalBreakMinutes, 0),
            }
          }
        });
      }

      case 'MONTHLY': {
        // Agrupa por mês
        const monthlyGroups: Record<string, typeof formattedRecords> = {};
        formattedRecords.forEach(record => {
          const date = new Date(record.timestamp);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyGroups[monthKey]) {
            monthlyGroups[monthKey] = [];
          }
          monthlyGroups[monthKey].push(record);
        });

        const monthlyCalculations = Object.entries(monthlyGroups).map(([_month, monthRecords]) => {
          // Agrupa registros do mês por semana
          const monthRecordsByWeek: Record<string, typeof monthRecords> = {};
          monthRecords.forEach(record => {
            const date = new Date(record.timestamp);
            const weekStart = getWeekStart(date);
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!monthRecordsByWeek[weekKey]) {
              monthRecordsByWeek[weekKey] = [];
            }
            monthRecordsByWeek[weekKey].push(record);
          });

          const weeklyCalculations = Object.entries(monthRecordsByWeek).map(([_weekStart, weekRecords]) => {
            // Agrupa registros da semana por dia
            const weekRecordsByDate: Record<string, typeof weekRecords> = {};
            weekRecords.forEach(record => {
              const date = new Date(record.timestamp).toISOString().split('T')[0];
              if (!weekRecordsByDate[date]) {
                weekRecordsByDate[date] = [];
              }
              weekRecordsByDate[date].push(record);
            });

            const dailyCalculations = Object.entries(weekRecordsByDate).map(([_date, dayRecords]) => 
              calculateDailyWorkHours(dayRecords, config)
            );

            return calculateWeeklyWorkHours(dailyCalculations, config);
          });

          return calculateMonthlyWorkHours(weeklyCalculations, config);
        });

        return NextResponse.json({
          success: true,
          data: {
            type: 'MONTHLY',
            employeeId,
            startDate,
            endDate,
            calculations: monthlyCalculations,
            summary: {
              totalMonths: monthlyCalculations.length,
              totalDays: monthlyCalculations.reduce((sum, m) => sum + m.workDays, 0),
              totalRegularMinutes: monthlyCalculations.reduce((sum, m) => sum + m.totalRegularMinutes, 0),
              totalOvertimeMinutes: monthlyCalculations.reduce((sum, m) => sum + m.totalOvertimeMinutes, 0),
              totalBreakMinutes: monthlyCalculations.reduce((sum, m) => sum + m.totalBreakMinutes, 0),
            }
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: "Tipo de cálculo inválido. Use: DAILY, WEEKLY ou MONTHLY"
        }, { status: 400 });
    }

  } catch (error) {
    console.error("Erro ao calcular horas trabalhadas:", error);
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 });
  }
}

/**
 * Obtém o início da semana (segunda-feira)
 */
function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
  return new Date(date.setDate(diff));
} 