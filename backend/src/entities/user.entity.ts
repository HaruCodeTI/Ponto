import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';
import { Session } from './session.entity';
import { Company } from './company.entity';
import { Employee } from './employee.entity';
import { TimeRecord } from './time-record.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

@Entity('User')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  emailVerified: Date;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  companyId: string;

  // Relations
  @OneToMany(() => Account, account => account.user)
  accounts: Account[];

  @OneToMany(() => Session, session => session.user)
  sessions: Session[];

  @ManyToOne(() => Company, company => company.users)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToOne(() => Employee, employee => employee.user)
  employee: Employee;

  @OneToMany(() => TimeRecord, timeRecord => timeRecord.user)
  timeRecords: TimeRecord[];
} 