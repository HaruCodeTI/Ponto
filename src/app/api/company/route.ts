import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Company, OperationType, Plan } from "@/types/company";

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as Partial<Company>;
    // Validação básica
    if (!data.name || !data.cnpj || !data.address || !data.operationType || !data.plan) {
      return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
    }
    // Criação da empresa
    const company = await prisma.company.create({
      data: {
        name: data.name,
        cnpj: data.cnpj,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        operationType: data.operationType as OperationType,
        employeeCount: data.employeeCount ?? 0,
        plan: data.plan as Plan,
      },
    });
    return NextResponse.json(company, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao cadastrar empresa" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = (await req.json()) as Partial<Company>;
    if (!data.id) {
      return NextResponse.json({ error: "ID da empresa é obrigatório" }, { status: 400 });
    }
    // Atualização da empresa
    const company = await prisma.company.update({
      where: { id: data.id },
      data: {
        name: data.name,
        cnpj: data.cnpj,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        operationType: data.operationType as OperationType,
        employeeCount: data.employeeCount,
        plan: data.plan as Plan,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(company, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar empresa" }, { status: 500 });
  }
} 