// Temporariamente desabilitado para resolver problemas de build do Prisma

export async function POST() {
  return new Response('AI Models Predict API temporarily disabled', { status: 503 });
} 