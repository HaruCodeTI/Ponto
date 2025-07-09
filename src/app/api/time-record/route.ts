import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from "@/lib/prisma";
import { TimeRecord } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      employeeId, 
      type, 
      latitude, 
      longitude, 
      ipAddress, 
      deviceInfo,
      hash 
    } = body;

    if (!employeeId || !type || !hash) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Verificar se o funcionário existe e pertence à empresa
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: session.user.companyId
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      );
    }

    const timeRecord = await prisma.timeRecord.create({
      data: {
        employeeId,
        type: type as any,
        timestamp: new Date(),
        latitude: latitude || null,
        longitude: longitude || null,
        ipAddress: ipAddress || null,
        deviceInfo: deviceInfo || null,
        hash,
        userId: session.user.id,
        companyId: session.user.companyId!,
        integrityHash: hash, // Hash de integridade básico
        integrityTimestamp: new Date()
      }
    });

    return NextResponse.json(timeRecord, { status: 201 });
  } catch (error) {
    console.error('Erro ao registrar ponto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { companyId: session.user.companyId };
    
    if (employeeId) where.employeeId = employeeId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [records, total] = await Promise.all([
      prisma.timeRecord.findMany({
        where,
        include: {
          employee: {
            select: { id: true, registration: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.timeRecord.count({ where })
    ]);

    return NextResponse.json({
      records,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Erro ao buscar registros de ponto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 