import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  verifyRecordIntegrity,
  generateAdvancedHash,
  validateVerificationQRCode,
  VerificationCode
} from "@/lib/hash-verification";
import { TimeRecord } from "@/types/time-record";

/**
 * POST - Verificar integridade de um registro
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { recordId, verificationCode } = body;

    if (!recordId || !verificationCode) {
      return NextResponse.json({ 
        success: false, 
        error: "ID do registro e código de verificação são obrigatórios" 
      }, { status: 400 });
    }

    // Busca registro no banco
    const recordRaw = await prisma.timeRecord.findUnique({
      where: { id: recordId }
    });

    if (!recordRaw) {
      return NextResponse.json({ 
        success: false, 
        error: "Registro não encontrado" 
      }, { status: 404 });
    }

    // Converte para TimeRecord
    const timeRecord: TimeRecord = {
      ...recordRaw,
      timestamp: recordRaw.timestamp.toISOString(),
      createdAt: recordRaw.createdAt.toISOString(),
      latitude: recordRaw.latitude ?? undefined,
      longitude: recordRaw.longitude ?? undefined,
      ipAddress: recordRaw.ipAddress ?? undefined,
      deviceInfo: recordRaw.deviceInfo ?? undefined,
      photoUrl: recordRaw.photoUrl ?? undefined,
      nfcTag: recordRaw.nfcTag ?? undefined,
    };

    // Verifica integridade
    const result = verifyRecordIntegrity(timeRecord, verificationCode as VerificationCode);

    return NextResponse.json({
      success: true,
      data: {
        recordId,
        verification: result,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("Erro ao verificar registro:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
}

/**
 * GET - Gerar código de verificação para um registro
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get('recordId');

    if (!recordId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID do registro é obrigatório" 
      }, { status: 400 });
    }

    // Busca registro no banco
    const recordRaw = await prisma.timeRecord.findUnique({
      where: { id: recordId }
    });

    if (!recordRaw) {
      return NextResponse.json({ 
        success: false, 
        error: "Registro não encontrado" 
      }, { status: 404 });
    }

    // Converte para TimeRecord
    const timeRecord: TimeRecord = {
      ...recordRaw,
      timestamp: recordRaw.timestamp.toISOString(),
      createdAt: recordRaw.createdAt.toISOString(),
      latitude: recordRaw.latitude ?? undefined,
      longitude: recordRaw.longitude ?? undefined,
      ipAddress: recordRaw.ipAddress ?? undefined,
      deviceInfo: recordRaw.deviceInfo ?? undefined,
      photoUrl: recordRaw.photoUrl ?? undefined,
      nfcTag: recordRaw.nfcTag ?? undefined,
    };

    // Gera código de verificação avançado
    const verificationCode = generateAdvancedHash(timeRecord);

    return NextResponse.json({
      success: true,
      data: {
        recordId,
        verificationCode,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("Erro ao gerar código de verificação:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
}

/**
 * PUT - Validar QR Code de verificação
 */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { qrData } = body;

    if (!qrData) {
      return NextResponse.json({ 
        success: false, 
        error: "Dados do QR Code são obrigatórios" 
      }, { status: 400 });
    }

    // Valida QR Code
    const validation = validateVerificationQRCode(qrData);

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error || "QR Code inválido",
        data: { isValid: false }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        isValid: true,
        qrData: validation.data,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("Erro ao validar QR Code:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
} 