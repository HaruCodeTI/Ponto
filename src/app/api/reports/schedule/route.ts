import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ScheduleConfig {
  companyId: string;
  frequency: "MONTHLY" | "WEEKLY" | "DAILY";
  dayOfMonth?: number; // Para relatórios mensais (1-31)
  recipients: string[]; // Emails dos destinatários
  format: "EXCEL" | "CSV" | "BOTH";
  includeFilters?: {
    position?: string;
    workSchedule?: string;
  };
  isActive: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: ScheduleConfig = await req.json();
    const { companyId, frequency, dayOfMonth, recipients, format, includeFilters, isActive } = body;

    if (!companyId || !frequency || !recipients.length) {
      return NextResponse.json({
        success: false,
        error: "companyId, frequency e recipients são obrigatórios"
      }, { status: 400 });
    }

    // Validações
    if (frequency === "MONTHLY" && (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31)) {
      return NextResponse.json({
        success: false,
        error: "Para relatórios mensais, dayOfMonth deve ser entre 1 e 31"
      }, { status: 400 });
    }

    // Verifica se a empresa existe
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json({
        success: false,
        error: "Empresa não encontrada"
      }, { status: 404 });
    }

    // Cria ou atualiza o agendamento
    const schedule = await prisma.reportSchedule.upsert({
      where: { companyId },
      update: {
        frequency,
        dayOfMonth,
        recipients: recipients.join(","),
        format,
        includeFilters: includeFilters ? JSON.stringify(includeFilters) : null,
        isActive,
        updatedAt: new Date()
      },
      create: {
        companyId,
        frequency,
        dayOfMonth,
        recipients: recipients.join(","),
        format,
        includeFilters: includeFilters ? JSON.stringify(includeFilters) : null,
        isActive
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: schedule.id,
        companyId: schedule.companyId,
        frequency: schedule.frequency,
        dayOfMonth: schedule.dayOfMonth,
        recipients: schedule.recipients.split(","),
        format: schedule.format,
        includeFilters: schedule.includeFilters ? JSON.parse(schedule.includeFilters) : null,
        isActive: schedule.isActive,
        nextRun: calculateNextRun(schedule.frequency, schedule.dayOfMonth || undefined)
      }
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: "companyId é obrigatório"
      }, { status: 400 });
    }

    const schedule = await prisma.reportSchedule.findUnique({
      where: { companyId }
    });

    if (!schedule) {
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: schedule.id,
        companyId: schedule.companyId,
        frequency: schedule.frequency,
        dayOfMonth: schedule.dayOfMonth,
        recipients: schedule.recipients.split(","),
        format: schedule.format,
        includeFilters: schedule.includeFilters ? JSON.parse(schedule.includeFilters) : null,
        isActive: schedule.isActive,
        nextRun: calculateNextRun(schedule.frequency, schedule.dayOfMonth || undefined),
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      }
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: "companyId é obrigatório"
      }, { status: 400 });
    }

    await prisma.reportSchedule.delete({
      where: { companyId }
    });

    return NextResponse.json({
      success: true,
      message: "Agendamento removido com sucesso"
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 });
  }
}

function calculateNextRun(frequency: string, dayOfMonth?: number): string {
  const now = new Date();
  
  switch (frequency) {
    case "DAILY":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    
    case "WEEKLY":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    case "MONTHLY": {
      if (!dayOfMonth) return now.toISOString();
      
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
      return nextMonth.toISOString();
    }
    
    default:
      return now.toISOString();
  }
} 