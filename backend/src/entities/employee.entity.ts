import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Company } from './company.entity';
import { TimeRecord } from './time-record.entity';

export enum WorkSchedule {
  PRESENCIAL = 'PRESENCIAL',
  HOME_OFFICE = 'HOME_OFFICE',
  HYBRID = 'HYBRID',
}

@Entity('Employee')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  cpf: string;

  @Column()
  position: string;

  @Column({ type: 'float' })
  salary: number;

  @Column({
    type: 'enum',
    enum: WorkSchedule,
    default: WorkSchedule.PRESENCIAL,
  })
  workSchedule: WorkSchedule;

  @Column({ default: 15 })
  toleranceMinutes: number;

  @Column({ type: 'float', default: 0 })
  bankHours: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;

  @Column()
  companyId: string;

  // Relations
  @OneToOne(() => User, user => user.employee)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Company, company => company.employees)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => TimeRecord, timeRecord => timeRecord.employee)
  timeRecords: TimeRecord[];
} 