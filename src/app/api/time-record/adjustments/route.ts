import { NextRequest, NextResponse } from "next/server";
import { 
  createTimeRecordAdjustment, 
  getTimeRecordAdjustments, 
  getAdjustmentConfig 
} from "@/lib/time-record-adjustments";
import { CreateAdjustmentData, AdjustmentFilters } from "@/types/time-record";

/**
 * POST - Solicitar ajuste de registro
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const data = (await req.json()) as CreateAdjustmentData;

    // Validação básica
    if (!data.originalRecordId || !data.adjustedTimestamp || !data.reason || !data.requestedBy || !data.companyId) {
      return NextResponse.json(
        { success: false, error: "Dados obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Obter configuração da empresa
    const config = await getAdjustmentConfig(data.companyId);

    // Criar ajuste
    const result = await createTimeRecordAdjustment(data, config);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.adjustment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar ajuste:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * GET - Listar ajustes
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    
    const filters: AdjustmentFilters = {
      companyId: searchParams.get('companyId') || undefined,
      employeeId: searchParams.get('employeeId') || undefined,
      originalRecordId: searchParams.get('originalRecordId') || undefined,
      approvalStatus: searchParams.get('approvalStatus') as any || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      requestedBy: searchParams.get('requestedBy') || undefined,
      approvedBy: searchParams.get('approvedBy') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Validação básica
    if (!filters.companyId) {
      return NextResponse.json(
        { success: false, error: "ID da empresa é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar ajustes
    const result = await getTimeRecordAdjustments(filters);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Erro ao buscar ajustes:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 