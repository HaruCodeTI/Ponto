import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      companyId, 
      reportType, 
      scheduleType, // "simple" | "advanced"
      frequency, // "daily" | "weekly" | "monthly" | "custom"
      time, // "HH:MM"
      daysOfWeek, // [0-6] para weekly
      dayOfMonth, // 1-31 para monthly
      months, // [0-11] para custom
      recipients,
      format,
      isActive = true,
      customCronExpression,
      description
    } = body;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    if (!reportType) {
      return NextResponse.json(
        { success: false, error: "Tipo de relatório é obrigatório" },
        { status: 400 }
      );
    }

    if (!scheduleType) {
      return NextResponse.json(
        { success: false, error: "Tipo de agendamento é obrigatório" },
        { status: 400 }
      );
    }

    if (!time) {
      return NextResponse.json(
        { success: false, error: "Horário é obrigatório" },
        { status: 400 }
      );
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "Pelo menos um destinatário é obrigatório" },
        { status: 400 }
      );
    }

    // Validar emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { success: false, error: `Emails inválidos: ${invalidEmails.join(", ")}` },
        { status: 400 }
      );
    }

    // Validar horário
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        { success: false, error: "Formato de horário inválido (use HH:MM)" },
        { status: 400 }
      );
    }

    // Verificar se já existe agendamento para esta empresa e tipo de relatório
    const existingSchedule = await prisma.advancedReportSchedule.findFirst({
      where: { 
        companyId,
        reportType 
      },
    });

    let result;
    if (existingSchedule) {
      // Atualizar agendamento existente
      result = await prisma.advancedReportSchedule.update({
        where: { id: existingSchedule.id },
        data: {
          scheduleType,
          frequency,
          time,
          daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : null,
          dayOfMonth,
          months: months ? JSON.stringify(months) : null,
          recipients: recipients.join(","),
          format,
          isActive,
          customCronExpression,
          description,
        },
      });
    } else {
      // Criar novo agendamento
      result = await prisma.advancedReportSchedule.create({
        data: {
          companyId,
          reportType,
          scheduleType,
          frequency,
          time,
          daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : null,
          dayOfMonth,
          months: months ? JSON.stringify(months) : null,
          recipients: recipients.join(","),
          format,
          isActive,
          customCronExpression,
          description,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        companyId: result.companyId,
        reportType: result.reportType,
        scheduleType: result.scheduleType,
        frequency: result.frequency,
        time: result.time,
        daysOfWeek: result.daysOfWeek ? JSON.parse(result.daysOfWeek) : null,
        dayOfMonth: result.dayOfMonth,
        months: result.months ? JSON.parse(result.months) : null,
        recipients: result.recipients.split(","),
        format: result.format,
        isActive: result.isActive,
        customCronExpression: result.customCronExpression,
        description: result.description,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    });
  } catch (error) {
    console.error("Erro ao configurar agendamento avançado:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const reportType = searchParams.get("reportType");

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    let whereClause: any = { companyId };
    if (reportType) {
      whereClause.reportType = reportType;
    }

    const schedules = await prisma.advancedReportSchedule.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      companyId: schedule.companyId,
      reportType: schedule.reportType,
      scheduleType: schedule.scheduleType,
      frequency: schedule.frequency,
      time: schedule.time,
      daysOfWeek: schedule.daysOfWeek ? JSON.parse(schedule.daysOfWeek) : null,
      dayOfMonth: schedule.dayOfMonth,
      months: schedule.months ? JSON.parse(schedule.months) : null,
      recipients: schedule.recipients.split(","),
      format: schedule.format,
      isActive: schedule.isActive,
      customCronExpression: schedule.customCronExpression,
      description: schedule.description,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: reportType ? formattedSchedules[0] || null : formattedSchedules,
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos avançados:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const reportType = searchParams.get("reportType");

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    let whereClause: any = { companyId };
    if (reportType) {
      whereClause.reportType = reportType;
    }

    await prisma.advancedReportSchedule.deleteMany({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      message: "Agendamento avançado removido com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover agendamento avançado:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 