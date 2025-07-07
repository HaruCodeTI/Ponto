import { NextRequest, NextResponse } from 'next/server';
import { processBiometricScan } from '@/lib/biometric';

export async function POST(request: NextRequest) {
  try {
    const { employeeId, type } = await request.json();

    if (!employeeId || !type) {
      return NextResponse.json({ error: 'ID do funcionário e tipo são obrigatórios.' }, { status: 400 });
    }

    const result = await processBiometricScan(employeeId, type);

    if (result.success) {
      return NextResponse.json({
        success: true,
        employeeId: result.employeeId,
        type: result.type,
        message: 'Biometria validada com sucesso',
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro ao processar scan biométrico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
} 