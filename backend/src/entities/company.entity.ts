import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Employee } from './employee.entity';
import { TimeRecord } from './time-record.entity';

export enum OperationType {
  PRESENCIAL = 'PRESENCIAL',
  HOME_OFFICE = 'HOME_OFFICE',
  HYBRID = 'HYBRID',
}

export enum Plan {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  PREMIUM = 'PREMIUM',
}

@Entity('Company')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  cnpj: string;

  @Column()
  address: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({
    type: 'enum',
    enum: OperationType,
    default: OperationType.PRESENCIAL,
  })
  operationType: OperationType;

  @Column()
  employeeCount: number;

  @Column({
    type: 'enum',
    enum: Plan,
    default: Plan.BASIC,
  })
  plan: Plan;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => User, user => user.company)
  users: User[];

  @OneToMany(() => Employee, employee => employee.company)
  employees: Employee[];

  @OneToMany(() => TimeRecord, timeRecord => timeRecord.company)
  timeRecords: TimeRecord[];
} 