import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      companyId, 
      reportType, 
      defaultFormat, 
      enabledFormats,
      customSettings 
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

    if (!defaultFormat) {
      return NextResponse.json(
        { success: false, error: "Formato padrão é obrigatório" },
        { status: 400 }
      );
    }

    if (!enabledFormats || enabledFormats.length === 0) {
      return NextResponse.json(
        { success: false, error: "Pelo menos um formato deve estar habilitado" },
        { status: 400 }
      );
    }

    // Verificar se já existe configuração para esta empresa e tipo de relatório
    const existingConfig = await prisma.reportFormatConfig.findFirst({
      where: { 
        companyId,
        reportType 
      },
    });

    let result;
    if (existingConfig) {
      // Atualizar configuração existente
      result = await prisma.reportFormatConfig.update({
        where: { id: existingConfig.id },
        data: {
          defaultFormat,
          enabledFormats: enabledFormats.join(","),
          customSettings: customSettings ? JSON.stringify(customSettings) : null,
        },
      });
    } else {
      // Criar nova configuração
      result = await prisma.reportFormatConfig.create({
        data: {
          companyId,
          reportType,
          defaultFormat,
          enabledFormats: enabledFormats.join(","),
          customSettings: customSettings ? JSON.stringify(customSettings) : null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        companyId: result.companyId,
        reportType: result.reportType,
        defaultFormat: result.defaultFormat,
        enabledFormats: result.enabledFormats.split(","),
        customSettings: result.customSettings ? JSON.parse(result.customSettings) : null,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    });
  } catch (error) {
    console.error("Erro ao configurar formato:", error);
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

    const configs = await prisma.reportFormatConfig.findMany({
      where: whereClause,
    });

    const formattedConfigs = configs.map(config => ({
      id: config.id,
      companyId: config.companyId,
      reportType: config.reportType,
      defaultFormat: config.defaultFormat,
      enabledFormats: config.enabledFormats.split(","),
      customSettings: config.customSettings ? JSON.parse(config.customSettings) : null,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: reportType ? formattedConfigs[0] || null : formattedConfigs,
    });
  } catch (error) {
    console.error("Erro ao buscar configuração de formato:", error);
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

    await prisma.reportFormatConfig.deleteMany({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      message: "Configuração de formato removida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover configuração de formato:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 