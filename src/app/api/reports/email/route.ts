import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      companyId, 
      reportType, 
      recipients, 
      frequency, 
      format, 
      filters,
      isActive = true 
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

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "Pelo menos um destinatário é obrigatório" },
        { status: 400 }
      );
    }

    if (!frequency) {
      return NextResponse.json(
        { success: false, error: "Frequência é obrigatória" },
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

    // Verificar se já existe configuração para esta empresa
    const existingConfig = await prisma.reportSchedule.findUnique({
      where: { companyId },
    });

    let result;
    if (existingConfig) {
      // Atualizar configuração existente
      result = await prisma.reportSchedule.update({
        where: { companyId },
        data: {
          frequency,
          recipients: recipients.join(","),
          format,
          includeFilters: filters ? JSON.stringify(filters) : null,
          isActive,
        },
      });
    } else {
      // Criar nova configuração
      result = await prisma.reportSchedule.create({
        data: {
          companyId,
          frequency,
          recipients: recipients.join(","),
          format,
          includeFilters: filters ? JSON.stringify(filters) : null,
          isActive,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        companyId: result.companyId,
        frequency: result.frequency,
        recipients: result.recipients.split(","),
        format: result.format,
        filters: result.includeFilters ? JSON.parse(result.includeFilters) : null,
        isActive: result.isActive,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    });
  } catch (error) {
    console.error("Erro ao configurar envio automático:", error);
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

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    const config = await prisma.reportSchedule.findUnique({
      where: { companyId },
    });

    if (!config) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        companyId: config.companyId,
        frequency: config.frequency,
        recipients: config.recipients.split(","),
        format: config.format,
        filters: config.includeFilters ? JSON.parse(config.includeFilters) : null,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar configuração de email:", error);
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

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    await prisma.reportSchedule.delete({
      where: { companyId },
    });

    return NextResponse.json({
      success: true,
      message: "Configuração de envio automático removida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover configuração de email:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 