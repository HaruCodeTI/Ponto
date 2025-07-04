import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Employee, WorkSchedule } from "@/types/employee";

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as Partial<Employee>;
    // Validação básica
    if (!data.cpf || !data.position || !data.salary || !data.workSchedule || !data.userId || !data.companyId) {
      return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
    }
    // Criação do funcionário
    const employee = await prisma.employee.create({
      data: {
        cpf: data.cpf,
        position: data.position,
        salary: data.salary,
        workSchedule: data.workSchedule as WorkSchedule,
        toleranceMinutes: data.toleranceMinutes ?? 15,
        bankHours: data.bankHours ?? 0,
        userId: data.userId,
        companyId: data.companyId,
      },
    });
    return NextResponse.json(employee, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao cadastrar funcionário" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = (await req.json()) as Partial<Employee>;
    if (!data.id) {
      return NextResponse.json({ error: "ID do funcionário é obrigatório" }, { status: 400 });
    }
    // Atualização do funcionário
    const employee = await prisma.employee.update({
      where: { id: data.id },
      data: {
        cpf: data.cpf,
        position: data.position,
        salary: data.salary,
        workSchedule: data.workSchedule as WorkSchedule,
        toleranceMinutes: data.toleranceMinutes,
        bankHours: data.bankHours,
        userId: data.userId,
        companyId: data.companyId,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(employee, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar funcionário" }, { status: 500 });
  }
} 