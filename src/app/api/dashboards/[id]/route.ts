import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const dashboard = await prisma.executiveDashboard.findUnique({
      where: { id: context.params.id },
      include: {
        widgets: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard não encontrado' }, { status: 404 });
    }

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      isDefault, 
      isPublic, 
      layout, 
      filters, 
      refreshInterval 
    } = body;

    const dashboard = await prisma.executiveDashboard.update({
      where: { id: context.params.id },
      data: {
        name,
        description,
        isDefault,
        isPublic,
        layout,
        filters,
        refreshInterval
      }
    });

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await prisma.executiveDashboard.delete({
      where: { id: context.params.id }
    });

    return NextResponse.json({ message: 'Dashboard excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
} 