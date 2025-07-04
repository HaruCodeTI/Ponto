import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateTimeRecordData, TimeRecordResponse, TimeRecord } from "@/types/time-record";
import { detectDuplicate, getDefaultDuplicateDetectionConfig } from "@/lib/duplicate-detection";
import { 
  createTimeRecordSuccessNotification, 
  createTimeRecordFailedNotification,
  sendNotification 
} from "@/lib/notifications";
import { 
  generateSimpleHash
} from "@/lib/hash-verification";

export async function POST(req: NextRequest): Promise<NextResponse<TimeRecordResponse>> {
  try {
    const data = (await req.json()) as CreateTimeRecordData;

    // Validação básica
    if (!data.type || !data.userId || !data.employeeId || !data.companyId) {
      return NextResponse.json({ success: false, error: "Dados obrigatórios faltando" }, { status: 400 });
    }

    const timestamp = new Date();
    const hash = generateSimpleHash((data as unknown) as Record<string, unknown>, timestamp);

    // Busca registros do mesmo funcionário no dia
    const startOfDay = new Date(timestamp);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(timestamp);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecordsRaw = await prisma.timeRecord.findMany({
      where: {
        employeeId: data.employeeId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { timestamp: "desc" },
    });
    // Ajusta tipos para TimeRecord (timestamp e createdAt como string)
    const existingRecords: TimeRecord[] = existingRecordsRaw.map((rec) => ({
      ...rec,
      timestamp: rec.timestamp instanceof Date ? rec.timestamp.toISOString() : rec.timestamp,
      createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : rec.createdAt,
      latitude: rec.latitude ?? undefined,
      longitude: rec.longitude ?? undefined,
      ipAddress: rec.ipAddress ?? undefined,
      deviceInfo: rec.deviceInfo ?? undefined,
      photoUrl: rec.photoUrl ?? undefined,
      nfcTag: rec.nfcTag ?? undefined,
    }));

    // Monta registro simulado para detecção
    const newRecord: TimeRecord = {
      id: "new",
      type: data.type,
      timestamp: timestamp.toISOString(),
      latitude: data.latitude,
      longitude: data.longitude,
      ipAddress: data.ipAddress,
      deviceInfo: data.deviceInfo,
      photoUrl: data.photoUrl,
      nfcTag: data.nfcTag,
      hash,
      createdAt: timestamp.toISOString(),
      userId: data.userId,
      employeeId: data.employeeId,
      companyId: data.companyId,
    };

    // Detecção de duplicidade
    const duplicateResult = detectDuplicate(
      newRecord,
      existingRecords,
      getDefaultDuplicateDetectionConfig(),
      'HYBRID'
    );

    if (duplicateResult.isDuplicate) {
      // Enviar notificação de falha
      try {
        const notification = createTimeRecordFailedNotification(
          data.userId,
          data.employeeId,
          data.companyId,
          `Registro de ponto duplicado (${duplicateResult.duplicateType})`,
          data
        );
        await sendNotification(notification);
      } catch (error) {
        console.error("Erro ao enviar notificação:", error);
      }

      return NextResponse.json({
        success: false,
        error: `Registro de ponto duplicado (${duplicateResult.duplicateType}). ${duplicateResult.warnings.join(' ')}`,
        validation: {
          location: { isValid: true },
          device: { isValid: true },
          time: { isValid: false, isWithinWorkHours: true, isWithinTolerance: true },
          isDuplicate: true,
          isValid: false,
          errors: duplicateResult.errors.length > 0 ? duplicateResult.errors : [
            `Duplicidade detectada: ${duplicateResult.duplicateType}`
          ],
        },
      }, { status: 409 });
    }

    // Criação do registro de ponto
    const timeRecord = await prisma.timeRecord.create({
      data: {
        type: data.type,
        timestamp,
        latitude: data.latitude,
        longitude: data.longitude,
        ipAddress: data.ipAddress,
        deviceInfo: data.deviceInfo,
        photoUrl: data.photoUrl,
        nfcTag: data.nfcTag,
        hash,
        userId: data.userId,
        employeeId: data.employeeId,
        companyId: data.companyId,
      },
    });

    // Converter campos Date para string ISO para compatibilidade com TimeRecordResponse
    const formattedTimeRecord = {
      ...timeRecord,
      timestamp: timeRecord.timestamp.toISOString(),
      createdAt: timeRecord.createdAt.toISOString(),
      latitude: timeRecord.latitude ?? undefined,
      longitude: timeRecord.longitude ?? undefined,
      ipAddress: timeRecord.ipAddress ?? undefined,
      deviceInfo: timeRecord.deviceInfo ?? undefined,
      photoUrl: timeRecord.photoUrl ?? undefined,
      nfcTag: timeRecord.nfcTag ?? undefined,
    };

    // Enviar notificação de sucesso
    try {
      const notification = createTimeRecordSuccessNotification(
        formattedTimeRecord,
        "Funcionário", // Em produção, seria buscado do banco
        "Empresa" // Em produção, seria buscado do banco
      );
      await sendNotification(notification);
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
    }

    return NextResponse.json({ success: true, data: formattedTimeRecord }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Erro ao registrar ponto" }, { status: 500 });
  }
} 