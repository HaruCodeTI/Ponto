import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Verificar conexão com banco de dados
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          api: 'running'
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          api: 'running'
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 