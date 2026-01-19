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
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity('organizations')
@Unique(['parentOrgId', 'name'])
@Index(['parentOrgId', 'name'])
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  parentOrgId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization, (org) => org.children, { nullable: true })
  parent?: Organization;

  @OneToMany(() => Organization, (org) => org.parent)
  children: Organization[];

  @OneToMany(() => User, (user) => user.org)
  users: User[];

  @OneToMany(() => Task, (task) => task.org)
  tasks: Task[];
}
