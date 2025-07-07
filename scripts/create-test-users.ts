import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🔄 Criando usuários de teste...');

    // Hash da senha padrão
    const hashedPassword = await bcrypt.hash('123456', 12);

    // Usuário Administrador (email verificado para testes)
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ponto.com' },
      update: {},
      create: {
        email: 'admin@ponto.com',
        name: 'Administrador do Sistema',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(), // Verificado para facilitar testes
      },
    });

    // Usuário Gerente (email verificado para testes)
    const managerUser = await prisma.user.upsert({
      where: { email: 'gerente@ponto.com' },
      update: {},
      create: {
        email: 'gerente@ponto.com',
        name: 'João Silva - Gerente',
        password: hashedPassword,
        role: 'MANAGER',
        emailVerified: new Date(), // Verificado para facilitar testes
      },
    });

    // Usuário Funcionário (email verificado para testes)
    const employeeUser = await prisma.user.upsert({
      where: { email: 'funcionario@ponto.com' },
      update: {},
      create: {
        email: 'funcionario@ponto.com',
        name: 'Maria Santos - Funcionária',
        password: hashedPassword,
        role: 'EMPLOYEE',
        emailVerified: new Date(), // Verificado para facilitar testes
      },
    });

    console.log('✅ Usuários de teste criados com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Administrador:');
    console.log('   Email: admin@ponto.com');
    console.log('   Senha: 123456');
    console.log('   Role: ADMIN');
    console.log('');
    console.log('👔 Gerente:');
    console.log('   Email: gerente@ponto.com');
    console.log('   Senha: 123456');
    console.log('   Role: MANAGER');
    console.log('');
    console.log('👤 Funcionário:');
    console.log('   Email: funcionario@ponto.com');
    console.log('   Senha: 123456');
    console.log('   Role: EMPLOYEE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Use essas credenciais para testar o sistema de autenticação e controle de acesso.');

  } catch (error) {
    console.error('❌ Erro ao criar usuários de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o script
createTestUsers(); 