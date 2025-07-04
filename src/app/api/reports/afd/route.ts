import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, employeeId, startDate, endDate } = body;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "Data de início e fim são obrigatórias" },
        { status: 400 }
      );
    }

    // Verificar se a empresa existe
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Buscar funcionários
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        ...(employeeId && { id: employeeId }),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhum funcionário encontrado" },
        { status: 404 }
      );
    }

    // Buscar registros de ponto no período
    const timeRecords = await prisma.timeRecord.findMany({
      where: {
        companyId,
        ...(employeeId && { employeeId }),
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Gerar arquivo AFD
    const afdContent = generateAFDContent(company, employees, timeRecords, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: {
        content: afdContent,
        filename: `AFD_${company.cnpj}_${startDate}_${endDate}.afd`,
        recordCount: timeRecords.length,
        employeeCount: employees.length,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar arquivo AFD:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function generateAFDContent(company: any, employees: any[], records: any[], startDate: string, endDate: string) {
  const lines: string[] = [];
  
  // 1. Cabeçalho do Arquivo (Tipo 1)
  const headerLine = generateHeaderLine(company, startDate, endDate);
  lines.push(headerLine);

  // 2. Cabeçalho do Relatório (Tipo 2)
  const reportHeaderLine = generateReportHeaderLine(company, startDate, endDate);
  lines.push(reportHeaderLine);

  // 3. Registros de Ponto (Tipo 3)
  records.forEach((record) => {
    const recordLine = generateRecordLine(record);
    lines.push(recordLine);
  });

  // 4. Totalizadores (Tipo 4)
  const totalizerLine = generateTotalizerLine(records.length);
  lines.push(totalizerLine);

  // 5. Trailer do Arquivo (Tipo 5)
  const trailerLine = generateTrailerLine(lines.length);
  lines.push(trailerLine);

  return lines.join("\r\n");
}

function generateHeaderLine(company: any, startDate: string, endDate: string): string {
  const now = new Date();
  const formattedDate = now.toISOString().slice(0, 10).replace(/-/g, "");
  const formattedTime = now.toTimeString().slice(0, 8).replace(/:/g, "");
  
  // Formato: 1 + CNPJ + CEI + Razão Social + Data Inicial + Data Final + Data/Hora Geração + Tipo de Registro
  return `1${company.cnpj.padEnd(14)}${"".padEnd(12)}${company.name.substring(0, 150).padEnd(150)}${startDate.replace(/-/g, "")}${endDate.replace(/-/g, "")}${formattedDate}${formattedTime}AFD`;
}

function generateReportHeaderLine(company: any, startDate: string, endDate: string): string {
  const now = new Date();
  const formattedDate = now.toISOString().slice(0, 10).replace(/-/g, "");
  const formattedTime = now.toTimeString().slice(0, 8).replace(/:/g, "");
  
  // Formato: 2 + CNPJ + CEI + Razão Social + Data Inicial + Data Final + Data/Hora Geração + Tipo de Registro
  return `2${company.cnpj.padEnd(14)}${"".padEnd(12)}${company.name.substring(0, 150).padEnd(150)}${startDate.replace(/-/g, "")}${endDate.replace(/-/g, "")}${formattedDate}${formattedTime}AFD`;
}

function generateRecordLine(record: any): string {
  const date = new Date(record.createdAt);
  const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, "");
  const formattedTime = date.toTimeString().slice(0, 8).replace(/:/g, "");
  
  // Mapear tipo de registro
  let recordType = "1"; // Entrada
  if (record.type === "EXIT") recordType = "2"; // Saída
  else if (record.type === "BREAK_START") recordType = "3"; // Início de intervalo
  else if (record.type === "BREAK_END") recordType = "4"; // Fim de intervalo
  
  // Formato: 3 + Data + Hora + PIS + Tipo de Registro + Número Sequencial
  return `3${formattedDate}${formattedTime}${record.employeeId.padEnd(12)}${recordType}${record.id.substring(0, 9).padStart(9, "0")}`;
}

function generateTotalizerLine(recordCount: number): string {
  const now = new Date();
  const formattedDate = now.toISOString().slice(0, 10).replace(/-/g, "");
  const formattedTime = now.toTimeString().slice(0, 8).replace(/:/g, "");
  
  // Formato: 4 + Data + Hora + Total de Registros + Tipo de Registro
  return `4${formattedDate}${formattedTime}${recordCount.toString().padStart(9, "0")}AFD`;
}

function generateTrailerLine(totalLines: number): string {
  const now = new Date();
  const formattedDate = now.toISOString().slice(0, 10).replace(/-/g, "");
  const formattedTime = now.toTimeString().slice(0, 8).replace(/:/g, "");
  
  // Formato: 5 + Data + Hora + Total de Linhas + Tipo de Registro
  return `5${formattedDate}${formattedTime}${totalLines.toString().padStart(9, "0")}AFD`;
} 