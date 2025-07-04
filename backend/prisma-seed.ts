import { DataSource } from 'typeorm';
import { User, UserRole } from './src/entities/user.entity';
import { Company } from './src/entities/company.entity';
import { Employee } from './src/entities/employee.entity';
import { TimeRecord } from './src/entities/time-record.entity';
import { Account } from './src/entities/account.entity';
import { Session } from './src/entities/session.entity';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Company, Employee, TimeRecord, Account, Session],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  const adminExists = await userRepo.findOne({ where: { email: 'admin@admin.com' } });
  if (!adminExists) {
    const admin = userRepo.create({
      name: 'Admin',
      email: 'admin@admin.com',
      password: await bcrypt.hash('admin', 10),
      role: UserRole.ADMIN,
    });
    await userRepo.save(admin);
    console.log('Usuário admin criado');
  } else {
    console.log('Usuário admin já existe');
  }

  const userExists = await userRepo.findOne({ where: { email: 'user@user.com' } });
  if (!userExists) {
    const user = userRepo.create({
      name: 'Usuário',
      email: 'user@user.com',
      password: await bcrypt.hash('user', 10),
      role: UserRole.EMPLOYEE,
    });
    await userRepo.save(user);
    console.log('Usuário comum criado');
  } else {
    console.log('Usuário comum já existe');
  }

  await AppDataSource.destroy();
}

seed().then(() => process.exit(0)); 