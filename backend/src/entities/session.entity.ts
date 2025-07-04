import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('Session')
export class Session {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  sessionToken: string;

  @Column()
  userId: string;

  @Column()
  expires: Date;

  // Relations
  @ManyToOne(() => User, user => user.sessions)
  @JoinColumn({ name: 'userId' })
  user: User;
} 