import { NextRequest, NextResponse } from "next/server";


// GET: obter configurações atuais
export async function GET() {
  try {
    // Por enquanto, retorna configurações padrão
    // Futuramente pode ser armazenado no banco
    const config = {
      workHoursPerDay: 8,
      workDaysPerWeek: 5,
      workDaysPerMonth: 22,
      toleranceMinutes: 15,
      discountPerAbsence: 1, // 1 dia de salário
      discountPerLate: 0.5, // 0.5 dia de salário
      discountPerEarlyDeparture: 0.5, // 0.5 dia de salário
      overtimeRate: 1.5, // 50% adicional
      nightShiftRate: 1.2, // 20% adicional
      maxOvertimePerDay: 2, // horas
      maxOvertimePerWeek: 10, // horas
      breakTimeMinutes: 60,
      calculateNightShift: false,
      nightShiftStart: "22:00",
      nightShiftEnd: "05:00",
      flexibleSchedule: false,
    };

    return NextResponse.json({ success: true, data: config });
  } catch {
    return NextResponse.json({ success: false, error: "Erro ao carregar configurações" }, { status: 500 });
  }
}

// PUT: atualizar configurações
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      workHoursPerDay,
      workDaysPerWeek,
      workDaysPerMonth,
      toleranceMinutes,
      discountPerAbsence,
      discountPerLate,
      discountPerEarlyDeparture,
      overtimeRate,
      nightShiftRate,
      maxOvertimePerDay,
      maxOvertimePerWeek,
      breakTimeMinutes,
      calculateNightShift,
      nightShiftStart,
      nightShiftEnd,
      flexibleSchedule,
    } = body;

    // Validações básicas
    if (workHoursPerDay < 1 || workHoursPerDay > 24) {
      return NextResponse.json({ success: false, error: "Horas por dia deve estar entre 1 e 24" }, { status: 400 });
    }

    if (overtimeRate < 1 || overtimeRate > 3) {
      return NextResponse.json({ success: false, error: "Taxa de horas extras deve estar entre 1 e 3" }, { status: 400 });
    }

    if (nightShiftRate < 1 || nightShiftRate > 2) {
      return NextResponse.json({ success: false, error: "Taxa de adicional noturno deve estar entre 1 e 2" }, { status: 400 });
    }

    // Por enquanto, apenas retorna sucesso
    // Futuramente pode ser salvo no banco
    const updatedConfig = {
      workHoursPerDay: workHoursPerDay || 8,
      workDaysPerWeek: workDaysPerWeek || 5,
      workDaysPerMonth: workDaysPerMonth || 22,
      toleranceMinutes: toleranceMinutes || 15,
      discountPerAbsence: discountPerAbsence || 1,
      discountPerLate: discountPerLate || 0.5,
      discountPerEarlyDeparture: discountPerEarlyDeparture || 0.5,
      overtimeRate: overtimeRate || 1.5,
      nightShiftRate: nightShiftRate || 1.2,
      maxOvertimePerDay: maxOvertimePerDay || 2,
      maxOvertimePerWeek: maxOvertimePerWeek || 10,
      breakTimeMinutes: breakTimeMinutes || 60,
      calculateNightShift: calculateNightShift || false,
      nightShiftStart: nightShiftStart || "22:00",
      nightShiftEnd: nightShiftEnd || "05:00",
      flexibleSchedule: flexibleSchedule || false,
    };

    return NextResponse.json({ success: true, data: updatedConfig });
  } catch {
    return NextResponse.json({ success: false, error: "Erro ao atualizar configurações" }, { status: 500 });
  }
} 