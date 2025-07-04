import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('Account')
export class Account {
  @PrimaryColumn()
  id: string;

  @Column()
  userId: string;

  @Column()
  type: string;

  @Column()
  provider: string;

  @Column()
  providerAccountId: string;

  @Column({ type: 'text', nullable: true })
  refresh_token: string;

  @Column({ type: 'text', nullable: true })
  access_token: string;

  @Column({ nullable: true })
  expires_at: number;

  @Column({ nullable: true })
  token_type: string;

  @Column({ nullable: true })
  scope: string;

  @Column({ type: 'text', nullable: true })
  id_token: string;

  @Column({ nullable: true })
  session_state: string;

  // Relations
  @ManyToOne(() => User, user => user.accounts)
  @JoinColumn({ name: 'userId' })
  user: User;
} 