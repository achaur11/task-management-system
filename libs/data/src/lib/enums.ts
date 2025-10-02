export enum Role {
  Owner = 'Owner',
  Admin = 'Admin',
  Viewer = 'Viewer',
}

export enum TaskStatus {
  Backlog = 'Backlog',
  InProgress = 'InProgress',
  Done = 'Done',
}

export enum TaskCategory {
  Work = 'Work',
  Personal = 'Personal',
  Learning = 'Learning',
}

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}
