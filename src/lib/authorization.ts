import { UserRole } from '@prisma/client';
import { prisma } from './prisma';
import { RolePermissions, AccessControl, AuditLog, SessionInfo, RESOURCES, ACTIONS } from '@/types/authorization';

// Matriz de permissões por role
const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: UserRole.ADMIN,
    permissions: [
      // Acesso total ao sistema
      { resource: RESOURCES.SYSTEM, action: ACTIONS.READ, roles: [UserRole.ADMIN] },
      { resource: RESOURCES.SYSTEM_USERS, action: ACTIONS.READ, roles: [UserRole.ADMIN] },
      { resource: RESOURCES.SYSTEM_LOGS, action: ACTIONS.READ, roles: [UserRole.ADMIN] },
      { resource: RESOURCES.SYSTEM_BACKUP, action: ACTIONS.READ, roles: [UserRole.ADMIN] },
      
      // Funcionários - acesso total
      { resource: RESOURCES.EMPLOYEE, action: ACTIONS.CREATE, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.EMPLOYEE, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.EMPLOYEE, action: ACTIONS.UPDATE, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.EMPLOYEE, action: ACTIONS.DELETE, roles: [UserRole.ADMIN] },
      { resource: RESOURCES.EMPLOYEE_LIST, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      
      // Registro de Ponto - acesso total
      { resource: RESOURCES.TIME_RECORD, action: ACTIONS.CREATE, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.TIME_RECORD, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.TIME_RECORD, action: ACTIONS.UPDATE, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.TIME_RECORD, action: ACTIONS.DELETE, roles: [UserRole.ADMIN] },
      { resource: RESOURCES.TIME_RECORD_ADJUST, action: ACTIONS.UPDATE, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      
      // Relatórios - acesso total
      { resource: RESOURCES.REPORT, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.REPORT_GENERATE, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.REPORT_EXPORT, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.REPORT_SCHEDULE, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      
      // Configurações - acesso total
      { resource: RESOURCES.SETTINGS, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.SETTINGS, action: ACTIONS.UPDATE, roles: [UserRole.ADMIN] },
      
      // Autenticação - acesso total
      { resource: RESOURCES.AUTH, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.AUTH_2FA, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.AUTH_NFC, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.AUTH_BIOMETRIC, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
    ],
  },
  {
    role: UserRole.MANAGER,
    permissions: [
      // Funcionários - gerenciamento limitado
      { resource: RESOURCES.EMPLOYEE, action: ACTIONS.CREATE, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.EMPLOYEE, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.EMPLOYEE, action: ACTIONS.UPDATE, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.EMPLOYEE_LIST, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      
      // Registro de Ponto - gerenciamento limitado
      { resource: RESOURCES.TIME_RECORD, action: ACTIONS.CREATE, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.TIME_RECORD, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.TIME_RECORD, action: ACTIONS.UPDATE, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.TIME_RECORD_ADJUST, action: ACTIONS.UPDATE, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      
      // Relatórios - acesso limitado
      { resource: RESOURCES.REPORT, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.REPORT_GENERATE, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.REPORT_EXPORT, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      { resource: RESOURCES.REPORT_SCHEDULE, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      
      // Configurações - leitura apenas
      { resource: RESOURCES.SETTINGS, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER] },
      
      // Autenticação - acesso pessoal
      { resource: RESOURCES.AUTH, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.AUTH_2FA, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.AUTH_NFC, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.AUTH_BIOMETRIC, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
    ],
  },
  {
    role: UserRole.EMPLOYEE,
    permissions: [
      // Funcionários - apenas próprio perfil
      { resource: RESOURCES.EMPLOYEE, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      
      // Registro de Ponto - apenas próprio
      { resource: RESOURCES.TIME_RECORD, action: ACTIONS.CREATE, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.TIME_RECORD, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      
      // Autenticação - acesso pessoal
      { resource: RESOURCES.AUTH, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.AUTH_2FA, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.AUTH_NFC, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
      { resource: RESOURCES.AUTH_BIOMETRIC, action: ACTIONS.READ, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
    ],
  },
];

/**
 * Verifica se um usuário tem permissão para uma ação específica
 */
export function hasPermission(userRole: UserRole, resource: string, action: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS.find(rp => rp.role === userRole);
  if (!rolePermissions) return false;

  const permission = rolePermissions.permissions.find(
    p => p.resource === resource && p.action === action
  );

  return !!permission;
}

/**
 * Verifica acesso com contexto adicional
 */
export function checkAccess(
  userRole: UserRole, 
  resource: string, 
  action: string, 
  context?: { userId?: string; targetUserId?: string; companyId?: string; targetCompanyId?: string }
): AccessControl {
  // Verifica permissão básica
  if (!hasPermission(userRole, resource, action)) {
    return {
      canAccess: false,
      reason: 'Permissão insuficiente para esta ação',
    };
  }

  // Verificações específicas por contexto
  if (context) {
    // EMPLOYEE só pode acessar seus próprios dados
    if (userRole === UserRole.EMPLOYEE) {
      if (context.userId && context.targetUserId && context.userId !== context.targetUserId) {
        return {
          canAccess: false,
          reason: 'Funcionários só podem acessar seus próprios dados',
        };
      }
    }

    // Verificação de empresa (se aplicável)
    if (context.companyId && context.targetCompanyId && context.companyId !== context.targetCompanyId) {
      return {
        canAccess: false,
        reason: 'Acesso negado: dados de empresa diferente',
      };
    }
  }

  return { canAccess: true };
}

/**
 * Registra ação no log de auditoria
 */
export async function logAuditAction(
  userId: string,
  userEmail: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    // Temporariamente comentado até a migração ser aplicada
    // await prisma.auditLog.create({
    //   data: {
    //     userId,
    //     userEmail,
    //     action,
    //     resource,
    //     resourceId,
    //     details,
    //     ipAddress,
    //     userAgent,
    //     timestamp: new Date(),
    //   },
    // });
    console.log('Log de auditoria:', { userId, userEmail, action, resource, resourceId, details, ipAddress, userAgent });
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
  }
}

/**
 * Obtém logs de auditoria com filtros
 */
export async function getAuditLogs(
  filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<AuditLog[]> {
  try {
    const where: Record<string, any> = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.resource) where.resource = filters.resource;
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters?.startDate) where.timestamp.gte = filters.startDate;
      if (filters?.endDate) where.timestamp.lte = filters.endDate;
    }

    // Temporariamente comentado até a migração ser aplicada
    // const logs = await prisma.auditLog.findMany({
    //   where,
    //   orderBy: { timestamp: 'desc' },
    //   take: filters?.limit || 100,
    // });

    // return logs.map((log: any) => ({
    //   id: log.id,
    //   userId: log.userId,
    //   userEmail: log.userEmail,
    //   action: log.action,
    //   resource: log.resource,
    //   resourceId: log.resourceId || undefined,
    //   details: log.details || undefined,
    //   ipAddress: log.ipAddress || undefined,
    //   userAgent: log.userAgent || undefined,
    //   timestamp: log.timestamp,
    // }));

        // Retorno temporário até a migração ser aplicada
    return [];
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return [];
  }
}

/**
 * Obtém informações da sessão atual
 */
export async function getSessionInfo(sessionId: string): Promise<SessionInfo | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            companyId: true,
          },
        },
      },
    });

    if (!session) return null;

    return {
      id: session.id,
      userId: session.userId,
      userEmail: session.user.email,
      role: session.user.role,
      companyId: session.user.companyId || undefined,
      lastActivity: session.expires, // Usando expires como lastActivity
      expiresAt: session.expires,
      isActive: new Date() < session.expires,
    };
  } catch (error) {
    console.error('Erro ao obter informações da sessão:', error);
    return null;
  }
}

/**
 * Atualiza atividade da sessão
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  try {
    // Como o modelo Session não tem updatedAt, vamos apenas verificar se a sessão existe
    await prisma.session.findUnique({
      where: { id: sessionId },
    });
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
  }
}

/**
 * Invalida sessão
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  } catch (error) {
    console.error('Erro ao invalidar sessão:', error);
  }
} 