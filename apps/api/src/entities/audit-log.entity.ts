import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';

enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}
import { User } from './user.entity';

@Entity('audit_logs')
@Index(['userId', 'timestamp'])
@Index(['resourceType', 'resourceId'])
@Index(['action', 'timestamp'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'varchar', length: 50 })
  resourceType: string;

  @Column({ type: 'varchar', length: 50 })
  resourceId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: 'CASCADE' })
  user: User;
}
