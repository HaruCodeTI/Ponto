import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: listar pagamentos com filtros
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId") || undefined;
  const companyId = searchParams.get("companyId") || undefined;
  const month = searchParams.get("month") || undefined;
  const status = searchParams.get("status") || undefined;

  const where: Record<string, string> = {};
  if (employeeId) where.employeeId = employeeId;
  if (companyId) where.companyId = companyId;
  if (month) where.month = month;
  if (status) where.status = status;

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      employee: { select: { user: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ success: true, data: payments });
}

// POST: registrar novo pagamento
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, companyId, month, amount, status, paidAt, payrollRef } = body;
    if (!employeeId || !companyId || !month || !amount) {
      return NextResponse.json({ success: false, error: "Campos obrigatórios ausentes" }, { status: 400 });
    }
    const payment = await prisma.payment.create({
      data: {
        employeeId,
        companyId,
        month,
        amount,
        status: status || "PAID",
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        payrollRef: payrollRef || null,
      },
    });
    return NextResponse.json({ success: true, data: payment });
  } catch {
    return NextResponse.json({ success: false, error: "Erro ao registrar pagamento" }, { status: 500 });
  }
} 