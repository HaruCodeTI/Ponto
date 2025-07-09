// Temporariamente desabilitado para resolver problemas de build do Prisma

export async function GET() {
  return new Response('AI Insights API temporarily disabled', { status: 503 });
}

export async function POST() {
  return new Response('AI Insights API temporarily disabled', { status: 503 });
} 