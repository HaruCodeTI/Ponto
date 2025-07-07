import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { hasPermission, checkAccess, logAuditAction } from './authorization';

// Helper para extrair IP do request
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

// Helper para extrair User-Agent do request
function getClientUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Middleware para verificar permissões básicas
 */
export async function requirePermission(
  request: NextRequest,
  resource: string,
  action: string
): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  if (!hasPermission(session.user.role, resource, action)) {
    // Log da tentativa de acesso negado
    await logAuditAction(
      session.user.id,
      session.user.email || 'unknown',
      'ACCESS_DENIED',
      resource,
      undefined,
      `Tentativa de acesso negado: ${action}`,
      getClientIP(request),
      getClientUserAgent(request)
    );

    return NextResponse.json({ 
      error: 'Permissão insuficiente para esta ação.' 
    }, { status: 403 });
  }

  return null; // Acesso permitido
}

/**
 * Middleware para verificar acesso com contexto
 */
export async function requireAccess(
  request: NextRequest,
  resource: string,
  action: string,
  context?: { userId?: string; targetUserId?: string; companyId?: string; targetCompanyId?: string }
): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const accessControl = checkAccess(session.user.role, resource, action, context);

  if (!accessControl.canAccess) {
    // Log da tentativa de acesso negado
    await logAuditAction(
      session.user.id,
      session.user.email || 'unknown',
      'ACCESS_DENIED',
      resource,
      context?.targetUserId,
      `Acesso negado: ${accessControl.reason}`,
      getClientIP(request),
      getClientUserAgent(request)
    );

    return NextResponse.json({ 
      error: accessControl.reason || 'Acesso negado.' 
    }, { status: 403 });
  }

  return null; // Acesso permitido
}

/**
 * Middleware para verificar role específica
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  if (!allowedRoles.includes(session.user.role)) {
    // Log da tentativa de acesso negado
    await logAuditAction(
      session.user.id,
      session.user.email || 'unknown',
      'ROLE_ACCESS_DENIED',
      'system',
      undefined,
      `Role insuficiente: ${session.user.role}, necessário: ${allowedRoles.join(', ')}`,
      getClientIP(request),
      getClientUserAgent(request)
    );

    return NextResponse.json({ 
      error: 'Role insuficiente para esta ação.' 
    }, { status: 403 });
  }

  return null; // Acesso permitido
}

/**
 * Middleware para verificar se é o próprio usuário ou admin/manager
 */
export async function requireSelfOrManager(
  request: NextRequest,
  targetUserId: string
): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  // Admin e Manager podem acessar qualquer usuário
  if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') {
    return null;
  }

  // Employee só pode acessar seus próprios dados
  if (session.user.id !== targetUserId) {
    await logAuditAction(
      session.user.id,
      session.user.email || 'unknown',
      'SELF_ACCESS_DENIED',
      'user',
      targetUserId,
      'Tentativa de acessar dados de outro usuário',
      getClientIP(request),
      getClientUserAgent(request)
    );

    return NextResponse.json({ 
      error: 'Você só pode acessar seus próprios dados.' 
    }, { status: 403 });
  }

  return null; // Acesso permitido
}

/**
 * Middleware para verificar se pertence à mesma empresa
 */
export async function requireSameCompany(
  request: NextRequest,
  targetCompanyId: string
): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  // Admin pode acessar qualquer empresa
  if (session.user.role === 'ADMIN') {
    return null;
  }

  // Verificar se pertence à mesma empresa
  if (session.user.companyId !== targetCompanyId) {
    await logAuditAction(
      session.user.id,
      session.user.email || 'unknown',
      'COMPANY_ACCESS_DENIED',
      'company',
      targetCompanyId,
      'Tentativa de acessar dados de empresa diferente',
      getClientIP(request),
      getClientUserAgent(request)
    );

    return NextResponse.json({ 
      error: 'Acesso negado: dados de empresa diferente.' 
    }, { status: 403 });
  }

  return null; // Acesso permitido
} 