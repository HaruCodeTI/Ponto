import { NextRequest, NextResponse } from 'next/server';
import { processNFCScan } from '@/lib/nfc';

export async function POST(request: NextRequest) {
  try {
    const { cardNumber } = await request.json();

    if (!cardNumber) {
      return NextResponse.json({ error: 'Número do cartão é obrigatório.' }, { status: 400 });
    }

    const result = await processNFCScan(cardNumber);

    if (result.success) {
      return NextResponse.json({
        success: true,
        cardNumber: result.cardNumber,
        employeeId: result.employeeId,
        message: 'Cartão NFC válido',
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro ao processar scan NFC:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
} 