import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TaskStatus, TaskCategory } from 'data';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('tasks')
@Index(['title'])
@Index(['orgId', 'status'])
@Index(['orgId', 'updatedAt'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    enum: TaskStatus, 
    default: TaskStatus.Backlog 
  })
  status: TaskStatus;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    enum: TaskCategory, 
    default: TaskCategory.Work 
  })
  category: TaskCategory;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @Column({ type: 'uuid' })
  orgId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization, (org) => org.tasks, { onDelete: 'CASCADE' })
  org: Organization;

  @ManyToOne(() => User, (user) => user.createdTasks, { 
    nullable: true,
    onDelete: 'SET NULL' 
  })
  creator: User | null;
}
