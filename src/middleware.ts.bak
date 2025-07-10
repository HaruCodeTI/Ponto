import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware para capturar logs de auditoria
 * Executa em todas as requisições
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Captura informações da requisição
  const url = request.url;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Log de auditoria para rotas sensíveis
  if (shouldLogRequest(url, method)) {
    // Em produção, enviaria para API de logs
    console.log('🔍 AUDIT LOG:', {
      timestamp: new Date().toISOString(),
      url,
      method,
      ip,
      userAgent: userAgent.substring(0, 100), // Limita tamanho
      duration: Date.now() - startTime,
    });
  }
  
  return NextResponse.next();
}

/**
 * Verifica se a requisição deve ser logada
 */
function shouldLogRequest(url: string, method: string): boolean {
  const sensitivePaths = [
    '/api/auth',
    '/api/time-record',
    '/api/employee',
    '/api/company',
    '/api/audit-logs',
    '/bater-ponto',
    '/bater-ponto-mobile',
    '/funcionarios',
    '/empresa',
  ];
  
  const sensitiveMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  // Loga rotas sensíveis
  const isSensitivePath = sensitivePaths.some(path => url.includes(path));
  
  // Loga métodos que modificam dados
  const isSensitiveMethod = sensitiveMethods.includes(method);
  
  return isSensitivePath || isSensitiveMethod;
}

/**
 * Configuração do middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 