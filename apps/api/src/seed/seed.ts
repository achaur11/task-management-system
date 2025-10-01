import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit-log.entity';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const orgRepo = dataSource.getRepository(Organization);
  const userRepo = dataSource.getRepository(User);
  const taskRepo = dataSource.getRepository(Task);
  const auditRepo = dataSource.getRepository(AuditLog);

  // Create parent organization
  const parentOrg = orgRepo.create({
    name: 'Acme Corp',
    parentOrgId: null,
  });
  await orgRepo.save(parentOrg);

  // Create child organizations
  const engineeringOrg = orgRepo.create({
    name: 'Engineering',
    parentOrgId: parentOrg.id,
  });
  await orgRepo.save(engineeringOrg);

  const marketingOrg = orgRepo.create({
    name: 'Marketing',
    parentOrgId: parentOrg.id,
  });
  await orgRepo.save(marketingOrg);

  // Create users
  const users = [
    {
      email: 'john.doe@acme.com',
      displayName: 'John Doe',
      orgId: engineeringOrg.id,
      role: 'Owner' as any,
      password: 'password123',
    },
    {
      email: 'jane.smith@acme.com',
      displayName: 'Jane Smith',
      orgId: engineeringOrg.id,
      role: 'Admin' as any,
      password: 'password123',
    },
    {
      email: 'bob.wilson@acme.com',
      displayName: 'Bob Wilson',
      orgId: marketingOrg.id,
      role: 'Viewer' as any,
      password: 'password123',
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = userRepo.create({
      ...userData,
      passwordHash: hashedPassword,
    });
    const savedUser = await userRepo.save(user);
    createdUsers.push(savedUser);
  }

  // Create tasks (only for child orgs)
  const tasks = [
    {
      title: 'Implement user authentication',
      description: 'Set up JWT-based authentication system',
      status: 'InProgress' as any,
      category: 'Work' as any,
      orgId: engineeringOrg.id,
      createdByUserId: createdUsers[0].id,
    },
    {
      title: 'Design landing page',
      description: 'Create wireframes for the new landing page',
      status: 'Backlog' as any,
      category: 'Work' as any,
      orgId: marketingOrg.id,
      createdByUserId: createdUsers[2].id,
    },
    {
      title: 'Write API documentation',
      description: 'Document all REST endpoints',
      status: 'Done' as any,
      category: 'Work' as any,
      orgId: engineeringOrg.id,
      createdByUserId: createdUsers[1].id,
    },
    {
      title: 'Plan Q1 marketing campaign',
      description: 'Outline strategy for Q1 2024 marketing push',
      status: 'InProgress' as any,
      category: 'Work' as any,
      orgId: marketingOrg.id,
      createdByUserId: createdUsers[2].id,
    },
  ];

  for (const taskData of tasks) {
    const task = taskRepo.create(taskData);
    await taskRepo.save(task);
  }

  // Create audit logs
  const auditLogs = [
    {
      userId: createdUsers[0].id,
      action: 'CREATE' as any,
      resourceType: 'Task',
      resourceId: 'task-1',
      metadata: { title: 'Implement user authentication' },
    },
    {
      userId: createdUsers[1].id,
      action: 'UPDATE' as any,
      resourceType: 'Task',
      resourceId: 'task-3',
      metadata: { status: 'Done' },
    },
    {
      userId: createdUsers[2].id,
      action: 'READ' as any,
      resourceType: 'Organization',
      resourceId: marketingOrg.id,
      metadata: { name: 'Marketing' },
    },
  ];

  for (const auditData of auditLogs) {
    const audit = auditRepo.create(auditData);
    await auditRepo.save(audit);
  }

  console.log('Database seeded successfully!');
  console.log(`Created ${await orgRepo.count()} organizations`);
  console.log(`Created ${await userRepo.count()} users`);
  console.log(`Created ${await taskRepo.count()} tasks`);
  console.log(`Created ${await auditRepo.count()} audit logs`);
}
