import { prisma } from './prisma';
import { 
  Notification, 
  NotificationPreference, 
  NotificationStats, 
  NotificationMetadata,
  NotificationCategories,
  QuietHours
} from '@/types';

export async function createNotification(
  data: {
    companyId: string;
    userId?: string;
    employeeId?: string;
    type: Notification['type'];
    title: string;
    message: string;
    priority: Notification['priority'];
    category: string;
    metadata?: NotificationMetadata;
    expiresAt?: Date;
  }
): Promise<Notification> {
  // Verificar preferências do usuário
  const preferences = await getNotificationPreferences(
    data.companyId,
    data.userId,
    data.employeeId
  );

  // Verificar se notificação está habilitada
  if (!preferences.inAppEnabled) {
    throw new Error('Notificações in-app desabilitadas');
  }

  // Verificar horário silencioso
  if (isInQuietHours(preferences.quietHours)) {
    // Salvar para envio posterior
    return await prisma.notification.create({
      data: {
        ...data,
        metadata: data.metadata || {},
        expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      }
    });
  }

  // Verificar categoria habilitada
  if (!isCategoryEnabled(preferences.categories, data.category)) {
    throw new Error(`Categoria ${data.category} desabilitada`);
  }

  // Criar notificação
  const notification = await prisma.notification.create({
    data: {
      ...data,
      metadata: data.metadata || {},
      expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    }
  });

  // TODO: Enviar via WebSocket para tempo real
  // TODO: Enviar email se habilitado
  // TODO: Enviar push se habilitado
  // TODO: Enviar SMS se habilitado

  return notification;
}

export async function findNotifications(
  filters: {
    companyId?: string;
    userId?: string;
    employeeId?: string;
    type?: string;
    priority?: string;
    category?: string;
    isRead?: boolean;
    isArchived?: boolean;
  },
  page = 1,
  limit = 50
): Promise<{ data: Notification[]; total: number; page: number; totalPages: number }> {
  const whereClause: any = {};
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.userId) whereClause.userId = filters.userId;
  if (filters.employeeId) whereClause.employeeId = filters.employeeId;
  if (filters.type) whereClause.type = filters.type;
  if (filters.priority) whereClause.priority = filters.priority;
  if (filters.category) whereClause.category = filters.category;
  if (filters.isRead !== undefined) whereClause.isRead = filters.isRead;
  if (filters.isArchived !== undefined) whereClause.isArchived = filters.isArchived;

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.notification.count({ where: whereClause })
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function markNotificationAsRead(
  notificationId: string,
  userId?: string
): Promise<Notification> {
  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  return notification;
}

export async function markAllNotificationsAsRead(
  filters: {
    companyId?: string;
    userId?: string;
    employeeId?: string;
    category?: string;
  }
): Promise<{ count: number }> {
  const whereClause: any = { isRead: false };
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.userId) whereClause.userId = filters.userId;
  if (filters.employeeId) whereClause.employeeId = filters.employeeId;
  if (filters.category) whereClause.category = filters.category;

  const result = await prisma.notification.updateMany({
    where: whereClause,
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  return { count: result.count };
}

export async function archiveNotification(
  notificationId: string
): Promise<Notification> {
  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: { isArchived: true }
  });

  return notification;
}

export async function deleteNotification(
  notificationId: string
): Promise<void> {
  await prisma.notification.delete({
    where: { id: notificationId }
  });
}

export async function getNotificationStats(
  filters: {
    companyId?: string;
    userId?: string;
    employeeId?: string;
  }
): Promise<NotificationStats> {
  const whereClause: any = {};
  
  if (filters.companyId) whereClause.companyId = filters.companyId;
  if (filters.userId) whereClause.userId = filters.userId;
  if (filters.employeeId) whereClause.employeeId = filters.employeeId;

  const [
    total,
    unread,
    archived,
    byType,
    byPriority,
    byCategory
  ] = await Promise.all([
    prisma.notification.count({ where: whereClause }),
    prisma.notification.count({ where: { ...whereClause, isRead: false } }),
    prisma.notification.count({ where: { ...whereClause, isArchived: true } }),
    prisma.notification.groupBy({
      by: ['type'],
      where: whereClause,
      _count: { type: true }
    }),
    prisma.notification.groupBy({
      by: ['priority'],
      where: whereClause,
      _count: { priority: true }
    }),
    prisma.notification.groupBy({
      by: ['category'],
      where: whereClause,
      _count: { category: true }
    })
  ]);

  return {
    total,
    unread,
    archived,
    byType: byType.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>),
    byPriority: byPriority.reduce((acc, item) => {
      acc[item.priority] = item._count.priority;
      return acc;
    }, {} as Record<string, number>),
    byCategory: byCategory.reduce((acc, item) => {
      acc[item.category] = item._count.category;
      return acc;
    }, {} as Record<string, number>)
  };
}

export async function getNotificationPreferences(
  companyId: string,
  userId?: string,
  employeeId?: string
): Promise<NotificationPreference> {
  let preferences = await prisma.notificationPreference.findUnique({
    where: {
      companyId_userId_employeeId: {
        companyId,
        userId: userId || null,
        employeeId: employeeId || null
      }
    }
  });

  if (!preferences) {
    // Criar preferências padrão
    preferences = await prisma.notificationPreference.create({
      data: {
        companyId,
        userId: userId || null,
        employeeId: employeeId || null,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        categories: {
          ponto: true,
          relatorios: true,
          sistema: true,
          compliance: true,
          aprovacoes: true,
          alertas: true,
          lembretes: true
        },
        frequency: 'IMMEDIATE'
      }
    });
  }

  return preferences;
}

export async function updateNotificationPreferences(
  companyId: string,
  data: Partial<NotificationPreference>,
  userId?: string,
  employeeId?: string
): Promise<NotificationPreference> {
  const preferences = await prisma.notificationPreference.upsert({
    where: {
      companyId_userId_employeeId: {
        companyId,
        userId: userId || null,
        employeeId: employeeId || null
      }
    },
    update: data,
    create: {
      companyId,
      userId: userId || null,
      employeeId: employeeId || null,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      categories: {
        ponto: true,
        relatorios: true,
        sistema: true,
        compliance: true,
        aprovacoes: true,
        alertas: true,
        lembretes: true
      },
      frequency: 'IMMEDIATE',
      ...data
    }
  });

  return preferences;
}

export async function cleanupExpiredNotifications(): Promise<{ count: number }> {
  const result = await prisma.notification.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });

  return { count: result.count };
}

function isInQuietHours(quietHours?: QuietHours): boolean {
  if (!quietHours || !quietHours.enabled) {
    return false;
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().substring(0, 5);

  // Verificar se é um dia habilitado
  if (!quietHours.days.includes(currentDay)) {
    return false;
  }

  // Verificar se está no horário silencioso
  return currentTime >= quietHours.startTime && currentTime <= quietHours.endTime;
}

function isCategoryEnabled(
  categories: NotificationCategories,
  category: string
): boolean {
  const categoryMap: Record<string, keyof NotificationCategories> = {
    'ponto': 'ponto',
    'relatorios': 'relatorios',
    'sistema': 'sistema',
    'compliance': 'compliance',
    'aprovacoes': 'aprovacoes',
    'alertas': 'alertas',
    'lembretes': 'lembretes'
  };

  const categoryKey = categoryMap[category];
  return categoryKey ? categories[categoryKey] : true;
}

// Funções para templates de notificação
export const NOTIFICATION_TEMPLATES = {
  PONTO_REGISTRADO: {
    title: 'Ponto Registrado',
    message: 'Seu ponto foi registrado com sucesso às {time}',
    type: 'SUCCESS' as const,
    priority: 'NORMAL' as const,
    category: 'ponto'
  },
  PONTO_ATRASO: {
    title: 'Atraso Detectado',
    message: 'Você chegou {minutes} minutos atrasado hoje',
    type: 'WARNING' as const,
    priority: 'HIGH' as const,
    category: 'ponto'
  },
  RELATORIO_PRONTO: {
    title: 'Relatório Pronto',
    message: 'O relatório {tipo} está pronto para download',
    type: 'INFO' as const,
    priority: 'NORMAL' as const,
    category: 'relatorios'
  },
  APROVACAO_PENDENTE: {
    title: 'Aprovação Pendente',
    message: 'Você tem {count} itens aguardando aprovação',
    type: 'ALERT' as const,
    priority: 'HIGH' as const,
    category: 'aprovacoes'
  },
  SISTEMA_ERRO: {
    title: 'Erro do Sistema',
    message: 'Ocorreu um erro no sistema: {error}',
    type: 'ERROR' as const,
    priority: 'URGENT' as const,
    category: 'sistema'
  }
};

export function createNotificationFromTemplate(
  template: keyof typeof NOTIFICATION_TEMPLATES,
  variables: Record<string, any>,
  companyId: string,
  userId?: string,
  employeeId?: string
): Promise<Notification> {
  const templateData = NOTIFICATION_TEMPLATES[template];
  
  let title = templateData.title;
  let message = templateData.message;

  // Substituir variáveis
  Object.entries(variables).forEach(([key, value]) => {
    title = title.replace(`{${key}}`, String(value));
    message = message.replace(`{${key}}`, String(value));
  });

  return createNotification({
    companyId,
    userId,
    employeeId,
    type: templateData.type,
    title,
    message,
    priority: templateData.priority,
    category: templateData.category
  });
} 