import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

import { Role } from 'data';
import { Organization } from './organization.entity';
import { Task } from './task.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
@Unique(['email'])
@Index(['email'])
@Index(['orgId', 'role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  displayName: string;

  @Column({ type: 'uuid' })
  orgId: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization, (org) => org.users, { onDelete: 'CASCADE' })
  org: Organization;

  @OneToMany(() => Task, (task) => task.creator)
  createdTasks: Task[];

  @OneToMany(() => AuditLog, (audit) => audit.user)
  auditLogs: AuditLog[];
}
