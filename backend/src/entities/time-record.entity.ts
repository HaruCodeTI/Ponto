import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Employee } from './employee.entity';
import { Company } from './company.entity';

export enum RecordType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  BREAK_START = 'BREAK_START',
  BREAK_END = 'BREAK_END',
}

@Entity('TimeRecord')
export class TimeRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RecordType,
  })
  type: RecordType;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  deviceInfo: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  nfcTag: string;

  @Column({ unique: true })
  hash: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  userId: string;

  @Column()
  employeeId: string;

  @Column()
  companyId: string;

  // Relations
  @ManyToOne(() => User, user => user.timeRecords)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Employee, employee => employee.timeRecords)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @ManyToOne(() => Company, company => company.timeRecords)
  @JoinColumn({ name: 'companyId' })
  company: Company;
} 