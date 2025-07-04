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
    const { companyId, month, position, workSchedule } = body;

    if (!companyId || !month) {
      return NextResponse.json({
        success: false,
        error: "companyId e month são obrigatórios"
      }, { status: 400 });
    }

    // Busca todos os funcionários da empresa, filtrando por setor e jornada se fornecidos
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        ...(position ? { position } : {}),
        ...(workSchedule ? { workSchedule } : {}),
      },
      select: {
        id: true,
        salary: true,
        position: true,
        workSchedule: true,
        user: { select: { name: true } },
      },
    });

    if (employees.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Nenhum funcionário encontrado para esta empresa"
      }, { status: 404 });
    }

    // Busca todos os registros de ponto do mês
    const startDate = new Date(month + '-01');
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const records = await prisma.timeRecord.findMany({
      where: {
        companyId,
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

      // Calcula por mês
      const monthlyCalculation = calculateMonthlyWorkHours(weeklyCalculations, DEFAULT_WORK_HOURS_CONFIG);

      return {
        id: employee.id,
        name: employee.user.name,
        salary: employee.salary,
        position: employee.position,
        workSchedule: employee.workSchedule,
        monthlyCalculation: {
          ...monthlyCalculation,
          totalRegularFormatted: formatMinutes(monthlyCalculation.totalRegularMinutes),
          totalOvertimeFormatted: formatMinutes(monthlyCalculation.totalOvertimeMinutes),
          totalBreakFormatted: formatMinutes(monthlyCalculation.totalBreakMinutes),
          totalNightShiftFormatted: formatMinutes(monthlyCalculation.totalNightShiftMinutes),
          totalDelayFormatted: formatMinutes(monthlyCalculation.totalDelayMinutes),
          totalEarlyDepartureFormatted: formatMinutes(monthlyCalculation.totalEarlyDepartureMinutes),
        },
      };
    });

    // Calcula totais da empresa
    const companyTotals = {
      totalEmployees: employees.length,
      totalWorkDays: employeeData.reduce((sum, emp) => sum + emp.monthlyCalculation.workDays, 0),
      totalRegularMinutes: employeeData.reduce((sum, emp) => sum + emp.monthlyCalculation.totalRegularMinutes, 0),
      totalOvertimeMinutes: employeeData.reduce((sum, emp) => sum + emp.monthlyCalculation.totalOvertimeMinutes, 0),
      totalBreakMinutes: employeeData.reduce((sum, emp) => sum + emp.monthlyCalculation.totalBreakMinutes, 0),
      totalNightShiftMinutes: employeeData.reduce((sum, emp) => sum + emp.monthlyCalculation.totalNightShiftMinutes, 0),
      totalDelayMinutes: employeeData.reduce((sum, emp) => sum + emp.monthlyCalculation.totalDelayMinutes, 0),
      totalEarlyDepartureMinutes: employeeData.reduce((sum, emp) => sum + emp.monthlyCalculation.totalEarlyDepartureMinutes, 0),
      totalCompleteDays: employeeData.reduce((sum, emp) => sum + emp.monthlyCalculation.completeDays, 0),
      totalLateDays: employeeData.reduce((sum, emp) => sum + emp.monthlyCalculation.lateDays, 0),
      totalEarlyDepartureDays: employeeData.reduce((sum, emp) => sum + emp.monthlyCalculation.earlyDepartureDays, 0),
      totalOvertimeDays: employeeData.reduce((sum, emp) => sum + emp.monthlyCalculation.overtimeDays, 0),
      totalNightShiftDays: employeeData.reduce((sum, emp) => sum + emp.monthlyCalculation.nightShiftDays, 0),
      totalSalary: employeeData.reduce((sum, emp) => sum + emp.salary, 0),
    };

    // Formata totais
    const formattedTotals = {
      ...companyTotals,
      totalRegularFormatted: formatMinutes(companyTotals.totalRegularMinutes),
      totalOvertimeFormatted: formatMinutes(companyTotals.totalOvertimeMinutes),
      totalBreakFormatted: formatMinutes(companyTotals.totalBreakMinutes),
      totalNightShiftFormatted: formatMinutes(companyTotals.totalNightShiftMinutes),
      totalDelayFormatted: formatMinutes(companyTotals.totalDelayMinutes),
      totalEarlyDepartureFormatted: formatMinutes(companyTotals.totalEarlyDepartureMinutes),
      totalSalaryFormatted: formatCurrency(companyTotals.totalSalary),
      averageHoursPerEmployee: formatMinutes(companyTotals.totalRegularMinutes / companyTotals.totalEmployees),
      averageOvertimePerEmployee: formatMinutes(companyTotals.totalOvertimeMinutes / companyTotals.totalEmployees),
      attendanceRate: ((companyTotals.totalCompleteDays / companyTotals.totalWorkDays) * 100).toFixed(1) + '%',
      punctualityRate: (((companyTotals.totalWorkDays - companyTotals.totalLateDays) / companyTotals.totalWorkDays) * 100).toFixed(1) + '%',
    };

    return NextResponse.json({
      success: true,
      data: {
        month,
        companyId,
        employees: employeeData,
        totals: formattedTotals,
        summary: {
          period: month,
          totalEmployees: companyTotals.totalEmployees,
          totalWorkDays: companyTotals.totalWorkDays,
          totalRegularHours: formattedTotals.totalRegularFormatted,
          totalOvertimeHours: formattedTotals.totalOvertimeFormatted,
          totalSalary: formattedTotals.totalSalaryFormatted,
          attendanceRate: formattedTotals.attendanceRate,
          punctualityRate: formattedTotals.punctualityRate,
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