// Temporariamente comentado para resolver erro de build
// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { 
//   createNotification, 
//   findNotifications 
// } from '@/lib/notifications';

// export async function POST(request: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user) {
//       return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
//     }

//     const body = await request.json();
//     const { 
//       companyId, 
//       userId, 
//       employeeId, 
//       type, 
//       title, 
//       message, 
//       priority, 
//       category, 
//       metadata, 
//       expiresAt 
//     } = body;

//     if (!companyId || !type || !title || !message || !priority || !category) {
//       return NextResponse.json(
//         { error: 'Dados obrigatórios não fornecidos' },
//         { status: 400 }
//       );
//     }

//     const notification = await createNotification({
//       companyId,
//       userId,
//       _employeeId: employeeId,
//       type,
//       title,
//       message,
//       priority,
//       category,
//       metadata,
//       expiresAt: expiresAt ? new Date(expiresAt) : undefined
//     });

//     return NextResponse.json(notification, { status: 201 });
//   } catch (error) {
//     console.error('Erro ao criar notificação:', error);
//     return NextResponse.json(
//       { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(request: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user) {
//       return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
//     }

//     const { searchParams } = new URL(request.url);
//     const companyId = searchParams.get('companyId');
//     const userId = searchParams.get('userId');
//     const employeeId = searchParams.get('employeeId');
//     const type = searchParams.get('type');
//     const priority = searchParams.get('priority');
//     const category = searchParams.get('category');
//     const isRead = searchParams.get('isRead');
//     const isArchived = searchParams.get('isArchived');
//     const page = parseInt(searchParams.get('page') || '1');
//     const limit = parseInt(searchParams.get('limit') || '50');

//     const filters: any = {};
//     if (companyId) filters.companyId = companyId;
//     if (userId) filters.userId = userId;
//     if (employeeId) filters.employeeId = employeeId;
//     if (type) filters.type = type;
//     if (priority) filters.priority = priority;
//     if (category) filters.category = category;
//     if (isRead !== null) filters.isRead = isRead === 'true';
//     if (isArchived !== null) filters.isArchived = isArchived === 'true';

//     const result = await findNotifications(filters, page, limit);

//     return NextResponse.json(result);
//   } catch (error) {
//     console.error('Erro ao buscar notificações:', error);
//     return NextResponse.json(
//       { error: 'Erro interno do servidor' },
//       { status: 500 }
//     );
//   }
// }

// Exportação temporária para evitar erro de módulo
export async function GET() {
  return new Response('API temporariamente indisponível', { status: 503 });
} 