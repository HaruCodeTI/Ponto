import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateDailyWorkHours,
  calculateWeeklyWorkHours,
  calculateMonthlyWorkHours,
  DEFAULT_WORK_HOURS_CONFIG,
  formatMinutes,
  formatCurrency,
} from "@/lib/salary-calculations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, startDate, endDate, employeeId, position, workSchedule } = body;

    if (!companyId || !startDate || !endDate) {
      return NextResponse.json({
        success: false,
        error: "companyId, startDate e endDate são obrigatórios"
      }, { status: 400 });
    }

    // Busca funcionários com filtros
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        ...(employeeId ? { id: employeeId } : {}),
        ...(position ? { position } : {}),
        ...(workSchedule ? { workSchedule } : {}),
      },
      select: {
        id: true,
        salary: true,
        position: true,
        workSchedule: true,
        bankHours: true,
        user: { select: { name: true } },
      },
    });

    if (employees.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Nenhum funcionário encontrado com os filtros aplicados"
      }, { status: 404 });
    }

    // Busca registros de ponto do período
    const records = await prisma.timeRecord.findMany({
      where: {
        companyId,
        employeeId: { in: employees.map(emp => emp.id) },
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Agrupa registros por funcionário
    const recordsByEmployee: Record<string, typeof records> = {};
    records.forEach(record => {
      if (!recordsByEmployee[record.employeeId]) {
        recordsByEmployee[record.employeeId] = [];
      }
      recordsByEmployee[record.employeeId].push(record);
    });

    // Calcula dados por funcionário
    const employeeData = employees.map(employee => {
      const empRecords = recordsByEmployee[employee.id] || [];
      
      // Agrupa por dia
      const recordsByDate: Record<string, typeof empRecords> = {};
      empRecords.forEach(record => {
        const date = new Date(record.timestamp).toISOString().split('T')[0];
        if (!recordsByDate[date]) {
          recordsByDate[date] = [];
        }
        recordsByDate[date].push(record);
      });

      // Calcula por dia
      const dailyCalculations = Object.entries(recordsByDate).map(([_date, dayRecords]) => {
        const formattedRecords = dayRecords.map(record => ({
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
        return calculateDailyWorkHours(formattedRecords, DEFAULT_WORK_HOURS_CONFIG);
      });

      // Agrupa por semana
      const weeklyMap: Record<string, typeof dailyCalculations> = {};
      dailyCalculations.forEach(daily => {
        const date = new Date(daily.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weeklyMap[weekKey]) {
          weeklyMap[weekKey] = [];
        }
        weeklyMap[weekKey].push(daily);
      });

      // Calcula por semana
      const weeklyCalculations = Object.values(weeklyMap).map(weekDailyCalculations =>
        calculateWeeklyWorkHours(weekDailyCalculations, DEFAULT_WORK_HOURS_CONFIG)
      );

      // Calcula por período
      const periodCalculation = calculateMonthlyWorkHours(weeklyCalculations, DEFAULT_WORK_HOURS_CONFIG);

      // Calcula banco de horas
      const bankHoursCalculation = {
        initialBalance: employee.bankHours,
        credits: periodCalculation.totalOvertimeMinutes / 60, // Horas extras viram créditos
        debits: (periodCalculation.totalDelayMinutes + periodCalculation.totalEarlyDepartureMinutes) / 60, // Atrasos e saídas antecipadas viram débitos
        finalBalance: employee.bankHours + (periodCalculation.totalOvertimeMinutes / 60) - ((periodCalculation.totalDelayMinutes + periodCalculation.totalEarlyDepartureMinutes) / 60),
      };

      return {
        id: employee.id,
        name: employee.user.name,
        position: employee.position,
        workSchedule: employee.workSchedule,
        salary: employee.salary,
        periodCalculation: {
          ...periodCalculation,
          totalRegularFormatted: formatMinutes(periodCalculation.totalRegularMinutes),
          totalOvertimeFormatted: formatMinutes(periodCalculation.totalOvertimeMinutes),
          totalBreakFormatted: formatMinutes(periodCalculation.totalBreakMinutes),
          totalNightShiftFormatted: formatMinutes(periodCalculation.totalNightShiftMinutes),
          totalDelayFormatted: formatMinutes(periodCalculation.totalDelayMinutes),
          totalEarlyDepartureFormatted: formatMinutes(periodCalculation.totalEarlyDepartureMinutes),
        },
        bankHours: {
          ...bankHoursCalculation,
          initialBalanceFormatted: formatMinutes(bankHoursCalculation.initialBalance * 60),
          creditsFormatted: formatMinutes(bankHoursCalculation.credits * 60),
          debitsFormatted: formatMinutes(bankHoursCalculation.debits * 60),
          finalBalanceFormatted: formatMinutes(bankHoursCalculation.finalBalance * 60),
        },
      };
    });

    // Calcula totais do período
    const periodTotals = {
      totalEmployees: employees.length,
      totalWorkDays: employeeData.reduce((sum, emp) => sum + emp.periodCalculation.workDays, 0),
      totalRegularMinutes: employeeData.reduce((sum, emp) => sum + emp.periodCalculation.totalRegularMinutes, 0),
      totalOvertimeMinutes: employeeData.reduce((sum, emp) => sum + emp.periodCalculation.totalOvertimeMinutes, 0),
      totalBreakMinutes: employeeData.reduce((sum, emp) => sum + emp.periodCalculation.totalBreakMinutes, 0),
      totalNightShiftMinutes: employeeData.reduce((sum, emp) => sum + emp.periodCalculation.totalNightShiftMinutes, 0),
      totalDelayMinutes: employeeData.reduce((sum, emp) => sum + emp.periodCalculation.totalDelayMinutes, 0),
      totalEarlyDepartureMinutes: employeeData.reduce((sum, emp) => sum + emp.periodCalculation.totalEarlyDepartureMinutes, 0),
      totalBankHoursCredits: employeeData.reduce((sum, emp) => sum + emp.bankHours.credits, 0),
      totalBankHoursDebits: employeeData.reduce((sum, emp) => sum + emp.bankHours.debits, 0),
      totalSalary: employeeData.reduce((sum, emp) => sum + emp.salary, 0),
    };

    // Formata totais
    const formattedTotals = {
      ...periodTotals,
      totalRegularFormatted: formatMinutes(periodTotals.totalRegularMinutes),
      totalOvertimeFormatted: formatMinutes(periodTotals.totalOvertimeMinutes),
      totalBreakFormatted: formatMinutes(periodTotals.totalBreakMinutes),
      totalNightShiftFormatted: formatMinutes(periodTotals.totalNightShiftMinutes),
      totalDelayFormatted: formatMinutes(periodTotals.totalDelayMinutes),
      totalEarlyDepartureFormatted: formatMinutes(periodTotals.totalEarlyDepartureMinutes),
      totalSalaryFormatted: formatCurrency(periodTotals.totalSalary),
      averageHoursPerEmployee: formatMinutes(periodTotals.totalRegularMinutes / periodTotals.totalEmployees),
      averageOvertimePerEmployee: formatMinutes(periodTotals.totalOvertimeMinutes / periodTotals.totalEmployees),
      totalBankHoursCreditsFormatted: formatMinutes(periodTotals.totalBankHoursCredits * 60),
      totalBankHoursDebitsFormatted: formatMinutes(periodTotals.totalBankHoursDebits * 60),
      netBankHoursFormatted: formatMinutes((periodTotals.totalBankHoursCredits - periodTotals.totalBankHoursDebits) * 60),
    };

    return NextResponse.json({
      success: true,
      data: {
        period: { startDate, endDate },
        companyId,
        employees: employeeData,
        totals: formattedTotals,
        summary: {
          period: `${startDate} a ${endDate}`,
          totalEmployees: periodTotals.totalEmployees,
          totalWorkDays: periodTotals.totalWorkDays,
          totalRegularHours: formattedTotals.totalRegularFormatted,
          totalOvertimeHours: formattedTotals.totalOvertimeFormatted,
          totalBankHoursCredits: formattedTotals.totalBankHoursCreditsFormatted,
          totalBankHoursDebits: formattedTotals.totalBankHoursDebitsFormatted,
          netBankHours: formattedTotals.netBankHoursFormatted,
          totalSalary: formattedTotals.totalSalaryFormatted,
        }
      }
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 });
  }
} 