import { NextRequest, NextResponse } from "next/server";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  sendNotification,
  Notification,
  NotificationType
} from "@/lib/notifications";

/**
 * GET - Buscar notificações do usuário
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID do usuário é obrigatório" 
      }, { status: 400 });
    }

    const result = await getUserNotifications(userId, limit, offset);
    
    // Filtra apenas não lidas se solicitado
    const notifications = unreadOnly 
      ? result.notifications.filter(n => !n.read)
      : result.notifications;

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        total: unreadOnly ? notifications.length : result.total,
        unreadCount: result.notifications.filter(n => !n.read).length,
      }
    });

  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
}

/**
 * POST - Enviar notificação genérica
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { 
      type, 
      recipientId, 
      companyId, 
      employeeId, 
      title, 
      message, 
      metadata,
      actionUrl,
      actionText 
    } = body;

    // Validação básica
    if (!type || !recipientId || !companyId || !title || !message) {
      return NextResponse.json({ 
        success: false, 
        error: "Dados obrigatórios faltando" 
      }, { status: 400 });
    }

    // Cria notificação
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: type as NotificationType,
      priority: 'MEDIUM',
      title,
      message,
      recipientId,
      recipientType: 'EMPLOYEE', // Em produção, seria determinado pelo contexto
      companyId,
      employeeId,
      metadata,
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl,
      actionText,
    };

    // Envia notificação
    await sendNotification(notification);

    return NextResponse.json({ 
      success: true, 
      data: notification 
    }, { status: 201 });

  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
}

/**
 * PUT - Marcar notificação como lida
 */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID da notificação é obrigatório" 
      }, { status: 400 });
    }

    await markNotificationAsRead(notificationId);

    return NextResponse.json({ 
      success: true, 
      message: "Notificação marcada como lida" 
    });

  } catch (error) {
    console.error("Erro ao marcar notificação:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
} 