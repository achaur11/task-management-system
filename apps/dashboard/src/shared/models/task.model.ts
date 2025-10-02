export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  orgId: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
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

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
}

export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'updatedAt' | 'title' | 'status';
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedTasks {
  data: Task[];
  page: number;
  pageSize: number;
  total: number;
}
