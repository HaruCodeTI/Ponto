import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@ponto.com';
  const user = await prisma.user.update({
    where: { email },
    data: { companyId: null },
  });
  console.log(`Vínculo de empresa removido para: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 