import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateDailyWorkHours,
  calculateWeeklyWorkHours,
  calculateMonthlyWorkHours,
  calculateProportionalSalary,
  calculateWorkTimeBank,
  DEFAULT_WORK_HOURS_CONFIG,
  DEFAULT_SALARY_CONFIG,
  formatMinutes,
  formatCurrency,
  formatWorkTimeBank
} from "@/lib/salary-calculations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { month } = body;
    if (!month) {
      return NextResponse.json({
        success: false,
        error: "month é obrigatório"
      }, { status: 400 });
    }

    // Busca todos os funcionários ativos
    const employees = await prisma.employee.findMany({
      where: {},
      select: {
        id: true,
        salary: true,
        user: { select: { name: true } },
      },
    });

    // Busca todos os registros de ponto do mês
    const startDate = new Date(month + '-01');
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    const records = await prisma.timeRecord.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
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

    // Monta folha de pagamento
    const payroll = employees.map(employee => {
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
      // Calcula por mês
      const monthlyCalculation = calculateMonthlyWorkHours(weeklyCalculations, DEFAULT_WORK_HOURS_CONFIG);
      // Configura salário base
      const salaryConfig = {
        ...DEFAULT_SALARY_CONFIG,
        baseSalary: employee.salary || DEFAULT_SALARY_CONFIG.baseSalary,
      };
      // Cálculos principais
      const proportionalSalary = calculateProportionalSalary(monthlyCalculation, salaryConfig);
      const workTimeBank = calculateWorkTimeBank(monthlyCalculation);
      // Formata valores
      return {
        id: employee.id,
        name: employee.user.name,
        salary: employee.salary,
        monthlyCalculation: {
          ...monthlyCalculation,
          totalRegularFormatted: formatMinutes(monthlyCalculation.totalRegularMinutes),
          totalOvertimeFormatted: formatMinutes(monthlyCalculation.totalOvertimeMinutes),
          totalBreakFormatted: formatMinutes(monthlyCalculation.totalBreakMinutes),
          totalNightShiftFormatted: formatMinutes(monthlyCalculation.totalNightShiftMinutes),
          totalDelayFormatted: formatMinutes(monthlyCalculation.totalDelayMinutes),
          totalEarlyDepartureFormatted: formatMinutes(monthlyCalculation.totalEarlyDepartureMinutes),
        },
        proportionalSalary: {
          ...proportionalSalary,
          baseSalaryFormatted: formatCurrency(proportionalSalary.baseSalary),
          proportionalSalaryFormatted: formatCurrency(proportionalSalary.proportionalSalary),
          overtimeValueFormatted: formatCurrency(proportionalSalary.overtimeValue),
          nightShiftValueFormatted: formatCurrency(proportionalSalary.nightShiftValue),
          absencesDiscountFormatted: formatCurrency(proportionalSalary.absencesDiscount),
          latesDiscountFormatted: formatCurrency(proportionalSalary.latesDiscount),
          earlyDeparturesDiscountFormatted: formatCurrency(proportionalSalary.earlyDeparturesDiscount),
          totalDiscountsFormatted: formatCurrency(proportionalSalary.totalDiscounts),
          finalSalaryFormatted: formatCurrency(proportionalSalary.finalSalary),
        },
        workTimeBank: {
          ...workTimeBank,
          totalCreditsFormatted: formatWorkTimeBank(workTimeBank.totalCredits),
          totalDebitsFormatted: formatWorkTimeBank(workTimeBank.totalDebits),
          balanceFormatted: formatWorkTimeBank(workTimeBank.balance),
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: payroll
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 });
  }
} 