import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ApiService } from '../../../shared/services/api.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Task, TaskStatus, TaskCategory, CreateTaskRequest, UpdateTaskRequest, TaskFilters } from '../../../shared/models/task.model';
import { UiButtonComponent } from '../../../shared/ui/components/ui-button/ui-button.component';
import { UiBadgeComponent } from '../../../shared/ui/components/ui-badge/ui-badge.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UiButtonComponent,
    UiBadgeComponent
  ],
  template: `
    <div class="notion-page">
      <!-- Page Header -->
      <div class="notion-card-header">
        <div class="notion-flex notion-items-center notion-justify-between">
          <div>
            <h1 class="text-3xl font-semibold mb-2">Tasks</h1>
            <p class="notion-text-muted">
              Manage your organization's tasks and stay organized
            </p>
          </div>
          <app-ui-button
            (click)="openCreateModal()"
            class="notion-btn-primary"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Task
          </app-ui-button>
        </div>
      </div>

      <!-- Filters -->
      <div class="notion-card notion-mb-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">
              Search
            </label>
            <input
              type="text"
              [(ngModel)]="filters.q"
              placeholder="Search tasks..."
              class="notion-input"
              (keyup.enter)="loadTasks()"
            />
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              [(ngModel)]="filters.status"
              class="notion-select"
              (change)="loadTasks()"
            >
              <option value="">All Statuses</option>
              <option value="Backlog">Backlog</option>
              <option value="InProgress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <!-- Category Filter -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              [(ngModel)]="filters.category"
              class="notion-select"
              (change)="loadTasks()"
            >
              <option value="">All Categories</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Learning">Learning</option>
            </select>
          </div>
        </div>

        <div class="notion-flex notion-items-center notion-justify-between notion-mt-4">
          <app-ui-button
            (click)="loadTasks()"
            class="notion-btn-secondary"
          >
            Apply Filters
          </app-ui-button>
          
          <div class="notion-text-small notion-text-muted">
            {{ paginatedTasks()?.total || 0 }} tasks found
          </div>
        </div>
      </div>

      <!-- Tasks Table -->
      <div class="notion-card">
        <div class="overflow-x-auto">
          <table class="notion-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Category</th>
                <th>Updated</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let task of (paginatedTasks()?.data || [])">
                <td>
                  <div>
                    <div class="font-medium mb-1">
                      {{ task.title }}
                    </div>
                    <div *ngIf="task.description" class="notion-text-small notion-text-muted truncate max-w-xs">
                      {{ task.description }}
                    </div>
                  </div>
                </td>
                <td>
                  <app-ui-badge
                    [variant]="getStatusVariant(task.status)"
                    size="sm"
                  >
                    {{ task.status }}
                  </app-ui-badge>
                </td>
                <td class="notion-text-small notion-text-muted">
                  {{ task.category }}
                </td>
                <td class="notion-text-small notion-text-muted">
                  {{ formatDate(task.updatedAt) }}
                </td>
                <td class="text-right">
                  <div class="notion-flex notion-justify-end notion-gap-2">
                    <button
                      (click)="editTask(task)"
                      class="notion-btn-ghost notion-btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      (click)="deleteTask(task)"
                      class="notion-btn-danger notion-btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state -->
        <div *ngIf="!paginatedTasks()?.data || !paginatedTasks()?.data?.length" class="notion-empty">
          <div class="notion-empty-icon">
            <svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 class="notion-empty-title">No tasks yet</h3>
          <p class="notion-empty-description">Get started by creating your first task</p>
          <app-ui-button
            (click)="openCreateModal()"
            class="notion-btn-primary"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Task
          </app-ui-button>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="paginatedTasks()?.total && paginatedTasks()!.total > 0" class="notion-flex notion-items-center notion-justify-between notion-mt-4">
        <div class="notion-text-small notion-text-muted">
          Showing {{ ((paginatedTasks()!.page - 1) * paginatedTasks()!.pageSize) + 1 }} to 
          {{ Math.min(paginatedTasks()!.page * paginatedTasks()!.pageSize, paginatedTasks()!.total) }} of 
          {{ paginatedTasks()!.total }} results
        </div>
        <div class="notion-flex notion-gap-2">
          <app-ui-button
            (click)="previousPage()"
            class="notion-btn-secondary"
            [disabled]="filters.page === 1"
          >
            Previous
          </app-ui-button>
          <app-ui-button
            (click)="nextPage()"
            class="notion-btn-secondary"
            [disabled]="!this.filters?.page || !this.filters?.pageSize || ((this.filters.page! * this.filters.pageSize!) >= (paginatedTasks()?.total || 0))"
          >
            Next
          </app-ui-button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Task Modal -->
    <div *ngIf="showModal()" class="notion-modal-overlay" (click)="closeModal()">
      <div class="notion-modal" (click)="$event.stopPropagation()">
        <div class="notion-modal-header">
          <h3 class="text-lg font-semibold">{{ editingTask() ? 'Edit Task' : 'Create Task' }}</h3>
        </div>
        <div class="notion-modal-body">
          <form [formGroup]="taskForm" (ngSubmit)="saveTask()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                formControlName="title"
                placeholder="Enter task title"
                class="notion-input"
                [class.border-red-500]="taskForm.get('title')?.invalid && taskForm.get('title')?.touched"
              />
              <p *ngIf="taskForm.get('title')?.invalid && taskForm.get('title')?.touched" class="mt-1 text-sm text-red-600">
                Title is required
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                formControlName="description"
                placeholder="Enter task description"
                rows="3"
                class="notion-textarea"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">
                  Status
                </label>
                <select formControlName="status" class="notion-select">
                  <option value="Backlog">Backlog</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">
                  Category
                </label>
                <select formControlName="category" class="notion-select">
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Learning">Learning</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="notion-modal-footer">
          <app-ui-button
            type="button"
            class="notion-btn-secondary"
            (click)="closeModal()"
          >
            Cancel
          </app-ui-button>
          <app-ui-button
            type="submit"
            class="notion-btn-primary"
            [loading]="isSaving()"
            [disabled]="taskForm.invalid || isSaving()"
            (click)="saveTask()"
          >
            {{ editingTask() ? 'Update' : 'Create' }}
          </app-ui-button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TasksComponent {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Signals for reactive state
  paginatedTasks = signal<any>({
    data: [],
    page: 1,
    pageSize: 20,
    total: 0
  });
  showModal = signal(false);
  editingTask = signal<Task | null>(null);
  isSaving = signal(false);

  // Filters
  filters: TaskFilters = {
    page: 1,
    pageSize: 20,
    sortBy: 'updatedAt',
    sortDir: 'desc'
  };

  private fb = inject(FormBuilder);

  // Form
  taskForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    status: ['Backlog'],
    category: ['Work']
  });

  // Computed properties
  Math = Math; // Make Math available in template

  constructor() {
    this.loadTasks();
  }

  async loadTasks(): Promise<void> {
    try {
      const response = await this.apiService.getTasks(this.filters).toPromise();
      console.log('🔍 Tasks API Response:', response);
      console.log('🔍 Tasks API Response data:', response?.data);
      // Ensure we have a valid response with data array
      if (response && Array.isArray(response.data)) {
        this.paginatedTasks.set(response);
      } else {
        console.warn('Invalid response structure:', response);
        this.paginatedTasks.set({
          data: [],
          page: 1,
          pageSize: 20,
          total: 0
        });
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.toastService.error('Failed to load tasks');
      // Set empty state on error
      this.paginatedTasks.set({
        data: [],
        page: 1,
        pageSize: 20,
        total: 0
      });
    }
  }

  openCreateModal(): void {
    this.editingTask.set(null);
    this.taskForm.reset({
      title: '',
      description: '',
      status: 'Backlog',
      category: 'Work'
    });
    this.showModal.set(true);
  }

  editTask(task: Task): void {
    this.editingTask.set(task);
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      status: task.status,
      category: task.category
    });
    this.showModal.set(true);
  }

  async saveTask(): Promise<void> {
    if (this.taskForm.invalid) return;

    this.isSaving.set(true);

    try {
      const taskData = this.taskForm.value;
      const updateData: UpdateTaskRequest = {
        title: taskData.title || undefined,
        description: taskData.description || undefined,
        status: taskData.status as TaskStatus || undefined,
        category: taskData.category as TaskCategory || undefined
      };
      
      if (this.editingTask()) {
        await this.apiService.updateTask(this.editingTask()!.id, updateData).toPromise();
        this.toastService.success('Task updated successfully');
      } else {
        await this.apiService.createTask(taskData as CreateTaskRequest).toPromise();
        this.toastService.success('Task created successfully');
      }

      this.closeModal();
      this.loadTasks();
    } catch (error) {
      this.toastService.error('Failed to save task');
      console.error('Error saving task:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteTask(task: Task): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    try {
      await this.apiService.deleteTask(task.id).toPromise();
      this.toastService.success('Task deleted successfully');
      this.loadTasks();
    } catch (error) {
      this.toastService.error('Failed to delete task');
      console.error('Error deleting task:', error);
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingTask.set(null);
    this.taskForm.reset();
  }

  getStatusVariant(status: TaskStatus): 'default' | 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case TaskStatus.Done:
        return 'success';
      case TaskStatus.InProgress:
        return 'warning';
      case TaskStatus.Backlog:
        return 'info';
      default:
        return 'default';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  previousPage(): void {
    if (this.filters?.page && this.filters?.page > 1) {
      this.filters.page--;
      this.loadTasks();
    }
  }

  nextPage(): void {
    const total = this.paginatedTasks()?.total || 0;
    if ((this.filters?.page && this.filters?.pageSize) && ((this.filters.page! * this.filters.pageSize!) < total)) {
      this.filters.page++;
      this.loadTasks();
    }
  }
}
