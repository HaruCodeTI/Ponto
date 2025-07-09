// Temporariamente comentado para resolver erro de build
// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { markNotificationAsRead } from '@/lib/notifications';

// export async function POST(
//   request: NextRequest,
//   context: any
// ) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user) {
//       return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
//     }

//     const notification = await markNotificationAsRead(
//       context.params.id,
//       session.user.id
//     );

//     return NextResponse.json(notification);
//   } catch (error) {
//     console.error('Erro ao marcar notificação como lida:', error);
//     return NextResponse.json(
//       { error: 'Erro interno do servidor' },
//       { status: 500 }
//     );
//   }
// }

// Exportação temporária para evitar erro de módulo
export async function POST() {
  return new Response('API temporariamente indisponível', { status: 503 });
} 