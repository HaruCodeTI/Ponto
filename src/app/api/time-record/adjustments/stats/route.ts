import { NextRequest, NextResponse } from "next/server";
import { getAdjustmentStats } from "@/lib/time-record-adjustments";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const companyId = searchParams.get('companyId');
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Validação básica
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    // Gerar estatísticas
    const stats = await getAdjustmentStats(companyId, startDate, endDate);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Erro ao gerar estatísticas:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 